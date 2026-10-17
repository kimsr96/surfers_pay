import "./globals.css";
import RegisterSW from "./register-sw";

export const metadata = {
  title: "서퍼스 가계부",
  appleWebApp: { capable: true, title: "서퍼스 가계부", statusBarStyle: "default" },
};
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#1b998b" };

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
