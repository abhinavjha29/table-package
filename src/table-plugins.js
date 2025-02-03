import { css } from "@emotion/css";
import { findParentNodeOfType } from "@remirror/core";
import { Plugin, PluginKey, Transaction } from "@remirror/pm/state";
import { Decoration, DecorationSet } from "@remirror/pm/view";
import { ExtensionTablesTheme, getThemeVar } from "@remirror/theme";

const preselectBorderColor = getThemeVar(
  "color",
  "table",
  "preselect",
  "border"
);
const preselectControllerBackgroundColor = getThemeVar(
  "color",
  "table",
  "preselect",
  "controller"
);

export function getTableStyle(attrs) {
  const preselectClass = css`
    /* Make the border-style 'double' instead of 'solid'. This works because 'double' has a higher priority than 'solid' */
    border-style: double;
    border-color: ${preselectBorderColor};
  `;

  const preselectControllerClass = css`
    ${preselectClass}
    background-color: ${preselectControllerBackgroundColor};
  `;

  let classNames = "";

  if (attrs.preselectColumn !== -1) {
    classNames = css`
      & table.${ExtensionTablesTheme.TABLE} tbody tr {
        th,
        td {
          &:nth-child(${attrs.preselectColumn + 1}) {
            ${preselectClass};
          }
        }
        th.${ExtensionTablesTheme.TABLE_CONTROLLER}:nth-child(${attrs.preselectColumn +
          1}) {
          ${preselectControllerClass}
        }
      }
    `;
  } else if (attrs.preselectRow !== -1) {
    classNames = css`
      &
        table.${ExtensionTablesTheme.TABLE}
        tbody
        tr:nth-child(${attrs.preselectRow + 1}) {
        td,
        th {
          ${preselectClass};
        }
        th.${ExtensionTablesTheme.TABLE_CONTROLLER} {
          ${preselectControllerClass}
        }
      }
    `;
  } else if (attrs.preselectTable) {
    classNames = css`
      &.${ExtensionTablesTheme.TABLE_PRESELECT_ALL}
        table.${ExtensionTablesTheme.TABLE}
        tbody
        tr {
        td,
        th {
          ${preselectClass};
        }
        th.${ExtensionTablesTheme.TABLE_CONTROLLER} {
          ${preselectControllerClass}
        }
      }
    `;
  }

  return classNames;
}

const key = new PluginKey("remirrorTableControllerPluginKey");

export { key as tableControllerPluginKey };

export function createTableControllerPlugin() {
  return new Plugin({
    key: key,
    state: {
      init() {
        return new ControllerState({});
      },
      apply(tr, prev) {
        return prev.apply(tr);
      },
    },
    props: {
      decorations: (state) => {
        const controllerState = key.getState(state);

        if (!controllerState) {
          return null;
        }

        const { tableNodeResult, predelete, preselectTable } =
          controllerState.values;

        if (tableNodeResult) {
          const styleClassName = getTableStyle(controllerState.values);
          let className = `${ExtensionTablesTheme.TABLE_SHOW_CONTROLLERS} ${styleClassName}`;

          if (preselectTable) {
            className += ` ${ExtensionTablesTheme.TABLE_PRESELECT_ALL}`;
          }

          if (predelete) {
            className += ` ${ExtensionTablesTheme.TABLE_SHOW_PREDELETE}`;
          }

          const decorations = [
            Decoration.node(tableNodeResult.pos, tableNodeResult.end, {
              class: className,
            }),
          ];
          return DecorationSet.create(state.doc, decorations);
        }

        return null;
      },
    },
  });
}

class ControllerState {
  constructor(action) {
    this.values = {
      tableNodeResult: null,
      preselectTable: false,
      preselectColumn: -1,
      preselectRow: -1,
      predelete: false,
      insertButtonAttrs: null,
      ...action,
    };
  }

  apply(tr) {
    this.values.tableNodeResult = findParentNodeOfType({
      types: "table",
      selection: tr.selection,
    });

    const props = tr.getMeta(key);

    if (props) {
      return new ControllerState({ ...this.values, ...props });
    }

    return this;
  }
}

export function setControllerPluginMeta(tr, props) {
  return tr.setMeta(key, props);
}

export function resetControllerPluginMeta(tr) {
  return setControllerPluginMeta(tr, {
    preselectRow: -1,
    preselectColumn: -1,
    preselectTable: false,
    predelete: false,
  });
}
