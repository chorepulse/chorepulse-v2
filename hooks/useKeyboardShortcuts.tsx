'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean // Command on Mac
  description: string
  action: () => void
  category?: string
}

/**
 * Keyboard Shortcuts Hook
 *
 * Provides global keyboard shortcuts for common actions.
 * Press '?' to show the shortcuts help modal.
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const [showHelp, setShowHelp] = useState(false)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Exception: Allow '?' to show help even in inputs
        if (event.key === '?') {
          setShowHelp(true)
          event.preventDefault()
        }
        return
      }

      // Find matching shortcut
      const matchedShortcut = shortcuts.find((shortcut) => {
        const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase()
        const ctrlMatches = shortcut.ctrl === undefined || shortcut.ctrl === (event.ctrlKey || event.metaKey)
        const shiftMatches = shortcut.shift === undefined || shortcut.shift === event.shiftKey
        const altMatches = shortcut.alt === undefined || shortcut.alt === event.altKey
        const metaMatches = shortcut.meta === undefined || shortcut.meta === event.metaKey

        return keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches
      })

      if (matchedShortcut) {
        event.preventDefault()
        matchedShortcut.action()
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return { showHelp, setShowHelp }
}

/**
 * Global Keyboard Shortcuts Component
 * Add this to your root layout to enable shortcuts app-wide
 */
export function GlobalKeyboardShortcuts() {
  const router = useRouter()
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [showNewMemberModal, setShowNewMemberModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  const shortcuts: KeyboardShortcut[] = [
    // Navigation
    {
      key: 'h',
      description: 'Go to Home/Dashboard',
      action: () => router.push('/dashboard'),
      category: 'Navigation',
    },
    {
      key: 't',
      description: 'Go to Tasks',
      action: () => router.push('/tasks'),
      category: 'Navigation',
    },
    {
      key: 'r',
      description: 'Go to Rewards',
      action: () => router.push('/rewards'),
      category: 'Navigation',
    },
    {
      key: 'b',
      description: 'Go to Badges',
      action: () => router.push('/badges'),
      category: 'Navigation',
    },
    {
      key: 'c',
      description: 'Go to Calendar',
      action: () => router.push('/calendar'),
      category: 'Navigation',
    },

    // Quick Actions (Cmd/Ctrl + Key)
    {
      key: 'n',
      meta: true,
      description: 'Create New Task',
      action: () => setShowNewTaskModal(true),
      category: 'Quick Actions',
    },
    {
      key: 'm',
      meta: true,
      description: 'Add New Member',
      action: () => setShowNewMemberModal(true),
      category: 'Quick Actions',
    },
    {
      key: 'k',
      meta: true,
      description: 'Quick Search',
      action: () => {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
        if (searchInput) searchInput.focus()
      },
      category: 'Quick Actions',
    },

    // Help
    {
      key: '?',
      description: 'Show Keyboard Shortcuts',
      action: () => setShowHelpModal(true),
      category: 'Help',
    },
  ]

  const { showHelp, setShowHelp } = useKeyboardShortcuts(shortcuts)

  return (
    <>
      {/* Keyboard Shortcuts Help Modal */}
      {(showHelp || showHelpModal) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setShowHelp(false)
            setShowHelpModal(false)
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="shortcuts-title"
            aria-modal="true"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 id="shortcuts-title" className="text-2xl font-bold text-gray-900">
                  ⌨️ Keyboard Shortcuts
                </h2>
                <button
                  onClick={() => {
                    setShowHelp(false)
                    setShowHelpModal(false)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close keyboard shortcuts help"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Group shortcuts by category */}
              {Object.entries(
                shortcuts.reduce((acc, shortcut) => {
                  const category = shortcut.category || 'General'
                  if (!acc[category]) acc[category] = []
                  acc[category].push(shortcut)
                  return acc
                }, {} as Record<string, KeyboardShortcut[]>)
              ).map(([category, categoryShortcuts]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                      >
                        <span className="text-gray-700">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.meta && (
                            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
                              ⌘
                            </kbd>
                          )}
                          {shortcut.ctrl && (
                            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
                              Ctrl
                            </kbd>
                          )}
                          {shortcut.shift && (
                            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
                              Shift
                            </kbd>
                          )}
                          {shortcut.alt && (
                            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
                              Alt
                            </kbd>
                          )}
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
                            {shortcut.key.toUpperCase()}
                          </kbd>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">ESC</kbd> to close this dialog
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add event listener for ESC key to close modal */}
      {(showHelp || showHelpModal) && (
        <div
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowHelp(false)
              setShowHelpModal(false)
            }
          }}
          tabIndex={-1}
          className="sr-only"
        />
      )}
    </>
  )
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = []

  if (shortcut.meta) parts.push('⌘')
  if (shortcut.ctrl) parts.push('Ctrl')
  if (shortcut.shift) parts.push('Shift')
  if (shortcut.alt) parts.push('Alt')
  parts.push(shortcut.key.toUpperCase())

  return parts.join('+')
}
