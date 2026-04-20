import { useEffect, useState, useRef } from 'react'
import { platform } from '@tauri-apps/plugin-os'
import emitter from '@/lib/emitter'
import useSettingStore from '@/stores/setting'
import { resolveToolbarShortcutIndex } from '@/lib/toolbar-shortcuts'

type Platform = 'macos' | 'windows' | 'linux' | 'unknown'

export function useToolbarShortcuts() {
  const [currentPlatform, setCurrentPlatform] = useState<Platform>('unknown')
  const [isModifierPressed, setIsModifierPressed] = useState(false)
  const { recordToolbarConfig } = useSettingStore()
  const enabledItemsRef = useRef<typeof recordToolbarConfig>([])

  useEffect(() => {
    // 只在 Tauri 环境中检测平台，否则使用 user agent 推断
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      try {
        const p = platform()
        if (p === 'macos') {
          setCurrentPlatform('macos')
        } else if (p === 'windows') {
          setCurrentPlatform('windows')
        } else if (p === 'linux') {
          setCurrentPlatform('linux')
        }
      } catch {
        // 失败时尝试 user agent 检测
        const userAgent = navigator.userAgent.toLowerCase()
        if (userAgent.includes('mac')) {
          setCurrentPlatform('macos')
        } else if (userAgent.includes('win')) {
          setCurrentPlatform('windows')
        } else if (userAgent.includes('linux')) {
          setCurrentPlatform('linux')
        }
      }
    } else {
      // 非 Tauri 环境使用 user agent 检测
      const userAgent = navigator.userAgent.toLowerCase()
      if (userAgent.includes('mac')) {
        setCurrentPlatform('macos')
      } else if (userAgent.includes('win')) {
        setCurrentPlatform('windows')
      } else if (userAgent.includes('linux')) {
        setCurrentPlatform('linux')
      }
    }
  }, [])

  useEffect(() => {
    if (currentPlatform === 'unknown') return

    enabledItemsRef.current = recordToolbarConfig
      .filter(item => item.enabled)
      .sort((a, b) => a.order - b.order)
      .slice(0, 9)
  }, [currentPlatform, recordToolbarConfig])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcutIndex = resolveToolbarShortcutIndex(
        e,
        currentPlatform,
        enabledItemsRef.current.length,
      )

      if (shortcutIndex !== null) {
        e.preventDefault()
        const item = enabledItemsRef.current[shortcutIndex]
        if (item) {
          emitter.emit(`toolbar-shortcut-${item.id}` as any)
        }
        return
      }

      if (currentPlatform === 'macos' && e.metaKey) {
        setIsModifierPressed(true)
      } else if ((currentPlatform === 'windows' || currentPlatform === 'linux') && e.altKey) {
        setIsModifierPressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (currentPlatform === 'macos' && !e.metaKey) {
        setIsModifierPressed(false)
      } else if ((currentPlatform === 'windows' || currentPlatform === 'linux') && !e.altKey) {
        setIsModifierPressed(false)
      }
    }

    const handleBlur = () => {
      setIsModifierPressed(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [currentPlatform])

  return {
    isModifierPressed,
    currentPlatform,
  }
}
