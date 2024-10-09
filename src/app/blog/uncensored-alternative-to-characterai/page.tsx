import React from 'react';

export const runtime = "edge"

export default function UncensoredAlternativeBlogPage() {
    return (
        <div className="md:ml-16 bg-neutral-900 text-white p-6 rounded-lg mx-auto flex flex-col gap-12 mb-24">

            <div className='gap-6 flex flex-col text-center mx-auto'>
                <p className="text-xs mb-4 text-center">Published on October 9th, 2024</p>
                <h1 className="text-5xl mb-6 text-center max-w-4xl">Introducing OpenCharacter</h1>
                <p className='text-sm'>open source, uncensored, maximum customizability alternative to c.ai</p>
            </div>

            <div className="w-full mx-auto flex flex-col items-center">
                <video 
                    className="w-full rounded-lg max-h-[70vh] max-w-4xl mx-auto border" 
                    controls
                    preload="metadata"
                >
                    <source src="https://random-stuff-everythingcompany.s3.us-west-1.amazonaws.com/opencharacter_short.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <p className="mt-4 text-sm italic text-center max-w-2xl">
                &mdash; The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion. &mdash; Albert Camus                </p>
            </div>
        </div>
    )
}