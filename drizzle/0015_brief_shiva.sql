CREATE TABLE `user_daily_requests` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
