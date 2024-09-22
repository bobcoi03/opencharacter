CREATE TABLE `group_chat_session_characters` (
	`id` text PRIMARY KEY NOT NULL,
	`sessionId` text NOT NULL,
	`characterId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`sessionId`) REFERENCES `group_chat_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`characterId`) REFERENCES `character`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `group_chat_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`roomId` text NOT NULL,
	`userId` text NOT NULL,
	`messages` text DEFAULT '[]' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`roomId`) REFERENCES `room`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `room_characters` (
	`id` text PRIMARY KEY NOT NULL,
	`roomId` text NOT NULL,
	`characterId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`roomId`) REFERENCES `room`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`characterId`) REFERENCES `character`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `room` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`topic` text,
	`visibility` text DEFAULT 'public' NOT NULL,
	`userId` text NOT NULL,
	`interactionCount` integer DEFAULT 0 NOT NULL,
	`likeCount` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
