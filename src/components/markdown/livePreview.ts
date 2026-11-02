import { syntaxTree } from "@codemirror/language";
import { EditorState, Facet, type Extension, type Range } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  keymap,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import { resolveImageSrc } from "@/lib/images";
import { safeUrl } from "@/lib/markdown";

/* True in the reading view: nothing is editable and every Markdown symbol stays hidden. */
export const readingMode = Facet.define<boolean, boolean>({
  combine: (values) => values.some(Boolean),
});

/* The parser library is not a direct dependency, so its node type is taken from the tree. */
type SyntaxNode = ReturnType<typeof syntaxTree>["topNode"];

export function openLink(raw: string): boolean {
  const url = safeUrl(raw);
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

/* The address of the link under a position, or null. Works for [text](url), <url> and bare urls. */
export function urlAtPosition(state: EditorState, pos: number): string | null {
  for (const side of [-1, 1] as const) {
    for (let node: SyntaxNode | null = syntaxTree(state).resolveInner(pos, side); node; node = node.parent) {
      if (node.name === "Link" || node.name === "Autolink") {
        const url = node.getChild("URL");
        if (url) return state.sliceDoc(url.from, url.to);
      }
      if (node.name === "URL") return state.sliceDoc(node.from, node.to);
    }
  }
  return null;
}

/* ---------- Widgets ---------- */

class BulletWidget extends WidgetType {
  eq() {
    return true;
  }
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-bullet";
    span.textContent = "•";
    return span;
  }
}

class RuleWidget extends WidgetType {
  eq() {
    return true;
  }
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-rule";
    return span;
  }
}

class CheckboxWidget extends WidgetType {
  constructor(
    readonly checked: boolean,
    readonly from: number,
    readonly interactive: boolean,
  ) {
    super();
  }
  eq(other: CheckboxWidget) {
    return other.checked === this.checked && other.from === this.from && other.interactive === this.interactive;
  }
  toDOM(view: EditorView) {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.className = "cm-task";
    box.checked = this.checked;
    box.disabled = !this.interactive;
    box.setAttribute("aria-label", "Task");
    if (this.interactive) {
      /* Stop the click from moving the cursor, which would turn the box back into text. */
      box.addEventListener("mousedown", (event) => {
        event.preventDefault();
        const pos = view.posAtDOM(box);
        const marker = view.state.sliceDoc(pos, pos + 3);
        if (marker.length < 3 || marker[0] !== "[" || marker[2] !== "]") return;
        view.dispatch({ changes: { from: pos + 1, to: pos + 2, insert: marker[1] === " " ? "x" : " " } });
      });
    }
    return box;
  }
}

class ImageWidget extends WidgetType {
  constructor(
    readonly src: string,
    readonly alt: string,
    readonly openOnClick: boolean,
  ) {
    super();
  }
  eq(other: ImageWidget) {
    return other.src === this.src && other.alt === this.alt && other.openOnClick === this.openOnClick;
  }
  toDOM(view: EditorView) {
    const wrap = document.createElement("span");
    wrap.className = "cm-image";
    const img = document.createElement("img");
    img.alt = this.alt;
    img.draggable = false;
    img.addEventListener("load", () => view.requestMeasure());
    img.addEventListener("error", () => {
      wrap.classList.add("cm-image-missing");
      wrap.textContent = this.alt ? `Picture not found: ${this.alt}` : "Picture not found";
      view.requestMeasure();
    });
    void resolveImageSrc(this.src).then((url) => {
      if (url) img.src = url;
      else img.dispatchEvent(new Event("error"));
    });
    wrap.append(img);
    wrap.addEventListener("click", (event) => {
      if (!this.openOnClick && !(event.ctrlKey || event.metaKey)) return;
      void resolveImageSrc(this.src).then((url) => url && window.open(url, "_blank", "noopener,noreferrer"));
    });
    return wrap;
  }
}

/* ---------- Decorations ---------- */

const hideMark = Decoration.replace({});
const bulletMark = Decoration.replace({ widget: new BulletWidget() });
const ruleMark = Decoration.replace({ widget: new RuleWidget() });

type Built = { visible: DecorationSet; atomic: DecorationSet };

const IMAGE_SOURCE = /^!\[([^\]\n]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)$/;

