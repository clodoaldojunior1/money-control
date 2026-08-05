import { createTheme } from "@mui/material/styles";
import { getTokens, fontHeading, fontBody, radius } from "./tokens";

export function buildTheme(mode) {
  const t = getTokens(mode);

  return createTheme({
    palette: {
      mode,
      primary: { main: t.accent, contrastText: t.onAccent },
      secondary: { main: t.accent2, contrastText: t.onAccent },
      error: { main: t.danger },
      background: { default: t.bg, paper: t.surface },
      divider: t.divider,
      text: { primary: t.text },
    },
    shape: { borderRadius: radius.md },
    typography: {
      fontFamily: fontBody,
      h1: { fontFamily: fontHeading, fontWeight: 600, letterSpacing: "-0.02em" },
      h2: { fontFamily: fontHeading, fontWeight: 600, letterSpacing: "-0.02em" },
      h3: { fontFamily: fontHeading, fontWeight: 600, letterSpacing: "-0.02em" },
      h4: { fontFamily: fontHeading, fontWeight: 600, letterSpacing: "-0.02em" },
      h5: { fontFamily: fontHeading, fontWeight: 600, letterSpacing: "-0.02em" },
      h6: { fontFamily: fontHeading, fontWeight: 600, letterSpacing: "-0.02em" },
      button: { fontFamily: fontBody, fontWeight: 600, textTransform: "none" },
    },
    custom: {
      tokens: t,
      radius,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: t.bg },
          "input[type=number]": { MozAppearance: "textfield" },
          "input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button": {
            WebkitAppearance: "none",
            margin: 0,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: radius.md, fontWeight: 600, boxShadow: "none" },
          contained: { boxShadow: "none", "&:hover": { boxShadow: "none" } },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: radius.md },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none" },
          rounded: { borderRadius: radius.lg },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 999, fontWeight: 500 },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: radius.md },
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            borderRadius: radius.md,
            overflow: "hidden",
            border: `1px solid ${t.divider}`,
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            border: 0,
            borderRadius: 0,
            textTransform: "none",
            fontWeight: 600,
            fontSize: 13,
            color: t.text,
            "&.Mui-selected": {
              backgroundColor: t.accent,
              color: t.onAccent,
            },
            "&.Mui-selected:hover": {
              backgroundColor: t.accent,
            },
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: { boxShadow: t.shadow.lg },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: { backgroundColor: "transparent" },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            borderRadius: radius.md,
            minWidth: "auto",
            color: t.text,
            "&.Mui-selected": { color: t.accent },
          },
          label: { fontSize: 10, fontWeight: 600, "&.Mui-selected": { fontSize: 10 } },
        },
      },
    },
  });
}
