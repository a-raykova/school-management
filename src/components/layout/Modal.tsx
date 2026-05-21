'use client'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl border border-gray-100 p-5 w-[340px] max-w-[90vw]">
        <div className="text-[15px] font-medium text-gray-900 mb-3.5">{title}</div>
        {children}
      </div>
    </div>
  )
}

interface ModalFooterProps {
  onCancel: () => void
  onConfirm: () => void
  confirmLabel?: string
}

export function ModalFooter({ onCancel, onConfirm, confirmLabel = 'Save' }: ModalFooterProps) {
  return (
    <div className="flex justify-end gap-2 mt-3.5">
      <button
        onClick={onCancel}
        className="px-3.5 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        className="px-3.5 py-1.5 bg-blue-50 text-blue-700 border border-transparent rounded-lg text-[12px] font-medium hover:bg-blue-100 transition-colors"
      >
        {confirmLabel}
      </button>
    </div>
  )
}
