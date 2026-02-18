'use client'

import { signOut } from 'next-auth/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, User, Settings } from 'lucide-react'
import { getInitials } from '@/lib/utils'

interface UserNavProps {
  user: {
    fullName: string
    email?: string | null
    role: string
    avatar?: string | null
  }
}

export function UserNav({ user }: UserNavProps) {
  // Avatar is passed as prop from server layout (fetched from DB, not JWT cookie)
  // This prevents HTTP 431 errors caused by large base64 images in JWT cookies
  const avatarSrc = user.avatar
  const displayName = user.fullName
  const displayEmail = user.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20 hover:ring-primary/50 transition-all">
            {avatarSrc && (
              <AvatarImage
                src={avatarSrc}
                alt={displayName}
                className="object-cover"
              />
            )}
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-semibold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {displayEmail}
            </p>
            <p className="text-xs font-semibold text-primary">{user.role}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profil</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Sozlamalar</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600"
          onClick={async () => {
            await signOut({ 
              callbackUrl: '/login',
              redirect: true 
            })
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Chiqish</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

