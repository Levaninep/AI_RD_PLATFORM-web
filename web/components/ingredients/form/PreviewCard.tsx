type PreviewCardProps = {
  title: string;
  value: string;
  formula: string;
};

export default function PreviewCard({
  title,
  value,
  formula,
}: PreviewCardProps) {
  return (
    <div className="rounded-md border border-gray-200 bg-white/80 p-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {title}
      </p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
      <p className="mt-0.5 text-[11px] text-gray-500">{formula}</p>
    </div>
  );
}
