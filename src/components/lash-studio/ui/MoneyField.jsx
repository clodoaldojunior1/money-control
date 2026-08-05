"use client";

import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

const SIZES = {
  lg: { padding: "16px 20px", radius: 26, prefixFont: 22, valueFont: 34 },
  md: { padding: "10px 16px", radius: 14, prefixFont: 16, valueFont: 24 },
};

export function MoneyField({ value, onChange, size = "md", autoFocus }) {
  const { custom } = useTheme();
  const t = custom.tokens;
  const s = SIZES[size];

  return (
    <Box
      sx={{
        display: "flex", alignItems: "baseline", gap: 1,
        padding: s.padding, borderRadius: `${s.radius}px`,
        backgroundColor: `${t.accent}1f`,
      }}
    >
      <Typography sx={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: s.prefixFont, color: t.accent }}>
        R$
      </Typography>
      <InputBase
        autoFocus={autoFocus}
        type="number"
        inputMode="decimal"
        placeholder="0,00"
        value={value}
        onChange={(e) => onChange(e.target.value.replace("-", ""))}
        sx={{
          fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: s.valueFont,
          "& input": { padding: 0 },
        }}
      />
    </Box>
  );
}
