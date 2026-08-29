"use client";

import { useForm, useWatch } from "react-hook-form";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useTheme, alpha } from "@mui/material/styles";
import { alphas } from "../../../theme/tokens";
import { useAppData } from "../../../context/AppDataProvider";
import { BRL, UNITS } from "../../../data/dominio";
import { SheetFrame } from "../ui/SheetFrame";
import { FormTextField } from "../ui/form/FormTextField";
import { FormMoneyField } from "../ui/form/FormMoneyField";
import { FormSegmented } from "../ui/form/FormSegmented";

const UNIT_OPTIONS = UNITS.map((u) => ({ value: u, label: u }));

const positivo = (msg) => (v) => parseFloat(v) > 0 || msg;

// Em edição a data é a **do registro**, não a de hoje. O campo passou a ser
// gravado (etapa 3): mostrar hoje faria toda edição mudar a data sem ninguém
// pedir — e com o mock isso passava despercebido, porque a data era ignorada.
const toDefaults = (material, hoje) => (material
  ? { name: material.name, qty: String(material.qty), unit: material.unit, cost: String(material.cost), min: String(material.min), date: material.iso }
  : { name: "", qty: "1", unit: "un", cost: "", min: "1", date: hoje });

export function MaterialSheet() {
  const { custom } = useTheme();
  const t = custom.tokens;
  const { editing, isEdit, saveMaterial, removeMaterial, closeSheet, hoje } = useAppData();

  const { control, handleSubmit } = useForm({ defaultValues: toDefaults(editing, hoje) });

  // useWatch (e não watch) para não desabilitar a memoização do React Compiler.
  const [rawCost, rawQty] = useWatch({ control, name: ["cost", "qty"] });
  const cost = parseFloat(rawCost);
  const qty = parseFloat(rawQty);
  const unitCostHint = cost > 0 && qty > 0
    ? `Custo unitário ${BRL(cost / qty)}`
    : "O custo total entra automaticamente em Gastos › Trabalho › Variável.";

  return (
    <SheetFrame title={isEdit ? "Editar material" : "Novo material"} onClose={closeSheet}>
      <FormTextField
        control={control}
        name="name"
        label="Material"
        placeholder="Ex.: Cílios 0.07 C 11mm"
        autoFocus
        reserveHelperText
        rules={{ validate: (v) => v.trim().length > 0 || "Informe o nome do material." }}
      />

      <Stack direction="row" spacing={1.5}>
        <FormTextField
          control={control}
          name="qty"
          label="Quantidade"
          type="number"
          inputMode="numeric"
          reserveHelperText
          rules={{ validate: positivo("Maior que zero.") }}
        />
        <FormTextField
          control={control}
          name="min"
          label="Estoque mínimo"
          type="number"
          inputMode="numeric"
          reserveHelperText
        />
      </Stack>

      <FormSegmented control={control} name="unit" label="Unidade" options={UNIT_OPTIONS} />

      <Box>
        <FormMoneyField
          control={control}
          name="cost"
          label="Custo total pago"
          rules={{
            required: "Informe um custo maior que zero.",
            validate: positivo("Informe um custo maior que zero."),
          }}
        />
        <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>{unitCostHint}</Typography>
      </Box>

      <Stack direction="row" spacing={1.25} sx={{ mt: 0.5 }}>
        {isEdit && (
          <Button
            variant="outlined"
            color="error"
            onClick={removeMaterial}
            aria-label="Excluir material"
            sx={{ px: 1.75, borderColor: alpha(t.danger, alphas.border) }}
          >
            <DeleteOutlineRoundedIcon />
          </Button>
        )}
        <Button variant="outlined" onClick={closeSheet} sx={{ flex: 1 }}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit(saveMaterial)} sx={{ flex: 2 }}>Salvar material</Button>
      </Stack>
    </SheetFrame>
  );
}
