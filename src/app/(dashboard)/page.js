import { Button, Heading, Text } from "@primer/react";

export default function Home() {
  return (
    <div>
      <Heading as="h1" sx={{ mb: 2 }}>
        Dashboard
      </Heading>
      <Text as="p" sx={{ mb: 4, color: "fg.muted" }}>
        Welcome to DevHub.
      </Text>
      <Button variant="primary">Create Project</Button>
    </div>
  );
}
