"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface HeaderAction {
  label: string
  onClick: () => void
}

interface HeaderActionsContextType {
  actions: HeaderAction[]
  setActions: (actions: HeaderAction[]) => void
  clearActions: () => void
}

const HeaderActionsContext = createContext<HeaderActionsContextType | undefined>(undefined)

export function HeaderActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActionsState] = useState<HeaderAction[]>([])

  const setActions = useCallback((newActions: HeaderAction[]) => {
    setActionsState(newActions)
  }, [])

  const clearActions = useCallback(() => {
    setActionsState([])
  }, [])

  return (
    <HeaderActionsContext.Provider value={{ actions, setActions, clearActions }}>
      {children}
    </HeaderActionsContext.Provider>
  )
}

export function useHeaderActions() {
  const context = useContext(HeaderActionsContext)
  if (context === undefined) {
    throw new Error("useHeaderActions must be used within a HeaderActionsProvider")
  }
  return context
}
