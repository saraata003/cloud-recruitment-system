#!/usr/bin/env bash
# Applies pending database migrations, then starts the production server.
# Safe to run on every boot: already-applied migrations are skipped.
#
# On a host with a persistent volume (e.g. Railway), set STORAGE_DIR to its
# mount path — both the SQLite database and uploaded photos/CVs relocate
# there automatically (see src/db/index.ts and src/lib/storage-paths.ts),
# so data survives restarts and redeploys instead of living on the
# container's throwaway filesystem.
set -e

npx tsx src/db/migrate.ts
exec next start
