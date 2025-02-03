import { cx, isNullOrUndefined } from "@remirror/core";

/**
 * Creates an HTML element with given attributes and children.
 */
export function h(tagName, attrs, ...children) {
  const element = document.createElement(tagName);

  if (attrs) {
    for (let [key, value] of Object.entries(attrs)) {
      if (isNullOrUndefined(value)) {
        continue;
      }

      key = key.toLowerCase();

      if (/^on[a-z]+/.test(key) && typeof value === "function") {
        element.addEventListener(key.slice(2), value);
      } else if (["class", "classname"].includes(key)) {
        element.className = cx(value);
      } else if (key === "dataset") {
        for (const [dataKey, dataValue] of Object.entries(value)) {
          element.dataset[dataKey] = dataValue;
        }
      } else if (key === "style" && typeof value === "object") {
        Object.assign(element.style, value);
      } else if (["number", "boolean", "string"].includes(typeof value)) {
        element.setAttribute(key, `${value}`);
      } else {
        throw new TypeError(
          `Unexpected ${typeof value} value for attribute "${key}"`
        );
      }
    }
  }

  element.append(...children);
  return element;
}

/**
 * Stops the event propagation and prevents its default behavior.
 */
export function stopEvent(e) {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * Calculates the relative coordinates of a point within a parent element.
 */
export function getRelativeCoord(absoluteCoord, parent) {
  const parentRect = parent.getBoundingClientRect();
  return {
    x: absoluteCoord.x + parent.scrollLeft - parentRect.left,
    y: absoluteCoord.y + parent.scrollTop - parentRect.top,
  };
}

/**
 * Calculates the absolute coordinates of a point based on its position within a parent element.
 */
export function getAbsoluteCoord(relativeCoord, parent) {
  const parentRect = parent.getBoundingClientRect();
  return {
    x: relativeCoord.x - parent.scrollLeft + parentRect.left,
    y: relativeCoord.y - parent.scrollTop + parentRect.top,
  };
}

/**
 * Dummy event handler type for various event types.
 */
export function EventHandler(e) {
  // Placeholder for event handling logic
}

export const DOMEvents = {};

/**
 * Creates event handler functions for various DOM events.
 */
export const eventTypes = [
  "Clipboard",
  "Composition",
  "Focus",
  "Form",
  "Keyboard",
  "Mouse",
  "Touch",
  "Pointer",
  "UI",
  "Wheel",
  "Animation",
  "Transition",
];

eventTypes.forEach((eventType) => {
  DOMEvents[`on${eventType}`] = undefined;
  DOMEvents[`on${eventType}Capture`] = undefined;
  DOMEvents[`on${eventType}End`] = undefined;
  DOMEvents[`on${eventType}EndCapture`] = undefined;
});
