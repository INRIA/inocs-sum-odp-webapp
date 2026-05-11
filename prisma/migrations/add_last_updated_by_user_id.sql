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
