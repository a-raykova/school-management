export function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
  ) : (
    <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Archived</span>
  )
}