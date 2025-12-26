import { atom } from "jotai";
import type { TickInfo } from "@/types";

export const tickInfoAtom = atom<TickInfo>({} as TickInfo);
