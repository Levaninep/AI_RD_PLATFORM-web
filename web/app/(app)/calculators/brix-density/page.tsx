import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BrixDensityCalculatorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Brix / Density"
        description="Estimate density from target brix for quick formulation planning."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target Brix</Label>
              <Input placeholder="e.g. 12.0" />
            </div>
            <div className="space-y-2">
              <Label>Temperature (°C)</Label>
              <Input placeholder="e.g. 20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estimated Density</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold">— g/mL</p>
            <Badge variant="secondary">Placeholder</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
