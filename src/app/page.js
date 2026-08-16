import { Button, Heading, SkeletonBox, Text } from "@primer/react";

export default function Home() {
  return (
    <div>
      <Heading>Dashboard</Heading>
      <Text>Welcome to DevHub.</Text>
      <Button variant="primary">Create Project</Button>
    </div>
  );
}
