import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import Link from 'next/link'
import { formatFileSize, getFileIcon, MATERIAL_TYPES } from '@/lib/validations/material'

export default async function ParentMaterialsPage({
  searchParams,
}: {
  searchParams: { studentId?: string; type?: string; subjectId?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get parent
  const parent = await db.parent.findFirst({
    where: { userId: session.user.id }
  })

  if (!parent) {
    redirect('/unauthorized')
  }

  // Get parent's children
  const children = await db.studentParent.findMany({
    where: { parentId: parent.id },
    include: {
      student: {
        include: {
          user: {
            select: { fullName: true }
          },
          class: {
            include: {
              subjects: {
                include: {
                  subject: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">O'quv Materiallari</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Sizga farzandlar biriktirilmagan</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedStudentId = searchParams.studentId || children[0].student.id
  const selectedStudent = children.find(c => c.student.id === selectedStudentId)?.student

  if (!selectedStudent || !selectedStudent.classId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">O'quv Materiallari</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Farzandingiz sinfga biriktirilmagan</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get subjects for this class
  const classSubjects = selectedStudent.class?.subjects || []
  const subjects = classSubjects.map(cs => cs.subject)

  // Build where clause for materials
  const whereClause: any = {
    tenantId,
    OR: [
      { classId: selectedStudent.classId }, // Materials for this specific class
      { classId: null }, // Materials for all classes
    ]
  }

  if (searchParams.type) {
    whereClause.type = searchParams.type
  }

  if (searchParams.subjectId) {
    whereClause.subjectId = searchParams.subjectId
  } else if (subjects.length > 0) {
    // Only show materials for subjects the class has
    whereClause.subjectId = { in: subjects.map(s => s.id) }
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
  const totalMaterials = materials.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">O'quv Materiallari</h1>
        <p className="text-muted-foreground">
          Farzandingiz uchun darslik va topshiriqlar
        </p>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {children.map(({ student }) => (
                <Link 
                  key={student.id} 
                  href={`/parent/materials?studentId=${student.id}`}
                >
                  <Button 
                    variant={selectedStudentId === student.id ? 'default' : 'outline'}
                    size="sm"
                  >
                    {student.user?.fullName} ({student.class?.name})
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                <div className="text-2xl font-bold">{subjects.length}</div>
                <p className="text-sm text-muted-foreground">Fanlar</p>
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
                <div className="text-2xl font-bold">{selectedStudent.class?.name}</div>
                <p className="text-sm text-muted-foreground">Sinf</p>
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
                <Link href={`/parent/materials?studentId=${selectedStudentId}`}>
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
                    href={`/parent/materials?studentId=${selectedStudentId}&type=${type.value}`}
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
                  <Link href={`/parent/materials?studentId=${selectedStudentId}`}>
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
                      href={`/parent/materials?studentId=${selectedStudentId}&subjectId=${subject.id}`}
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
                      <span className="text-muted-foreground">O'qituvchi:</span>
                      <span className="font-medium">{material.teacher.user.fullName}</span>
                    </div>
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
            <p className="text-sm mt-2">O'qituvchilar material yuklagan bo'lsa, bu yerda ko'rinadi</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

