'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldCheck, ShieldOff, CheckSquare, Square, Eye, Plus, Edit, Trash2, Zap } from 'lucide-react'
import { ADMIN_RESOURCES } from '@/lib/permissions'
import type { PermissionInput } from '@/app/actions/staff-permissions'

const ACTIONS = ['READ', 'CREATE', 'UPDATE', 'DELETE'] as const
const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  READ:   { label: 'Ko\'rish',   icon: <Eye     className="h-3.5 w-3.5" />, color: 'text-blue-600'  },
  CREATE: { label: 'Qo\'shish',  icon: <Plus    className="h-3.5 w-3.5" />, color: 'text-green-600' },
  UPDATE: { label: 'Tahrirlash', icon: <Edit    className="h-3.5 w-3.5" />, color: 'text-orange-600'},
  DELETE: { label: 'O\'chirish', icon: <Trash2  className="h-3.5 w-3.5" />, color: 'text-red-600'   },
}

// { resource → { READ: bool, CREATE: bool, ... } }
export type PermissionMatrix = Record<string, Record<string, boolean>>

interface Props {
  value: PermissionMatrix
  onChange: (matrix: PermissionMatrix) => void
}

export function StaffPermissionMatrix({ value, onChange }: Props) {
  // Toggle a single cell
  const toggle = useCallback((resource: string, action: string) => {
    onChange({
      ...value,
      [resource]: {
        ...(value[resource] || {}),
        [action]: !(value[resource]?.[action] ?? false),
      },
    })
  }, [value, onChange])

  // Toggle all 4 actions for a row
  const toggleRow = useCallback((resource: string) => {
    const current = value[resource] || {}
    const allOn = ACTIONS.every(a => current[a])
    const newRow = ACTIONS.reduce((acc, a) => { acc[a] = !allOn; return acc }, {} as Record<string, boolean>)
    onChange({ ...value, [resource]: newRow })
  }, [value, onChange])

  // Toggle an entire column
  const toggleColumn = useCallback((action: string) => {
    const allOn = ADMIN_RESOURCES.every(r => value[r.key]?.[action])
    const updated = { ...value }
    ADMIN_RESOURCES.forEach(r => {
      updated[r.key] = { ...(updated[r.key] || {}), [action]: !allOn }
    })
    onChange(updated)
  }, [value, onChange])

  // Select ALL permissions
  const selectAll = useCallback(() => {
    const updated: PermissionMatrix = {}
    ADMIN_RESOURCES.forEach(r => {
      updated[r.key] = { READ: true, CREATE: true, UPDATE: true, DELETE: true }
    })
    onChange(updated)
  }, [onChange])

  // Clear ALL permissions
  const clearAll = useCallback(() => {
    onChange({})
  }, [onChange])

  // Count total enabled permissions
  const totalEnabled = ADMIN_RESOURCES.reduce((sum, r) => {
    return sum + ACTIONS.filter(a => value[r.key]?.[a]).length
  }, 0)

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-indigo-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Sahifa Ruxsatlari</CardTitle>
              <CardDescription>
                Xodim uchun har bir sahifada qanday amallar bajarish mumkinligini belgilang
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white text-purple-700 border-purple-300 font-semibold">
              <Zap className="h-3 w-3 mr-1" />
              {totalEnabled} ruxsat
            </Badge>
            <Button type="button" size="sm" variant="outline" onClick={selectAll}
              className="border-green-300 text-green-700 hover:bg-green-50">
              <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
              Barchasi
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={clearAll}
              className="border-red-300 text-red-700 hover:bg-red-50">
              <Square className="h-3.5 w-3.5 mr-1.5" />
              Tozalash
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-b bg-white/60">
                <th className="text-left p-3 pl-4 font-semibold text-muted-foreground w-[200px]">
                  Sahifa
                </th>
                <th className="text-center p-2 font-semibold text-muted-foreground w-[60px]">
                  Barchasi
                </th>
                {ACTIONS.map(action => (
                  <th key={action} className="text-center p-2 font-semibold w-[90px]">
                    <button
                      type="button"
                      onClick={() => toggleColumn(action)}
                      className={`flex flex-col items-center gap-1 mx-auto hover:opacity-80 transition-opacity ${ACTION_LABELS[action].color}`}
                      title={`Hammasi uchun ${ACTION_LABELS[action].label}`}
                    >
                      {ACTION_LABELS[action].icon}
                      <span className="text-[10px] font-medium">{ACTION_LABELS[action].label}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ADMIN_RESOURCES.map((resource, idx) => {
                const rowPerms = value[resource.key] || {}
                const rowCount = ACTIONS.filter(a => rowPerms[a]).length
                const allRowOn = rowCount === ACTIONS.length

                return (
                  <tr
                    key={resource.key}
                    className={`border-b last:border-0 transition-colors ${
                      rowCount > 0 ? 'bg-white/70' : 'bg-transparent'
                    } hover:bg-white/90`}
                  >
                    {/* Page name */}
                    <td className="p-3 pl-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{resource.label}</span>
                        {rowCount > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-purple-50 text-purple-700 border-purple-200">
                            {rowCount}
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* All toggle */}
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggleRow(resource.key)}
                        className="mx-auto flex items-center justify-center"
                        title={allRowOn ? "Hammasini olib tashlash" : "Hammasini belgilash"}
                      >
                        {allRowOn
                          ? <ShieldCheck className="h-5 w-5 text-purple-600" />
                          : <ShieldOff   className="h-5 w-5 text-muted-foreground/40" />
                        }
                      </button>
                    </td>

                    {/* CRUD checkboxes */}
                    {ACTIONS.map(action => (
                      <td key={action} className="p-2 text-center">
                        <Checkbox
                          checked={!!(rowPerms[action])}
                          onCheckedChange={() => toggle(resource.key, action)}
                          className={
                            action === 'READ'   ? 'data-[state=checked]:bg-blue-600   data-[state=checked]:border-blue-600'   :
                            action === 'CREATE' ? 'data-[state=checked]:bg-green-600  data-[state=checked]:border-green-600'  :
                            action === 'UPDATE' ? 'data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500' :
                                                  'data-[state=checked]:bg-red-500    data-[state=checked]:border-red-500'
                          }
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 p-3 pl-4 border-t bg-muted/20 flex-wrap">
          {ACTIONS.map(action => (
            <div key={action} className={`flex items-center gap-1.5 text-xs ${ACTION_LABELS[action].color}`}>
              {ACTION_LABELS[action].icon}
              <span>{ACTION_LABELS[action].label}</span>
            </div>
          ))}
          <div className="ml-auto text-xs text-muted-foreground">
            Ustunni bosib barcha qatorlarni bir vaqtda o'zgartiring
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Convert PermissionMatrix → PermissionInput[] for saving
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

