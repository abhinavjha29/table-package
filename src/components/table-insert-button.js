import { EditorView } from "@remirror/core";
import { addFill } from "@remirror/icons";
import { TableRect } from "@remirror/pm/tables";
import { ExtensionTablesTheme } from "@remirror/theme";

import { addColumn, addRow } from "../react-table-commands";
import { h } from "../utils/dom";

export function shouldHideInsertButton(attrs, e) {
  if (attrs.col !== -1) {
    return (
      e.clientX < attrs.triggerRect.left - 400 ||
      e.clientX > attrs.triggerRect.right + 400 ||
      e.clientY < attrs.triggerRect.top - 60 ||
      e.clientY > attrs.triggerRect.bottom
    );
  } else if (attrs.row !== -1) {
    return (
      e.clientX < attrs.triggerRect.left - 40 ||
      e.clientX > attrs.triggerRect.right ||
      e.clientY < attrs.triggerRect.top - 100 ||
      e.clientY > attrs.triggerRect.bottom + 100
    );
  }

  return true;
}

let addFillIconCache = null;

// TODO: this part is so ugly.
function AddFillIcon() {
  if (addFillIconCache) {
    return addFillIconCache;
  }

  const xmlns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(xmlns, "svg");
  svg.setAttribute("xmlns", xmlns);
  svg.setAttribute("viewBox", "0 0 24 24");
  const g = document.createElementNS(xmlns, "g");

  for (const tree of addFill) {
    const path = document.createElementNS(xmlns, tree.tag);

    for (const [key, value] of Object.entries(tree.attr)) {
      path.setAttribute(key, value);
    }

    g.append(path);
  }

  svg.append(g);
  addFillIconCache = svg;
  return svg;
}

function InnerTableInsertButton(attrs) {
  const size = 18;

  return h(
    "div",
    {
      className: `${ExtensionTablesTheme.TABLE_INSERT_BUTTON} ${ExtensionTablesTheme.CONTROLLERS_TOGGLE}`,
      style: {
        top: `${attrs.y - size / 2 - 5}px`,
        left: `${attrs.x - size / 2}px`,
      },
    },
    AddFillIcon()
  );
}

function TableInsertButton({ view, tableRect, attrs, removeInsertButton }) {
  const button = InnerTableInsertButton(attrs);

  const insertRolOrColumn = () => {
    let tr = view.state.tr;

    if (attrs.col !== -1) {
      tr = addColumn(tr, tableRect, attrs.col);
    } else if (attrs.row !== -1) {
      tr = addRow(tr, tableRect, attrs.row);
    } else {
      return;
    }

    view.dispatch(removeInsertButton(tr));
  };

  button.addEventListener("mousedown", () => {
    insertRolOrColumn();
  });

  return button;
}

export default TableInsertButton;
