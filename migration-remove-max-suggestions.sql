-- Migration to remove max_suggestions column from user_settings table
-- This should be run on existing databases to remove the column

ALTER TABLE user_settings DROP COLUMN IF EXISTS max_suggestions; 