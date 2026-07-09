import Link from "next/link";

export type DogSummary = {
  id: string;
  status: string;
  photoUrl: string;
  foundLocation: string;
  foundDate: string;
  breedGuess?: string | null;
  size?: string | null;
  color?: string | null;
  hasCollar: boolean;
};

export default function DogCard({ dog }: { dog: DogSummary }) {
  return (
    <Link
      href={`/dogs/${dog.id}`}
      className="flex flex-col overflow-hidden rounded-lg border border-black/10 bg-white transition hover:shadow-md"
    >
      <div className="aspect-square w-full overflow-hidden bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dog.photoUrl}
          alt="Found dog"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">
            {dog.breedGuess || "Unknown breed"}
          </span>
          {dog.status === "claim_pending" && (
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
              Claim pending
            </span>
          )}
        </div>
        <div className="text-sm text-black/60">
          {[dog.size, dog.color].filter(Boolean).join(" · ") || "No description"}
        </div>
        <div className="text-sm text-black/60">{dog.foundLocation}</div>
        <div className="mt-auto text-xs text-black/40">
          Found {new Date(dog.foundDate).toLocaleDateString()}
          {dog.hasCollar ? " · Has collar" : ""}
        </div>
      </div>
    </Link>
  );
}
