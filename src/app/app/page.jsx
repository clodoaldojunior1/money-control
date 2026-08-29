import { AppRoot } from "../../components/lash-studio/AppRoot";
import { carregarDados } from "../../server/leitura";

/**
 * O banco é a fonte da verdade, então esta rota não pode ser pré-renderizada
 * no build: o HTML congelaria os dados do dia da compilação — e o build
 * passaria a exigir acesso ao banco. Renderiza a cada requisição, e de novo a
 * cada `revalidatePath("/app")` disparado por uma Server Action.
 */
export const dynamic = "force-dynamic";

export default async function AppPage() {
  const dados = await carregarDados();

  return <AppRoot dados={dados} />;
}
