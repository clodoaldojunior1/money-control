"use client";

import { Controller } from "react-hook-form";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

/** Select (TextField select) ligado ao React Hook Form. */
export function FormSelectField({ control, name, rules, options, ...props }) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...props}
          select
          fullWidth
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
        >
          {options.map((o) => (
            <MenuItem key={o} value={o}>{o}</MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}
