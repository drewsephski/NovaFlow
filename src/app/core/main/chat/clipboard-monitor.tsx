"use client"
import { useTranslations } from 'next-intl'
import { Clipboard, ClipboardX } from 'lucide-react'
import { TooltipButton } from '@/components/tooltip-button'
import { useState, useEffect } from 'react'
import { loadStore, checkTauriEnvironment } from '@/lib/storage'

export function ClipboardMonitor() {
  const t = useTranslations('record.chat.input.clipboardMonitor')
  const [isEnabled, setIsEnabled] = useState(true)

  // Sync with store.json on mount
  useEffect(() => {
    const syncWithStore = async () => {
      if (!checkTauriEnvironment()) return
      try {
        const store = await loadStore('store.json')
        const storedValue = await store.get<boolean>('clipboardMonitor')

        // Only update if the stored value exists and is different from the current state
        if (storedValue !== null && storedValue !== isEnabled) {
          setIsEnabled(storedValue)
        }
      } catch (error) {
        console.error('Failed to load clipboard monitor state from store:', error)
      }
    }

    syncWithStore()
  }, [])

  const toggleClipboardMonitor = async () => {
    if (!checkTauriEnvironment()) return
    const newState = !isEnabled
    setIsEnabled(newState)
    const store = await loadStore('store.json')
    await store.set('clipboardMonitor', newState)
    await store.save()
  }

  return (
    <div>
      <TooltipButton
        variant={"ghost"}
        size="icon"
        icon={isEnabled ? <Clipboard className="size-4" /> : <ClipboardX className="size-4" />}
        tooltipText={isEnabled ? t('enable') : t('disable')}
        side="bottom"
        onClick={toggleClipboardMonitor}
      />
    </div>
  )
}
