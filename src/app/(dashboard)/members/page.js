import { Heading, Text, Button } from "@primer/react";

export default function MembersPage() {
  return (
    <div>
      <Heading as="h1" sx={{ mb: 2 }}>
        Members
      </Heading>
      <Text as="p" sx={{ mb: 4, color: "fg.muted" }}>
        Manage team members and permissions.
      </Text>
      <Button variant="primary">Add Member</Button>
    </div>
  );
}
