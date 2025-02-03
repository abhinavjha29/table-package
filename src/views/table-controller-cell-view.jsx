import TableControllerCell from "../components/table-controller-cell";
import { h } from "../utils/dom";

export class TableControllerCellView {
  constructor(node, view, getPos) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    this.contentDOM = h("div", { contentEditable: "false" });
    this.dom = TableControllerCell({
      view: this.view,
      getPos: this.getPos,
      contentDOM: this.contentDOM,
    });
  }

  // When a DOM mutation happens (e.g., the button show or hide), don't let
  // ProseMirror re-render the view.
  ignoreMutation() {
    return true;
  }

  // Don't let ProseMirror handle the DOM event (e.g., onclick).
  stopEvent() {
    return true;
  }
}
