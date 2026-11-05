"use client";

import { ForecastResult } from "./types";

const STORAGE_KEY = "basinshift_active_forecast";

export function saveActiveForecast(forecast: ForecastResult): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(forecast));
    } catch (e) {
      console.error("Failed to save forecast to localStorage", e);
    }
  }
}

export function getActiveForecast(): ForecastResult | null {
  if (typeof window !== "undefined") {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data) as ForecastResult;
      }
    } catch (e) {
      console.error("Failed to load forecast from localStorage", e);
    }
  }
  return null;
}

export function clearActiveForecast(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

