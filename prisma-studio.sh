#!/bin/bash
# Set DATABASE_URL dan jalankan Prisma Studio
export DATABASE_URL="postgresql://postgres:gigi1234@localhost:5432/sikeu_rt?schema=public"
pnpm prisma:studio
