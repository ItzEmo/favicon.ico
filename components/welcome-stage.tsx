'use client'

import { useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'

const WelcomeCharacter = dynamic(() => import('@/components/welcome-character'), { ssr: false })

export function WelcomeStage({ className }: { className?: string }) {
  const [ready, setReady] = useState(false)
  const handleReady = useCallback(() => setReady(true), [])

  return (
    <div className={cn('welcome-stage relative', ready && 'welcome-stage--ready', className)}>
      <p className="welcome-bubble" role="status">
        {ready ? "Yo, welcome to Emo's Radio" : ''}
      </p>
      <div aria-hidden="true" className="absolute inset-0">
        <WelcomeCharacter onReady={handleReady} />
      </div>
    </div>
  )
}
