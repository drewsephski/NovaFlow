'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Brain,
  Zap,
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI__
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isApp, setIsApp] = useState(false)

  useEffect(() => {
    setIsApp(isTauriEnvironment())
  }, [])

  // If running as Tauri app, redirect to core
  if (isApp) {
    if (typeof window !== 'undefined') {
      window.location.href = '/core/main'
    }
    return null
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-[#0a0a0b]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
              <span className="text-lg font-semibold tracking-tight">NovaFlow</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-zinc-400 hover:text-amber-500 transition-colors">
                Features
              </a>
              <a href="/docs" className="text-sm text-zinc-400 hover:text-amber-500 transition-colors">
                Docs
              </a>
              <a href="/download" className="text-sm text-zinc-400 hover:text-amber-500 transition-colors">
                Download
              </a>
              <a 
                href="https://github.com/codexu/note-gen" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-amber-500 transition-colors"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Button 
                variant="ghost" 
                className="text-sm text-zinc-400 hover:text-white"
                asChild
              >
                <a href="/docs">Documentation</a>
              </Button>
              <Button 
                className="bg-amber-500 hover:bg-amber-400 text-black font-medium"
                asChild
              >
                <a href="/download">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            </div>

            <button 
              className="md:hidden p-2 text-zinc-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800/50 bg-[#0a0a0b]">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-sm text-zinc-400 hover:text-amber-500 py-2">
                Features
              </a>
              <a href="/docs" className="block text-sm text-zinc-400 hover:text-amber-500 py-2">
                Docs
              </a>
              <a href="/download" className="block text-sm text-amber-500 font-medium py-2">
                Download
              </a>
              <a 
                href="https://github.com/codexu/note-gen" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-amber-500 py-2"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-sm">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-zinc-400">v0.27.7 is now available</span>
                <a href="/download" className="text-amber-500 hover:underline ml-1">Get it now →</a>
              </span>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight"
            >
              <span className="text-white">Your AI</span>{' '}
              <span className="text-zinc-500">Second Brain</span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="mt-6 text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
            >
              NovaFlow remembers everything. Capture thoughts, organize knowledge, 
              and retrieve information with AI-powered semantic search.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button 
                size="lg"
                className="h-14 px-8 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-base rounded-xl"
                asChild
              >
                <a href="/download">
                  <Download className="mr-2 h-5 w-5" />
                  Download Free
                </a>
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="h-14 px-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-medium text-base rounded-xl"
                asChild
              >
                <a href="/docs">
                  Read Docs
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </motion.div>

            <motion.p variants={itemVariants} className="mt-6 text-sm text-zinc-600">
              Available for macOS, Windows, Linux, and Android • 25MB
            </motion.p>
          </motion.div>
        </div>

        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-t border-zinc-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need
            </motion.h2>
            <motion.p variants={itemVariants} className="text-lg text-zinc-400 max-w-2xl mx-auto">
              A complete note-taking system with AI superpowers
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[
              {
                icon: <Mic className="h-6 w-6" />,
                title: 'Quick Capture',
                desc: 'Voice memos, images, links, or text — capture however you think.',
              },
              {
                icon: <Brain className="h-6 w-6" />,
                title: 'AI Long-term Memory',
                desc: 'Learns your preferences, writing style, and important facts.',
              },
              {
                icon: <Search className="h-6 w-6" />,
                title: 'Semantic Search',
                desc: 'Ask questions in natural language. Find relevant notes instantly.',
              },
              {
                icon: <FileText className="h-6 w-6" />,
                title: 'Markdown Native',
                desc: 'Plain text storage. Future-proof. Own your data forever.',
              },
              {
                icon: <GitBranch className="h-6 w-6" />,
                title: 'Git Sync',
                desc: 'Sync to GitHub, GitLab, or keep it local. Full control.',
              },
              {
                icon: <MessageSquare className="h-6 w-6" />,
                title: 'AI Dialogue',
                desc: 'Chat with your notes. Get insights from your knowledge base.',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/20 p-8 hover:border-zinc-700 hover:bg-zinc-900/40 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">{feature.title}</h3>
                <p className="text-zinc-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tech Specs */}
      <section className="py-24 border-t border-zinc-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Lightweight. Fast. Private.
              </h2>
              <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
                NovaFlow is built with Rust and Next.js for maximum performance. 
                The entire app is just 25MB — launch instantly and stay out of your way.
              </p>
              
              <div className="grid grid-cols-3 gap-6">
                {[
                  { value: '25MB', label: 'App Size' },
                  { value: '<1s', label: 'Launch Time' },
                  { value: '100%', label: 'Open Source' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold text-amber-500">{stat.value}</div>
                    <div className="text-sm text-zinc-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 font-mono text-sm">
              <div className="flex items-center gap-2 text-zinc-500 mb-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="ml-2">novaflow.sh</span>
              </div>
              <div className="space-y-3 text-zinc-400">
                <p><span className="text-amber-500">$</span> nvf --version</p>
                <p className="text-zinc-300">novaflow 0.27.7</p>
                <p className="mt-4"><span className="text-amber-500">$</span> nvf search &ldquo;meeting notes from last week&rdquo;</p>
                <p className="text-zinc-300">Found 3 relevant notes...</p>
                <p className="mt-4"><span className="text-amber-500">$</span> nvf sync</p>
                <p className="text-emerald-500">✓ Synced to GitHub</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-zinc-800/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to remember everything?
          </h2>
          <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto">
            Join thousands of users who trust NovaFlow as their second brain. 
            Free forever, with optional AI model upgrades.
          </p>
          <Button 
            size="lg"
            className="h-14 px-10 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-lg rounded-xl"
            asChild
          >
            <a href="/download">
              <Zap className="mr-2 h-5 w-5" />
              Download NovaFlow Free
            </a>
          </Button>
          <p className="mt-4 text-sm text-zinc-600">
            No account required. No data collection. Just your notes.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
              <span className="font-semibold">NovaFlow</span>
            </div>
            
            <div className="flex items-center gap-8">
              <a href="/docs" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                Documentation
              </a>
              <a href="/download" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                Download
              </a>
              <a 
                href="https://github.com/codexu/note-gen" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                GitHub
              </a>
            </div>
            
            <p className="text-sm text-zinc-600">
              © 2024 NovaFlow. Open source under MIT.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
