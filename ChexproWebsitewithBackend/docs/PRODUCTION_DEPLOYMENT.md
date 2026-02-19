# ChexPro Production Deployment Guide

## Overview
This document provides step-by-step instructions for deploying the ChexPro website from local development to GitHub and then to Oracle Cloud Infrastructure (OCI).

## Production Environment Details

### Server Information
- **Server IP:** 132.145.96.174
- **SSH User:** chexproadmin
- **SSH Command:** `ssh chexproadmin@132.145.96.174`

### Directory Structure
- **Frontend Live:** `/var/www/chexpro-frontend`
- **Backend Live:** `/var/www/chexpro-backend`
- **Build Directory:** `/var/www/chexpro-frontend-build`
- **Environment Files:** 
  - `/var/www/chexpro-backend/.env` (permissions: 600)
  - `/var/www/chexpro-frontend/.env` (permissions: 600)

### Service Management
- **Backend Service:** Managed by PM2 as `chexpro-backend`
- **Status Check:** `pm2 status`
- **Service Restart:** `pm2 reload chexpro-backend --update-env`

## Deployment Process

### Phase 1: Local to GitHub

#### 1. Pre-deployment Validation
```bash
# Navigate to project root
cd "ChexproWebsitewithBackend - to fix"

# Validate backend configuration
cd server
npm run validate-config

# Run linting checks
npm run lint

# Navigate to frontend and run checks
cd ../frontend
npm run lint
npm run build  # Test build locally
```

#### 2. Database Schema Preparation
```bash
# Ensure database schema is up to date
# Review server/sql/schema.sql for any new changes
# Document any manual database updates needed
```

#### 3. Environment Variable Updates
```bash
# Verify all required environment variables are documented
# Check that production .env templates are current
# Ensure no sensitive data is committed to repository
```

#### 4. Commit and Push to GitHub
```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "Production deployment: [describe changes]"

# Push to GitHub
git push origin master
```

### Phase 2: GitHub to OCI Production

#### 1. Connect to OCI Server
```bash
ssh chexproadmin@132.145.96.174
```

#### 2. Navigate to Build Directory and Update Code
```bash
# Navigate to build directory
cd /var/www/chexpro-frontend-build

# Reset any local changes
git reset --hard HEAD

# Pull latest code from GitHub
git pull origin master
```

#### 3. Database Updates (If Required)
```bash
# Check if database schema updates are needed
# Navigate to backend directory
cd /var/www/chexpro-backend

# Backup database before changes (recommended)
mysqldump -u [username] -p chexpro_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Apply any manual database updates if needed
# The application will auto-initialize schema on startup
```

#### 4. Build Frontend
```bash
# Navigate to frontend directory in build location
cd /var/www/chexpro-frontend-build/frontend

# Install/update dependencies
npm install

# Build production frontend
npm run build
```

#### 5. Deploy Frontend
```bash
# Sync built assets to live directory (protecting .env)
sudo rsync -av --delete --exclude '.env' /var/www/chexpro-frontend-build/frontend/dist/ /var/www/chexpro-frontend/
```

#### 6. Deploy Backend
```bash
# Sync backend source files to live directory (protecting .env)
sudo rsync -av --delete --exclude '.env' /var/www/chexpro-frontend-build/server/ /var/www/chexpro-backend/
```

#### 7. Update Backend Dependencies
```bash
# Navigate to live backend directory
cd /var/www/chexpro-backend

# Install production dependencies
npm install --production
```

#### 8. Environment Configuration Validation
```bash
# Validate production environment configuration
npm run validate-config

# Verify .env file permissions
ls -la .env  # Should show 600 permissions
```

#### 9. Database Initialization Check
```bash
# The application will automatically initialize database schema on startup
# Check logs after restart to ensure successful initialization
```

#### 10. Restart Backend Service
```bash
# Gracefully restart backend service
pm2 reload chexpro-backend --update-env

# Verify service status
pm2 status

# Check service logs
pm2 logs chexpro-backend --lines 50
```

#### 11. Post-Deployment Verification
```bash
# Check application health
curl -H "Authorization: Bearer [HEALTH_CHECK_TOKEN]" http://localhost:3000/health

# Verify frontend is accessible
curl -I http://localhost:80

# Check PM2 service status
pm2 status chexpro-backend

# Monitor logs for any errors
pm2 logs chexpro-backend --lines 20
```

## New Deployment Considerations

### Database Integration
- **Automatic Schema Initialization:** The application now automatically creates database tables on startup
- **User Management:** Ensure initial admin user is created if needed
- **Connection Pooling:** Database connections are now pooled for better performance

### Security Enhancements
- **Session Storage:** Sessions are now stored in database, not memory
- **CSRF Protection:** All forms now require CSRF tokens
- **Rate Limiting:** Enhanced rate limiting is now active
- **Input Sanitization:** All inputs are sanitized before processing

