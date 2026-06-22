export interface SupplierStackup {
  supplier: string;
  id: string;
  name: string;
  source: string;
  dielectricHeightMm: number;
  dielectricConstant: number;
  copperThicknessUm: number;
}

export const pcbwayStackups: SupplierStackup[] = [
  {
    supplier: "PCBWay",
    id: "pcbway-placeholder-4l",
    name: "PCBWay placeholder 4-layer planning stackup",
    source: "Placeholder pending supplier data review.",
    dielectricHeightMm: 0.18,
    dielectricConstant: 4.2,
    copperThicknessUm: 35,
  },
];
