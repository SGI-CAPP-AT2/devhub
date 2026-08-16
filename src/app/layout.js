import "@primer/primitives/dist/css/functional/themes/light.css";

import { BaseStyles, ThemeProvider } from "@primer/react";

export const metadata = {
  title: "DevHub",
  description: "Developer project collaboration platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider colorMode="auto" preventSSRMismatch>
          <BaseStyles>{children}</BaseStyles>
        </ThemeProvider>
      </body>
    </html>
  );
}
