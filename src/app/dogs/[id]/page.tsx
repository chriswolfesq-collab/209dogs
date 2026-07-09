import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ClaimForm from "@/components/ClaimForm";
import DogDetailMap from "@/components/DogDetailMap";
import { getBaseUrl } from "@/lib/baseUrl";
import { PUBLIC_DOG_SELECT } from "@/app/api/dogs/[id]/route";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const dog = await prisma.dog.findUnique({
    where: { id },
    select: {
      dogName: true,
      breedGuess: true,
      photoUrl: true,
      foundLocation: true,
      listingType: true,
    },
  });

  if (!dog) return {};

  const isLost = dog.listingType === "lost";
  const label = dog.dogName || dog.breedGuess || "A dog";
  const title = isLost
    ? `Lost dog: ${label} — Stockton, CA Found Dogs`
    : `Found dog: ${label} — Stockton, CA Found Dogs`;
  const description = isLost
    ? `Last seen near ${dog.foundLocation}. Have you seen this dog?`
    : `Found near ${dog.foundLocation}. Is this your dog?`;

  const baseUrl = getBaseUrl();
  const imageUrl = dog.photoUrl.startsWith("http") ? dog.photoUrl : `${baseUrl}${dog.photoUrl}`;
  const pageUrl = `${baseUrl}/dogs/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      images: [{ url: imageUrl, width: 900, height: 900 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function DogDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ posted?: string }>;
}) {
  const { id } = await params;
  const { posted } = await searchParams;

  const dog = await prisma.dog.findUnique({
    where: { id },
    select: PUBLIC_DOG_SELECT,
  });

  if (!dog) notFound();

  const isLost = dog.listingType === "lost";

  const holdingLabel = {
    holding: "Currently with the finder",
    still_loose: "Still loose when last seen",
    taken_to_shelter: "Taken to a shelter",
  }[dog.holdingStatus];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {posted === "1" && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Your listing is live! Check your email for a private link to
          manage it (mark it resolved, or remove it later).
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dog.photoUrl}
            alt={isLost ? "Lost dog" : "Found dog"}
            className="w-full rounded-lg border border-black/10 object-cover"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">
              {dog.dogName || dog.breedGuess || "Unknown breed"}
            </h1>
            {dog.status === "active" && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  isLost ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                }`}
              >
                {isLost ? "Lost" : "Found"}
              </span>
            )}
            {dog.status === "claim_pending" && (
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                Claim pending
              </span>
            )}
            {dog.status === "resolved" && (
              <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700">
                Reunited
              </span>
            )}
          </div>

          <dl className="space-y-1 text-sm">
            {dog.dogName && <Row label="Breed" value={dog.breedGuess ?? "Unknown"} />}
            <Row label={isLost ? "Last seen near" : "Found near"} value={dog.foundLocation} />
            <Row
              label={isLost ? "Date last seen" : "Date found"}
              value={new Date(dog.foundDate).toLocaleDateString()}
            />
            <Row label="Size" value={dog.size ?? "Not sure"} />
            <Row label="Color" value={dog.color ?? "Not noted"} />
            <Row label="Collar/tags" value={dog.hasCollar ? "Yes" : "No"} />
            <Row label="Temperament" value={dog.temperament ?? "Not noted"} />
            {!isLost && <Row label="Status when found" value={holdingLabel} />}
          </dl>

          {dog.notes && (
            <p className="mt-3 rounded-md bg-neutral-100 p-3 text-sm">
              {dog.notes}
            </p>
          )}

          <Link
            href={`/dogs/${dog.id}/flyer`}
            className="mt-3 inline-block text-sm font-medium text-neutral-900 underline hover:no-underline"
          >
            Print a flyer for this dog
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <DogDetailMap
          lat={dog.foundLat}
          lng={dog.foundLng}
          listingType={dog.listingType}
          status={dog.status}
        />
      </div>

      {dog.status !== "resolved" && dog.status !== "expired" ? (
        <div className="mt-6">
          <ClaimForm dogId={dog.id} listingType={dog.listingType} dogName={dog.dogName} />
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-black/10 bg-white p-4 text-sm text-black/60">
          This dog has been reunited with its owner. 🎉
        </p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-black/50">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
