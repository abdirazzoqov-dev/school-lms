# Database Backup Strategiyasi

## Nega Backup Kerak?

- 🔥 Server buzilishi
- 💥 Hacker hujumi / Data o'chirilishi
- 🐛 Bug sabab ma'lumotlar buzilishi
- 👤 User xatosi
- 📉 Data corruption

**Backup bo'lmasa:** Barcha ma'lumotlar yo'qolishi mumkin! ⚠️

---

## Strategiya: 3-2-1 Rule

- **3** nusxa: 1 original + 2 backup
- **2** xil joy: Local + Cloud
- **1** off-site: Boshqa joyda (AWS S3, Google Drive)

---

## 1. Supabase Avtomatik Backup (Bepul!)

### A. Enable Backups

1. Supabase Dashboard > your project
2. Settings > Database > Backups
3. **Automatic backups**: Enabled ✅
4. **Retention**: 7 days (bepul)

### B. Manual Backup

Dashboard da "Backup now" bosing yoki API orqali:

```bash
curl -X POST \
  https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/database/backups \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## 2. Kunlik Avtomatik Backup Script

### A. Backup Script Yaratish

**scripts/backup-db.sh** yaratish:

```bash
#!/bin/bash

# Config
DATE=$(date +%Y-%m-%d-%H%M%S)
BACKUP_DIR="backups"
DB_NAME="school_lms"
DB_USER="postgres"
DB_HOST="db.xxx.supabase.co"
DB_PORT="5432"

# Backup folder yaratish
mkdir -p $BACKUP_DIR

# Database backup
echo "Creating backup: $DATE"
PGPASSWORD=$DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -F c \
  -f "$BACKUP_DIR/backup-$DATE.dump"

# Compress
gzip "$BACKUP_DIR/backup-$DATE.dump"

# Old backups o'chirish (30 kundan eski)
find $BACKUP_DIR -name "*.dump.gz" -mtime +30 -delete

