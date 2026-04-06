"use client"

import { ReactNode } from "react"

type AdminModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  maxWidthClass?: string
}

export function AdminModal({
  open,
  title,
  onClose,
  children,
  maxWidthClass = "max-w-2xl",
}: AdminModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-xl border bg-white p-6 shadow-lg ${maxWidthClass}`} onClick={(event) => event.stopPropagation()}>
        <h2 className="mb-4 text-xl font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  )
}
