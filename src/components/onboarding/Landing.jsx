"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import MuiLink from "@mui/material/Link";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import { useTheme, alpha } from "@mui/material/styles";
import { alphas } from "../../theme/tokens";
import { PublicShell } from "./PublicShell";
import { BrandMark } from "./BrandMark";

const STATS = [
  { value: "4", label: "módulos integrados" },
  { value: "1 min", label: "para lançar o dia" },
  { value: "R$ 0", label: "nos 14 primeiros dias" },
];

const FEATURES = [
  { title: "Entradas", body: "Cada atendimento pago vira faturamento na hora, com forma de pagamento.", icon: TrendingUpRoundedIcon, tom: "accent" },
  { title: "Gastos", body: "Separe pessoal de trabalho, fixo de variável, e veja onde dá para cortar.", icon: ReceiptLongRoundedIcon, tom: "accent2" },
  { title: "Materiais", body: "Estoque com alerta de mínimo e custo unitário — já somado aos gastos.", icon: Inventory2RoundedIcon, tom: "accent" },
  { title: "Agenda", body: "Horários do dia, status de cada cliente e o serviço que ela fechou.", icon: EventRoundedIcon, tom: "accent2" },
];

const PLANS = [
  { name: "Essencial", price: "R$ 0", period: "/mês", body: "Entradas e gastos, até 30 lançamentos por mês.", destaque: false },
  { name: "Pro", price: "R$ 29", period: "/mês", body: "Todos os módulos, estoque ilimitado e relatórios do mês.", destaque: true },
];

