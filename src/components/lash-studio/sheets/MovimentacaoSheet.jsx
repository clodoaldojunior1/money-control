"use client";

import { useState } from "react";
import { SheetFrame } from "../ui/SheetFrame";
import { SegmentedControl } from "../ui/SegmentedControl";
import { useAppData } from "../../../context/AppDataProvider";
import { FormularioEntrada } from "./EntradaSheet";
import { FormularioGasto } from "./GastoSheet";

/**
 * O sheet do FAB na Início, onde a ação não é uma só.
 *
 * Nas outras abas o botão (+) sabe o que abrir, porque a aba já diz. Na Início
 * não: o que ela vai lançar pode ser dinheiro entrando ou saindo. Em vez de
 * escolher um por padrão e obrigar a fechar e trocar de aba, o sheet pergunta.
 *
 * O título é **fixo**: o seletor logo abaixo já diz onde você está, e um título
 * que troca a cada toque faria o cabeçalho pular. "Movimentação" não é palavra
 * nova no app — é como a Home já chama essa lista.
 *
 * Trocar de opção desmonta um formulário e monta o outro, então o que foi
 * digitado se perde. É o mesmo que fechar e reabrir o sheet, e preservar
 * valores entre os dois acoplaria dois formulários por um ganho pequeno.
 */

const OPCOES = [
  { value: "entrada", label: "Entrada" },
  { value: "gasto", label: "Gasto" },
];

export function MovimentacaoSheet() {
  const { editing, closeSheet } = useAppData();

  // A edição nunca chega aqui: ela abre direto o sheet do tipo certo. Se um dia
  // chegar, o `kind` do registro decide — melhor que cair sempre em "entrada".
  const [tipo, setTipo] = useState(() => (editing?.kind === "out" ? "gasto" : "entrada"));

  return (
    <SheetFrame title="Nova movimentação" onClose={closeSheet}>
      <SegmentedControl
        value={tipo}
        onChange={setTipo}
        options={OPCOES}
        fullWidth
        aria-label="Tipo de movimentação"
      />

      {tipo === "entrada" ? <FormularioEntrada /> : <FormularioGasto />}
    </SheetFrame>
  );
}
