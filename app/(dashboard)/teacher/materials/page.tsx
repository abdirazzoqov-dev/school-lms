import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Download, FileText, Trash2 } from 'lucide-react'
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

  const totalSize = materials.reduce((sum, m) => sum + m.fileSize, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Materiallar</h1>
          <p className="text-muted-foreground">
            Darslik, topshiriq va boshqa fayllarni boshqaring
          </p>
        </div>
        <Link href="/teacher/materials/upload">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Material Yuklash
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalMaterials}</div>
                <p className="text-sm text-muted-foreground">Jami materiallar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{materialsByType.length}</div>
                <p className="text-sm text-muted-foreground">Turlar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
                <p className="text-sm text-muted-foreground">Jami hajm</p>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {materials.map(material => (
            <Card key={material.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="text-4xl">
                      {getFileIcon(material.fileType)}
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={material.fileUrl} 
                        download={material.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                      <DeleteButton
                        itemId={material.id}
                        itemName={material.title}
                        onDelete={deleteMaterial}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold line-clamp-2">{material.title}</h3>
                    {material.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {material.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Turi:</span>
                      <span className="font-medium">
                        {MATERIAL_TYPES.find(t => t.value === material.materialType)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fan:</span>
                      <span className="font-medium">{material.subject.name}</span>
                    </div>
                    {material.class && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sinf:</span>
                        <span className="font-medium">{material.class.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hajm:</span>
                      <span className="font-medium">{formatFileSize(material.fileSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sana:</span>
                      <span className="font-medium">
                        {new Date(material.createdAt).toLocaleDateString('uz-UZ')}
                      </span>
                    </div>
                  </div>

                  {material.isPublic && (
                    <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Hammaga ochiq
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Hozircha materiallar yo'q</p>
            <Link href="/teacher/materials/upload">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Birinchi materialni yuklash
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

