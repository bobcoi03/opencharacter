import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

export const runtime = "edge"

export const metadata: Metadata = {
    title: 'Future of OpenCharacter',
    description: 'Open source, uncensored, maximum customizability alternative to c.ai',
    openGraph: {
        title: 'Future of OpenCharacter',
        description: 'Open source, uncensored, maximum customizability alternative to c.ai',
        images: [{ url: 'https://opencharacter.org/c.ai-preview.png' }],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Future of OpenCharacter',
        description: 'Open source, uncensored, maximum customizability alternative to c.ai',
        images: ['https://opencharacter.org/c.ai-preview.png'],
        creator: '@justwrapapi',
    },
};

export default function FutureofProject() {
    return (
        <div className="md:ml-16 bg-neutral-900 text-white p-6 rounded-lg mx-auto flex flex-col gap-12 mb-24">
            <div className='gap-6 flex flex-col text-center mx-auto'>
                <p className="text-xs mb-4 text-center">Published on 24 October, 2024</p>
                <h1 className="text-5xl mb-6 text-center max-w-4xl">Future of OpenCharacter</h1>
                <p className='text-sm'>open source, uncensored, maximum customizability alternative to c.ai</p>
            </div>

            <div className="w-full mx-auto flex flex-col items-center max-w-2xl gap-8">
                <p className='text-sm leading-7'>
                    In this writing I want to outline where I think this project is going and how I plan to grow it a sustainable manner. 
                    First a bit of background on the project, I started this project mainly for two reasons.
                </p>

                <div className="border-l-4 border-black pl-6 my-8">
                    <p className="text-xl font-serif">I wanted to create something truly open and uncensored for the AI community</p>
                </div>

                <p className='text-sm leading-7'>
                    First I really wanted to try out{" "}
                    <Link href={"x.com/@DhravyaShah"} className="underline text-blue-400" target='_blank'>
                        DhravyaShah{"'"}s Cloudflare Stack{" "}
                    </Link>
                    I was building a lot with Backend as a service providers and wanted to try something new. Secondly, I saw on Reddit r/CharacterAI shutting down the 
                    old site and users constantly complaining about the filters and censorship.
                </p>

                <div className="border-l-4 border-black pl-6 my-8">
                    <p className="text-xl font-serif">The community needs a platform free from external pressures and limitations</p>
                </div>

                <p className='text-sm leading-7'>
                    They even made multiple subreddits (with 10K+ users) to rebel against the new rules. I then looked around and saw their was a lot of alternatives 
                    that built a nice UI and monetized very early, so low rate limits, ads, bombarding users with subscriptions or it was VC funded projects that just 
                    maxed out on user growth with no paid plans and there was no open source project.
                </p>

                <ul className='list-disc pl-8 text-sm leading-7 space-y-2'>
                    <li>Make it profitable so don{"'"}t have to compromise on censorship, filters pressures from external groups (investors, payment providers, etc)</li>
                    <li>Create hyper-efficient marketplace for AI applications</li>
                    <li>Bring in every prominent AI API/service to the platform and give creators all the tools and freedoms to create whatever they want</li>
                </ul>

                <p className='list-dic pl-8 text-sm-leading-7 space-y-2 text-start'>
                    Should be extremely easy.
                </p>

                <p className="mt-4 text-sm italic text-gray-400 text-center">
                    &ldquo;The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion.&rdquo;
                    <br />
                    &mdash; Albert Camus
                </p>
            </div>
        </div>
    )
}