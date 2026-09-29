"use client";

import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";

export function SegmentedControl({ value, onChange, options, fullWidth = false, ...props }) {
  return (
    <ToggleButtonGroup
      {...props}
      value={value}
      exclusive
      onChange={(_, next) => next != null && onChange(next)}
      sx={fullWidth ? { display: "flex", width: "100%" } : { alignSelf: "flex-start" }}
    >
      {options.map((opt) => (
        <ToggleButton
          key={opt.value}
          value={opt.value}
          sx={fullWidth ? { flex: 1, py: 1.1 } : { px: 1.75, py: 1 }}
        >
          {opt.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
