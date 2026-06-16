const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-orange-100 text-orange-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  locked: 'bg-red-100 text-red-700',
  unlocked: 'bg-green-100 text-green-700',
  stolen: 'bg-red-100 text-red-800',
  lost: 'bg-orange-100 text-orange-800',
  completed: 'bg-blue-100 text-blue-700',
  defaulted: 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status }: { status: string }) {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colorClass}`}>
      {status}
    </span>
  );
}
