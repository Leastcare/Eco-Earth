"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMapType, Marker, DivIcon } from "leaflet";

type PinDef = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  status: string;
  index: number;
};

function pinColor(status: string): string {
  if (status === "Critical" || status === "Poor") return "#b23b2e";
  if (status === "Moderate") return "#c4872e";
  return "#4c7a3d";
}

function makePinIcon(color: string, active: boolean, L: typeof import("leaflet")): DivIcon {
  const size = active ? 36 : 28;
  const inner = active ? 12 : 8;
  return L.divIcon({
    html: `
      <div style="
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:white;
        border:${active ? 3 : 2}px solid ${color};
        box-shadow:0 2px 8px rgba(0,0,0,.18)${active ? `,0 0 0 6px ${color}22` : ""};
        display:flex;align-items:center;justify-content:center;
        transition:all .2s;
      ">
        <div style="
          width:${inner}px;height:${inner}px;
          border-radius:50%;
          background:${color};
        "></div>
      </div>
    `,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 4],
  });
}

export default function LeafletMap({
  pins,
  activeId,
  onPin,
}: {
  pins: PinDef[];
  activeId: string | null;
  onPin: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<LeafletMapType | null>(null);
  const markersRef   = useRef<Map<string, Marker>>(new Map());

  // ── Init map once ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      const map = L.map(containerRef.current!, {
        center: [20, 20],
        zoom: 2,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
      });

      mapRef.current = map;

      // OpenStreetMap tiles — free, no key
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      // Add pins
      for (const pin of pins) {
        const color  = pinColor(pin.status);
        const active = pin.id === activeId;
        const icon   = makePinIcon(color, active, L);

        const marker = L.marker([pin.lat, pin.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:var(--font-inter,sans-serif);min-width:140px">
              <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:rgba(44,42,36,.45);margin:0 0 2px">${pin.id}</p>
              <p style="font-size:14px;font-weight:700;color:#2c2a24;margin:0 0 4px">${pin.label}</p>
              <span style="font-size:11px;font-weight:700;color:${color}">${pin.index}/100 · ${pin.status}</span>
            </div>`,
            { closeButton: false, className: "echoearth-popup" },
          );

        marker.on("click", () => onPin(pin.id));
        markersRef.current.set(pin.id, marker);
      }
    })();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update pin icons when activeId changes ───────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      for (const [id, marker] of markersRef.current.entries()) {
        const pin   = pins.find((p) => p.id === id);
        if (!pin) continue;
        const color = pinColor(pin.status);
        marker.setIcon(makePinIcon(color, id === activeId, L));
      }

      // Pan to active marker
      if (activeId && mapRef.current) {
        const m = markersRef.current.get(activeId);
        if (m && mapRef.current) {
          const map = mapRef.current;
          map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 4), {
            duration: 0.8,
          });
          m.openPopup();
        }
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  return (
    <>
      {/* Leaflet popup style override */}
      <style>{`
        .echoearth-popup .leaflet-popup-content-wrapper {
          background: #fbf8f0;
          border: 1px solid rgba(67,83,58,.15);
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(60,48,28,.14);
          padding: 0;
        }
        .echoearth-popup .leaflet-popup-content {
          margin: 12px 14px;
        }
        .echoearth-popup .leaflet-popup-tip {
          background: #fbf8f0;
        }
        .leaflet-control-zoom a {
          background: #fbf8f0!important;
          color: #43533a!important;
          border-color: rgba(67,83,58,.2)!important;
        }
        .leaflet-control-attribution {
          font-size: 9px!important;
          background: rgba(244,239,228,.85)!important;
        }
      `}</style>
      <div ref={containerRef} className="h-full w-full rounded-lg" />
    </>
  );
}
