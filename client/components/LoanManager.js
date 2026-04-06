import m from "mithril";
import { actions, state } from "../state/index.js";

function submit(event) {
  event.preventDefault();
  void actions.saveLoan();
}

/** @type {m.Component} */
const LoanManager = {
  view: () => {
    const isEditorVisible = state.accountEditorVisible;
    const isEditing = state.editing.loanId !== null;

    return m("section.stack-lg", [
      m("section.hero-card.page-intro", [
        m("p.eyebrow", "Accounts"),
        m("h1.page-title", "Manage your loan accounts"),
        m("p.hero-copy", "Keep loan names, APRs, providers, and minimum payments organized so the planner always starts from clean data.")
      ]),
      m("section", { className: isEditorVisible ? "management-layout" : "stack-lg" }, [
        isEditorVisible
          ? m("section.panel", [
            m("div.section-heading", [
              m("div", [
                m("p.eyebrow", "Accounts"),
                m("h2", isEditing ? "Edit account" : "Add account")
              ]),
              m("p.section-copy", "Manage the loan accounts that feed the payoff planner.")
            ]),
            m("form.form-grid", { onsubmit: submit }, [
              m("label.form-field", [
                m("span", "Account name"),
                m("input", {
                  type: "text",
                  value: state.forms.loan.name,
                  oninput: (event) => actions.updateForm("loan", "name", event.target.value),
                  placeholder: "Federal Loan A",
                  required: true
                })
              ]),
              m("label.form-field", [
                m("span", "Provider"),
                m("input", {
                  type: "text",
                  value: state.forms.loan.provider,
                  oninput: (event) => actions.updateForm("loan", "provider", event.target.value),
                  placeholder: "Nelnet"
                })
              ]),
              m("label.form-field", [
                m("span", "APR"),
                m("input", {
                  type: "number",
                  min: "0",
                  step: "0.01",
                  value: state.forms.loan.apr,
                  oninput: (event) => actions.updateForm("loan", "apr", event.target.value),
                  placeholder: "4.25",
                  required: true
                })
              ]),
              m("label.form-field", [
                m("span", "Minimum payment"),
                m("input", {
                  type: "number",
                  min: "0",
                  step: "0.01",
                  value: state.forms.loan.minPayment,
                  oninput: (event) => actions.updateForm("loan", "minPayment", event.target.value),
                  placeholder: "125.00",
                  required: true
                })
              ]),
              state.formErrors.loan
                ? m("p.form-error", state.formErrors.loan)
                : null,
              m("div.form-actions", [
                m("button", {
                  type: "submit",
                  disabled: state.mutations.loans
                }, state.mutations.loans ? "Saving..." : (isEditing ? "Update account" : "Save account")),
                isEditing
                  ? m("button.button-secondary", {
                    type: "button",
                    onclick: () => actions.startNewLoan()
                  }, "Start new account")
                  : null,
                m("button.button-secondary", {
                  type: "button",
                  onclick: () => actions.hideAccountEditor()
                }, "Close editor")
              ])
            ])
          ])
          : null,
        m("section.panel", [
          m("div.section-heading", [
            m("div", [
              m("p.eyebrow", "Current accounts"),
              m("h3", "Loan list")
            ]),
            m("div.form-actions", [
              m("button.button-secondary", {
                type: "button",
                onclick: () => actions.startNewLoan()
              }, "Add Account"),
              state.loading.loans ? m("p.inline-message", "Refreshing accounts...") : null
            ])
          ]),
          state.loans.length === 0
            ? m("p.empty-copy", "No accounts yet. Click Add Account to create your first one.")
            : m("div.table-wrap", [
              m("table.responsive-table", [
                m("thead", m("tr", [
                  m("th", "Name"),
                  m("th", "Provider"),
                  m("th", "APR"),
                  m("th", "Min Payment"),
                  m("th", "Actions")
                ])),
                m("tbody", state.loans.map((loan) => (
                  (() => {
                    const isConfirmingDelete = state.deletePrompt?.resourceKey === "loans" && state.deletePrompt.id === loan.id;
                    const isPendingDelete = state.pendingDelete?.resourceKey === "loans" && state.pendingDelete.id === loan.id;

                    return m("tr", { key: loan.id }, [
                      m("td", { "data-label": "Name" }, loan.name),
                      m("td", { "data-label": "Provider" }, loan.provider || "Unspecified"),
                      m("td", { "data-label": "APR" }, `${loan.apr.toFixed(2)}%`),
                      m("td", { "data-label": "Min Payment" }, `$${loan.minPayment.toFixed(2)}`),
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
                              m("span.inline-message", `Delete ${loan.name}?`),
                              m("button.button-danger", {
                                type: "button",
                                disabled: state.mutations.loans,
                                onclick: () => actions.confirmDeleteRequest("loans", loan.id)
                              }, "Confirm"),
                              m("button.button-secondary", {
                                type: "button",
                                onclick: () => actions.cancelDeleteRequest("loans", loan.id)
                              }, "Cancel")
                            ]
                            : [
                              m("button.button-secondary", {
                                type: "button",
                                onclick: () => actions.beginEditLoan(loan)
                              }, "Edit"),
                              m("button.button-danger", {
                                type: "button",
                                disabled: state.mutations.loans,
                                onclick: () => actions.requestDelete("loans", loan.id, `Account "${loan.name}"`)
                              }, "Delete")
                            ]
                      ])
                    ]);
                  })()
                )))
              ])
            ])
        ])
      ])
    ]);
  }
};

export { LoanManager };
