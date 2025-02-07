CREATE TABLE `stripe_customer_id` (
	`userId` text PRIMARY KEY NOT NULL,
	`stripeCustomerId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`stripeCustomerId` text NOT NULL,
	`stripeSubscriptionId` text NOT NULL,
	`stripePriceId` text NOT NULL,
	`stripeCurrentPeriodStart` integer NOT NULL,
	`stripeCurrentPeriodEnd` integer NOT NULL,
	`status` text NOT NULL,
	`planType` text NOT NULL,
	`cancelAtPeriodEnd` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stripe_customer_id_stripeCustomerId_unique` ON `stripe_customer_id` (`stripeCustomerId`);--> statement-breakpoint
CREATE INDEX `subscription_user_id_idx` ON `subscription` (`userId`);--> statement-breakpoint
CREATE INDEX `subscription_stripe_customer_id_idx` ON `subscription` (`stripeCustomerId`);--> statement-breakpoint
CREATE INDEX `subscription_stripe_subscription_id_idx` ON `subscription` (`stripeSubscriptionId`);