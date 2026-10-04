"use client";

import { useState } from "react";
import {
  Bomb,
  LifeBuoy,
  FileText,
  ShieldCheck,
  Scale,
  HelpCircle,
  MessageCircleQuestion,
  X,
  Archive,
} from "lucide-react";

const LINKS = [
  { icon: LifeBuoy, label: "Техподдержка" },
  { icon: FileText, label: "Пользовательское соглашение" },
  { icon: ShieldCheck, label: "Политика безопасности" },
  { icon: Scale, label: "AML политика" },
  { icon: HelpCircle, label: "Вопрос - Ответ" },
];

export default function Footer() {
  return (
    <footer className="mt-16 bg-[#0e1116] border-t border-black/70 relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-8 py-10 relative z-10">
        <div className="font-display font-bold text-gray-500 tracking-wide mb-3">GRIMBATTLE © 2018–2026</div>
        <div className="text-[11px] text-gray-600 mb-1">
          • ООО «Грим Логистикс», вымышленная юрисдикция, ул. Кейсовая, 95. Company number: 213965-3301-000
        </div>
        <div className="text-[11px] text-gray-600 mb-6">На нашем сайте вы можете открывать CS2 кейсы по выгодным ценам.</div>

        <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
          {LINKS.map((l) => (
            <button
              key={l.label}
              className="flex items-center gap-2 text-[12px] font-bold text-gray-500 hover:text-[#f7941d] transition-colors"
              title={l.label}
            >
              <l.icon className="w-4 h-4" />
              {l.label}
            </button>
          ))}
          <a
            href="/api/archive"
            className="flex items-center gap-2 text-[12px] font-bold text-[#f7941d] hover:text-white transition-colors"
            title="Скачать все картинки скинов одним архивом"
          >
            <Archive className="w-4 h-4" />
            СКАЧАТЬ АРХИВ СКИНОВ (.ZIP)
          </a>
        </div>
      </div>

      <div className="absolute right-6 bottom-4 flex flex-col items-end gap-3 opacity-[0.13] pointer-events-none select-none">
        <div className="flex items-center gap-2 font-display text-[54px] leading-none font-extrabold italic text-white">
          GRIM <Bomb className="w-10 h-10" /> BATTLE
        </div>
        <div className="flex gap-2">
          {["VISA", "MasterCard", "МИР"].map((p) => (
            <span key={p} className="border border-white/40 rounded px-2 py-0.5 text-[10px] font-bold text-white">
              {p}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

export function HelpFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-[90] w-[320px] bg-[#181c22] border border-white/10 rounded-lg shadow-[0_10px_50px_rgba(0,0,0,0.7)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/5">
            <span className="font-display font-bold text-sm tracking-wider text-[#f7941d]">ПОМОЩЬ</span>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3 text-[12px] text-gray-400 leading-relaxed">
            <p>
              <b className="text-white">Как открыть кейс?</b> Выберите кейс, нажмите «ОТКРЫТЬ ЗА …» — предмет упадёт в профиль.
            </p>
            <p>
              <b className="text-white">Как пополнить баланс?</b> Пополнение выдаёт только администратор в админ-панели (admin / admin).
            </p>
            <p>
              <b className="text-white">Промокод:</b> STORM-12 в профиле даёт +12% к счёту один раз.
            </p>
            <p>
              <b className="text-white">Архив скинов:</b> ссылка «Скачать архив скинов» в футере и в админ-панели.
            </p>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full border-2 border-[#f7941d] bg-[#14171c] text-[#f7941d] flex items-center justify-center shadow-[0_0_25px_rgba(247,148,29,0.35)] hover:bg-[#f7941d] hover:text-black transition-all"
        title="Помощь"
      >
        <MessageCircleQuestion className="w-6 h-6" />
      </button>
    </>
  );
}
