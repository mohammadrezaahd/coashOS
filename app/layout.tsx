import type { Metadata } from "next";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import "./globals.css";
import Providers from "./Providers";
export const metadata: Metadata = {
  title: {
    default: "coachOS — Your training workspace",
    template: "%s | coachOS",
  },
  description:
    "A connected workspace for coaches and trainees. Plan with purpose. Train with confidence.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" defaultMode="light" />
        <Providers>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          {children}
        </Providers>
      </body>
    </html>
  );
}
