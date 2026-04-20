'use client'

import { 
  FileText, 
  MessageSquareText, 
  Search, 
  FolderOpen, 
  Feather, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Zap,
  PenLine,
  BookOpen
} from 'lucide-react'
import useArticleStore from '@/stores/article'
import { useTranslations } from 'next-intl'
import { open } from '@tauri-apps/plugin-dialog'
import { Store } from '@tauri-apps/plugin-store'
import emitter from '@/lib/emitter'
import { useEffect, useState } from 'react'
import useShortcutStore from '@/stores/shortcut'
import useSettingStore from '@/stores/setting'
import { useSidebarStore } from '@/stores/sidebar'
import { motion } from 'framer-motion'
import { getActiveOnboardingStep, getNextOnboardingStep, type OnboardingProgress, type OnboardingStepId } from './onboarding-state'
import { createNewNoteFromEmptyState } from './empty-state-actions'

interface ActionItem {
  icon: React.ReactNode
  title: string
  description: string
  shortcut?: string
  onClick: () => void
}

interface EmptyStateProps {
  onboardingProgress: OnboardingProgress
  activeOnboardingStep: OnboardingStepId | null
  visibleOnboardingStep: OnboardingStepId | null
  completedOnboardingStep: OnboardingStepId | null
  onStartOnboardingStep: (step: OnboardingStepId) => void | Promise<void>
  onContinueToNextStep: () => void | Promise<void>
  onDismissOnboarding: () => void | Promise<void>
}

