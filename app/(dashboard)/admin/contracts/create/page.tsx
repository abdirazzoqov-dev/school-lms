import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { ArrowLeft, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ContractForm } from '../contract-form'

export default async function CreateContractPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Fetch teachers, staff, and parents for targeted contracts
  const [teachers, staff, parents] = await Promise.all([
    db.teacher.findMany({
      where: { tenantId },
      select: {
        id: true,
        teacherCode: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: { teacherCode: 'asc' },
    }),
    db.staff.findMany({
      where: { tenantId },
      select: {
        id: true,
        staffCode: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: { staffCode: 'asc' },
    }),
    db.parent.findMany({
      where: { tenantId },
      select: {
        id: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        user: {
          fullName: 'asc',
        },
      },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/contracts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Yangi Shartnoma
          </h2>
          <p className="text-muted-foreground mt-2">
            PDF, Word yoki Excel faylni yuklang
          </p>
        </div>
      </div>

      <ContractForm teachers={teachers} staff={staff} parents={parents} />
    </div>
  )
}

