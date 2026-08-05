// Design tokens ported from the "Lash Studio App" design-canvas prototype's
// own <style> override block (teal palette), not the base "Organic" system.

export const fontHeading = "var(--font-heading), 'Instrument Sans', system-ui, sans-serif";
export const fontBody = "var(--font-body), 'Plus Jakarta Sans', system-ui, sans-serif";

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
};

const shared = {
  onAccent: "#ffffff",
};

export const tokens = {
  light: {
    ...shared,
    bg: "#f4f6f7",
    surface: "#ffffff",
    text: "#151b21",
    accent: "#1f5f5b",
    accent2: "#3c6e8f",
    divider: "rgba(21,27,33,0.12)",
    danger: "#b3261e",
    neutral: {
      100: "#f5f7f8",
      200: "#e9edef",
      300: "#d5dbdf",
      400: "#b3bcc2",
      500: "#8d979f",
      600: "#6c767e",
      700: "#4e5760",
      800: "#333b43",
      900: "#1c2229",
    },
    accentRamp: {
      100: "#e8f2f0",
      200: "#cfe3e0",
      300: "#a6cbc6",
      400: "#6fa8a2",
      500: "#3f847e",
      600: "#2a6d68",
      700: "#1c5551",
      800: "#123c39",
      900: "#0b2725",
    },
    accent2Ramp: {
      100: "#eaf1f7",
      200: "#d3e2ee",
      300: "#adc7dc",
      400: "#7ea5c4",
      500: "#5786a9",
      600: "#3c6e8f",
      700: "#2b5471",
      800: "#1d3b51",
      900: "#122633",
    },
    shadow: {
      sm: "0 1px 2px rgba(21,27,33,.08)",
      md: "0 4px 14px rgba(21,27,33,.10)",
      lg: "0 18px 44px rgba(21,27,33,.18)",
    },
    pageBg: "#e6eaec",
  },
  dark: {
    ...shared,
    onAccent: "#0d1114",
    bg: "#101418",
    surface: "#181e24",
    text: "#e9eef2",
    accent: "#4fa39b",
    accent2: "#7ea5c4",
    divider: "rgba(233,238,242,0.14)",
    danger: "#f2b8b5",
    neutral: {
      100: "#181e24",
      200: "#20272e",
      300: "#2c343c",
      400: "#3c454e",
      500: "#586069",
      600: "#79818a",
      700: "#9aa1a8",
      800: "#c3c9ce",
      900: "#e9eef2",
    },
    accentRamp: {
      100: "#123c39",
      200: "#1c5551",
      300: "#2a6d68",
      400: "#3f847e",
      500: "#6fa8a2",
      600: "#a6cbc6",
      700: "#cfe3e0",
      800: "#e8f2f0",
      900: "#f1f8f7",
    },
    accent2Ramp: {
      100: "#1d3b51",
      200: "#2b5471",
      300: "#3c6e8f",
      400: "#5786a9",
      500: "#7ea5c4",
      600: "#adc7dc",
      700: "#d3e2ee",
      800: "#eaf1f7",
      900: "#f4f8fb",
    },
    shadow: {
      sm: "0 1px 2px rgba(0,0,0,.5)",
      md: "0 4px 14px rgba(0,0,0,.45)",
      lg: "0 18px 44px rgba(0,0,0,.55)",
    },
    pageBg: "#0b0f12",
  },
};

export function getTokens(mode) {
  return tokens[mode] ?? tokens.light;
}
