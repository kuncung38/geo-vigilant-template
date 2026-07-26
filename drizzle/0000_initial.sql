CREATE TABLE `monitoring_nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`device_token_hash` text NOT NULL,
	`registered_at` integer NOT NULL,
	`last_seen_at` integer,
	`overall_condition` text DEFAULT 'Normal',
	`updated_at` integer NOT NULL,
	CONSTRAINT "monitoring_nodes_overall_condition_check" CHECK("monitoring_nodes"."overall_condition" IN ('Normal', 'Warning', 'Danger'))
);
--> statement-breakpoint
CREATE INDEX `monitoring_nodes_overall_condition_idx` ON `monitoring_nodes` (`overall_condition`);--> statement-breakpoint
CREATE INDEX `monitoring_nodes_last_seen_at_idx` ON `monitoring_nodes` (`last_seen_at`);--> statement-breakpoint
CREATE TABLE `telemetry_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`monitoring_node_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`device_timestamp` integer NOT NULL,
	`received_at` integer NOT NULL,
	`radon_value` real NOT NULL,
	`radon_condition` text NOT NULL,
	`radon_min_threshold` real NOT NULL,
	`radon_max_threshold` real NOT NULL,
	`soil_moisture_value` real NOT NULL,
	`soil_moisture_condition` text NOT NULL,
	`soil_moisture_min_threshold` real NOT NULL,
	`soil_moisture_max_threshold` real NOT NULL,
	`gyro_value` real NOT NULL,
	`gyro_condition` text NOT NULL,
	`gyro_min_threshold` real NOT NULL,
	`gyro_max_threshold` real NOT NULL,
	`rainfall_value` real NOT NULL,
	`rainfall_condition` text NOT NULL,
	`rainfall_min_threshold` real NOT NULL,
	`rainfall_max_threshold` real NOT NULL,
	`overall_condition` text NOT NULL,
	`is_landslide` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`monitoring_node_id`) REFERENCES `monitoring_nodes`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "telemetry_logs_radon_condition_check" CHECK("telemetry_logs"."radon_condition" IN ('Normal', 'Warning', 'Danger')),
	CONSTRAINT "telemetry_logs_radon_threshold_check" CHECK("telemetry_logs"."radon_min_threshold" < "telemetry_logs"."radon_max_threshold"),
	CONSTRAINT "telemetry_logs_soil_moisture_condition_check" CHECK("telemetry_logs"."soil_moisture_condition" IN ('Normal', 'Warning', 'Danger')),
	CONSTRAINT "telemetry_logs_soil_moisture_threshold_check" CHECK("telemetry_logs"."soil_moisture_min_threshold" < "telemetry_logs"."soil_moisture_max_threshold"),
	CONSTRAINT "telemetry_logs_gyro_condition_check" CHECK("telemetry_logs"."gyro_condition" IN ('Normal', 'Warning', 'Danger')),
	CONSTRAINT "telemetry_logs_gyro_threshold_check" CHECK("telemetry_logs"."gyro_min_threshold" < "telemetry_logs"."gyro_max_threshold"),
	CONSTRAINT "telemetry_logs_rainfall_condition_check" CHECK("telemetry_logs"."rainfall_condition" IN ('Normal', 'Warning', 'Danger')),
	CONSTRAINT "telemetry_logs_rainfall_threshold_check" CHECK("telemetry_logs"."rainfall_min_threshold" < "telemetry_logs"."rainfall_max_threshold"),
	CONSTRAINT "telemetry_logs_overall_condition_check" CHECK("telemetry_logs"."overall_condition" IN ('Normal', 'Warning', 'Danger'))
);
--> statement-breakpoint
CREATE INDEX `telemetry_logs_monitoring_node_id_received_at_idx` ON `telemetry_logs` (`monitoring_node_id`,`received_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `telemetry_logs_monitoring_node_id_sequence_unique` ON `telemetry_logs` (`monitoring_node_id`,`sequence`);