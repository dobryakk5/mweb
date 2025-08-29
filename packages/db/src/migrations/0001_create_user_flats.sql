-- Create user_flats table in users schema
CREATE TABLE IF NOT EXISTS users.user_flats (
  id VARCHAR(255) PRIMARY KEY,
  tg_user_id BIGINT NOT NULL,
  flat_id VARCHAR(255) NOT NULL,
  address VARCHAR(500) NOT NULL,
  rooms INTEGER NOT NULL,
  floor INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS user_flats_tg_user_id_idx ON users.user_flats(tg_user_id);
CREATE INDEX IF NOT EXISTS user_flats_flat_id_idx ON users.user_flats(flat_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_user_flats_updated_at
    BEFORE UPDATE ON users.user_flats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
