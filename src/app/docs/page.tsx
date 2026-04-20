'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useSpring, useInView, AnimatePresence } from 'framer-motion'
import {
  PenLine,
  Github,
  Menu,
  X,
  ChevronRight,
  Cloud,
  Brain,
  Search,
  BookOpen,
  ArrowUp,
  Zap,
  Camera,
  FileText,
  Keyboard,
  Download,
  Globe,
  Image as ImageIcon,
} from 'lucide-react'
import ThemeToggle from '@/components/theme-toggle'

const docSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <BookOpen className="h-4 w-4" strokeWidth={1.5} />,
    items: [
      { title: 'Installation', href: '#installation' },
      { title: 'Workflow', href: '#workflow' },
    ],
  },
  {
    id: 'core-features',
    title: 'Core Features',
    icon: <Zap className="h-4 w-4" strokeWidth={1.5} />,
    items: [
      { title: 'Recording', href: '#recording' },
      { title: 'AI Chat', href: '#ai-chat' },
      { title: 'Editor', href: '#editor' },
    ],
  },
  {
    id: 'ai',
    title: 'AI & Automation',
    icon: <Brain className="h-4 w-4" strokeWidth={1.5} />,
    items: [
      { title: 'Models', href: '#ai-models' },
      { title: 'Skills', href: '#skills' },
      { title: 'RAG', href: '#rag' },
      { title: 'MCP', href: '#mcp' },
    ],
  },
  {
    id: 'sync',
    title: 'Sync & Storage',
    icon: <Cloud className="h-4 w-4" strokeWidth={1.5} />,
    items: [
      { title: 'Git Sync', href: '#git-sync' },
      { title: 'Image Hosting', href: '#image-hosting' },
    ],
  },
  {
    id: 'shortcuts',
    title: 'Shortcuts',
    icon: <Keyboard className="h-4 w-4" strokeWidth={1.5} />,
    items: [
      { title: 'Keyboard Shortcuts', href: '#keyboard-shortcuts' },
    ],
  },
]

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const fadeInScale = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

function AnimatedSection({ 
  children, 
  id, 
  className = '' 
}: { 
  children: React.ReactNode
  id: string
  className?: string 
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeInScale}
      className={className}
    >
      {children}
    </motion.section>
  )
}

