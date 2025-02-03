import {
  ApplySchemaAttributes,
  command,
  composeTransactionSteps,
  convertCommand,
  CreateExtensionPlugin,
  Decoration,
  EditorView,
  ExtensionPriority,
  findChildren,
  getChangedNodes,
  isElementDomNode,
  NodeSpecOverride,
  NodeViewMethod,
  ProsemirrorNode,
  ProsemirrorPlugin,
  replaceNodeAtPosition,
} from "@remirror/core";
import {
  createTable,
  createTableOptions,
  TableCellExtension as BaseTableCellExtension,
  TableControllerCellExtension as BaseTableControllerCellExtension,
  TableExtension as BaseTableExtension,
  TableHeaderCellExtension as BaseTableHeaderCellExtension,
  TableRowExtension as BaseTableRowExtension,
} from "@remirror/extension-tables";
import { TextSelection } from "@remirror/pm/state";
import { tableEditing, TableMap } from "@remirror/pm/tables";

import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
} from "./react-table-commands";
import { columnResizing } from "./table-column-resizing";
import { createTableControllerPlugin } from "./table-plugins";
import { injectControllers } from "./utils/controller";
import { TableControllerCellView } from "./views/table-controller-cell-view.jsx";
import { TableView } from "./views/table-view.jsx";

export class TableExtension extends BaseTableExtension {
  get name() {
    return "table";
  }

  createNodeViews() {
    return (node, view, getPos, decorations) =>
      new TableView(node, 10, decorations, view, getPos);
  }

  createExternalPlugins() {
    const plugins = [];

    if (
      this.store.isMounted() &&
      this.store.helpers.isViewEditable() === false
    ) {
      return plugins;
    }

    const { resizable, resizeableOptions } = this.options;

    if (resizable) {
      plugins.push(
        columnResizing({ ...resizeableOptions, firstResizableColumn: 1 })
      );
    }

    plugins.push(tableEditing(), createTableControllerPlugin());

    return plugins;
  }

  createNodeSpec(extra) {
    const spec = {
      isolating: true,
      attrs: {
        ...extra.defaults(),
        isControllersInjected: { default: false },
        insertButtonAttrs: { default: null },
      },
      content: "tableRow+",
      tableRole: "table",
      parseDOM: [
        {
          tag: "table",
          getAttrs: (node) => {
            if (!isElementDomNode(node)) {
              return {};
            }

            return {
              ...extra.parse(node),
              isControllersInjected: node.hasAttribute(
                "data-controllers-injected"
              ),
            };
          },
        },
      ],
      toDOM(node) {
        const controllerAttrs = {};

        if (node.attrs.isControllersInjected) {
          controllerAttrs["data-controllers-injected"] = "";
        }

        return [
          "table",
          { ...extra.dom(node), ...controllerAttrs },
          ["tbody", 0],
        ];
      },
      allowGapCursor: false,
    };
    return spec;
  }

  createExtensions() {
    return [new TableRowExtension({ priority: ExtensionPriority.Low })];
  }

  onView(view) {
    const schema = this.store.schema;
    schema.cached.tableNodeTypes = {
      cell: schema.nodes.tableCell,
      row: schema.nodes.tableRow,
      table: schema.nodes.table,
      header_cell: schema.nodes.tableHeaderCell,
    };

    const {
      dispatch,
      state: { doc, tr },
    } = view;

    const tableNodes = findChildren({
      node: doc,
      predicate: ({ node: { type, attrs } }) =>
        type === schema.nodes.table && attrs.isControllersInjected === false,
    });

    if (tableNodes.length === 0) {
      return;
    }

    for (const { node: table, pos } of tableNodes) {
      const controlledTable = injectControllers({
        schema,
        getMap: () => TableMap.get(table),
        table,
      });

      replaceNodeAtPosition({
        pos: tr.mapping.map(pos),
        tr,
        content: controlledTable,
      });
    }

    dispatch(tr.setMeta("addToHistory", false));
  }

