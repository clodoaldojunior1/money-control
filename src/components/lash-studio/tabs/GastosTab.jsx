"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useTheme } from "@mui/material/styles";
import { useAppData } from "../../../context/AppDataProvider";
import { rotuloDoPeriodo } from "../../../lib/periodo";
import { SegmentedControl } from "../ui/SegmentedControl";
import { PeriodNavigator } from "../ui/PeriodNavigator";
import { tagSx } from "../../../theme/tagStyles";

const FILTRO_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "trabalho", label: "Trabalho" },
  { value: "pessoal", label: "Pessoal" },
];

export function GastosTab() {
  const { custom } = useTheme();
  const t = custom.tokens;
  const { money, periodo, ledgerOut, totals, filtro, setFiltro, openGasto, openMaterial } = useAppData();
  const { trabalho, pessoal } = totals;

  const gastosFiltrados = ledgerOut
    .filter((i) => filtro === "todos" || i.tipo === filtro)
    .sort((a, b) => (b.iso || "").localeCompare(a.iso || ""));

  const tagFor = (i) =>
    i.tipo === "trabalho"
      ? { kind: "accent", text: i.sub === "fixo" ? "Trabalho · Fixo" : "Trabalho · Variável" }
      : { kind: "accent2", text: i.sub === "superfluo" ? "Pessoal · Supérfluo" : "Pessoal · Necessário" };

  return (
    <Stack spacing={1.75}>
      <PeriodNavigator />
      <Typography variant="h4" sx={{ fontSize: 22 }}>
        Gastos de {rotuloDoPeriodo(periodo)}
      </Typography>

      <Card variant="outlined" sx={{ p: 2, gap: 1.5, display: "flex", flexDirection: "column", border: "none" }}>
        <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>Total do mês</Typography>
          <Typography sx={{ fontFamily: "var(--font-heading)", fontSize: 24 }}>{money(trabalho + pessoal)}</Typography>
        </Stack>
        <Stack direction="row" sx={{ height: 12, borderRadius: 999, overflow: "hidden", gap: "3px", mt: 1.5 }}>
          <Box sx={{ flex: Math.max(trabalho, 1), backgroundColor: t.accent, borderRadius: 999 }} />
          <Box sx={{ flex: Math.max(pessoal, 1), backgroundColor: t.accent2, borderRadius: 999 }} />
        </Stack>
        <Stack direction="row" spacing={2} sx={{ fontSize: 11.5, mt: 1.5 }}>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: t.accent }} />
            <span>Trabalho {money(trabalho)}</span>
          </Stack>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: t.accent2 }} />
            <span>Pessoal {money(pessoal)}</span>
          </Stack>
        </Stack>
      </Card>

      <SegmentedControl value={filtro} onChange={setFiltro} options={FILTRO_OPTIONS} />

      <Card variant="outlined" sx={{ p: "6px 14px 10px", border: "none" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 0, border: 0, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}>Gasto</TableCell>
              <TableCell align="right" sx={{ pr: 0, border: 0, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}>Valor</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {gastosFiltrados.map((g) => {
              const tag = tagFor(g);
              return (
                <TableRow
                  key={g.id}
                  hover
                  onClick={() => (g.material ? openMaterial(g.material) : openGasto(g))}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell sx={{ pl: 0 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{g.title}</Typography>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mt: 0.5 }}>
                      <Chip label={tag.text} size="small" sx={{ height: 20, fontSize: 11, ...tagSx(tag.kind, t) }} />
                      <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{g.date}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 0, fontWeight: 700, fontSize: 13.5 }}>{money(g.value)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </Stack>
  );
}
