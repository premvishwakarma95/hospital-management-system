import { Weekday } from "../models/Doctor";

export const SLOT_DURATION_MINUTES = 30;

const weekdayMap: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const getWeekday = (date: Date): Weekday => weekdayMap[date.getDay()];

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const toHHMM = (minutes: number): string => {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

export interface Slot {
  start: string;
  end: string;
}

export const generateSlots = (slotStart: string, slotEnd: string): Slot[] => {
  const startMin = toMinutes(slotStart);
  const endMin = toMinutes(slotEnd);
  const slots: Slot[] = [];
  for (let t = startMin; t + SLOT_DURATION_MINUTES <= endMin; t += SLOT_DURATION_MINUTES) {
    slots.push({ start: toHHMM(t), end: toHHMM(t + SLOT_DURATION_MINUTES) });
  }
  return slots;
};
