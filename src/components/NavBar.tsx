import Link from "next/link";

export default function NavBar() {
  return (
    <header className="border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          🐾 Stockton Found Dogs
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dogs" className="hover:underline">
            Browse
          </Link>
          <Link
            href="/dogs/new"
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-white hover:bg-neutral-700"
          >
            Report a Found Dog
          </Link>
        </nav>
      </div>
    </header>
  );
}
