import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { AssignStudentForm } from './assign-student-form'

export const revalidate = 30 // Optimized for faster loads
export const dynamic = 'auto' // Optimized for better caching

export default async function AssignStudentPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get students without dormitory assignment
  const students = await db.student.findMany({
    where: {
      tenantId,
      status: 'ACTIVE',
      dormitoryAssignment: null, // Students not assigned to any dormitory
    },
    select: {
      id: true,
      studentCode: true,
      gender: true,
      isFreeStudent: true,
      user: {
        select: {
          fullName: true,
        },
      },
      class: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/dormitory">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-green-500" />
            O'quvchini Joylashtirish
          </h1>
          <p className="text-muted-foreground mt-1">
            O'quvchini yotoqxona xonasiga joylashtirish
          </p>
        </div>
      </div>

      {/* Info Card */}
      {students.length === 0 ? (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-orange-800">
              Joylashtirish uchun o'quvchilar yo'q
            </CardTitle>
            <CardDescription className="text-orange-600">
              Barcha faol o'quvchilar allaqachon yotoqxonaga joylashtirilgan yoki yotoqxonada turmaydigan o'quvchilar yo'q.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/students/create">
              <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                <UserPlus className="h-4 w-4 mr-2" />
                Yangi o'quvchi qo'shish
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-sm text-blue-800">
                📊 Statistika
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700">
                <span className="font-semibold text-2xl">{students.length}</span> ta o'quvchi yotoqxonaga joylashtirilmagan
              </p>
            </CardContent>
          </Card>

          {/* Assignment Form */}
          <AssignStudentForm students={students} />
        </>
      )}
    </div>
  )
}

