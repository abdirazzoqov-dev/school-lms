import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Download, FileText, Trash2, HardDrive, Layers, Upload as UploadIcon } from 'lucide-react'
import Link from 'next/link'
import { formatFileSize, getFileIcon, MATERIAL_TYPES } from '@/lib/validations/material'
import { DeleteButton } from '@/components/delete-button'
import { deleteMaterial } from '@/app/actions/material'

export default async function TeacherMaterialsPage({
  searchParams,
}: {
  searchParams: { type?: string; subjectId?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get teacher
  const teacher = await db.teacher.findFirst({
    where: { userId: session.user.id }
  })

  if (!teacher) {
    redirect('/unauthorized')
  }

  // Get teacher's subjects
  const teacherSubjects = await db.classSubject.findMany({
    where: { teacherId: teacher.id },
    include: {
      subject: true
    },
    distinct: ['subjectId']
  })

  const subjects = teacherSubjects.map(ts => ts.subject)

  // Build where clause
  const whereClause: any = {
    tenantId,
    teacherId: teacher.id
  }

  if (searchParams.type) {
    whereClause.type = searchParams.type
  }

  if (searchParams.subjectId) {
    whereClause.subjectId = searchParams.subjectId
  }

  // Get materials
  const materials = await db.material.findMany({
    where: whereClause,
    include: {
      subject: true,
      class: true,
      teacher: {
        include: {
          user: {
            select: { fullName: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Statistics
  const totalMaterials = await db.material.count({
    where: { tenantId, teacherId: teacher.id }
  })

  const materialsByType = await db.material.groupBy({
    by: ['type'],
    where: { tenantId, teacherId: teacher.id },
    _count: true
  })

  const totalSize = materials.reduce((sum, m) => sum + (m.fileSize || 0), 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Materiallar
          </h1>
          <p className="text-lg text-muted-foreground">
            Darslik, topshiriq va boshqa fayllarni boshqaring
          </p>
        </div>
        <Link href="/teacher/materials/upload">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <UploadIcon className="mr-2 h-5 w-5" />
            Material Yuklash
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">{totalMaterials}</div>
                <p className="text-sm text-muted-foreground font-medium">Jami materiallar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{materialsByType.length}</div>
                <p className="text-sm text-muted-foreground font-medium">Material turlari</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                <HardDrive className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{formatFileSize(totalSize)}</div>
                <p className="text-sm text-muted-foreground font-medium">Jami hajm</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrlash</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Type Filter */}
            <div>
              <p className="text-sm font-medium mb-2">Material turi:</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/teacher/materials">
                  <Button 
                    variant={!searchParams.type ? 'default' : 'outline'} 
                    size="sm"
                  >
                    Barchasi
                  </Button>
                </Link>
                {MATERIAL_TYPES.map(type => (
                  <Link 
                    key={type.value} 
                    href={`/teacher/materials?type=${type.value}${searchParams.subjectId ? `&subjectId=${searchParams.subjectId}` : ''}`}
                  >
                    <Button 
                      variant={searchParams.type === type.value ? 'default' : 'outline'} 
                      size="sm"
                    >
                      {type.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>

            {/* Subject Filter */}
            {subjects.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Fan:</p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/teacher/materials">
                    <Button 
                      variant={!searchParams.subjectId ? 'default' : 'outline'} 
                      size="sm"
                    >
                      Barcha fanlar
                    </Button>
                  </Link>
                  {subjects.map(subject => (
                    <Link 
                      key={subject.id} 
                      href={`/teacher/materials?subjectId=${subject.id}${searchParams.type ? `&type=${searchParams.type}` : ''}`}
                    >
                      <Button 
                        variant={searchParams.subjectId === subject.id ? 'default' : 'outline'} 
                        size="sm"
                      >
                        {subject.name}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      {materials.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {materials.map(material => (
            <Card key={material.id} className="group relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-6 space-y-4">
                {/* File Icon & Actions */}
                <div className="flex items-start justify-between">
                  <div className="text-5xl">
                    {getFileIcon(material.type)}
                  </div>
                  <div className="flex gap-1">
                    <a 
                      href={`/api/download/${material.id}`}
                    >
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-950/50"
                        title="Yuklab olish"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                    <DeleteButton
                      itemId={material.id}
                      itemName={material.title}
                      itemType="material"
                      onDelete={deleteMaterial}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="font-bold text-lg line-clamp-2 mb-1">{material.title}</h3>
                  {material.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {material.description}
                    </p>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                    {MATERIAL_TYPES.find(t => t.value === material.type)?.label}
                  </Badge>
                  <Badge variant="outline">
                    {material.subject.name}
                  </Badge>
                  {material.class && (
                    <Badge variant="secondary">
                      {material.class.name}
                    </Badge>
                  )}
                </div>

                {/* Details */}
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Hajm:</span>
                    <span className="font-semibold">{material.fileSize ? formatFileSize(material.fileSize) : 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Yuklangan:</span>
                    <span className="font-semibold">
                      {new Date(material.createdAt).toLocaleDateString('uz-UZ', { 
                        day: '2-digit', 
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-950/20 w-fit mx-auto mb-4">
              <FileText className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Materiallar yo'q</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Hozircha materiallar yuklanmagan. Darslik, topshiriq va boshqa fayllarni yuklash uchun quyidagi tugmani bosing.
            </p>
            <Link href="/teacher/materials/upload">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <UploadIcon className="mr-2 h-5 w-5" />
                Birinchi materialni yuklash
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

