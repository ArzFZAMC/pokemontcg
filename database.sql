-- ============================================
-- PocketDex TCG - Database Schema
-- Run: mysql -u root -p < database.sql
-- ============================================

CREATE DATABASE IF NOT EXISTS pocketdex_tcg CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pocketdex_tcg;

-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255) DEFAULT NULL,
    favorite_type VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Collections Table
CREATE TABLE collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    card_id VARCHAR(100) NOT NULL,
    card_name VARCHAR(255) NOT NULL,
    card_image VARCHAR(500) DEFAULT NULL,
    card_type VARCHAR(50) DEFAULT NULL,
    card_rarity VARCHAR(100) DEFAULT NULL,
    card_hp INT DEFAULT NULL,
    card_set_name VARCHAR(255) DEFAULT NULL,
    card_set_logo VARCHAR(500) DEFAULT NULL,
    card_artist VARCHAR(255) DEFAULT NULL,
    card_data JSON DEFAULT NULL,
    quantity INT DEFAULT 1,
    condition_status ENUM('mint','near_mint','used') DEFAULT 'near_mint',
    is_owned TINYINT(1) DEFAULT 1,
    is_favorite TINYINT(1) DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_card (user_id, card_id)
);

-- Wishlist Table
CREATE TABLE wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    card_id VARCHAR(100) NOT NULL,
    card_name VARCHAR(255) NOT NULL,
    card_image VARCHAR(500) DEFAULT NULL,
    card_rarity VARCHAR(100) DEFAULT NULL,
    card_set_name VARCHAR(255) DEFAULT NULL,
    card_data JSON DEFAULT NULL,
    priority ENUM('low','medium','high') DEFAULT 'medium',
    notes TEXT DEFAULT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_wishlist (user_id, card_id)
);

-- Decks Table
CREATE TABLE decks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    cover_image VARCHAR(500) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Deck Cards Table
CREATE TABLE deck_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deck_id INT NOT NULL,
    card_id VARCHAR(100) NOT NULL,
    card_name VARCHAR(255) NOT NULL,
    card_image VARCHAR(500) DEFAULT NULL,
    card_type VARCHAR(50) DEFAULT NULL,
    card_rarity VARCHAR(100) DEFAULT NULL,
    card_data JSON DEFAULT NULL,
    quantity INT DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_deck_card (deck_id, card_id)
);

-- Achievements Table
CREATE TABLE achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_key VARCHAR(100) NOT NULL,
    achievement_name VARCHAR(255) NOT NULL,
    achievement_desc TEXT DEFAULT NULL,
    achievement_icon VARCHAR(50) DEFAULT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_key)
);

-- Pack Opening History Table
CREATE TABLE pack_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    cards_opened JSON NOT NULL,
    pack_type VARCHAR(100) DEFAULT 'standard',
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_collections_user ON collections(user_id);
CREATE INDEX idx_collections_card ON collections(card_id);
CREATE INDEX idx_wishlist_user ON wishlist(user_id);
CREATE INDEX idx_decks_user ON decks(user_id);
CREATE INDEX idx_deck_cards_deck ON deck_cards(deck_id);
CREATE INDEX idx_achievements_user ON achievements(user_id);

-- ============================================
-- Sample seed data (optional)
-- ============================================

-- Insert a test user (password: Test1234!)
-- Password hash generated with bcrypt rounds=10
-- INSERT INTO users (username, email, password_hash) VALUES
-- ('trainer_ash', 'ash@pocketdex.com', '$2b$10$examplehashhere');
