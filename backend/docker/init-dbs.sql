DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'montron_pm') THEN
      CREATE ROLE montron_pm LOGIN PASSWORD 'montron_pm';
   END IF;
END
$$;

DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'montron_dev') THEN
      CREATE DATABASE montron_dev OWNER CURRENT_USER;
   END IF;
END
$$;

DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'montron_pm') THEN
      CREATE DATABASE montron_pm OWNER montron_pm;
   END IF;
END
$$;
