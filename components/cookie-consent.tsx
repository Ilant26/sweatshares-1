"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        // Mark that we're on the client side
        setIsClient(true)
        
        // Check if user has already made a choice
        const hasConsented = localStorage.getItem('cookie-consent')
        if (!hasConsented) {
            setIsVisible(true)
        }
    }, [])

    const handleAccept = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('cookie-consent', 'accepted')
        }
        setIsVisible(false)
    }

    const handleDecline = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('cookie-consent', 'declined')
        }
        setIsVisible(false)
    }

    const handleClose = () => {
        setIsVisible(false)
    }

    // Don't render anything until we're on the client side
    if (!isClient || !isVisible) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-t border-border shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                    <span className="text-primary text-sm font-semibold">🍪</span>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                    Accept cookies on this browser?
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                    We use cookies and similar technologies to provide, improve, protect, and analyze our services. 
                                    Essential cookies are necessary for our site to function properly. By selecting "Accept All", 
                                    you allow us to use optional cookies for additional purposes like measuring ad effectiveness 
                                    and relevance. Learn more in our{' '}
                                    <a 
                                        href="/legal/cookies" 
                                        className="text-primary hover:underline"
                                    >
                                        Cookie Settings
                                    </a>.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDecline}
                            className="text-xs px-3 py-1.5"
                        >
                            Decline Optional
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleAccept}
                            className="text-xs px-3 py-1.5"
                        >
                            Accept All
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                            className="text-xs p-1.5"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
} 