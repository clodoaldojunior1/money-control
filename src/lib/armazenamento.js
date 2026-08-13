/**
 * Persistência local dos dados de domínio.
 *
 * **Único ponto do app que fala com `localStorage`.** Isso é proposital: esta
 * camada é intermediária. Quando o SWR entrar (ARCHITECTURE 6.2), ela vira
 * cache offline ou é descartada — e o resto do código não precisa saber.
 *
 * Nada aqui lança: navegador em aba privada e cota estourada dão exceção, e o
 * app tem que continuar funcionando em memória.
 */

const CHAVE = "lash-studio:dados";

/**
 * Suba este número sempre que o formato dos dados mudar. Versão diferente da
 * salva faz o conteúdo ser descartado e o seed voltar — preferível a quebrar o
 * app de quem já tinha dados. O formato *vai* mudar: hoje `items` mistura
 * entradas e gastos e deve virar duas coleções.
 */
const VERSAO = 1;

const temStorage = () => typeof window !== "undefined" && !!window.localStorage;

const pareceValido = (d) =>
  !!d && Array.isArray(d.items) && Array.isArray(d.materiais) && Array.isArray(d.agenda);

/**
 * Dados salvos, ou `null` se não houver nada aproveitável.
 *
 * `null` significa "nunca usou / descartado", **não** "está vazio": um conjunto
 * legitimamente vazio (a usuária apagou tudo) volta como arrays vazios e deve
 * ser respeitado, sem ressuscitar o seed por cima.
 */
export function lerDados() {
  if (!temStorage()) return null;
  try {
    const cru = window.localStorage.getItem(CHAVE);
    if (!cru) return null;

    const salvo = JSON.parse(cru);
    if (salvo?.versao !== VERSAO || !pareceValido(salvo)) return null;

    return { items: salvo.items, materiais: salvo.materiais, agenda: salvo.agenda };
  } catch {
    return null;
  }
}

/** `false` quando não deu para gravar — quem chama decide se avisa. */
export function salvarDados({ items, materiais, agenda }) {
  if (!temStorage()) return false;
  try {
    window.localStorage.setItem(
      CHAVE,
      JSON.stringify({ versao: VERSAO, salvoEm: new Date().toISOString(), items, materiais, agenda }),
    );
    return true;
  } catch {
    return false;
  }
}

export function limparDados() {
  if (!temStorage()) return;
  try {
    window.localStorage.removeItem(CHAVE);
  } catch {
    /* nada a fazer: seguimos em memória */
  }
}
