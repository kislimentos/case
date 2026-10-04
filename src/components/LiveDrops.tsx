"use client";

import { useEffect, useState } from "react";
import { RARITY_COLOR } from "@/lib/ui";
import type { Skin, Rarity } from "@/lib/seed";

type DropRow = { id: number; skin: Skin; userName: string; source: string; time: number };

export default function LiveDrops() {
  const [drops, setDrops] = useState<DropRow[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/drops", { cache: "no-store" });
        const data = await res.json();
        if (alive) setDrops(data);
      } catch {
        /* ignore */
      }
    };
    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <aside className="hidden lg:block fixed left-0 top-[72px] bottom-0 w-[200px] z-40 bg-[#101318] border-r border-black/60">
      <div className="h-full overflow-y-auto no-scrollbar">
        {drops.map((d, i) => {
          const color = RARITY_COLOR[d.skin.rarity as Rarity] || "#4b69ff";
          return (
            <div
              key={d.id}
              className={`relative h-[118px] flex flex-col items-center justify-center px-3 border-b border-black/50 ${i === 0 ? "drop-in" : ""}`}
              style={{
                background: `linear-gradient(180deg, ${color}26 0%, ${color}0d 70%, transparent 100%)`,
                borderLeft: `4px solid ${color}`,
              }}
              title={`${d.skin.name} — ${d.userName}`}
            >
              <img src={d.skin.image} alt={d.skin.name} className="h-[54px] w-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)]" loading="lazy" />
              <div className="text-[10px] text-gray-200 text-center leading-[1.15] mt-1.5 line-clamp-2">{d.skin.name}</div>
              <div className="text-[8px] uppercase tracking-wider text-white/35 mt-0.5">
                {d.userName} • {d.source}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
