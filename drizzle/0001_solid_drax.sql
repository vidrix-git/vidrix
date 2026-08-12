CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('PF','PJ') NOT NULL,
	`cpfCnpj` varchar(255) NOT NULL,
	`address` text,
	`phone` varchar(255),
	`email` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `clients_cpfCnpj_unique` UNIQUE(`cpfCnpj`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`width` decimal(10,2) NOT NULL,
	`height` decimal(10,2) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`squareMeters` decimal(10,4) NOT NULL,
	`subtotal` decimal(12,2) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`userId` int NOT NULL,
	`quoteId` int,
	`status` enum('aprovado','em_producao','pronto','entregue','cancelado') NOT NULL DEFAULT 'aprovado',
	`totalAmount` decimal(12,2) NOT NULL DEFAULT '0',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(255),
	`thickness` varchar(255) NOT NULL,
	`color` varchar(255),
	`width` decimal(10,2) NOT NULL,
	`height` decimal(10,2) NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`stockQuantity` int NOT NULL DEFAULT 0,
	`minStockQuantity` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchaseOrderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`purchaseOrderId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`unitCost` decimal(10,2) NOT NULL,
	`subtotal` decimal(12,2) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchaseOrderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchaseOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pendente','confirmado','recebido','cancelado') NOT NULL DEFAULT 'pendente',
	`totalAmount` decimal(12,2) NOT NULL DEFAULT '0',
	`expectedDeliveryDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchaseOrders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quoteItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int NOT NULL,
	`productId` int NOT NULL,
	`width` decimal(10,2) NOT NULL,
	`height` decimal(10,2) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`squareMeters` decimal(10,4) NOT NULL,
	`subtotal` decimal(12,2) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quoteItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('rascunho','aprovado','rejeitado','convertido') NOT NULL DEFAULT 'rascunho',
	`validUntil` timestamp,
	`totalAmount` decimal(12,2) NOT NULL DEFAULT '0',
	`discount` decimal(10,2) DEFAULT '0',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stockMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`type` enum('entrada','saida') NOT NULL,
	`quantity` int NOT NULL,
	`referenceType` varchar(50),
	`referenceId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stockMovements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`cnpj` varchar(255) NOT NULL,
	`address` text,
	`phone` varchar(255),
	`email` varchar(255),
	`paymentTerms` enum('a_vista','15_dias','30_dias') NOT NULL DEFAULT 'a_vista',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`),
	CONSTRAINT `suppliers_cnpj_unique` UNIQUE(`cnpj`)
);
