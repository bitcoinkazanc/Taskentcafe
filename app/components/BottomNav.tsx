"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const isHome =
    pathname === "/";

  const isMenu =
    pathname === "/menu";

  const isLoyalty =
    pathname === "/loyalty";

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
        Ana Sayfa
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
        Menü
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
        Sadakat
      </Link>

      <Link
        href="/#location"
        className="nav-item"
      >
        <span>📍</span>
        Konum
      </Link>

    </nav>
  );
}