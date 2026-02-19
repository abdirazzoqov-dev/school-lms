'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createContactPerson(data: {
  fullName: string
  position: string
  phone: string
  email?: string
  description?: string
  displayOrder?: number
}) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      throw new Error('Ruxsat berilmagan')
    }

    const tenantId = session.user.tenantId!

    const contact = await db.contactPerson.create({
      data: {
        tenantId,
        fullName: data.fullName,
        position: data.position,
        phone: data.phone,
        email: data.email || null,
        description: data.description || null,
        displayOrder: data.displayOrder || 0,
        isActive: true,
      },
    })

    revalidatePath('/admin/contacts')
    revalidatePath('/parent/contacts')
    
    return { success: true, contact }
  } catch (error: any) {
    console.error('Create contact error:', error)
    throw new Error(error.message || 'Xatolik yuz berdi')
  }
}

export async function updateContactPerson(
  id: string,
  data: {
    fullName?: string
    position?: string
    phone?: string
    email?: string
    description?: string
    displayOrder?: number
  }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    throw new Error('Ruxsat berilmagan')
  }

  const tenantId = session.user.tenantId!

  const contact = await db.contactPerson.update({
    where: {
      id,
      tenantId,
    },
    data: {
      fullName: data.fullName,
      position: data.position,
      phone: data.phone,
      email: data.email || null,
      description: data.description || null,
      displayOrder: data.displayOrder,
    },
  })

  revalidatePath('/admin/contacts')
  revalidatePath('/parent/contacts')
  
  return { success: true, contact }
}

export async function deleteContactPerson(id: string) {
  const session = await getServerSession(authOptions)
  
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    throw new Error('Ruxsat berilmagan')
  }

  const tenantId = session.user.tenantId!

  await db.contactPerson.delete({
    where: {
      id,
      tenantId,
    },
  })

  revalidatePath('/admin/contacts')
  revalidatePath('/parent/contacts')
  
  return { success: true }
}

export async function toggleContactStatus(id: string) {
  const session = await getServerSession(authOptions)
  
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    throw new Error('Ruxsat berilmagan')
  }

  const tenantId = session.user.tenantId!

  const contact = await db.contactPerson.findUnique({
    where: { id, tenantId },
  })

  if (!contact) {
    throw new Error('Ma\'sul xodim topilmadi')
  }

  const updated = await db.contactPerson.update({
    where: { id },
    data: { isActive: !contact.isActive },
  })

  revalidatePath('/admin/contacts')
  revalidatePath('/parent/contacts')
  
  return { success: true, contact: updated }
}
