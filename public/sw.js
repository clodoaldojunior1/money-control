// Service worker do Nico. Existe para o app ser instalável e para mostrar uma
// tela de "sem conexão" no lugar do erro do navegador — não para funcionar
// offline: os dados vêm do servidor, autenticados, e não são cacheados aqui.
//
// Regra de ouro: HTML e respostas de /app nunca entram no cache. Cachear a
// página mostraria dados de uma sessão encerrada.
const VERSAO = "nico-v1";
const OFFLINE = "/offline.html";
const PRE_CACHE = [OFFLINE, "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(VERSAO).then((cache) => cache.addAll(PRE_CACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const { request } = evento;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegação: sempre a rede. Só se ela falhar, a página offline.
  if (request.mode === "navigate") {
    evento.respondWith(fetch(request).catch(() => caches.match(OFFLINE)));
    return;
  }

  // Assets com hash no nome (imutáveis) e os ícones: cache primeiro.
  if (url.pathname.startsWith("/_next/static/") || PRE_CACHE.includes(url.pathname)) {
    evento.respondWith(
      caches.match(request).then(
        (guardado) =>
          guardado ||
          fetch(request).then((resposta) => {
            if (resposta.ok) {
              const copia = resposta.clone();
              caches.open(VERSAO).then((cache) => cache.put(request, copia));
            }
            return resposta;
          }),
      ),
    );
  }
  // O resto (Server Actions, RSC, API) passa direto, sem interceptar.
});
