import typography from "./Typography";
import { shadows } from "./Shadows";
import { LightThemeColors } from "./LightThemeColors";
import { baselightTheme } from "./DefaultColors";
import * as locales from "@mui/material/locale";

export const configTheme = () => {
  const themeOptions = LightThemeColors[2];

  const defaultTheme = baselightTheme;
  const defaultShadow = shadows;
  const themeSelect = themeOptions;
  const baseMode = {
    palette: {
      mode: "light",
    },
    shape: {
      borderRadius: 7,
    },
    shadows: defaultShadow,
    typography: typography,
  };

  const theme = {
    baseMode,
    defaultTheme,
    locales,
    themeSelect,
    direction: "ltr",
  };

  return theme;
};
