export const THEMES = [
  "Trahison amicale",
  "Jalousie sur un projet",
  "Solitude",
  "Pression familiale",
  "Déception amoureuse",
  "Échec",
] as const;

export type Theme = (typeof THEMES)[number];
