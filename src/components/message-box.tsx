"use client"

import { useState } from "react";
import { Cpu, Play, LoaderCircle, Loader } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import SignInButton from "./signin-button";

export default function MessageBox() {
    const [playing, setPlaying] = useState<boolean>(false);



    return (
        <div className="fixed bottom-0 left-0 right-0 py-4 pointer-events-none w-full max-w-full">
            <div className="max-w-2xl mx-auto w-full">
                <div className="mb-2 p-2 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200 text-sm pointer-events-auto flex justify-between items-center">
                    <p className="flex items-center">
                    <svg
                        className="w-4 h-4 mr-2 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                        />
                    </svg>
                    Failed to send message, please try again
                    </p>
                </div>
                <form
                    onSubmit={(e) => {
                    }}
                    className="pointer-events-auto flex items-center space-x-2 max-w-full px-2"
                >
                    <div className="relative flex-grow">
                    <div className="absolute inset-0 bg-gray-300 dark:bg-neutral-700 bg-opacity-20 dark:bg-opacity-20 backdrop-blur-md rounded-xl dark:border-neutral-700"></div>
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-20">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                            type="button"
                            className="bg-gray-200 dark:bg-neutral-600 rounded-full p-2 transition-opacity opacity-70 hover:opacity-100 focus:opacity-100 hover:cursor-pointer"
                            >
                            <Cpu className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="max-h-96 overflow-y-auto">
                            <div>
                                Menu
                            </div>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <textarea
                        placeholder={`Hey`}
                        className="w-full py-3 pl-14 pr-12 bg-transparent relative z-10 outline-none text-black dark:text-white text-lg rounded-xl resize-none overflow-hidden"
                        style={{
                        minHeight: "50px",
                        maxHeight: `400px`,
                        overflowY: "auto",
                        }}
                        rows={1}
                    />
                    <button
                        type="submit"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black dark:bg-white rounded-full p-2 z-20 transition-opacity opacity-70 hover:opacity-100 focus:opacity-100 hover:cursor-pointer"
                        disabled={false}
                    >
                        <svg
                        viewBox="0 0 24 24"
                        className="w-5 h-5 text-white dark:text-black"
                        fill="none"
                        stroke="currentColor"
                        >
                        <path
                            d="M5 12h14M12 5l7 7-7 7"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        </svg>
                    </button>
                    </div>

                    <div 
                        className="bg-blue-400 rounded-lg justify-center flex items-center hover:cursor-pointer"
                        style={{ height: "50px", width: "50px" }}
                        onClick={() => setPlaying(!playing)}
                    >
                        {!playing ?
                            <Play className="text-black"/>                        
                            :
                            <LoaderCircle className={`text-black ${playing ? 'animate-spin' : ''}`} />
                        }

                    </div>

                </form>

                <Dialog
                    open={false}
                    onOpenChange={() => false}
                >
                    <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sign in to continue</DialogTitle>
                    </DialogHeader>
                    <p>Please sign in to send messages and save your conversation.</p>
                    <SignInButton />
                    </DialogContent>
                </Dialog>

            </div>
        </div>
    )
}