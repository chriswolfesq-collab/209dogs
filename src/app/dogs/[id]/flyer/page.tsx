import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/baseUrl";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function FlyerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const dog = await prisma.dog.findUnique({
    where: { id },
    select: {
      listingType: true,
      dogName: true,
      photoUrl: true,
      foundLocation: true,
      foundDate: true,
      breedGuess: true,
      size: true,
      color: true,
      hasCollar: true,
    },
  });

  if (!dog) notFound();

  const isLost = dog.listingType === "lost";
  const listingUrl = `${getBaseUrl()}/dogs/${id}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 print:max-w-none print:px-0 print:py-0">
      <div className="mb-4 print:hidden">
        <PrintButton />
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-8 text-center print:border-0 print:p-0">
        <h1 className="text-5xl font-black uppercase tracking-tight">
          {isLost ? "Lost Dog" : "Found Dog"}
        </h1>
        {dog.dogName && <p className="mt-1 text-2xl font-semibold">{dog.dogName}</p>}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dog.photoUrl}
          alt={isLost ? "Lost dog" : "Found dog"}
          className="mx-auto mt-6 aspect-square w-full max-w-md rounded-lg object-cover"
        />

        <dl className="mx-auto mt-6 max-w-md space-y-2 text-left text-lg">
          <FlyerRow
            label={isLost ? "Last seen near" : "Found near"}
            value={dog.foundLocation}
          />
          <FlyerRow
            label={isLost ? "Date last seen" : "Date found"}
            value={new Date(dog.foundDate).toLocaleDateString()}
          />
          {dog.breedGuess && <FlyerRow label="Breed" value={dog.breedGuess} />}
          {dog.size && <FlyerRow label="Size" value={dog.size} />}
          {dog.color && <FlyerRow label="Color" value={dog.color} />}
          <FlyerRow label="Collar/tags" value={dog.hasCollar ? "Yes" : "No"} />
        </dl>

        <p className="mt-8 text-2xl font-bold">
          {isLost ? "Have you seen this dog?" : "Is this your dog?"}
        </p>
        <p className="mt-2 text-lg">View this listing and get in touch:</p>
        <p className="mt-1 break-all text-xl font-semibold">{listingUrl}</p>
      </div>
    </div>
  );
}

function FlyerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-40 shrink-0 font-medium text-black/60">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
