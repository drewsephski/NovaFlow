'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Apple,
  Monitor,
  Smartphone,
  Download,
  CheckCircle2,
  Terminal,
  Zap,
  Sparkles,
  FileText,
  ArrowRight,
  Github,
  BookOpen,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReleaseInfo {
  version: string
  published_at: string
}

interface PlatformDownload {
  name: string
  icon: React.ReactNode
  extension: string
  url: string
  size?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
}

export default function DownloadPage() {
  const [platform, setPlatform] = useState<'mac' | 'windows' | 'linux' | null>(null)
  const [release, setRelease] = useState<ReleaseInfo | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null)

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('mac')) setPlatform('mac')
    else if (userAgent.includes('win')) setPlatform('windows')
    else if (userAgent.includes('linux')) setPlatform('linux')

    fetch('https://api.github.com/repos/codexu/note-gen/releases/latest')
      .then((res) => res.json())
      .then((data) => {
        setRelease({
          version: data.tag_name.replace('note-gen-v', ''),
          published_at: new Date(data.published_at).toLocaleDateString(),
        })
      })
      .catch(() => {
        setRelease({ version: '0.27.7', published_at: '2024-01-15' })
      })
  }, [])

  const baseUrl = 'https://github.com/codexu/note-gen/releases/latest/download'
  const version = release?.version || '0.27.7'

  const allDownloads: PlatformDownload[] = [
    {
      name: 'macOS Apple Silicon',
      icon: <Apple className="h-5 w-5" />,
      extension: 'DMG',
      url: `${baseUrl}/NoteGen_${version}_aarch64.dmg`,
      size: '25 MB',
    },
    {
      name: 'macOS Intel',
      icon: <Apple className="h-5 w-5" />,
      extension: 'DMG',
      url: `${baseUrl}/NoteGen_${version}_x64.dmg`,
      size: '28 MB',
    },
    {
      name: 'Windows x64',
      icon: <Monitor className="h-5 w-5" />,
      extension: 'EXE',
      url: `${baseUrl}/NoteGen_${version}_x64-setup.exe`,
      size: '32 MB',
    },
    {
      name: 'Linux AppImage',
      icon: <Monitor className="h-5 w-5" />,
      extension: 'AppImage',
      url: `${baseUrl}/NoteGen_${version}_amd64.AppImage`,
      size: '35 MB',
    },
    {
      name: 'Linux DEB',
      icon: <Monitor className="h-5 w-5" />,
      extension: 'deb',
      url: `${baseUrl}/NoteGen_${version}_amd64.deb`,
      size: '30 MB',
    },
    {
      name: 'Android Universal',
      icon: <Smartphone className="h-5 w-5" />,
      extension: 'APK',
      url: `${baseUrl}/NoteGen_${version}_android-universal.apk`,
      size: '18 MB',
    },
  ]

  const getPrimaryDownload = (): PlatformDownload => {
    switch (platform) {
      case 'mac':
        return allDownloads[0]
      case 'windows':
        return allDownloads[2]
      case 'linux':
        return allDownloads[3]
      default:
        return allDownloads[0]
    }
  }

  const primaryDownload = getPrimaryDownload()

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
              <a href="https://novaflow.sh/" className="text-sm text-zinc-400 hover:text-amber-500 transition-colors">
                Home
              </a>
              <a href="https://novaflow.sh/docs" className="text-sm text-zinc-400 hover:text-amber-500 transition-colors">
                Docs
              </a>
              <a href="/download" className="text-sm text-amber-500 font-medium">
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
                <a href="https://novaflow.sh/docs" className="block text-sm text-zinc-400 hover:text-amber-500 py-2">
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
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <motion.div
        className="mx-auto max-w-7xl px-4 pt-32 pb-20 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-mono text-zinc-400">v{release?.version || '0.27.7'} AVAILABLE</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="max-w-3xl">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="text-zinc-500">Install</span>{' '}
            <span className="text-white">NovaFlow</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-xl leading-relaxed">
            Your AI second brain. 25MB. Lightning fast. Available for macOS, Windows, Linux, and Android.
          </p>
        </motion.div>

        {/* Primary Download */}
        <motion.div variants={itemVariants} className="mt-12">
          <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 sm:p-10 hover:border-amber-500/30 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  {primaryDownload.icon}
                </div>
                <div>
                  <p className="text-sm text-zinc-500 font-mono mb-1">Detected Platform</p>
                  <h2 className="text-2xl font-semibold text-white">{primaryDownload.name}</h2>
                </div>
              </div>
              
              <Button
                size="lg"
                className="h-14 px-8 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-base rounded-xl transition-all hover:scale-105"
                onClick={() => window.open(primaryDownload.url, '_blank')}
              >
                <Download className="mr-2 h-5 w-5" />
                Download .{primaryDownload.extension}
              </Button>
            </div>
            
            <div className="relative mt-6 flex items-center gap-6 text-sm text-zinc-500 font-mono border-t border-zinc-800 pt-4">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Code Signed
              </span>
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Auto-updates
              </span>
              <span>{primaryDownload.size}</span>
            </div>
          </div>
        </motion.div>

        {/* Platform Grid */}
        <motion.div variants={itemVariants} className="mt-8">
          <div className="flex items-center gap-4 mb-6">
            <Terminal className="h-4 w-4 text-zinc-600" />
            <span className="text-sm font-mono text-zinc-600 uppercase tracking-wider">All Platforms</span>
          </div>
          
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allDownloads.map((download) => (
              <button
                key={download.name}
                onClick={() => window.open(download.url, '_blank')}
                onMouseEnter={() => setHoveredPlatform(download.name)}
                onMouseLeave={() => setHoveredPlatform(null)}
                className="group relative flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 text-left transition-all hover:border-zinc-700 hover:bg-zinc-900/40"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                    hoveredPlatform === download.name ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {download.icon}
                  </div>
                  <div>
                    <p className="font-medium text-zinc-300">{download.name}</p>
                    <p className="text-xs text-zinc-600 font-mono">{download.size} • {download.extension}</p>
                  </div>
                </div>
                <ArrowRight className={`h-4 w-4 transition-all ${
                  hoveredPlatform === download.name ? 'text-amber-500 translate-x-1' : 'text-zinc-700'
                }`} />
              </button>
            ))}
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div variants={itemVariants} className="mt-20 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: <Terminal className="h-5 w-5" />,
              title: 'Lightweight',
              desc: '25MB app. Instant launch. No bloat.',
            },
            {
              icon: <FileText className="h-5 w-5" />,
              title: 'Markdown Native',
              desc: 'Plain text storage. Future-proof.',
            },
            {
              icon: <Sparkles className="h-5 w-5" />,
              title: 'AI Powered',
              desc: 'Long-term memory. Semantic search.',
            },
          ].map((feature, i) => (
            <div 
              key={i}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 hover:border-zinc-700 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-500 group-hover:text-amber-500 group-hover:bg-amber-500/10 transition-colors">
                {feature.icon}
              </div>
              <h3 className="mt-4 font-semibold text-zinc-300">{feature.title}</h3>
              <p className="mt-2 text-sm text-zinc-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Footer Links */}
        <motion.div variants={itemVariants} className="mt-20 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800 pt-8">
          <p className="text-sm text-zinc-600">
            Released {release?.published_at || '2024-01-15'}
          </p>
          <div className="flex items-center gap-6">
            <a 
              href="https://github.com/codexu/note-gen/releases" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-500 hover:text-amber-500 transition-colors flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              All Releases
            </a>
            <a 
              href="https://novaflow.sh/docs" 
              className="text-sm text-zinc-500 hover:text-amber-500 transition-colors flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Documentation
            </a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}