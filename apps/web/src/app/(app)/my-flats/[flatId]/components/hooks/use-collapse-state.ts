import { useState, useCallback } from 'react'
import type { CollapseState, CollapseBlockName } from '../types/flat-form.types'

/**
 * Hook for managing collapse state of blocks
 */
export const useCollapseState = (initialState?: Partial<CollapseState>) => {
  const [isBlocksCollapsed, setIsBlocksCollapsed] = useState<CollapseState>({
    flatAds: false,      // Объявления по этой квартире
    houseAds: false,     // Объявления по этому дому
    nearbyAds: false,    // Объявления в радиусе 500м
    comparison: false,   // Сравнение квартир
    ...initialState
  })

  const toggleBlock = useCallback((blockName: CollapseBlockName) => {
    setIsBlocksCollapsed(prev => ({
      ...prev,
      [blockName]: !prev[blockName]
    }))
  }, [])

  const collapseBlock = useCallback((blockName: CollapseBlockName) => {
    setIsBlocksCollapsed(prev => ({
      ...prev,
      [blockName]: true
    }))
  }, [])

  const expandBlock = useCallback((blockName: CollapseBlockName) => {
    setIsBlocksCollapsed(prev => ({
      ...prev,
      [blockName]: false
    }))
  }, [])

  const collapseAll = useCallback(() => {
    setIsBlocksCollapsed({
      flatAds: true,
      houseAds: true,
      nearbyAds: true,
      comparison: true
    })
  }, [])

  const expandAll = useCallback(() => {
    setIsBlocksCollapsed({
      flatAds: false,
      houseAds: false,
      nearbyAds: false,
      comparison: false
    })
  }, [])

  const isCollapsed = useCallback((blockName: CollapseBlockName): boolean => {
    return isBlocksCollapsed[blockName]
  }, [isBlocksCollapsed])

  const isExpanded = useCallback((blockName: CollapseBlockName): boolean => {
    return !isBlocksCollapsed[blockName]
  }, [isBlocksCollapsed])

  return {
    isBlocksCollapsed,
    toggleBlock,
    collapseBlock,
    expandBlock,
    collapseAll,
    expandAll,
    isCollapsed,
    isExpanded
  }
}