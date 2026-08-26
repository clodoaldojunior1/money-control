"use client";

import { useForm } from "react-hook-form";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useTheme, alpha } from "@mui/material/styles";
import { alphas } from "../../../theme/tokens";
import { useAppData } from "../../../context/AppDataProvider";
import { SERVICES, DURATIONS, STATUSES } from "../../../data/dominio";
import { SheetFrame } from "../ui/SheetFrame";
import { FormTextField } from "../ui/form/FormTextField";
import { FormSelectField } from "../ui/form/FormSelectField";
import { FormMoneyField } from "../ui/form/FormMoneyField";
import { FormSegmented } from "../ui/form/FormSegmented";
import { FormOptionGroup } from "../ui/form/FormOptionGroup";

const DUR_OPTIONS = DURATIONS.map((d) => ({ value: d, label: d }));
const STATUS_OPTIONS = STATUSES.map((s) => ({ value: s, label: s }));

const toDefaults = (ag, hoje) => (ag
  ? { name: ag.name, service: ag.service, date: ag.date, hour: ag.hour, dur: ag.dur, status: ag.status, value: String(ag.value) }
  : { name: "", service: "Volume russo", date: hoje, hour: "09:00", dur: "2h", status: "Confirmado", value: "" });

export function AgendaSheet() {
  const { custom } = useTheme();
  const t = custom.tokens;
  const { editing, isEdit, saveAgenda, removeAgenda, closeSheet, hoje } = useAppData();

  const { control, handleSubmit } = useForm({ defaultValues: toDefaults(editing, hoje) });

  return (
    <SheetFrame title={isEdit ? "Editar agendamento" : "Novo agendamento"} onClose={closeSheet}>
      <FormTextField
        control={control}
        name="name"
        label="Cliente"
        placeholder="Nome da cliente"
        autoFocus
        reserveHelperText
        rules={{ validate: (v) => v.trim().length > 0 || "Informe o nome da cliente." }}
      />

      <FormSelectField control={control} name="service" label="Serviço" options={SERVICES} />

      <Stack direction="row" spacing={1.5}>
        <FormTextField
          control={control}
          name="date"
          label="Data"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <FormTextField
          control={control}
          name="hour"
          label="Início"
          type="time"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>

      <FormSegmented control={control} name="dur" label="Duração" options={DUR_OPTIONS} />

      <FormMoneyField control={control} name="value" label="Valor do serviço" />

      <FormOptionGroup control={control} name="status" label="Status" options={STATUS_OPTIONS} />

      <Stack direction="row" spacing={1.25} sx={{ mt: 0.5 }}>
        {isEdit && (
          <Button
            variant="outlined"
            color="error"
            onClick={removeAgenda}
            aria-label="Cancelar agendamento"
            sx={{ px: 1.75, borderColor: alpha(t.danger, alphas.border) }}
          >
            <DeleteOutlineRoundedIcon />
          </Button>
        )}
        <Button variant="outlined" onClick={closeSheet} sx={{ flex: 1 }}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit(saveAgenda)} sx={{ flex: 2 }}>Salvar agendamento</Button>
      </Stack>
    </SheetFrame>
  );
}
