import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rehablito Stadgbff",
    short_name: "Rehablito",
    description:
      "Rehablito staff portal — rehabilitation exercise management for therapists.",
    start_url: "/staff/login",
    scope: "/staff/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#4E6E5D",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/logo.jpeg",
        sizes: "208x412",
        type: "image/jpeg",
        form_factor: "narrow",
      },
    ],
  };
}
