"use client";

import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";

export function HeaderIconButton({ children, size = 42, ...props }) {
  const { custom } = useTheme();
  const t = custom.tokens;

  return (
    <IconButton
      {...props}
      sx={{
        width: size,
        height: size,
        border: `1px solid ${t.divider}`,
        color: t.text,
        borderRadius: custom.radius.md,
        ...props.sx,
      }}
    >
      {children}
    </IconButton>
  );
}
