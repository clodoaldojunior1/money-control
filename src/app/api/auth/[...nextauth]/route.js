import { handlers } from "../../../../auth";

// Os endpoints internos do Auth.js (callback de credenciais, sessão, csrf).
// Além deles só existe `api/sessao-orfa`; o resto é Server Component ou
// Server Action.
export const { GET, POST } = handlers;
