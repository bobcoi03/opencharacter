"use client"

import { characters } from "@/server/db/schema"
import Link from "next/link"
import Image from "next/image"

export default function CharacterAvatar({ character }: { character: typeof characters.$inferSelect }) {
    return (
        <Link
            className={`w-10 h-10 overflow-hidden mr-3 ml-6 ${localStorage.getItem('character_icon_style') === "circle" ? "rounded-full" : "rounded-md"} `}
            href={`/character/${character.id}/profile`}
        >
        <Image
          src={character.avatar_image_url ?? "/default-avatar.jpg"}
          alt={`${character.name}'s avatar`}
          width={40}
          height={40}
          className="object-cover w-full h-full"
        />
      </Link>
    )
}