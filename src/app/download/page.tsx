'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Apple,
  Monitor,
  Smartphone,
  Download,
  PenLine,
  Github,
  Menu,
  X,
  ArrowRight,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/theme-toggle'

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
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

export default function DownloadPage() {
  const [platform, setPlatform] = useState<'mac' | 'windows' | 'linux' | null>(null)
  const [release, setRelease] = useState<ReleaseInfo | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('mac')) setPlatform('mac')
    else if (userAgent.includes('win')) setPlatform('windows')
    else if (userAgent.includes('linux')) setPlatform('linux')

    fetch('https://api.github.com/repos/drewsephski/NovaFlow/releases/latest')
      .then((res) => res.json())
      .then((data) => {
        setRelease({
          version: data.tag_name.replace('v', ''),
          published_at: new Date(data.published_at).toLocaleDateString(),
        })
      })
      .catch(() => {
        setRelease({ version: '0.27.7', published_at: '2024-01-15' })
      })
  }, [])

  const baseUrl = 'https://github.com/drewsephski/NovaFlow/releases/latest/download'
  const version = release?.version || '0.27.7'

  const allDownloads: PlatformDownload[] = [
    {
      name: 'macOS Apple Silicon',
      icon: <Apple className="h-5 w-5" strokeWidth={1.5} />,
      extension: 'DMG',
      url: `${baseUrl}/NovaFlow_${version}_aarch64.dmg`,
      size: '25 MB',
    },
    {
      name: 'macOS Intel',
      icon: <Apple className="h-5 w-5" strokeWidth={1.5} />,
      extension: 'DMG',
      url: `${baseUrl}/NovaFlow_${version}_x64.dmg`,
      size: '28 MB',
    },
    {
      name: 'Windows x64',
      icon: <Monitor className="h-5 w-5" strokeWidth={1.5} />,
      extension: 'EXE',
      url: `${baseUrl}/NovaFlow_${version}_x64-setup.exe`,
      size: '32 MB',
    },
    {
      name: 'Linux AppImage',
      icon: <Monitor className="h-5 w-5" strokeWidth={1.5} />,
      extension: 'AppImage',
      url: `${baseUrl}/NovaFlow_${version}_amd64.AppImage`,
      size: '35 MB',
    },
    {
      name: 'Linux DEB',
      icon: <Monitor className="h-5 w-5" strokeWidth={1.5} />,
      extension: 'deb',
      url: `${baseUrl}/NovaFlow_${version}_amd64.deb`,
      size: '30 MB',
    },
    {
      name: 'Android Universal',
      icon: <Smartphone className="h-5 w-5" strokeWidth={1.5} />,
      extension: 'APK',
      url: `${baseUrl}/NovaFlow_${version}_android-universal.apk`,
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
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-muted selection:text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <PenLine className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
              <Link href="/" className="font-serif text-lg font-medium tracking-tight text-foreground">NovaFlow</Link>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                Home
              </Link>
              <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                Documentation
              </Link>
              <Link href="/download" className="text-sm text-foreground font-medium">
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
            <ThemeToggle />

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
              <Link href="/" className="block py-2 text-sm text-muted-foreground hover:text-foreground">
                Home
              </Link>
              <Link href="/docs" className="block py-2 text-sm text-muted-foreground hover:text-foreground">
                Documentation
              </Link>
              <Link href="/download" className="block py-2 text-sm font-medium text-foreground">
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

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 pt-32 pb-20 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={fadeIn} className="mb-8">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              <span className="h-px w-4 bg-border"></span>
              v{release?.version || '0.27.7'} Available
            </span>
          </motion.div>

          <motion.div variants={fadeIn} className="max-w-2xl mb-16">
            <h1 className="font-serif text-5xl sm:text-6xl font-medium tracking-tight text-foreground leading-[1.1] mb-6">
              Download <span className="italic text-muted-foreground">NovaFlow</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Available for macOS, Windows, Linux, and Android.
              Lightweight, fast, and free forever.
            </p>
          </motion.div>

          {/* Primary Download */}
          <motion.div variants={fadeIn} className="mb-12">
            <div className="bg-muted/50 p-8 sm:p-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center text-muted-foreground">
                    {primaryDownload.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Detected Platform</p>
                    <h2 className="font-serif text-2xl font-medium text-foreground">{primaryDownload.name}</h2>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium"
                  onClick={() => window.open(primaryDownload.url, '_blank')}
                >
                  <Download className="mr-2 h-4 w-4" strokeWidth={1.5} />
                  Download .{primaryDownload.extension}
                </Button>
              </div>

              <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground border-t border-border pt-4">
                <span>{primaryDownload.size}</span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Unsigned — see note below
                </span>
                <span>Auto-updates</span>
              </div>
            </div>
          </motion.div>

          {/* macOS First Time Note */}
          {platform === 'mac' && (
            <motion.div variants={fadeIn} className="mb-8 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-2">First time on macOS?</h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                    macOS may show a security warning when opening NovaFlow for the first time because the app is not yet notarized by Apple.
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">To open the app:</p>
                  <ol className="text-sm text-amber-800 dark:text-amber-200 list-decimal list-inside mt-1 space-y-1">
                    <li>Right-click (or Control+click) the NovaFlow app</li>
                    <li>Select &quot;Open&quot; from the menu</li>
                    <li>Click &quot;Open&quot; in the dialog that appears</li>
                  </ol>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-3">
                    Alternatively: Go to System Settings → Privacy & Security → Security → click &quot;Allow Anyway&quot;
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* All Platforms */}
          <motion.div variants={fadeIn}>
            <div className="mb-6">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                All Platforms
              </span>
            </div>

            <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
              {allDownloads.map((download) => (
                <button
                  key={download.name}
                  onClick={() => window.open(download.url, '_blank')}
                  className="group bg-background p-6 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                        {download.icon}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{download.name}</p>
                        <p className="text-xs text-muted-foreground">{download.size} · {download.extension}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-border group-hover:text-muted-foreground group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Release Info */}
          <motion.div variants={fadeIn} className="mt-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-border pt-8">
            <p className="text-sm text-muted-foreground">
              Released {release?.published_at || '2024-01-15'}
            </p>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/drewsephski/NovaFlow/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                <Github className="h-4 w-4" strokeWidth={1.5} />
                All Releases
              </a>
              <Link
                href="/docs"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" strokeWidth={1.5} />
                Documentation
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
