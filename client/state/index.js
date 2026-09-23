import m from "mithril";
import { dateFromString, dateStringFromDate, PAYDOWN_METHODS } from "../paydownData.js";
import { Selectors } from "../selectors.js";

function createLoanForm() {
  return {
    name: "",
    provider: "",
    apr: "",
    minPayment: ""
  };
}

function createSnapshotForm(loans = [], date = dateStringFromDate(new Date())) {
  return {
    date,
    balances: loans.reduce((acc, loan) => {
      acc[String(loan.id)] = "";
      return acc;
    }, {})
  };
}

function createDatedAmountForm() {
  return {
    date: dateStringFromDate(new Date()),
    amount: ""
  };
}

/**
 * @returns {import("../types").State}
 */
const State = () => ({
  activeView: "planner",
  snowball: 0,
  paydownMethod: PAYDOWN_METHODS.snowball,
  loans: [],
  snapshots: [],
  extraPayments: [],
  snowballAdjustments: [],
  loading: {
    initialize: false,
    loans: false,
    snapshots: false,
    extraPayments: false,
    snowballAdjustments: false
  },
  mutations: {
    loans: false,
    snapshots: false,
    extraPayments: false,
    snowballAdjustments: false
  },
  errors: {
    initialize: null,
    loans: null,
    snapshots: null,
    extraPayments: null,
    snowballAdjustments: null
  },
  formErrors: {
    loan: null,
    snapshot: null,
    extraPayment: null,
    snowballAdjustment: null
  },
  deletePrompt: null,
  pendingDelete: null,
  notice: null,
  accountEditorVisible: false,
  snapshotEditorVisible: false,
  plannerChartMode: "projection",
  plannerDetailsExpanded: false,
  forms: {
    loan: createLoanForm(),
    snapshot: createSnapshotForm(),
    extraPayment: createDatedAmountForm(),
    snowballAdjustment: createDatedAmountForm()
  },
  editing: {
    loanId: null,
    snapshotBatchDate: null,
    extraPaymentId: null,
    snowballAdjustmentId: null
  }
});

const RESOURCE_CONFIG = {
  loans: {
    endpoint: "/api/v1/loans",
    formKey: "loan",
    editingKey: "loanId",
    resetForm: createLoanForm
  },
  snapshots: {
    endpoint: "/api/v1/snapshots",
    formKey: "snapshot",
    editingKey: "snapshotBatchDate",
    resetForm: createSnapshotForm
  },
  extraPayments: {
    endpoint: "/api/v1/extra-payments",
    formKey: "extraPayment",
    editingKey: "extraPaymentId",
    resetForm: createDatedAmountForm
  },
  snowballAdjustments: {
    endpoint: "/api/v1/snowball-adjustments",
    formKey: "snowballAdjustment",
    editingKey: "snowballAdjustmentId",
    resetForm: createDatedAmountForm
  }
};

const DELETE_UNDO_DELAY_MS = 5000;

function normalizeErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

function snapshotDateKey(dateValue) {
  return dateStringFromDate(dateFromString(dateValue));
}

/**
 * @param {import("../types").State} state
 * @returns
 */
