"use client";

import Box from "@mui/material/Box";
import { useTheme, alpha } from "@mui/material/styles";

/**
 * A marca do Nico: um N dentro de um C. Mesma geometria dos ícones do PWA
 * (scripts/gerar-icones.mjs). `onAccent` para uso sobre fundo accent.
 */
export function BrandMark({ size = 30, radius = 9, onAccent = false }) {
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
        backgroundColor: onAccent ? alpha(t.onAccent, 0.18) : t.accent,
        color: onAccent ? "inherit" : t.onAccent,
      }}
    >
      <svg viewBox="0 0 512 512" width="100%" height="100%" aria-hidden="true">
        <path
          d="M371 160 A150 150 0 1 0 371 352"
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.6}
          strokeWidth={30}
          strokeLinecap="round"
        />
        <path
          d="M196 322 V190 L316 322 V190"
          fill="none"
          stroke="currentColor"
          strokeWidth={40}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  );
}
