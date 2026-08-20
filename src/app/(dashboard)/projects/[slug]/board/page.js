import { Heading, Text } from "@primer/react";

export default function ProjectBoardPage() {
  return (
    <section>
      <Heading as="h2" style={{ fontSize: "20px", marginBottom: "8px" }}>
        Board
      </Heading>
      <Text as="p" style={{ color: "var(--fgColor-muted)", margin: 0 }}>
        The project board will appear here.
      </Text>
    </section>
  );
}
