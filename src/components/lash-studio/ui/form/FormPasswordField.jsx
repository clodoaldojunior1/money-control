"use client";

import { useState } from "react";
import { Controller } from "react-hook-form";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

/** Campo de senha com alternância de visibilidade, ligado ao React Hook Form. */
export function FormPasswordField({ control, name, rules, autoComplete, reserveHelperText = true, ...props }) {
  const [visivel, setVisivel] = useState(false);

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
          type={visivel ? "text" : "password"}
          autoComplete={autoComplete}
          error={!!fieldState.error}
          helperText={fieldState.error?.message ?? (reserveHelperText ? " " : props.helperText)}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setVisivel((v) => !v)}
                    edge="end"
                    aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
                    size="small"
                  >
                    {visivel
                      ? <VisibilityOffOutlinedIcon sx={{ fontSize: 20 }} />
                      : <VisibilityOutlinedIcon sx={{ fontSize: 20 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      )}
    />
  );
}
