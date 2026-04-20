'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  FileText, 
  Zap, 
  MessageSquare, 
  Search,
  Check,
  Mic,
  GitBranch,
  Feather,
  Lock,
  ChevronRight,
  Sparkles,
  Keyboard
} from 'lucide-react'
import { Store } from '@tauri-apps/plugin-store'

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI__
}

async function completeOnboarding(): Promise<void> {
  if (!isTauriEnvironment()) return
  const store = await Store.load('store.json')
  await store.set('hasCompletedOnboarding', true)
  await store.save()
}

// Editorial color palette - warm amber & cream tones
// amber: #D97706, amberLight: #F59E0B, cream: #FEF3C7, warmGray: #78716C, charcoal: #1C1917

interface OnboardingStep {
  id: string
  title: string
  subtitle: string
  description: string
  icon: React.ElementType
  accent: string
  stat: string
  demo?: 'capture' | 'organize' | 'ai' | null
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'intro',
    title: 'Welcome to NovaFlow',
    subtitle: 'Where ideas become knowledge',
    description: 'A thinking space that learns how you think. Capture thoughts instantly, organize with AI, and build your personal knowledge base.',
    icon: Feather,
    accent: 'amber',
    stat: 'Start in 30 seconds',
    demo: null,
  },
  {
    id: 'capture',
    title: 'Capture Instantly',
    subtitle: 'Ideas wait for no one',
    description: 'Voice, text, images — capture however you think. No friction, no friction. Just press ⌘N and start writing.',
    icon: Mic,
    accent: 'amber',
    stat: '< 2 seconds',
    demo: 'capture',
  },
  {
    id: 'memory',
    title: 'It Remembers Context',
    subtitle: 'Like a conversation with a friend',
    description: 'Every chat builds understanding. Your preferences, style, and key facts — woven into every interaction.',
    icon: Brain,
    accent: 'amber',
    stat: 'Context-aware AI',
    demo: null,
  },
  {
    id: 'knowledge',
    title: 'Find by Meaning',
    subtitle: 'Not just keywords',
    description: 'Ask "that idea about productivity" and find it. Semantic search understands concepts, not just text matches.',
    icon: Search,
    accent: 'amber',
    stat: 'Semantic search',
    demo: null,
  },
  {
    id: 'organize',
    title: 'AI Organizes For You',
    subtitle: 'From chaos to clarity',
    description: 'Drop in raw thoughts. AI helps structure, summarize, and connect ideas into polished notes.',
    icon: Sparkles,
    accent: 'amber',
    stat: 'Smart organization',
    demo: 'organize',
  },
  {
    id: 'sync',
    title: 'You Own Everything',
    subtitle: 'Plain Markdown. Forever.',
    description: 'No lock-in. No proprietary formats. Git sync anywhere, or keep it all local. Your data, your control.',
    icon: GitBranch,
    accent: 'amber',
    stat: 'Open format',
    demo: null,
  },
]

const capabilities = [
  { icon: Zap, label: 'Lightning Fast', desc: 'Native app performance' },
  { icon: MessageSquare, label: 'Conversational', desc: 'AI that truly understands context' },
  { icon: FileText, label: 'Future-Proof', desc: 'Plain Markdown, always accessible' },
  { icon: Lock, label: 'Privacy First', desc: 'Local-first, you control everything' },
]

const quickStartActions = [
  { label: 'Create first note', shortcut: '⌘N', icon: FileText },
  { label: 'Quick capture', shortcut: '⌘⇧T', icon: Mic },
  { label: 'Search everything', shortcut: '⌘F', icon: Search },
]

// Animation variants - refined easing with more polish
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.25, ease: "easeInOut" as const },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const, // ease-out-cubic
    },
  },
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.35,
      ease: "easeInOut" as const,
    },
  }),
}

