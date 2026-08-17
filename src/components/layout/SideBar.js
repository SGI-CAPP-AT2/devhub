"use client";

import {
  GearIcon,
  HomeIcon,
  IssueOpenedIcon,
  MarkGithubIcon,
  PeopleIcon,
  ProjectIcon,
} from "@primer/octicons-react";
import { NavList } from "@primer/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: HomeIcon },
  { label: "Projects", href: "/projects", icon: ProjectIcon },
  { label: "Issues", href: "/issues", icon: IssueOpenedIcon },
  { label: "GitHub", href: "/github", icon: MarkGithubIcon },
  { label: "Members", href: "/members", icon: PeopleIcon },
  { label: "Settings", href: "/settings", icon: GearIcon },
];

export function SideBar() {
  const pathname = usePathname();

  return (
    <NavList aria-label="Main Navigation">
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
          >
            <NavList.LeadingVisual>
              <IconComponent />
            </NavList.LeadingVisual>
            {item.label}
          </NavList.Item>
        );
      })}
    </NavList>
  );
}

export default SideBar;
