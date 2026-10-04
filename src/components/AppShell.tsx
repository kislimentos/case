"use client";

import { useEffect, useState } from "react";
import TopBar from "./TopBar";
import LoginModal from "./LoginModal";
import LiveDrops from "./LiveDrops";
import Footer, { HelpFab } from "./Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const open = () => setLoginOpen(true);
    window.addEventListener("gb-login", open);
    return () => window.removeEventListener("gb-login", open);
  }, []);
  return (
    <>
      <TopBar onLogin={() => setLoginOpen(true)} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <LiveDrops />
      <div className="pt-[72px] lg:pl-[200px] min-h-screen flex flex-col">
        <main className="flex-1 w-full max-w-[1500px] mx-auto px-5 md:px-8 pb-10">{children}</main>
        <Footer />
      </div>
      <HelpFab />
    </>
  );
}
