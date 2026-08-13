ALTER TABLE `orders` ADD `stockAllocatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `cancelledAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `cancelledByUserId` int;--> statement-breakpoint
ALTER TABLE `orders` ADD `cancellationReason` text;