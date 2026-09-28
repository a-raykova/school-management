export function RowActions({
  isActive,
  onEdit,
  onDeleteOrRestore,
}: {
  isActive: boolean
  onEdit: () => void
  onDeleteOrRestore: () => void
}) {
  return (
    <div className="flex justify-end gap-1.5">
      <button onClick={onEdit} className="px-2.5 py-1 rounded text-[11px] text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
        Edit
      </button>
      {isActive ? (
        <button onClick={onDeleteOrRestore} className="px-2.5 py-1 rounded text-[11px] text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors">
          Delete
        </button>
      ) : (
        <button onClick={onDeleteOrRestore} className="px-2.5 py-1 rounded text-[11px] text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors">
          Restore
        </button>
      )}
    </div>
  )
}