# Panduan Deployment

## Deployment ke Vercel (Recommended)

Vercel adalah platform hosting terbaik untuk Next.js dengan setup mudah dan gratis untuk project kecil-menengah.

### Prasyarat
- Akun GitHub/GitLab
- Akun Vercel (gratis)
- Database PostgreSQL online (contoh: Supabase, Neon, Railway)

### Langkah 1: Setup Database Online

#### Opsi A: Supabase (Recommended - Free)

1. Daftar di [Supabase](https://supabase.com/)
2. Buat project baru
3. Copy connection string dari Settings > Database
4. Format: `postgresql://postgres:[password]@[host]:[port]/postgres`

#### Opsi B: Neon

1. Daftar di [Neon](https://neon.tech/)
2. Buat project baru
3. Copy connection string

#### Opsi C: Railway

1. Daftar di [Railway](https://railway.app/)
2. Deploy PostgreSQL
3. Copy connection string

### Langkah 2: Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Langkah 3: Deploy ke Vercel

1. Login ke [Vercel](https://vercel.com/)
2. Click "New Project"
3. Import repository dari GitHub
4. Configure Project:
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. Environment Variables - Tambahkan semua dari `.env`:
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_SECRET=your-secret
   NEXTAUTH_URL=https://your-app.vercel.app
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=noreply@rt.com
   WA_API_KEY=your-wa-key
   MIDTRANS_SERVER_KEY=your-key
   MIDTRANS_CLIENT_KEY=your-key
   MIDTRANS_IS_PRODUCTION=false
   ```

6. Click "Deploy"

### Langkah 4: Run Migrations di Production

Setelah deploy berhasil, jalankan migration:

```bash
# Via Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy
npx prisma db seed
```

Atau setup di Vercel Build Settings:
- Build Command: `prisma generate && prisma migrate deploy && next build`

### Langkah 5: Verifikasi

1. Buka URL production (contoh: `https://your-app.vercel.app`)
2. Test login dengan akun demo
3. Check semua fitur berjalan normal

## Deployment ke VPS (Ubuntu)

Untuk kontrol penuh dan custom configuration.

### Langkah 1: Setup Server

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx
```

### Langkah 2: Setup Database

```bash
sudo -u postgres psql

# Di PostgreSQL console:
CREATE DATABASE rt_management;
CREATE USER rt_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE rt_management TO rt_user;
\q
```

### Langkah 3: Clone dan Setup Project

```bash
cd /var/www
sudo git clone <your-repo-url> rt-management
cd rt-management
sudo npm install
```

### Langkah 4: Configure Environment

```bash
sudo nano .env
```

Isi dengan konfigurasi production:
```env
DATABASE_URL="postgresql://rt_user:strong_password@localhost:5432/rt_management"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
# ... dst
```

### Langkah 5: Build dan Run

```bash
# Generate Prisma Client
sudo npm run prisma:generate

# Run migrations
sudo npm run prisma:migrate

# Seed data (opsional)
sudo npm run prisma:seed

# Build production
sudo npm run build

# Start dengan PM2
sudo pm2 start npm --name "rt-app" -- start
sudo pm2 startup
sudo pm2 save
```

### Langkah 6: Setup Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/rt-management
```

Isi dengan:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/rt-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Langkah 7: Setup SSL dengan Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Deployment ke Docker

### Langkah 1: Buat Dockerfile

File `Dockerfile`:
```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Langkah 2: Buat docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: rt_management
      POSTGRES_USER: rt_user
      POSTGRES_PASSWORD: rt_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://rt_user:rt_password@db:5432/rt_management
      - NEXTAUTH_SECRET=your-secret
      - NEXTAUTH_URL=http://localhost:3000
    depends_on:
      - db

volumes:
  postgres_data:
```

### Langkah 3: Build dan Run

```bash
docker-compose up -d
```

## Post-Deployment Checklist

- [ ] Database migrations berhasil
- [ ] Seed data (jika diperlukan)
- [ ] Environment variables ter-set dengan benar
- [ ] SSL certificate terpasang (untuk production)
- [ ] Login berfungsi normal
- [ ] Semua fitur dapat diakses
- [ ] Email notification working (jika di-setup)
- [ ] WhatsApp notification working (jika di-setup)
- [ ] Payment gateway working (jika di-setup)
- [ ] Backup database ter-schedule

## Monitoring & Maintenance

### Setup Automated Backups

Buat script backup harian:

```bash
#!/bin/bash
# /usr/local/bin/backup-db.sh

BACKUP_DIR="/var/backups/rt-management"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="rt_backup_${TIMESTAMP}.sql"

mkdir -p $BACKUP_DIR

pg_dump -U rt_user -h localhost rt_management > $BACKUP_DIR/$FILENAME

# Keep only 7 days of backups
find $BACKUP_DIR -name "rt_backup_*.sql" -mtime +7 -delete

echo "Backup completed: $FILENAME"
```

Setup cron job:
```bash
sudo crontab -e

# Add line:
0 2 * * * /usr/local/bin/backup-db.sh
```

### Monitoring dengan PM2

```bash
# View logs
pm2 logs rt-app

# Monitor resources
pm2 monit

# Restart on crash
pm2 start rt-app --watch
```

### Update Application

```bash
cd /var/www/rt-management
git pull origin main
npm install
npm run build
pm2 restart rt-app
```

## Troubleshooting Production

### App tidak bisa connect ke database

Check connection string dan pastikan database accessible dari server

### Error 502 Bad Gateway (Nginx)

```bash
# Check PM2 status
pm2 status

# Restart app
pm2 restart rt-app

# Check Nginx config
sudo nginx -t
```

### Memory issues

```bash
# Increase Node.js memory
pm2 delete rt-app
pm2 start npm --name "rt-app" --max-memory-restart 500M -- start
```

## Security Best Practices

1. **Gunakan strong passwords** untuk database
2. **Enable SSL/HTTPS** di production
3. **Firewall**: Hanya buka port 80 (HTTP) dan 443 (HTTPS)
4. **Regular updates**: Update dependencies secara berkala
5. **Backup**: Setup automated daily backups
6. **Environment variables**: Jangan commit `.env` ke git
7. **Rate limiting**: Setup rate limiting di Nginx/Vercel
8. **Monitoring**: Setup uptime monitoring (contoh: UptimeRobot)

## Scaling

Jika user bertambah banyak:

1. **Database**: Upgrade ke dedicated PostgreSQL server
2. **Redis**: Add Redis for session storage
3. **Load Balancer**: Multiple app instances behind load balancer
4. **CDN**: Use CDN untuk static assets
5. **Queue**: Add job queue untuk email/WhatsApp

---

**Selamat! Aplikasi RT Management Anda sudah production-ready! 🎉**
