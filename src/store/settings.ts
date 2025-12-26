import { atom } from "jotai";

const DEFAULT_TICK_OFFSET = 15;

export type Settings = {
  tickOffset: number;
  darkMode: boolean;
  notifications: boolean;
};

const localStorageSettings = JSON.parse(
  localStorage.getItem("settings") || `{"tickOffset": ${DEFAULT_TICK_OFFSET},"darkMode": true,"notifications": false}`,
) as Settings;

export const settingsAtom = atom(
  {
    tickOffset: localStorageSettings.tickOffset,
    darkMode: localStorageSettings.darkMode,
    notifications: localStorageSettings.notifications,
  },
  (get, set, update: Partial<Settings>) => {
    const newSettings = { ...get(settingsAtom), ...update };
    set(settingsAtom, newSettings);
    localStorage.setItem("settings", JSON.stringify(newSettings));
  },
);
