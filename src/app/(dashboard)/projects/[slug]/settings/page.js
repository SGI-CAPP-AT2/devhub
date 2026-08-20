import { Heading, Text } from "@primer/react";

export default function ProjectSettingsPage() {
  return (
    <section>
      <Heading as="h2" style={{ fontSize: "20px", marginBottom: "8px" }}>
        Settings
      </Heading>
      <Text as="p" style={{ color: "var(--fgColor-muted)", margin: 0 }}>
        Project settings will appear here.
      </Text>
    </section>
  );
}
