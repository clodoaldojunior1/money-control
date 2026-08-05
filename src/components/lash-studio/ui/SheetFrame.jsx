"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useTheme } from "@mui/material/styles";
import { HeaderIconButton } from "./HeaderIconButton";

export function SheetFrame({ title, onClose, children }) {
  const { custom } = useTheme();
  const t = custom.tokens;

  return (
    <Box sx={{ px: 2.75, pt: 1.25, pb: 3.25 }}>
      <Box sx={{ width: 44, height: 5, borderRadius: 999, backgroundColor: t.divider, mx: "auto", mb: 1.75 }} />
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.75 }}>
        <Typography sx={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 20 }}>{title}</Typography>
        <HeaderIconButton aria-label="Fechar" onClick={onClose}>
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </HeaderIconButton>
      </Stack>
      <Stack spacing={2}>{children}</Stack>
    </Box>
  );
}
