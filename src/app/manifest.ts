import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/journal/",
    name: "Life Trail",
    short_name: "Life Trail",
    description: "A private, offline-first journal.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#102e46",
    theme_color: "#102e46",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
