'use client'

import { useState } from 'react'
import { Announcement, CurrentUser } from '@/types'
import Card from '@/components/layout/Card'
import Badge from '@/components/layout/Badge'
import Modal, { ModalFooter } from '@/components/layout/Modal'

interface AnnouncementsProps {
  announcements: Announcement[]
  onPost: (title: string, body: string) => void
  user: CurrentUser  // ← add this
}

export default function Announcements({ announcements, onPost, user }: AnnouncementsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle]   = useState('')
  const [body, setBody]     = useState('')

  const visible = announcements.filter(ann => {
    if (!ann.targetTeacher) return true
    if (user.role === 'admin') return true
    return ann.targetTeacher === `${user.firstName} ${user.lastName}`
  })

  const handlePost = () => {
    if (!title.trim() || !body.trim()) return
    onPost(title.trim(), body.trim())
    setTitle('')
    setBody('')
    setIsOpen(false)
  }

  const inputCls =
    'w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-300 bg-white'

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-medium text-gray-900">Announcements</h1>
        <button
          onClick={() => setIsOpen(true)}
          className="px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[12px] font-medium hover:bg-blue-100 transition-colors"
        >
          + Write
        </button>
      </div>

      <Card>
        <div className="divide-y divide-gray-50">
          {visible.map((ann) => (
            <div key={ann.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3 mb-1">
                <span className="text-[13px] font-medium text-gray-900">{ann.title}</span>
                {ann.isNew ? (
                  <Badge variant="amber">{ann.date}</Badge>
                ) : (
                  <span className="text-[11px] text-gray-400 shrink-0">{ann.date}</span>
                )}
              </div>
              <p className="text-[12px] text-gray-500 leading-relaxed">{ann.body}</p>
            </div>
          ))}
        </div>
      </Card>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Write announcement">
        <div className="space-y-2.5">
          <div>
            <label className="block text-[12px] text-gray-500 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[12px] text-gray-500 mb-1">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here..."
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>
        <ModalFooter
          onCancel={() => setIsOpen(false)}
          onConfirm={handlePost}
          confirmLabel="Post"
        />
      </Modal>
    </div>
  )
}
