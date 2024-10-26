import { auth } from "@/server/auth"
import { sql } from "drizzle-orm"
import { chat_sessions, users } from "@/server/db/schema"
import { MessageCircle } from "lucide-react"
import ProfileNav from "@/components/profile-nav"
import SettingsButton from "@/components/user-settings-button"
import { db } from "@/server/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type User = typeof users.$inferSelect;

export const runtime = "edge"

export default async function ProfileLayout({ children, params }: { children: React.ReactNode, params: { user_id: string } }) {
    const session = await auth()

    if (!session?.user) {
        return <div className="flex justify-center items-center h-screen">Please sign in to view your profile.</div>
    }

    const userId = session.user.id;

    // Fetch the user from the database
    const user: User | undefined = await db
        .select()
        .from(users)
        .where(sql`${users.id} = ${userId}`)
        .get();

    if (!user) {
        return <div className="flex justify-center items-center h-screen">User not found.</div>
    }

    const chatCount = await db
    .select({
        totalInteractions: sql<number>`sum(${chat_sessions.interaction_count})`
    })
    .from(chat_sessions)
    .where(sql`${chat_sessions.user_id} = ${userId}`)
    .get();

    const chatCountDisplay = chatCount?.totalInteractions ?? 0;

    return (
        <div className="flex justify-center bg-neutral-900">
            <div className="bg-neutral-900 text-white p-4 w-full max-w-lg">
                <div className="flex flex-col items-center mb-6 gap-2">
                    <div className="w-32 h-32 rounded-md overflow-hidden mb-2">
                        <img
                            src={user.image ?? '/default-avatar.jpg'}
                            alt={user.name ?? 'User'}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <h1 className="text-xl font-bold mb-1">{user.name ?? 'User'}</h1>
                    <p>{user.bio}</p>
                    <p className="text-sm text-neutral-400 mb-2">
                    <MessageCircle className="inline w-4 h-4 mr-1" /> {chatCountDisplay} Chats
                    </p>
                    <div className="flex flex-row gap-2">
                        <SettingsButton user={user} />
                        <Link href={`/public-profile/${user.id}`}>
                            <Button variant="outline" className="rounded-full bg-neutral-800">
                                Public Profile
                            </Button>
                        </Link>
                    </div>
                </div>
        
                <ProfileNav />
        
                {children}
            </div>
        </div>
    );
}