function build(view: EditorView): Built {
  const { state } = view;
  const reading = state.facet(readingMode);
  const interactive = !reading;
  const doc = state.doc;
  const visible: Range<Decoration>[] = [];
  const atomic: Range<Decoration>[] = [];

  const editing = interactive && view.hasFocus;
  const touches = (from: number, to: number) =>
    editing && state.selection.ranges.some((range) => range.from <= to && range.to >= from);
  const lineTouched = (pos: number) => {
    const line = doc.lineAt(pos);
    return touches(line.from, line.to);
  };

  const hide = (from: number, to: number) => {
    if (to > from) {
      const range = hideMark.range(from, to);
      visible.push(range);
      atomic.push(range);
    }
  };
  const replaceWith = (decoration: Decoration, from: number, to: number) => {
    const range = decoration.range(from, to);
    visible.push(range);
    atomic.push(range);
  };
  const markRange = (cls: string, from: number, to: number, attributes?: Record<string, string>) => {
    if (to > from) visible.push(Decoration.mark({ class: cls, attributes }).range(from, to));
  };
  const lineClass = (cls: string, from: number, to: number) => {
    for (let pos = from; pos <= to; ) {
      const line = doc.lineAt(pos);
      visible.push(Decoration.line({ class: cls }).range(line.from));
      pos = line.to + 1;
    }
  };
  /* Hides a marker and the single space after it. */
  const hideWithSpace = (from: number, to: number) => {
    hide(from, doc.sliceString(to, to + 1) === " " ? to + 1 : to);
  };

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter: (node) => {
        const name = node.name;

        if (/^ATXHeading[1-6]$/.test(name)) {
          lineClass(`cm-h cm-h${name.slice(-1)}`, node.from, node.from);
          return;
        }
        if (name === "SetextHeading1" || name === "SetextHeading2") {
          lineClass(`cm-h cm-h${name.slice(-1)}`, node.from, node.from);
          return;
        }
        if (name === "HeaderMark" && node.node.parent?.name.startsWith("ATXHeading")) {
          if (!lineTouched(node.from)) hideWithSpace(node.from, node.to);
          return;
        }

        if (name === "StrongEmphasis") return void markRange("cm-strong", node.from, node.to);
        if (name === "Emphasis") return void markRange("cm-em", node.from, node.to);
        if (name === "Strikethrough") return void markRange("cm-strike", node.from, node.to);
        if (name === "InlineCode") return void markRange("cm-inline-code", node.from, node.to);
        if (
          name === "EmphasisMark" ||
          name === "StrikethroughMark" ||
          (name === "CodeMark" && node.node.parent?.name === "InlineCode")
        ) {
          const parent = node.node.parent;
          if (parent && !touches(parent.from, parent.to)) hide(node.from, node.to);
          return;
        }

        if (name === "Link") {
          const marks: SyntaxNode[] = [];
          let url: SyntaxNode | null = null;
          for (let child = node.node.firstChild; child; child = child.nextSibling) {
            if (child.name === "LinkMark") marks.push(child);
            else if (child.name === "URL") url = child;
          }
          if (!url || marks.length < 4) return;
          const href = doc.sliceString(url.from, url.to);
          const label = { from: marks[0].to, to: marks[1].from };
          markRange("cm-link", label.from, label.to, { "data-url": href, title: `${href} (Ctrl+Enter to open)` });
          if (!touches(node.from, node.to)) {
            hide(marks[0].from, marks[0].to);
            hide(marks[1].from, node.to);
          }
          return;
        }
        if (name === "URL" && node.node.parent?.name !== "Link" && node.node.parent?.name !== "Image") {
          const href = doc.sliceString(node.from, node.to);
          markRange("cm-link", node.from, node.to, { "data-url": href, title: "Ctrl+Enter to open" });
          return;
        }

        if (name === "Image") {
          const match = IMAGE_SOURCE.exec(doc.sliceString(node.from, node.to));
          if (match && !touches(node.from, node.to)) {
            replaceWith(
              Decoration.replace({ widget: new ImageWidget(match[2], match[1], reading) }),
              node.from,
              node.to,
            );
            const line = doc.lineAt(node.from);
            if (node.from === line.from && node.to === line.to) lineClass("cm-image-line", line.from, line.from);
          } else {
            markRange("cm-image-source", node.from, node.to);
          }
          return false;
        }

        if (name === "Blockquote") {
          lineClass("cm-quote", node.from, node.to);
          return;
        }
        if (name === "QuoteMark") {
          if (!lineTouched(node.from)) hideWithSpace(node.from, node.to);
          return;
        }

        if (name === "ListMark") {
          const item = node.node.parent;
          const list = item?.parent;
          const isTask = item?.getChild("Task") != null;
          if (!lineTouched(node.from)) {
            if (isTask) hideWithSpace(node.from, node.to);
            else if (list?.name === "BulletList") replaceWith(bulletMark, node.from, node.to);
          }
          return;
        }
        if (name === "TaskMarker") {
          if (!lineTouched(node.from)) {
            const checked = doc.sliceString(node.from + 1, node.from + 2).toLowerCase() === "x";
            replaceWith(
              Decoration.replace({ widget: new CheckboxWidget(checked, node.from, interactive) }),
              node.from,
              node.to,
            );
            if (checked) {
              const line = doc.lineAt(node.from);
              lineClass("cm-task-done", line.from, line.from);
            }
          }
          return;
        }

        if (name === "FencedCode") {
          lineClass("cm-codeblock", node.from, node.to);
          return;
        }
        if (name === "CodeMark" && node.node.parent?.name === "FencedCode") {
          markRange("cm-fence", node.from, node.to);
          return;
        }

        if (name === "HorizontalRule") {
          if (!lineTouched(node.from)) replaceWith(ruleMark, node.from, node.to);
          return;
        }

        if (name === "Table") {
          lineClass("cm-table-line", node.from, node.to);
        }
      },
    });
  }

  return { visible: Decoration.set(visible, true), atomic: Decoration.set(atomic, true) };
}

