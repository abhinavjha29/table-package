import { ProsemirrorNode } from "@remirror/pm";
import { Fragment, Slice } from "@remirror/pm/model";
import { Selection } from "@remirror/pm/state";
import { CellSelection } from "@remirror/pm/tables";
import { ReplaceAroundStep, Transform } from "@remirror/pm/transform";

/**
 * Change the attributes of the node at `pos`.
 *
 * This is different from `Transform.setNodeMarkup` in that it only overwrites fields that appear in `attrs`.
 */
export function setNodeAttrs(tr, pos, attrs, node) {
  node = node || tr.doc.nodeAt(pos);

  if (!node) {
    throw new RangeError("No node at given position");
  }

  const type = node.type;
  const newNode = type.create(
    { ...node.attrs, ...attrs },
    undefined,
    node.marks
  );

  if (node.isLeaf) {
    return tr.replaceWith(pos, pos + node.nodeSize, newNode);
  }

  if (!type.validContent(node.content)) {
    throw new RangeError(`Invalid content for node type ${type.name}`);
  }

  return tr.step(
    new ReplaceAroundStep(
      pos,
      pos + node.nodeSize,
      pos + 1,
      pos + node.nodeSize - 1,
      new Slice(Fragment.from(newNode), 0, 0),
      1,
      true
    )
  );
}

// TODO: https://github.com/ProseMirror/prosemirror-tables/pull/126
export function selectionToCellSelection(selection) {
  return selection; // Just return the selection since we're treating it as a CellSelection
}

export function cellSelectionToSelection(selection) {
  return selection; // Just return the CellSelection as a regular Selection
}
