"use client";

import { useForm, useWatch } from "react-hook-form";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useTheme, alpha } from "@mui/material/styles";
import { alphas } from "../../../theme/tokens";
import { useAppData } from "../../../context/AppDataProvider";
import { HOJE_ISO } from "../../../data/seed";
import { SheetFrame } from "../ui/SheetFrame";
import { FormTextField } from "../ui/form/FormTextField";
import { FormMoneyField } from "../ui/form/FormMoneyField";
import { FormSegmented } from "../ui/form/FormSegmented";
import { FormOptionGroup } from "../ui/form/FormOptionGroup";

const TIPO_OPTIONS = [
  { value: "trabalho", label: "Trabalho" },
  { value: "pessoal", label: "Pessoal" },
];

const SUB_OPTIONS = {
  trabalho: [
    { value: "fixo", label: "Fixo", hint: "Todo mês" },
    { value: "variavel", label: "Variável", hint: "Materiais, extras" },
  ],
  pessoal: [
    { value: "superfluo", label: "Supérfluo", hint: "Pode cortar" },
    { value: "necessario", label: "Necessário", hint: "Essencial" },
  ],
};

const SUB_PADRAO = { trabalho: "variavel", pessoal: "necessario" };

const toDefaults = (gasto) => (gasto
  ? { valor: String(gasto.value), desc: gasto.title, tipo: gasto.tipo, sub: gasto.sub, data: HOJE_ISO }
  : { valor: "", desc: "", tipo: "trabalho", sub: "variavel", data: HOJE_ISO });

export function GastoSheet() {
  const { custom } = useTheme();
  const t = custom.tokens;
  const { editing, isEdit, saveGasto, removeGasto, closeSheet } = useAppData();

  const { control, handleSubmit, setValue } = useForm({
    defaultValues: toDefaults(editing),
  });

  // useWatch (e não watch) para não desabilitar a memoização do React Compiler.
  const tipo = useWatch({ control, name: "tipo" });

  return (
    <SheetFrame title={isEdit ? "Editar gasto" : "Novo gasto"} onClose={closeSheet}>
      <FormMoneyField
        control={control}
        name="valor"
        size="lg"
        autoFocus
        rules={{
          required: "Informe um valor maior que zero.",
          validate: (v) => parseFloat(v) > 0 || "Informe um valor maior que zero.",
        }}
      />

      <FormTextField control={control} name="desc" label="Descrição" placeholder="Ex.: Cola Glue Pro 5ml" />

      <FormSegmented
        control={control}
        name="tipo"
        label="Tipo"
        options={TIPO_OPTIONS}
        onAfterChange={(next) => setValue("sub", SUB_PADRAO[next])}
      />

      <FormOptionGroup
        control={control}
        name="sub"
        label={tipo === "trabalho" ? "Natureza do gasto de trabalho" : "Natureza do gasto pessoal"}
        options={SUB_OPTIONS[tipo]}
        direction="row"
      />

      <FormTextField
        control={control}
        name="data"
        label="Data"
        type="date"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Stack direction="row" spacing={1.25} sx={{ mt: 0.5 }}>
        {isEdit && (
          <Button
            variant="outlined"
            color="error"
            onClick={removeGasto}
            aria-label="Excluir gasto"
            sx={{ px: 1.75, borderColor: alpha(t.danger, alphas.border) }}
          >
            <DeleteOutlineRoundedIcon />
          </Button>
        )}
        <Button variant="outlined" onClick={closeSheet} sx={{ flex: 1 }}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit(saveGasto)} sx={{ flex: 2 }}>Salvar gasto</Button>
      </Stack>
    </SheetFrame>
  );
}
