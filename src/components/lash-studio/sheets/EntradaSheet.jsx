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
import { SERVICES, METHODS } from "../../../data/seed";

const METHOD_OPTIONS = METHODS.map((m) => ({ value: m, label: m }));

export function EntradaSheet() {
  const { eform, setEFormField, eTouched, eEdit, saveEntrada, removeEntrada, closeSheet } = useAppData();
  const { custom } = useTheme();
  const t = custom.tokens;

  const eError =
    eTouched && (!eform.client.trim() || !(parseFloat(eform.value) > 0))
      ? "Informe a cliente e um valor maior que zero."
      : "";

  return (
    <SheetFrame title={eEdit ? "Editar entrada" : "Nova entrada"} onClose={closeSheet}>
      <Box>
        <MoneyField size="lg" value={eform.value} onChange={(v) => setEFormField("value", v)} autoFocus />
        <Typography sx={{ fontSize: 11.5, color: "error.main", minHeight: 16, mt: 0.5 }}>{eError}</Typography>
      </Box>

      <TextField
        label="Cliente"
        placeholder="Nome da cliente"
        value={eform.client}
        onChange={(e) => setEFormField("client", e.target.value)}
        fullWidth
      />

      <TextField
        select
        label="Serviço realizado"
        value={eform.service}
        onChange={(e) => setEFormField("service", e.target.value)}
        fullWidth
      >
        {SERVICES.map((s) => (
          <MenuItem key={s} value={s}>{s}</MenuItem>
        ))}
      </TextField>

      <Box>
        <Typography sx={{ fontSize: 12, mb: 0.75, color: "text.secondary" }}>Forma de pagamento</Typography>
        <SegmentedControl value={eform.method} onChange={(v) => setEFormField("method", v)} options={METHOD_OPTIONS} fullWidth />
      </Box>

      <TextField
        label="Data do recebimento"
        type="date"
        value={eform.date}
        onChange={(e) => setEFormField("date", e.target.value)}
        fullWidth
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Stack direction="row" spacing={1.25} sx={{ mt: 0.5 }}>
        {eEdit && (
          <Button
            variant="outlined"
            color="error"
            onClick={removeEntrada}
            aria-label="Excluir entrada"
            sx={{ px: 1.75, borderColor: `${t.danger}66` }}
          >
            <DeleteOutlineRoundedIcon />
          </Button>
        )}
        <Button variant="outlined" onClick={closeSheet} sx={{ flex: 1 }}>Cancelar</Button>
        <Button variant="contained" onClick={saveEntrada} sx={{ flex: 2 }}>Salvar entrada</Button>
      </Stack>
    </SheetFrame>
  );
}