function livePreviewPlugin(): Extension {
  const plugin = ViewPlugin.fromClass(
    class {
      built: Built;
      constructor(view: EditorView) {
        this.built = build(view);
      }
      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.selectionSet ||
          update.focusChanged ||
          update.startState.facet(readingMode) !== update.state.facet(readingMode) ||
          syntaxTree(update.startState) !== syntaxTree(update.state)
        ) {
          this.built = build(update.view);
        }
      }
    },
    {
      decorations: (instance) => instance.built.visible,
      provide: (self) =>
        EditorView.atomicRanges.of((view) => view.plugin(self)?.built.atomic ?? Decoration.none),
    },
  );
  return plugin;
}

/* ---------- Editing commands ---------- */

/* Wraps the selection in a marker such as ** or *, or removes it if it is already there. */
export function toggleWrap(view: EditorView, marker: string): boolean {
  const { state } = view;
  const changes = state.changeByRange((range) => {
    const before = state.sliceDoc(range.from - marker.length, range.from);
    const after = state.sliceDoc(range.to, range.to + marker.length);
    if (before === marker && after === marker) {
      return {
        changes: [
          { from: range.from - marker.length, to: range.from },
          { from: range.to, to: range.to + marker.length },
        ],
        range: range.extend(range.from - marker.length, range.to - marker.length),
      };
    }
    return {
      changes: [
        { from: range.from, insert: marker },
        { from: range.to, insert: marker },
      ],
      range: range.empty
        ? range.extend(range.from + marker.length)
        : range.extend(range.from + marker.length, range.to + marker.length),
    };
  });
  view.dispatch(state.update(changes, { userEvent: "input", scrollIntoView: true }));
  return true;
}

/* Turns the selection into [text](url) and selects the url so it can be typed over. */
export function insertLink(view: EditorView): boolean {
  const { state } = view;
  const range = state.selection.main;
  const text = state.sliceDoc(range.from, range.to) || "link";
  const insert = `[${text}](url)`;
  const urlFrom = range.from + text.length + 3;
  view.dispatch({
    changes: { from: range.from, to: range.to, insert },
    selection: { anchor: urlFrom, head: urlFrom + 3 },
    userEvent: "input",
    scrollIntoView: true,
  });
  return true;
}

/* Puts a prefix such as "- " or "## " at the start of each selected line, or removes it. */
export function toggleLinePrefix(view: EditorView, prefix: string): boolean {
  const { state } = view;
  const lines = new Set<number>();
  for (const range of state.selection.ranges) {
    for (let pos = range.from; pos <= range.to; ) {
      const line = state.doc.lineAt(pos);
      lines.add(line.from);
      pos = line.to + 1;
    }
  }
  const starts = [...lines].map((from) => state.doc.lineAt(from));
  const allHave = starts.every((line) => line.text.startsWith(prefix));
  view.dispatch({
    changes: starts.map((line) =>
      allHave ? { from: line.from, to: line.from + prefix.length } : { from: line.from, insert: prefix },
    ),
    userEvent: "input",
    scrollIntoView: true,
  });
  return true;
}

export function insertImageMarkdown(view: EditorView, markdown: string, at?: number): void {
  const pos = at ?? view.state.selection.main.head;
  const line = view.state.doc.lineAt(pos);
  const prefix = pos > line.from && view.state.sliceDoc(line.from, pos).trim() !== "" ? "\n" : "";
  const insert = `${prefix}${markdown}\n`;
  view.dispatch({
    changes: { from: pos, insert },
    selection: { anchor: pos + insert.length },
    userEvent: "input.paste",
    scrollIntoView: true,
  });
}

function linkKeymap() {
  /* Not on a link: do nothing here, so the same shortcut can save the entry instead. */
  const open = (view: EditorView) => {
    const url = urlAtPosition(view.state, view.state.selection.main.head);
    return url ? openLink(url) : false;
  };
  return keymap.of([
    { key: "Mod-Enter", run: open },
    { key: "Ctrl-Enter", run: open },
  ]);
}

/* Click on a link: Ctrl or Cmd while editing, a plain click in the read only view. */
function linkClicks(): Extension {
  return EditorView.domEventHandlers({
    mousedown(event, view) {
      if (view.state.facet(readingMode)) return false;
      if (!(event.ctrlKey || event.metaKey) || event.button !== 0) return false;
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-url]");
      const url = target?.dataset.url;
      if (!url) return false;
      event.preventDefault();
      openLink(url);
      return true;
    },
    click(event, view) {
      if (!view.state.facet(readingMode)) return false;
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-url]");
      const url = target?.dataset.url;
      if (!url) return false;
      event.preventDefault();
      openLink(url);
      return true;
    },
  });
}

export function previewExtensions(): Extension[] {
  return [livePreviewPlugin(), linkClicks(), linkKeymap()];
}

/* The extensions that switch the editor between writing and reading. */
export function modeExtensions(reading: boolean): Extension[] {
  return [readingMode.of(reading), EditorView.editable.of(!reading), EditorState.readOnly.of(reading)];
}
