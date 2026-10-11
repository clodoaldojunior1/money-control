// Service worker do Nico. Existe para o app ser instalável e para mostrar uma
// tela de "sem conexão" no lugar do erro do navegador — não para funcionar
// offline: os dados vêm do servidor, autenticados, e não são cacheados aqui.
//
// Regra de ouro: HTML e respostas de /app nunca entram no cache. Cachear a
// página mostraria dados de uma sessão encerrada.
const VERSAO = "nico-v2";
const OFFLINE = "/offline.html";
const PRE_CACHE = [OFFLINE, "/icon-192.png", "/icon-512.png"];

// Último recurso: se nem o cache tiver a página offline (instalação parcial,
// cache limpo pelo navegador), a resposta vem daqui. Sem isso o navegador
// mostra a tela de erro dele, que é justamente o que o SW existe para evitar.
const OFFLINE_INLINE =
  '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  "<title>Sem conexão · Nico</title></head>" +
  '<body style="margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;' +
  'box-sizing:border-box;background:#f4f6f7;color:#151b21;font-family:system-ui,sans-serif;text-align:center">' +
  '<main><h1 style="font-size:20px">Sem conexão</h1>' +
  '<p style="color:#4e5760">O Nico precisa de internet para mostrar seus dados.</p>' +
  '<button onclick="location.reload()" style="background:#1f5f5b;color:#fff;border:0;' +
  'border-radius:12px;padding:12px 24px;font-size:15px">Tentar de novo</button></main></body></html>';

function paginaOffline() {
  return caches.match(OFFLINE).then(
    (guardada) =>
      guardada ||
      new Response(OFFLINE_INLINE, {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }),
  );
}

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    // `add` um a um: `addAll` é tudo-ou-nada, e um ícone que falhe não pode
    // derrubar a página offline junto.
    caches
      .open(VERSAO)
      .then((cache) => Promise.allSettled(PRE_CACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
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
    evento.respondWith(fetch(request).catch(paginaOffline));
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
