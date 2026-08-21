"use client";

import {
  GearIcon,
  HomeIcon,
  IssueOpenedIcon,
  MarkGithubIcon,
  PeopleIcon,
  ProjectIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@primer/octicons-react";
import { NavList, IconButton } from "@primer/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "./SideBar.module.css";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: HomeIcon },
  { label: "Projects", href: "/projects", icon: ProjectIcon },
  { label: "GitHub", href: "/github", icon: MarkGithubIcon },
  { label: "Members", href: "/members", icon: PeopleIcon },
  { label: "Settings", href: "/settings", icon: GearIcon },
];

export function SideBar({ onNavigate }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile on mount
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNavClick = () => {
    if (isMobile) {
      setIsCollapsed(true); // Auto-collapse after navigation on mobile
    }
    onNavigate?.();
  };

  return (
    <div
      className={`${styles.sidebarWrapper} ${isCollapsed && isMobile ? styles.collapsed : ""}`}
    >
      {/* Mobile Hamburger Toggle */}
      {isMobile && (
        <div className={styles.mobileHeader}>
          <IconButton
            icon={isCollapsed ? ChevronRightIcon : ChevronLeftIcon}
            aria-label="Toggle sidebar"
            onClick={toggleCollapse}
            variant="invisible"
            className={styles.hamburgerBtn}
          />
        </div>
      )}

      <NavList
        aria-label="Main Navigation"
        className={styles.navList}
        style={{ padding: "8px 0" }}
      >
        {NAV_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(item.href));

          return (
            <NavList.Item
              key={item.href}
              as={Link}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onClick={handleNavClick}
              className={styles.navItem}
              title={isCollapsed && isMobile ? item.label : ""}
            >
              <NavList.LeadingVisual>
                <IconComponent />
              </NavList.LeadingVisual>
              {!(isCollapsed && isMobile) && item.label}
            </NavList.Item>
          );
        })}
      </NavList>
    </div>
  );
}

export default SideBar;
