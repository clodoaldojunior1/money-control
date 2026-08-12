"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { useTheme, alpha } from "@mui/material/styles";
import { alphas } from "../../../theme/tokens";
import { useAppData } from "../../../context/AppDataProvider";
import { rotuloDoPeriodo } from "../../../lib/periodo";

/**
 * Seletor do mês em foco. Só as abas com escopo mensal o exibem — a Agenda é
 * do dia, não do mês.
 */
export function PeriodNavigator() {
  const { custom } = useTheme();
  const t = custom.tokens;
  const {
    periodo, ehMesAtual,
    irParaPeriodoAnterior, irParaPeriodoSeguinte, voltarAoMesAtual,
  } = useAppData();

  if (!periodo) return null;

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        justifyContent: "space-between",
        px: 0.5,
        py: 0.5,
        borderRadius: 999,
        backgroundColor: alpha(t.accent, alphas.wash),
      }}
    >
      <IconButton onClick={irParaPeriodoAnterior} size="small" aria-label="Mês anterior" sx={{ color: t.accent }}>
        <ChevronLeftRoundedIcon />
      </IconButton>

      <Box sx={{ textAlign: "center", minWidth: 0 }}>
        <Typography sx={{ fontFamily: "var(--font-heading)", fontSize: 15, lineHeight: 1.2, textTransform: "capitalize" }}>
          {rotuloDoPeriodo(periodo)}
        </Typography>
        {!ehMesAtual && (
          <Button
            onClick={voltarAoMesAtual}
            size="small"
            sx={{ minHeight: 0, py: 0, fontSize: 11, color: t.accent }}
          >
            voltar ao mês atual
          </Button>
        )}
      </Box>

      <IconButton
        onClick={irParaPeriodoSeguinte}
        size="small"
        aria-label="Próximo mês"
        disabled={ehMesAtual}
        sx={{ color: t.accent }}
      >
        <ChevronRightRoundedIcon />
      </IconButton>
    </Stack>
  );
}
