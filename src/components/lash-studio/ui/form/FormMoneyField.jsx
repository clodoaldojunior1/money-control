"use client";

import { Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { MoneyField } from "../MoneyField";

/** MoneyField ligado ao React Hook Form, com slot de erro de altura fixa. */
export function FormMoneyField({ control, name, rules, label, size = "md", autoFocus }) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <Box>
          {label && (
            <Typography sx={{ fontSize: 12, mb: 0.75, color: "text.secondary" }}>{label}</Typography>
          )}
          <MoneyField value={field.value} onChange={field.onChange} size={size} autoFocus={autoFocus} />
          <Typography sx={{ fontSize: 11.5, color: "error.main", minHeight: 16, mt: 0.5 }}>
            {fieldState.error?.message ?? ""}
          </Typography>
        </Box>
      )}
    />
  );
}
