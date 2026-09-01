import { handlers } from "../../../../auth";

// A única rota de API do app: os endpoints internos do Auth.js (callback de
// credenciais, sessão, csrf). Tudo o mais é Server Component ou Server Action.
export const { GET, POST } = handlers;
