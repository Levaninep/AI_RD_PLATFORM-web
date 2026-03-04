"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function toNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function JuiceCalculatorPage() {
  const [concentrateWeight, setConcentrateWeight] = useState("125");
  const [concentrateBrix, setConcentrateBrix] = useState("65");
  const [singleStrengthBrix, setSingleStrengthBrix] = useState("11.8");
  const [finalBatchWeight, setFinalBatchWeight] = useState("1000");

  const result = useMemo(() => {
    const weight = toNumber(concentrateWeight);
    const cb = toNumber(concentrateBrix);
    const ssb = toNumber(singleStrengthBrix);
    const finalW = toNumber(finalBatchWeight);

    if (!weight || !cb || !ssb || !finalW || ssb <= 0 || finalW <= 0) {
      return { juiceEquivalent: 0, juicePercent: 0, valid: false };
    }

    const juiceEquivalent = (weight * cb) / ssb;
    const juicePercent = (juiceEquivalent / finalW) * 100;

    return {
      juiceEquivalent: Number(juiceEquivalent.toFixed(2)),
      juicePercent: Number(juicePercent.toFixed(1)),
      valid: true,
    };
  }, [
    concentrateWeight,
    concentrateBrix,
    singleStrengthBrix,
    finalBatchWeight,
  ]);

  const dummyRows = [
    { name: "Orange", weight: 80, brix: 65, ssb: 11.8 },
    { name: "Apple", weight: 45, brix: 70, ssb: 11.5 },
  ];

  const totals = dummyRows.reduce(
    (acc, row) => {
      const eq = (row.weight * row.brix) / row.ssb;
      acc.eq += eq;
      return acc;
    },
    { eq: 0 },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Juice Percentage Calculator"
        description="Compute juice equivalent and final juice percentage from concentrate brix data."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Concentrate Weight (g)</Label>
              <Input
                value={concentrateWeight}
                onChange={(e) => setConcentrateWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Concentrate Brix
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Brix value of the concentrate ingredient.
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                value={concentrateBrix}
                onChange={(e) => setConcentrateBrix(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Single Strength Brix</Label>
              <Input
                value={singleStrengthBrix}
                onChange={(e) => setSingleStrengthBrix(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Final Batch Weight (g)</Label>
              <Input
                value={finalBatchWeight}
                onChange={(e) => setFinalBatchWeight(e.target.value)}
              />
            </div>
            <Button variant="outline" className="w-full">
              Save Scenario
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Juice Equivalent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {result.juiceEquivalent.toFixed(2)} g
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Juice %</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {result.juicePercent.toFixed(1)}%
              </p>
              {!result.valid ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter valid numeric values to calculate.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Multi-juice contribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[340px] overflow-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/70">
                <TableRow>
                  <TableHead>Juice</TableHead>
                  <TableHead>Weight (g)</TableHead>
                  <TableHead>Conc. Brix</TableHead>
                  <TableHead>SS Brix</TableHead>
                  <TableHead className="text-right">Equivalent (g)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dummyRows.map((row) => (
                  <TableRow key={row.name} className="hover:bg-muted/40">
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.weight}</TableCell>
                    <TableCell>{row.brix}</TableCell>
                    <TableCell>{row.ssb}</TableCell>
                    <TableCell className="text-right">
                      {((row.weight * row.brix) / row.ssb).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40 font-medium">
                  <TableCell colSpan={4}>Total</TableCell>
                  <TableCell className="text-right">
                    {totals.eq.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
