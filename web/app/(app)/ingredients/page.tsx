"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { INGREDIENT_CATEGORIES } from "@/lib/ingredient";

type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

type IngredientRecord = {
  id: string;
  ingredientName: string;
  category: IngredientCategory;
  supplier: string;
  countryOfOrigin: string;
  pricePerKgEur: number;
  brixPercent: number | null;
  titratableAcidityPercent: number | null;
  updatedAt: string;
};

type IngredientFormState = {
  id?: string;
  ingredientName: string;
  category: IngredientCategory;
  supplier: string;
  countryOfOrigin: string;
  brix: string;
  acidity: string;
  pricePerKg: string;
};

const defaultForm: IngredientFormState = {
  ingredientName: "",
  category: "Juice",
  supplier: "",
  countryOfOrigin: "",
  brix: "",
  acidity: "",
  pricePerKg: "",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function IngredientsPage() {
  const [rows, setRows] = useState<IngredientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [supplier, setSupplier] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<IngredientFormState>(defaultForm);

  const suppliers = useMemo(
    () => Array.from(new Set(rows.map((item) => item.supplier))),
    [rows],
  );

  const filtered = useMemo(() => {
    return rows.filter((item) => {
      const searchHit =
        item.ingredientName.toLowerCase().includes(query.toLowerCase()) ||
        item.supplier.toLowerCase().includes(query.toLowerCase());
      const categoryHit = category === "all" || item.category === category;
      const supplierHit = supplier === "all" || item.supplier === supplier;
      return searchHit && categoryHit && supplierHit;
    });
  }, [rows, query, category, supplier]);

  const loadIngredients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const firstResponse = await fetch(
        "/api/ingredients?page=1&limit=100&sortBy=updatedAt&sortOrder=desc",
        {
          cache: "no-store",
        },
      );

      const firstData = (await firstResponse.json().catch(() => null)) as {
        items?: Array<{
          id: string;
          ingredientName: string;
          category: IngredientCategory;
          supplier: string;
          countryOfOrigin?: string;
          pricePerKgEur?: number;
          brixPercent?: number | null;
          titratableAcidityPercent?: number | null;
          updatedAt?: string;
        }>;
        page?: number;
        totalPages?: number;
        error?: { message?: string };
      } | null;

      if (!firstResponse.ok) {
        throw new Error(
          firstData?.error?.message ?? "Failed to load ingredients.",
        );
      }

      const totalPages = Math.max(1, Number(firstData?.totalPages ?? 1));
      const remainingPages = Array.from(
        { length: Math.max(0, totalPages - 1) },
        (_, index) => index + 2,
      );

      const additionalResponses = await Promise.all(
        remainingPages.map((page) =>
          fetch(
            `/api/ingredients?page=${page}&limit=100&sortBy=updatedAt&sortOrder=desc`,
            {
              cache: "no-store",
            },
          )
            .then(async (response) => {
              const data = (await response.json().catch(() => null)) as {
                items?: Array<{
                  id: string;
                  ingredientName: string;
                  category: IngredientCategory;
                  supplier: string;
                  countryOfOrigin?: string;
                  pricePerKgEur?: number;
                  brixPercent?: number | null;
                  titratableAcidityPercent?: number | null;
                  updatedAt?: string;
                }>;
              } | null;

              if (!response.ok) {
                return [];
              }

              return data?.items ?? [];
            })
            .catch(() => []),
        ),
      );

      const allItems = [
        ...(firstData?.items ?? []),
        ...additionalResponses.flat(),
      ];

      const mapped = allItems.map((item) => ({
        id: item.id,
        ingredientName: item.ingredientName,
        category: item.category,
        supplier: item.supplier,
        countryOfOrigin: item.countryOfOrigin ?? "Unknown",
        pricePerKgEur: Number(item.pricePerKgEur ?? 0),
        brixPercent: item.brixPercent ?? null,
        titratableAcidityPercent: item.titratableAcidityPercent ?? null,
        updatedAt: item.updatedAt ?? new Date().toISOString(),
      }));

      setRows(mapped);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load ingredients.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIngredients();
  }, [loadIngredients]);

  function openCreate() {
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(item: IngredientRecord) {
    setForm({
      id: item.id,
      ingredientName: item.ingredientName,
      category: item.category,
      supplier: item.supplier,
      countryOfOrigin: item.countryOfOrigin,
      brix: item.brixPercent == null ? "" : String(item.brixPercent),
      acidity:
        item.titratableAcidityPercent == null
          ? ""
          : String(item.titratableAcidityPercent),
      pricePerKg: String(item.pricePerKgEur),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (
      !form.ingredientName.trim() ||
      !form.supplier.trim() ||
      !form.pricePerKg.trim()
    ) {
      return;
    }

    const priceValue = Number(form.pricePerKg);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setError("Price/kg must be a valid positive number.");
      return;
    }

    const payload = {
      ingredientName: form.ingredientName.trim(),
      category: form.category,
      supplier: form.supplier.trim(),
      countryOfOrigin: form.countryOfOrigin.trim() || "Unknown",
      pricePerKgEur: priceValue,
      brixPercent: form.brix.trim() ? Number(form.brix) : undefined,
      titratableAcidityPercent: form.acidity.trim()
        ? Number(form.acidity)
        : undefined,
      co2SolubilityRelevant: false,
      vegan: false,
      natural: false,
    };

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/ingredients", {
        method: form.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form.id ? { id: form.id, ...payload } : payload),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;

      if (!response.ok) {
        throw new Error(data?.error?.message ?? "Failed to save ingredient.");
      }

      setDialogOpen(false);
      setForm(defaultForm);
      await loadIngredients();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save ingredient.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/ingredients", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;

      if (!response.ok) {
        throw new Error(data?.error?.message ?? "Failed to delete ingredient.");
      }

      setRows((prev) => prev.filter((item) => item.id !== id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete ingredient.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ingredients"
        description="Manage ingredient specifications, suppliers, and pricing."
        actions={
          <Button
            className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            onClick={openCreate}
          >
            <Plus className="mr-2 size-4" /> Add Ingredient
          </Button>
        }
      />

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search ingredients..."
            className="rounded-xl border-slate-200"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-xl border-slate-200">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Sweetener">Sweetener</SelectItem>
              <SelectItem value="Juice">Juice</SelectItem>
              <SelectItem value="Acid">Acid</SelectItem>
              <SelectItem value="Flavor">Flavor</SelectItem>
              <SelectItem value="Extract">Extract</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={supplier} onValueChange={setSupplier}>
            <SelectTrigger className="rounded-xl border-slate-200">
              <SelectValue placeholder="Supplier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliers.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <DataTable>
        {loading ? (
          <div className="p-4 text-sm text-slate-500">
            Loading ingredients...
          </div>
        ) : null}
        {error ? <div className="p-4 text-sm text-red-600">{error}</div> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Brix</TableHead>
              <TableHead>Acidity</TableHead>
              <TableHead>Price/kg</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[56px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-slate-900">
                  {item.ingredientName}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                  >
                    {item.category}
                  </Badge>
                </TableCell>
                <TableCell>{item.supplier}</TableCell>
                <TableCell>{item.brixPercent ?? "—"}</TableCell>
                <TableCell>{item.titratableAcidityPercent ?? "—"}</TableCell>
                <TableCell>{formatCurrency(item.pricePerKgEur)}</TableCell>
                <TableCell>{item.updatedAt.slice(0, 10)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => openEdit(item)}>
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(item)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTable>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit Ingredient" : "Add Ingredient"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Name"
              value={form.ingredientName}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  ingredientName: event.target.value,
                }))
              }
              className="rounded-xl"
            />
            <Select
              value={form.category}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  category: value as IngredientCategory,
                }))
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sweetener">Sweetener</SelectItem>
                <SelectItem value="Juice">Juice</SelectItem>
                <SelectItem value="Acid">Acid</SelectItem>
                <SelectItem value="Flavor">Flavor</SelectItem>
                <SelectItem value="Extract">Extract</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Supplier"
              value={form.supplier}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, supplier: event.target.value }))
              }
              className="rounded-xl"
            />
            <Input
              placeholder="Country of origin"
              value={form.countryOfOrigin}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  countryOfOrigin: event.target.value,
                }))
              }
              className="rounded-xl"
            />
            <Input
              type="number"
              placeholder="Price/kg"
              value={form.pricePerKg}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, pricePerKg: event.target.value }))
              }
              className="rounded-xl"
            />
            <Input
              type="number"
              placeholder="Brix (optional)"
              value={form.brix}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, brix: event.target.value }))
              }
              className="rounded-xl"
            />
            <Input
              type="number"
              placeholder="Acidity (optional)"
              value={form.acidity}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, acidity: event.target.value }))
              }
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={saving}
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
