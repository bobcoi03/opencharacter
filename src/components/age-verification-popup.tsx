'use client'

import React, { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface AgeVerificationPopupProps {
  user?: User | null;
}

const AgeVerificationPopup = ({ user }: AgeVerificationPopupProps) => {
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    // If user exists, set verification without showing dialog
    if (user) {
      localStorage.setItem('age-verification', 'true')
      return
    }

    // Otherwise check if user has already acknowledged
    const hasAcknowledged = localStorage.getItem('age-verification')
    if (!hasAcknowledged) {
      setShowDialog(true)
      // Add blur class to body when dialog shows
      document.body.classList.add('blur-screen')
    }
  }, [user])

  const handleAcknowledge = () => {
    localStorage.setItem('age-verification', 'true')
    setShowDialog(false)
    // Remove blur class when dialog closes
    document.body.classList.remove('blur-screen')
  }

  // Cleanup effect for when component unmounts or dialog closes
  useEffect(() => {
    // Add blur when dialog shows
    if (showDialog) {
      document.body.classList.add('blur-screen')
    } else {
      document.body.classList.remove('blur-screen')
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('blur-screen')
    }
  }, [showDialog])

  // Add styles to head
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      .blur-screen > *:not(.no-blur) {
        filter: blur(8px);
        transition: filter 0.3s ease-in-out;
      }
      
      /* Ensure the dialog itself isn't blurred */
      .no-blur {
        filter: none !important;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <AlertDialog open={showDialog}>
      {showDialog && <div className="fixed inset-0 bg-black/50 z-50" />} {/* Dark overlay */}
      <AlertDialogContent className="max-w-md z-50 no-blur">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">
            Hello, welcome to OpenCharacter!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            This site is only intended for users{' '}
            <span className="font-bold text-primary underline decoration-2">
              18 years of age or above
            </span>
            .
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={handleAcknowledge}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            I understand
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default AgeVerificationPopup