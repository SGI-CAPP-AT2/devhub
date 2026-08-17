"use client";

import { PageLayout } from "@primer/react";
import { NavBar, SideBar } from "@/components/layout";

export default function DashboardLayout({ children }) {
  return (
    <PageLayout padding="none" containerWidth="full">
      <PageLayout.Header padding="none">
        <NavBar />
      </PageLayout.Header>
      <PageLayout.Pane position="start" width="small" padding="none">
        <SideBar />
      </PageLayout.Pane>
      <PageLayout.Content padding="none">{children}</PageLayout.Content>
    </PageLayout>
  );
}
