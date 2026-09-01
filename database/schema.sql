-- MySQL Database Schema for WeatherSphere
-- Database: `weather_db`

CREATE DATABASE IF NOT EXISTS `weather_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `weather_db`;

-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Settings Table
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `temperature_unit` ENUM('celsius', 'fahrenheit') DEFAULT 'celsius',
  `wind_speed_unit` ENUM('kmh', 'mph', 'ms', 'knots') DEFAULT 'kmh',
  `theme` ENUM('dark', 'light', 'system') DEFAULT 'dark',
  `auto_location` BOOLEAN DEFAULT TRUE,
  `notifications` BOOLEAN DEFAULT TRUE,
  `refresh_interval` INT DEFAULT 30, -- minutes
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Favorites Locations Table
CREATE TABLE IF NOT EXISTS `favorites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `city` VARCHAR(150) NOT NULL,
  `country` VARCHAR(100),
  `state` VARCHAR(100),
  `latitude` DECIMAL(10, 7) NOT NULL,
  `longitude` DECIMAL(10, 7) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_user_city_coords` (`user_id`, `latitude`, `longitude`),
  CONSTRAINT `fk_favorites_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample Seed Data
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`) 
VALUES (1, 'Demo User', 'demo@example.com', '$2a$10$abcdefghijklmnopqrstuv.wxyzA1B2C3D4E5F6G7H8I9J0K')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `settings` (`user_id`, `temperature_unit`, `theme`, `notifications`)
VALUES (1, 'celsius', 'dark', TRUE)
ON DUPLICATE KEY UPDATE `temperature_unit`=VALUES(`temperature_unit`);

INSERT INTO `favorites` (`user_id`, `city`, `country`, `latitude`, `longitude`)
VALUES 
(1, 'Hyderabad', 'India', 17.3850, 78.4867),
(1, 'Khammam', 'India', 17.2473, 80.1514),
(1, 'Bengaluru', 'India', 12.9716, 77.5946),
(1, 'Mumbai', 'India', 19.0760, 72.8777)
ON DUPLICATE KEY UPDATE `city`=VALUES(`city`);