### Monitoring and Logging
- **Winston Logging:** Structured logging is now implemented
- **Performance Metrics:** Available at `/api/metrics` endpoint (requires authentication)
- **Error Tracking:** Comprehensive error tracking is active
- **Health Checks:** Enhanced health checks at `/health` endpoint

### Internationalization
- **Language Files:** New i18n files are included in deployment
- **Language Detection:** Browser language detection is active
- **4 Languages:** English, Spanish, French, and Hindi are supported

## Environment Variables Checklist

### Production Backend (.env)
```bash
NODE_ENV=production
PORT=3000
SESSION_SECRET=[32+ character random string]
CSRF_SECRET=[32+ character random string]
HEALTH_CHECK_TOKEN=[secure random token]
METRICS_TOKEN=[secure random token]
DB_HOST=[database host]
DB_USER=[database username]
DB_PASSWORD=[secure database password]
DB_NAME=chexpro_db
DB_QUEUE_LIMIT=10
SMTP_HOST=[smtp server]
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=[smtp username]
SMTP_PASS=[smtp password]
CONTACT_RECIPIENT=[contact email]
DEMO_RECIPIENT=[demo email]
COOKIE_DOMAIN=[production domain]
```

### Production Frontend (.env)
```bash
VITE_API_BASE_URL=https://[production-domain]
VITE_GA_MEASUREMENT_ID=[google analytics id]
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_MARKETING=true
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Issues
```bash
# Check database service status
sudo systemctl status mysql

# Verify database credentials in .env
# Test database connection manually
mysql -h [DB_HOST] -u [DB_USER] -p [DB_NAME]
```

#### 2. PM2 Service Issues
```bash
# Check PM2 status
pm2 status

# Restart PM2 service
pm2 restart chexpro-backend

# Check PM2 logs
pm2 logs chexpro-backend

# If service won't start, check for port conflicts
netstat -tulpn | grep :3000
```

#### 3. Frontend Build Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for build errors
npm run build
```

#### 4. Permission Issues
```bash
# Fix .env file permissions
chmod 600 /var/www/chexpro-backend/.env
chmod 600 /var/www/chexpro-frontend/.env

# Fix directory ownership if needed
sudo chown -R chexproadmin:chexproadmin /var/www/chexpro-backend
sudo chown -R chexproadmin:chexproadmin /var/www/chexpro-frontend
```

#### 5. SMTP Configuration Issues
```bash
# Test SMTP configuration
# Check logs for email sending errors
pm2 logs chexpro-backend | grep -i smtp

# Verify SMTP credentials and settings
# Test with a simple email send
```

## Rollback Procedure

### If Deployment Fails
```bash
# Stop the current service
pm2 stop chexpro-backend

# Restore from previous backup (if available)
# Or revert to previous Git commit
cd /var/www/chexpro-frontend-build
git reset --hard [previous-commit-hash]

# Rebuild and redeploy
cd frontend
npm run build
sudo rsync -av --delete --exclude '.env' dist/ /var/www/chexpro-frontend/
sudo rsync -av --delete --exclude '.env' ../server/ /var/www/chexpro-backend/

# Restart service
cd /var/www/chexpro-backend
npm install --production
pm2 start chexpro-backend
```

## Security Checklist

- [ ] All environment variables are properly configured
- [ ] .env files have 600 permissions
- [ ] Database credentials are secure
- [ ] SMTP credentials are configured
- [ ] HTTPS is properly configured
- [ ] Security headers are active (via Helmet.js)
- [ ] Rate limiting is functional
- [ ] CSRF protection is active
- [ ] Input sanitization is working
- [ ] Session security is configured
- [ ] Health check endpoint is protected
- [ ] Metrics endpoint requires authentication

## Monitoring After Deployment

### Health Checks
```bash
# Application health
curl -H "Authorization: Bearer [HEALTH_CHECK_TOKEN]" https://[domain]/health

# Performance metrics
curl -H "Authorization: Bearer [METRICS_TOKEN]" https://[domain]/api/metrics
```

### Log Monitoring
```bash
# Monitor application logs
pm2 logs chexpro-backend --lines 50

# Monitor system logs
tail -f /var/log/nginx/error.log  # If using Nginx
tail -f /var/log/apache2/error.log  # If using Apache
```

### Performance Monitoring
- Monitor response times via `/api/metrics` endpoint
- Check memory usage with `pm2 monit`
- Monitor database performance
- Check error rates in application logs

## Support and Escalation

For deployment issues:
1. Check application logs: `pm2 logs chexpro-backend`
2. Verify service status: `pm2 status`
3. Check system resources: `htop` or `top`
4. Review error logs for specific issues
5. Consult troubleshooting section above
6. Contact development team if issues persist

---

**Last Updated:** December 2024  
**Version:** 1.0  
**Next Review:** After each major deployment