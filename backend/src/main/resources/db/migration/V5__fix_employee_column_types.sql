-- Fix employee table column types if they were incorrectly created as bytea
ALTER TABLE employee 
    ALTER COLUMN username TYPE VARCHAR(64),
    ALTER COLUMN first_name TYPE VARCHAR(64),
    ALTER COLUMN last_name TYPE VARCHAR(64),
    ALTER COLUMN department TYPE VARCHAR(64),
    ALTER COLUMN status TYPE VARCHAR(16),
    ALTER COLUMN etag TYPE VARCHAR(80);
