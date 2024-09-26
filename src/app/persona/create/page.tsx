import React from 'react';
import { Clock, Repeat2 } from 'lucide-react';
import Link from 'next/link';

export const runtime = "edge";

export default function PersonaPage() {
    return (
        <div className="bg-neutral-900 text-white p-4 max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold">Persona</h1>
                <Link className="text-neutral-400" href={"/profile"}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </Link>
            </div>

            <div className="bg-neutral-800 rounded-lg p-4 mb-4">
                <div className="flex items-start mb-4">
                    <Clock className="w-6 h-6 mr-2 text-neutral-400" />
                    <p className="text-sm">Characters will remember your persona information to improve their conversations with you</p>
                </div>
                <div className="flex items-start">
                    <Repeat2 className="w-6 h-6 mr-2 text-neutral-400" />
                    <p className="text-sm">Create multiple personas to change your background info between chats</p>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Display Name</label>
                <div className="relative">
                    <input
                        type="text"
                        className="w-full bg-neutral-800 rounded-md py-2 px-3 text-white"
                        maxLength={20}
                    />
                    <div className="absolute right-3 top-2 text-neutral-400 text-sm">0/20</div>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Background</label>
                <div className="relative">
                    <textarea
                        className="w-full bg-neutral-800 rounded-md py-2 px-3 text-white resize-none"
                        rows={4}
                        maxLength={728}
                    ></textarea>
                    <div className="absolute right-3 bottom-2 text-neutral-400 text-sm">0/728</div>
                </div>
            </div>

            <div className="flex items-center mb-4">
                <input
                    type="checkbox"
                    id="defaultChat"
                    className="mr-2 bg-neutral-800 border-neutral-600 rounded"
                />
                <label htmlFor="defaultChat" className="text-sm">Make default for new chats</label>
            </div>

            <button className="w-full bg-neutral-700 text-white rounded-md py-2 font-medium">
                Save
            </button>
        </div>
    );
}