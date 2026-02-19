import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import Link from 'next/link'
import { formatFileSize, getFileIcon, MATERIAL_TYPES } from '@/lib/validations/material'
import { DeleteButton } from '@/components/delete-button'
import { deleteMaterial } from '@/app/actions/material'

// Optimized caching
export const revalidate = 60
export const dynamic = 'auto'

export default async function AdminMaterialsPage({
  searchParams,
}: {
  searchParams: { type?: string; subjectId?: string; teacherId?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get all subjects
  const subjects = await db.subject.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' }
  })

  // Get all teachers
  const teachers = await db.teacher.findMany({
    where: { tenantId },
    include: {
      user: {
        select: { fullName: true }
      }
    },
    orderBy: {
      user: { fullName: 'asc' }
    }
  })

  // Build where clause
  const whereClause: any = { tenantId }

  if (searchParams.type) {
    whereClause.type = searchParams.type
  }

  if (searchParams.subjectId) {
    whereClause.subjectId = searchParams.subjectId
  }

  if (searchParams.teacherId) {
    whereClause.teacherId = searchParams.teacherId
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
  const totalMaterials = await db.material.count({ where: { tenantId } })

  const materialsByType = await db.material.groupBy({
    by: ['type'],
    where: { tenantId },
    _count: true
  })

  const totalSize = materials.reduce((sum, m) => sum + (m.fileSize || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Materiallar Kutubxonasi</h1>
        <p className="text-muted-foreground">
          Barcha o'qituvchilarning yuklagan materiallari
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
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

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{teachers.length}</div>
                <p className="text-sm text-muted-foreground">O'qituvchilar</p>
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
                <Link href="/admin/materials">
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
                    href={`/admin/materials?type=${type.value}`}
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
                  <Link href="/admin/materials">
                    <Button 
                      variant={!searchParams.subjectId ? 'default' : 'outline'} 
                      size="sm"
                    >
                      Barcha fanlar
                    </Button>
                  </Link>
                  {subjects.slice(0, 8).map(subject => (
                    <Link 
                      key={subject.id} 
                      href={`/admin/materials?subjectId=${subject.id}`}
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

            {/* Teacher Filter */}
            {teachers.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">O'qituvchi:</p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/admin/materials">
                    <Button 
                      variant={!searchParams.teacherId ? 'default' : 'outline'} 
                      size="sm"
                    >
                      Barcha o'qituvchilar
                    </Button>
                  </Link>
                  {teachers.slice(0, 6).map(teacher => (
                    <Link 
                      key={teacher.id} 
                      href={`/admin/materials?teacherId=${teacher.id}`}
                    >
                      <Button 
                        variant={searchParams.teacherId === teacher.userId ? 'default' : 'outline'} 
                        size="sm"
                      >
                        {teacher.user.fullName}
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
                      {getFileIcon(material.type)}
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={material.fileUrl}
                        download={material.title}
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
                        itemType="material"
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
                        {MATERIAL_TYPES.find(t => t.value === material.type)?.label}
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
                      <span className="text-muted-foreground">O'qituvchi:</span>
                      <span className="font-medium">{material.teacher.user.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hajm:</span>
                      <span className="font-medium">{material.fileSize ? formatFileSize(material.fileSize) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sana:</span>
                      <span className="font-medium">
                        {new Date(material.createdAt).toLocaleDateString('uz-UZ')}
                      </span>
                    </div>
                  </div>

                  {!material.classId && (
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}

