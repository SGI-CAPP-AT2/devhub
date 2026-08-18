import { Heading, Text, Button } from "@primer/react";

export default function IssuesPage() {
  return (
    <div>
      <Heading as="h1" sx={{ mb: 2 }}>
        Issues
      </Heading>
      <Text as="p" sx={{ mb: 4, color: "fg.muted" }}>
        Track and manage issues across your projects.
      </Text>
      <Button variant="primary">New Issue</Button>
    </div>
  );
}
