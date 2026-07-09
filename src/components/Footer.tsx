export default function Footer() {
  return (
    <footer className="border-t border-black/10 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-black/60">
        <p>
          A found dog? Stockton Animal Services can help with shelter intake,
          microchip scans, and legal holding requirements — see their{" "}
          <a
            href="https://www.stocktonca.gov/services/animal_services/lost___found_pets.php"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-black"
          >
            Lost &amp; Found Pets page
          </a>
          .
        </p>
        <p className="mt-2">
          This is a community site, not affiliated with the City of Stockton
          or San Joaquin County.
        </p>
      </div>
    </footer>
  );
}
