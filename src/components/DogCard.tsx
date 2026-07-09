import Link from "next/link";

export type DogSummary = {
  id: string;
  status: string;
  listingType?: string;
  dogName?: string | null;
  photoUrl: string;
  foundLocation: string;
  foundDate: string;
  breedGuess?: string | null;
  size?: string | null;
  color?: string | null;
  hasCollar: boolean;
};

function StatusBadge({ status, listingType }: { status: string; listingType?: string }) {
  if (status === "resolved") {
    return (
      <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700">
        Reunited
      </span>
    );
  }
  if (status === "claim_pending") {
    return (
      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
        Claim pending
      </span>
    );
  }
  return listingType === "lost" ? (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
      Lost
    </span>
  ) : (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
      Found
    </span>
  );
}

export default function DogCard({ dog, active = false }: { dog: DogSummary; active?: boolean }) {
  return (
    <Link
      href={`/dogs/${dog.id}`}
      className={`flex flex-col overflow-hidden rounded-lg border bg-white transition hover:shadow-md ${
        active ? "border-neutral-900 ring-1 ring-neutral-900" : "border-black/10"
      }`}
    >
      <div className="aspect-square w-full overflow-hidden bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dog.photoUrl}
          alt={dog.listingType === "lost" ? "Lost dog" : "Found dog"}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">
            {dog.dogName || dog.breedGuess || "Unknown breed"}
          </span>
          <StatusBadge status={dog.status} listingType={dog.listingType} />
        </div>
        <div className="text-sm text-black/60">
          {[dog.dogName ? dog.breedGuess : null, dog.size, dog.color]
            .filter(Boolean)
            .join(" · ") || "No description"}
        </div>
        <div className="text-sm text-black/60">{dog.foundLocation}</div>
        <div className="mt-auto text-xs text-black/40">
          {dog.listingType === "lost" ? "Last seen" : "Found"}{" "}
          {new Date(dog.foundDate).toLocaleDateString()}
          {dog.hasCollar ? " · Has collar" : ""}
        </div>
      </div>
    </Link>
  );
}
