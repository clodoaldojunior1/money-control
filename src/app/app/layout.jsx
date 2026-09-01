/**
 * Server Component de propósito.
 *
 * Ele era client e hospedava o `AppDataProvider`, mas o layout fica **acima**
 * da página: dado buscado na página não subiria até ele. O provider desceu
 * para o `AppRoot`, e este layout ficou reservado para o que é do servidor.
 *
 * **A guarda de sessão não veio parar aqui**, como o plano da etapa 4 supunha.
 * Ela acabou em dois lugares melhores: o `middleware.js` barra a *navegação*
 * sem sessão antes de qualquer render, e `requireUser()` barra o *dado* em
 * cada leitura e cada escrita. Repetir a checagem aqui custaria uma consulta
 * ao banco por render sem proteger nada que já não esteja protegido.
 */
export default function AppLayout({ children }) {
  return children;
}