echo "Backup completed: backup-$DATE.dump.gz"
```

**.env** ga qo'shing:
```env
DB_PASSWORD="your-database-password"
```

Ishga tushirish:
```bash
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh
```

---

## 3. Vercel Cron Job (Avtomatik)

**vercel.json**:

```json
{
  "crons": [
    {
      "path": "/api/cron/backup-database",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**app/api/cron/backup-database/route.ts**:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const date = new Date().toISOString().split('T')[0]
    const filename = `backup-${date}.sql`

    // pg_dump command
    const command = `
      PGPASSWORD=${process.env.DATABASE_PASSWORD} \
      pg_dump \
      -h ${process.env.DATABASE_HOST} \
      -p 5432 \
      -U postgres \
      -d school_lms \
      -f /tmp/${filename}
    `

    await execAsync(command)

    // Upload to S3/R2/etc (keyingi qadamda)
    
    return NextResponse.json({
      success: true,
      filename,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json(
      { error: 'Backup failed' },
      { status: 500 }
    )
  }
}
```

---

## 4. Cloud Storage ga Yuklash (AWS S3 / Cloudflare R2)

### A. Cloudflare R2 (Tavsiya - Bepul 10GB!)

```bash
npm install @aws-sdk/client-s3
```

**lib/backup-upload.ts**:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readFile } from 'fs/promises'

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT, // https://xxx.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
})

export async function uploadBackupToR2(filepath: string, filename: string) {
  try {
    const fileContent = await readFile(filepath)

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: `backups/${filename}`,
        Body: fileContent,
      })
    )

    return { success: true }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error }
  }
}
```

**.env**:
```env
R2_ENDPOINT="https://xxx.r2.cloudflarestorage.com"
R2_ACCESS_KEY="xxx"
R2_SECRET_KEY="xxx"
R2_BUCKET_NAME="school-lms-backups"
```

---

## 5. Restore (Tiklash)

### A. Supabase Dashboard dan

1. Dashboard > Database > Backups
2. Backup ni tanlang
3. "Restore" bosing
4. Tasdiqlang

### B. pg_restore bilan

```bash
# .dump file dan restore
PGPASSWORD=your-password pg_restore \
  -h db.xxx.supabase.co \
  -p 5432 \
  -U postgres \
  -d school_lms \
  -c \
  backup-2025-11-27.dump

# .sql file dan restore
PGPASSWORD=your-password psql \
  -h db.xxx.supabase.co \
  -p 5432 \
  -U postgres \
  -d school_lms \
  < backup-2025-11-27.sql
```

⚠️ **DIQQAT:** Restore qilishdan oldin test database da sinab ko'ring!

---

## 6. Backup Testing (MUHIM!)

**Har oyda backup test qilish KERAK!**

```bash
# 1. Yangi test database yaratish
createdb school_lms_test

# 2. Backup restore qilish
pg_restore -d school_lms_test backup-latest.dump

# 3. Ma'lumotlarni tekshirish
psql school_lms_test -c "SELECT COUNT(*) FROM \"User\";"
psql school_lms_test -c "SELECT COUNT(*) FROM \"Student\";"

# 4. Test database o'chirish
dropdb school_lms_test
```

---

## 7. Monitoring va Alertlar

### A. Backup Status Tracker

**app/api/backup-status/route.ts**:

```typescript
import { NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const backupDir = join(process.cwd(), 'backups')
    const files = await readdir(backupDir)
    
    const backups = await Promise.all(
      files
        .filter(f => f.endsWith('.dump.gz'))
        .map(async (file) => {
          const filepath = join(backupDir, file)
          const stats = await stat(filepath)
          return {
            filename: file,
            size: stats.size,
            created: stats.mtime,
          }
        })
    )

    // Sort by date
    backups.sort((a, b) => b.created.getTime() - a.created.getTime())

    return NextResponse.json({
      total: backups.length,
      latest: backups[0],
      backups: backups.slice(0, 10), // Last 10
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read backups' },
      { status: 500 }
    )
  }
}
```

### B. Backup Failed Alert

Agar backup muvaffaqiyatsiz bo'lsa, email yuborish:

```typescript
import { sendEmail } from '@/lib/email'

// Backup failed
if (!backupResult.success) {
  await sendEmail({
    to: 'admin@schoollms.uz',
    subject: '⚠️ BACKUP FAILED!',
    html: `
      <h1>Database Backup Xatosi!</h1>
      <p>Backup yaratishda xatolik yuz berdi.</p>
      <p><strong>Vaqt:</strong> ${new Date().toISOString()}</p>
      <p><strong>Xato:</strong> ${backupResult.error}</p>
      <p>Tezda tekshiring!</p>
    `,
  })
}
```

---

## 8. Checklist (Har hafta tekshirish)

- [ ] So'nggi backup mavjudmi?
- [ ] Backup file buzilmaganmi? (file size tekshirish)
- [ ] Cloud storage da nusxa bormi?
- [ ] Backup test qilindi (oyda 1 marta)?
- [ ] Old backuplar o'chirilganmi? (30+ kun)

---

## 9. Emergency Recovery Plan

### Agar server butunlay ishlamasa:

1. **Yangi database yaratish** (Supabase/AWS RDS)
2. **Eng yangi backupni topish** (Local yoki S3)
3. **Restore qilish** (pg_restore)
4. **Test qilish** (Login, ma'lumotlar to'g'rimi?)
5. **.env ni yangilash** (yangi DATABASE_URL)
6. **Deploy qilish** (Vercel)

**Vaqt:** ~30 daqiqa

---

## 10. Best Practices

### ✅ Qilish Kerak:
- Kunlik avtomatik backup
- Backup ni boshqa joyda saqlash (S3/R2)
- Oyda 1 marta restore test qilish
- Backup monitoring (alerts)

### ❌ Qilmaslik Kerak:
- Faqat 1 backup nusxasi
- Backup test qilmaslik
- Backupni server da saqlash (xuddi shu joyda)
- Passwordlarni backup fayliga yozish

---

## Xarajatlar

### Bepul:
- ✅ Supabase: 7 kunlik backup
- ✅ Cloudflare R2: 10GB bepul
- ✅ Local backups (serverda)

### Pullik (katta loyihalar uchun):
- AWS S3: $0.023/GB (~$1/oy 50GB uchun)
- Supabase Pro: 30 kunlik backup ($25/oy)

---

✅ **Backup strategiya tayyor!**

Endi ma'lumotlaringiz xavfsiz. Har qanday muammo bo'lsa, tezda tiklay olasiz.

