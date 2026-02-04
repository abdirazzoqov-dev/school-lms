import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { ContactsTable } from './contacts-table'

export const metadata = {
  title: 'Ma\'sul Xodimlar',
  description: 'Tezkor bog\'lanish uchun ma\'sul xodimlar',
}

export const revalidate = 0

export default async function ContactsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  const contacts = await db.contactPerson.findMany({
    where: { tenantId },
    orderBy: [
      { displayOrder: 'asc' },
      { createdAt: 'desc' },
    ],
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ma'sul Xodimlar</h1>
          <p className="text-muted-foreground">
            Tezkor bog'lanish uchun ma'sul xodimlar ro'yxati
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/contacts/create">
            <Plus className="mr-2 h-4 w-4" />
            Xodim qo'shish
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ma'sul Xodimlar Ro'yxati</CardTitle>
          <CardDescription>
            {contacts.length} ta xodim • Ota-onalar uchun ko'rinadi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactsTable contacts={contacts} />
        </CardContent>
      </Card>
    </div>
  )
}
