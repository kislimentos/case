import { NextResponse } from "next/server";
import { getDb } from "@/lib/jsondb";

export async function GET(req: Request) {
  const db = getDb();
  const url = new URL(req.url);
  const caseId = Number(url.searchParams.get("caseId") || 0);
  const cases = db.cases.map((c) => ({
    ...c,
    itemCount: db.caseItems.filter((ci) => ci.caseId === c.id).length,
  }));
  const payload: Record<string, unknown> = {
    cases,
    settings: {
      limitedExpiresAt: db.settings.limitedExpiresAt,
      promoCode: db.settings.promoCode,
      promoPercent: db.settings.promoPercent,
    },
  };
  if (caseId) {
    const items = db.caseItems.filter((ci) => ci.caseId === caseId);
    const total = items.reduce((a, b) => a + b.weight, 0);
    payload.caseDetail = db.cases.find((c) => c.id === caseId) || null;
    payload.contents = items
      .map((ci) => ({
        skin: db.skins.find((s) => s.id === ci.skinId) || null,
        weight: ci.weight,
        odds: Math.round((ci.weight / total) * 10000) / 100,
      }))
      .filter((x) => x.skin)
      .sort((a, b) => b.skin!.price - a.skin!.price);
  }
  return NextResponse.json(payload);
}
