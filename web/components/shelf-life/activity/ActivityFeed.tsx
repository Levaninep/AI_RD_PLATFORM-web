import type { ShelfLifeActivityLog } from "@/lib/shelf-life-types";
import { ActivityRow } from "@/components/shelf-life/activity/ActivityRow";

type ActivityFeedProps = {
  logs: ShelfLifeActivityLog[];
  loading: boolean;
  error: string | null;
  nextCursor: string | null;
  onLoadMore: () => void;
};

export function ActivityFeed({
  logs,
  loading,
  error,
  nextCursor,
  onLoadMore,
}: ActivityFeedProps) {
  if (loading && logs.length === 0) {
    return (
      <div className="rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
        Loading activity...
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
        No activity yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {logs.map((log) => (
        <ActivityRow key={log.id} log={log} />
      ))}

      {nextCursor ? (
        <div className="pt-1">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className="rounded border border-gray-200 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
