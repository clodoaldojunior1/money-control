"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useTheme } from "@mui/material/styles";
import { useAppData } from "../../../context/AppDataProvider";
import { SheetFrame } from "../ui/SheetFrame";
import { MoneyField } from "../ui/MoneyField";
import { SegmentedControl } from "../ui/SegmentedControl";
import { SelectableOption } from "../ui/SelectableOption";

const TIPO_OPTIONS = [
  { value: "trabalho", label: "Trabalho" },
  { value: "pessoal", label: "Pessoal" },
];

const SUBS = {
  trabalho: [
    { v: "fixo", label: "Fixo", hint: "Todo mês" },
    { v: "variavel", label: "Variável", hint: "Materiais, extras" },
  ],
  pessoal: [
    { v: "superfluo", label: "Supérfluo", hint: "Pode cortar" },
    { v: "necessario", label: "Necessário", hint: "Essencial" },
  ],
};

export function GastoSheet() {
  const { custom } = useTheme();
  const t = custom.tokens;
  const { form, setFormField, touched, gEdit, saveGasto, removeGasto, closeSheet } = useAppData();

  const valorError = touched && !(parseFloat(form.valor) > 0) ? "Informe um valor maior que zero." : "";
  const subs = SUBS[form.tipo];

  const setTipo = (tipo) => {
    setFormField("tipo", tipo);
    setFormField("sub", tipo === "trabalho" ? "variavel" : "necessario");
  };

  return (
    <SheetFrame title={gEdit ? "Editar gasto" : "Novo gasto"} onClose={closeSheet}>
      <Box>
        <MoneyField size="lg" value={form.valor} onChange={(v) => setFormField("valor", v)} autoFocus />
        <Typography sx={{ fontSize: 11.5, color: "error.main", minHeight: 16, mt: 0.5 }}>{valorError}</Typography>
      </Box>

      <TextField
        label="Descrição"
        placeholder="Ex.: Cola Glue Pro 5ml"
        value={form.desc}
        onChange={(e) => setFormField("desc", e.target.value)}
        fullWidth
      />

      <Box>
        <Typography sx={{ fontSize: 12, mb: 0.75, color: "text.secondary" }}>Tipo</Typography>
        <SegmentedControl value={form.tipo} onChange={setTipo} options={TIPO_OPTIONS} fullWidth />
      </Box>

      <Box>
        <Typography sx={{ fontSize: 12, mb: 0.75, color: "text.secondary" }}>
          {form.tipo === "trabalho" ? "Natureza do gasto de trabalho" : "Natureza do gasto pessoal"}
        </Typography>
        <Stack direction="row" spacing={1.25}>
          {subs.map((o) => (
            <SelectableOption
              key={o.v}
              label={o.label}
              hint={o.hint}
              selected={form.sub === o.v}
              onSelect={() => setFormField("sub", o.v)}
            />
          ))}
        </Stack>
      </Box>

      <TextField
        label="Data"
        type="date"
        value={form.data}
        onChange={(e) => setFormField("data", e.target.value)}
        fullWidth
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Stack direction="row" spacing={1.25} sx={{ mt: 0.5 }}>
        {gEdit && (
          <Button
            variant="outlined"
            color="error"
            onClick={removeGasto}
            aria-label="Excluir gasto"
            sx={{ px: 1.75, borderColor: `${t.danger}66` }}
          >
            <DeleteOutlineRoundedIcon />
          </Button>
        )}
        <Button variant="outlined" onClick={closeSheet} sx={{ flex: 1 }}>Cancelar</Button>
        <Button variant="contained" onClick={saveGasto} sx={{ flex: 2 }}>Salvar gasto</Button>
      </Stack>
    </SheetFrame>
  );
}
