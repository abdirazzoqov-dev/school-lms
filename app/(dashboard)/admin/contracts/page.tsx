import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ContractsTable } from './contracts-table'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function ContractsPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Fetch all contracts
  const contracts = await db.contract.findMany({
    where: { tenantId },
    include: {
      uploadedBy: {
        select: {
          fullName: true,
        },
      },
      teacher: {
        select: {
          user: {
            select: {
              fullName: true,
            },
          },
        },
      },
      staff: {
        select: {
          user: {
            select: {
              fullName: true,
            },
          },
        },
      },
      parent: {
        select: {
          user: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Shartnomalar
          </h2>
          <p className="text-muted-foreground mt-2">
            Xodimlar, o'qituvchilar va ota-onalar uchun shartnomalarni boshqaring
          </p>
        </div>
        <Link href="/admin/contracts/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Yangi Shartnoma
          </Button>
        </Link>
      </div>

      <ContractsTable contracts={contracts} />
    </div>
  )
}

