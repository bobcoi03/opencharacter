/*
 SQLite does not support "Drop default from column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/

CREATE TABLE `user_daily_requests` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `date` text NOT NULL,
  `request_count` integer DEFAULT 0 NOT NULL,
  `created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
  `updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);