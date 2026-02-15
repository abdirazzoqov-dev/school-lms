'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, FileText } from 'lucide-react'
import { downloadContract } from '@/app/actions/download-contract'
import { useToast } from '@/components/ui/use-toast'
import { useState } from 'react'

interface Contract {
  id: string
  title: string
  description: string | null
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number | null
  createdAt: Date
  uploadedBy: {
    fullName: string
  }
}

interface ContractsViewClientProps {
  contracts: Contract[]
}

export function ContractsViewClient({ contracts }: ContractsViewClientProps) {
  const { toast } = useToast()
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
          <p className="text-muted-foreground">
            Hozircha sizga tegishli shartnomalar mavjud emas
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {contracts.map((contract) => (
        <Card key={contract.id} className="transition-all hover:shadow-lg">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="text-4xl">{getFileIcon(contract.fileType)}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg line-clamp-2">{contract.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{contract.fileName}</p>
              </div>
            </div>

            {/* Description */}
            {contract.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {contract.description}
              </p>
            )}

            {/* Metadata */}
            <div className="space-y-1 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Hajmi:</span>
                <Badge variant="outline">{formatFileSize(contract.fileSize)}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Yuklagan:</span>
                <span className="font-medium">{contract.uploadedBy.fullName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Sana:</span>
                <span className="font-medium">
                  {new Date(contract.createdAt).toLocaleDateString('uz-UZ')}
                </span>
              </div>
            </div>

            {/* Download Button */}
            <Button 
              className="w-full gap-2"
              onClick={() => handleDownload(contract.id, contract.fileName)}
              disabled={downloadingId === contract.id}
            >
              <Download className="h-4 w-4" />
              {downloadingId === contract.id ? 'Yuklanmoqda...' : 'Yuklab olish'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

