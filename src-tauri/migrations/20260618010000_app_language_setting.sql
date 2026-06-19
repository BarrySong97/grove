INSERT INTO app_settings (key, value, updated_at)
VALUES ('language', 'system', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO NOTHING;
