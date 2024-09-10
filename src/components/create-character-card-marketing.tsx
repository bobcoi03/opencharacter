import { SparklesIcon } from 'lucide-react'
import Link from 'next/link'

export default function CreateCharacterCardMarketing() {
  return (
    <div className="text-white flex items-center justify-center p-4 mt-16">
      <div className="relative w-full max-w-md">
        {/* Sound wave icons */}
        <div className="absolute left-0 top-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
            <path d="M12 3V21M8 6V18M16 6V18M4 9V15M20 9V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="absolute left-8 top-8">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
            <path d="M12 3V21M8 6V18M16 6V18M4 9V15M20 9V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="absolute right-0 bottom-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
            <path d="M12 3V21M8 6V18M16 6V18M4 9V15M20 9V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Overlapping images */}
        <div className="relative w-full h-64">
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
            <img
              src="/zeus-demo.webp"
              alt="Main Character"
              width="200"
              height="200"
              className="rounded-2xl shadow-lg"
            />
          </div>
          <div className="absolute left-1/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <img
              src="/andy-demo.webp"
              alt="Left Character"
              width="160"
              height="160"
              className="rounded-2xl shadow-lg opacity-75"
            />
          </div>
          <div className="absolute right-1/4 top-1/2 transform translate-x-1/2 -translate-y-1/2 z-10">
            <img
              src="/queen-demo.webp"
              alt="Right Character"
              width="160"
              height="160"
              className="rounded-2xl shadow-lg opacity-75"
            />
          </div>
        </div>

        {/* Main content */}
        <div className="text-center">
          <h2 className="text-2xl text-black dark:text-white">Create a Character</h2>
          <p className="text-gray-400 mt-4 font-light text-xs">
            Not vibing with any Characters? Create one of your own! Customize things like their conversation starts, their tone, and more!
          </p>
          <Link href="/new" className="mt-4 bg-gray-900 dark:bg-white dark:text-black text-white py-2 px-12 rounded-full inline-flex items-center hover:bg-gray-600 transition-colors">
            <SparklesIcon className="w-5 h-5 mr-2" />
            Create
          </Link>
        </div>
      </div>
    </div>
  )
}