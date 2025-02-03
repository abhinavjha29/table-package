import React, { CSSProperties, MouseEventHandler, useCallback } from "react";

import {
  cx,
  findParentNodeOfType,
  isElementDomNode,
  mergeDOMRects,
} from "@remirror/core";
import {
  defaultAbsolutePosition,
  hasStateChanged,
  isPositionVisible,
  Positioner,
} from "@remirror/extension-positioner";
import {
  deleteColumn,
  deleteRow,
  isCellSelection,
  TableMap,
} from "@remirror/pm/tables";
import { Icon, PositionerPortal } from "@remirror/react-components";
import { useRemirrorContext } from "@remirror/react-core";

import { usePositioner } from "@remirror/react-hooks";
import { ExtensionTablesTheme } from "@remirror/theme";

import {
  CellSelectionType,
  getCellSelectionType,
  setPredelete,
} from "../utils/controller";

function createDeleteButtonPositioner() {
  return Positioner.create({
    hasChanged: hasStateChanged,

    getActive(props) {
      const { state } = props;
      const { selection } = state;

      if (isCellSelection(selection)) {
        const cellSelectionType = getCellSelectionType(selection);

        if (
          cellSelectionType === CellSelectionType.col ||
          cellSelectionType === CellSelectionType.row
        ) {
          const tableResult = findParentNodeOfType({
            types: "table",
            selection,
          });

          if (tableResult) {
            const positionerData = {
              tableResult,
              cellSelectionType,
              anchorCellPos: selection.$anchorCell.pos,
              headCellPos: selection.$headCell.pos,
            };
            return [positionerData];
          }
        }
      }

      return Positioner.EMPTY;
    },

    getPosition(props) {
      const { view, data } = props;

      const anchorCellDOM = view.nodeDOM(data.anchorCellPos);
      const headCellDOM = view.nodeDOM(data.headCellPos);

      if (
        !anchorCellDOM ||
        !headCellDOM ||
        !isElementDomNode(anchorCellDOM) ||
        !isElementDomNode(headCellDOM)
      ) {
        return defaultAbsolutePosition;
      }

      const map = TableMap.get(data.tableResult.node);

      // Don't show the delete button if there is only one row/column (excluded controllers).
      if (data.cellSelectionType === CellSelectionType.col && map.width <= 2) {
        return defaultAbsolutePosition;
      } else if (
        data.cellSelectionType === CellSelectionType.row &&
        map.height <= 2
      ) {
        return defaultAbsolutePosition;
      }

      const anchorCellRect = anchorCellDOM.getBoundingClientRect();
      const headCellRect = headCellDOM.getBoundingClientRect();
      const rect = mergeDOMRects(anchorCellRect, headCellRect);
      const editorRect = view.dom.getBoundingClientRect();

      // The width and height of the current selected block node.
      const height = rect.height;
      const width = rect.width;

      // The top and left relative to the parent `editorRect`.
      const left = view.dom.scrollLeft + rect.left - editorRect.left;
      const top = view.dom.scrollTop + rect.top - editorRect.top;
      const visible = isPositionVisible(rect, view.dom);

      const margin = 16;

      return data.cellSelectionType === CellSelectionType.row
        ? {
            rect,
            visible,
            height: 0,
            width: 0,
            x: left - margin,
            y: top + height / 2,
          }
        : {
            rect,
            visible,
            height: 0,
            width: 0,
            x: left + width / 2,
            y: top - margin,
          };
    },
  });
}

export const TableDeleteRowColumnInnerButton = ({
  position,
  onClick,
  onMouseDown,
  onMouseOver,
  onMouseOut,
}) => {
  const size = 18;
  return (
    <button
      ref={position.ref}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      style={{
        "--remirror-table-delete-row-column-button-y": `${position.y}px`,
        "--remirror-table-delete-row-column-button-x": `${position.x}px`,
      }}
      className={cx(
        ExtensionTablesTheme.TABLE_DELETE_INNER_BUTTON,
        ExtensionTablesTheme.TABLE_DELETE_ROW_COLUMN_INNER_BUTTON
      )}
    >
      <Icon name="closeFill" size={size} color={"#ffffff"} />
    </button>
  );
};

const deleteButtonPositioner = createDeleteButtonPositioner();

function usePosition() {
  const position = usePositioner(deleteButtonPositioner, []);
  return position;
}

function useEvents(view) {
  const handleClick = useCallback(() => {
    const selection = view.state.selection;

    if (isCellSelection(selection)) {
      const cellSelectionType = getCellSelectionType(selection);

      if (cellSelectionType === CellSelectionType.row) {
        deleteRow(view.state, view.dispatch);
      } else if (cellSelectionType === CellSelectionType.col) {
        deleteColumn(view.state, view.dispatch);
      }
    }
  }, [view]);

  const handleMouseOver = useCallback(() => setPredelete(view, true), [view]);

  const handleMouseOut = useCallback(() => setPredelete(view, false), [view]);

  return { handleClick, handleMouseOver, handleMouseOut };
}

export const TableDeleteRowColumnButton = ({ Component }) => {
  const { view } = useRemirrorContext();
  const position = usePosition();
  const { handleClick, handleMouseOver, handleMouseOut } = useEvents(view);

  Component = Component ?? TableDeleteRowColumnInnerButton;

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
  }, []);

  return (
    <PositionerPortal>
      <Component
        position={position}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      />
    </PositionerPortal>
  );
};
