CREATE TABLE `referral` (
	`id` text PRIMARY KEY NOT NULL,
	`referrer_id` text NOT NULL,
	`referred_id` text NOT NULL,
	`signup_date` integer NOT NULL,
	`attribution_expires` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`pro_conversion_date` integer,
	`total_earnings` real DEFAULT 0 NOT NULL,
	`last_payment_date` integer,
	`last_payment_amount` real,
	`last_payment_status` text,
	`payment_history` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`referrer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`referred_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `user` ADD `referral_link` text;--> statement-breakpoint
ALTER TABLE `user` ADD `paypal_email` text;--> statement-breakpoint
CREATE INDEX `referral_referrer_idx` ON `referral` (`referrer_id`);--> statement-breakpoint
CREATE INDEX `referral_referred_idx` ON `referral` (`referred_id`);--> statement-breakpoint
CREATE INDEX `unique_referral_idx` ON `referral` (`referrer_id`,`referred_id`);