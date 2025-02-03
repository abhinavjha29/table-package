function updateColumnsOnResize(
  node,
  colgroup,
  table,
  cellMinWidth,
  overrideCol,
  overrideValue
) {
  var _a;
  let totalWidth = 0;
  let fixedWidth = true;
  let nextDOM = colgroup.firstChild;
  const row = node.firstChild;

  if (!row) return;
  for (let i = 0, col = 0; i < row.childCount; i++) {
    console.log("row is", i, row);
    console.log("overridevalue is", overrideValue, "overRifr", overrideCol);
    const { colspan, colwidth } = row.child(i).attrs;
    console.log("attrs=>", row.child(i).attrs);
    console.log(colwidth, colspan);
    for (let j = 0; j < colspan; j++, col++) {
      const hasWidth =
        overrideCol == col ? overrideValue : colwidth && colwidth[j];
      console.log("hasWidth", hasWidth);
      console.log({ hasWidth, overrideCol, col, colwidth });
      const cssWidth = hasWidth ? hasWidth + "px" : "";
      totalWidth += hasWidth || cellMinWidth;
      // if (!hasWidth)
      //   fixedWidth = false;
      if (!nextDOM) {
        colgroup.appendChild(document.createElement("col")).style.width =
          cssWidth;
      } else {
        if (nextDOM.style.width != cssWidth) nextDOM.style.width = cssWidth;
        nextDOM = nextDOM.nextSibling;
      }
    }
  }
  while (nextDOM) {
    const after = nextDOM.nextSibling;
    (_a = nextDOM.parentNode) == null ? void 0 : _a.removeChild(nextDOM);
    nextDOM = after;
  }
  // table.style.width = totalWidth + "px";
  // table.style.minWidth = "";
  console.log(fixedWidth);
  if (fixedWidth) {
    table.style.width = totalWidth + "px";
    table.style.minWidth = "";
  } else {
    table.style.width = "";
    table.style.minWidth = totalWidth + "px";
  }
}