export function EmptyState({
  onboardingProgress,
  activeOnboardingStep,
  visibleOnboardingStep,
  completedOnboardingStep,
  onStartOnboardingStep,
  onContinueToNextStep,
  onDismissOnboarding,
}: EmptyStateProps) {
  const { newFile } = useArticleStore()
  const { setLeftSidebarTab } = useSidebarStore()
  const t = useTranslations('article.emptyState')
  const { shortcuts } = useShortcutStore()
  const { addWorkspaceHistory } = useSettingStore()
  const [textRecordShortcut, setTextRecordShortcut] = useState('')

  const handleCreateNote = async () => {
    await createNewNoteFromEmptyState({
      setLeftSidebarTab,
      newFile,
    })
  }

  // 注册快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N 创建笔记
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        void handleCreateNote()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [newFile, setLeftSidebarTab])

  // 读取文本记录快捷键
  useEffect(() => {
    const shortcut = shortcuts.find(s => s.key === 'quickRecordText')
    if (shortcut) {
      // 转换快捷键格式：CommandOrControl+Shift+T -> ⌘ ⇧ T
      const formatted = shortcut.value
        .replace('CommandOrControl', '⌘')
        .replace('Command', '⌘')
        .replace('Control', 'Ctrl')
        .replace('Shift', '⇧')
        .replace('Alt', '⌥')
        .replace('+', ' ')
      setTextRecordShortcut(formatted)
    }
  }, [shortcuts])

  const handleOpenWorkspace = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: '选择工作区目录'
      })
      
      if (selected && typeof selected === 'string') {
        const store = await Store.load('store.json')
        await store.set('workspacePath', selected)
        await store.save()
        
        // 添加到历史记录
        await addWorkspaceHistory(selected)
        
        // 重新加载页面以应用新工作区
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to open workspace:', error)
    }
  }

  const handleOpenRecord = () => {
    // 触发文本记录弹窗
    emitter.emit('quickRecordTextHandler')
  }

  const handleGlobalSearch = () => {
    // 触发全局搜索弹窗 (Cmd/Ctrl + F)
    const event = new KeyboardEvent('keydown', {
      key: 'f',
      metaKey: true,
      ctrlKey: true,
      bubbles: true
    })
    window.dispatchEvent(event)
  }

  const actions: ActionItem[] = [
    {
      icon: <FileText className="w-5 h-5" />,
      title: t('actions.newNote.title'),
      description: t('actions.newNote.desc'),
      shortcut: '⌘ N',
      onClick: () => void handleCreateNote()
    },
    {
      icon: <MessageSquareText className="w-5 h-5" />,
      title: t('actions.newRecord.title'),
      description: t('actions.newRecord.desc'),
      shortcut: textRecordShortcut,
      onClick: handleOpenRecord
    },
    {
      icon: <Search className="w-5 h-5" />,
      title: t('actions.globalSearch.title'),
      description: t('actions.globalSearch.desc'),
      shortcut: '⌘ F',
      onClick: handleGlobalSearch
    },
    {
      icon: <FolderOpen className="w-5 h-5" />,
      title: t('actions.openWorkspace.title'),
      description: t('actions.openWorkspace.desc'),
      onClick: handleOpenWorkspace
    }
  ]

  const onboardingSteps: Array<{ id: OnboardingStepId; title: string; description: string; icon: React.ReactNode; color: string }> = [
    {
      id: 'create-record',
      title: t('onboarding.steps.createRecord.title'),
      description: t('onboarding.steps.createRecord.desc'),
      icon: <Zap className="w-4 h-4" />,
      color: 'amber',
    },
    {
      id: 'organize-note',
      title: t('onboarding.steps.organizeNote.title'),
      description: t('onboarding.steps.organizeNote.desc'),
      icon: <PenLine className="w-4 h-4" />,
      color: 'blue',
    },
    {
      id: 'ai-polish',
      title: t('onboarding.steps.aiPolish.title'),
      description: t('onboarding.steps.aiPolish.desc'),
      icon: <Sparkles className="w-4 h-4" />,
      color: 'purple',
    },
  ]
  const completedStep = onboardingSteps.find((step) => step.id === completedOnboardingStep) || null
  const nextOnboardingStepId = getNextOnboardingStep(onboardingProgress, completedOnboardingStep)
  const hasPendingNextStep = getActiveOnboardingStep(onboardingProgress) !== null
  const currentOnboardingStep = onboardingSteps.find((step) => step.id === activeOnboardingStep)
    || onboardingSteps.find((step) => step.id === nextOnboardingStepId)
    || null
  const completedOnboardingIndex = completedStep
    ? onboardingSteps.findIndex((step) => step.id === completedStep.id)
    : -1
  const showCompletedCard = Boolean(completedStep && hasPendingNextStep)
  const showOnboardingCard = !onboardingProgress.dismissed && (showCompletedCard || Boolean(currentOnboardingStep))

  // Get color class based on step
  const getStepColorClass = (stepId: OnboardingStepId, type: 'bg' | 'border' | 'text' | 'icon' = 'bg') => {
    const colorMap: Record<OnboardingStepId, Record<string, string>> = {
      'create-record': {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800/50',
        text: 'text-amber-700 dark:text-amber-400',
        icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
      },
      'organize-note': {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800/50',
        text: 'text-blue-700 dark:text-blue-400',
        icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
      },
      'ai-polish': {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800/50',
        text: 'text-purple-700 dark:text-purple-400',
        icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
      },
    }
    return colorMap[stepId][type] || ''
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#FDFCF8] dark:bg-[#0C0A09] p-8">
      <div className="max-w-2xl w-full space-y-10">
        {/* Header - Editorial Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-600 dark:bg-amber-500 flex items-center justify-center shadow-sm">
              <Feather className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <h1 
              className="text-4xl font-light tracking-tight text-stone-900 dark:text-stone-100"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              NovaFlow
            </h1>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-medium tracking-tight text-stone-700 dark:text-stone-300">
              {t('title')}
            </h2>
            <p className="text-stone-500 dark:text-stone-500 text-sm max-w-md mx-auto leading-relaxed">
              {t('subtitle')}
            </p>
          </div>
        </motion.div>

        {/* Onboarding Card - Enhanced with Color Coding */}
        {showOnboardingCard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/50 shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {t('onboarding.title')}
                  </h3>
                </div>
                <button
                  onClick={() => void onDismissOnboarding()}
                  className="text-xs text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors"
                >
                  {t('onboarding.dismiss')}
                </button>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-500 mt-1 ml-8">{t('onboarding.subtitle')}</p>
            </div>

            {/* Progress Steps */}
            <div className="p-5 space-y-3">
              {onboardingSteps.map((step, idx) => {
                const isCompleted = onboardingProgress.steps[step.id]
                const isActive = currentOnboardingStep?.id === step.id
                // const isPending = !isCompleted && !isActive
                
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    className={`relative flex items-start gap-3 p-3 rounded-lg transition-all ${
                      isActive 
                        ? getStepColorClass(step.id, 'bg') + ' ' + getStepColorClass(step.id, 'border') + ' border'
                        : isCompleted
                        ? 'bg-stone-50 dark:bg-stone-900/30'
                        : 'opacity-60'
                    }`}
                  >
                    {/* Status Icon */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : isActive
                        ? getStepColorClass(step.id, 'icon')
                        : 'bg-stone-200 dark:bg-stone-800 text-stone-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-stone-500">Step {idx + 1}</span>
                        {isCompleted && (
                          <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">Done</span>
                        )}
                      </div>
                      <h4 className={`text-sm font-medium mt-0.5 ${
                        isActive ? 'text-stone-900 dark:text-stone-100' : 'text-stone-700 dark:text-stone-300'
                      }`}>
                        {step.title}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-500 mt-0.5 line-clamp-2">
                        {step.description}
                      </p>
                      
                      {/* Action Button for Active Step */}
                      {isActive && (
                        <button
                          onClick={() => void onStartOnboardingStep(step.id)}
                          className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            step.id === 'create-record'
                              ? 'bg-amber-600 text-white hover:bg-amber-700'
                              : step.id === 'organize-note'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {visibleOnboardingStep === step.id ? t('onboarding.viewHint') : t('onboarding.start')}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Completion State */}
            {showCompletedCard && completedStep && (
              <div className="px-5 pb-5">
                <div className={`rounded-lg border p-4 ${getStepColorClass(completedStep.id, 'bg')} ${getStepColorClass(completedStep.id, 'border')}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
                          {t('onboarding.stepCompletedLabel', { current: completedOnboardingIndex + 1, total: onboardingSteps.length })}
                        </p>
                      </div>
                      <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100">
                        {completedStep.title}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-500 mt-0.5">
                        {completedStep.description}
                      </p>
                    </div>
                    <button
                      onClick={() => void onContinueToNextStep()}
                      className="group shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 px-3 py-1.5 text-xs font-medium text-white dark:text-stone-900 transition-colors hover:bg-stone-800 dark:hover:bg-stone-200"
                    >
                      {t('onboarding.continue')}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Actions Grid - Enhanced Cards */}
        <div className="space-y-3">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider"
          >
            Quick Actions
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            {actions.map((action, index) => (
              <motion.button
                key={index}
                onClick={action.onClick}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.08 }}
                whileHover={{ y: -1, transition: { duration: 0.15 } }}
                className="group relative flex items-start gap-4 p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/50 hover:border-amber-300 dark:hover:border-amber-700/50 hover:shadow-sm transition-all duration-200 text-left"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-stone-50 dark:bg-stone-800 flex items-center justify-center group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20 transition-colors">
                  <div className="text-stone-400 group-hover:text-amber-600 dark:text-stone-500 dark:group-hover:text-amber-400 transition-colors">
                    {action.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                      {action.title}
                    </h3>
                    {action.shortcut && (
                      <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 px-1.5 font-mono text-[10px] font-medium text-stone-500 dark:text-stone-400">
                        {action.shortcut}
                      </kbd>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-500 mt-1 leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Tips - Enhanced Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pt-4 border-t border-stone-200 dark:border-stone-800"
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <a
                href="https://novaflow.sh/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-stone-500 dark:text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="underline underline-offset-2">Documentation</span>
              </a>
            </div>
            <div className="flex items-center gap-1.5 text-stone-400 dark:text-stone-600">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span>Local-first · Your data stays private</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
