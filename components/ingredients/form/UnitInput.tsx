type UnitInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "decimal";
  step?: string;
  unit?: string;
  type?: "text" | "number";
  hasError?: boolean;
  ariaDescribedBy?: string;
};

export default function UnitInput({
  id,
  value,
  onChange,
  placeholder,
  inputMode = "text",
  step,
  unit,
  type = "text",
  hasError,
  ariaDescribedBy,
}: UnitInputProps) {
  return (
    <div className="relative">
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        step={step}
        type={type}
        aria-invalid={hasError ? "true" : "false"}
        aria-describedby={ariaDescribedBy}
        className={`w-full rounded-md border px-3 py-2 pr-20 text-sm focus:outline-none focus:ring-2 ${
          hasError
            ? "border-red-300 focus:ring-red-200"
            : "border-gray-300 focus:ring-blue-200"
        }`}
      />
      {unit ? (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-gray-500">
          {unit}
        </span>
      ) : null}
    </div>
  );
}
