import CreatePersonaForm from "@/components/create-persona-form"
import { auth } from "@/server/auth"
import { db } from "@/server/db"
import { personas } from "@/server/db/schema"
import { eq, and } from "drizzle-orm"
import Link from "next/link"

export const runtime = "edge"

export default async function PersonaPageEdit({ params }: { params: { persona_id: string } }) {
    const session = await auth()

    if (!session?.user) {
        return <div>Unauthorized to edit persona</div>
    }

    // Fetch the persona from the database
    const persona = await db.query.personas.findFirst({
        where: and(
            eq(personas.id, params.persona_id),
            eq(personas.userId, session.user.id!)
        ),
    })

    // Check if the persona exists and belongs to the current user
    if (!persona) {
        return <div>Persona not found or you don{"'"}t have permission to edit it.</div>
    }

    return (
        <div className="bg-neutral-900 text-white p-4 max-w-md mx-auto mb-24">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold">Persona Edit</h1>
                <Link className="text-neutral-400" href={"/profile/persona"}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </Link>
            </div>

            <CreatePersonaForm persona={persona} edit={true} />
        </div>

    )
}