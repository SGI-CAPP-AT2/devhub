import { Heading, Text } from "@primer/react";

export default function ProjectPullRequestsPage() {
  return (
    <section>
      <Heading as="h2" style={{ fontSize: "20px", marginBottom: "8px" }}>
        Pull requests
      </Heading>
      <Text as="p" style={{ color: "var(--fgColor-muted)", margin: 0 }}>
        Pull requests for this project will appear here.
      </Text>
    </section>
  );
}
