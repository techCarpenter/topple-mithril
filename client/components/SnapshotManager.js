import m from "mithril";
import { currencyFormat, dateStringFromDate } from "../paydownData.js";
import { actions, state } from "../state/index.js";

function submit(event) {
  event.preventDefault();
  void actions.saveSnapshot();
}

/** @type {m.Component} */
const SnapshotManager = {
  view: () => {
    const isEditing = state.editing.snapshotId !== null;
    const accountLookup = new Map(state.loans.map((loan) => [String(loan.id), loan]));
    const sortedSnapshots = [...state.snapshots].sort((a, b) => b.date - a.date || a.accountId - b.accountId);

    return m("section.stack-lg", [
      m("section.panel", [
        m("div.section-heading", [
          m("div", [
            m("p.eyebrow", "Snapshots"),
            m("h2", isEditing ? "Edit balance snapshot" : "Add balance snapshot")
          ]),
          m("p.section-copy", "Record the latest known balance for an account on a specific date.")
        ]),
        state.loans.length === 0
          ? m("p.empty-copy", "Add an account before saving snapshots.")
          : m("form.form-grid", { onsubmit: submit }, [
            m("label.form-field", [
              m("span", "Account"),
              m("select", {
                value: state.forms.snapshot.accountId,
                onchange: (event) => actions.updateForm("snapshot", "accountId", event.target.value)
              }, [
                m("option", { value: "", disabled: true }, "Choose an account"),
                state.loans.map((loan) => (
                  m("option", { key: loan.id, value: loan.id }, loan.name)
                ))
              ])
            ]),
            m("label.form-field", [
              m("span", "Snapshot date"),
              m("input", {
                type: "date",
                value: state.forms.snapshot.date,
                oninput: (event) => actions.updateForm("snapshot", "date", event.target.value),
                required: true
              })
            ]),
            m("label.form-field", [
              m("span", "Balance"),
              m("input", {
                type: "number",
                min: "0",
                step: "0.01",
                value: state.forms.snapshot.balance,
                oninput: (event) => actions.updateForm("snapshot", "balance", event.target.value),
                placeholder: "5200.00",
                required: true
              })
            ]),
            state.formErrors.snapshot
              ? m("p.form-error", state.formErrors.snapshot)
              : null,
            m("div.form-actions", [
              m("button", {
                type: "submit",
                disabled: state.mutations.snapshots
              }, state.mutations.snapshots ? "Saving..." : (isEditing ? "Update snapshot" : "Save snapshot")),
              isEditing
                ? m("button.button-secondary", {
                  type: "button",
                  onclick: () => actions.cancelSnapshotEdit()
                }, "Cancel")
                : null
            ])
          ])
      ]),
      m("section.panel", [
        m("div.section-heading", [
          m("div", [
            m("p.eyebrow", "History"),
            m("h3", "Saved snapshots")
          ]),
          state.loading.snapshots ? m("p.inline-message", "Refreshing snapshots...") : null
        ]),
        sortedSnapshots.length === 0
          ? m("p.empty-copy", "No snapshots yet. Add your latest balances above.")
          : m("div.table-wrap", [
            m("table", [
              m("thead", m("tr", [
                m("th", "Date"),
                m("th", "Account"),
                m("th", "Balance"),
                m("th", "Actions")
              ])),
              m("tbody", sortedSnapshots.map((snapshot) => (
                m("tr", { key: snapshot.id }, [
                  m("td", dateStringFromDate(new Date(snapshot.date))),
                  m("td", accountLookup.get(String(snapshot.accountId))?.name || `Account ${snapshot.accountId}`),
                  m("td", currencyFormat(snapshot.balance)),
                  m("td.actions-cell", [
                    m("button.button-secondary", {
                      type: "button",
                      onclick: () => actions.beginEditSnapshot(snapshot)
                    }, "Edit"),
                    m("button.button-danger", {
                      type: "button",
                      disabled: state.mutations.snapshots,
                      onclick: () => {
                        void actions.deleteSnapshot(snapshot.id);
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

export { SnapshotManager };
