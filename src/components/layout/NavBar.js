"use client";

import { GearIcon, SignOutIcon, ThreeBarsIcon } from "@primer/octicons-react";
import {
  ActionList,
  ActionMenu,
  Header,
  Text,
  IconButton,
} from "@primer/react";
import Link from "next/link";

export function NavBar({ onMenuClick }) {
  return (
    <Header
      style={{
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Header.Item>
        <IconButton
          icon={ThreeBarsIcon}
          aria-label="Toggle menu"
          onClick={onMenuClick}
          variant="invisible"
          style={{
            display: "none",
            color: "inherit",
          }}
          className="hamburger-menu"
        />
      </Header.Item>
      <Header.Item>
        <Header.Link
          href="/"
          as={Link}
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <Text fontSize={3} fontWeight="bold" color="fg.onEmphasis">
            DevHub
          </Text>
        </Header.Link>
      </Header.Item>
      <Header.Item full />
      <Header.Item style={{ marginRight: 0 }}>
        <ActionMenu>
          <ActionMenu.Button
            variant="invisible"
            style={{ color: "inherit", padding: "4px 8px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Text fontSize={2} fontWeight="bold" color="fg.onEmphasis">
                User
              </Text>
            </div>
          </ActionMenu.Button>
          <ActionMenu.Overlay align="end">
            <ActionList>
              <ActionList.LinkItem as={Link} href="/settings">
                <ActionList.LeadingVisual>
                  <GearIcon />
                </ActionList.LeadingVisual>
                Settings
              </ActionList.LinkItem>
              <ActionList.Divider />
              <ActionList.Item variant="danger">
                <ActionList.LeadingVisual>
                  <SignOutIcon />
                </ActionList.LeadingVisual>
                Sign out
              </ActionList.Item>
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>
      </Header.Item>
    </Header>
  );
}

export default NavBar;

const styles = `
  @media (max-width: 767px) {
    .hamburger-menu {
      display: flex !important;
    }
  }
`;
