import m from "mithril";
import { dateStringFromDate, PAYDOWN_METHODS } from "../paydownData.js";
import { Selectors } from "../selectors.js";

function createLoanForm() {
  return {
    name: "",
    provider: "",
    apr: "",
    minPayment: ""
  };
}

function createSnapshotForm(accountId = "") {
  return {
    accountId,
    date: dateStringFromDate(new Date()),
    balance: ""
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
  notice: null,
  forms: {
    loan: createLoanForm(),
    snapshot: createSnapshotForm(),
    extraPayment: createDatedAmountForm(),
    snowballAdjustment: createDatedAmountForm()
  },
  editing: {
    loanId: null,
    snapshotId: null,
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
    editingKey: "snapshotId",
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

function normalizeErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

function pickDefaultAccountId(loans) {
  return loans.length > 0 ? String(loans[0].id) : "";
}

/**
 * @param {import("../types").State} state
 * @returns
 */
const Actions = (state) => {
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

  function syncFormsWithLoans() {
    const defaultAccountId = pickDefaultAccountId(state.loans);
    const snapshotAccountId = String(state.forms.snapshot.accountId || "");

    if (!snapshotAccountId || !state.loans.some(loan => String(loan.id) === snapshotAccountId)) {
      state.forms.snapshot.accountId = defaultAccountId;
    }
  }

  function resetForm(resourceKey) {
    const { formKey, resetForm: getInitialForm } = RESOURCE_CONFIG[resourceKey];
    const initialForm = getInitialForm();

    state.forms[formKey] = formKey === "snapshot"
      ? {
        ...initialForm,
        accountId: pickDefaultAccountId(state.loans)
      }
      : initialForm;

    state.formErrors[formKey] = null;
  }

  function beginEdit(resourceKey, record) {
    clearNotice();
    const config = RESOURCE_CONFIG[resourceKey];
    state.formErrors[config.formKey] = null;
    state.editing[config.editingKey] = record.id;

    switch (resourceKey) {
      case "loans":
        state.forms.loan = {
          name: record.name ?? "",
          provider: record.provider ?? "",
          apr: String(record.apr ?? ""),
          minPayment: String(record.minPayment ?? "")
        };
        break;
      case "snapshots":
        state.forms.snapshot = {
          accountId: String(record.accountId ?? ""),
          date: dateStringFromDate(new Date(record.date)),
          balance: String(record.balance ?? "")
        };
        break;
      case "extraPayments":
        state.forms.extraPayment = {
          date: dateStringFromDate(new Date(record.date)),
          amount: String(record.amount ?? "")
        };
        break;
      case "snowballAdjustments":
        state.forms.snowballAdjustment = {
          date: dateStringFromDate(new Date(record.date)),
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
      state[resourceKey] = Array.isArray(data) ? data : [];

      if (resourceKey === "loans") {
        syncFormsWithLoans();
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
    const balance = Number(state.forms.snapshot.balance);

    if (!state.forms.snapshot.accountId) {
      return "Choose an account before saving a snapshot.";
    }

    if (!state.forms.snapshot.date) {
      return "Snapshot date is required.";
    }

    if (!Number.isFinite(balance) || balance < 0) {
      return "Balance must be 0 or greater.";
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
    return new Date(`${dateString}T00:00:00`).getTime();
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
      case "snapshots":
        return {
          accountId: Number(state.forms.snapshot.accountId),
          date: toTimestamp(state.forms.snapshot.date),
          balance: Number(state.forms.snapshot.balance)
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
    setSnowball: (value) => {
      state.snowball = Number.isFinite(value) ? value : 0;
    },
    setPaydownMethod: (value) => {
      if (Object.values(PAYDOWN_METHODS).includes(value)) {
        state.paydownMethod = value;
      }
    },
    updateForm: (formKey, field, value) => {
      state.forms[formKey][field] = value;
      state.formErrors[formKey] = null;
    },
    beginEditLoan: (loan) => beginEdit("loans", loan),
    beginEditSnapshot: (snapshot) => beginEdit("snapshots", snapshot),
    beginEditExtraPayment: (extraPayment) => beginEdit("extraPayments", extraPayment),
    beginEditSnowballAdjustment: (snowballAdjustment) => beginEdit("snowballAdjustments", snowballAdjustment),
    cancelLoanEdit: () => cancelEdit("loans"),
    cancelSnapshotEdit: () => cancelEdit("snapshots"),
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

      await submitResource("snapshots", {
        created: "Snapshot saved.",
        updated: "Snapshot updated."
      });
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
