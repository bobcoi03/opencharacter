'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

const ProfileNav = () => {
    const router = useRouter();
    const pathname = usePathname();

    const isActive = (path: string) => pathname.startsWith(path);

    const navigate = (path: string) => {
        router.push(path);
    };

    return (
        <div className="flex justify-center mb-4 border-b border-neutral-700 pb-2 gap-24">
            <button 
                className={`text-sm pb-2 px-2 transition-all duration-200 ease-in-out ${
                    isActive('/profile/characters') 
                        ? 'text-white border-b-2 border-white font-semibold' 
                        : 'text-neutral-400 hover:text-neutral-200'
                }`}
                onClick={() => navigate('/profile/characters')}
            >
                Characters
            </button>
            <button 
                className={`text-sm pb-2 px-2 transition-all duration-200 ease-in-out ${
                    isActive('/profile/persona') 
                        ? 'text-white border-b-2 border-white font-semibold' 
                        : 'text-neutral-400 hover:text-neutral-200'
                }`}
                onClick={() => navigate('/profile/persona')}
            >
                Personas
            </button>
        </div>
    );
};

export default ProfileNav;