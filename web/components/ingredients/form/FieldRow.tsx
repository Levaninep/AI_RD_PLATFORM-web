import { ReactNode } from "react";

type FieldRowProps = {
  id: string;
  label: string;
  helper?: string;
  required?: boolean;
  error?: string;
  tooltip?: string;
  children: ReactNode;
};

export default function FieldRow({
  id,
  label,
  helper,
  required,
  error,
  tooltip,
  children,
}: FieldRowProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <label
            htmlFor={id}
            className="text-xs font-medium uppercase tracking-wide text-gray-600"
          >
            {label}
          </label>
          {required ? (
            <span className="rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-rose-700">
              Required
            </span>
          ) : null}
        </div>
        {tooltip ? (
          <span
            className="cursor-help text-xs text-gray-400"
            title={tooltip}
            aria-label={`Info: ${tooltip}`}
          >
            ⓘ
          </span>
        ) : null}
      </div>

      {children}

      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-600">
          {error}
        </p>
      ) : helper ? (
        <p id={`${id}-helper`} className="text-[11px] text-gray-500">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
