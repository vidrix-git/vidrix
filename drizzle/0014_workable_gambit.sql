CREATE TABLE `brandSettings` (
	`id` int NOT NULL,
	`displayName` varchar(120) NOT NULL,
	`legalName` varchar(255),
	`tagline` varchar(255),
	`logoUrl` varchar(2048),
	`primaryColor` varchar(7) NOT NULL DEFAULT '#0f766e',
	`phone` varchar(64),
	`email` varchar(320),
	`address` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brandSettings_id` PRIMARY KEY(`id`)
);
