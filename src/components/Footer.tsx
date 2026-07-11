import SubscribeForm from "@/components/SubscribeForm";

export default function Footer() {
  return (
    <footer className="border-t border-black/10 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-black/60">
        <div className="mb-4">
          <SubscribeForm />
        </div>
        <p>
          A found dog? Your county&apos;s animal services can help with shelter
          intake, microchip scans, and legal holding requirements —{" "}
          <a
            href="https://www.stocktonca.gov/services/animal_services/lost___found_pets.php"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-black"
          >
            Stockton Animal Services
          </a>
          ,{" "}
          <a
            href="https://www.stancounty.com/animalservices/"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-black"
          >
            Stanislaus Animal Services Agency
          </a>
          , or{" "}
          <a
            href="https://www.countyofmerced.com/1878/Animal-Services"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-black"
          >
            Merced County Animal Services
          </a>
          .
        </p>
        <p className="mt-2">
          This is a community site, not affiliated with any city, county, or
          animal services agency in the 209.
        </p>
      </div>
    </footer>
  );
}
