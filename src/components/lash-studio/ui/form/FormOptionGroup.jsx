"use client";

import { Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SelectableOption } from "../SelectableOption";

/**
 * Grupo de SelectableOption ligado ao React Hook Form.
 * `options`: [{ value, label, hint? }]
 */
export function FormOptionGroup({ control, name, label, options, direction = "column" }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Box>
          {label && (
            <Typography sx={{ fontSize: 12, mb: 0.75, color: "text.secondary" }}>{label}</Typography>
          )}
          <Stack direction={direction} spacing={direction === "row" ? 1.25 : 1}>
            {options.map((o) => (
              <SelectableOption
                key={o.value}
                label={o.label}
                hint={o.hint}
                selected={field.value === o.value}
                onSelect={() => field.onChange(o.value)}
              />
            ))}
          </Stack>
        </Box>
      )}
    />
  );
}