export function Landing() {
  const { custom } = useTheme();
  const t = custom.tokens;

  const tomDoIcone = (tom) => (tom === "accent"
    ? { bg: alpha(t.accent, alphas.tint), fg: t.accent }
    : { bg: alpha(t.accent2, alphas.tint), fg: t.accent2Ramp[700] });

  return (
    <PublicShell>
      {/* Hero */}
      <Box sx={{ position: "relative", px: 3, pt: 5.5, pb: 4.25, backgroundColor: t.accent, color: t.onAccent, overflow: "hidden" }}>
        <Box sx={{ position: "absolute", right: -70, top: -60, width: 220, height: 220, borderRadius: "50%", backgroundColor: alpha(t.onAccent, 0.1) }} />

        <Stack direction="row" sx={{ position: "relative", alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <BrandMark onAccent />
            <Typography sx={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 16 }}>Nico</Typography>
          </Stack>
          <Button component={Link} href="/login" sx={{ color: "inherit", fontSize: 13 }}>Entrar</Button>
        </Stack>

        <Box sx={{ position: "relative", mt: 4.75 }}>
          <Chip
            label="Para lash designers autônomas"
            size="small"
            sx={{ backgroundColor: alpha(t.onAccent, 0.18), color: "inherit", fontSize: 11 }}
          />
          <Typography component="h1" sx={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 36, lineHeight: 1.12, mt: 2, textWrap: "pretty" }}>
            Seu studio inteiro em um só lugar
          </Typography>
          <Typography sx={{ fontSize: 14.5, lineHeight: 1.6, opacity: 0.9, mt: 1.5, textWrap: "pretty" }}>
            Registre entradas, controle o estoque de materiais, acompanhe gastos e organize a agenda.
            O lucro do mês calculado sem planilha.
          </Typography>

          <Stack spacing={1.25} sx={{ mt: 3 }}>
            <Button
              component={Link}
              href="/cadastro"
              sx={{ py: 1.9, backgroundColor: t.surface, color: t.accent, fontSize: 15, "&:hover": { backgroundColor: t.neutral[100] } }}
            >
              Criar conta grátis
            </Button>
            <Button
              component={Link}
              href="/login"
              sx={{ py: 1.6, color: "inherit", border: `1px solid ${alpha(t.onAccent, 0.34)}`, fontSize: 14 }}
            >
              Já tenho conta
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 2, fontSize: 12, opacity: 0.85 }}>
            <CheckRoundedIcon sx={{ fontSize: 16 }} />
            <span>14 dias de teste · sem cartão</span>
          </Stack>
        </Box>
      </Box>

      {/* Conteúdo */}
      <Stack spacing={3.25} sx={{ px: 3, pt: 3.5, pb: 4.25 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.25 }}>
          {STATS.map((s) => (
            <Card key={s.label} variant="outlined" sx={{ display: "flex", flexDirection: "column", gap: 0.25, p: "14px 12px", border: "none", boxShadow: t.shadow.sm }}>
              <Typography sx={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 20, color: t.accent }}>{s.value}</Typography>
              <Typography sx={{ fontSize: 10.5, lineHeight: 1.35, color: "text.secondary" }}>{s.label}</Typography>
            </Card>
          ))}
        </Box>

        <Stack spacing={1.75}>
          <Typography component="h2" sx={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 24, lineHeight: 1.2 }}>
            Quatro módulos, uma conta só
          </Typography>
          {FEATURES.map(({ title, body, icon: Icon, tom }) => {
            const cor = tomDoIcone(tom);
            return (
              <Card key={title} variant="outlined" sx={{ display: "flex", flexDirection: "row", gap: 1.75, p: 2, alignItems: "flex-start", border: "none" }}>
                <Box sx={{ width: 38, height: 38, flex: "none", borderRadius: "11px", display: "grid", placeItems: "center", backgroundColor: cor.bg, color: cor.fg }}>
                  <Icon sx={{ fontSize: 20 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{title}</Typography>
                  <Typography sx={{ fontSize: 12.5, lineHeight: 1.55, mt: 0.4, color: "text.secondary" }}>{body}</Typography>
                </Box>
              </Card>
            );
          })}
        </Stack>

        {/* Depoimento */}
        <Card variant="outlined" sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 2.75, border: "none", backgroundColor: t.deepSurface, color: t.onDeepSurface, boxShadow: t.shadow.md }}>
          <FormatQuoteRoundedIcon sx={{ fontSize: 26, opacity: 0.6 }} />
          <Typography sx={{ fontSize: 15, lineHeight: 1.55, textWrap: "pretty" }}>
            Eu fechava o mês no caderno e sempre esquecia o que gastei com material.
            Agora abro o app e o número já está lá.
          </Typography>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mt: 0.5 }}>
            <Box sx={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: alpha(t.onDeepSurface, alphas.tintStrong), display: "grid", placeItems: "center", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14 }}>M</Box>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Manuela Reis</Typography>
              <Typography sx={{ fontSize: 11.5, opacity: 0.72 }}>Studio Manu Lashes · Curitiba</Typography>
            </Box>
          </Stack>
        </Card>

        {/* Planos */}
        <Stack spacing={1.5}>
          <Typography component="h2" sx={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 24, lineHeight: 1.2 }}>
            Planos
          </Typography>
          {PLANS.map((p) => (
            <Card
              key={p.name}
              variant="outlined"
              sx={{ display: "flex", flexDirection: "column", gap: 0.75, p: 2.25, border: `1px solid ${p.destaque ? t.accent : t.divider}` }}
            >
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{p.name}</Typography>
                {p.destaque && (
                  <Chip label="Mais escolhido" size="small" sx={{ height: 20, fontSize: 10.5, backgroundColor: t.accentRamp[100], color: t.accentRamp[800] }} />
                )}
              </Stack>
              <Stack direction="row" spacing={0.6} sx={{ alignItems: "baseline" }}>
                <Typography sx={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 28 }}>{p.price}</Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{p.period}</Typography>
              </Stack>
              <Typography sx={{ fontSize: 12.5, lineHeight: 1.55, color: "text.secondary" }}>{p.body}</Typography>
            </Card>
          ))}
        </Stack>

        {/* CTA final */}
        <Stack spacing={1.25} sx={{ p: 2.75, borderRadius: `${custom.radius.lg}px`, backgroundColor: alpha(t.accent, alphas.wash) }}>
          <Typography sx={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 20, lineHeight: 1.25 }}>
            Comece hoje o controle do seu studio
          </Typography>
          <Button component={Link} href="/cadastro" variant="contained" sx={{ py: 1.75, fontSize: 15 }}>
            Criar minha conta
          </Button>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", fontSize: 11.5, pt: 0.5, borderTop: `1px solid ${t.divider}`, color: "text.secondary" }}>
          <MuiLink href="#" underline="hover">Termos</MuiLink>
          <MuiLink href="#" underline="hover">Privacidade</MuiLink>
          <MuiLink href="#" underline="hover">Suporte</MuiLink>
          <Box component="span" sx={{ ml: "auto" }}>© 2026 Nico</Box>
        </Stack>
      </Stack>
    </PublicShell>
  );
}
