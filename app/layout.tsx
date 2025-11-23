import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Voice AI Chat",
  description: "Voice input chat using Google AI Studio + Web Speech API",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
