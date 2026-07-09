import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ClaimForm from "@/components/ClaimForm";
import DogDetailMap from "@/components/DogDetailMap";

export const dynamic = "force-dynamic";

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
    select: {
      id: true,
      status: true,
      photoUrl: true,
      foundLat: true,
      foundLng: true,
      foundLocation: true,
      foundDate: true,
      breedGuess: true,
      size: true,
      color: true,
      hasCollar: true,
      collarTagInfo: true,
      temperament: true,
      holdingStatus: true,
      notes: true,
    },
  });

  if (!dog) notFound();

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
            alt="Found dog"
            className="w-full rounded-lg border border-black/10 object-cover"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">
              {dog.breedGuess || "Unknown breed"}
            </h1>
            {dog.status === "claim_pending" && (
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                Claim pending
              </span>
            )}
            {dog.status === "resolved" && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                Reunited
              </span>
            )}
          </div>

          <dl className="space-y-1 text-sm">
            <Row label="Found near" value={dog.foundLocation} />
            <Row label="Date found" value={new Date(dog.foundDate).toLocaleDateString()} />
            <Row label="Size" value={dog.size ?? "Not sure"} />
            <Row label="Color" value={dog.color ?? "Not noted"} />
            <Row label="Collar/tags" value={dog.hasCollar ? "Yes" : "No"} />
            <Row label="Temperament" value={dog.temperament ?? "Not noted"} />
            <Row label="Status when found" value={holdingLabel} />
          </dl>

          {dog.notes && (
            <p className="mt-3 rounded-md bg-neutral-100 p-3 text-sm">
              {dog.notes}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <DogDetailMap lat={dog.foundLat} lng={dog.foundLng} />
      </div>

      {dog.status !== "resolved" && dog.status !== "expired" ? (
        <div className="mt-6">
          <ClaimForm dogId={dog.id} />
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
