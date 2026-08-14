ALTER TABLE `products` ADD `code` varchar(64);--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_code_unique` UNIQUE(`code`);