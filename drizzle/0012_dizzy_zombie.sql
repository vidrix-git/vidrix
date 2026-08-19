CREATE TABLE `productTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productTypes_id` PRIMARY KEY(`id`),
	CONSTRAINT `productTypes_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `clients` ADD `addressNumber` varchar(32);--> statement-breakpoint
ALTER TABLE `clients` ADD `addressComplement` varchar(255);