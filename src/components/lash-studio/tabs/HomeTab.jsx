"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Avatar from "@mui/material/Avatar";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import { useTheme } from "@mui/material/styles";
import { useAppData } from "../../../context/AppDataProvider";

export function HomeTab() {
  const { custom } = useTheme();
  const t = custom.tokens;
  const { money, mesAnterior, entradas, ledgerOut, totals, agenda, setTab } = useAppData();

  const { faturamento, trabalho, materiaisTotal } = totals;
  const heroUp = faturamento >= mesAnterior;
  const heroMeta =
    `${faturamento >= mesAnterior ? "+" : ""}${Math.round(((faturamento - mesAnterior) / mesAnterior) * 100)}% vs. julho · ` +
    `${faturamento - trabalho >= 0 ? "lucro " : "prejuízo "}${money(Math.abs(faturamento - trabalho))}`;

  const label = (i) => (i.kind === "in" ? `${i.service} — ${i.client}` : i.title);
  const recentes = [...entradas, ...ledgerOut]
    .sort((a, b) => {
      const byDate = (b.iso || "").localeCompare(a.iso || "");
      if (byDate !== 0) return byDate;
      if (a.kind === b.kind) return 0;
      return a.kind === "in" ? -1 : 1;
    })
    .slice(0, 5)
    .map((i) => ({
      id: i.id,
      initial: label(i).trim()[0].toUpperCase(),
      title: label(i),
      meta: i.kind === "in" ? `Recebido · ${i.method}` : `${i.tipo === "trabalho" ? "Trabalho" : "Pessoal"} · ${i.cat}`,
      amount: `${i.kind === "in" ? "+ " : "− "}${money(i.value)}`,
      amountColor: i.kind === "in" ? t.accent2Ramp[700] : t.text,
      date: i.date,
      dotBg: i.kind === "in" ? `${t.accent2}3d` : `${t.accent}29`,
      dotFg: i.kind === "in" ? t.accent2Ramp[700] : t.accent,
    }));

  return (
    <Stack spacing={1.75}>
      <Box
        sx={{
          px: 2.75, py: 3, borderRadius: custom.radius.lg * 2,
          background: t.accent, color: t.onAccent, boxShadow: t.shadow.md,
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.85 }}>
          Faturamento de agosto
        </Typography>
        <Typography sx={{ fontFamily: "var(--font-heading)", fontSize: 38, lineHeight: 1.1, mt: 0.75 }}>
          {money(faturamento)}
        </Typography>
        <Stack
          direction="row"
          spacing={0.75}
          sx={{ alignItems: "center", justifyContent: "center", mt: 1.25, fontSize: 12.5, opacity: 0.92 }}
        >
          {heroUp ? <ArrowUpwardRoundedIcon sx={{ fontSize: 16 }} /> : <ArrowDownwardRoundedIcon sx={{ fontSize: 16 }} />}
          <span>{heroMeta}</span>
        </Stack>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
        <Card variant="outlined" sx={{ p: 2, gap: 0.5, display: "flex", flexDirection: "column", border: "none" }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: `${t.accent}29`, color: t.accent }}>
            <PaymentsOutlinedIcon sx={{ fontSize: 17 }} />
          </Avatar>
          <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: 0.5 }}>Gasto com materiais</Typography>
          <Typography sx={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>{money(materiaisTotal)}</Typography>
        </Card>
        <Card variant="outlined" sx={{ p: 2, gap: 0.5, display: "flex", flexDirection: "column", border: "none" }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: `${t.accent2}38`, color: t.accent2Ramp[700] }}>
            <EventAvailableOutlinedIcon sx={{ fontSize: 17 }} />
          </Avatar>
          <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: 0.5 }}>Agendadas hoje</Typography>
          <Typography sx={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>{agenda.length} clientes</Typography>
        </Card>
      </Box>

      <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", mt: 0.5 }}>
        <Typography variant="h4" sx={{ fontSize: 18 }}>Últimas movimentações</Typography>
        <Button variant="text" size="small" onClick={() => setTab("gastos")} sx={{ color: t.accent, fontSize: 12.5 }}>
          Ver tudo
        </Button>
      </Stack>

      <Stack spacing={1}>
        {recentes.map((m) => (
          <Card key={m.id} variant="outlined" sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1.5, p: "12px 14px", border: "none" }}>
            <Avatar sx={{ width: 38, height: 38, fontFamily: "var(--font-heading)", fontSize: 15, bgcolor: m.dotBg, color: m.dotFg }}>
              {m.initial}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>{m.title}</Typography>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>{m.meta}</Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: m.amountColor }}>{m.amount}</Typography>
              <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{m.date}</Typography>
            </Box>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
