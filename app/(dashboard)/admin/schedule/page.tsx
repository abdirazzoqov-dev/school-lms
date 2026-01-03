import { redirect } from 'next/navigation'

export default function OldSchedulePage() {
  // Redirect old URL to new URL
  redirect('/admin/schedules')
}
