CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`cpfCnpj` varchar(20),
	`phone` varchar(20),
	`email` varchar(320),
	`address` text,
	`city` varchar(100),
	`state` varchar(2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`description` text,
	`width` decimal(10,2) NOT NULL DEFAULT '0.00',
	`height` decimal(10,2) NOT NULL DEFAULT '0.00',
	`quantity` int NOT NULL DEFAULT 1,
	`areaM2` decimal(10,4) NOT NULL DEFAULT '0.0000',
	`unitPrice` decimal(12,2) NOT NULL DEFAULT '0.00',
	`totalValue` decimal(12,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` varchar(50) NOT NULL,
	`clientId` int NOT NULL,
	`status` enum('approved','production','ready','delivered','cancelled') NOT NULL DEFAULT 'approved',
	`totalValue` decimal(14,2) NOT NULL DEFAULT '0.00',
	`quoteId` int,
	`notes` text,
	`createdBy` int,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100),
	`description` text,
	`unitPrice` decimal(12,2) NOT NULL DEFAULT '0.00',
	`unit` varchar(20) NOT NULL DEFAULT 'un',
	`stockQuantity` decimal(12,4) NOT NULL DEFAULT '0.0000',
	`minStock` decimal(12,4) NOT NULL DEFAULT '0.0000',
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchase_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`purchaseOrderId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` decimal(12,4) NOT NULL DEFAULT '0.0000',
	`unitPrice` decimal(12,2) NOT NULL DEFAULT '0.00',
	`totalValue` decimal(12,2) NOT NULL DEFAULT '0.00',
	`receivedQuantity` decimal(12,4) DEFAULT '0.0000',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `purchase_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` varchar(50) NOT NULL,
	`supplierId` int NOT NULL,
	`status` enum('pending','confirmed','received','cancelled') NOT NULL DEFAULT 'pending',
	`totalValue` decimal(14,2) NOT NULL DEFAULT '0.00',
	`notes` text,
	`createdBy` int,
	`receivedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchase_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quote_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int NOT NULL,
	`productId` int NOT NULL,
	`description` text,
	`width` decimal(10,2) NOT NULL DEFAULT '0.00',
	`height` decimal(10,2) NOT NULL DEFAULT '0.00',
	`quantity` int NOT NULL DEFAULT 1,
	`areaM2` decimal(10,4) NOT NULL DEFAULT '0.0000',
	`unitPrice` decimal(12,2) NOT NULL DEFAULT '0.00',
	`totalValue` decimal(12,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quote_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` varchar(50) NOT NULL,
	`clientId` int NOT NULL,
	`status` enum('draft','sent','approved','rejected','converted') NOT NULL DEFAULT 'draft',
	`totalValue` decimal(14,2) NOT NULL DEFAULT '0.00',
	`validUntil` varchar(10),
	`notes` text,
	`createdBy` int,
	`convertedOrderId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`type` enum('in','out') NOT NULL,
	`quantity` decimal(12,4) NOT NULL,
	`reason` varchar(255) NOT NULL,
	`referenceId` int,
	`referenceType` varchar(50),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplier_prices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`productId` int NOT NULL,
	`unitPrice` decimal(12,2) NOT NULL DEFAULT '0.00',
	`leadTimeDays` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplier_prices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`cnpj` varchar(20),
	`phone` varchar(20),
	`email` varchar(320),
	`address` text,
	`contact` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('admin','user') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
