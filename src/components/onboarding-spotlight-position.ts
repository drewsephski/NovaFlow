export interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

export function getSpotlightTooltipPosition({
  rect,
  viewportWidth,
  viewportHeight,
  tooltipWidth,
  tooltipHeight,
}: {
  rect: SpotlightRect
  viewportWidth: number
  viewportHeight: number
  tooltipWidth: number
  tooltipHeight: number
}): { top: number; left: number; placement: TooltipPlacement } {
  // Calculate preferred positions
  const canFitTop = rect.top - tooltipHeight - 16 >= 16
  const canFitBottom = rect.top + rect.height + tooltipHeight + 16 <= viewportHeight
  const canFitLeft = rect.left - tooltipWidth - 16 >= 16
  const canFitRight = rect.left + rect.width + tooltipWidth + 16 <= viewportWidth
  
  // Determine placement priority: top > bottom > right > left
  let placement: TooltipPlacement = 'top'
  let top = 0
  let left = 0
  
  if (canFitTop) {
    placement = 'top'
    top = rect.top - tooltipHeight - 16
  } else if (canFitBottom) {
    placement = 'bottom'
    top = rect.top + rect.height + 16
  } else {
    // Center vertically if neither top nor bottom fits well
    placement = 'bottom'
    top = Math.min(rect.top + rect.height + 16, viewportHeight - tooltipHeight - 16)
  }
  
  // Center horizontally relative to the target
  left = rect.left + rect.width / 2 - tooltipWidth / 2
  
  // If centered position goes off-screen, try left or right placement
  if (left < 16) {
    if (canFitRight) {
      placement = 'right'
      left = rect.left + rect.width + 16
      top = Math.min(Math.max(16, rect.top + rect.height / 2 - tooltipHeight / 2), viewportHeight - tooltipHeight - 16)
    } else {
      left = 16
    }
  } else if (left + tooltipWidth > viewportWidth - 16) {
    if (canFitLeft) {
      placement = 'left'
      left = rect.left - tooltipWidth - 16
      top = Math.min(Math.max(16, rect.top + rect.height / 2 - tooltipHeight / 2), viewportHeight - tooltipHeight - 16)
    } else {
      left = viewportWidth - tooltipWidth - 16
    }
  }
  
  return { top, left, placement }
}
