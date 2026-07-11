import Link from "next/link";
import { Suspense } from "react";
import { isAdmin } from "@/lib/adminAuth";
import { logoutAdmin } from "@/lib/adminActions";
import { NavLink } from "@/components/NavLink";

const NAV_LINKS = [
  { href: "/dogs/report-lost", label: "Report a Lost Dog", variant: "outline" },
  { href: "/dogs/new", label: "Report a Found Dog", variant: "outline" },
  { href: "/dogs", label: "Browse Dogs", variant: "solid" },
] as const;

function linkClassName(variant: "outline" | "solid") {
  return variant === "solid"
    ? "rounded-md bg-neutral-900 px-3 py-1.5 text-white hover:bg-neutral-700"
    : "rounded-md border border-black/20 px-3 py-1.5 hover:bg-black/5";
}

function AdminLogoutButton() {
  return (
    <form action={logoutAdmin}>
      <button
        type="submit"
        className="w-full rounded-md border border-black/20 px-3 py-1.5 text-left text-black/60 hover:bg-black/5"
      >
        Admin: Log out
      </button>
    </form>
  );
}

async function AdminControls() {
  const admin = await isAdmin();
  return admin ? <AdminLogoutButton /> : null;
}

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white">
      <div className="relative mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          <span aria-hidden="true">🐾</span> 209 Lost &amp; Found Dogs
        </Link>

        <nav className="hidden items-center gap-3 text-sm sm:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} className={linkClassName(link.variant)}>
              {link.label}
            </NavLink>
          ))}
          <Suspense fallback={null}>
            <AdminControls />
          </Suspense>
        </nav>

        <details className="sm:hidden">
          <summary
            className="flex h-9 w-9 list-none items-center justify-center rounded-md border border-black/20 text-lg"
            aria-label="Open menu"
          >
            ☰
          </summary>
          <div className="absolute right-4 top-full z-50 mt-2 flex w-64 flex-col gap-2 rounded-md border border-black/10 bg-white p-3 text-sm shadow-lg">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} className={linkClassName(link.variant)}>
                {link.label}
              </NavLink>
            ))}
            <Suspense fallback={null}>
              <AdminControls />
            </Suspense>
          </div>
        </details>
      </div>
    </header>
  );
}
