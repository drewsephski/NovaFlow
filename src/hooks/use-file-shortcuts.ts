import { useEffect, useCallback, useState } from 'react'
import { isMobileDevice } from '@/lib/check'
import { platform } from '@tauri-apps/plugin-os'
import useArticleStore from '@/stores/article'

type Platform = 'macos' | 'windows' | 'linux' | 'unknown'

interface FileShortcutsProps {
  path: string
  isEditing?: boolean
  onStartRename?: () => void
  onCopy?: () => void
  onPaste?: () => void
  onCut?: () => void
  onDelete?: () => void
}

/**
 * File and folder keyboard shortcuts Hook
 * Desktop:
 *   - macOS: Enter triggers rename, Cmd+C copy, Cmd+V paste, Cmd+X cut, Backspace delete
 *   - Windows/Linux: F2 triggers rename, Ctrl+C copy, Ctrl+V paste, Ctrl+X cut, Delete delete
 * Mobile: Shortcuts disabled
 */
export function useFileShortcuts({
  path,
  isEditing,
  onStartRename,
  onCopy,
  onPaste,
  onCut,
  onDelete
}: FileShortcutsProps) {
  const { activeFilePath } = useArticleStore()
  const [currentPlatform, setCurrentPlatform] = useState<Platform>('unknown')

  // Detect current platform
  useEffect(() => {
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
      setCurrentPlatform('unknown')
    }
  }, [])

  // Check if correct modifier key is pressed
  const isModKey = useCallback((e: KeyboardEvent | React.KeyboardEvent): boolean => {
    if (currentPlatform === 'macos') {
      return e.metaKey && !e.ctrlKey
    } else {
      return e.ctrlKey && !e.metaKey
    }
  }, [currentPlatform])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't process shortcuts on mobile
    if (isMobileDevice()) {
      return
    }

    // Ignore when editing
    if (isEditing === true) {
      return
    }

    // Only process selected file/folder
    if (path !== activeFilePath) {
      return
    }

    const modPressed = isModKey(e)

    // Rename: macOS uses Enter, Windows/Linux uses F2
    const isRenameKey = currentPlatform === 'macos'
      ? e.key === 'Enter'
      : e.key === 'F2'

    if (isRenameKey && onStartRename) {
      e.preventDefault()
      e.stopPropagation()
      onStartRename()
      return
    }

    // Copy: Cmd+C / Ctrl+C
    if (modPressed && e.key === 'c' && onCopy) {
      e.preventDefault()
      e.stopPropagation()
      onCopy()
      return
    }

    // Paste: Cmd+V / Ctrl+V
    if (modPressed && e.key === 'v' && onPaste) {
      e.preventDefault()
      e.stopPropagation()
      onPaste()
      return
    }

    // Cut: Cmd+X / Ctrl+X
    if (modPressed && e.key === 'x' && onCut) {
      e.preventDefault()
      e.stopPropagation()
      onCut()
      return
    }

    // Delete: macOS uses Backspace, Windows/Linux uses Delete
    const isDeleteKey = currentPlatform === 'macos'
      ? e.key === 'Backspace'
      : e.key === 'Delete'

    if (isDeleteKey && onDelete) {
      e.preventDefault()
      e.stopPropagation()
      onDelete()
      return
    }
  }, [activeFilePath, isEditing, onStartRename, onCopy, onPaste, onCut, onDelete, path, currentPlatform, isModKey])

  useEffect(() => {
    // Don't add event listeners on mobile
    if (isMobileDevice() || currentPlatform === 'unknown') {
      return
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, currentPlatform])

  return { currentPlatform, isModKey }
}
