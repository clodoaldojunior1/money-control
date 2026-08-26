import { AppRoot } from "../../components/lash-studio/AppRoot";
import { carregarDadosIniciais } from "../../server/leitura";

/**
 * O banco é a fonte da verdade, então esta rota não pode ser pré-renderizada
 * no build: o HTML congelaria os dados do dia da compilação — e o build
 * passaria a exigir acesso ao banco. Renderiza a cada requisição.
 */
export const dynamic = "force-dynamic";

export default async function AppPage() {
  const dadosIniciais = await carregarDadosIniciais();

  return <AppRoot dadosIniciais={dadosIniciais} />;
}
