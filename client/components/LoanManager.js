import m from "mithril";
import { actions, state } from "../state/index.js";

function submit(event) {
  event.preventDefault();
  void actions.saveLoan();
}

/** @type {m.Component} */
const LoanManager = {
  view: () => {
    const isEditing = state.editing.loanId !== null;

    return m("section.stack-lg", [
      m("section.panel", [
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
                onclick: () => actions.cancelLoanEdit()
              }, "Cancel")
              : null
          ])
        ])
      ]),
      m("section.panel", [
        m("div.section-heading", [
          m("div", [
            m("p.eyebrow", "Current accounts"),
            m("h3", "Loan list")
          ]),
          state.loading.loans ? m("p.inline-message", "Refreshing accounts...") : null
        ]),
        state.loans.length === 0
          ? m("p.empty-copy", "No accounts yet. Add the first one above.")
          : m("div.table-wrap", [
            m("table", [
              m("thead", m("tr", [
                m("th", "Name"),
                m("th", "Provider"),
                m("th", "APR"),
                m("th", "Min Payment"),
                m("th", "Actions")
              ])),
              m("tbody", state.loans.map((loan) => (
                m("tr", { key: loan.id }, [
                  m("td", loan.name),
                  m("td", loan.provider || "Unspecified"),
                  m("td", `${loan.apr.toFixed(2)}%`),
                  m("td", `$${loan.minPayment.toFixed(2)}`),
                  m("td.actions-cell", [
                    m("button.button-secondary", {
                      type: "button",
                      onclick: () => actions.beginEditLoan(loan)
                    }, "Edit"),
                    m("button.button-danger", {
                      type: "button",
                      disabled: state.mutations.loans,
                      onclick: () => {
                        void actions.deleteLoan(loan.id);
                      }
                    }, "Delete")
                  ])
                ])
              )))
            ])
          ])
      ])
    ]);
  }
};

export { LoanManager };