export default function DocsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('getting-started')
  const [activeAnchor, setActiveAnchor] = useState('')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
      
      const sections = ['installation', 'ai-models', 'note-taking', 'sync']
      let current = ''
      
      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 150) {
            current = section
          }
        }
      }
      setActiveAnchor(current)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (href: string) => {
    const id = href.replace('#', '')
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const top = element.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [searchResults, setSearchResults] = useState<Array<{
    section: string
    sectionId: string
    item: {title: string, href: string}
    matchType: 'title' | 'section'
  }>>([])
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter sections based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const query = searchQuery.toLowerCase()
    const results: typeof searchResults = []

    docSections.forEach((section) => {
      section.items.forEach((item) => {
        const titleMatch = item.title.toLowerCase().includes(query)
        const sectionMatch = section.title.toLowerCase().includes(query)

        if (titleMatch || sectionMatch) {
          results.push({
            section: section.title,
            sectionId: section.id,
            item,
            matchType: titleMatch ? 'title' : 'section'
          })
        }
      })
    })

    // Sort: title matches first, then section matches
    results.sort((a, b) => {
      if (a.matchType === 'title' && b.matchType === 'section') return -1
      if (a.matchType === 'section' && b.matchType === 'title') return 1
      return 0
    })

    setSearchResults(results)
  }, [searchQuery])

  // Get section icon by id
  const getSectionIcon = (sectionId: string) => {
    const section = docSections.find(s => s.id === sectionId)
    return section?.icon || <BookOpen className="h-4 w-4" strokeWidth={1.5} />
  }

  // Get section color
  const getSectionColor = (sectionId: string) => {
    const colors: Record<string, string> = {
      'getting-started': 'text-emerald-500 bg-emerald-500/10',
      'core-workflow': 'text-amber-500 bg-amber-500/10',
      'ai-features': 'text-purple-500 bg-purple-500/10',
      'editor': 'text-blue-500 bg-blue-500/10',
      'media': 'text-rose-500 bg-rose-500/10',
      'sync': 'text-cyan-500 bg-cyan-500/10',
      'shortcuts': 'text-orange-500 bg-orange-500/10',
    }
    return colors[sectionId] || 'text-muted-foreground bg-muted'
  }

  const handleSearchClick = () => {
    setIsSearchExpanded(true)
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }

  const handleSearchSelect = (href: string) => {
    setSearchQuery('')
    setIsSearchExpanded(false)
    scrollToSection(href)
  }

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.search-container')) {
        setIsSearchExpanded(false)
        setSearchQuery('')
      }
    }

    if (isSearchExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSearchExpanded])

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-muted selection:text-foreground">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-foreground origin-left z-[60]"
        style={{ scaleX }}
      />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <PenLine className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
              <Link href="/" className="font-serif text-lg font-medium tracking-tight text-foreground">NovaFlow</Link>
              <span className="hidden sm:inline text-border mx-2">/</span>
              <span className="hidden sm:inline text-sm text-muted-foreground">Documentation</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                Home
              </Link>
              <Link href="/docs" className="text-sm text-foreground font-medium">
                Docs
              </Link>
              <Link href="/download" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                Download
              </Link>
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

            <div className="flex items-center gap-2">
              <ThemeToggle size="sm" />
              <button
                className="md:hidden p-2 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-6 py-4 space-y-1">
              <Link href="/" className="block py-2 text-sm text-muted-foreground hover:text-foreground">
                Home
              </Link>
              <Link href="/docs" className="block py-2 text-sm font-medium text-foreground">
                Documentation
              </Link>
              <Link href="/download" className="block py-2 text-sm text-muted-foreground hover:text-foreground">
                Download
              </Link>
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

      <div className="flex pt-16">
        {/* Sidebar - desktop only */}
        <aside className="hidden lg:block w-64 fixed left-0 top-16 bottom-0 border-r border-border bg-background overflow-y-auto z-40">
          <div className="p-6">
            {/* Expandable Search Bar */}
            <div className="search-container relative mb-6">
              <div
                onClick={handleSearchClick}
                className={`
                  relative flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer
                  transition-all duration-500 ease-out
                  ${isSearchExpanded 
                    ? 'w-full bg-background border-primary/40 shadow-lg shadow-primary/5' 
                    : 'w-full bg-muted/50 border-transparent hover:bg-muted hover:border-border/60'}
                `}
              >
                <Search className={`h-4 w-4 transition-colors duration-300 ${isSearchExpanded ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={1.5} />
                
                {isSearchExpanded ? (
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search docs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-sm text-muted-foreground/80">Search docs...</span>
                )}
              </div>

              {/* Search Results Pop-out */}
              {isSearchExpanded && searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-full left-0 right-0 mt-2 bg-background border border-border/60 rounded-2xl shadow-2xl shadow-black/15 overflow-hidden z-50"
                >
                  {searchResults.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto py-3">
                      {/* Results count header */}
                      <div className="px-4 pb-2 mb-2 border-b border-border/40">
                        <p className="text-xs text-muted-foreground/80">
                          {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                        </p>
                      </div>

                      {/* Group results by section */}
                      {Array.from(new Set(searchResults.map(r => r.sectionId))).map((sectionId) => {
                        const sectionResults = searchResults.filter(r => r.sectionId === sectionId)
                        const sectionColor = getSectionColor(sectionId)

                        return (
                          <div key={sectionId} className="px-2">
                            {/* Section header */}
                            <div className="flex items-center gap-2 px-2 py-2 mt-1">
                              <div className={`flex items-center justify-center w-6 h-6 rounded-md ${sectionColor}`}>
                                {getSectionIcon(sectionId)}
                              </div>
                              <span className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">
                                {sectionResults[0].section}
                              </span>
                            </div>

                            {/* Section items */}
                            <div className="ml-8 space-y-0.5">
                              {sectionResults.map((result) => {
                                // Highlight matching text
                                const query = searchQuery.toLowerCase()
                                const title = result.item.title
                                const lowerTitle = title.toLowerCase()
                                const matchIndex = lowerTitle.indexOf(query)

                                return (
                                  <button
                                    key={`${result.section}-${result.item.href}`}
                                    onClick={() => handleSearchSelect(result.item.href)}
                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/70 active:bg-muted transition-all duration-150 group"
                                  >
                                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                                      {matchIndex >= 0 ? (
                                        <>
                                          {title.slice(0, matchIndex)}
                                          <mark className="bg-primary/20 text-primary font-medium rounded px-0.5">
                                            {title.slice(matchIndex, matchIndex + searchQuery.length)}
                                          </mark>
                                          {title.slice(matchIndex + searchQuery.length)}
                                        </>
                                      ) : (
                                        title
                                      )}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                          <Search className="h-5 w-5 text-muted-foreground/50" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">No results found</p>
                          <p className="text-xs text-muted-foreground/70">
                            Try searching for &quot;installation&quot;, &quot;AI&quot;, or &quot;sync&quot;
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Glow effect when expanded */}
              {isSearchExpanded && (
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 blur-xl -z-10 opacity-50" />
              )}
            </div>
            
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              {docSections.map((section) => (
                <motion.div key={section.id} variants={fadeIn}>
                  <button
                    onClick={() => setActiveSection(activeSection === section.id ? '' : section.id)}
                    className="flex items-center gap-2 w-full text-left py-2 group"
                  >
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{section.icon}</span>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{section.title}</span>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground ml-auto transition-transform duration-300 ${activeSection === section.id ? 'rotate-90' : ''}`} strokeWidth={1.5} />
                  </button>
                  
                  <AnimatePresence>
                    {activeSection === section.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="ml-6 mt-1 space-y-1 overflow-hidden"
                      >
                        {section.items.map((item) => {
                          const isActive = activeAnchor === item.href.replace('#', '')
                          return (
                            <button
                              key={item.href}
                              onClick={() => scrollToSection(item.href)}
                              className={`block w-full text-left py-1.5 text-sm transition-colors duration-200 ${
                                isActive 
                                  ? 'text-foreground font-medium' 
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 transition-colors duration-200 ${
                                isActive ? 'bg-foreground' : 'bg-muted-foreground/30'
                              }`} />
                              {item.title}
                            </button>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </aside>


        {/* Main Content */}
        <main ref={mainRef} className="flex-1 lg:ml-64">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto px-6 sm:px-8 py-12 lg:py-16"
          >
            <motion.div variants={fadeIn} className="mb-8">
              <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-2">
                Documentation
              </h1>
              <p className="text-muted-foreground">
                NovaFlow — AI-powered notebook for capturing, organizing, and retrieving knowledge.
              </p>
            </motion.div>

            {/* Quick Links */}
            <motion.div variants={fadeIn} className="grid gap-2 grid-cols-1 sm:grid-cols-3 mb-10">
              {[
                { icon: Zap, title: 'Recording', href: '#recording' },
                { icon: Brain, title: 'AI Models', href: '#ai-models' },
                { icon: Cloud, title: 'Sync', href: '#git-sync' },
              ].map((card) => (
                <button
                  key={card.title}
                  onClick={() => scrollToSection(card.href)}
                  className="flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors text-left"
                >
                  <card.icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                  <span className="font-medium text-sm">{card.title}</span>
                </button>
              ))}
            </motion.div>

            {/* Getting Started */}
            <AnimatedSection id="installation" className="mb-10">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Getting Started</span>
              </div>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-3">Installation</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                NovaFlow is a lightweight (~25MB) cross-platform app for Windows, macOS, Linux, Android, and iOS.{' '}
                <a href="/download" className="text-foreground underline underline-offset-2 hover:text-muted-foreground">Download</a> the version for your platform.
              </p>

              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg mb-4">
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium mb-1">macOS Security</p>
                <p className="text-sm text-muted-foreground">
                  If you see a security warning, right-click the app and select &quot;Open&quot;, or go to System Settings → Privacy & Security → Allow Anyway.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection id="workflow" className="mb-10">
              <h2 className="font-serif text-2xl font-medium text-foreground mb-3">The Workflow</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                NovaFlow bridges recording and writing. Capture first, organize later with AI help.
              </p>

              <div className="grid gap-3">
                <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">1</div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm">Record</h3>
                    <p className="text-sm text-muted-foreground">Capture text, screenshots, images, audio, links, or files. No organization needed.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">2</div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm">Chat</h3>
                    <p className="text-sm text-muted-foreground">Discuss recordings with AI. Ask questions, get summaries, find connections.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">3</div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm">Write</h3>
                    <p className="text-sm text-muted-foreground">Transform recordings into polished notes using AI Skills or the Markdown editor.</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Core Features */}
            <AnimatedSection id="recording" className="mb-10">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                <Zap className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Core Features</span>
              </div>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-3">Recording</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Capture anything without breaking your flow. Recordings are stored as marks you can process later.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {[
                  { icon: FileText, label: 'Text' },
                  { icon: ImageIcon, label: 'Image' },
                  { icon: Camera, label: 'Screenshot' },
                  { icon: Globe, label: 'Link' },
                  { icon: Download, label: 'File' },
                  { icon: Cloud, label: 'Audio' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                Images get OCR processing. Screenshots support annotation. Audio uses STT transcription. All recordings can be referenced in AI Chat.
              </p>
            </AnimatedSection>

            <AnimatedSection id="ai-chat" className="mb-10">
              <h2 className="font-serif text-2xl font-medium text-foreground mb-3">AI Chat</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Have contextual conversations about your recordings. Reference specific marks or your entire knowledge base.
              </p>

              <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                <li>Reference any recording or note with @mentions</li>
                <li>Use multiple AI providers in one conversation</li>
                <li>Streaming responses for real-time feedback</li>
                <li>RAG support searches your entire library</li>
                <li>MCP tools extend AI capabilities (desktop only)</li>
              </ul>
            </AnimatedSection>

            <AnimatedSection id="editor" className="mb-10">
              <h2 className="font-serif text-2xl font-medium text-foreground mb-3">Editor</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                A WYSIWYG Markdown editor based on Tiptap. You get visual editing with the portability of standard Markdown files.
              </p>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-muted/50 rounded">Rich text formatting</div>
                <div className="p-2 bg-muted/50 rounded">Code blocks with syntax highlighting</div>
                <div className="p-2 bg-muted/50 rounded">Tables & task lists</div>
                <div className="p-2 bg-muted/50 rounded">Math (LaTeX) & Mermaid diagrams</div>
                <div className="p-2 bg-muted/50 rounded">Search & replace with regex</div>
                <div className="p-2 bg-muted/50 rounded">Auto-save to local storage</div>
              </div>
            </AnimatedSection>

            {/* AI & Automation */}
            <AnimatedSection id="ai-models" className="mb-10">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                <Brain className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>AI & Automation</span>
              </div>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-3">AI Models</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Connect multiple AI providers. Use different models for different tasks — fast ones for quick responses, powerful ones for complex analysis.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm">OpenAI / ChatGPT</p>
                  <p className="text-xs text-muted-foreground">GPT-4, GPT-3.5</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm">Google Gemini</p>
                  <p className="text-xs text-muted-foreground">Pro & Flash models</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm">Ollama</p>
                  <p className="text-xs text-muted-foreground">Local Llama, Mistral</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm">LM Studio</p>
                  <p className="text-xs text-muted-foreground">Local hosting</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Configure chat, image, embedding, TTS, STT, and rerank models. NovaFlow includes a free tier with Qwen3-8B, BGE-M3, and GLM-4.1V.
              </p>
            </AnimatedSection>

            <AnimatedSection id="skills" className="mb-10">
              <h2 className="font-serif text-2xl font-medium text-foreground mb-3">Skills</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                AI agents that transform your recordings. Select marks and apply a skill to generate summaries, outlines, translations, or custom outputs.
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {['Summary', 'Outline', 'Translation', 'Action Items', 'Article Writer'].map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                    {skill}
                  </span>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                Create custom skills in Settings → Skills. Use {'{content}'} placeholders to reference selected recordings.
              </p>
            </AnimatedSection>

            <AnimatedSection id="rag" className="mb-10">
              <h2 className="font-serif text-2xl font-medium text-foreground mb-3">Knowledge Base (RAG)</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Let AI search your entire note collection. Notes are converted to vectors using embedding models, enabling semantic search for relevant context.
              </p>

              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                <li>Configure in Settings → Knowledge Base</li>
                <li>Supports BGE-M3, OpenAI, and other embedding models</li>
                <li>Adjust similarity thresholds for retrieval</li>
                <li>Rebuild index when needed</li>
              </ul>
            </AnimatedSection>

            <AnimatedSection id="mcp" className="mb-10">
              <h2 className="font-serif text-2xl font-medium text-foreground mb-3">MCP</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Model Context Protocol lets AI use external tools. Connect databases, APIs, and custom scripts to extend AI capabilities.
              </p>

              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside mb-3">
                <li>Query databases and generate reports</li>
                <li>Fetch live data from APIs</li>
                <li>Read/write files on your system</li>
                <li>Execute custom commands</li>
              </ul>

              <p className="text-sm text-muted-foreground">
                Add MCP servers in Settings → MCP. Desktop only — not available on mobile.
              </p>
            </AnimatedSection>


            {/* Sync & Storage */}
            <AnimatedSection id="git-sync" className="mb-10">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                <Cloud className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Sync & Storage</span>
              </div>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-3">Git Sync</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Sync via Git. Your notes are standard Markdown files in a repository you control.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {['GitHub', 'Gitee', 'GitLab', 'Gitea'].map((platform) => (
                  <div key={platform} className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-sm">{platform}</p>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground mb-2">Setup: Settings → Sync → Enter token → Auto-creates repo</p>
              <p className="text-sm text-muted-foreground">Also supports S3, WebDAV, and auto-sync intervals.</p>
            </AnimatedSection>

            <AnimatedSection id="image-hosting" className="mb-10">
              <h2 className="font-serif text-2xl font-medium text-foreground mb-3">Image Hosting</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Auto-upload images to GitHub for cross-device access. JSDelivr CDN provides fast global delivery.
              </p>
              <p className="text-sm text-muted-foreground">
                Configure in Settings → Image Hosting. Images are replaced with hosted URLs automatically.
              </p>
            </AnimatedSection>

            {/* Shortcuts */}
            <AnimatedSection id="keyboard-shortcuts" className="mb-10">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                <Keyboard className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Shortcuts</span>
              </div>
              <h2 className="font-serif text-2xl font-medium text-foreground mb-3">Keyboard Shortcuts</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Global shortcuts work even when NovaFlow is not focused. Customize in Settings → Shortcuts.
              </p>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                  <span>Open/Hide</span>
                  <code className="text-muted-foreground">Ctrl+Shift+N</code>
                </div>
                <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                  <span>Quick Text</span>
                  <code className="text-muted-foreground">Ctrl+Shift+T</code>
                </div>
                <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                  <span>Screenshot</span>
                  <code className="text-muted-foreground">Ctrl+Shift+S</code>
                </div>
                <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                  <span>Search</span>
                  <code className="text-muted-foreground">Ctrl+K</code>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-3">
                macOS: Grant accessibility permissions for global shortcuts to work.
              </p>
            </AnimatedSection>

            {/* Footer */}
            <motion.div variants={fadeIn} className="mt-16 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Questions?{' '}
                <a 
                  href="https://github.com/drewsephski/NovaFlow/issues" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-muted-foreground underline underline-offset-2"
                >
                  Open an issue on GitHub
                </a>
              </p>
            </motion.div>
          </motion.div>
        </main>
      </div>
      
      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={scrollToTop}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowUp className="h-5 w-5" strokeWidth={1.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
