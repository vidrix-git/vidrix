CREATE TABLE `commercialExtras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int,
	`orderId` int,
	`productId` int,
	`kind` enum('acessorio','massa','tarugo','moldura','montagem') NOT NULL,
	`description` varchar(255) NOT NULL,
	`unit` varchar(20) NOT NULL,
	`quantity` decimal(12,3) NOT NULL,
	`unitPrice` decimal(12,2) NOT NULL,
	`subtotal` decimal(12,2) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commercialExtras_id` PRIMARY KEY(`id`)
);
