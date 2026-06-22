export interface DielectricMaterial {
  id: string;
  name: string;
  dielectricConstant: number;
  notes: string;
}

export const materials: DielectricMaterial[] = [
  {
    id: "fr4-generic",
    name: "Generic FR-4",
    dielectricConstant: 4.2,
    notes: "Planning value only; confirm with laminate and fabricator data.",
  },
  {
    id: "low-dk-example",
    name: "Low-Dk planning example",
    dielectricConstant: 3.6,
    notes: "Placeholder for future supplier-backed materials.",
  },
];
