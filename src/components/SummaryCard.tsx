type Props = {
  title: string;
  value: number | string;
  Icon: React.ComponentType<{ className?: string }>;
};

export default function SummaryCard({ title, value, Icon }: Props) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
          <Icon className="h-5 w-5 text-gray-700" />
        </div>
        <div className="ml-auto text-2xl font-semibold text-gray-900">{value}</div>
      </div>
      <div className="mt-2 text-sm text-gray-600">{title}</div>
    </div>
  );
}
