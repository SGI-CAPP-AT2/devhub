"use client";

import { PageLayout } from "@primer/react";
import { NavBar, SideBar } from "@/components/layout";
import styles from "./layout.module.css";

export default function DashboardLayout({ children }) {
  return (
    <div className={styles.dashboardContainer}>
      <PageLayout
        padding="none"
        containerWidth="full"
        className={styles.pageLayout}
      >
        <PageLayout.Header padding="none">
          <NavBar />
        </PageLayout.Header>
        <div className={styles.contentWrapper}>
          <PageLayout.Pane
            position="start"
            width="small"
            padding="none"
            className={styles.sidebarPane}
          >
            <SideBar />
          </PageLayout.Pane>
          <PageLayout.Content
            paddingLeft="normal"
            className={styles.mainContent}
          >
            {children}
          </PageLayout.Content>
        </div>
      </PageLayout>
    </div>
  );
}
