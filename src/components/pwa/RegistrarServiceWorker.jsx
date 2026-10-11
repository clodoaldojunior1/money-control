"use client";

import { useEffect } from "react";

/**
 * Registra o service worker. Só em produção: em dev o SW cacheando
 * `/_next/static` atrapalharia o hot reload, e o `next dev` reaproveita nomes
 * de arquivo entre builds.
 */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sem SW o app segue funcionando; só perde a instalação.
    });
  }, []);

  return null;
}
