
INSERT INTO `transport_mode` (`id`, `name`, `description`, `type`, `created_at`) VALUES
(1, 'Private Car', 'Individually owned motor vehicle used for personal trips.', 'PRIVATE', NOW()),
(2, 'Motorcycle / Scooter', 'Two-wheeled motorised vehicle for solo or two-person travel.', 'PRIVATE', NOW()),
(3, 'Carsharing', 'Shared access to cars on demand through a membership or app.', 'NSM', NOW()),
(4, 'Bicycle', 'User-owned bicycle for short-to-medium distance trips.', 'NSM', NOW()),
(5, 'E-scooter', 'Electric micromobility vehicles', 'NSM', NOW()),
(6, 'Walking', 'Pedestrian travel for short distances; zero-emission active mode.', 'OTHER', NOW()),
(7, 'Micromobility', '', 'NSM', NOW()),
(8, 'Ride hailing', 'Flexible shared transit that adapts routes and schedules to demand.', 'NSM', NOW()),
(9, 'Taxi', 'Taxi ride hailing', 'NSM', NOW()),
(10, 'Train', 'Rail services connecting cities and suburbs over longer distances.', 'PUBLIC_TRANSPORT', NOW()),
(11, 'Bus', 'Scheduled public transport on roads serving local or regional routes.', 'PUBLIC_TRANSPORT', NOW()),
(12, 'Metro / Subway', 'High-capacity rapid transit serving dense urban areas.', 'PUBLIC_TRANSPORT', NOW()),
(13, 'Other', 'Other means of transport', 'PRIVATE', NOW())
