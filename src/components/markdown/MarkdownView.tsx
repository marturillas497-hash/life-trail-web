"use client";

import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useEffect, useRef } from "react";
import { modeExtensions, previewExtensions } from "./livePreview";

/* Shows saved entry text exactly as the editor renders it, with nothing editable. */
export function MarkdownView({ value }: { value: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!host.current) return;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          ...modeExtensions(true),
          ...previewExtensions(),
          markdown({ base: markdownLanguage }),
          EditorView.lineWrapping,
        ],
      }),
    });
    return () => view.destroy();
  }, [value]);

  return <div ref={host} className="lt-md lt-md-view" />;
}
