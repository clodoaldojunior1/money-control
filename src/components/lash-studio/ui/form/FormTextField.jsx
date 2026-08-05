"use client";

import { Controller } from "react-hook-form";
import TextField from "@mui/material/TextField";

/** TextField ligado ao React Hook Form. Reserva espaço para o erro por padrão. */
export function FormTextField({ control, name, rules, reserveHelperText = false, ...props }) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...props}
          fullWidth
          error={!!fieldState.error}
          helperText={fieldState.error?.message ?? (reserveHelperText ? " " : props.helperText)}
        />
      )}
    />
  );
}
