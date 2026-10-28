"use client";

import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";

/*
Loaded on demand through next/dynamic so the picker's size only
costs anything when someone actually opens it.
Native style uses the device's own emoji, so it works fully offline.
*/
export default function EmojiPickerPanel({
  onPick,
}: {
  onPick: (emoji: string) => void;
}) {
  return (
    <EmojiPicker
      onEmojiClick={(data) => onPick(data.emoji)}
      emojiStyle={EmojiStyle.NATIVE}
      theme={Theme.AUTO}
      width="100%"
      height={340}
      lazyLoadEmojis
      previewConfig={{ showPreview: false }}
    />
  );
}
