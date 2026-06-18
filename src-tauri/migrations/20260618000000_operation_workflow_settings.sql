INSERT INTO app_settings (key, value, updated_at)
VALUES
  ('default_archive_policy', 'ask', CURRENT_TIMESTAMP),
  ('remove_project_behavior', 'grove_only', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO NOTHING;