const Actions = (state) => {
  let pendingDeleteTimer = null;

  async function requestJson(url, options = {}) {
    const requestOptions = {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    };

    const response = await fetch(url, requestOptions);
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new Error(payload?.msg || payload?.message || `Request failed: ${response.status}`);
    }

    return payload;
  }

  function setNotice(kind, message) {
    state.notice = {
      kind,
      message,
      timestamp: Date.now()
    };
  }

  function clearNotice() {
    state.notice = null;
  }

  function clearDeletePrompt() {
    state.deletePrompt = null;
  }

  function clearPendingDelete() {
    if (pendingDeleteTimer) {
      clearTimeout(pendingDeleteTimer);
      pendingDeleteTimer = null;
    }

    state.pendingDelete = null;
  }

  function syncSnapshotFormWithLoans() {
    const nextBalances = state.loans.reduce((acc, loan) => {
      const loanId = String(loan.id);
      acc[loanId] = state.forms.snapshot.balances?.[loanId] ?? "";
      return acc;
    }, {});

    state.forms.snapshot = {
      date: state.forms.snapshot.date || dateStringFromDate(new Date()),
      balances: nextBalances
    };
  }

  function loadSnapshotBatch(dateString) {
    const balances = createSnapshotForm(state.loans, dateString).balances;

    for (const snapshot of state.snapshots) {
      if (snapshotDateKey(snapshot.date) !== dateString) {
        continue;
      }

      balances[String(snapshot.accountId)] = String(snapshot.balance);
    }

    state.forms.snapshot = {
      date: dateString,
      balances
    };
  }

  function resetForm(resourceKey) {
    const { formKey, resetForm: getInitialForm } = RESOURCE_CONFIG[resourceKey];
    const initialForm = formKey === "snapshot" ? getInitialForm(state.loans) : getInitialForm();

    state.forms[formKey] = initialForm;

    state.formErrors[formKey] = null;
  }

  function beginEdit(resourceKey, record) {
    clearNotice();
    if (state.deletePrompt?.resourceKey === resourceKey && state.deletePrompt.id === record.id) {
      clearDeletePrompt();
    }
    const config = RESOURCE_CONFIG[resourceKey];
    state.formErrors[config.formKey] = null;
    state.editing[config.editingKey] = record.id;

    switch (resourceKey) {
      case "loans":
        state.accountEditorVisible = true;
        state.forms.loan = {
          name: record.name ?? "",
          provider: record.provider ?? "",
          apr: String(record.apr ?? ""),
          minPayment: String(record.minPayment ?? "")
        };
        break;
      case "snapshots":
        loadSnapshotBatch(snapshotDateKey(record.date));
        state.editing.snapshotBatchDate = snapshotDateKey(record.date);
        break;
      case "extraPayments":
        state.forms.extraPayment = {
          date: dateStringFromDate(dateFromString(record.date)),
          amount: String(record.amount ?? "")
        };
        break;
      case "snowballAdjustments":
        state.forms.snowballAdjustment = {
          date: dateStringFromDate(dateFromString(record.date)),
          amount: String(record.amount ?? "")
        };
        break;
      default:
        break;
    }
  }

  function cancelEdit(resourceKey) {
    const config = RESOURCE_CONFIG[resourceKey];
    state.editing[config.editingKey] = null;
    resetForm(resourceKey);
    clearNotice();
  }

  async function fetchCollection(resourceKey) {
    const { endpoint } = RESOURCE_CONFIG[resourceKey];
    state.loading[resourceKey] = true;
    state.errors[resourceKey] = null;

    try {
      const data = await requestJson(endpoint);
      state[resourceKey] = Array.isArray(data)
        ? data.map(record => ({ ...record, ...(record.date !== undefined ? { date: dateFromString(record.date) } : {}) }))
        : [];

      if (resourceKey === "loans") {
        syncSnapshotFormWithLoans();
      }

      if (resourceKey === "snapshots") {
        if (state.editing.snapshotBatchDate) {
          loadSnapshotBatch(state.editing.snapshotBatchDate);
        } else {
          syncSnapshotFormWithLoans();
        }
      }

      return state[resourceKey];
    } catch (error) {
      state.errors[resourceKey] = normalizeErrorMessage(error, `Unable to load ${resourceKey}.`);
      return state[resourceKey];
    } finally {
      state.loading[resourceKey] = false;
      m.redraw();
    }
  }

  function validateLoanForm() {
    const apr = Number(state.forms.loan.apr);
    const minPayment = Number(state.forms.loan.minPayment);

    if (!state.forms.loan.name.trim()) {
      return "Account name is required.";
    }

    if (!Number.isFinite(apr) || apr < 0) {
      return "APR must be 0 or greater.";
    }

    if (!Number.isFinite(minPayment) || minPayment <= 0) {
      return "Minimum payment must be greater than 0.";
    }

    return null;
  }

  function validateSnapshotForm() {
    if (!state.forms.snapshot.date) {
      return "Snapshot date is required.";
    }

    let hasBalance = false;

    for (const loan of state.loans) {
      const value = String(state.forms.snapshot.balances?.[String(loan.id)] ?? "").trim();

      if (!value) {
        continue;
      }

      hasBalance = true;

      const balance = Number(value);

      if (!Number.isFinite(balance) || balance < 0) {
        return `Balance for ${loan.name} must be 0 or greater.`;
      }
    }

    if (!hasBalance) {
      return "Enter at least one balance before saving a snapshot batch.";
    }

    return null;
  }

  function validateDatedAmountForm(formKey, label) {
    const amount = Number(state.forms[formKey].amount);

    if (!state.forms[formKey].date) {
      return `${label} date is required.`;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      return `${label} amount must be 0 or greater.`;
    }

    return null;
  }

  function toTimestamp(dateString) {
    return dateString;
  }

  function buildPayload(resourceKey) {
    switch (resourceKey) {
      case "loans":
        return {
          name: state.forms.loan.name.trim(),
          provider: state.forms.loan.provider.trim(),
          apr: Number(state.forms.loan.apr),
          minPayment: Number(state.forms.loan.minPayment)
        };
      case "extraPayments":
        return {
          date: toTimestamp(state.forms.extraPayment.date),
          amount: Number(state.forms.extraPayment.amount)
        };
      case "snowballAdjustments":
        return {
          date: toTimestamp(state.forms.snowballAdjustment.date),
          amount: Number(state.forms.snowballAdjustment.amount)
        };
      default:
        return null;
    }
  }

  async function submitResource(resourceKey, successMessages) {
    const config = RESOURCE_CONFIG[resourceKey];
    const editingId = state.editing[config.editingKey];
    const isEditing = editingId !== null;
    const endpoint = isEditing ? `${config.endpoint}/${editingId}` : config.endpoint;
    const method = isEditing ? "PUT" : "POST";

    state.mutations[resourceKey] = true;
    state.formErrors[config.formKey] = null;
    state.errors[resourceKey] = null;

    try {
      await requestJson(endpoint, {
        method,
        body: buildPayload(resourceKey)
      });
      cancelEdit(resourceKey);
      await fetchCollection(resourceKey);
      setNotice("success", isEditing ? successMessages.updated : successMessages.created);
    } catch (error) {
      const message = normalizeErrorMessage(error, `Unable to save ${resourceKey}.`);
      state.formErrors[config.formKey] = message;
      setNotice("error", message);
    } finally {
      state.mutations[resourceKey] = false;
      m.redraw();
    }
  }

  function buildSnapshotBatchOperations() {
    const date = state.forms.snapshot.date;
    const timestamp = toTimestamp(date);
    const existingSnapshots = state.snapshots.filter(snapshot => snapshotDateKey(snapshot.date) === date);
    const existingByLoanId = new Map(
      existingSnapshots.map(snapshot => [String(snapshot.accountId), snapshot])
    );
    const creates = [];
    const updates = [];
    const deletes = [];

    for (const loan of state.loans) {
      const loanId = String(loan.id);
      const rawValue = String(state.forms.snapshot.balances?.[loanId] ?? "").trim();
      const existingSnapshot = existingByLoanId.get(loanId);

      if (!rawValue) {
        if (existingSnapshot) {
          deletes.push(existingSnapshot.id);
        }
        continue;
      }

      const balance = Number(rawValue);

      if (existingSnapshot) {
        if (existingSnapshot.balance !== balance) {
          updates.push({
            id: existingSnapshot.id,
            accountId: loan.id,
            date: timestamp,
            balance
          });
        }
        continue;
      }

      creates.push({
        accountId: loan.id,
        date: timestamp,
        balance
      });
    }

    return { creates, updates, deletes };
  }

  async function removeResource(resourceKey, id, successMessage) {
    const config = RESOURCE_CONFIG[resourceKey];
    state.mutations[resourceKey] = true;
    state.errors[resourceKey] = null;

    try {
      await requestJson(`${config.endpoint}/${id}`, { method: "DELETE" });
      if (state.editing[config.editingKey] === id) {
        cancelEdit(resourceKey);
      }
      await fetchCollection(resourceKey);
      setNotice("success", successMessage);
    } catch (error) {
      const message = normalizeErrorMessage(error, `Unable to delete ${resourceKey}.`);
      state.errors[resourceKey] = message;
      setNotice("error", message);
    } finally {
      state.mutations[resourceKey] = false;
      m.redraw();
    }
  }

  async function executeDelete(resourceKey, id, label) {
    clearPendingDelete();
    clearDeletePrompt();
    await removeResource(resourceKey, id, `${label} deleted.`);
  }

  function scheduleDelete(resourceKey, id, label) {
    clearDeletePrompt();
    clearPendingDelete();
    state.pendingDelete = {
      resourceKey,
      id,
      label,
      expiresAt: Date.now() + DELETE_UNDO_DELAY_MS
    };

    pendingDeleteTimer = setTimeout(() => {
      void executeDelete(resourceKey, id, label);
    }, DELETE_UNDO_DELAY_MS);
  }

  const actions = {
    initialize: async () => {
      state.loading.initialize = true;
      state.errors.initialize = null;

      try {
        await Promise.all([
          fetchCollection("loans"),
          fetchCollection("snapshots"),
          fetchCollection("extraPayments"),
          fetchCollection("snowballAdjustments")
        ]);
      } catch (error) {
        state.errors.initialize = normalizeErrorMessage(error, "Failed to initialize account data.");
      } finally {
        state.loading.initialize = false;
        m.redraw();
      }
    },
    fetchData: async () => Promise.all([
      fetchCollection("loans"),
      fetchCollection("snapshots"),
      fetchCollection("extraPayments"),
      fetchCollection("snowballAdjustments")
    ]),
    setActiveView: (view) => {
      state.activeView = view;
    },
    clearNotice,
    requestDelete: (resourceKey, id, label) => {
      if (
        state.pendingDelete &&
        (state.pendingDelete.resourceKey !== resourceKey || state.pendingDelete.id !== id)
      ) {
        setNotice("error", "Undo or finish the pending delete before removing another record.");
        return;
      }

      state.deletePrompt = { resourceKey, id, label };
      clearNotice();
    },
    cancelDeleteRequest: (resourceKey, id) => {
      if (!state.deletePrompt) {
        return;
      }

      if (
        state.deletePrompt.resourceKey === resourceKey &&
        state.deletePrompt.id === id
      ) {
        clearDeletePrompt();
      }
    },
    confirmDeleteRequest: (resourceKey, id) => {
      if (
        !state.deletePrompt ||
        state.deletePrompt.resourceKey !== resourceKey ||
        state.deletePrompt.id !== id
      ) {
        return;
      }

      scheduleDelete(resourceKey, id, state.deletePrompt.label);
    },
    undoPendingDelete: () => {
      if (!state.pendingDelete) {
        return;
      }

      const { label } = state.pendingDelete;
      clearPendingDelete();
      setNotice("success", `${label} kept.`);
    },
    commitPendingDeleteNow: async () => {
      if (!state.pendingDelete) {
        return;
      }

      const { resourceKey, id, label } = state.pendingDelete;
      await executeDelete(resourceKey, id, label);
    },
    setSnowball: (value) => {
      state.snowball = Number.isFinite(value) ? value : 0;
    },
    setPaydownMethod: (value) => {
      if (Object.values(PAYDOWN_METHODS).includes(value)) {
        state.paydownMethod = value;
      }
    },
    setPlannerChartMode: (value) => {
      if (value === "projection" || value === "progress") {
        state.plannerChartMode = value;
      }
    },
    setPlannerDetailsExpanded: (value) => {
      state.plannerDetailsExpanded = Boolean(value);
    },
    updateForm: (formKey, field, value) => {
      state.forms[formKey][field] = value;
      state.formErrors[formKey] = null;
    },
    updateSnapshotBatchDate: (value) => {
      state.forms.snapshot.date = value;
      state.formErrors.snapshot = null;
    },
    updateSnapshotBatchBalance: (loanId, value) => {
      state.forms.snapshot.balances[String(loanId)] = value;
      state.formErrors.snapshot = null;
    },
    showSnapshotEditor: () => {
      state.snapshotEditorVisible = true;
      state.formErrors.snapshot = null;
    },
    showAccountEditor: () => {
      state.accountEditorVisible = true;
      state.formErrors.loan = null;
    },
    hideAccountEditor: () => {
      state.accountEditorVisible = false;
      state.editing.loanId = null;
      resetForm("loans");
      clearNotice();
    },
    hideSnapshotEditor: () => {
      state.snapshotEditorVisible = false;
      state.editing.snapshotBatchDate = null;
      resetForm("snapshots");
      clearNotice();
    },
    beginEditLoan: (loan) => beginEdit("loans", loan),
    beginEditSnapshot: (snapshot) => beginEdit("snapshots", snapshot),
    beginSnapshotBatchEdit: (dateString) => {
      clearNotice();
      clearDeletePrompt();
      state.formErrors.snapshot = null;
      state.snapshotEditorVisible = true;
      state.editing.snapshotBatchDate = dateString;
      loadSnapshotBatch(dateString);
    },
    beginEditExtraPayment: (extraPayment) => beginEdit("extraPayments", extraPayment),
    beginEditSnowballAdjustment: (snowballAdjustment) => beginEdit("snowballAdjustments", snowballAdjustment),
    cancelLoanEdit: () => {
      state.accountEditorVisible = false;
      cancelEdit("loans");
    },
    cancelSnapshotEdit: () => {
      state.snapshotEditorVisible = false;
      cancelEdit("snapshots");
    },
    startNewLoan: () => {
      state.accountEditorVisible = true;
      state.editing.loanId = null;
      resetForm("loans");
      clearNotice();
    },
    startNewSnapshotBatch: () => {
      state.snapshotEditorVisible = true;
      state.editing.snapshotBatchDate = null;
      resetForm("snapshots");
      clearNotice();
    },
    cancelExtraPaymentEdit: () => cancelEdit("extraPayments"),
    cancelSnowballAdjustmentEdit: () => cancelEdit("snowballAdjustments"),
    saveLoan: async () => {
      const errorMessage = validateLoanForm();
      if (errorMessage) {
        state.formErrors.loan = errorMessage;
        setNotice("error", errorMessage);
        return;
      }

      await submitResource("loans", {
        created: "Account saved.",
        updated: "Account updated."
      });
    },
    saveSnapshot: async () => {
      const errorMessage = validateSnapshotForm();
      if (errorMessage) {
        state.formErrors.snapshot = errorMessage;
        setNotice("error", errorMessage);
        return;
      }
      state.mutations.snapshots = true;
      state.formErrors.snapshot = null;
      state.errors.snapshots = null;

      try {
        const { creates, updates, deletes } = buildSnapshotBatchOperations();
        const requests = [];

        if (creates.length > 0) {
          requests.push(requestJson("/api/v1/snapshots", {
            method: "POST",
            body: creates.length === 1 ? creates[0] : creates
          }));
        }

        for (const snapshot of updates) {
          requests.push(requestJson(`/api/v1/snapshots/${snapshot.id}`, {
            method: "PUT",
            body: {
              accountId: snapshot.accountId,
              date: snapshot.date,
              balance: snapshot.balance
            }
          }));
        }

        for (const snapshotId of deletes) {
          requests.push(requestJson(`/api/v1/snapshots/${snapshotId}`, {
            method: "DELETE"
          }));
        }

        if (requests.length === 0) {
          setNotice("success", "No snapshot changes to save.");
          return;
        }

        await Promise.all(requests);
        const savedDate = state.forms.snapshot.date;
        await fetchCollection("snapshots");
        state.snapshotEditorVisible = true;
        state.editing.snapshotBatchDate = savedDate;
        loadSnapshotBatch(savedDate);
        setNotice("success", `Snapshot batch for ${savedDate} saved.`);
      } catch (error) {
        const message = normalizeErrorMessage(error, "Unable to save snapshot batch.");
        state.formErrors.snapshot = message;
        state.errors.snapshots = message;
        setNotice("error", message);
      } finally {
        state.mutations.snapshots = false;
        m.redraw();
      }
    },
    saveExtraPayment: async () => {
      const errorMessage = validateDatedAmountForm("extraPayment", "Extra payment");
      if (errorMessage) {
        state.formErrors.extraPayment = errorMessage;
        setNotice("error", errorMessage);
        return;
      }

      await submitResource("extraPayments", {
        created: "Extra payment saved.",
        updated: "Extra payment updated."
      });
    },
    saveSnowballAdjustment: async () => {
      const errorMessage = validateDatedAmountForm("snowballAdjustment", "Snowball adjustment");
      if (errorMessage) {
        state.formErrors.snowballAdjustment = errorMessage;
        setNotice("error", errorMessage);
        return;
      }

      await submitResource("snowballAdjustments", {
        created: "Snowball adjustment saved.",
        updated: "Snowball adjustment updated."
      });
    },
    deleteLoan: async (id) => removeResource("loans", id, "Account deleted."),
    deleteSnapshot: async (id) => removeResource("snapshots", id, "Snapshot deleted."),
    deleteExtraPayment: async (id) => removeResource("extraPayments", id, "Extra payment deleted."),
    deleteSnowballAdjustment: async (id) => removeResource("snowballAdjustments", id, "Snowball adjustment deleted.")
  };

  return actions;
};

export const state = State();
export const actions = Actions(state);
export const selectors = Selectors(state);
