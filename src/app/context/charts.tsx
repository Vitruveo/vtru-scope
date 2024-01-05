"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

export interface SlidersValues {
  revenueValue: number;
  expenseThisMonth: number;
  earningsThisMonth: number;
  topSales: number;
  bestSeller: number;
  mostCommented: number;
  salary: number;
  marketing: number;
  others: number;
}

interface ChartDataParams {
  value: number;
  negative?: boolean;
}

interface ChartsContextProps {
  slidersValues: SlidersValues;
  setSlidersValues: React.Dispatch<React.SetStateAction<SlidersValues>>;
  createChartData: ({ value, negative }: ChartDataParams) => number[];
}

const ChartsContext = createContext<ChartsContextProps | undefined>(undefined);

export const ChartsProvider = ({ children }: { children: ReactNode }) => {
  const [slidersValues, setSlidersValues] = useState<SlidersValues>({
    revenueValue: 30,
    expenseThisMonth: 30,
    earningsThisMonth: 30,
    topSales: 50,
    bestSeller: 40,
    mostCommented: 30,
    salary: 30,
    marketing: 20,
    others: 50,
  });

  const createChartData = ({ value, negative }: ChartDataParams) => {
    const firstDigit = Math.floor(value / 10);

    return Array.from({ length: 6 }, (_, index) => {
      const startIndex = index + 4.5;
      return parseFloat(
        `${negative ? "-" : ""}${startIndex * firstDigit}.${
          firstDigit * startIndex
        }`
      );
    });
  };

  return (
    <ChartsContext.Provider
      value={{ slidersValues, setSlidersValues, createChartData }}
    >
      {children}
    </ChartsContext.Provider>
  );
};

export const useChartsContext = () => {
  const context = useContext(ChartsContext);
  if (!context) {
    throw new Error("useChartsContext");
  }
  return context;
};
