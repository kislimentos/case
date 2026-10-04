import { NextResponse } from "next/server";
import { getDb } from "@/lib/jsondb";

export async function GET() {
  const db = getDb();
  const drops = db.drops.slice(0, 40).map((d) => ({
    ...d,
    skin: db.skins.find((s) => s.id === d.skinId) || null,
  })).filter((d) => d.skin);
  return NextResponse.json(drops);
}
