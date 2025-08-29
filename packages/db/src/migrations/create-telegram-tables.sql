-- Create telegram_users table
CREATE TABLE IF NOT EXISTS telegram_users (
  id VARCHAR(255) PRIMARY KEY,
  tg_user_id BIGINT UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  username VARCHAR(255),
  photo_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  tg_user_id BIGINT NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS telegram_users_tg_user_id_idx ON telegram_users(tg_user_id);
CREATE INDEX IF NOT EXISTS sessions_tg_user_id_idx ON sessions(tg_user_id);
CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions(session_token);

-- Create trigger to update updated_at timestamp for telegram_users
CREATE TRIGGER update_telegram_users_updated_at 
    BEFORE UPDATE ON telegram_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update updated_at timestamp for sessions
CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
