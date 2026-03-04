import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Co2CalculatorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="CO₂ Calculator"
        description="UI scaffold for carbonation calculations and process checks."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Temperature (°C)</Label>
              <Input placeholder="e.g. 4" />
            </div>
            <div className="space-y-2">
              <Label>Pressure (bar)</Label>
              <Input placeholder="e.g. 2.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold">— g/L</p>
            <Badge variant="secondary">Coming soon</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
