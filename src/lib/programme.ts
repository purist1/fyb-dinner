import { GraduationCap, Utensils, Trophy, Music, DoorOpen, type LucideIcon } from "lucide-react";

export type ProgrammeStep = {
  time: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const PROGRAMME: ProgrammeStep[] = [
  {
    time: "3:00 PM",
    title: "Arrival & Reception",
    description: "Welcome drinks and warm fellowship as guests take their seats.",
    icon: DoorOpen,
  },
  {
    time: "3:30 PM",
    title: "Worship & Opening",
    description: "Praise, prayer, and reflection as one body before the Lord.",
    icon: Music,
  },
  {
    time: "4:30 PM",
    title: "Dinner Service",
    description: "An elegant three-course formal dining experience.",
    icon: Utensils,
  },
  {
    time: "5:30 PM",
    title: "Awards Ceremony",
    description: "Honouring dedicated servants and outstanding finalists.",
    icon: Trophy,
  },
  {
    time: "6:30 PM",
    title: "Send-Forth & Closing",
    description: "Commissioning the FYB class into the next chapter of God's calling.",
    icon: GraduationCap,
  },
];
