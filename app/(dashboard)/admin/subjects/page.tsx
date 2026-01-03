import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, BookOpen, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'
import { DeleteSubjectButton } from './delete-subject-button'

// Optimized caching: Cache for 60 seconds
export const revalidate = 60
export const dynamic = 'auto'

export default async function SubjectsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get all subjects
  const subjects = await db.subject.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: {
          classSubjects: true,
          schedules: true,
          grades: true
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  // Get statistics
  const totalSubjects = subjects.length
  const activeSubjects = subjects.filter(s => s._count.schedules > 0).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fanlar</h1>
          <p className="text-muted-foreground">
            O'quv fanlarini boshqarish
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/subjects/quick-setup">
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              Tez sozlash
            </Button>
          </Link>
          <Link href="/admin/subjects/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yangi fan
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Jami Fanlar
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubjects}</div>
            <p className="text-xs text-muted-foreground">
              Barcha fanlar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faol Fanlar
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubjects}</div>
            <p className="text-xs text-muted-foreground">
              Dars jadvalida bor
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subjects List */}
      {subjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Fanlar yo'q</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Hali birorta fan qo'shilmagan. Yangi fan qo'shish yoki tez sozlash orqali boshlang.
            </p>
            <div className="flex gap-2">
              <Link href="/admin/subjects/quick-setup">
                <Button variant="outline">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Tez sozlash
                </Button>
              </Link>
              <Link href="/admin/subjects/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yangi fan
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Card key={subject.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {subject.color && (
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: subject.color }}
                      />
                    )}
                    <div>
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{subject.code}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {subject.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {subject.description}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <div className="font-semibold">{subject._count.classSubjects}</div>
                    <div className="text-xs text-muted-foreground">Sinf</div>
                  </div>
                  <div>
                    <div className="font-semibold">{subject._count.schedules}</div>
                    <div className="text-xs text-muted-foreground">Dars</div>
                  </div>
                  <div>
                    <div className="font-semibold">{subject._count.grades}</div>
                    <div className="text-xs text-muted-foreground">Baho</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/admin/subjects/${subject.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="mr-2 h-4 w-4" />
                      Tahrirlash
                    </Button>
                  </Link>
                  <DeleteSubjectButton 
                    subjectId={subject.id}
                    subjectName={subject.name}
                    hasSchedules={subject._count.schedules > 0}
                    hasClassSubjects={subject._count.classSubjects > 0}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