// Demo animation component for interactive onboarding
function DemoAnimation({ type }: { type: 'capture' | 'organize' | 'ai' | null }) {
  if (!type) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="mt-6 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/50 p-4 overflow-hidden"
    >
      {type === 'capture' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Quick capture in action</span>
          </div>
          <div className="space-y-2">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="rounded-lg bg-stone-50 dark:bg-stone-800/50 p-3 text-sm text-stone-700 dark:text-stone-300"
            >
              <span className="text-amber-600 dark:text-amber-400">⌘N</span> → New note created instantly
            </motion.div>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
              className="rounded-lg bg-stone-50 dark:bg-stone-800/50 p-3 text-sm text-stone-700 dark:text-stone-300"
            >
              <span className="text-amber-600 dark:text-amber-400">⌘⇧T</span> → Quick text capture opens
            </motion.div>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.3 }}
              className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 p-3 text-sm text-stone-700 dark:text-stone-300"
            >
              <Sparkles className="inline w-3 h-3 mr-1 text-amber-600" />
              AI auto-suggests tags based on content
            </motion.div>
          </div>
        </div>
      )}
      {type === 'organize' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>AI organization demo</span>
          </div>
          <div className="space-y-2 text-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="p-2 bg-stone-100 dark:bg-stone-800 rounded text-stone-600 dark:text-stone-400 line-clamp-2"
            >
              Raw thought: &quot;meeting with sarah about q3 roadmap need to follow up on design system...&quot;
            </motion.div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="h-px bg-amber-300 dark:bg-amber-700 origin-left"
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg"
            >
              <div className="font-medium text-stone-900 dark:text-stone-100">Q3 Roadmap Discussion</div>
              <ul className="mt-2 space-y-1 text-stone-600 dark:text-stone-400">
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-600" />
                  Meeting with Sarah
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-600" />
                  Follow up: Design System
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// Keyboard shortcut display component
function KeyboardShortcuts() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="mt-6 pt-6 border-t border-stone-200 dark:border-stone-800"
    >
      <p className="text-xs font-medium text-stone-500 dark:text-stone-500 uppercase tracking-wider mb-3">
        Essential shortcuts
      </p>
      <div className="grid grid-cols-3 gap-2">
        {quickStartActions.map((action, idx) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + idx * 0.1 }}
            className="flex flex-col items-center gap-2 p-3 rounded-lg bg-stone-50 dark:bg-stone-900/30"
          >
            <action.icon className="w-4 h-4 text-stone-400 dark:text-stone-500" />
            <span className="text-xs text-stone-600 dark:text-stone-400 text-center">{action.label}</span>
            <kbd className="text-[10px] font-mono bg-white dark:bg-stone-800 px-1.5 py-0.5 rounded border border-stone-200 dark:border-stone-700 text-stone-500">
              {action.shortcut}
            </kbd>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default function WelcomePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const finishOnboarding = async () => {
    setIsCompleting(true)
    await completeOnboarding()
    setTimeout(() => {
      router.push('/core/main')
    }, 600)
  }

  const skipOnboarding = () => {
    router.push('/core/main')
  }

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setDirection(1)
      setCurrentStep(prev => prev + 1)
    } else {
      finishOnboarding()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault()
      nextStep()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      prevStep()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      skipOnboarding()
    } else if (e.key === '?' && e.metaKey) {
      e.preventDefault()
      setShowShortcuts(prev => !prev)
    }
  }, [currentStep])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const step = onboardingSteps[currentStep]
  const Icon = step.icon
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100
  const isLastStep = currentStep === onboardingSteps.length - 1

  return (
    <div className="min-h-screen bg-[#FDFCF8] dark:bg-[#0C0A09] flex flex-col overflow-hidden selection:bg-amber-200 dark:selection:bg-amber-900">
      {/* Subtle warm texture overlay */}
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Top progress bar with segment indicators */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-stone-200 dark:bg-stone-800">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
        {/* Step indicators */}
        <div className="flex justify-between px-4 mt-2">
          {onboardingSteps.map((_, idx) => (
            <motion.div
              key={idx}
              className={`h-1 rounded-full transition-colors duration-300 ${
                idx <= currentStep ? 'bg-amber-500/50' : 'bg-stone-200 dark:bg-stone-800'
              }`}
              style={{ width: `${100 / onboardingSteps.length - 2}%` }}
              initial={false}
              animate={{ 
                backgroundColor: idx <= currentStep ? 'rgb(245 158 11 / 0.5)' : 'rgb(231 229 228)' 
              }}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isCompleting ? (
          <motion.div
            key="complete"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex items-center justify-center p-8"
          >
            <div className="text-center max-w-md">
              <motion.div
                variants={itemVariants}
                className="mb-8"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                  <Check className="w-10 h-10 text-amber-700 dark:text-amber-400" strokeWidth={1.5} />
                </div>
              </motion.div>
              <motion.h2
                variants={itemVariants}
                className="text-3xl font-light tracking-tight text-stone-900 dark:text-stone-100 mb-3"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Ready to think
              </motion.h2>
              <motion.p
                variants={itemVariants}
                className="text-stone-600 dark:text-stone-400 text-lg"
              >
                Your knowledge space awaits.
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="onboarding"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col lg:flex-row"
          >
            {/* Left side - Brand & Context */}
            <div className="lg:w-[40%] lg:min-w-[360px] bg-stone-50 dark:bg-stone-950/50 p-8 lg:p-12 flex flex-col justify-between border-r border-stone-200 dark:border-stone-800">
              <motion.div variants={itemVariants}>
                <div className="flex items-center gap-3 mb-12">
                  <div className="w-10 h-10 rounded-lg bg-amber-600 dark:bg-amber-500 flex items-center justify-center">
                    <Feather className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>
                  <span className="text-lg font-medium tracking-tight text-stone-900 dark:text-stone-100">
                    NovaFlow
                  </span>
                </div>

                {/* Step counter */}
                <div className="space-y-4">
                  {onboardingSteps.map((s, idx) => (
                    <motion.button
                      key={s.id}
                      onClick={() => {
                        setDirection(idx > currentStep ? 1 : -1)
                        setCurrentStep(idx)
                      }}
                      className={`w-full text-left flex items-center gap-4 py-2 px-3 -mx-3 rounded-lg transition-colors ${
                        idx === currentStep
                          ? 'bg-amber-50 dark:bg-amber-900/20'
                          : idx < currentStep
                          ? 'opacity-60 hover:opacity-80'
                          : 'opacity-40 hover:opacity-60'
                      }`}
                      whileHover={{ x: idx === currentStep ? 0 : 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        idx <= currentStep
                          ? 'bg-amber-600 dark:bg-amber-500 text-white'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                      }`}>
                        {idx < currentStep ? (
                          <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <span className={`text-sm ${
                        idx === currentStep
                          ? 'font-medium text-stone-900 dark:text-stone-100'
                          : 'text-stone-600 dark:text-stone-400'
                      }`}>
                        {s.id === 'intro' ? 'Introduction' : s.title}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-auto pt-8 space-y-4">
                <div className="flex items-center gap-3 text-xs text-stone-400 dark:text-stone-600">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-mono text-[10px]">→</kbd>
                    <span>Next</span>
                  </span>
                  <span className="text-stone-300">|</span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-mono text-[10px]">esc</kbd>
                    <span>Skip</span>
                  </span>
                </div>
                
                {/* Keyboard shortcuts toggle */}
                <button
                  onClick={() => setShowShortcuts(!showShortcuts)}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center gap-1"
                >
                  <Keyboard className="w-3 h-3" />
                  {showShortcuts ? 'Hide shortcuts' : 'Show all shortcuts'}
                </button>
                
                <AnimatePresence>
                  {showShortcuts && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <KeyboardShortcuts />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Right side - Content */}
            <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
              <div className="w-full max-w-xl">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="space-y-8"
                  >
                    {/* Icon & Stat */}
                    <div className="flex items-start justify-between">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
                        className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800/80 flex items-center justify-center"
                      >
                        <Icon className="w-8 h-8 text-amber-600 dark:text-amber-500" strokeWidth={1.5} />
                      </motion.div>
                      <motion.span
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="text-sm font-medium text-amber-700 dark:text-amber-400 tracking-wide uppercase"
                      >
                        {step.stat}
                      </motion.span>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
                        className="flex items-center gap-2"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                          Step {currentStep + 1} of {onboardingSteps.length}
                        </span>
                        <span className="text-stone-300">·</span>
                        <span className="text-xs text-stone-500 dark:text-stone-500">{step.stat}</span>
                      </motion.div>
                      
                      <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
                        className="text-3xl lg:text-4xl font-light tracking-tight text-stone-900 dark:text-stone-50"
                        style={{ fontFamily: 'Georgia, serif' }}
                      >
                        {step.title}
                      </motion.h1>
                      <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
                        className="text-lg text-amber-700 dark:text-amber-400 font-light"
                      >
                        {step.subtitle}
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, duration: 0.4, ease: "easeOut" }}
                        className="text-stone-600 dark:text-stone-400 leading-relaxed max-w-lg"
                      >
                        {step.description}
                      </motion.p>
                    </div>
                    
                    {/* Interactive Demo */}
                    <DemoAnimation type={step.demo ?? null} />

                    {/* Capabilities grid on intro */}
                    {currentStep === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
                        className="pt-2"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          {capabilities.map((cap, idx) => (
                            <motion.div
                              key={cap.label}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 + idx * 0.08, duration: 0.3 }}
                              className="group rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/30 p-3 hover:border-amber-300 dark:hover:border-amber-700/50 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
                                  <cap.icon className="w-4 h-4 text-amber-600 dark:text-amber-500" strokeWidth={1.5} />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                                    {cap.label}
                                  </p>
                                  <p className="text-xs text-stone-500 dark:text-stone-500 mt-0.5">
                                    {cap.desc}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Navigation */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                      className="flex items-center justify-between pt-6"
                    >
                      <button
                        onClick={skipOnboarding}
                        className="group text-sm text-stone-400 hover:text-stone-600 dark:text-stone-600 dark:hover:text-stone-400 transition-colors flex items-center gap-1"
                      >
                        <span>Skip tour</span>
                        <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </button>

                      <div className="flex items-center gap-2">
                        {currentStep > 0 && (
                          <button
                            onClick={prevStep}
                            className="px-4 py-2 text-sm font-medium text-stone-500 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
                          >
                            Back
                          </button>
                        )}
                        <button
                          onClick={nextStep}
                          className="group inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-medium rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-sm hover:shadow"
                        >
                          {isLastStep ? (
                            <>
                              <span>Get started</span>
                              <Check className="w-4 h-4" strokeWidth={1.5} />
                            </>
                          ) : (
                            <>
                              <span>Continue</span>
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.5} />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
