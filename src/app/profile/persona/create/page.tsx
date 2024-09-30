import React from 'react';
import Link from 'next/link';
import { auth } from '@/server/auth';
import CreatePersonaForm from '@/components/create-persona-form';

export const runtime = "edge";

export default async function CreatePersonaPage() {
    const session = await auth()

    if (!session?.user) {
        return <div>Unathorized to create persona</div>
    }

    return (
        <div className="bg-neutral-900 text-white p-4 max-w-md mx-auto mb-24">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold">Persona</h1>
                <Link className="text-neutral-400" href={"/profile/persona"}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </Link>
            </div>

            <CreatePersonaForm />

        </div>
    );
}