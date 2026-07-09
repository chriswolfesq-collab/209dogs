"use client";

import { useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L, { type LeafletMouseEvent, type LeafletEvent, type Marker as LeafletMarker } from "leaflet";
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
  listingType?: string;
  dogName?: string | null;
};

// Inline SVG pin avoids bundler asset-path issues with Leaflet's default
// marker images, and lets the pin color reflect listing type at a glance.
function pinIcon(color: string, scale = 1) {
  const w = 30 * scale;
  const h = 42 * scale;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 30 42">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z" fill="${color}" stroke="#1f2937" stroke-width="1"/>
      <circle cx="15" cy="15" r="6" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    popupAnchor: [0, -h * 0.86],
  });
}

const FOUND_COLOR = "#16a34a";
const LOST_COLOR = "#dc2626";
const REUNITED_COLOR = "#6b7280";
const PICKED_COLOR = "#2563eb";

const FOUND_ICON = pinIcon(FOUND_COLOR);
const LOST_ICON = pinIcon(LOST_COLOR);
const REUNITED_ICON = pinIcon(REUNITED_COLOR);
const PICKED_ICON = pinIcon(PICKED_COLOR);

const FOUND_ICON_LARGE = pinIcon(FOUND_COLOR, 1.35);
const LOST_ICON_LARGE = pinIcon(LOST_COLOR, 1.35);
const REUNITED_ICON_LARGE = pinIcon(REUNITED_COLOR, 1.35);

function iconForDog(dog: DogPin, highlighted: boolean) {
  if (dog.status === "resolved") return highlighted ? REUNITED_ICON_LARGE : REUNITED_ICON;
  if (dog.listingType === "lost") return highlighted ? LOST_ICON_LARGE : LOST_ICON;
  return highlighted ? FOUND_ICON_LARGE : FOUND_ICON;
}

type Props = {
  dogs: DogPin[];
  onPickLocation?: (lat: number, lng: number) => void;
  pickedLocation?: { lat: number; lng: number } | null;
  height?: string;
  showLegend?: boolean;
  highlightId?: string | null;
};

function LocationPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function PickedMarker({
  position,
  onMove,
}: {
  position: { lat: number; lng: number };
  onMove: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<LeafletMarker | null>(null);

  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={PICKED_ICON}
      draggable
      eventHandlers={{
        dragend: (e: LeafletEvent) => {
          const marker = e.target as LeafletMarker;
          const latlng = marker.getLatLng();
          onMove(latlng.lat, latlng.lng);
        },
      }}
      ref={markerRef}
    />
  );
}

export default function DogMap({
  dogs,
  onPickLocation,
  pickedLocation,
  height = "500px",
  showLegend = false,
  highlightId = null,
}: Props) {
  return (
    <div
      style={{ height, width: "100%" }}
      className="relative overflow-hidden rounded-lg border border-black/10"
    >
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
            icon={iconForDog(dog, dog.id === highlightId)}
          >
            <Popup>
              <Link href={`/dogs/${dog.id}`} className="block w-40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dog.photoUrl}
                  alt={dog.listingType === "lost" ? "Lost dog" : "Found dog"}
                  className="mb-2 h-24 w-full rounded object-cover"
                />
                <div className="text-sm font-medium">
                  {dog.dogName || dog.breedGuess || "Unknown breed"}
                  {dog.dogName && dog.breedGuess ? ` · ${dog.breedGuess}` : ""}
                  {dog.color ? `, ${dog.color}` : ""}
                </div>
                <div className="text-xs text-black/60">{dog.foundLocation}</div>
                {dog.status === "resolved" ? (
                  <div className="mt-1 text-xs font-medium text-neutral-600">Reunited 🎉</div>
                ) : dog.status === "claim_pending" ? (
                  <div className="mt-1 text-xs font-medium text-yellow-700">Claim pending</div>
                ) : (
                  <div
                    className="mt-1 text-xs font-medium"
                    style={{ color: dog.listingType === "lost" ? LOST_COLOR : FOUND_COLOR }}
                  >
                    {dog.listingType === "lost" ? "Lost" : "Found"}
                  </div>
                )}
              </Link>
            </Popup>
          </Marker>
        ))}
        {onPickLocation && <LocationPicker onPick={onPickLocation} />}
        {pickedLocation && onPickLocation && (
          <PickedMarker position={pickedLocation} onMove={onPickLocation} />
        )}
        {pickedLocation && !onPickLocation && (
          <Marker position={[pickedLocation.lat, pickedLocation.lng]} icon={PICKED_ICON} />
        )}
      </MapContainer>
      {showLegend && (
        <div className="pointer-events-none absolute bottom-2 left-2 z-[500] flex flex-col gap-1 rounded-md border border-black/10 bg-white/95 px-2.5 py-2 text-xs shadow-sm">
          <LegendRow color={FOUND_COLOR} label="Found" />
          <LegendRow color={LOST_COLOR} label="Lost" />
          <LegendRow color={REUNITED_COLOR} label="Reunited" />
        </div>
      )}
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full border border-black/20"
        style={{ backgroundColor: color }}
      />
      <span className="text-black/70">{label}</span>
    </div>
  );
}
