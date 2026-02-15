'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, FileText } from 'lucide-react'

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
            <a 
              href={contract.fileUrl} 
              download={contract.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full gap-2">
                <Download className="h-4 w-4" />
                Yuklab olish
              </Button>
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

