CREATE TABLE `cuttingRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(32) NOT NULL,
	`cutValue` decimal(10,2) NOT NULL,
	`saleValue` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cuttingRules_id` PRIMARY KEY(`id`),
	CONSTRAINT `cutting_rules_category_cut_unique` UNIQUE(`category`,`cutValue`)
);
--> statement-breakpoint
CREATE TABLE `legacyImportRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceTable` varchar(100) NOT NULL,
	`sourceHash` varchar(64) NOT NULL,
	`recordType` varchar(64) NOT NULL,
	`legacyCode` varchar(100),
	`payload` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `legacyImportRecords_id` PRIMARY KEY(`id`),
	CONSTRAINT `legacy_import_source_hash_unique` UNIQUE(`sourceTable`,`sourceHash`)
);
