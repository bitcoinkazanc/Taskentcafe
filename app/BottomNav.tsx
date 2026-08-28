"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const goToSection = (
    event: React.MouseEvent<HTMLAnchorElement>,
    section: string
  ) => {
    if (pathname === "/") {
      event.preventDefault();

      const element = document.getElementById(section);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      return;
    }
  };

  return (
    <nav className="bottom-nav">
      <Link
        href="/"
        className={
          pathname === "/"
            ? "nav-item active"
            : "nav-item"
        }
        onClick={(event) => {
          if (pathname === "/") {
            event.preventDefault();

            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          }
        }}
      >
        <span>⌂</span>
        <small>Ana Sayfa</small>
      </Link>

      <Link
        href="/#menu"
        className="nav-item"
        onClick={(event) =>
          goToSection(event, "menu")
        }
      >
        <span>☕</span>
        <small>Menü</small>
      </Link>

      <Link
        href="/loyalty"
        className={
          pathname.startsWith("/loyalty")
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
        onClick={(event) =>
          goToSection(event, "location")
        }
      >
        <span>📍</span>
        <small>Konum</small>
      </Link>
    </nav>
  );
}