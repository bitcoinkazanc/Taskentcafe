"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const homeActive = pathname === "/";
  const menuActive = pathname === "/menu";
  const loyaltyActive = pathname === "/loyalty";

  return (
    <nav className="bottom-nav">

      <Link
        href="/"
        className={
          homeActive
            ? "nav-item active"
            : "nav-item"
        }
      >
        <span>⌂</span>
        <small>Ana Sayfa</small>
      </Link>

      <Link
        href="/menu"
        className={
          menuActive
            ? "nav-item active"
            : "nav-item"
        }
      >
        <span>☕</span>
        <small>Menü</small>
      </Link>

      <Link
        href="/loyalty"
        className={
          loyaltyActive
            ? "nav-item active"
            : "nav-item"
        }
      >
        <span>⭐</span>
        <small>Sadakat</small>
      </Link>

      <Link
        href="/#location"
        className="nav-item"
      >
        <span>📍</span>
        <small>Konum</small>
      </Link>

    </nav>
  );
}