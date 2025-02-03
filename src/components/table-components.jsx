import React from "react";
import { useHelpers } from "@remirror/react-core";

import { TableCellMenu } from "./table-cell-menu.jsx";
import { TableDeleteRowColumnButton } from "./table-delete-row-column-button.jsx";
import { TableDeleteButton } from "./table-delete-table-button.jsx";

const TableComponents = ({
  enableTableCellMenu = true,
  enableTableDeleteRowColumnButton = true,
  enableTableDeleteButton = true,
  tableCellMenuProps,
  tableDeleteRowColumnButtonProps,
  tableDeleteButtonProps,
}) => {
  const { isViewEditable } = useHelpers();

  if (!isViewEditable()) {
    return null;
  }

  return (
    <>
      {enableTableCellMenu && <TableCellMenu {...tableCellMenuProps} />}
      {enableTableDeleteRowColumnButton && (
        <TableDeleteRowColumnButton {...tableDeleteRowColumnButtonProps} />
      )}
      {enableTableDeleteButton && (
        <TableDeleteButton {...tableDeleteButtonProps} />
      )}
    </>
  );
};

export { TableComponents };
