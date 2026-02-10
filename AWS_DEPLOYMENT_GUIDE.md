# AWS Free Tier Deployment Guide for LiveBid Backend

## 🆓 AWS Free Tier Overview

AWS offers a **12-month Free Tier** (not 6 months) with many services that are perfect for deploying mini projects. Some services are **always free** even after 12 months.

---

## 🚀 Best Options for NestJS Backend Deployment

### Option 1: AWS Elastic Beanstalk (Recommended for Beginners) ⭐

**Free Tier:** ✅ 12 months free
- **What you get:**
  - 750 hours/month of EC2 t2.micro or t3.micro instances
  - 30 GB of Elastic Block Storage (EBS)
  - 2 million requests/month on Application Load Balancer
  - 5 GB of S3 storage

**Pros:**
- ✅ Easiest to deploy (just upload your code)
- ✅ Handles scaling automatically
- ✅ No server management needed
- ✅ Perfect for Node.js/NestJS apps

**Cost after Free Tier:** ~$15-30/month (depending on usage)

**Deployment Steps:**
1. Install EB CLI: `pip install awsebcli`
2. Initialize: `eb init`
3. Create environment: `eb create`
4. Deploy: `eb deploy`

---

### Option 2: AWS EC2 (Full Control)

**Free Tier:** ✅ 12 months free
- **What you get:**
  - 750 hours/month of t2.micro instance (1 vCPU, 1GB RAM)
  - 30 GB of EBS storage
  - 15 GB of data transfer out

**Pros:**
- ✅ Full control over server
- ✅ Can install anything
- ✅ Good for learning

**Cons:**
- ❌ Need to manage server yourself
- ❌ Need to set up Nginx, PM2, SSL, etc.

**Cost after Free Tier:** ~$10-15/month

**Setup Required:**
- Install Node.js, PM2, Nginx
- Configure SSL with Let's Encrypt
- Set up firewall rules
- Configure domain/DNS

---

### Option 3: AWS App Runner (Serverless-like)

**Free Tier:** ✅ Always free (limited)
- **What you get:**
  - First 1.5 million requests/month free
  - 0.5 vCPU, 1GB RAM

**Pros:**
- ✅ Fully managed
- ✅ Auto-scaling
- ✅ Pay only for what you use
- ✅ Always free tier (limited)

**Cons:**
- ❌ Limited free tier
- ❌ Can get expensive with traffic

**Cost:** Free for low traffic, then pay-per-use

---

### Option 4: AWS Lightsail (Simplified VPS)

**Free Tier:** ❌ No free tier, but very cheap
- **What you get:**
  - $3.50/month for smallest instance
  - 512 MB RAM, 1 vCPU, 20 GB SSD
  - 1 TB data transfer

**Pros:**
- ✅ Very affordable ($3.50/month)
- ✅ Simple pricing
- ✅ Includes DNS management
- ✅ Easy to use

**Cons:**
- ❌ Not free (but very cheap)
- ❌ Less flexible than EC2

**Cost:** $3.50/month (cheapest option)

---

## 🗄️ Database Options

### RDS MySQL/PostgreSQL

**Free Tier:** ✅ 12 months free
- **What you get:**
  - db.t2.micro instance (750 hours/month)
  - 20 GB storage
  - 20 GB backup storage

**Perfect for:** Your MySQL database

---

### DynamoDB (NoSQL)

**Free Tier:** ✅ Always free
- **What you get:**
  - 25 GB storage
  - 25 read capacity units
  - 25 write capacity units

**Note:** Your app uses MySQL, so RDS is better

---

## 📦 Storage Options

### S3 (File Storage)

**Free Tier:** ✅ 12 months free
- **What you get:**
  - 5 GB storage
  - 20,000 GET requests
  - 2,000 PUT requests

**Perfect for:** Storing auction images

---

## 🔄 Redis Options

### ElastiCache

**Free Tier:** ❌ No free tier
**Cost:** ~$15/month

### Alternative: Use Upstash Redis (Free Tier Available)
- **Free Tier:** ✅ Always free
- **What you get:**
  - 10,000 commands/day
  - 256 MB storage
- **URL:** https://upstash.com

---

## 💰 Recommended Setup (Free Tier)

### For Development/Testing:

1. **Backend:** AWS Elastic Beanstalk (Free for 12 months)
2. **Database:** RDS MySQL (Free for 12 months)
3. **File Storage:** S3 (Free for 12 months)
4. **Redis:** Upstash Redis (Always free)

**Total Cost:** $0/month for 12 months

### After Free Tier Expires:

**Option A: Stay on AWS**
- Elastic Beanstalk: ~$15-30/month
- RDS: ~$15/month
- S3: ~$1-5/month
- **Total:** ~$30-50/month

