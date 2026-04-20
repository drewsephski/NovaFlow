'use client'

import { useTranslations } from 'next-intl'
import useChatStore from '@/stores/chat'
import { useMemo, useState, useEffect } from 'react'
import { Trash2, FileEdit, FileText, Lightbulb, ArrowRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import emitter from '@/lib/emitter'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'
import useSettingStore from '@/stores/setting'
import { QuickPrompt } from '@/lib/ai/placeholder'

// Initialize dayjs plugin
dayjs.extend(relativeTime)

// Format relative time
function formatRelativeTime(timestamp: number, locale: string): string {
  const dayjsLocale = locale === 'en' ? 'en' : 'zh-cn'
  return dayjs(timestamp).locale(dayjsLocale).fromNow()
}

export default function ChatEmpty() {
  const t = useTranslations('record.chat.empty')
  const { language } = useSettingStore()

  const {
    conversations,
    currentConversationId,
    switchConversation,
    deleteConversation
  } = useChatStore()

  const [aiPrompts, setAiPrompts] = useState<QuickPrompt[]>([])

  // Quick prompt templates - default templates
  const defaultQuickPrompts = useMemo(() => [
    { id: 1, icon: <FileEdit className="w-4 h-4" />, text: t('quickPrompts.writeNote') || 'Help me write a note' },
    { id: 2, icon: <FileText className="w-4 h-4" />, text: t('quickPrompts.summarize') || 'Help me summarize this content' },
    { id: 3, icon: <Lightbulb className="w-4 h-4" />, text: t('quickPrompts.brainstorm') || 'Help me brainstorm some ideas' },
  ], [t])

  // Listen for AI prompt generation events from chat-input
  useEffect(() => {
    const handleAiPromptsGenerated = (prompts: QuickPrompt[]) => {
      if (prompts.length >= 3) {
        setAiPrompts(prompts)
      }
    }

    emitter.on('ai-prompts-generated', handleAiPromptsGenerated)
    return () => {
      emitter.off('ai-prompts-generated', handleAiPromptsGenerated)
    }
  }, [])

  // Use AI-generated prompts or default prompts
  const quickPrompts = useMemo(() => {
    // If AI generated at least 3 prompts, use AI-generated ones
    if (aiPrompts.length >= 3) {
      return aiPrompts.slice(0, 3).map((prompt, index) => ({
        id: `ai-${index}`,
        icon: <Lightbulb className="w-4 h-4" />,
        text: prompt.text
      }))
    }
    // Otherwise use default prompts
    return defaultQuickPrompts
  }, [aiPrompts, defaultQuickPrompts])

  const handleQuickPrompt = (prompt: string) => {
    // Insert text into input box
    emitter.emit('quick-prompt-insert', prompt)
  }

  // Get recent 3 conversations (excluding current and empty)
  const recentConversations = useMemo(() => {
    return conversations
      .filter(c => c.id !== currentConversationId && c.messageCount > 0)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 3)
  }, [conversations, currentConversationId])

  const handleSwitchConversation = async (id: number) => {
    await switchConversation(id)
  }

  const handleDelete = async (id: number) => {
    await deleteConversation(id)
  }

  return (
    <div className="absolute top-0 right-0 w-full flex flex-col items-center justify-center h-full overflow-hidden">
      {/* Dashed background pattern - only visible when empty */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: 'center center'
        }}
      />

      {/* Gradient fade overlay on edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(to right, var(--background) 0%, transparent 15%, transparent 85%, var(--background) 100%),
            linear-gradient(to bottom, var(--background) 0%, transparent 15%, transparent 85%, var(--background) 100%)
          `
        }}
      />

      <div className="relative max-w-[340px] w-full px-2 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">
              {t('title')}
            </h2>
          </div>
          <p className="text-muted-foreground text-sm">
            {t('subtitle')}
          </p>
        </div>

        {/* Quick Prompts */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground px-1">{t('quickPrompts.title') || 'Quick Start'}</p>
          {quickPrompts.map((prompt) => (
            <div
              key={prompt.id}
              onClick={() => handleQuickPrompt(prompt.text)}
              className="w-full bg-primary-foreground px-4 h-10 rounded-lg border hover:border-primary/50 transition-colors text-left group cursor-pointer flex items-center"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-muted-foreground">{prompt.icon}</span>
                  <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {prompt.text}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Conversations */}
        {recentConversations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground px-1">{t('recentConversations')}</p>
            {recentConversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => handleSwitchConversation(conv.id)}
                className="w-full px-1 h-5 rounded-lg transition-colors text-left group cursor-pointer flex items-center"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-medium truncate group-hover:text-primary transition-colors pr-14">
                      {conv.title}
                    </span>
                  </div>
                  <div className="shrink-0 ml-auto flex items-center justify-end relative">
                    {/* Timestamp - hide on hover */}
                    <span className="absolute right-0 text-xs text-muted-foreground opacity-100 group-hover:opacity-0 transition-opacity duration-200 ease-out whitespace-nowrap">
                      {formatRelativeTime(conv.updatedAt, language)}
                    </span>
                    {/* Delete button - show on hover */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(conv.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 z-50 transition-all duration-200 ease-out hover:text-destructive h-6 w-6"
                      title={t('deleteConversation')}
                    >
                      <Trash2 className="w-3 h-3 transition-transform duration-150 group-hover/button:scale-110" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
