import { Heading, Text, Button } from "@primer/react";

export default function ProjectsPage() {
  return (
    <div>
      <Heading as="h1" sx={{ mb: 2 }}>
        Projects
      </Heading>
      <Text as="p" sx={{ mb: 4, color: "fg.muted" }}>
        Manage and view all your projects here.
      </Text>
      <Button variant="primary">New Project</Button>
    </div>
  );
}
