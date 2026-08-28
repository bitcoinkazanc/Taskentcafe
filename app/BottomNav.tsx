"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const goToSection = (
    event: React.MouseEvent<HTMLAnchorElement>,
    section: string
  ) => {
    event.preventDefault();

    if (pathname === "/") {
      const element = document.getElementById(section);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      return;
    }

    router.push(`/#${section}`);
  };

  return (
    <nav className="bottom-nav">

      {/* ANA SAYFA */}
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


      {/* MENÜ */}
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


      {/* SADAKAT */}
      <Link
        href="/#loyalty"
        className="nav-item"
        onClick={(event) =>
          goToSection(event, "loyalty")
        }
      >
        <span>⭐</span>
        <small>Sadakat</small>
      </Link>


      {/* KONUM */}
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