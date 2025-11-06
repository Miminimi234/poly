'use client'

import { useAuthStore } from '@/lib/stores/use-auth-store'
import { useState } from 'react'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: 'signin' | 'signup'
}

export function AuthModal({ open, onOpenChange, defaultTab = 'signin' }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [tab, setTab] = useState(defaultTab)

  const { signIn, signUp, signInWithGoogle } = useAuthStore()

  // Always hide the auth modal since we have a dedicated signin page
  return null

}