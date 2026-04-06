import m from "mithril";
import { currencyFormat, dateStringFromDate } from "../paydownData.js";
import { actions, state } from "../state/index.js";

function submit(event) {
  event.preventDefault();
  void actions.saveSnapshot();
}

function groupSnapshotsByDate(snapshots, accountLookup) {
  const groups = new Map();

  for (const snapshot of snapshots) {
    const date = dateStringFromDate(new Date(snapshot.date));

    if (!groups.has(date)) {
      groups.set(date, {
        date,
        count: 0,
        totalBalance: 0,
        entries: []
      });
    }

    const group = groups.get(date);
    group.count += 1;
    group.totalBalance += snapshot.balance;
    group.entries.push({
      ...snapshot,
      accountName: accountLookup.get(String(snapshot.accountId))?.name || `Account ${snapshot.accountId}`
    });
  }

  return Array.from(groups.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((group) => ({
      ...group,
      entries: group.entries.sort((a, b) => a.accountName.localeCompare(b.accountName))
    }));
}

function getBatchStatus(currentValue, hasExistingSnapshot) {
  const trimmedValue = String(currentValue ?? "").trim();

  if (!trimmedValue) {
    return hasExistingSnapshot ? "Will remove on save" : "No snapshot";
  }

  return hasExistingSnapshot ? "Saved for this date" : "New in this batch";
}

/** @type {m.Component} */
const SnapshotManager = {
  view: () => {
    const isEditorVisible = state.snapshotEditorVisible;
    const isEditingBatch = state.editing.snapshotBatchDate !== null;
    const accountLookup = new Map(state.loans.map((loan) => [String(loan.id), loan]));
    const snapshotGroups = groupSnapshotsByDate(state.snapshots, accountLookup);
    const currentBatchSnapshots = new Map(
      state.snapshots
        .filter((snapshot) => dateStringFromDate(new Date(snapshot.date)) === state.forms.snapshot.date)
        .map((snapshot) => [String(snapshot.accountId), snapshot])
    );

    return m("section.stack-lg", [
      m("section.hero-card.page-intro", [
        m("p.eyebrow", "Snapshots"),
        m("h1.page-title", "Capture balances by statement date"),
        m("p.hero-copy", "Enter a whole date batch at once, then revisit saved batches later when you need to correct or refresh balances.")
      ]),
      m("section", { className: isEditorVisible ? "management-layout management-layout-wide" : "stack-lg" }, [
      isEditorVisible
        ? m("section.panel", [
        m("div.section-heading", [
          m("div", [
            m("p.eyebrow", "Snapshots"),
            m("h2", isEditingBatch ? `Edit snapshot batch for ${state.forms.snapshot.date}` : "Add snapshot batch")
          ]),
          m("p.section-copy", "Enter balances for as many accounts as you want on one statement date, then save them together.")
        ]),
        state.loans.length === 0
          ? m("p.empty-copy", "Add an account before saving snapshots.")
          : m("form.stack-lg", { onsubmit: submit }, [
            m("div.control-grid", [
              m("label.form-field", [
                m("span", "Snapshot date"),
                m("input", {
                  type: "date",
                  value: state.forms.snapshot.date,
                  oninput: (event) => actions.updateSnapshotBatchDate(event.target.value),
                  required: true
                })
              ])
            ]),
            m("p.section-copy", isEditingBatch
              ? "Loaded balances are the saved snapshots for this date. Clear a saved balance to remove that snapshot when you save."
              : "Leave accounts blank if you do not want to save a snapshot for them on this date."),
            m("div.table-wrap", [
              m("table.responsive-table snapshot-entry-table", [
                m("thead", m("tr", [
                  m("th", "Account"),
                  m("th", "Provider"),
                  m("th", "Balance"),
                  m("th", "Status")
                ])),
                m("tbody", state.loans.map((loan) => {
                  const loanId = String(loan.id);
                  const existingSnapshot = currentBatchSnapshots.get(loanId);
                  const currentValue = state.forms.snapshot.balances?.[loanId] ?? "";

                  return m("tr", { key: loan.id }, [
                    m("td", { "data-label": "Account" }, loan.name),
                    m("td", { "data-label": "Provider" }, loan.provider || "Unspecified"),
                    m("td", { "data-label": "Balance" }, m("input", {
                      type: "number",
                      min: "0",
                      step: "0.01",
                      value: currentValue,
                      oninput: (event) => actions.updateSnapshotBatchBalance(loan.id, event.target.value),
                      placeholder: existingSnapshot ? String(existingSnapshot.balance) : "Leave blank"
                    })),
                    m("td", { "data-label": "Status" }, getBatchStatus(currentValue, Boolean(existingSnapshot)))
                  ]);
                }))
              ])
            ]),
            state.formErrors.snapshot
              ? m("p.form-error", state.formErrors.snapshot)
              : null,
            m("div.form-actions", [
              m("button", {
                type: "submit",
                disabled: state.mutations.snapshots
              }, state.mutations.snapshots ? "Saving..." : "Save batch"),
              isEditingBatch
                ? m("button.button-secondary", {
                  type: "button",
                  onclick: () => actions.startNewSnapshotBatch()
                }, "Start new batch")
                : null,
              m("button.button-secondary", {
                type: "button",
                onclick: () => actions.hideSnapshotEditor()
              }, "Close editor")
            ])
          ])
      ])
        : null,
      m("section.panel", [
        m("div.section-heading", [
          m("div", [
            m("p.eyebrow", "History"),
            m("h3", "Saved snapshot batches")
          ]),
          m("div.form-actions", [
            m("button.button-secondary", {
              type: "button",
              disabled: state.loans.length === 0,
              onclick: () => actions.startNewSnapshotBatch()
            }, "Add Snapshot"),
            state.loading.snapshots ? m("p.inline-message", "Refreshing snapshots...") : null
          ])
        ]),
        snapshotGroups.length === 0
          ? m("p.empty-copy", "No snapshots yet. Click Add Snapshot to create your first date batch.")
          : m("div.snapshot-batch-list", snapshotGroups.map((group) => (
            m("details.snapshot-batch-card", {
              key: group.date,
              open: state.editing.snapshotBatchDate === group.date ? true : undefined
            }, [
              m("summary.snapshot-batch-summary", [
                m("div.snapshot-batch-summary-main", [
                  m("h4", group.date),
                  m("p.section-copy", `${group.count} accounts saved · ${currencyFormat(group.totalBalance)} total`)
                ]),
                m("div.snapshot-batch-summary-actions", [
                  m("button.button-secondary", {
                    type: "button",
                    onclick: (event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      actions.beginSnapshotBatchEdit(group.date);
                    }
                  }, "Edit Batch"),
                  m("span.snapshot-batch-toggle", "View details")
                ])
              ]),
              m("div.snapshot-batch-content", [
                m("div.snapshot-batch-header", [
                  m("p.section-copy", "Review the balances saved for this date below. Use Edit Batch from the header to reopen the full batch editor.")
                ]),
                m("div.table-wrap", [
                  m("table.responsive-table", [
                    m("thead", m("tr", [
                      m("th", "Account"),
                      m("th", "Balance"),
                      m("th", "Actions")
                    ])),
                    m("tbody", group.entries.map((snapshot) => {
                      const isConfirmingDelete = state.deletePrompt?.resourceKey === "snapshots" && state.deletePrompt.id === snapshot.id;
                      const isPendingDelete = state.pendingDelete?.resourceKey === "snapshots" && state.pendingDelete.id === snapshot.id;

                      return m("tr", { key: snapshot.id }, [
                        m("td", { "data-label": "Account" }, snapshot.accountName),
                        m("td", { "data-label": "Balance" }, currencyFormat(snapshot.balance)),
                        m("td", { "data-label": "Actions", className: "actions-cell" }, [
                          isPendingDelete
                            ? [
                              m("span.inline-message", "Delete queued"),
                              m("button.button-secondary", {
                                type: "button",
                                onclick: () => actions.undoPendingDelete()
                              }, "Undo")
                            ]
                            : isConfirmingDelete
                              ? [
                                m("span.inline-message", `Delete ${snapshot.accountName}?`),
                                m("button.button-danger", {
                                  type: "button",
                                  disabled: state.mutations.snapshots,
                                  onclick: () => actions.confirmDeleteRequest("snapshots", snapshot.id)
                                }, "Confirm"),
                                m("button.button-secondary", {
                                  type: "button",
                                  onclick: () => actions.cancelDeleteRequest("snapshots", snapshot.id)
                                }, "Cancel")
                              ]
                              : m("button.button-danger", {
                                type: "button",
                                disabled: state.mutations.snapshots,
                                onclick: () => actions.requestDelete("snapshots", snapshot.id, `Snapshot for "${snapshot.accountName}" on ${group.date}`)
                              }, "Delete")
                        ])
                      ]);
                    }))
                  ])
                ])
              ])
            ])
          )))
      ])
      ])
    ]);
  }
};

export { SnapshotManager };
