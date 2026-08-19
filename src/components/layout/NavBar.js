"use client";

import { useEffect, useState } from "react";
import { GearIcon, SignOutIcon, ThreeBarsIcon } from "@primer/octicons-react";
import {
  ActionList,
  ActionMenu,
  Header,
  Text,
  IconButton,
  Avatar,
} from "@primer/react";
import Link from "next/link";

export function NavBar({ onMenuClick }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to load user session in NavBar:", err);
      }
    }
    loadUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.href = "/signup";
    }
  };

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
              {user?.image ? (
                <Avatar src={user.image} size={24} alt={user.username} />
              ) : null}
              <Text fontSize={2} fontWeight="bold" color="fg.onEmphasis">
                {user?.name || user?.username || "User"}
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
              <ActionList.Item variant="danger" onSelect={handleSignOut}>
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
