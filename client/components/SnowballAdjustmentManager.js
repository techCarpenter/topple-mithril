import m from "mithril";
import { currencyFormat, dateStringFromDate } from "../paydownData.js";
import { actions, state } from "../state/index.js";

function submit(event) {
  event.preventDefault();
  void actions.saveSnowballAdjustment();
}

/** @type {m.Component} */
const SnowballAdjustmentManager = {
  view: () => {
    const isEditing = state.editing.snowballAdjustmentId !== null;
    const sortedAdjustments = [...state.snowballAdjustments].sort((a, b) => b.date - a.date || a.id - b.id);

    return m("section.stack-lg", [
      m("section.hero-card.page-intro", [
        m("p.eyebrow", "Snowball Adjustments"),
        m("h1.page-title", "Plan monthly snowball changes"),
        m("p.hero-copy", "Account for salary changes, budget shifts, or temporary constraints by scheduling recurring snowball adjustments.")
      ]),
      m("section.management-layout", [
      m("section.panel", [
        m("div.section-heading", [
          m("div", [
            m("p.eyebrow", "Snowball Adjustments"),
            m("h2", isEditing ? "Edit monthly adjustment" : "Add monthly adjustment")
          ]),
          m("p.section-copy", "Schedule future monthly changes to your recurring snowball amount.")
        ]),
        m("form.form-grid", { onsubmit: submit }, [
          m("label.form-field", [
            m("span", "Effective month"),
            m("input", {
              type: "date",
              value: state.forms.snowballAdjustment.date,
              oninput: (event) => actions.updateForm("snowballAdjustment", "date", event.target.value),
              required: true
            })
          ]),
          m("label.form-field", [
            m("span", "Adjustment amount"),
            m("input", {
              type: "number",
              step: "0.01",
              value: state.forms.snowballAdjustment.amount,
              oninput: (event) => actions.updateForm("snowballAdjustment", "amount", event.target.value),
              placeholder: "100.00",
              required: true
            })
          ]),
          state.formErrors.snowballAdjustment
            ? m("p.form-error", state.formErrors.snowballAdjustment)
            : null,
          m("div.form-actions", [
            m("button", {
              type: "submit",
              disabled: state.mutations.snowballAdjustments
            }, state.mutations.snowballAdjustments ? "Saving..." : (isEditing ? "Update adjustment" : "Save adjustment")),
            isEditing
              ? m("button.button-secondary", {
                type: "button",
                onclick: () => actions.cancelSnowballAdjustmentEdit()
              }, "Cancel")
              : null
          ])
        ])
      ]),
      m("section.panel", [
        m("div.section-heading", [
          m("div", [
            m("p.eyebrow", "Upcoming changes"),
            m("h3", "Saved snowball adjustments")
          ]),
          state.loading.snowballAdjustments ? m("p.inline-message", "Refreshing adjustments...") : null
        ]),
        sortedAdjustments.length === 0
          ? m("p.empty-copy", "No scheduled snowball adjustments yet.")
          : m("div.table-wrap", [
            m("table.responsive-table", [
              m("thead", m("tr", [
                m("th", "Effective date"),
                m("th", "Amount"),
                m("th", "Actions")
              ])),
              m("tbody", sortedAdjustments.map((adjustment) => (
                (() => {
                  const adjustmentDate = dateStringFromDate(new Date(adjustment.date));
                  const isConfirmingDelete = state.deletePrompt?.resourceKey === "snowballAdjustments" && state.deletePrompt.id === adjustment.id;
                  const isPendingDelete = state.pendingDelete?.resourceKey === "snowballAdjustments" && state.pendingDelete.id === adjustment.id;

                  return m("tr", { key: adjustment.id }, [
                    m("td", { "data-label": "Effective date" }, adjustmentDate),
                    m("td", { "data-label": "Amount" }, currencyFormat(adjustment.amount)),
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
                            m("span.inline-message", `Delete ${adjustmentDate}?`),
                            m("button.button-danger", {
                              type: "button",
                              disabled: state.mutations.snowballAdjustments,
                              onclick: () => actions.confirmDeleteRequest("snowballAdjustments", adjustment.id)
                            }, "Confirm"),
                            m("button.button-secondary", {
                              type: "button",
                              onclick: () => actions.cancelDeleteRequest("snowballAdjustments", adjustment.id)
                            }, "Cancel")
                          ]
                          : [
                            m("button.button-secondary", {
                              type: "button",
                              onclick: () => actions.beginEditSnowballAdjustment(adjustment)
                            }, "Edit"),
                            m("button.button-danger", {
                              type: "button",
                              disabled: state.mutations.snowballAdjustments,
                              onclick: () => actions.requestDelete("snowballAdjustments", adjustment.id, `Snowball adjustment on ${adjustmentDate}`)
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

export { SnowballAdjustmentManager };
