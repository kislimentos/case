import { NextResponse } from "next/server";
import { getDb, currentUser, mutate } from "@/lib/jsondb";

export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ items: [] });
  const db = getDb();
  const items = db.inventory
    .filter((i) => i.userId === u.id)
    .map((i) => ({ ...i, skin: db.skins.find((s) => s.id === i.skinId) || null }))
    .filter((i) => i.skin);
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if (action === "sell") {
    const res = mutate((db) => {
      const item = db.inventory.find((i) => i.id === body.id && i.userId === u.id);
      if (!item) return { error: "Предмет не найден" };
      const skin = db.skins.find((s) => s.id === item.skinId);
      if (!skin) return { error: "Скин не найден" };
      db.inventory = db.inventory.filter((i) => i.id !== item.id);
      const user = db.users.find((x) => x.id === u.id)!;
      user.balance = Math.round((user.balance + skin.price) * 100) / 100;
      return { ok: true, price: skin.price, balance: user.balance };
    });
    if (res.error) return NextResponse.json({ error: res.error }, { status: 404 });
    return NextResponse.json(res);
  }

  if (action === "sellAll") {
    const res = mutate((db) => {
      const mine = db.inventory.filter((i) => i.userId === u.id);
      let total = 0;
      for (const it of mine) {
        const skin = db.skins.find((s) => s.id === it.skinId);
        if (skin) total += skin.price;
      }
      db.inventory = db.inventory.filter((i) => i.userId !== u.id);
      const user = db.users.find((x) => x.id === u.id)!;
      user.balance = Math.round((user.balance + total) * 100) / 100;
      return { ok: true, total, balance: user.balance, count: mine.length };
    });
    return NextResponse.json(res);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
