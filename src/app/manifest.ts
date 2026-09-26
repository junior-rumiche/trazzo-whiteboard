import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trazzo — Pizarra Virtual y Diagramas",
    short_name: "Trazzo",
    description:
      "Pizarra virtual interactiva y herramienta de diagramación en tu navegador. Rápida, privada y sin registro.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfbfe",
    theme_color: "#6366f1",
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
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
