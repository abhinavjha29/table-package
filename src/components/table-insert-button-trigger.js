import { EditorView } from "@remirror/pm";
import { ExtensionTablesTheme } from "@remirror/theme";

import { borderWidth } from "../const";
import { getCellAxisByMouseEvent } from "../utils/controller";
import { getRelativeCoord, h } from "../utils/dom";
import { setNodeAttrs } from "../utils/prosemirror";

function buildInsertButtonAttrs(type, triggerRect, editorDom, cellAxis) {
  const { row, col } = cellAxis;
  const relativeCoord = getRelativeCoord(triggerRect, editorDom);

  switch (type) {
    case 1: // ADD_COLUMN_BEFORE
      return {
        triggerRect,
        x: relativeCoord.x - borderWidth,
        y: relativeCoord.y + 12,
        row: -1,
        col: col,
      };
    case 2: // ADD_COLUMN_AFTER
      return {
        triggerRect,
        x: relativeCoord.x + triggerRect.width,
        y: relativeCoord.y + 12,
        row: -1,
        col: col + 1,
      };
    case 3: // ADD_ROW_BEFORE
      return {
        triggerRect,
        x: relativeCoord.x + 12,
        y: relativeCoord.y + 5 - borderWidth,
        row: row,
        col: -1,
      };
    default: // ADD_ROW_AFTER
      return {
        triggerRect,
        x: relativeCoord.x + 12,
        y: relativeCoord.y + 5 + triggerRect.height,
        row: row + 1,
        col: -1,
      };
  }
}

function showButton(trigger, findTable, type, axis, view) {
  const triggerRect = trigger?.getBoundingClientRect();

  if (!triggerRect || !(triggerRect.width || triggerRect.height)) {
    return;
  }

  const tableResult = findTable();

  if (!tableResult) {
    return;
  }

  const insertButtonAttrs = buildInsertButtonAttrs(
    type,
    triggerRect,
    view.dom,
    axis
  );
  view.dispatch(
    setNodeAttrs(view.state.tr, tableResult.pos, { insertButtonAttrs })
  );
}

const TriggerArea = ({ isTopLeft, view, findTable }) => {
  const trigger = h("div", {
    className: ExtensionTablesTheme.TABLE_CONTROLLER_TRIGGER_AREA,
    onMouseEnter: (event) => {
      const axis = getCellAxisByMouseEvent(view, event);

      if (axis) {
        let type;

        if (axis.row > 0) {
          type = isTopLeft ? 3 : 4; // ADD_ROW_BEFORE / ADD_ROW_AFTER
        } else if (axis.col > 0) {
          type = isTopLeft ? 1 : 2; // ADD_COLUMN_BEFORE / ADD_COLUMN_AFTER
        }

        if (type) {
          showButton(trigger, findTable, type, axis, view);
        }
      }
    },
  });

  return trigger;
};

const TableInsertButtonTrigger = ({ view, findTable }) => [
  TriggerArea({ view, findTable, isTopLeft: true }),
  TriggerArea({ view, findTable, isTopLeft: false }),
];

export default TableInsertButtonTrigger;
