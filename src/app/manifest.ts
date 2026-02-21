import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Index Sanctus",
    short_name: "Index Sanctus",
    description:
      "Catholic custom-practice planner with flexible frequencies and Douay-Rheims public-domain scripture quotes.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f0e6",
    theme_color: "#efe3d0",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
