/**
 * Server Component de propósito.
 *
 * Ele era client e hospedava o `AppDataProvider`, mas o layout fica **acima**
 * da página: dado buscado na página não subiria até aqui. O provider desceu
 * para o `AppRoot`, e este layout ficou reservado para o que é do servidor —
 * na etapa 4 (ARCHITECTURE 6.1) vira a guarda de sessão, redirecionando para
 * `/login` antes de qualquer busca acontecer.
 */
export default function AppLayout({ children }) {
  return children;
}
