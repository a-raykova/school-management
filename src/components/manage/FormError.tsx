export function FormError({ message }: { message: string }) {
  return (
    <div className="flex items-start mt-4 gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
      <span className="text-[13px] shrink-0">⚠️</span>
      <span className="text-[12px] leading-snug">{message}</span>
    </div>
  )
}