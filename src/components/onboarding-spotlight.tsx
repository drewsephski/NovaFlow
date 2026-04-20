'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, Lightbulb } from 'lucide-react'
import { getSpotlightTooltipPosition, type SpotlightRect } from './onboarding-spotlight-position'

interface OnboardingSpotlightProps {
  targetId: string | null
  title: string
  description: string
  onDismiss: () => void
}

function measureTarget(targetId: string): SpotlightRect | null {
  const element = document.getElementById(targetId)
  if (!element) {
    return null
  }

  const rect = element.getBoundingClientRect()
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}

export function OnboardingSpotlight({
  targetId,
  title,
  description,
  onDismiss,
}: OnboardingSpotlightProps) {
  const [rect, setRect] = useState<SpotlightRect | null>(null)

  useEffect(() => {
    if (!targetId) {
      setRect(null)
      return
    }

    const update = () => {
      setRect(measureTarget(targetId))
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    const intervalId = window.setInterval(update, 250)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      window.clearInterval(intervalId)
    }
  }, [targetId])

  if (!rect) {
    return null
  }

  const tooltipWidth = 320
  const tooltipHeight = 140
  const { top: tooltipTop, left: tooltipLeft, placement } = getSpotlightTooltipPosition({
    rect,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    tooltipWidth,
    tooltipHeight,
  })
  const holeTop = Math.max(0, rect.top - 12)
  const holeLeft = Math.max(0, rect.left - 12)
  const holeWidth = rect.width + 24
  const holeHeight = rect.height + 24

  // Calculate arrow position based on placement
  const getArrowStyles = () => {
    const arrowSize = 8
    switch (placement) {
      case 'bottom':
        return {
          top: -arrowSize,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid white`,
        }
      case 'top':
        return {
          bottom: -arrowSize,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderTop: `${arrowSize}px solid white`,
        }
      case 'left':
        return {
          right: -arrowSize,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderLeft: `${arrowSize}px solid white`,
        }
      case 'right':
        return {
          left: -arrowSize,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid white`,
        }
      default:
        return {}
    }
  }

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[10010]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onDismiss}
      >
        {/* Backdrop with animated pulse */}
        <motion.div
          className="absolute inset-0 bg-stone-950/40 dark:bg-stone-950/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Spotlight hole with animated border */}
        <motion.div
          className="absolute rounded-2xl border-2 border-amber-500 shadow-lg shadow-amber-500/20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            top: holeTop,
            left: holeLeft,
            width: holeWidth,
            height: holeHeight,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.5), 0 0 30px rgba(245, 158, 11, 0.3)',
          }}
        >
          {/* Animated pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-amber-400/50"
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
        
        {/* Tooltip */}
        <motion.div
          className="absolute"
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            top: tooltipTop,
            left: tooltipLeft,
            width: tooltipWidth,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-xl overflow-hidden">
            {/* Arrow */}
            <div 
              className="absolute w-0 h-0"
              style={getArrowStyles()}
            />
            
            {/* Header with gradient */}
            <div className="relative px-4 py-3 bg-gradient-to-r from-amber-50 to-white dark:from-amber-900/20 dark:to-stone-900 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{title}</p>
              </div>
              <button
                onClick={onDismiss}
                className="absolute right-3 top-3 p-1 rounded-md text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="px-4 py-3">
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{description}</p>
              
              {/* Hint footer */}
              <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  Click anywhere to dismiss
                </span>
                <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <span>Next</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