**Option B: Move to Cheaper Alternatives**
- Backend: Railway.app ($5/month) or Render.com (Free tier)
- Database: Railway/Render included
- **Total:** ~$5-10/month

---

## 🚀 Quick Deployment Guide

### Using Elastic Beanstalk (Easiest)

#### Step 1: Install EB CLI
```bash
pip install awsebcli
```

#### Step 2: Initialize EB
```bash
cd /data/Ai_backend/backend
eb init
```
- Select region (e.g., us-east-1)
- Select platform: Node.js
- Select version: Node.js 18 or 20

#### Step 3: Create Environment
```bash
eb create livebid-backend
```

#### Step 4: Configure Environment Variables
```bash
eb setenv \
  DB_HOST=your-rds-endpoint \
  DB_PORT=3306 \
  DB_USERNAME=admin \
  DB_PASSWORD=your-password \
  DB_NAME=Bid_database \
  JWT_SECRET=your-secret \
  REDIS_HOST=your-redis-host \
  PORT=8080
```

#### Step 5: Deploy
```bash
eb deploy
```

#### Step 6: Open Application
```bash
eb open
```

---

## 📋 Pre-Deployment Checklist

### 1. Update Environment Variables
Create `.env` file with production values:
```env
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=3306
DB_USERNAME=admin
DB_PASSWORD=secure-password
DB_NAME=Bid_database
JWT_SECRET=your-production-secret-key
REDIS_HOST=your-redis-host
REDIS_PORT=6379
PORT=8080
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

### 2. Update CORS Settings
In `src/main.ts`, update CORS origin:
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'https://your-frontend-domain.com',
  credentials: true,
});
```

### 3. Create `.ebignore` File
```
node_modules/
dist/
.env
*.log
.git/
```

### 4. Update `package.json` Scripts
```json
{
  "scripts": {
    "start": "node dist/main",
    "build": "nest build"
  }
}
```

---

## 🆓 Alternative Free Platforms (Not AWS)

### 1. Railway.app
- **Free Tier:** ✅ $5 credit/month (enough for small projects)
- **Pros:** Very easy, includes database
- **URL:** https://railway.app

### 2. Render.com
- **Free Tier:** ✅ Free tier available
- **Pros:** Free PostgreSQL, easy deployment
- **URL:** https://render.com

### 3. Fly.io
- **Free Tier:** ✅ Always free (limited)
- **Pros:** Good for Node.js apps
- **URL:** https://fly.io

### 4. Heroku
- **Free Tier:** ❌ No longer free (removed in 2022)
- **Cost:** $7/month minimum

### 5. Vercel (Frontend) + Railway (Backend)
- **Vercel:** Free for frontend
- **Railway:** $5/month for backend
- **Total:** $5/month

---

## 💡 Recommended Approach

### For Learning/Testing (Free):
1. **AWS Elastic Beanstalk** - Deploy backend (Free 12 months)
2. **RDS MySQL** - Database (Free 12 months)
3. **S3** - Image storage (Free 12 months)
4. **Upstash Redis** - Redis cache (Always free)

### For Production (After Free Tier):
1. **Railway.app** - $5/month (includes database)
2. **Render.com** - Free tier available
3. **DigitalOcean** - $6/month droplet

---

## 📝 AWS Account Setup

### Step 1: Create AWS Account
1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Provide credit card (won't be charged for free tier)
4. Verify identity

### Step 2: Enable Free Tier Monitoring
1. Go to AWS Billing Dashboard
2. Enable "Free Tier Usage Alerts"
3. Set alerts at 80% of free tier limits

### Step 3: Set Up IAM User
1. Create IAM user (don't use root account)
2. Attach policies: `AWSElasticBeanstalkFullAccess`, `AmazonRDSFullAccess`, `AmazonS3FullAccess`
3. Generate access keys

---

## ⚠️ Important Notes

1. **Free Tier Limits:**
   - 750 hours/month = ~31 days (enough for 1 instance running 24/7)
   - Monitor usage in AWS Billing Dashboard

2. **Avoid Charges:**
   - Stop instances when not in use
   - Delete unused resources
   - Set up billing alerts
   - Use only free tier eligible services

3. **After 12 Months:**
   - Free tier expires
   - You'll be charged for usage
   - Consider migrating to cheaper alternatives

---

## 🔗 Useful Links

- **AWS Free Tier:** https://aws.amazon.com/free/
- **Elastic Beanstalk:** https://aws.amazon.com/elasticbeanstalk/
- **RDS Free Tier:** https://aws.amazon.com/rds/free/
- **S3 Free Tier:** https://aws.amazon.com/s3/pricing/

---

## 📞 Support

If you need help with deployment, refer to:
- AWS Documentation
- AWS Free Tier FAQ
- AWS Support (Basic support is free)

---

**Note:** AWS Free Tier is for **12 months**, not 6 months. But it's perfect for deploying mini projects and learning!

