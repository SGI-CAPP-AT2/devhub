import { Heading, Text, Button } from "@primer/react";

export default function SettingsPage() {
  return (
    <div>
      <Heading as="h1" sx={{ mb: 2 }}>
        Settings
      </Heading>
      <Text as="p" sx={{ mb: 4, color: "fg.muted" }}>
        Configure your workspace preferences and settings.
      </Text>
      <Button variant="primary">Edit Settings</Button>
    </div>
  );
}
