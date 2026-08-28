"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  {
    label: "Ana Sayfa",
    icon: "⌂",
    href: "/",
    section: null,
  },
  {
    label: "Menü",
    icon: "☕",
    href: "/#menu",
    section: "menu",
  },
  {
    label: "Sadakat",
    icon: "⭐",
    href: "/#loyalty",
    section: "loyalty",
  },
  {
    label: "Konum",
    icon: "📍",
    href: "/#location",
    section: "location",
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSectionClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    section: string
  ) => {
    event.preventDefault();

    if (pathname !== "/") {
      router.push(`/#${section}`);
      return;
    }

    const element = document.getElementById(section);

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleHomeClick = (
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    if (pathname !== "/") {
      return;
    }

    event.preventDefault();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const active =
          item.section === null
            ? pathname === "/"
            : pathname === "/" &&
              typeof window !== "undefined" &&
              window.location.hash === `#${item.section}`;

        return (
          <Link
            key={item.label}
            href={item.href}
            className={
              active
                ? "nav-item active"
                : "nav-item"
            }
            onClick={(event) => {
              if (item.section) {
                handleSectionClick(
                  event,
                  item.section
                );
              } else {
                handleHomeClick(event);
              }
            }}
          >
            <span className="nav-icon">
              {item.icon}
            </span>

            <small>{item.label}</small>
          </Link>
        );
      })}
    </nav>
  );
}