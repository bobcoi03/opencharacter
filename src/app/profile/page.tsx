export const runtime = "edge"
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    redirect("/profile/characters")

    return (
        <div>
            

        </div>
    );
}