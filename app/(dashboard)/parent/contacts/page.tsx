import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/redirect'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Mail, User, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Tezkor Bog\'lanish',
  description: 'Ma\'sul xodimlar bilan bog\'lanish',
}

export const revalidate = 30

export default async function ParentContactsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  const contacts = await db.contactPerson.findMany({
    where: {
      tenantId,
      isActive: true, // Faqat faol xodimlar
    },
    orderBy: [
      { displayOrder: 'asc' },
      { createdAt: 'desc' },
    ],
  })

  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tezkor Bog'lanish</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Maktab ma'sul xodimlari bilan bog'lanish ma'lumotlari
        </p>
      </div>

      {contacts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact, index) => (
            <Card
              key={contact.id}
              className="overflow-hidden hover:shadow-xl transition-all border-2 hover:border-blue-300"
            >
              <div className={`h-2 bg-gradient-to-r ${
                index % 3 === 0 ? 'from-blue-500 to-indigo-600' :
                index % 3 === 1 ? 'from-green-500 to-emerald-600' :
                'from-purple-500 to-pink-600'
              }`} />
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 bg-gradient-to-br ${
                    index % 3 === 0 ? 'from-blue-500 to-indigo-600' :
                    index % 3 === 1 ? 'from-green-500 to-emerald-600' :
                    'from-purple-500 to-pink-600'
                  }`}>
                    {contact.fullName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight mb-1">
                      {contact.fullName}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {contact.position}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 hover:shadow-md transition-all group"
                  >
                    <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Telefon</p>
                      <p className="font-semibold text-sm md:text-base truncate">
                        {contact.phone}
                      </p>
                    </div>
                  </a>

                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:shadow-md transition-all group"
                    >
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-semibold text-xs md:text-sm truncate">
                          {contact.email}
                        </p>
                      </div>
                    </a>
                  )}
                </div>

                {contact.description && (
                  <div className="pt-3 border-t">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                        {contact.description}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
            <User className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg md:text-xl font-semibold mb-2">Ma'lumot mavjud emas</h3>
            <p className="text-sm md:text-base text-muted-foreground text-center max-w-md">
              Hozircha ma'sul xodimlar ma'lumotlari kiritilmagan
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
