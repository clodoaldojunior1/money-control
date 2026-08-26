"use client";

import { useForm } from "react-hook-form";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useTheme, alpha } from "@mui/material/styles";
import { alphas } from "../../../theme/tokens";
import { useAppData } from "../../../context/AppDataProvider";
import { SERVICES, METHODS } from "../../../data/dominio";
import { SheetFrame } from "../ui/SheetFrame";
import { FormTextField } from "../ui/form/FormTextField";
import { FormSelectField } from "../ui/form/FormSelectField";
import { FormMoneyField } from "../ui/form/FormMoneyField";
import { FormSegmented } from "../ui/form/FormSegmented";

const METHOD_OPTIONS = METHODS.map((m) => ({ value: m, label: m }));

const toDefaults = (entrada, hoje) => (entrada
  ? { client: entrada.client, service: entrada.service, value: String(entrada.value), method: entrada.method, date: hoje }
  : { client: "", service: "Volume russo", value: "", method: "Pix", date: hoje });

export function EntradaSheet() {
  const { custom } = useTheme();
  const t = custom.tokens;
  const { editing, isEdit, saveEntrada, removeEntrada, closeSheet, hoje } = useAppData();

  const { control, handleSubmit } = useForm({ defaultValues: toDefaults(editing, hoje) });

  return (
    <SheetFrame title={isEdit ? "Editar entrada" : "Nova entrada"} onClose={closeSheet}>
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

      <FormSelectField control={control} name="service" label="Serviço realizado" options={SERVICES} />

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
            aria-label="Excluir entrada"
            sx={{ px: 1.75, borderColor: alpha(t.danger, alphas.border) }}
          >
            <DeleteOutlineRoundedIcon />
          </Button>
        )}
        <Button variant="outlined" onClick={closeSheet} sx={{ flex: 1 }}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit(saveEntrada)} sx={{ flex: 2 }}>Salvar entrada</Button>
      </Stack>
    </SheetFrame>
  );
}
