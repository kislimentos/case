import { NextResponse } from "next/server";
import JSZip from "jszip";
import { getDb } from "@/lib/jsondb";

const LIMIT = 80;

export const maxDuration = 60;

export async function GET() {
  const db = getDb();
  const zip = new JSZip();
  const folder = zip.folder("grimbattle-skins")!;
  const skins = db.skins.slice(0, LIMIT);

  const jobs = skins.map(async (s, i) => {
    try {
      const res = await fetch(s.image, { cache: "no-store" });
      if (!res.ok) return;
      const buf = Buffer.from(await res.arrayBuffer());
      const slug = s.name.replace(/[^\w\dа-яА-Я|]+/g, "_").replace(/^_+|_+$/g, "");
      folder.file(`${String(i + 1).padStart(3, "0")}_${slug}.png`, buf);
    } catch {
      /* skip broken image */
    }
  });

  // concurrency of 8
  for (let i = 0; i < jobs.length; i += 8) {
    await Promise.all(jobs.slice(i, i + 8));
  }

  folder.file(
    "catalog.json",
    JSON.stringify(
      skins.map((s) => ({ name: s.name, rarity: s.rarity, price: s.price, image: s.image, category: s.category })),
      null,
      2
    )
  );
  folder.file(
    "README.txt",
    [
      "GrimBattle — архив скинов CS2",
      `Скинов в архиве: ${skins.length} (из ${db.skins.length} в базе)`,
      "Формат: официальные рендеры Steam CDN (PNG).",
      "База данных сайта: JSON-файл data/grimbattle.json",
      "Админ-аккаунт: admin / admin",
      "Запуск: npm install && npm run dev",
    ].join("\n")
  );
  const dbSnapshot = {
    ...db,
    users: db.users.map((u) => ({ ...u, password: u.isAdmin ? "admin" : "***" })),
  };
  folder.file("db-snapshot.json", JSON.stringify(dbSnapshot, null, 2));

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="grimbattle-skins.zip"',
      "Cache-Control": "no-store",
    },
  });
}
