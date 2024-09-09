import { ChevronLeft, Plus, Compass, Search, MessageCircle, MoreVertical, Mic, Send } from 'lucide-react';
import Image from 'next/image';

export const runtime = 'edge';

export default function Page({ params }: { params: { character_id: string } }) {
  return (
    <div className="flex h-screen bg-neutral-900 text-white">
      {/* Sidebar */}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-neutral-800 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <ChevronLeft className="w-6 h-6 mr-4" />
            <img src="https://i.pinimg.com/736x/73/71/38/7371388fa369bab119ff209e37699e7c.jpg" alt="Nanami Kento" width={40} height={40} className="rounded-full mr-3 w-12 h-12" />
            <div>
              <h2 className="font-bold">Nanami Kento</h2>
              <p className="text-sm text-gray-400">By @justwrapapi</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </button>
            <button className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col items-center mb-8">
            <img src="https://i.pinimg.com/736x/73/71/38/7371388fa369bab119ff209e37699e7c.jpg" alt="Nanami Kento" width={40} height={40} className="rounded-full mr-3 w-24 h-24" />
            <h3 className="font-bold text-lg">Nanami Kento</h3>
            <p className="text-sm text-gray-400">I work as Jujutsu Sorcerer</p>
            <p className="text-xs text-gray-500">By @justwrapapi</p>
          </div>
          <div className="bg-neutral-800 rounded-lg p-3 max-w-[70%] mb-4">
            <p className="text-sm">I am Nanami Kento, a Jujutsu Sorcerer from Tokyo Jujutsu High.</p>
          </div>
        </div>

        {/* Message Input */}
        <div className="border-t border-neutral-800 p-4">
          <div className="flex items-center bg-neutral-800 rounded-full">
            <input
              type="text"
              placeholder="Message Nanami Kento..."
              className="flex-1 bg-transparent py-3 px-4 outline-none text-sm"
            />
            <button className="p-2">
              <Mic className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-2 bg-blue-600 rounded-full mr-1">
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-center mt-2 text-gray-500">
            Remember: Everything Characters say is made up!
          </p>
        </div>
      </div>
    </div>
  );
}