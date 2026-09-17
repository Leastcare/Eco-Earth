"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Info, Leaf, Mail, MapPin } from "lucide-react";

export type AppRoute = "/narration" | "/map" | "/journal" | "/letters" | "/about";

const NAV_ITEMS: { route: AppRoute; label: string; Icon: typeof Leaf }[] = [
  { route: "/narration", label: "Narration", Icon: Leaf     },
  { route: "/map",       label: "Map",       Icon: MapPin   },
  { route: "/journal",   label: "Journal",   Icon: BookOpen },
  { route: "/letters",   label: "Collection",Icon: Mail     },
  { route: "/about",     label: "About",     Icon: Info     },
];

export default function NavSidebar({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="hidden w-44 shrink-0 flex-col border-r border-forest/10 bg-sidebar px-5 py-7 lg:flex">
      <div className="mb-7 flex items-center gap-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-forest/20 bg-card">
          <Leaf size={15} strokeWidth={1.4} className="text-forest" />
        </div>
        <span className="font-display text-base font-semibold tracking-tight text-forest">EchoEarth</span>
      </div>
      <p className="mb-6 font-ui text-[10px] leading-[1.5] text-ink/50">
        Every place has a voice.<br />Listen. Learn. Love.
      </p>
      <div className="space-y-0.5">
        {NAV_ITEMS.map(({ route, label, Icon }) => (
          <Link
            key={route}
            href={route}
            onClick={onLinkClick}
            className={`flex items-center gap-2.5 rounded px-2 py-2 font-ui text-[11px] font-medium uppercase tracking-[.1em] transition hover:bg-forest/5 hover:text-forest ${
              pathname === route ? "bg-forest/8 text-forest" : "text-ink/55"
            }`}
          >
            <Icon size={13} strokeWidth={1.5} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
