import m from "mithril";
import { currencyFormat, dateStringFromDate } from "../paydownData.js";
import { actions, state } from "../state/index.js";

function submit(event) {
  event.preventDefault();
  void actions.saveExtraPayment();
}

/** @type {m.Component} */
const ExtraPaymentManager = {
  view: () => {
    const isEditing = state.editing.extraPaymentId !== null;
    const sortedExtraPayments = [...state.extraPayments].sort((a, b) => b.date - a.date || a.id - b.id);

    return m("section.stack-lg", [
      m("section.hero-card.page-intro", [
        m("p.eyebrow", "Extra Payments"),
        m("h1.page-title", "Schedule one-off payoff boosts"),
        m("p.hero-copy", "Track planned lump-sum payments so your payoff projections match the real cash you expect to throw at debt.")
      ]),
      m("section.management-layout", [
      m("section.panel", [
        m("div.section-heading", [
          m("div", [
            m("p.eyebrow", "Extra Payments"),
            m("h2", isEditing ? "Edit extra payment" : "Add extra payment")
          ]),
          m("p.section-copy", "Model one-off payments that should be added to the selected payoff strategy.")
        ]),
        m("form.form-grid", { onsubmit: submit }, [
          m("label.form-field", [
            m("span", "Payment date"),
            m("input", {
              type: "date",
              value: state.forms.extraPayment.date,
              oninput: (event) => actions.updateForm("extraPayment", "date", event.target.value),
              required: true
            })
          ]),
          m("label.form-field", [
            m("span", "Amount"),
            m("input", {
              type: "number",
              min: "0",
              step: "0.01",
              value: state.forms.extraPayment.amount,
              oninput: (event) => actions.updateForm("extraPayment", "amount", event.target.value),
              placeholder: "250.00",
              required: true
            })
          ]),
          state.formErrors.extraPayment
            ? m("p.form-error", state.formErrors.extraPayment)
            : null,
          m("div.form-actions", [
            m("button", {
              type: "submit",
              disabled: state.mutations.extraPayments
            }, state.mutations.extraPayments ? "Saving..." : (isEditing ? "Update payment" : "Save payment")),
            isEditing
              ? m("button.button-secondary", {
                type: "button",
                onclick: () => actions.cancelExtraPaymentEdit()
              }, "Cancel")
              : null
          ])
        ])
      ]),
      m("section.panel", [
        m("div.section-heading", [
          m("div", [
            m("p.eyebrow", "Schedule"),
            m("h3", "Saved extra payments")
          ]),
          state.loading.extraPayments ? m("p.inline-message", "Refreshing extra payments...") : null
        ]),
        sortedExtraPayments.length === 0
          ? m("p.empty-copy", "No extra payments saved yet.")
          : m("div.table-wrap", [
            m("table.responsive-table", [
              m("thead", m("tr", [
                m("th", "Date"),
                m("th", "Amount"),
                m("th", "Actions")
              ])),
              m("tbody", sortedExtraPayments.map((payment) => (
                (() => {
                  const paymentDate = dateStringFromDate(payment.date instanceof Date ? payment.date : new Date(`${payment.date}T00:00:00`));
                  const isConfirmingDelete = state.deletePrompt?.resourceKey === "extraPayments" && state.deletePrompt.id === payment.id;
                  const isPendingDelete = state.pendingDelete?.resourceKey === "extraPayments" && state.pendingDelete.id === payment.id;

                  return m("tr", { key: payment.id }, [
                    m("td", { "data-label": "Date" }, paymentDate),
                    m("td", { "data-label": "Amount" }, currencyFormat(payment.amount)),
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
                            m("span.inline-message", `Delete ${paymentDate}?`),
                            m("button.button-danger", {
                              type: "button",
                              disabled: state.mutations.extraPayments,
                              onclick: () => actions.confirmDeleteRequest("extraPayments", payment.id)
                            }, "Confirm"),
                            m("button.button-secondary", {
                              type: "button",
                              onclick: () => actions.cancelDeleteRequest("extraPayments", payment.id)
                            }, "Cancel")
                          ]
                          : [
                            m("button.button-secondary", {
                              type: "button",
                              onclick: () => actions.beginEditExtraPayment(payment)
                            }, "Edit"),
                            m("button.button-danger", {
                              type: "button",
                              disabled: state.mutations.extraPayments,
                              onclick: () => actions.requestDelete("extraPayments", payment.id, `Extra payment on ${paymentDate}`)
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

export { ExtraPaymentManager };
