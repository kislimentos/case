import type { Rarity } from "./seed";

export const RARITY_COLOR: Record<Rarity, string> = {
  blue: "#4b69ff",
  purple: "#8847ff",
  pink: "#d32ce6",
  red: "#eb4b4b",
  gold: "#e4ae39",
};

export const RARITY_LABEL: Record<Rarity, string> = {
  blue: "Армейское",
  purple: "Запрещённое",
  pink: "Засекреченное",
  red: "Тайное",
  gold: "Крайне редкое",
};

export const CATEGORY_LABEL: Record<string, string> = {
  Stickers: "Наклейка",
  Charms: "Брелок",
  Knives: "Нож",
  Gloves: "Перчатки",
  Rifles: "Винтовка",
  Pistols: "Пистолет",
  SMGs: "ПП",
  Heavy: "Тяжёлое",
  Equipment: "Снаряжение",
};

export function fmtRub(n: number): string {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₽";
}

export function fmtNum(n: number): string {
  return n.toLocaleString("ru-RU");
}

export function timeLeft(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((x) => String(x).padStart(2, "0")).join(":");
}
