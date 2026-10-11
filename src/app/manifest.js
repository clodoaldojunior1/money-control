import { THEME_COLOR, tokens } from "../theme/tokens";

// O Next serve isto em /manifest.webmanifest e já põe o <link rel="manifest">.
export default function manifest() {
  return {
    id: "/",
    name: "Nico",
    short_name: "Nico",
    description: "Gestão financeira e operacional para lash designers",
    lang: "pt-BR",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: THEME_COLOR,
    background_color: tokens.light.bg,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
