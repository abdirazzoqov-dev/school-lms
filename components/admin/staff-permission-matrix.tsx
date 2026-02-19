'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck, ShieldOff, Eye, Plus, Edit, Trash2, Zap,
  Users, GraduationCap, BookOpen, Calendar, BarChart2,
  DollarSign, UtensilsCrossed, Home, FileText, Settings,
  ChevronDown, ChevronUp
} from 'lucide-react'
import { ADMIN_RESOURCES } from '@/lib/permissions'
import type { PermissionInput } from '@/app/actions/staff-permissions'

// ── Actions ──────────────────────────────────────────────────────────────────
const ACTIONS = ['READ', 'CREATE', 'UPDATE', 'DELETE'] as const
const ACTION_META: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  READ:   { label: 'Ko\'rish',   icon: <Eye    className="h-3 w-3" />, bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300'   },
  CREATE: { label: 'Qo\'shish', icon: <Plus   className="h-3 w-3" />, bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300'  },
  UPDATE: { label: 'Tahrirlash', icon: <Edit   className="h-3 w-3" />, bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300'  },
  DELETE: { label: 'O\'chirish', icon: <Trash2 className="h-3 w-3" />, bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300'    },
}
const CHECKED_CLASS: Record<string, string> = {
  READ:   'data-[state=checked]:bg-blue-600   data-[state=checked]:border-blue-600',
  CREATE: 'data-[state=checked]:bg-green-600  data-[state=checked]:border-green-600',
  UPDATE: 'data-[state=checked]:bg-amber-500  data-[state=checked]:border-amber-500',
  DELETE: 'data-[state=checked]:bg-red-500    data-[state=checked]:border-red-500',
}

// ── Resource groups ──────────────────────────────────────────────────────────
const GROUPS = [
  {
    key: 'people',
    label: 'Shaxslar',
    icon: <Users className="h-4 w-4" />,
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    resources: ['students', 'teachers', 'staff', 'parents'],
  },
  {
    key: 'academic',
    label: "O'quv jarayoni",
    icon: <BookOpen className="h-4 w-4" />,
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    resources: ['classes', 'groups', 'subjects', 'schedules'],
  },
  {
    key: 'evaluation',
    label: 'Baholash',
    icon: <GraduationCap className="h-4 w-4" />,
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    resources: ['attendance', 'grades'],
  },
  {
    key: 'finance',
    label: 'Moliya',
    icon: <DollarSign className="h-4 w-4" />,
    color: 'from-orange-500 to-amber-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    resources: ['payments', 'salaries', 'expenses'],
  },
  {
    key: 'services',
    label: 'Xizmatlar',
    icon: <UtensilsCrossed className="h-4 w-4" />,
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    resources: ['dormitory', 'meals', 'kitchen', 'contracts'],
  },
  {
    key: 'system',
    label: 'Tizim',
    icon: <Settings className="h-4 w-4" />,
    color: 'from-slate-500 to-gray-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    resources: ['messages', 'reports', 'contacts', 'settings', 'dashboard'],
  },
]

// ── Types ────────────────────────────────────────────────────────────────────
export type PermissionMatrix = Record<string, Record<string, boolean>>

interface Props {
  value: PermissionMatrix
  onChange: (matrix: PermissionMatrix) => void
}

// ── Component ────────────────────────────────────────────────────────────────
export function StaffPermissionMatrix({ value, onChange }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggle = useCallback((resource: string, action: string) => {
    onChange({
      ...value,
      [resource]: {
        ...(value[resource] || {}),
        [action]: !(value[resource]?.[action] ?? false),
      },
    })
  }, [value, onChange])

  const toggleRow = useCallback((resource: string) => {
    const current = value[resource] || {}
    const allOn = ACTIONS.every(a => current[a])
    const newRow = ACTIONS.reduce((acc, a) => { acc[a] = !allOn; return acc }, {} as Record<string, boolean>)
    onChange({ ...value, [resource]: newRow })
  }, [value, onChange])

  const toggleGroup = useCallback((resources: string[]) => {
    const allOn = resources.every(r => ACTIONS.every(a => value[r]?.[a]))
    const updated = { ...value }
    resources.forEach(r => {
      updated[r] = ACTIONS.reduce((acc, a) => { acc[a] = !allOn; return acc }, {} as Record<string, boolean>)
    })
    onChange(updated)
  }, [value, onChange])

  const selectAll = useCallback(() => {
    const updated: PermissionMatrix = {}
    ADMIN_RESOURCES.forEach(r => {
      updated[r.key] = { READ: true, CREATE: true, UPDATE: true, DELETE: true }
    })
    onChange(updated)
  }, [onChange])

  const clearAll = useCallback(() => onChange({}), [onChange])

  const totalEnabled = ADMIN_RESOURCES.reduce(
    (sum, r) => sum + ACTIONS.filter(a => value[r.key]?.[a]).length, 0
  )
  const totalPossible = ADMIN_RESOURCES.length * ACTIONS.length
  const pct = Math.round((totalEnabled / totalPossible) * 100)

  return (
    <div className="space-y-4">
      {/* ── Summary Bar ───────────────────────────────────────────── */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Panel Ruxsatlari</h3>
                <p className="text-purple-200 text-xs">Sahifalar va amallar bo'yicha ruxsatlar</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Progress */}
              <div className="hidden sm:flex flex-col items-end gap-1 min-w-[100px]">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Zap className="h-3.5 w-3.5 text-yellow-300" />
                  <span>{totalEnabled} / {totalPossible}</span>
                </div>
                <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button" size="sm" onClick={selectAll}
                  className="bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs h-8"
                >
                  Barchasi
                </Button>
                <Button
                  type="button" size="sm" onClick={clearAll}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 text-xs h-8"
                >
                  Tozalash
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Column Legend ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-1 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium mr-1">Amallar:</span>
        {ACTIONS.map(action => (
          <span
            key={action}
            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${ACTION_META[action].bg} ${ACTION_META[action].text} ${ACTION_META[action].border}`}
          >
            {ACTION_META[action].icon}
            {ACTION_META[action].label}
          </span>
        ))}
      </div>

      {/* ── Groups ────────────────────────────────────────────────── */}
      {GROUPS.map(group => {
        const groupResources = ADMIN_RESOURCES.filter(r => group.resources.includes(r.key))
        const groupEnabled = groupResources.reduce(
          (sum, r) => sum + ACTIONS.filter(a => value[r.key]?.[a]).length, 0
        )
        const groupTotal = groupResources.length * ACTIONS.length
        const groupAllOn = groupEnabled === groupTotal
        const isCollapsed = collapsed[group.key]

        return (
          <Card key={group.key} className={`border ${group.border} overflow-hidden shadow-sm`}>
            {/* Group Header */}
            <div
              className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none ${group.bg} border-b ${group.border}`}
              onClick={() => setCollapsed(prev => ({ ...prev, [group.key]: !prev[group.key] }))}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${group.color} text-white shadow-sm`}>
                  {group.icon}
                </div>
                <div>
                  <span className="font-semibold text-sm text-gray-800">{group.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({groupResources.length} sahifa)
                  </span>
                </div>
                {groupEnabled > 0 && (
                  <Badge className={`text-[10px] h-5 px-2 bg-gradient-to-r ${group.color} text-white border-0`}>
                    {groupEnabled} ruxsat
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Toggle whole group */}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); toggleGroup(groupResources.map(r => r.key)) }}
                  title={groupAllOn ? "Guruhni o'chirish" : "Guruhni yoqish"}
                  className="p-1 rounded hover:bg-black/5 transition-colors"
                >
                  {groupAllOn
                    ? <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    : <ShieldOff   className="h-4 w-4 text-gray-400" />
                  }
                </button>
                {isCollapsed
                  ? <ChevronDown className="h-4 w-4 text-gray-400" />
                  : <ChevronUp   className="h-4 w-4 text-gray-400" />
                }
              </div>
            </div>

            {/* Group rows */}
            {!isCollapsed && (
              <div className="divide-y divide-gray-100 bg-white">
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center px-4 py-2 bg-gray-50/80">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Sahifa</span>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-14 text-center">Hammasi</span>
                  {ACTIONS.map(action => (
                    <span key={action} className={`text-[11px] font-semibold uppercase tracking-wide w-20 text-center ${ACTION_META[action].text}`}>
                      {ACTION_META[action].label}
                    </span>
                  ))}
                </div>

                {groupResources.map(resource => {
                  const rowPerms = value[resource.key] || {}
                  const rowCount = ACTIONS.filter(a => rowPerms[a]).length
                  const allRowOn = rowCount === ACTIONS.length

                  return (
                    <div
                      key={resource.key}
                      className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center px-4 py-3 transition-colors ${rowCount > 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-blue-50/30`}
                    >
                      {/* Name */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-gray-800 truncate">{resource.label}</span>
                        {rowCount > 0 && rowCount < ACTIONS.length && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            ({rowCount}/4)
                          </span>
                        )}
                      </div>

                      {/* All toggle */}
                      <div className="w-14 flex justify-center">
                        <button
                          type="button"
                          onClick={() => toggleRow(resource.key)}
                          title={allRowOn ? "O'chirish" : "Barchasi"}
                          className="p-0.5 rounded hover:scale-110 transition-transform"
                        >
                          {allRowOn
                            ? <ShieldCheck className="h-4.5 w-4.5 text-purple-600" />
                            : <ShieldOff   className="h-4.5 w-4.5 text-gray-300" />
                          }
                        </button>
                      </div>

                      {/* CRUD checkboxes */}
                      {ACTIONS.map(action => (
                        <div key={action} className="w-20 flex justify-center">
                          <Checkbox
                            checked={!!(rowPerms[action])}
                            onCheckedChange={() => toggle(resource.key, action)}
                            className={`h-4.5 w-4.5 rounded ${CHECKED_CLASS[action]}`}
                          />
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )
      })}

      {/* ── Footer note ───────────────────────────────────────────── */}
      <p className="text-xs text-muted-foreground text-center pb-1">
        💡 Guruh sarlavhasini bosib yoyish/yopish mumkin. Qalqon ikonini bosib guruh uchun barchasini bir vaqtda yoqing/o'chiring.
      </p>
    </div>
  )
}

// ── Helper: convert matrix → PermissionInput[] for saving ───────────────────
export function matrixToPermissionInputs(matrix: PermissionMatrix): PermissionInput[] {
  return Object.entries(matrix)
    .map(([resource, actions]) => ({
      resource,
      actions: Object.entries(actions)
        .filter(([, enabled]) => enabled)
        .map(([action]) => action),
    }))
    .filter(p => p.actions.length > 0)
}
