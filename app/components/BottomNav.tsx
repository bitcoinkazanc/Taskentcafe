"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isMenu = pathname === "/menu";
  const isLoyalty = pathname === "/loyalty";

  return (
    <nav className="bottom-nav">

      <Link
        href="/"
        className={
          isHome
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
          isMenu
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
          isLoyalty
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