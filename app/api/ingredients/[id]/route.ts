import {
  DELETE as deleteIngredient,
  PUT as updateIngredient,
} from "@/app/api/ingredients/route";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  url.searchParams.set("id", id);

  const body = await req.json().catch(() => ({}));

  return updateIngredient(
    new Request(url.toString(), {
      method: "PUT",
      headers: req.headers,
      body: JSON.stringify({ ...body, id }),
    }),
  );
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  url.searchParams.set("id", id);

  return deleteIngredient(
    new Request(url.toString(), {
      method: "DELETE",
      headers: req.headers,
      body: JSON.stringify({ id }),
    }),
  );
}
