'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  BookOpen,
  Settings,
  Github,
  Menu,
  X,
  ChevronRight,
  Terminal,
  Cloud,
  Brain,
  Search,
} from 'lucide-react'

const docSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <BookOpen className="h-4 w-4" />,
    items: [
      { title: 'Installation', href: '#installation' },
      { title: 'Quick Start', href: '#quick-start' },
      { title: 'Configuration', href: '#configuration' },
    ],
  },
  {
    id: 'features',
    title: 'Features',
    icon: <Brain className="h-4 w-4" />,
    items: [
      { title: 'AI Memory', href: '#ai-memory' },
      { title: 'Note Taking', href: '#note-taking' },
      { title: 'Sync', href: '#sync' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: <Settings className="h-4 w-4" />,
    items: [
      { title: 'AI Models', href: '#ai-models' },
      { title: 'Sync Configuration', href: '#sync-config' },
      { title: 'Shortcuts', href: '#shortcuts' },
    ],
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

export default function DocsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('getting-started')

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-[#0a0a0b]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
              <span className="text-lg font-semibold tracking-tight">NovaFlow</span>
              <span className="hidden sm:inline text-zinc-600 mx-2">/</span>
              <span className="hidden sm:inline text-sm text-zinc-500">Docs</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="https://novaflow.sh/" className="text-sm text-zinc-400 hover:text-amber-500 transition-colors">
                Home
              </a>
              <a href="https://novaflow.sh/docs" className="text-sm text-amber-500 font-medium">
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

            <button 
              className="md:hidden p-2 text-zinc-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-zinc-800/50 bg-[#0a0a0b]"
            >
              <div className="px-4 py-4 space-y-3">
                <a href="https://novaflow.sh/" className="block text-sm text-zinc-400 hover:text-amber-500 py-2">
                  Home
                </a>
                <a href="https://novaflow.sh/docs" className="block text-sm text-amber-500 font-medium py-2">
                  Docs
                </a>
                <a href="/download" className="block text-sm text-zinc-400 hover:text-amber-500 py-2">
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
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 fixed left-0 top-16 bottom-0 border-r border-zinc-800/50 bg-[#0a0a0b]/50 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
              <Search className="h-4 w-4" />
              <span className="font-mono text-xs">CMD+K to search</span>
            </div>
            
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {docSections.map((section) => (
                <motion.div key={section.id} variants={itemVariants}>
                  <button
                    onClick={() => setActiveSection(activeSection === section.id ? '' : section.id)}
                    className="flex items-center gap-2 w-full text-left mb-2"
                  >
                    <span className="text-zinc-600">{section.icon}</span>
                    <span className="text-sm font-medium text-zinc-300">{section.title}</span>
                    <ChevronRight className={`h-4 w-4 text-zinc-600 ml-auto transition-transform ${activeSection === section.id ? 'rotate-90' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {activeSection === section.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-6 space-y-1"
                      >
                        {section.items.map((item) => (
                          <a
                            key={item.href}
                            href={item.href}
                            className="block py-1.5 text-sm text-zinc-500 hover:text-amber-500 transition-colors"
                          >
                            {item.title}
                          </a>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
          >
            <motion.div variants={itemVariants} className="mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 mb-6">
                <Terminal className="h-3 w-3 text-amber-500" />
                <span className="text-xs font-mono text-zinc-400">DOCUMENTATION</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
                NovaFlow Docs
              </h1>
              <p className="text-lg text-zinc-400 leading-relaxed">
                Learn how to use NovaFlow — your AI second brain for capturing, organizing, and retrieving knowledge.
              </p>
            </motion.div>

            {/* Quick Links Grid */}
            <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 mb-16">
              {[
                {
                  icon: <Cloud className="h-5 w-5" />,
                  title: 'Sync Setup',
                  desc: 'Configure Git sync across devices',
                  href: '#sync-config',
                },
                {
                  icon: <Brain className="h-5 w-5" />,
                  title: 'AI Memory',
                  desc: 'Teach NovaFlow your preferences',
                  href: '#ai-memory',
                },
              ].map((card) => (
                <a
                  key={card.title}
                  href={card.href}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900/20 p-5 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-500 group-hover:text-amber-500 group-hover:bg-amber-500/10 transition-colors mb-3">
                    {card.icon}
                  </div>
                  <h3 className="font-semibold text-zinc-300 mb-1">{card.title}</h3>
                  <p className="text-sm text-zinc-500">{card.desc}</p>
                </a>
              ))}
            </motion.div>

            {/* Installation Section */}
            <motion.section variants={itemVariants} id="installation" className="mb-16">
              <h2 className="text-2xl font-semibold text-white mb-4">Installation</h2>
              <p className="text-zinc-400 mb-6 leading-relaxed">
                NovaFlow is available for macOS, Windows, Linux, and Android. Download the appropriate version for your platform from the{' '}
                <a href="/download" className="text-amber-500 hover:underline">download page</a>.
              </p>
              
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono mb-2">
                  <span className="text-amber-500">$</span>
                  <span>Quick install (macOS)</span>
                </div>
                <code className="text-sm text-zinc-300 font-mono">
                  brew install --cask novaflow
                </code>
              </div>
            </motion.section>

            {/* AI Models Section */}
            <motion.section variants={itemVariants} id="ai-models" className="mb-16">
              <h2 className="text-2xl font-semibold text-white mb-4">AI Models</h2>
              <p className="text-zinc-400 mb-6 leading-relaxed">
                NovaFlow supports multiple AI providers including OpenAI, Anthropic, and local models via Ollama. 
                Configure your preferred models in Settings → AI.
              </p>
              
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-sm text-zinc-400">
                  NovaFlow Free tier includes access to Qwen3-8B, BGE-M3 embeddings, and GLM-4.1V vision models at no cost.
                </p>
              </div>
            </motion.section>

            {/* Footer */}
            <motion.div variants={itemVariants} className="mt-20 pt-8 border-t border-zinc-800">
              <p className="text-sm text-zinc-600">
                Need help?{' '}
                <a 
                  href="https://github.com/codexu/note-gen/issues" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-amber-500 transition-colors"
                >
                  Open an issue on GitHub
                </a>
              </p>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
