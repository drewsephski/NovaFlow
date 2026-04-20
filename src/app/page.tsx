'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  PenLine,
  Brain,
  FileText,
  Github,
  Download,
  ArrowRight,
  Menu,
  X,
  MessageSquare,
  Search,
  GitBranch,
  Mic,
  ArrowUpRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/theme-toggle'
import Link from 'next/link'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI__
}

// Dynamic imports for Tauri-only modules
const loadTauriModules = async () => {
  const [{ Store }, { isMobileDevice }] = await Promise.all([
    import('@tauri-apps/plugin-store'),
    import('@/lib/check')
  ])
  return { Store, isMobileDevice }
}

export default function Home() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isApp, setIsApp] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const tauri = isTauriEnvironment()
    setIsApp(tauri)
    
    // If running as Tauri app, redirect to core
    if (tauri) {
      const init = async () => {
        try {
          const { Store, isMobileDevice } = await loadTauriModules()
          const store = await Store.load('store.json')
          
          // Check onboarding
          const hasCompletedOnboarding = await store.get<boolean>('hasCompletedOnboarding')
          if (!hasCompletedOnboarding) {
            router.push('/welcome')
            return
          }
          
          let currentPage = await store.get<string>('currentPage')
          
          if (isMobileDevice()) {
            if (currentPage?.includes('/mobile')) {
              router.push(currentPage || '/mobile/chat')
            } else {
              router.push('/mobile/chat')
            }
          } else {
            // Redirect old paths
            if (currentPage === '/core/article' || currentPage === '/core/record') {
              currentPage = '/core/main'
              await store.set('currentPage', '/core/main')
              await store.save()
            }
            
            if (!currentPage?.includes('/mobile')) {
              router.push(currentPage || '/core/main')
            } else {
              router.push('/core/main')
            }
          }
        } catch (error) {
          console.error('Tauri init error:', error)
          router.push('/core/main')
        }
      }
      init()
    } else {
      // Web visitors - show landing page
      setIsLoading(false)
    }
  }, [router])

  // Show nothing while determining where to redirect (Tauri only)
  if (isApp || isLoading) {
    return null
  }

  // Landing Page for web visitors
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-muted selection:text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <PenLine className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
              <Link href="/">
                <span className="font-serif text-lg font-medium tracking-tight text-foreground">NovaFlow</span>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                Features
              </a>
              <a href="/download" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                Download
              </a>
              <a 
                href="https://github.com/drewsephski/novaflow" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <Github className="h-4 w-4" strokeWidth={1.5} />
                <span>GitHub</span>
              </a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button 
                variant="ghost" 
                className="text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
                asChild
              >
                <a href="/docs">Docs</a>
              </Button>
              <Button 
                className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground"
                asChild
              >
                <a href="/download">
                  <Download className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
                  Download
                </a>
              </Button>
              <ThemeToggle />
            </div>

            <button 
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-6 py-4 space-y-1">
              <a href="#features" className="block py-2 text-sm text-muted-foreground hover:text-foreground">
                Features
              </a>
              <a href="/download" className="block py-2 text-sm font-medium text-foreground">
                Download
              </a>
              <a 
                href="https://github.com/drewsephski/novaflow" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Github className="h-4 w-4" strokeWidth={1.5} />
                GitHub
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Asymmetric editorial layout */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start"
          >
            {/* Left column - Main content */}
            <div className="lg:col-span-7">
              <motion.div variants={fadeIn} className="mb-8">
                <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <span className="h-px w-4 bg-border"></span>
                  Version 0.27.7
                </span>
              </motion.div>

              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-foreground leading-[1.1]">
                Your AI
                <br />
                <span className="italic text-muted-foreground">second brain</span>
              </h1>

              <motion.p 
                variants={fadeIn}
                className="mt-8 text-lg text-muted-foreground max-w-lg leading-relaxed"
              >
                NovaFlow remembers everything you capture. Notes, ideas, and knowledge—
                organized and retrievable with semantic search.
              </motion.p>

              <motion.div 
                variants={fadeIn}
                className="mt-10 flex flex-col sm:flex-row items-start gap-4"
              >
                <Button 
                  size="lg"
                  className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium"
                  asChild
                >
                  <a href="/download">
                    <Download className="mr-2 h-4 w-4" strokeWidth={1.5} />
                    Download Free
                  </a>
                </Button>
                <Button 
                  size="lg"
                  variant="ghost"
                  className="h-12 px-6 text-muted-foreground hover:text-foreground hover:bg-muted text-sm font-medium"
                  asChild
                >
                  <a href="/docs">
                    Read Documentation
                    <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.5} />
                  </a>
                </Button>
              </motion.div>

              <motion.p variants={fadeIn} className="mt-6 text-xs text-muted-foreground">
                Available for macOS, Windows, Linux, and Android
              </motion.p>
            </div>

            {/* Right column - Feature highlights */}
            <motion.div 
              variants={fadeIn}
              className="lg:col-span-5 lg:pt-20"
            >
              <div className="space-y-6">
                {[
                  { num: '25MB', label: 'Lightweight app' },
                  { num: '<1s', label: 'Launch time' },
                  { num: '100%', label: 'Open source' },
                ].map((stat, i) => (
                  <div key={i} className="flex items-baseline gap-4 border-b border-border pb-6">
                    <span className="font-serif text-4xl font-medium text-foreground">{stat.num}</span>
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Editorial grid layout */}
      <section id="features" className="py-24 border-t border-border">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={fadeIn} className="mb-16 max-w-2xl">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 block">
                Capabilities
              </span>
              <h2 className="font-serif text-4xl sm:text-5xl font-medium text-foreground leading-tight">
                Everything you need to capture and find your ideas
              </h2>
            </motion.div>

            <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: <Mic className="h-5 w-5" strokeWidth={1.5} />,
                  title: 'Quick Capture',
                  desc: 'Voice memos, images, links, or text — capture however you think.',
                },
                {
                  icon: <Brain className="h-5 w-5" strokeWidth={1.5} />,
                  title: 'AI Memory',
                  desc: 'Learns your preferences, writing style, and important facts.',
                },
                {
                  icon: <Search className="h-5 w-5" strokeWidth={1.5} />,
                  title: 'Semantic Search',
                  desc: 'Ask questions in natural language. Find relevant notes instantly.',
                },
                {
                  icon: <FileText className="h-5 w-5" strokeWidth={1.5} />,
                  title: 'Markdown Native',
                  desc: 'Plain text storage. Future-proof. Own your data forever.',
                },
                {
                  icon: <GitBranch className="h-5 w-5" strokeWidth={1.5} />,
                  title: 'Git Sync',
                  desc: 'Sync to GitHub, GitLab, or keep it local. Full control.',
                },
                {
                  icon: <MessageSquare className="h-5 w-5" strokeWidth={1.5} />,
                  title: 'AI Dialogue',
                  desc: 'Chat with your notes. Get insights from your knowledge base.',
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  variants={fadeIn}
                  className="bg-background p-8 group"
                >
                  <div className="flex h-10 w-10 items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors duration-300 mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="font-serif text-xl font-medium text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Technical Section - Side by side */}
      <section className="py-24 border-t border-border">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.span variants={fadeIn} className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 block">
                Technical
              </motion.span>
              <motion.h2 variants={fadeIn} className="font-serif text-3xl sm:text-4xl font-medium text-foreground mb-6 leading-tight">
                Built for speed and privacy
              </motion.h2>
              <motion.p variants={fadeIn} className="text-muted-foreground mb-8 leading-relaxed max-w-md">
                NovaFlow is built with Rust and Next.js for maximum performance. 
                The entire app is just 25MB — launch instantly and stay out of your way.
              </motion.p>
              <motion.a 
                variants={fadeIn}
                href="https://github.com/drewsephski/novaflow" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
              >
                View on GitHub
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
              </motion.a>
            </motion.div>

            <motion.div
              variants={fadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="bg-muted p-6 font-mono text-sm rounded-lg"
            >
              <div className="space-y-3 text-muted-foreground">
                <p><span className="text-muted-foreground/60">$</span> novaflow --version</p>
                <p className="text-foreground">novaflow 0.27.7</p>
                <p className="mt-4"><span className="text-muted-foreground/60">$</span> novaflow search &ldquo;meeting notes from last week&rdquo;</p>
                <p className="text-foreground">Found 3 relevant notes...</p>
                <p className="mt-4"><span className="text-muted-foreground/60">$</span> novaflow sync</p>
                <p className="text-muted-foreground">Synced to GitHub</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-border">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-2xl"
          >
            <motion.h2 variants={fadeIn} className="font-serif text-4xl sm:text-5xl font-medium text-foreground mb-6 leading-tight">
              Ready to remember everything?
            </motion.h2>
            <motion.p variants={fadeIn} className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Join thousands of users who trust NovaFlow to capture their thoughts. 
              Free forever, with optional AI model upgrades.
            </motion.p>
            <motion.div variants={fadeIn}>
              <Button 
                size="lg"
                className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium"
                asChild
              >
                <a href="/download">
                  <Download className="mr-2 h-4 w-4" strokeWidth={1.5} />
                  Download NovaFlow Free
                </a>
              </Button>
            </motion.div>
            <motion.p variants={fadeIn} className="mt-4 text-xs text-muted-foreground">
              No account required. No data collection. Just your notes.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <PenLine className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <span className="font-serif font-medium text-foreground">NovaFlow</span>
            </div>
            
            <div className="flex items-center gap-8">
              <a href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </a>
              <a href="/download" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Download
              </a>
              <a 
                href="https://github.com/drewsephski/novaflow" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            </div>
            
            <p className="text-xs text-muted-foreground">
              MIT License · 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Helper function to mark onboarding as complete
export async function completeOnboarding(): Promise<void> {
  if (!isTauriEnvironment()) return
  const { Store } = await import('@tauri-apps/plugin-store')
  const store = await Store.load('store.json')
  await store.set('hasCompletedOnboarding', true)
  await store.save()
}
