import { EditorView, range, throttle, Transaction } from "@remirror/core";
import { TableMap, updateColumnsOnResize } from "@remirror/pm/tables";
import { Decoration } from "@remirror/pm/view";
import { ExtensionTablesTheme } from "@remirror/theme";

import TableInsertButton, {
  shouldHideInsertButton,
} from "../components/table-insert-button";
import { h } from "../utils/dom";
import { setNodeAttrs } from "../utils/prosemirror";

export class TableView {
  constructor(node, cellMinWidth, decorations, view, getPos) {
    this.node = node;
    this.cellMinWidth = cellMinWidth;
    this.decorations = decorations;
    this.view = view;
    this.getPos = getPos;

    this.map = TableMap.get(this.node);

    this.tbody = h("tbody", {
      className: ExtensionTablesTheme.TABLE_TBODY_WITH_CONTROLLERS,
    });
    this.colgroup = h(
      "colgroup",
      { className: ExtensionTablesTheme.TABLE_COLGROUP },
      ...range(this.map.width).map(() => h("col"))
    );
    this.table = h(
      "table",
      {
        className: ExtensionTablesTheme.TABLE,
        dataset: { controllersInjected: "" },
      },
      this.colgroup,
      this.tbody
    );
    this.insertButtonWrapper = h("div");
    this.root = h("div", null, this.table, this.insertButtonWrapper);

    this.render();

    this.showInsertButton = false;
    this.handleMouseMove = throttle(100, (e) => {
      if (this.showInsertButton) {
        const attrs = this.attrs().insertButtonAttrs;

        if (attrs && shouldHideInsertButton(attrs, e)) {
          this.showInsertButton = false;
          replaceChildren(this.insertButtonWrapper, []);

          if (this.removeInsertButton) {
            this.view.dispatch(this.removeInsertButton(this.view.state.tr));
          }
        }
      }
    });

    document.addEventListener("mousemove", this.handleMouseMove);
  }

  get dom() {
    return this.root;
  }

  get contentDOM() {
    return this.tbody;
  }

  update(node, decorations) {
    if (node.type !== this.node.type) {
      return false;
    }

    this.decorations = decorations;
    this.node = node;
    this.map = TableMap.get(this.node);

    this.render();

    return true;
  }

  render() {
    this.renderTable();

    if (!this.attrs().isControllersInjected) {
      return;
    }

    this.renderInsertButton();
  }

  renderTable() {
    if (this.colgroup.children.length !== this.map.width) {
      const cols = range(this.map.width).map(() => h("col"));
      replaceChildren(this.colgroup, cols);
    }

    const className = [
      ExtensionTablesTheme.TABLE,
      this.attrs().isControllersInjected
        ? ExtensionTablesTheme.TABLE_WITH_CONTROLLERS
        : ExtensionTablesTheme.TABLE_WAITTING_CONTROLLERS,
    ].join(" ");

    if (this.table.className !== className) {
      this.table.className = className;
    }

    updateColumnsOnResize(
      this.node,
      this.colgroup,
      this.table,
      this.cellMinWidth
    );
  }

  renderInsertButton() {
    const attrs = this.attrs().insertButtonAttrs;

    if (attrs) {
      const tableRect = {
        map: this.map,
        table: this.node,
        tableStart: this.getPos() + 1,
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
      };

      this.removeInsertButton = (tr) => {
        return setNodeAttrs(tr, tableRect.tableStart - 1, {
          insertButtonAttrs: null,
        });
      };

      const button = TableInsertButton({
        view: this.view,
        attrs,
        tableRect,
        removeInsertButton: this.removeInsertButton,
      });

      replaceChildren(this.insertButtonWrapper, [button]);
      this.showInsertButton = true;
    } else {
      replaceChildren(this.insertButtonWrapper, []);
      this.showInsertButton = false;
    }
  }

  attrs() {
    return this.node.attrs;
  }

  ignoreMutation() {
    return true;
  }

  destroy() {
    document.removeEventListener("mousemove", this.handleMouseMove);
  }
}

export function replaceChildren(parent, children) {
  while (parent.firstChild) {
    parent.firstChild.remove();
  }

  for (const child of children) {
    parent.append(child);
  }
}
