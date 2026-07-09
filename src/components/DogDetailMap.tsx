"use client";

import dynamic from "next/dynamic";

const DogMap = dynamic(() => import("@/components/DogMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center justify-center rounded-lg border border-black/10 bg-neutral-100 text-black/40">
      Loading map…
    </div>
  ),
});

export default function DogDetailMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <DogMap
      dogs={[
        {
          id: "detail",
          photoUrl: "",
          foundLat: lat,
          foundLng: lng,
          foundLocation: "",
          status: "active",
        },
      ]}
      height="300px"
    />
  );
}
