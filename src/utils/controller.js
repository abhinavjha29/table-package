import { Fragment, Node as ProsemirrorNode } from "@remirror/pm/model";
import { cellAround, CellSelection, TableMap } from "@remirror/pm/tables";

import { domCellAround } from "../table-column-resizing";
import {
  resetControllerPluginMeta,
  setControllerPluginMeta,
} from "../table-plugins";
import { cellSelectionToSelection } from "./prosemirror";
import { repeat } from "./array";

export function injectControllers({ schema, getMap, table: oldTable }) {
  const controllerCell = schema.nodes.tableControllerCell.create();
  const headerControllerCells = repeat(controllerCell, getMap().width + 1);

  const controllerRow = schema.nodes.tableRow.create({}, headerControllerCells);
  const newRowsArray = [controllerRow];

  const oldRows = oldTable.content;
  oldRows.forEach((oldRow) => {
    if (oldRow.content.child(0).type === schema.nodes.tableControllerCell) {
      newRowsArray.push(oldRow.copy());
      return;
    }

    const oldCells = oldRow.content;
    const newCells = Fragment.from(controllerCell).append(oldCells);
    const newRow = oldRow.copy(newCells);
    newRowsArray.push(newRow);
  });

  const newRows = Fragment.fromArray(newRowsArray);
  const newTable = oldTable.copy(newRows);

  newTable.attrs = {
    ...newTable.attrs,
    isControllersInjected: true,
  };

  return newTable;
}

export function createControllerEvents({ view, findTable }) {
  return {
    onClick: (event) => {
      const axis = getCellAxisByMouseEvent(view, event);

      if (axis) {
        if (axis.row > 0) {
          selectRow(view, findTable, axis.row);
        } else if (axis.col > 0) {
          selectColumn(view, findTable, axis.col);
        } else {
          selectTable(view, findTable);
        }
      }
    },
    onMouseEnter: (event) => {
      const axis = getCellAxisByMouseEvent(view, event);

      if (axis) {
        if (axis.row > 0) {
          setPreselectRow(view, axis.row);
        } else if (axis.col > 0) {
          setPreselectColumn(view, axis.col);
        } else {
          setPreselectTable(view, true);
        }
      }
    },
    onMouseLeave: () => {
      resetPreselection(view);
    },
  };
}

function onlyTableFound(func) {
  return (view, findTable, ...extra) => {
    const found = findTable();

    if (!found) {
      return;
    }

    return func(view, found, ...extra);
  };
}

const selectRow = onlyTableFound((view, table, index) => {
  const map = TableMap.get(table.node);
  const cellIndex = getCellIndex(map, index, 0);
  let tr = view.state.tr;
  const posInTable = map.map[cellIndex + 1];
  const pos = table.pos + posInTable + 1;
  const $pos = tr.doc.resolve(pos);
  const selection = CellSelection.rowSelection($pos);
  tr = tr.setSelection(cellSelectionToSelection(selection));
  view.dispatch(tr);
});

const selectColumn = onlyTableFound((view, table, index) => {
  const map = TableMap.get(table.node);
  const cellIndex = getCellIndex(map, 0, index);
  let tr = view.state.tr;
  const posInTable = map.map[cellIndex];
  const pos = table.pos + posInTable + 1;
  const $pos = tr.doc.resolve(pos);
  const selection = CellSelection.colSelection($pos);
  tr = tr.setSelection(cellSelectionToSelection(selection));
  view.dispatch(tr);
});

const selectTable = onlyTableFound((view, table) => {
  const map = TableMap.get(table.node);

  if (map.map.length > 0) {
    let tr = view.state.tr;
    const firstCellPosInTable = map.map[0];
    const lastCellPosInTable = map.map[map.map.length - 1];
    const firstCellPos = table.pos + firstCellPosInTable + 1;
    const lastCellPos = table.pos + lastCellPosInTable + 1;
    const $firstCellPos = tr.doc.resolve(firstCellPos);
    const $lastCellPos = tr.doc.resolve(lastCellPos);
    const selection = new CellSelection($firstCellPos, $lastCellPos);
    tr = tr.setSelection(cellSelectionToSelection(selection));
    view.dispatch(tr);
  }
});

function setPreselectRow(view, index) {
  view.dispatch(
    setControllerPluginMeta(view.state.tr, { preselectRow: index })
  );
}

function setPreselectColumn(view, index) {
  view.dispatch(
    setControllerPluginMeta(view.state.tr, { preselectColumn: index })
  );
}

function setPreselectTable(view, value) {
  view.dispatch(
    setControllerPluginMeta(view.state.tr, { preselectTable: value })
  );
}

export function setPredelete(view, value) {
  view.dispatch(setControllerPluginMeta(view.state.tr, { predelete: value }));
}

function resetPreselection(view) {
  view.dispatch(resetControllerPluginMeta(view.state.tr));
}

function getCellIndex(map, rowIndex, colIndex) {
  return map.width * rowIndex + colIndex;
}

export function getCellAxisByMouseEvent(view, event) {
  const domCell = domCellAround(event.target);

  if (!domCell) {
    return null;
  }

  const domCellRect = domCell.getBoundingClientRect();
  return getCellAxisByCoords(view, {
    left: domCellRect.left + 1,
    top: domCellRect.top + 1,
  });
}

export function getCellAxisByCoords(view, coords) {
  const cellPos = view.posAtCoords(coords);

  if (!cellPos) {
    return null;
  }

  const $cell = cellAround(view.state.doc.resolve(cellPos.pos));

  if (!$cell) {
    return null;
  }

  const map = TableMap.get($cell.node(-1));
  const start = $cell.start(-1);
  const rect = map.findCell($cell.pos - start);
  const { left: col, top: row } = rect;

  return { col, row };
}

export const CellSelectionType = {
  row: 1,
  col: 2,
  table: 3,
  other: 4,
};

export function getCellSelectionType(selection) {
  if (selection.isRowSelection()) {
    if (selection.isColSelection()) {
      return CellSelectionType.table;
    }

    return CellSelectionType.row;
  } else if (selection.isColSelection()) {
    return CellSelectionType.col;
  }

  return CellSelectionType.other;
}
