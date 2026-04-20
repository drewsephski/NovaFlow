'use client'

import { ThemeProvider } from "@/components/theme-provider"
import useSettingStore from "@/stores/setting"
import { useEffect, useState } from "react";
import { initUnifiedDatabase } from "@/lib/db-unified"
import dayjs from "dayjs"
import zh from "dayjs/locale/zh-cn";
import en from "dayjs/locale/en";
import { useI18n } from "@/hooks/useI18n"
import useVectorStore from "@/stores/vector"
import useImageStore from "@/stores/imageHosting"
import useShortcutStore from "@/stores/shortcut"
import useUpdateStore from "@/stores/update"
import initQuickRecordText from "@/lib/shortcut/quick-record-text"
import { useRouter, usePathname } from "next/navigation"
import initShowWindow from "@/lib/shortcut/show-window"
import { initMcp } from "@/lib/mcp/init"
import { SearchDialog } from "@/components/search-dialog"
import { ActivityDrawer } from "@/components/activity/activity-drawer"
import { reportAppStart } from "@/lib/event-report"
import { TitleBar } from "@/components/title-bar"
import { UniversalStore } from '@/lib/storage'
import { TextSizeProvider } from "@/contexts/text-size-context"
import { SyncConfirmDialog } from "@/components/sync-confirm-dialog"
import { applyThemeColors } from "@/lib/theme-utils"
import emitter from "@/lib/emitter"
import { isEditableKeyboardTarget } from "@/lib/is-editable-keyboard-target"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { initSettingData, uiScale, customThemeColors } = useSettingStore()
  const { initMainHosting } = useImageStore()
  const { currentLocale } = useI18n()
  const { initShortcut } = useShortcutStore()
  const { initVectorDb } = useVectorStore()
  const { initUpdateStore, checkForUpdates } = useUpdateStore()
  const router = useRouter()
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)

  // Redirect old paths to new /core/main
  useEffect(() => {
    async function redirectOldPaths() {
      if (pathname === '/core/article' || pathname === '/core/record') {
        const store = await new UniversalStore('store.json').load()
        await store.set('currentPage', '/core/main')
        await store.save()
        router.replace('/core/main')
      }
    }
    redirectOldPaths()
  }, [pathname, router])

  useEffect(() => {
    let cancelled = false

    const initializeApp = async () => {
      try {
        await initSettingData()
        initMainHosting()

        // Initialize database and default workspace first to avoid reading empty directories or uncreated tables on first startup
        await initUnifiedDatabase()
        if (cancelled) return

        initShortcut()
        await initVectorDb()
        if (cancelled) return

        initQuickRecordText()
        initShowWindow()
        initMcp()
        reportAppStart()

        await initUpdateStore()
        if (cancelled) return
        checkForUpdates()
      } catch (error) {
        console.error('Failed to initialize app core:', error)
      }
    }

    void initializeApp()

    return () => {
      cancelled = true
    }
  }, [])

  // Apply UI scale
  useEffect(() => {
    if (uiScale && uiScale !== 100) {
      document.documentElement.style.fontSize = `${uiScale}%`
    }
  }, [uiScale])

  // Apply custom theme colors
  useEffect(() => {
    applyThemeColors(customThemeColors)
  }, [customThemeColors])

  useEffect(() => {
    switch (currentLocale) {
      case 'zh':
        dayjs.locale(zh);
        break;
      case 'en':
        dayjs.locale(en);
        break;
      default:
        break;
    }
  }, [currentLocale])

  // Disable browser back shortcut (Backspace) and add search shortcut (Cmd/Ctrl+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Search shortcut: Cmd+F (macOS) or Ctrl+F (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        // Check if focus is in editor
        const target = e.target as HTMLElement
        const editorElement = document.getElementById('aritcle-md-editor')
        const isFocusInEditor = editorElement && editorElement.contains(target)

        // If focus is in editor, trigger editor search
        if (isFocusInEditor) {
          e.preventDefault()
          // Trigger editor search
          emitter.emit('editor-search-trigger' as any)
          return
        }

        // Otherwise open global search
        e.preventDefault()
        setSearchOpen(true)
        return
      }

      // If Backspace key pressed and not in editable element
      if (e.key === 'Backspace') {
        const editableTarget = isEditableKeyboardTarget(e.target)
        if (editableTarget) {
          return
        }

        // Otherwise prevent default back behavior
        e.preventDefault()
      }

    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TextSizeProvider>
        <TitleBar
          onSearchClick={() => setSearchOpen(true)}
          onActivityClick={() => setActivityOpen(open => !open)}
          activityOpen={activityOpen}
        />
        <main className="flex flex-1 flex-col overflow-hidden w-full h-[calc(100vh-36px)] mt-9">
          {children}
        </main>
        <ActivityDrawer open={activityOpen} onOpenChange={setActivityOpen} />
        <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
        <SyncConfirmDialog />
      </TextSizeProvider>
    </ThemeProvider>
  );
}
