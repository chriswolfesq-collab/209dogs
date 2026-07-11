import Link from "next/link";
import { isAdmin } from "@/lib/adminAuth";
import { logoutAdmin } from "@/lib/adminActions";

export default async function NavBar() {
  const admin = await isAdmin();

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          🐾 209 Lost &amp; Found Dogs
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/dogs/report-lost"
            className="rounded-md border border-black/20 px-3 py-1.5 hover:bg-black/5"
          >
            Report a Lost Dog
          </Link>
          <Link
            href="/dogs/new"
            className="rounded-md border border-black/20 px-3 py-1.5 hover:bg-black/5"
          >
            Report a Found Dog
          </Link>
          <Link
            href="/dogs"
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-white hover:bg-neutral-700"
          >
            Browse Lost/Found Dogs
          </Link>
          {admin && (
            <form action={logoutAdmin}>
              <button
                type="submit"
                className="rounded-md border border-black/20 px-3 py-1.5 text-black/60 hover:bg-black/5"
              >
                Admin: Log out
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
