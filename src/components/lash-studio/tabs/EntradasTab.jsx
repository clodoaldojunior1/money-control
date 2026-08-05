"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useTheme } from "@mui/material/styles";
import { useAppData } from "../../../context/AppDataProvider";

export function EntradasTab() {
  const { custom } = useTheme();
  const t = custom.tokens;
  const { money, entradas, totals, openEntrada } = useAppData();

  const entradasList = [...entradas].sort((a, b) => (b.iso || "").localeCompare(a.iso || ""));

  return (
    <Stack spacing={1.75}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-end", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: 22 }}>Entradas</Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{entradas.length} recebimentos em agosto</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddRoundedIcon />} onClick={() => openEntrada(null)} sx={{ px: 1.75 }}>
          Receber
        </Button>
      </Stack>

      <Card variant="outlined" sx={{ p: 2.25, border: "none" }}>
        <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>Total recebido</Typography>
        <Typography sx={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 30, lineHeight: 1.1, color: t.accent }}>
          {money(totals.faturamento)}
        </Typography>
      </Card>

      <Stack spacing={1}>
        {entradasList.map((e) => (
          <Card
            key={e.id}
            variant="outlined"
            onClick={() => openEntrada(e)}
            sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1.5, p: "13px 15px", cursor: "pointer", border: "none" }}
          >
            <Avatar sx={{ width: 38, height: 38, fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15, bgcolor: `${t.accent2}2e`, color: t.accent2Ramp[700] }}>
              {e.client.trim()[0].toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{e.client}</Typography>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>{e.service} · {e.method}</Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: t.accent }}>+ {money(e.value)}</Typography>
              <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{e.date}</Typography>
            </Box>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
