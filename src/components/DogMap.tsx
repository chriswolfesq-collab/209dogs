"use client";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L, { type LeafletMouseEvent } from "leaflet";
import Link from "next/link";
import { STOCKTON_CENTER, STOCKTON_BOUNDS } from "@/lib/constants";

export type DogPin = {
  id: string;
  photoUrl: string;
  foundLat: number;
  foundLng: number;
  foundLocation: string;
  breedGuess?: string | null;
  size?: string | null;
  color?: string | null;
  status: string;
};

// Inline SVG pin avoids bundler asset-path issues with Leaflet's default
// marker images, and lets the pin color reflect claim status at a glance.
function pinIcon(color: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z" fill="${color}" stroke="#1f2937" stroke-width="1"/>
      <circle cx="15" cy="15" r="6" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -36],
  });
}

const ACTIVE_ICON = pinIcon("#16a34a");
const PENDING_ICON = pinIcon("#ca8a04");

type Props = {
  dogs: DogPin[];
  onPickLocation?: (lat: number, lng: number) => void;
  pickedLocation?: { lat: number; lng: number } | null;
  height?: string;
};

function LocationPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function DogMap({ dogs, onPickLocation, pickedLocation, height = "500px" }: Props) {
  return (
    <div style={{ height, width: "100%" }} className="overflow-hidden rounded-lg border border-black/10">
      <MapContainer
        center={STOCKTON_CENTER}
        zoom={12}
        maxBounds={STOCKTON_BOUNDS}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {dogs.map((dog) => (
          <Marker
            key={dog.id}
            position={[dog.foundLat, dog.foundLng]}
            icon={dog.status === "claim_pending" ? PENDING_ICON : ACTIVE_ICON}
          >
            <Popup>
              <Link href={`/dogs/${dog.id}`} className="block w-40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dog.photoUrl}
                  alt="Found dog"
                  className="mb-2 h-24 w-full rounded object-cover"
                />
                <div className="text-sm font-medium">
                  {dog.breedGuess || "Unknown breed"}
                  {dog.color ? `, ${dog.color}` : ""}
                </div>
                <div className="text-xs text-black/60">{dog.foundLocation}</div>
                {dog.status === "claim_pending" && (
                  <div className="mt-1 text-xs font-medium text-yellow-700">
                    Claim pending
                  </div>
                )}
              </Link>
            </Popup>
          </Marker>
        ))}
        {onPickLocation && <LocationPicker onPick={onPickLocation} />}
        {pickedLocation && (
          <Marker
            position={[pickedLocation.lat, pickedLocation.lng]}
            icon={pinIcon("#2563eb")}
          />
        )}
      </MapContainer>
    </div>
  );
}
