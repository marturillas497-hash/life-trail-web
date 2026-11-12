"use client";

import { useEffect, useState } from "react";
import { OPEN_PICTURE_EVENT, type OpenPictureDetail } from "@/lib/pictureViewer";
import { Lightbox } from "./Lightbox";

/* Listens for pressed pictures in entries and shows them enlarged. Mounted once in the app shell. */
export function PictureViewer() {
  const [picture, setPicture] = useState<OpenPictureDetail | null>(null);

  useEffect(() => {
    const onOpen = (event: Event) => setPicture((event as CustomEvent<OpenPictureDetail>).detail);
    window.addEventListener(OPEN_PICTURE_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_PICTURE_EVENT, onOpen);
  }, []);

  if (!picture) return null;
  return <Lightbox src={picture.url} alt={picture.alt || "Picture from your entry"} onClose={() => setPicture(null)} />;
}
