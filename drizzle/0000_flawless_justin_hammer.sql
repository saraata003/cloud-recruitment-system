CREATE TABLE `candidate_tags` (
	`candidate_id` text NOT NULL,
	`tag_id` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`candidate_id`, `tag_id`),
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`photo_url` text,
	`phone` text NOT NULL,
	`phone_normalized` text NOT NULL,
	`location` text NOT NULL,
	`date_of_birth` text,
	`age` integer,
	`position` text NOT NULL,
	`other_position_text` text,
	`preferred_branch` text NOT NULL,
	`employment_type` text NOT NULL,
	`university` text,
	`major` text,
	`previous_experience` text,
	`last_job` text,
	`years_of_experience` real,
	`available_from` text,
	`has_transportation` integer DEFAULT false NOT NULL,
	`cv_url` text,
	`cv_file_name` text,
	`applicant_notes` text,
	`stage` text DEFAULT 'NEW' NOT NULL,
	`ai_summary` text,
	`ai_key_points` text,
	`ai_generated_at` text,
	`ai_provider` text,
	`is_duplicate` integer DEFAULT false NOT NULL,
	`duplicate_alert_seen` integer DEFAULT false NOT NULL,
	`reapplication_count` integer DEFAULT 0 NOT NULL,
	`previous_snapshots` text,
	`source` text DEFAULT 'PUBLIC_FORM' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`hired_at` text
);
--> statement-breakpoint
CREATE TABLE `interviews` (
	`id` text PRIMARY KEY NOT NULL,
	`candidate_id` text NOT NULL,
	`round` integer DEFAULT 1 NOT NULL,
	`scheduled_at` text,
	`ai_questions` text,
	`notes` text,
	`rating_communication` integer,
	`rating_experience` integer,
	`rating_availability` integer,
	`rating_attitude` integer,
	`rating_location` integer,
	`outcome` text,
	`ai_interview_summary` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`candidate_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`candidate_id` text NOT NULL,
	`from_stage` text,
	`to_stage` text NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);