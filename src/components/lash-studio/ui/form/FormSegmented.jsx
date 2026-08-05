"use client";

import { Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { SegmentedControl } from "../SegmentedControl";

/** SegmentedControl ligado ao React Hook Form, com label opcional. */
export function FormSegmented({ control, name, label, options, fullWidth = true, onAfterChange }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Box>
          {label && (
            <Typography sx={{ fontSize: 12, mb: 0.75, color: "text.secondary" }}>{label}</Typography>
          )}
          <SegmentedControl
            value={field.value}
            onChange={(next) => {
              field.onChange(next);
              onAfterChange?.(next);
            }}
            options={options}
            fullWidth={fullWidth}
          />
        </Box>
      )}
    />
  );
}
