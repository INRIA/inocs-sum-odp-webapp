INSERT INTO `users` (`id`, `name`, `email`, `role_id`, `status`, `email_verified_at`, `password`, `picture`, `location`, `phone`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'ODP admin', 'odp.admin@yopmail.com', 1, 'active', NULL, '$2y$10$QMeJTMNLcJLZZZ1tgA1vz.dIFakyc2snJUER/nAYxb6XKI/UrBHJa', NULL, NULL, NULL, NULL, '2025-06-27 06:42:33', '2025-06-27 06:42:33');


INSERT INTO `labs` (`id`, `name`, `lat`, `lng`, `radius`) VALUES
(1, 'Munich', '48.1351', '11.5820', 50),
(2, 'Geneva', '46.2044', '6.1432', 50),
(3, 'Jerusalem', '31.7683', '35.2137', 50),
(4, 'Penteli', '38.0451', '23.8625', 50),
(5, 'Rotterdam', '51.9225', '4.47917', 50),
(6, 'Krakow', '50.0647', '19.9450', 50),
(7, 'Fredrikstad', '59.2181', '10.9298', 50),
(8, 'Larnaca', '34.9229', '33.6233', 50),
(9, 'Coimbra', '40.2033', '-8.4103', 50);


INSERT INTO `living_lab_user_relation` (`id`, `user_id`, `living_lab_id`, `created_at`) VALUES
(1, 1, 1, now()),
(2, 1, 2, now());
