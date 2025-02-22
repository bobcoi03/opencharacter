CREATE TABLE `twitter_roast` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`roastContent` text NOT NULL,
	`userId` text,
	`likeCount` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `twitter_roast_username_idx` ON `twitter_roast` (`username`);--> statement-breakpoint
CREATE INDEX `twitter_roast_user_id_idx` ON `twitter_roast` (`userId`);