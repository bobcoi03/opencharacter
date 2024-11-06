CREATE TABLE `social_submission` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`text` text NOT NULL,
	`message` text,
	`createdAt` integer NOT NULL
);
