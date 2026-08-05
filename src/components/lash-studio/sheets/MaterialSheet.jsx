"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useTheme } from "@mui/material/styles";
import { useAppData } from "../../../context/AppDataProvider";
import { BRL, UNITS } from "../../../data/seed";
import { SheetFrame } from "../ui/SheetFrame";
import { MoneyField } from "../ui/MoneyField";
import { SegmentedControl } from "../ui/SegmentedControl";

const UNIT_OPTIONS = UNITS.map((u) => ({ value: u, label: u }));

export function MaterialSheet() {
  const { custom } = useTheme();
  const t = custom.tokens;
  const { mform, setMFormField, mTouched, mEdit, saveMaterial, removeMaterial, closeSheet } = useAppData();

  const cost = parseFloat(mform.cost);
  const qty = parseFloat(mform.qty);
  const mUnitCost = cost > 0 && qty > 0
    ? `Custo unitário ${BRL(cost / qty)}`
    : "O custo total entra automaticamente em Gastos › Trabalho › Variável.";
  const mError = mTouched ? "Preencha nome, quantidade e custo (maiores que zero)." : "";

  return (
    <SheetFrame title={mEdit ? "Editar material" : "Novo material"} onClose={closeSheet}>
      <TextField
        label="Material"
        placeholder="Ex.: Cílios 0.07 C 11mm"
        value={mform.name}
        onChange={(e) => setMFormField("name", e.target.value)}
        fullWidth
        autoFocus
      />

      <Stack direction="row" spacing={1.5}>
        <TextField
          label="Quantidade"
          type="number"
          inputMode="numeric"
          value={mform.qty}
          onChange={(e) => setMFormField("qty", e.target.value.replace("-", ""))}
          fullWidth
        />
        <TextField
          label="Estoque mínimo"
          type="number"
          inputMode="numeric"
          value={mform.min}
          onChange={(e) => setMFormField("min", e.target.value.replace("-", ""))}
          fullWidth
        />
      </Stack>

      <Box>
        <Typography sx={{ fontSize: 12, mb: 0.75, color: "text.secondary" }}>Unidade</Typography>
        <SegmentedControl value={mform.unit} onChange={(v) => setMFormField("unit", v)} options={UNIT_OPTIONS} fullWidth />
      </Box>

      <Box>
        <Typography sx={{ fontSize: 12, mb: 0.75, color: "text.secondary" }}>Custo total pago</Typography>
        <MoneyField size="md" value={mform.cost} onChange={(v) => setMFormField("cost", v)} />
        <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: 0.75 }}>{mUnitCost}</Typography>
      </Box>

      <Typography sx={{ fontSize: 11.5, color: "error.main", minHeight: 16 }}>{mError}</Typography>

      <Stack direction="row" spacing={1.25} sx={{ mt: 0.5 }}>
        {mEdit && (
          <Button
            variant="outlined"
            color="error"
            onClick={removeMaterial}
            aria-label="Excluir material"
            sx={{ px: 1.75, borderColor: `${t.danger}66` }}
          >
            <DeleteOutlineRoundedIcon />
          </Button>
        )}
        <Button variant="outlined" onClick={closeSheet} sx={{ flex: 1 }}>Cancelar</Button>
        <Button variant="contained" onClick={saveMaterial} sx={{ flex: 2 }}>Salvar material</Button>
      </Stack>
    </SheetFrame>
  );
}
