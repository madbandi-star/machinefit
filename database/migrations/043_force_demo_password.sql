-- Demo mode: set every user's password hash to bcrypt(demo1234, cost 12).
-- Hash generated with bcryptjs (same as backend/server/utils/hash.util.ts).
UPDATE users
SET password_hash = '$2b$12$Jl0R/iUN2nU1uKp8YJ/NPedihs3J5LRf9rHhXgrUwvz5XhVevxIyC',
    updated_at = NOW();
