import { EditorView, findParentNodeOfType } from "@remirror/core";
import { ExtensionTablesTheme } from "@remirror/theme";

import { createControllerEvents } from "../utils/controller";
import { h } from "../utils/dom";
import TableInsertButtonTrigger from "./table-insert-button-trigger";
import TableInsertMark from "./table-insert-mark";

const TableControllerCell = ({ view, getPos, contentDOM }) => {
  const findTable = () => {
    return findParentNodeOfType({
      types: "table",
      selection: view.state.doc.resolve(getPos()),
    });
  };

  const events = createControllerEvents({ view, findTable });

  const childNodes = view.editable
    ? [...TableInsertButtonTrigger({ view, findTable }), ...TableInsertMark()]
    : [];

  const wrapper = h(
    "div",
    {
      contentEditable: "false",
      className: ExtensionTablesTheme.TABLE_CONTROLLER_WRAPPER,
    },
    contentDOM,
    ...childNodes
  );

  return h(
    "th",
    {
      contentEditable: "false",
      className: `${ExtensionTablesTheme.TABLE_CONTROLLER} ${ExtensionTablesTheme.CONTROLLERS_TOGGLE}`,
      dataset: {
        controllerCell: "",
      },
      ...events,
    },
    wrapper
  );
};

export default TableControllerCell;
