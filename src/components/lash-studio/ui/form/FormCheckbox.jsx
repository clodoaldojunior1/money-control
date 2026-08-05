"use client";

import { Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";

/** Checkbox ligado ao React Hook Form. `label` aceita nós, não só texto. */
export function FormCheckbox({ control, name, rules, label, alignTop = false }) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <Box>
          <FormControlLabel
            sx={{ alignItems: alignTop ? "flex-start" : "center", m: 0, gap: 0.5 }}
            control={
              <Checkbox
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                onBlur={field.onBlur}
                size="small"
                sx={{ p: 0.5, mt: alignTop ? 0.1 : 0 }}
              />
            }
            slotProps={{ typography: { sx: { fontSize: 12.5, lineHeight: 1.5 } } }}
            label={label}
          />
          {fieldState.error && (
            <FormHelperText error sx={{ ml: 0, fontSize: 11.5 }}>{fieldState.error.message}</FormHelperText>
          )}
        </Box>
      )}
    />
  );
}
