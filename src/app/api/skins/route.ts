import { NextResponse } from "next/server";
import { getDb } from "@/lib/jsondb";

export async function GET() {
  const db = getDb();
  const skins = [...db.skins].sort((a, b) => a.price - b.price);
  return NextResponse.json(skins);
}
