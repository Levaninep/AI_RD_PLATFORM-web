import type { ShelfLifeActivityLog } from "@/lib/shelf-life-types";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function actionLabel(action: ShelfLifeActivityLog["action"]) {
  switch (action) {
    case "CREATE":
      return "Created";
    case "UPDATE":
      return "Updated";
    case "GENERATE":
      return "Generated timepoints";
    case "RESULT_UPDATE":
      return "Updated result";
    case "DELETE":
      return "Deleted";
    default:
      return action;
  }
}

function metadataSummary(metadata: Record<string, unknown> | null) {
  if (!metadata) {
    return null;
  }

  const changedFields = metadata.changedFields;
  if (Array.isArray(changedFields) && changedFields.length > 0) {
    const fields = changedFields
      .map((value) => (typeof value === "string" ? value : null))
      .filter((value): value is string => Boolean(value));

    if (fields.length > 0) {
      return `Changed: ${fields.join(", ")}`;
    }
  }

  if (typeof metadata.generatedCount === "number") {
    return `Generated ${metadata.generatedCount} events`;
  }

  if (typeof metadata.productName === "string") {
    return metadata.productName;
  }

  return null;
}

export function ActivityRow({ log }: { log: ShelfLifeActivityLog }) {
  return (
    <article className="rounded-md border border-gray-200 bg-white px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-900">
          {actionLabel(log.action)}
        </p>
        <p className="text-xs text-gray-500">{formatDateTime(log.createdAt)}</p>
      </div>
      <p className="mt-1 text-xs text-gray-600">
        By {log.actorName || log.actorId || "System"} ·{" "}
        {log.entityType.replaceAll("_", " ")}
      </p>
      {metadataSummary(log.metadata) ? (
        <p className="mt-1 text-xs text-gray-700">
          {metadataSummary(log.metadata)}
        </p>
      ) : null}
    </article>
  );
}
