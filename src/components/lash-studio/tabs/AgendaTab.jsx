"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { useTheme } from "@mui/material/styles";
import { useAppData } from "../../../context/AppDataProvider";
import { diaEMes } from "../../../lib/periodo";
import { tagSx } from "../../../theme/tagStyles";

const STATUS_TAG = {
  "Concluído": "accent",
  "Em atendimento": "accent2",
  "Confirmado": "neutral",
  "Aguardando sinal": "neutral",
};

export function AgendaTab() {
  const { custom } = useTheme();
  const t = custom.tokens;
  const { money, hoje, agenda, openAgenda } = useAppData();
  const agendaTotal = money(agenda.reduce((s, a) => s + a.value, 0));

  return (
    <Stack spacing={1.75}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-end", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: 22 }}>Hoje, {diaEMes(hoje)}</Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
            {agenda.length} atendimentos · {agendaTotal} previstos
          </Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddRoundedIcon />} onClick={() => openAgenda(null)} sx={{ px: 1.75 }}>
          Agendar
        </Button>
      </Stack>

      <Stack spacing={1}>
        {agenda.map((a) => (
          <Card
            key={a.id}
            variant="outlined"
            onClick={() => openAgenda(a)}
            sx={{ display: "flex", flexDirection: "row", gap: 1.75, p: "14px 16px", alignItems: "center", cursor: "pointer", border: "none" }}
          >
            <Box sx={{ textAlign: "center", minWidth: 52 }}>
              <Typography sx={{ fontFamily: "var(--font-heading)", fontSize: 18, lineHeight: 1 }}>{a.hour}</Typography>
              <Typography sx={{ fontSize: 10.5, color: "text.secondary" }}>{a.dur}</Typography>
            </Box>
            <Box sx={{ width: "1px", alignSelf: "stretch", backgroundColor: t.divider }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{a.name}</Typography>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>{a.service} · {money(a.value)}</Typography>
            </Box>
            <Chip label={a.status} size="small" sx={{ height: 22, fontSize: 11, ...tagSx(STATUS_TAG[a.status], t) }} />
            <ChevronRightRoundedIcon sx={{ opacity: 0.4 }} />
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
