"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useTheme } from "@mui/material/styles";
import { useAppData } from "../../../context/AppDataProvider";
import { SheetFrame } from "../ui/SheetFrame";
import { MoneyField } from "../ui/MoneyField";
import { SegmentedControl } from "../ui/SegmentedControl";
import { SelectableOption } from "../ui/SelectableOption";
import { SERVICES, DURATIONS, STATUSES } from "../../../data/seed";

const DUR_OPTIONS = DURATIONS.map((d) => ({ value: d, label: d }));

export function AgendaSheet() {
  const { custom } = useTheme();
  const t = custom.tokens;
  const { aform, setAFormField, aTouched, aEdit, saveAgenda, removeAgenda, closeSheet } = useAppData();

  const nameError = aTouched && !aform.name.trim() ? "Informe o nome da cliente." : "";

  return (
    <SheetFrame title={aEdit ? "Editar agendamento" : "Novo agendamento"} onClose={closeSheet}>
      <Box>
        <TextField
          label="Cliente"
          placeholder="Nome da cliente"
          value={aform.name}
          onChange={(e) => setAFormField("name", e.target.value)}
          fullWidth
          autoFocus
        />
        <Typography sx={{ fontSize: 11.5, color: "error.main", minHeight: 16, mt: 0.5 }}>{nameError}</Typography>
      </Box>

      <TextField
        select
        label="Serviço"
        value={aform.service}
        onChange={(e) => setAFormField("service", e.target.value)}
        fullWidth
      >
        {SERVICES.map((s) => (
          <MenuItem key={s} value={s}>{s}</MenuItem>
        ))}
      </TextField>

      <Stack direction="row" spacing={1.5}>
        <TextField
          label="Data"
          type="date"
          value={aform.date}
          onChange={(e) => setAFormField("date", e.target.value)}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Início"
          type="time"
          value={aform.hour}
          onChange={(e) => setAFormField("hour", e.target.value)}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>

      <Box>
        <Typography sx={{ fontSize: 12, mb: 0.75, color: "text.secondary" }}>Duração</Typography>
        <SegmentedControl value={aform.dur} onChange={(v) => setAFormField("dur", v)} options={DUR_OPTIONS} fullWidth />
      </Box>

      <Box>
        <Typography sx={{ fontSize: 12, mb: 0.75, color: "text.secondary" }}>Valor do serviço</Typography>
        <MoneyField size="md" value={aform.value} onChange={(v) => setAFormField("value", v)} />
      </Box>

      <Box>
        <Typography sx={{ fontSize: 12, mb: 0.75, color: "text.secondary" }}>Status</Typography>
        <Stack spacing={1}>
          {STATUSES.map((s) => (
            <SelectableOption
              key={s}
              label={s}
              selected={aform.status === s}
              onSelect={() => setAFormField("status", s)}
            />
          ))}
        </Stack>
      </Box>

      <Stack direction="row" spacing={1.25} sx={{ mt: 0.5 }}>
        {aEdit && (
          <Button
            variant="outlined"
            color="error"
            onClick={removeAgenda}
            aria-label="Cancelar agendamento"
            sx={{ px: 1.75, borderColor: `${t.danger}66` }}
          >
            <DeleteOutlineRoundedIcon />
          </Button>
        )}
        <Button variant="outlined" onClick={closeSheet} sx={{ flex: 1 }}>Cancelar</Button>
        <Button variant="contained" onClick={saveAgenda} sx={{ flex: 2 }}>Salvar agendamento</Button>
      </Stack>
    </SheetFrame>
  );
}
