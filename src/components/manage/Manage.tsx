'use client'

import { useState } from 'react'
import { ScheduleEntry, TeacherOption } from '@/types'
import type { DbRoom } from '@/lib/api-client'
import Card, { CardHeader } from '@/components/layout/Card'
import Modal, { ModalFooter } from '@/components/layout/Modal'
import { inputCls, labelCls } from '@/constants'

type ManageTab = 'rooms' | 'teachers'

function TabBar({ active, onChange }: { active: ManageTab; onChange: (t: ManageTab) => void }) {
  const tabCls = (tab: ManageTab) =>
    `px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors ${
      active === tab ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
    }`
  return (
    <div className="flex gap-1 mb-4 bg-gray-50 border border-gray-200 rounded-xl p-1 w-fit">
      <button onClick={() => onChange('rooms')} className={tabCls('rooms')}>Rooms</button>
      <button onClick={() => onChange('teachers')} className={tabCls('teachers')}>Teachers</button>
    </div>
  )
}

const blankRoomForm = { name: '', color: '#3b82f6' }
const blankTeacherForm = { firstName: '', lastName: '', email: '', subtitle: '' }

interface ManageProps {
  schedule: ScheduleEntry[]
  rooms: DbRoom[]
  onAddRoom: (name: string, color?: string | null) => Promise<void>
  onUpdateRoom: (id: number, changes: { name?: string; color?: string | null; isActive?: boolean }) => Promise<void>
  onDeleteRoom: (id: number) => Promise<void>
  teachers: TeacherOption[]
  onAddTeacher: (input: {
    firstName: string
    lastName: string
    email: string
    subtitle?: string | null
    honorariumRate?: number | null
  }) => Promise<void>
  onUpdateTeacher: (
    id: number,
    changes: {
      firstName?: string
      lastName?: string
      email?: string
      subtitle?: string | null
      isActive?: boolean
      honorariumRate?: number | null
    },
  ) => Promise<void>
  onDeleteTeacher: (id: number) => Promise<void>
}

