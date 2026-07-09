import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-b from-amber-50 to-neutral-50">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 sm:grid-cols-2 sm:py-20">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-semibold tracking-tight">
              Reuniting Stockton&apos;s found dogs with their people
            </h1>
            <p className="mt-4 max-w-xl text-lg text-black/60">
              Found a dog? Post it here in a couple minutes — photo, where
              you found it, a few details. If someone recognizes their dog,
              we connect you by email. Your contact info is never shown
              publicly.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:justify-start">
              <Link
                href="/dogs/new"
                className="rounded-md bg-neutral-900 px-6 py-3 font-medium text-white hover:bg-neutral-700"
              >
                Report a Found Dog
              </Link>
              <Link
                href="/dogs"
                className="rounded-md border border-black/20 px-6 py-3 font-medium hover:bg-black/5"
              >
                Browse Found Dogs
              </Link>
            </div>
          </div>

          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-lg sm:aspect-square">
            <Image
              src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80"
              alt="A friendly dog outdoors"
              fill
              priority
              sizes="(min-width: 640px) 450px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          How it works
        </h2>
        <div className="mt-8 grid gap-6 text-left sm:grid-cols-3">
          <Step
            emoji="📸"
            title="Post the dog"
            body="Add a photo, drop a pin where you found it, and a few details. Takes about two minutes."
          />
          <Step
            emoji="🗺️"
            title="Owners browse the map"
            body="Anyone missing a dog can check the map or list of currently unclaimed dogs across Stockton."
          />
          <Step
            emoji="💌"
            title="We connect you privately"
            body="If someone claims the dog, we email you their contact info so you can reach out. Yours stays private the whole time."
          />
        </div>
      </div>
    </div>
  );
}

function Step({
  emoji,
  title,
  body,
}: {
  emoji: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-lg">
        {emoji}
      </div>
      <div className="font-medium">{title}</div>
      <p className="mt-1 text-sm text-black/60">{body}</p>
    </div>
  );
}
