import "./globals.css";

import "@primer/primitives/dist/css/functional/themes/light.css";
import "@primer/primitives/dist/css/functional/themes/dark.css";

import { BaseStyles, ThemeProvider } from "@primer/react";

export const metadata = {
  title: "DevHub",
  description: "Developer project collaboration platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider
          colorMode="auto"
          dayScheme="light"
          nightScheme="dark"
          preventSSRMismatch
        >
          <BaseStyles>
            <div className="app">{children}</div>
          </BaseStyles>
        </ThemeProvider>
      </body>
    </html>
  );
}
