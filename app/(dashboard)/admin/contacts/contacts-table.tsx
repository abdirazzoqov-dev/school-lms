'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, Mail, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'
import { deleteContactPerson, toggleContactStatus } from '@/app/actions/contact'
import { toast } from 'sonner'

type Contact = {
  id: string
  fullName: string
  position: string
  phone: string
  email: string | null
  description: string | null
  displayOrder: number
  isActive: boolean
}

export function ContactsTable({ contacts }: { contacts: Contact[] }) {
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name} ni o'chirmoqchimisiz?`)) {
      return
    }

    try {
      await deleteContactPerson(id)
      toast.success('Ma\'sul xodim o\'chirildi')
      window.location.reload()
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleContactStatus(id)
      toast.success('Status o\'zgartirildi')
      window.location.reload()
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    }
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Hozircha ma'sul xodimlar yo'q</p>
        <Button asChild>
          <Link href="/admin/contacts/create">
            Birinchi xodimni qo'shish
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact, index) => (
        <div
          key={contact.id}
          className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="flex flex-col items-center gap-1">
              <Badge variant="outline" className="text-xs">
                #{contact.displayOrder || index + 1}
              </Badge>
              <div className="flex gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  disabled
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  disabled
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
              {contact.fullName.charAt(0)}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{contact.fullName}</h3>
                <Badge variant={contact.isActive ? 'default' : 'secondary'}>
                  {contact.isActive ? 'Faol' : 'Nofaol'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                {contact.position}
              </p>
              {contact.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {contact.description}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-2 text-sm hover:text-blue-600 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span className="font-medium">{contact.phone}</span>
              </a>
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span className="text-xs">{contact.email}</span>
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleStatus(contact.id)}
            >
              {contact.isActive ? 'Nofaol qilish' : 'Faol qilish'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link href={`/admin/contacts/${contact.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(contact.id, contact.fullName)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
