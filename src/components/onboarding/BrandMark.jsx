"use client";

import Box from "@mui/material/Box";
import { useTheme, alpha } from "@mui/material/styles";

/** Quadrado com a inicial da marca. `onAccent` para uso sobre fundo accent. */
export function BrandMark({ size = 30, radius = 9, fontSize = 14, onAccent = false }) {
  const { custom } = useTheme();
  const t = custom.tokens;

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: `${radius}px`,
        display: "grid",
        placeItems: "center",
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        fontSize,
        backgroundColor: onAccent ? alpha(t.onAccent, 0.18) : t.accent,
        color: onAccent ? "inherit" : t.onAccent,
      }}
    >
      L
    </Box>
  );
}
