"use client";
import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import RTL from "@/app/(pages)/layout/shared/customizer/RTL";
import { ThemeSettings } from "@/utils/theme/Theme";
import { store } from "@/store/store";
import { useSelector } from "@/store/hooks";
import { AppState } from "@/store/store";
import { Provider } from "react-redux";

import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import "@/app/api/index";
import "@/utils/i18n";
import { NextAppDirEmotionCacheProvider } from "@/utils/theme/EmotionCache";
import Head from "next/head";
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from './providers';


export const MyApp = ({ children }: { children: React.ReactNode }) => {
  const theme = ThemeSettings();

  const customizer = useSelector((state: AppState) => state.customizer);

  return (
    <>
    
      <NextAppDirEmotionCacheProvider options={{ key: 'modernize' }}>
      <ThemeProvider theme={theme}>
        <RTL direction={customizer.activeDir}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          <Providers>{children}</Providers>
        </RTL>
      </ThemeProvider>
      </NextAppDirEmotionCacheProvider>
    </>
  );
};

export default function RootLayout({ children, }: {  children: React.ReactNode; }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider store={store}>
            <MyApp>
              {children}
            </MyApp>
        </Provider>
      </body>
    </html>
  );
}