  createTable(options = {}) {
    return (props) => {
      const { tr, dispatch, state } = props;

      if (!tr.selection.empty) {
        return false;
      }

      const { schema } = state;
      const offset = tr.selection.anchor + 1;

      const table = createTable({ schema, ...options });
      const controlledTable = injectControllers({
        schema,
        getMap: () => TableMap.get(table),
        table,
      });

      dispatch?.(
        tr
          .replaceSelectionWith(controlledTable)
          .scrollIntoView()
          .setSelection(TextSelection.near(tr.doc.resolve(offset)))
      );

      return true;
    };
  }

  addTableColumnBefore() {
    return convertCommand(addColumnBefore);
  }

  addTableColumnAfter() {
    return convertCommand(addColumnAfter);
  }

  addTableRowBefore() {
    return convertCommand(addRowBefore);
  }

  addTableRowAfter() {
    return convertCommand(addRowAfter);
  }

  createPlugin() {
    return {
      appendTransaction: (transactions, prevState, state) => {
        const composedTransaction = composeTransactionSteps(
          transactions,
          prevState
        );

        const { schema, tr } = state;

        const tableNodes = getChangedNodes(composedTransaction, {
          predicate: ({ type }) => type === schema.nodes.table,
        });

        if (tableNodes.length === 0) {
          return;
        }

        for (const { node: table, pos } of tableNodes) {
          if (table.attrs.isControllersInjected) {
            continue;
          }

          const controlledTable = injectControllers({
            schema,
            getMap: () => TableMap.get(table),
            table,
          });

          replaceNodeAtPosition({
            pos: tr.mapping.map(pos),
            tr,
            content: controlledTable,
          });
        }

        return tr.steps.length > 0 ? tr : undefined;
      },
    };
  }
}

export class TableRowExtension extends BaseTableRowExtension {
  get name() {
    return "tableRow";
  }

  createNodeSpec(extra, override) {
    const spec = super.createNodeSpec(extra, override);
    spec.content = "(tableCell | tableHeaderCell | tableControllerCell)*";
    spec.toDOM = (node) => ["tr", extra.dom(node), 0];
    spec.allowGapCursor = false;
    return spec;
  }

  createExtensions() {
    return [
      new TableCellExtension({ priority: ExtensionPriority.Low }),
      new TableControllerCellExtension({ priority: ExtensionPriority.Medium }),
      new TableHeaderCellExtension({ priority: ExtensionPriority.Low }),
    ];
  }
}

export class TableHeaderCellExtension extends BaseTableHeaderCellExtension {
  get name() {
    return "tableHeaderCell";
  }

  createNodeSpec(extra, override) {
    const spec = super.createNodeSpec(extra, override);
    spec.attrs = {
      ...spec.attrs,
    };
    spec.allowGapCursor = false;

    return spec;
  }
}

export class TableCellExtension extends BaseTableCellExtension {
  get name() {
    return "tableCell";
  }

  createNodeSpec(extra, override) {
    const spec = super.createNodeSpec(extra, override);
    spec.allowGapCursor = false;
    return spec;
  }
}

export class TableControllerCellExtension extends BaseTableControllerCellExtension {
  createNodeSpec(extra) {
    const cellAttrs = {
      ...extra.defaults(),

      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: { default: null },
      background: { default: null },
    };

    return {
      atom: true,
      isolating: true,
      content: "block*",
      attrs: cellAttrs,
      tableRole: "header_cell",
      parseDOM: [{ tag: "th[data-controller-cell]" }],
      toDOM() {
        return ["th", { "data-controller-cell": "" }, 0];
      },
      allowGapCursor: false,
    };
  }

  createNodeViews() {
    return (node, view, getPos) =>
      new TableControllerCellView(node, view, getPos);
  }

  createExtensions() {
    return [];
  }

  createPlugin() {
    return {
      filterTransaction: (tr) => {
        const controllerCellsWithContent = getChangedNodes(tr, {
          descend: true,
          predicate: (node) => {
            if (node.type !== this.type) {
              return false;
            }

            return node.textContent !== "";
          },
        });

        return controllerCellsWithContent.length === 0;
      },
    };
  }
}
