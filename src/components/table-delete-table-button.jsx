import React, { CSSProperties, MouseEventHandler, useCallback } from "react";
import {
  cx,
  findParentNodeOfType,
  isElementDomNode,
  last,
  mergeDOMRects,
} from "@remirror/core";
import {
  defaultAbsolutePosition,
  hasStateChanged,
  isPositionVisible,
  Positioner,
} from "@remirror/extension-positioner";
import { TableMap } from "@remirror/pm/tables";
import { Icon, PositionerPortal } from "@remirror/react-components";
import { useCommands } from "@remirror/react-core";
import { usePositioner } from "@remirror/react-hooks";
import { ExtensionTablesTheme } from "@remirror/theme";
import {
  resetControllerPluginMeta,
  setControllerPluginMeta,
} from "../table-plugins";

const highlightTable = ({ tr, dispatch }) => {
  const node = findParentNodeOfType({
    types: "table",
    selection: tr.selection,
  });

  if (!node) {
    return false;
  }

  dispatch?.(
    setControllerPluginMeta(tr, { preselectTable: true, predelete: true })
  );
  return true;
};

const unhighlightTable = ({ tr, dispatch }) => {
  dispatch?.(resetControllerPluginMeta(tr));
  return true;
};

function createDeleteTableButtonPositioner() {
  return Positioner.create({
    hasChanged: hasStateChanged,

    getActive(props) {
      const { selection } = props.state;
      const tableResult = findParentNodeOfType({ types: "table", selection });

      if (tableResult) {
        return [{ tableResult }];
      }

      return Positioner.EMPTY;
    },

    getPosition(props) {
      const { view, data } = props;
      const { node, pos } = data.tableResult;
      const map = TableMap.get(node);

      const firstCellDOM = view.nodeDOM(pos + map.map[0] + 1);
      const lastCellDOM = view.nodeDOM(pos + last(map.map) + 1);

      if (
        !firstCellDOM ||
        !lastCellDOM ||
        !isElementDomNode(firstCellDOM) ||
        !isElementDomNode(lastCellDOM)
      ) {
        return defaultAbsolutePosition;
      }

      const rect = mergeDOMRects(
        firstCellDOM.getBoundingClientRect(),
        lastCellDOM.getBoundingClientRect()
      );
      const editorRect = view.dom.getBoundingClientRect();

      const left = view.dom.scrollLeft + rect.left - editorRect.left;
      const top = view.dom.scrollTop + rect.top - editorRect.top;
      const visible = isPositionVisible(rect, view.dom);

      const margin = 16;

      return {
        rect,
        visible,
        height: 0,
        width: 0,
        x: left + rect.width / 2,
        y: top + rect.height + margin,
      };
    },
  });
}

const TableDeleteInnerButton = ({
  position,
  onClick,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
}) => {
  const size = 18;

  return (
    <button
      ref={position.ref}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        "--remirror-table-delete-button-y": `${position.y}px`,
        "--remirror-table-delete-button-x": `${position.x}px`,
      }}
      className={cx(
        ExtensionTablesTheme.TABLE_DELETE_INNER_BUTTON,
        ExtensionTablesTheme.TABLE_DELETE_TABLE_INNER_BUTTON
      )}
    >
      <Icon name="deleteBinLine" size={size} color="#ffffff" />
    </button>
  );
};

const deleteButtonPositioner = createDeleteTableButtonPositioner();

function usePosition() {
  return usePositioner(deleteButtonPositioner, []);
}

export const TableDeleteButton = ({ Component }) => {
  const position = usePosition();
  const { customDispatch, deleteTable } = useCommands();

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleMouseEnter = useCallback(() => {
    customDispatch(highlightTable);
  }, [customDispatch]);

  const handleMouseLeave = useCallback(() => {
    customDispatch(unhighlightTable);
  }, [customDispatch]);

  const handleClick = useCallback(() => {
    deleteTable();
  }, [deleteTable]);

  Component = Component ?? TableDeleteInnerButton;

  return (
    <PositionerPortal>
      <Component
        position={position}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    </PositionerPortal>
  );
};
