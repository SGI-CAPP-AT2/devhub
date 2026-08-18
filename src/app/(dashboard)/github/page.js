import { Heading, Text, Button } from "@primer/react";

export default function GitHubPage() {
  return (
    <div>
      <Heading as="h1" sx={{ mb: 2 }}>
        GitHub
      </Heading>
      <Text as="p" sx={{ mb: 4, color: "fg.muted" }}>
        Connect and manage your GitHub repositories.
      </Text>
      <Button variant="primary">Connect Repository</Button>
    </div>
  );
}
