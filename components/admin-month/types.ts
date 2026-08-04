import type { ReactNode } from "react";

export type MonthItemAgenda = {
  title: string;
  timeLabel: string;
  badgeLabel: string;
  meta?: string;
};

export type MonthItem = {
  id: string;
  /** ISO yyyy-MM-dd */
  date: string;
  status: string;
  /** Label ringkas untuk sel kalendar (mis. tajuk servis atau "Bilik A · Pagi"). */
  chip: string;
  /** Kad penuh untuk paparan senarai / butiran hari / panel expand agenda. */
  card: ReactNode;
  /** Untuk senarai mingguan gaya takwim. Jika tiada, Senarai guna kad penuh. */
  agenda?: MonthItemAgenda;
};
