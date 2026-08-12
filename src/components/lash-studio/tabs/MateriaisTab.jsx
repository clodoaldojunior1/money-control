"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { useTheme, alpha } from "@mui/material/styles";
import { alphas } from "../../../theme/tokens";
import { useAppData } from "../../../context/AppDataProvider";
import { rotuloDoPeriodo } from "../../../lib/periodo";
import { PeriodNavigator } from "../ui/PeriodNavigator";
import { tagSx } from "../../../theme/tagStyles";

export function MateriaisTab() {
  const { custom } = useTheme();
  const t = custom.tokens;
  const { money, periodo, materiais, totals, openMaterial } = useAppData();

  const lowCount = materiais.filter((m) => m.qty <= m.min).length;

  return (
    <Stack spacing={1.75}>
      <PeriodNavigator />
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-end", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: 22 }}>Materiais</Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Estoque e custo investido</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddRoundedIcon />} onClick={() => openMaterial(null)} sx={{ px: 1.75 }}>
          Material
        </Button>
      </Stack>

      <Card variant="outlined" sx={{ p: 2.25, gap: 0.75, display: "flex", flexDirection: "column", border: "none" }}>
        <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>Comprado em {rotuloDoPeriodo(periodo)} · entra em Gastos</Typography>
        <Typography sx={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 30, lineHeight: 1.1 }}>
          {money(totals.materiaisTotal)}
        </Typography>
        {lowCount > 0 && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", mt: 0.75, p: "9px 12px", borderRadius: custom.radius.md, backgroundColor: alpha(t.danger, alphas.tint), color: t.danger, fontSize: 12, fontWeight: 600 }}
          >
            <WarningAmberRoundedIcon sx={{ fontSize: 17 }} />
            <span>{lowCount === 1 ? "1 material no estoque mínimo" : `${lowCount} materiais no estoque mínimo`}</span>
          </Stack>
        )}
      </Card>

      <Stack spacing={1}>
        {materiais.map((m) => (
          <Card
            key={m.id}
            variant="outlined"
            onClick={() => openMaterial(m)}
            sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1.5, p: "13px 15px", cursor: "pointer", border: "none" }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{m.name}</Typography>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
                {money(m.cost / m.qty)} / {m.unit} · comprado {m.date}
              </Typography>
            </Box>
            <Stack spacing={0.5} sx={{ alignItems: "flex-end" }}>
              <Chip
                label={`${m.qty} ${m.unit}`}
                size="small"
                sx={{ height: 20, fontSize: 11, ...tagSx(m.qty <= m.min ? "accent" : "neutral", t) }}
              />
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{money(m.cost)}</Typography>
            </Stack>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
