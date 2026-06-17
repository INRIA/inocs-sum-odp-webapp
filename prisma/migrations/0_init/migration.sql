-- CreateTable
CREATE TABLE `categories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `type` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `categories_name_unique`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `failed_jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(255) NOT NULL,
    `connection` TEXT NOT NULL,
    `queue` TEXT NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `exception` LONGTEXT NOT NULL,
    `failed_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `failed_jobs_uuid_unique`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_tag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_id` BIGINT UNSIGNED NOT NULL,
    `tag_id` BIGINT UNSIGNED NOT NULL,

    INDEX `item_tag_item_id_foreign`(`item_id`),
    INDEX `item_tag_tag_id_foreign`(`tag_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `url` VARCHAR(512) NULL,
    `name` VARCHAR(255) NOT NULL,
    `orgname` VARCHAR(400) NOT NULL,
    `picture` VARCHAR(255) NULL,
    `file` VARCHAR(255) NULL,
    `fileorgname` VARCHAR(255) NOT NULL,
    `project_id` BIGINT UNSIGNED NULL,
    `category_id` BIGINT UNSIGNED NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(255) NULL,
    `homepage` BOOLEAN NOT NULL DEFAULT false,
    `options` TEXT NULL,
    `date` DATE NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `user_id` INTEGER NULL,
    `visible` TINYINT NULL,
    `living_lab_id` BIGINT UNSIGNED NULL,
    `kpidefinition_id` BIGINT UNSIGNED NULL,

    UNIQUE INDEX `items_name_unique`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kpidefinitions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `parent_kpi_id` BIGINT UNSIGNED NULL,
    `kpi_number` VARCHAR(50) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `metric` VARCHAR(50) NOT NULL,
    `metric_description` TEXT NULL,
    `disclaimer` TEXT NULL,
    `progression_target` INTEGER NOT NULL,
    `min_value` FLOAT NULL,
    `max_value` FLOAT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `kpidefinitions_parent_kpi_id_index`(`parent_kpi_id`),
    INDEX `kpidefinitions_kpi_number_index`(`kpi_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kpidefinitions_category` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `kpidefinition_id` BIGINT UNSIGNED NOT NULL,
    `category_id` BIGINT UNSIGNED NOT NULL,

    INDEX `kpidefinitions_category_kpidefinition_id_foreign`(`kpidefinition_id`),
    INDEX `kpidefinitions_category_category_id_foreign`(`category_id`),
    UNIQUE INDEX `uniq_kpidefinition_category`(`kpidefinition_id`, `category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kpiresults` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `kpidefinition_id` BIGINT UNSIGNED NOT NULL,
    `living_lab_id` BIGINT UNSIGNED NOT NULL,
    `transport_mode_id` BIGINT UNSIGNED NULL,
    `value` FLOAT NOT NULL,
    `description` VARCHAR(5000) NULL,
    `date` DATE NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `user_id` BIGINT UNSIGNED NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `labs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `country` VARCHAR(512) NULL,
    `flag` VARCHAR(512) NULL,
    `description` TEXT NULL,
    `area` INTEGER NULL,
    `radius` INTEGER NULL,
    `population` INTEGER NULL,
    `country_code2` VARCHAR(512) NULL,
    `lat` VARCHAR(25) NULL,
    `lng` VARCHAR(25) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `validated_at` TIMESTAMP(0) NULL,
    `validated_by_user_id` BIGINT UNSIGNED NULL,

    UNIQUE INDEX `categories_name_unique`(`name`),
    INDEX `labs_validated_by_user_id_foreign`(`validated_by_user_id`),
    INDEX `labs_user_id_foreign`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_resets` (
    `email` VARCHAR(255) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,

    INDEX `password_resets_email_index`(`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `personal_access_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tokenable_type` VARCHAR(255) NOT NULL,
    `tokenable_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `token` VARCHAR(64) NOT NULL,
    `abilities` TEXT NULL,
    `last_used_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `personal_access_tokens_token_unique`(`token`),
    INDEX `personal_access_tokens_tokenable_type_tokenable_id_index`(`tokenable_type`, `tokenable_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `type` VARCHAR(255) NOT NULL,
    `image_url` TEXT NULL,

    UNIQUE INDEX `projects_name_unique`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `living_lab_projects_implementation` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `project_id` BIGINT UNSIGNED NOT NULL,
    `living_lab_id` BIGINT UNSIGNED NOT NULL,
    `user_id` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `start_at` TIMESTAMP(0) NULL,
    `description` TEXT NULL,

    INDEX `lab_projects_project_id_foreign`(`project_id`),
    INDEX `lab_projects_living_lab_id_foreign`(`living_lab_id`),
    UNIQUE INDEX `uniq_lab_project`(`living_lab_id`, `project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `roles_name_unique`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `color` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `description` VARCHAR(1024) NULL,

    UNIQUE INDEX `tags_name_unique`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `role_id` BIGINT UNSIGNED NOT NULL,
    `email_verified_at` TIMESTAMP(0) NULL,
    `password` VARCHAR(255) NOT NULL,
    `status` VARCHAR(100) NOT NULL DEFAULT 'signup',
    `picture` VARCHAR(255) NULL,
    `location` VARCHAR(255) NULL,
    `phone` VARCHAR(255) NULL,
    `remember_token` VARCHAR(100) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `users_email_unique`(`email`),
    INDEX `users_role_id_fkey`(`role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `living_lab_user_relation` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `living_lab_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `llur_user_id_foreign`(`user_id`),
    INDEX `llur_living_lab_id_foreign`(`living_lab_id`),
    UNIQUE INDEX `uniq_llur_user_lab`(`user_id`, `living_lab_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transport_mode` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `type` VARCHAR(100) NULL,
    `color` VARCHAR(10) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transport_mode_living_lab_implementation` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `transport_mode_id` BIGINT UNSIGNED NOT NULL,
    `living_lab_id` BIGINT UNSIGNED NOT NULL,
    `status` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `tmlli_transport_mode_id_foreign`(`transport_mode_id`),
    INDEX `tmlli_living_lab_id_foreign`(`living_lab_id`),
    UNIQUE INDEX `uniq_tmlli`(`transport_mode_id`, `living_lab_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `from_user_id` BIGINT UNSIGNED NOT NULL,
    `from_email` VARCHAR(255) NOT NULL,
    `to_user_id` BIGINT UNSIGNED NULL,
    `to_email` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `sent_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `living_lab_id` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NOT NULL,
    `updated_at` TIMESTAMP(0) NOT NULL,
    `item_id` BIGINT UNSIGNED NULL,
    `kpiresult_id` BIGINT UNSIGNED NULL,
    `living_lab_project_implementation_id` BIGINT UNSIGNED NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_runs` (
    `id` VARCHAR(36) NOT NULL,
    `job_name` VARCHAR(100) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `message` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `started_at` TIMESTAMP(0) NULL,
    `completed_at` TIMESTAMP(0) NULL,
    `input_data` JSON NULL,
    `output_data` JSON NULL,

    INDEX `job_runs_job_name_index`(`job_name`),
    INDEX `job_runs_status_index`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `item_tag` ADD CONSTRAINT `item_tag_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `item_tag` ADD CONSTRAINT `item_tag_tag_id_foreign` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `items` ADD CONSTRAINT `items_living_lab_id_fkey` FOREIGN KEY (`living_lab_id`) REFERENCES `labs`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `items` ADD CONSTRAINT `items_kpidefinition_id_fkey` FOREIGN KEY (`kpidefinition_id`) REFERENCES `kpidefinitions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `items` ADD CONSTRAINT `items_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `kpidefinitions` ADD CONSTRAINT `kpidefinitions_parent_kpi_id_index` FOREIGN KEY (`parent_kpi_id`) REFERENCES `kpidefinitions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `kpidefinitions_category` ADD CONSTRAINT `kpidefinitions_category_kpidefinition_id_foreign` FOREIGN KEY (`kpidefinition_id`) REFERENCES `kpidefinitions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `kpidefinitions_category` ADD CONSTRAINT `kpidefinitions_category_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `kpiresults` ADD CONSTRAINT `kpiresults_kpidefinition_id_fkey` FOREIGN KEY (`kpidefinition_id`) REFERENCES `kpidefinitions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `kpiresults` ADD CONSTRAINT `kpiresults_living_lab_id_fkey` FOREIGN KEY (`living_lab_id`) REFERENCES `labs`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `kpiresults` ADD CONSTRAINT `kpiresults_transport_mode_id_fkey` FOREIGN KEY (`transport_mode_id`) REFERENCES `transport_mode`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `kpiresults` ADD CONSTRAINT `kpiresults_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `labs` ADD CONSTRAINT `labs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `labs` ADD CONSTRAINT `labs_validated_by_user_id_foreign` FOREIGN KEY (`validated_by_user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `living_lab_projects_implementation` ADD CONSTRAINT `lab_projects_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `living_lab_projects_implementation` ADD CONSTRAINT `lab_projects_living_lab_id_foreign` FOREIGN KEY (`living_lab_id`) REFERENCES `labs`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `living_lab_user_relation` ADD CONSTRAINT `llur_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `living_lab_user_relation` ADD CONSTRAINT `llur_living_lab_id_foreign` FOREIGN KEY (`living_lab_id`) REFERENCES `labs`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `transport_mode_living_lab_implementation` ADD CONSTRAINT `tmlli_transport_mode_id_foreign` FOREIGN KEY (`transport_mode_id`) REFERENCES `transport_mode`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `transport_mode_living_lab_implementation` ADD CONSTRAINT `tmlli_living_lab_id_foreign` FOREIGN KEY (`living_lab_id`) REFERENCES `labs`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_from_user_id_fkey` FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_to_user_id_fkey` FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_living_lab_id_fkey` FOREIGN KEY (`living_lab_id`) REFERENCES `labs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_kpiresult_id_fkey` FOREIGN KEY (`kpiresult_id`) REFERENCES `kpiresults`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_living_lab_project_implementation_id_fkey` FOREIGN KEY (`living_lab_project_implementation_id`) REFERENCES `living_lab_projects_implementation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Migration: add_last_updated_by_user_id
-- Adds audit column last_updated_by_user_id to labs, kpiresults, and living_lab_projects_implementation.
-- Also adds @updatedAt behaviour hint (Prisma handles this at the ORM level, no SQL trigger needed).

ALTER TABLE `labs`
  ADD COLUMN `last_updated_by_user_id` BIGINT UNSIGNED NULL,
  ADD INDEX `labs_last_updated_by_user_id_foreign` (`last_updated_by_user_id`),
  ADD CONSTRAINT `labs_last_updated_by_user_id_foreign`
    FOREIGN KEY (`last_updated_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `kpiresults`
  ADD COLUMN `last_updated_by_user_id` BIGINT UNSIGNED NULL,
  ADD INDEX `kpiresults_last_updated_by_user_id_index` (`last_updated_by_user_id`),
  ADD CONSTRAINT `kpiresults_last_updated_by_user_id_foreign`
    FOREIGN KEY (`last_updated_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- Rename existing kpiresults FK on user_id to match new named relation
-- (only needed if the existing constraint was unnamed/auto-generated; skip if already named)

ALTER TABLE `living_lab_projects_implementation`
  ADD COLUMN `last_updated_by_user_id` BIGINT UNSIGNED NULL,
  ADD INDEX `lab_projects_last_updated_by_user_id_foreign` (`last_updated_by_user_id`),
  ADD CONSTRAINT `lab_projects_last_updated_by_user_id_foreign`
    FOREIGN KEY (`last_updated_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE NO ACTION;


-- Script to create triggers for messages table to auto-populate from_email and to_email based on from_user_id and to_user_id.
DELIMITER $$

CREATE TRIGGER messages_before_insert
BEFORE INSERT ON messages
FOR EACH ROW
BEGIN
  -- Set from_email from users table
  IF NEW.from_user_id IS NOT NULL THEN
    SET NEW.from_email = (SELECT email FROM users WHERE id = NEW.from_user_id);
  END IF;
  
  -- Set to_email from users table if to_user_id is provided
  IF NEW.to_user_id IS NOT NULL THEN
    SET NEW.to_email = (SELECT email FROM users WHERE id = NEW.to_user_id);
  END IF;
END$$

CREATE TRIGGER messages_before_update
BEFORE UPDATE ON messages
FOR EACH ROW
BEGIN
  IF NEW.from_user_id IS NOT NULL THEN
    SET NEW.from_email = (SELECT email FROM users WHERE id = NEW.from_user_id);
  END IF;
  
  IF NEW.to_user_id IS NOT NULL THEN
    SET NEW.to_email = (SELECT email FROM users WHERE id = NEW.to_user_id);
  END IF;
END$$

DELIMITER ;