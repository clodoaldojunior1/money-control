"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useTheme, alpha } from "@mui/material/styles";
import { alphas } from "../../../theme/tokens";
import { useAppData } from "../../../context/AppDataProvider";
import { METHODS } from "../../../data/dominio";
import { definirPrecoPadrao } from "../../../actions/servicos";
import { SheetFrame } from "../ui/SheetFrame";
import { FormTextField } from "../ui/form/FormTextField";
import { FormServicoField } from "../ui/form/FormServicoField";
import { FormMoneyField } from "../ui/form/FormMoneyField";
import { FormSegmented } from "../ui/form/FormSegmented";

const METHOD_OPTIONS = METHODS.map((m) => ({ value: m, label: m }));

// Em edição a data é a **do registro**, não a de hoje: o campo é gravado, e
// mostrar hoje faria toda edição mudar a data sem ninguém pedir.
const toDefaults = (entrada, hoje) => (entrada
  ? { client: entrada.client, service: entrada.servicoId, value: String(entrada.value), method: entrada.method, date: entrada.iso }
  : { client: "", service: "", value: "", method: "Pix", date: hoje });

/**
 * Os campos e os botões, sem a moldura.
 *
 * Existe separado porque o sheet de movimentação (o FAB da Início) mostra este
 * mesmo formulário dentro da própria moldura, com um seletor em cima — aninhar
 * o `EntradaSheet` inteiro traria uma segunda alça e um segundo título.
 */
export function FormularioEntrada() {
  const { custom } = useTheme();
  const t = custom.tokens;
  const { editing, isEdit, saveEntrada, removeEntrada, closeSheet, hoje, salvando, servicos } = useAppData();

  const { control, handleSubmit, getValues, setValue } = useForm({ defaultValues: toDefaults(editing, hoje) });

  // useWatch (e não watch) para não desabilitar a memoização do React Compiler.
  const [servicoId, valorDigitado] = useWatch({ control, name: ["service", "value"] });
  const servico = servicos.find((s) => s.id === servicoId) ?? null;

  const [fixado, setFixado] = useState(false);

  /**
   * Ao trocar de serviço, sugere o preço dele — mas **nunca por cima do que ela
   * digitou**. Só preenche se o campo estiver vazio ou se o que está lá foi a
   * sugestão do serviço anterior.
   */
  function aoTrocarServico(novoId, anteriorId) {
    const anterior = servicos.find((s) => s.id === anteriorId);
    const novo = servicos.find((s) => s.id === novoId);
    const atual = getValues("value");

    const veioDeSugestao = anterior?.precoPadrao != null && atual === String(anterior.precoPadrao);
    if ((!atual || veioDeSugestao) && novo?.precoPadrao != null) {
      setValue("value", String(novo.precoPadrao));
    }
    setFixado(false);
  }

  // O convite aparece quando o valor difere do padrão — e some depois de aceito.
  // Ele mora aqui, e não no snackbar, porque lá o botão já é o Desfazer.
  const valor = Number(valorDigitado);
  const convite = servico && !fixado && Number.isFinite(valor) && valor > 0 && valor !== servico.precoPadrao;

  async function fixarPreco() {
    setFixado(true);
    await definirPrecoPadrao(servico.id, valor);
  }

  return (
    <>
    <FormMoneyField
      control={control}
      name="value"
      size="lg"
      autoFocus
      rules={{
        required: "Informe um valor maior que zero.",
        validate: (v) => parseFloat(v) > 0 || "Informe um valor maior que zero.",
      }}
    />

    <FormTextField
      control={control}
      name="client"
      label="Cliente"
      placeholder="Nome da cliente"
      reserveHelperText
      rules={{ validate: (v) => v.trim().length > 0 || "Informe a cliente." }}
    />

    <FormServicoField
      control={control}
      name="service"
      label="Serviço realizado"
      onAfterChange={aoTrocarServico}
      rules={{ required: "Escolha ou crie um serviço." }}
    />

    {convite && (
      <Typography
        component="button"
        type="button"
        onClick={fixarPreco}
        sx={{
          alignSelf: "flex-start", background: "none", border: "none", p: 0, cursor: "pointer",
          fontSize: 13, fontWeight: 600, color: t.accent, textAlign: "left",
        }}
      >
        {servico.precoPadrao == null
          ? `Usar este valor como preço padrão de ${servico.nome}`
          : `Fixar este valor como novo padrão de ${servico.nome}`}
      </Typography>
    )}

    <FormSegmented control={control} name="method" label="Forma de pagamento" options={METHOD_OPTIONS} />

    <FormTextField
      control={control}
      name="date"
      label="Data do recebimento"
      type="date"
      slotProps={{ inputLabel: { shrink: true } }}
    />

    <Stack direction="row" spacing={1.25} sx={{ mt: 0.5 }}>
      {isEdit && (
        <Button
          variant="outlined"
          color="error"
          onClick={removeEntrada}
          disabled={salvando}
          aria-label="Excluir entrada"
          sx={{ px: 1.75, borderColor: alpha(t.danger, alphas.border) }}
        >
          <DeleteOutlineRoundedIcon />
        </Button>
      )}
      <Button variant="outlined" onClick={closeSheet} disabled={salvando} sx={{ flex: 1 }}>Cancelar</Button>
      <Button variant="contained" onClick={handleSubmit(saveEntrada)} disabled={salvando} sx={{ flex: 2 }}>
        {salvando ? "Salvando…" : "Salvar entrada"}
      </Button>
    </Stack>
    </>
  );
}

export function EntradaSheet() {
  const { isEdit, closeSheet } = useAppData();

  return (
    <SheetFrame title={isEdit ? "Editar entrada" : "Nova entrada"} onClose={closeSheet}>
      <FormularioEntrada />
    </SheetFrame>
  );
}
