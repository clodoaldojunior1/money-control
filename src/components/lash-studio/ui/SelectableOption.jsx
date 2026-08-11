"use client";

import Box from "@mui/material/Box";
import Radio from "@mui/material/Radio";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme, alpha } from "@mui/material/styles";
import { alphas } from "../../../theme/tokens";

export function SelectableOption({ selected, onSelect, label, hint, flex }) {
  const { custom } = useTheme();
  const t = custom.tokens;

  return (
    <Box
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      sx={{
        flex: flex ?? "1 1 0",
        display: "flex",
        alignItems: "center",
        gap: 1,
        cursor: "pointer",
        padding: hint ? "12px 14px" : "11px 14px",
        borderRadius: custom.radius.lg,
        border: `1px solid ${selected ? t.accent : t.divider}`,
        backgroundColor: selected ? alpha(t.accent, alphas.wash) : "transparent",
      }}
    >
      <Radio checked={selected} size="small" sx={{ p: 0 }} />
      <Stack sx={{ lineHeight: 1.25 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{label}</Typography>
        {hint && (
          <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{hint}</Typography>
        )}
      </Stack>
    </Box>
  );
}
