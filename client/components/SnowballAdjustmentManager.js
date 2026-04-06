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
            m("table", [
              m("thead", m("tr", [
                m("th", "Effective date"),
                m("th", "Amount"),
                m("th", "Actions")
              ])),
              m("tbody", sortedAdjustments.map((adjustment) => (
                m("tr", { key: adjustment.id }, [
                  m("td", dateStringFromDate(new Date(adjustment.date))),
                  m("td", currencyFormat(adjustment.amount)),
                  m("td.actions-cell", [
                    m("button.button-secondary", {
                      type: "button",
                      onclick: () => actions.beginEditSnowballAdjustment(adjustment)
                    }, "Edit"),
                    m("button.button-danger", {
                      type: "button",
                      disabled: state.mutations.snowballAdjustments,
                      onclick: () => {
                        void actions.deleteSnowballAdjustment(adjustment.id);
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

export { SnowballAdjustmentManager };
