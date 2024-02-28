"use client";
import { NextAppDirEmotionCacheProvider } from "@/app/common/theme/EmotionCache";
import { configTheme } from "@/app/common/theme/Theme";
import "@/app/common/i18n";
import CssBaseline from "@mui/material/CssBaseline";
import {
  Direction,
  Shadows,
  ThemeProvider,
  createTheme,
} from "@mui/material/styles";
import { TypographyOptions } from "@mui/material/styles/createTypography";
import { Inter } from "next/font/google";
import { ChartsProvider } from "./context/charts";
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from './providers';
const inter = Inter({ subsets: ["latin"] });

const MyApp = ({ children }: { children: React.ReactNode }) => {
  const theme = configTheme();
  return (
    <ChartsProvider>
      <NextAppDirEmotionCacheProvider options={{ key: "modernize" }}>
        <ThemeProvider
          theme={createTheme({
            direction: theme.defaultTheme.direction as Direction,
            palette: {
              primary: {
                main: "#763EBD",
                light: "#F2ECF9",
                dark: "#6E35B7",
                contrastText: "#ffffff",
              },
              secondary: {
                main: "#95CFD5",
                light: "#EDF8FA",
                dark: "#8BC8CE",
                contrastText: "#ffffff",
              },
              success: {
                main: "#13DEB9",
                light: "#E6FFFA",
                dark: "#02b3a9",
                contrastText: "#ffffff",
              },
              info: {
                main: "#539BFF",
                light: "#EBF3FE",
                dark: "#1682d4",
                contrastText: "#ffffff",
              },
              error: {
                main: "#FA896B",
                light: "#FDEDE8",
                dark: "#f3704d",
                contrastText: "#ffffff",
              },
              warning: {
                main: "#FFAE1F",
                light: "#FEF5E5",
                dark: "#ae8e59",
                contrastText: "#ffffff",
              },
              grey: {
                100: "#F2F6FA",
                200: "#EAEFF4",
                300: "#DFE5EF",
                400: "#7C8FAC",
                500: "#5A6A85",
                600: "#2A3547",
              },
              text: {
                primary: "#2A3547",
                secondary: "#2A3547",
              },
              action: {
                disabledBackground: "rgba(73,82,88,0.12)",
                hoverOpacity: 0.02,
                hover: "#f6f9fc",
              },
              divider: "#e5eaef",
            },
            typography: theme.baseMode.typography as TypographyOptions,
            shadows: theme.baseMode.shadows as Shadows,
            shape: {
              borderRadius: theme.baseMode.shape.borderRadius,
            },
          })}
        >
          <CssBaseline />
          <Providers>{children}</Providers>
        </ThemeProvider>
      </NextAppDirEmotionCacheProvider>
    </ChartsProvider>
  );
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MyApp>{children}</MyApp>
      </body>
    </html>
  );
}
