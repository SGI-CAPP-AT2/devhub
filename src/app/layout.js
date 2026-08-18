import "./globals.css";

import "@primer/primitives/dist/css/functional/themes/light.css";
import "@primer/primitives/dist/css/functional/themes/dark.css";

import { BaseStyles, ThemeProvider } from "@primer/react";
import { ClientProviders } from "./providers";

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
            <ClientProviders>
              <div className="app">{children}</div>
            </ClientProviders>
          </BaseStyles>
        </ThemeProvider>
      </body>
    </html>
  );
}
