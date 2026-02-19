'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download, Eye, Pencil, Trash2, FileText, Users, GraduationCap, Briefcase, UserCheck } from 'lucide-react'
import { deleteContract, toggleContractStatus } from '@/app/actions/contract'
import { downloadContract } from '@/app/actions/download-contract'
import { useToast } from '@/components/ui/use-toast'
import { useAdminPermissions } from '@/components/admin/permissions-provider'
import { formatNumber } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Contract {
  id: string
  title: string
  description: string | null
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number | null
  forTeachers: boolean
  forStaff: boolean
  forParents: boolean
  isActive: boolean
  createdAt: Date
  uploadedBy: {
    fullName: string
  }
  teacher: {
    user: {
      fullName: string
    }
  } | null
  staff: {
    user: {
      fullName: string
    }
  } | null
  parent: {
    user: {
      fullName: string
    }
  } | null
}

interface ContractsTableProps {
  contracts: Contract[]
}

export function ContractsTable({ contracts }: ContractsTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { can } = useAdminPermissions()
  const canUpdate = can('contracts', 'UPDATE')
  const canDelete = can('contracts', 'DELETE')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownload = async (contractId: string, fileName: string) => {
    try {
      setDownloadingId(contractId)
      
      const result = await downloadContract(contractId)
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Faylni yuklashda xatolik')
      }

      // Convert base64 to blob
      const byteCharacters = atob(result.data.base64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: result.data.fileType })

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.data.fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Fayl yuklandi',
      })
    } catch (error: any) {
      console.error('Download error:', error)
      toast({
        title: 'Xato!',
        description: error.message || 'Faylni yuklashda xatolik yuz berdi',
        variant: 'destructive',
      })
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    const result = await deleteContract(deleteId)

    if (result.success) {
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Shartnoma o\'chirildi',
      })
      router.refresh()
    } else {
      toast({
        title: 'Xato!',
        description: result.error,
        variant: 'destructive',
      })
    }

    setIsDeleting(false)
    setDeleteId(null)
  }

  const handleToggleStatus = async (id: string) => {
    const result = await toggleContractStatus(id)

    if (result.success) {
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Holat o\'zgartirildi',
      })
      router.refresh()
    } else {
      toast({
        title: 'Xato!',
        description: result.error,
        variant: 'destructive',
      })
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    return '📎'
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Shartnomalar yo'q</h3>
          <p className="text-muted-foreground mb-4">
            Hali hech qanday shartnoma yuklanmagan
          </p>
          <Button onClick={() => router.push('/admin/contracts/create')}>
            Birinchi shartnomani yuklash
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contracts.map((contract) => (
          <Card key={contract.id} className={`transition-all hover:shadow-lg ${!contract.isActive ? 'opacity-60' : ''}`}>
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{getFileIcon(contract.fileType)}</div>
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">{contract.title}</h3>
                    <p className="text-xs text-muted-foreground">{contract.fileName}</p>
                  </div>
                </div>
                <Badge variant={contract.isActive ? 'default' : 'secondary'}>
                  {contract.isActive ? '✓ Aktiv' : '○ Nofaol'}
                </Badge>
              </div>

              {/* Description */}
              {contract.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {contract.description}
                </p>
              )}

              {/* Recipients */}
              <div className="flex flex-wrap gap-2 mb-4">
                {contract.forTeachers && (
                  <Badge variant="outline" className="gap-1">
                    <GraduationCap className="h-3 w-3" />
                    O'qituvchilar
                  </Badge>
                )}
                {contract.forStaff && (
                  <Badge variant="outline" className="gap-1">
                    <Briefcase className="h-3 w-3" />
                    Xodimlar
                  </Badge>
                )}
                {contract.forParents && (
                  <Badge variant="outline" className="gap-1">
                    <UserCheck className="h-3 w-3" />
                    Ota-onalar
                  </Badge>
                )}
              </div>

              {/* Specific Recipients */}
              {(contract.teacher || contract.staff || contract.parent) && (
                <div className="text-xs text-muted-foreground mb-4">
                  <p className="font-medium">Maxsus:</p>
                  {contract.teacher && <p>• {contract.teacher.user.fullName}</p>}
                  {contract.staff && <p>• {contract.staff.user.fullName}</p>}
                  {contract.parent && <p>• {contract.parent.user.fullName}</p>}
                </div>
              )}

              {/* Metadata */}
              <div className="text-xs text-muted-foreground mb-4 space-y-1">
                <p>📦 Hajmi: {formatFileSize(contract.fileSize)}</p>
                <p>👤 Yuklagan: {contract.uploadedBy.fullName}</p>
                <p>📅 {new Date(contract.createdAt).toLocaleDateString('uz-UZ')}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => handleDownload(contract.id, contract.fileName)}
                  disabled={downloadingId === contract.id}
                >
                  <Download className="h-3 w-3" />
                  {downloadingId === contract.id ? 'Yuklanmoqda...' : 'Yuklab olish'}
                </Button>
                {canUpdate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(contract.id)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(contract.id)}
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Shartnomani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu shartnoma butunlay o'chiriladi va uni qayta tiklab bo'lmaydi. Davom etmoqchimisiz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'O\'chirilmoqda...' : 'O\'chirish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

