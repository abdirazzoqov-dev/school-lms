'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Trash2, Download, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface BulkActionsToolbarProps {
  selectedCount: number
  onClearSelection: () => void
  onExport?: () => void
  onDelete?: () => Promise<void>
  onStatusChange?: (status: string) => Promise<void>
  statusOptions?: { label: string; value: string }[]
  entityName?: string
}

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onExport,
  onDelete,
  onStatusChange,
  statusOptions,
  entityName = 'element',
}: BulkActionsToolbarProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  if (selectedCount === 0) return null

  const handleDelete = async () => {
    if (!onDelete) return
    
    setIsDeleting(true)
    try {
      await onDelete()
      toast.success(`${selectedCount} ta ${entityName} o'chirildi`)
      onClearSelection()
      router.refresh()
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleStatusChange = async () => {
    if (!onStatusChange || !selectedStatus) return
    
    setIsChangingStatus(true)
    try {
      await onStatusChange(selectedStatus)
      toast.success(`${selectedCount} ta ${entityName} statusi o'zgartirildi`)
      onClearSelection()
      router.refresh()
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsChangingStatus(false)
      setShowStatusDialog(false)
      setSelectedStatus('')
    }
  }

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground rounded-lg shadow-lg p-4 flex items-center gap-4 animate-in slide-in-from-bottom-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{selectedCount} ta tanlandi</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 w-8 p-0 hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-primary-foreground/20" />

        <div className="flex items-center gap-2">
          {onExport && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onExport}
              className="h-8"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}

          {statusOptions && statusOptions.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowStatusDialog(true)}
              disabled={isChangingStatus}
              className="h-8"
            >
              {isChangingStatus && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Statusni o'zgartirish
            </Button>
          )}

          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
              className="h-8"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              O'chirish
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
            <AlertDialogDescription>
              Siz {selectedCount} ta {entityName}ni o'chirmoqchisiz. Bu amalni bekor qilib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  O'chirilmoqda...
                </>
              ) : (
                "O'chirish"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Dialog */}
      {statusOptions && (
        <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Statusni o'zgartirish</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedCount} ta {entityName} uchun yangi statusni tanlang.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Status tanlang</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isChangingStatus}>Bekor qilish</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleStatusChange}
                disabled={isChangingStatus || !selectedStatus}
              >
                {isChangingStatus ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    O'zgartirilmoqda...
                  </>
                ) : (
                  "O'zgartirish"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

