export type KpiItem = {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: "folder" | "beaker" | "flask" | "timer";
};

export type RecentFormulation = {
  id: string;
  name: string;
  category: string;
  brix: number;
  status: "Draft" | "In Review" | "Approved";
};

export type ActivityLogItem = {
  id: string;
  text: string;
  timestamp: string;
  type: "create" | "update" | "alert";
};

export type IngredientAlert = {
  id: string;
  message: string;
  severity: "Low" | "Medium" | "High";
};

export type IngredientRow = {
  id: string;
  name: string;
  category: "Sweetener" | "Juice" | "Acid" | "Flavor" | "Extract";
  supplier: string;
  brix: number | null;
  acidity: number | null;
  pricePerKg: number;
  updated: string;
};

export type FormulationLine = {
  ingredient: string;
  amount: number;
  unit: "%" | "g/L";
  cost: number;
};

export type FormulationSummary = {
  id: string;
  name: string;
  targetBrix: number;
  targetPH: number;
  co2: number | null;
  lines: FormulationLine[];
};

export type ShelfLifeTestRow = {
  id: string;
  product: string;
  method: "Accelerated" | "Real-Time";
  startDate: string;
  status: "Planned" | "Running" | "Completed";
};

export type ReportItem = {
  id: string;
  title: string;
  type: string;
  generatedAt: string;
  summary: string;
};

export const kpis: KpiItem[] = [
  {
    title: "Active Projects",
    value: "12",
    change: "+8%",
    trend: "up",
    icon: "folder",
  },
  {
    title: "Ingredients",
    value: "246",
    change: "+4%",
    trend: "up",
    icon: "beaker",
  },
  {
    title: "Formulations This Month",
    value: "37",
    change: "+12%",
    trend: "up",
    icon: "flask",
  },
  {
    title: "Shelf-Life Tests Running",
    value: "9",
    change: "-2%",
    trend: "down",
    icon: "timer",
  },
];

export const cogsBreakdown = [
  { name: "Juices", value: 36 },
  { name: "Sweeteners", value: 24 },
  { name: "Acids", value: 18 },
  { name: "Flavors", value: 14 },
  { name: "Packaging", value: 8 },
];

export const formulationActivitySeries = [
  { month: "Jan", value: 9 },
  { month: "Feb", value: 12 },
  { month: "Mar", value: 11 },
  { month: "Apr", value: 15 },
  { month: "May", value: 18 },
  { month: "Jun", value: 16 },
];

export const recentFormulations: RecentFormulation[] = [
  {
    id: "f1",
    name: "Citrus Spark Zero",
    category: "Carbonated",
    brix: 7.2,
    status: "Approved",
  },
  {
    id: "f2",
    name: "Berry Active+",
    category: "Functional",
    brix: 8.1,
    status: "In Review",
  },
  {
    id: "f3",
    name: "Peach Ice Tea Light",
    category: "Tea",
    brix: 6.4,
    status: "Draft",
  },
  {
    id: "f4",
    name: "Apple Ginger Fizz",
    category: "Sparkling",
    brix: 9,
    status: "In Review",
  },
];

export const activityLog: ActivityLogItem[] = [
  {
    id: "a1",
    text: "Updated acid balance for Citrus Spark Zero",
    timestamp: "10 min ago",
    type: "update",
  },
  {
    id: "a2",
    text: "Created formulation Berry Active+",
    timestamp: "35 min ago",
    type: "create",
  },
  {
    id: "a3",
    text: "Low stock alert generated for Citric Acid",
    timestamp: "1 hour ago",
    type: "alert",
  },
  {
    id: "a4",
    text: "Shelf-life test SL-104 moved to Running",
    timestamp: "2 hours ago",
    type: "update",
  },
];

export const ingredientAlerts: IngredientAlert[] = [
  {
    id: "i1",
    message: "Low stock: Citric Acid",
    severity: "High",
  },
  {
    id: "i2",
    message: "Price change: Apple Juice Concentrate",
    severity: "Medium",
  },
  {
    id: "i3",
    message: "Lead time risk: Natural Peach Flavor",
    severity: "Low",
  },
];

