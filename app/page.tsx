import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Redirect based on role
  switch (session.user.role) {
    case 'SUPER_ADMIN':
      redirect('/super-admin')
    case 'ADMIN':
      redirect('/admin')
    case 'MODERATOR':
      redirect('/admin')
    case 'TEACHER':
      redirect('/teacher')
    case 'PARENT':
      redirect('/parent')
    case 'STUDENT':
      redirect('/student')
    case 'COOK':
      redirect('/cook')
    default:
      redirect('/login')
  }
}