export default function Manage({
  schedule,
  rooms,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
  teachers,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
}: ManageProps) {
  const [tab, setTab] = useState<ManageTab>('rooms')

  // --- rooms state (unchanged) ---
  const [modalOpen, setModalOpen] = useState(false)
  const [editRoom, setEditRoom] = useState<DbRoom | null>(null)
  const [form, setForm] = useState(blankRoomForm)
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const roomClassCount = (roomName: string) => schedule.filter(e => e.room === roomName).length

  const openAdd = () => {
    setEditRoom(null)
    setForm(blankRoomForm)
    setNameError(null)
    setModalOpen(true)
  }

  const openEdit = (room: DbRoom) => {
    setEditRoom(room)
    setForm({ name: room.name, color: room.color ?? '#3b82f6' })
    setNameError(null)
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditRoom(null) }

  const handleSave = async () => {
    if (!form.name.trim()) { setNameError('Room name is required'); return }
    setSaving(true)
    try {
      if (editRoom) {
        await onUpdateRoom(editRoom.id, { name: form.name.trim(), color: form.color })
      } else {
        await onAddRoom(form.name.trim(), form.color)
      }
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (room: DbRoom) => {
    const count = roomClassCount(room.name)
    const warning = count > 0
      ? `"${room.name}" is used by ${count} class${count === 1 ? '' : 'es'}. It can't be deleted, so it'll be archived instead — it'll disappear from new bookings but existing classes keep working. Continue?`
      : `Delete "${room.name}"? This can't be undone.`
    if (!confirm(warning)) return
    await onDeleteRoom(room.id)
  }

  const handleRestore = (room: DbRoom) => onUpdateRoom(room.id, { isActive: true })

  // --- teachers state ---
  const [teacherModalOpen, setTeacherModalOpen] = useState(false)
  const [editTeacher, setEditTeacher] = useState<TeacherOption | null>(null)
  const [teacherForm, setTeacherForm] = useState(blankTeacherForm)
  const [teacherSaving, setTeacherSaving] = useState(false)
  const [teacherFormError, setTeacherFormError] = useState<string | null>(null)

  const teacherClassCount = (teacherName: string) => schedule.filter(e => e.teacher === teacherName).length

  const openAddTeacher = () => {
    setEditTeacher(null)
    setTeacherForm(blankTeacherForm)
    setTeacherFormError(null)
    setTeacherModalOpen(true)
  }

  const openEditTeacher = (teacher: TeacherOption) => {
    const [firstName, ...rest] = teacher.name.split(' ')
    setEditTeacher(teacher)
    setTeacherForm({
      firstName,
      lastName: rest.join(' '),
      email: teacher.email,
      subtitle: teacher.subtitle ?? '',
    })
    setTeacherFormError(null)
    setTeacherModalOpen(true)
  }

  const closeTeacherModal = () => { setTeacherModalOpen(false); setEditTeacher(null) }

  const handleSaveTeacher = async () => {
    if (!teacherForm.firstName.trim() || !teacherForm.lastName.trim()) {
      setTeacherFormError('First and last name are required')
      return
    }
    if (!teacherForm.email.trim()) {
      setTeacherFormError('Email is required')
      return
    }

    setTeacherSaving(true)
    try {
      const payload = {
        firstName: teacherForm.firstName.trim(),
        lastName: teacherForm.lastName.trim(),
        email: teacherForm.email.trim(),
        subtitle: teacherForm.subtitle.trim() || null,
      }
      if (editTeacher) {
        await onUpdateTeacher(editTeacher.id, payload)
      } else {
        await onAddTeacher(payload)
      }
      closeTeacherModal()
    } finally {
      setTeacherSaving(false)
    }
  }

  const handleDeleteTeacher = async (teacher: TeacherOption) => {
    const count = teacherClassCount(teacher.name)
    const warning = count > 0
      ? `"${teacher.name}" has ${count} class${count === 1 ? '' : 'es'}. They can't be deleted, so they'll be archived instead — hidden from new bookings, but existing classes and past honorariums keep working. Note: their Supabase login will still work — disable it separately in Supabase if you want them fully locked out. Continue?`
      : `Delete "${teacher.name}"? This can't be undone. Note: this does not remove their Supabase login — delete that separately if needed.`
    if (!confirm(warning)) return
    await onDeleteTeacher(teacher.id)
  }

  const handleRestoreTeacher = (teacher: TeacherOption) => onUpdateTeacher(teacher.id, { isActive: true })

  return (
    <div>
      <h1 className="text-[18px] font-medium text-gray-900 mb-4">Manage</h1>
      <TabBar active={tab} onChange={setTab} />

      {tab === 'teachers' ? (
        <Card>
          <CardHeader
            title="Teachers"
            action={
              <button
                onClick={openAddTeacher}
                className="px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[12px] font-medium hover:bg-blue-100 transition-colors"
              >
                + Add teacher
              </button>
            }
          />
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            Adding a teacher here does not create their login. Create a matching Supabase account with the exact same email separately.
          </p>
          {teachers.length === 0 ? (
            <p className="text-[12px] text-gray-400 italic">No teachers yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                    <th className="pb-2 font-medium">Teacher</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Classes</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teachers.map(teacher => {
                    const count = teacherClassCount(teacher.name)
                    return (
                      <tr key={teacher.id} className={!teacher.isActive ? 'opacity-50' : ''}>
                        <td className="py-2.5">
                          <div className="font-medium text-gray-800">{teacher.name}</div>
                          <div className="text-[11px] text-gray-400">{teacher.subtitle}</div>
                        </td>
                        <td className="py-2.5 text-gray-600">{teacher.email}</td>
                        <td className="py-2.5 text-gray-600">{count}</td>
                        <td className="py-2.5">
                          {teacher.isActive ? (
                            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                          ) : (
                            <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Archived</span>
                          )}
                        </td>
                        <td className="py-2.5">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openEditTeacher(teacher)}
                              className="px-2.5 py-1 rounded text-[11px] text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              Edit
                            </button>
                            {teacher.isActive ? (
                              <button
                                onClick={() => handleDeleteTeacher(teacher)}
                                className="px-2.5 py-1 rounded text-[11px] text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                              >
                                Delete
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRestoreTeacher(teacher)}
                                className="px-2.5 py-1 rounded text-[11px] text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                              >
                                Restore
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <CardHeader
            title="Rooms"
            action={
              <button
                onClick={openAdd}
                className="px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[12px] font-medium hover:bg-blue-100 transition-colors"
              >
                + Add room
              </button>
            }
          />
          {rooms.length === 0 ? (
            <p className="text-[12px] text-gray-400 italic">No rooms yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                    <th className="pb-2 font-medium">Room</th>
                    <th className="pb-2 font-medium">Classes</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rooms.map(room => {
                    const count = roomClassCount(room.name)
                    return (
                      <tr key={room.id} className={!room.isActive ? 'opacity-50' : ''}>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 border border-gray-200"
                              style={{ backgroundColor: room.color ?? '#3b82f6' }}
                            />
                            <span className="font-medium text-gray-800">{room.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-gray-600">{count}</td>
                        <td className="py-2.5">
                          {room.isActive ? (
                            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                          ) : (
                            <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Archived</span>
                          )}
                        </td>
                        <td className="py-2.5">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openEdit(room)}
                              className="px-2.5 py-1 rounded text-[11px] text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              Edit
                            </button>
                            {room.isActive ? (
                              <button
                                onClick={() => handleDelete(room)}
                                className="px-2.5 py-1 rounded text-[11px] text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                              >
                                Delete
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRestore(room)}
                                className="px-2.5 py-1 rounded text-[11px] text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                              >
                                Restore
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Room modal (unchanged) */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editRoom ? 'Edit room' : 'Add room'}>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Room name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => { setForm({ ...form, name: e.target.value }); setNameError(null) }}
              placeholder="e.g. Room 3"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Color</label>
            <input
              type="color"
              value={form.color}
              onChange={e => setForm({ ...form, color: e.target.value })}
              className="w-14 h-9 rounded-lg border border-gray-300 cursor-pointer"
            />
          </div>
        </div>
        {nameError && (
          <div className="flex items-start mt-4 gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
            <span className="text-[13px] shrink-0">⚠️</span>
            <span className="text-[12px] leading-snug">{nameError}</span>
          </div>
        )}
        <ModalFooter onCancel={closeModal} onConfirm={handleSave} confirmLabel={saving ? 'Saving…' : (editRoom ? 'Save changes' : 'Add room')} />
      </Modal>

      {/* Teacher modal */}
      <Modal isOpen={teacherModalOpen} onClose={closeTeacherModal} title={editTeacher ? 'Edit teacher' : 'Add teacher'}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>First name</label>
              <input
                type="text"
                value={teacherForm.firstName}
                onChange={e => { setTeacherForm({ ...teacherForm, firstName: e.target.value }); setTeacherFormError(null) }}
                placeholder="Ivan"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Last name</label>
              <input
                type="text"
                value={teacherForm.lastName}
                onChange={e => { setTeacherForm({ ...teacherForm, lastName: e.target.value }); setTeacherFormError(null) }}
                placeholder="Petrov"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              value={teacherForm.email}
              onChange={e => { setTeacherForm({ ...teacherForm, email: e.target.value }); setTeacherFormError(null) }}
              placeholder="must match their Supabase login email"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Subtitle (shown in sidebar)</label>
            <input
              type="text"
              value={teacherForm.subtitle}
              onChange={e => setTeacherForm({ ...teacherForm, subtitle: e.target.value })}
              placeholder="Teacher"
              className={inputCls}
            />
          </div>
        </div>
        {teacherFormError && (
          <div className="flex items-start mt-4 gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
            <span className="text-[13px] shrink-0">⚠️</span>
            <span className="text-[12px] leading-snug">{teacherFormError}</span>
          </div>
        )}
        <ModalFooter
          onCancel={closeTeacherModal}
          onConfirm={handleSaveTeacher}
          confirmLabel={teacherSaving ? 'Saving…' : (editTeacher ? 'Save changes' : 'Add teacher')}
        />
      </Modal>
    </div>
  )
}