export const ingredientsSeed: IngredientRow[] = [
  {
    id: "ing1",
    name: "Citric Acid",
    category: "Acid",
    supplier: "AcidChem",
    brix: null,
    acidity: 0.72,
    pricePerKg: 2.4,
    updated: "2026-03-02",
  },
  {
    id: "ing2",
    name: "Apple Juice Concentrate",
    category: "Juice",
    supplier: "FruitBase",
    brix: 68,
    acidity: 0.18,
    pricePerKg: 3.9,
    updated: "2026-03-03",
  },
  {
    id: "ing3",
    name: "Stevia Blend",
    category: "Sweetener",
    supplier: "SweetTech",
    brix: null,
    acidity: null,
    pricePerKg: 9.2,
    updated: "2026-03-01",
  },
  {
    id: "ing4",
    name: "Natural Peach Flavor",
    category: "Flavor",
    supplier: "AromaLab",
    brix: null,
    acidity: null,
    pricePerKg: 12.4,
    updated: "2026-02-28",
  },
  {
    id: "ing5",
    name: "Green Tea Extract",
    category: "Extract",
    supplier: "PhytoSupply",
    brix: null,
    acidity: null,
    pricePerKg: 15.6,
    updated: "2026-03-01",
  },
];

export const formulationsSeed: FormulationSummary[] = [
  {
    id: "frm1",
    name: "Citrus Spark Zero",
    targetBrix: 7.2,
    targetPH: 3.2,
    co2: 5.8,
    lines: [
      {
        ingredient: "Apple Juice Concentrate",
        amount: 8,
        unit: "%",
        cost: 0.42,
      },
      { ingredient: "Citric Acid", amount: 1.5, unit: "g/L", cost: 0.09 },
      { ingredient: "Stevia Blend", amount: 0.3, unit: "%", cost: 0.11 },
    ],
  },
  {
    id: "frm2",
    name: "Berry Active+",
    targetBrix: 8.1,
    targetPH: 3.4,
    co2: 4.8,
    lines: [
      { ingredient: "Green Tea Extract", amount: 1.1, unit: "g/L", cost: 0.18 },
      {
        ingredient: "Natural Peach Flavor",
        amount: 0.25,
        unit: "%",
        cost: 0.21,
      },
      { ingredient: "Citric Acid", amount: 1.2, unit: "g/L", cost: 0.07 },
    ],
  },
  {
    id: "frm3",
    name: "Peach Ice Tea Light",
    targetBrix: 6.4,
    targetPH: 3.6,
    co2: null,
    lines: [
      { ingredient: "Green Tea Extract", amount: 1.8, unit: "g/L", cost: 0.25 },
      { ingredient: "Natural Peach Flavor", amount: 0.4, unit: "%", cost: 0.3 },
      { ingredient: "Stevia Blend", amount: 0.2, unit: "%", cost: 0.08 },
    ],
  },
];

export const shelfLifeTestsSeed: ShelfLifeTestRow[] = [
  {
    id: "sl1",
    product: "Citrus Spark Zero",
    method: "Accelerated",
    startDate: "2026-02-20",
    status: "Running",
  },
  {
    id: "sl2",
    product: "Berry Active+",
    method: "Real-Time",
    startDate: "2026-01-11",
    status: "Running",
  },
  {
    id: "sl3",
    product: "Peach Ice Tea Light",
    method: "Accelerated",
    startDate: "2026-02-01",
    status: "Planned",
  },
  {
    id: "sl4",
    product: "Apple Ginger Fizz",
    method: "Real-Time",
    startDate: "2025-11-14",
    status: "Completed",
  },
];

export const reportsSeed: ReportItem[] = [
  {
    id: "r1",
    title: "Monthly COGS Snapshot",
    type: "Cost",
    generatedAt: "2026-03-01",
    summary: "COGS increased 3.4% driven by concentrate costs and packaging.",
  },
  {
    id: "r2",
    title: "Shelf-Life Stability Summary",
    type: "Shelf-Life",
    generatedAt: "2026-02-26",
    summary: "Two tests completed with stable pH and color across checkpoints.",
  },
  {
    id: "r3",
    title: "Formulation Throughput",
    type: "R&D",
    generatedAt: "2026-02-20",
    summary:
      "37 formulations iterated this month; approval cycle shortened by 11%.",
  },
];
