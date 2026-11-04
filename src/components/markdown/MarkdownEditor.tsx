"use client";

import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder as placeholderExtension } from "@codemirror/view";
import { useEffect, useRef, useState } from "react";
import { IMAGE_ACCEPT, addImage } from "@/lib/images";
import {
  insertImageMarkdown,
  insertLink,
  modeExtensions,
  previewExtensions,
  toggleLinePrefix,
  toggleWrap,
} from "./livePreview";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  /* Puts the cursor at the end of the text as soon as the editor opens. */
  autoFocus?: boolean;
};

type ToolbarButton = { label: string; title: string; run: (view: EditorView) => void; className?: string };

const TOOLS: ToolbarButton[] = [
  { label: "B", title: "Bold (Ctrl+B)", run: (view) => toggleWrap(view, "**"), className: "font-bold" },
  { label: "I", title: "Italic (Ctrl+I)", run: (view) => toggleWrap(view, "*"), className: "italic" },
  { label: "H", title: "Heading", run: (view) => toggleLinePrefix(view, "## "), className: "font-display font-bold" },
  { label: "Link", title: "Link (Ctrl+K)", run: (view) => insertLink(view) },
  { label: "•", title: "Bulleted list", run: (view) => toggleLinePrefix(view, "- ") },
  { label: "☑", title: "Checklist", run: (view) => toggleLinePrefix(view, "- [ ] ") },
  { label: "”", title: "Quote", run: (view) => toggleLinePrefix(view, "> ") },
];

export function MarkdownEditor({ value, onChange, placeholder, label, autoFocus = false }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const mode = useRef(new Compartment());

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  async function addFiles(files: File[], at?: number) {
    const view = viewRef.current;
    const pictures = files.filter((file) => file.type.startsWith("image/"));
    if (!view || pictures.length === 0) return;
    setBusy(true);
    setNotice(null);
    let position = at;
    try {
      for (const file of pictures) {
        const markdownText = await addImage(file);
        insertImageMarkdown(view, markdownText, position);
        position = undefined;
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The picture could not be added.");
    } finally {
      setBusy(false);
      view.focus();
    }
  }
  const addFilesRef = useRef(addFiles);
  useEffect(() => {
    addFilesRef.current = addFiles;
  });

  useEffect(() => {
    if (!host.current) return;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          keymap.of([
            { key: "Mod-b", run: (v) => toggleWrap(v, "**") },
            { key: "Mod-i", run: (v) => toggleWrap(v, "*") },
            { key: "Mod-k", run: (v) => insertLink(v) },
          ]),
          mode.current.of(modeExtensions(false)),
          ...previewExtensions(),
          /* Ctrl+Enter is taken by link opening and saving, so the default blank line shortcut goes. */
          keymap.of([...defaultKeymap.filter((binding) => binding.key !== "Mod-Enter"), ...historyKeymap]),
          markdown({ base: markdownLanguage }),
          EditorView.lineWrapping,
          placeholderExtension(placeholder ?? ""),
          EditorView.contentAttributes.of({ "aria-label": label, "aria-multiline": "true" }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
          EditorView.domEventHandlers({
            paste(event) {
              const files = Array.from(event.clipboardData?.files ?? []);
              if (!files.some((file) => file.type.startsWith("image/"))) return false;
              event.preventDefault();
              void addFilesRef.current(files);
              return true;
            },
            drop(event, editor) {
              const files = Array.from(event.dataTransfer?.files ?? []);
              if (!files.some((file) => file.type.startsWith("image/"))) return false;
              event.preventDefault();
              const at = editor.posAtCoords({ x: event.clientX, y: event.clientY }) ?? undefined;
              void addFilesRef.current(files, at);
              return true;
            },
          }),
        ],
      }),
    });
    viewRef.current = view;
    if (autoFocus) {
      view.dispatch({ selection: { anchor: view.state.doc.length } });
      view.focus();
    }
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // The editor is created once. Later changes to value are synced by the effect below.
    // autoFocus only matters on the first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Keeps the editor in step if the text is replaced from outside. */
  useEffect(() => {
    const view = viewRef.current;
    if (view && view.state.doc.toString() !== value) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    }
  }, [value]);

  /* Switches between writing and reading, like Obsidian. Ctrl+E does the same. */
  useEffect(() => {
    viewRef.current?.dispatch({ effects: mode.current.reconfigure(modeExtensions(reading)) });
    if (reading) (document.activeElement as HTMLElement | null)?.blur();
  }, [reading]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "e") {
        event.preventDefault();
        setReading((current) => !current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function runTool(run: ToolbarButton["run"]) {
    const view = viewRef.current;
    if (!view) return;
    run(view);
    view.focus();
  }

  return (
    <div>
      <div className="lt-editor rounded-xl border border-sand-300 bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30 dark:border-sand-700 dark:bg-sand-950">
        <div
          role="toolbar"
          aria-label="Formatting"
          className="flex flex-wrap items-center gap-1 border-b border-sand-200 px-2 py-1.5 dark:border-sand-800"
        >
          {TOOLS.map((tool) => (
            <button
              key={tool.title}
              type="button"
              title={tool.title}
              aria-label={tool.title}
              disabled={reading}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => runTool(tool.run)}
              className={`min-w-8 rounded-md px-2 py-1 text-sm text-sand-700 hover:bg-sand-100 disabled:opacity-40 dark:text-sand-300 dark:hover:bg-sand-800 ${tool.className ?? ""}`}
            >
              {tool.label}
            </button>
          ))}
          <button
            type="button"
            title="Add a picture"
            aria-label="Add a picture"
            disabled={busy || reading}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => fileInput.current?.click()}
            className="ml-1 rounded-md px-2 py-1 text-sm text-sand-700 hover:bg-sand-100 disabled:opacity-60 dark:text-sand-300 dark:hover:bg-sand-800"
          >
            {busy ? "Adding..." : "🖼 Picture"}
          </button>
          <button
            type="button"
            title={reading ? "Back to editing (Ctrl+E)" : "Switch to reading view (Ctrl+E)"}
            aria-pressed={reading}
            data-testid="reading-toggle"
            onClick={() => setReading((current) => !current)}
            className={`ml-auto rounded-md px-2.5 py-1 text-sm font-medium ${
              reading
                ? "bg-gold-100 text-sand-900 dark:bg-gold-400/20 dark:text-gold-200"
                : "text-sand-700 hover:bg-sand-100 dark:text-sand-300 dark:hover:bg-sand-800"
            }`}
          >
            {reading ? "✏️ Edit" : "📖 Read"}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            hidden
            data-testid="picture-input"
            onChange={(event) => {
              void addFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
        </div>
        <div ref={host} className="lt-md min-h-64" />
      </div>
      <p className="mt-1.5 text-xs text-sand-500">
        Markdown works here. Paste or drop pictures. Ctrl+Enter opens a link, or saves when you are not on one. Ctrl+E switches to reading.
      </p>
      {notice && (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {notice}
        </p>
      )}
    </div>
  );
}
