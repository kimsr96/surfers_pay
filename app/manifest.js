export default function manifest() {
  return {
    name: "서퍼스 가계부",
    short_name: "서퍼스 가계부",
    start_url: "/",
    display: "standalone",
    background_color: "#f4e8c8",
    theme_color: "#1b998b",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
