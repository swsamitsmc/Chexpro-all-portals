# ChexPro Deployment Guide

## Pre-Deployment Checklist

### Environment Configuration
- [ ] Set `NODE_ENV=production`
- [ ] Configure `SESSION_SECRET` (32+ character random string)
- [ ] Configure `CSRF_SECRET` (32+ character random string)
- [ ] Set `HEALTH_CHECK_TOKEN` for monitoring
- [ ] Set `METRICS_TOKEN` for performance monitoring

### Database Configuration
- [ ] Set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- [ ] Configure `DB_QUEUE_LIMIT` (default: 10)
- [ ] Run database schema initialization
- [ ] Create initial admin user if needed

### SMTP Configuration
- [ ] Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- [ ] Set `SMTP_SECURE=true` for production
- [ ] Configure `CONTACT_RECIPIENT` and `DEMO_RECIPIENT`

### Security Configuration
- [ ] Set `COOKIE_DOMAIN` for multi-subdomain support
- [ ] Configure `ADMIN_IP_WHITELIST` if needed
- [ ] Set appropriate `CORS` origins
- [ ] Configure `ALLOWED_ORIGINS` for form submissions

### Frontend Configuration
- [ ] Set `VITE_API_BASE_URL` to production API URL
- [ ] Configure `VITE_GA_MEASUREMENT_ID` for analytics
- [ ] Set `VITE_ENABLE_ANALYTICS=true`
- [ ] Configure `VITE_ENABLE_MARKETING` as needed

## Deployment Steps

1. **Validate Configuration**
   ```bash
   npm run validate-config
   ```

2. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Install Dependencies**
   ```bash
   cd server
   npm install --production
   ```

4. **Initialize Database**
   ```bash
   npm start
   # Database schema will be initialized automatically
   ```

5. **Start Application**
   ```bash
   npm start
   ```

## Health Checks

- **Application Health**: `GET /health`
- **API Documentation**: `GET /api/docs`
- **Performance Metrics**: `GET /api/metrics` (requires auth)

## Security Considerations

- All sensitive endpoints require authentication
- CSRF protection enabled for all forms
- Rate limiting implemented on all endpoints
- Input sanitization applied to all requests
- Comprehensive logging and error tracking
- Environment-specific error handling

## Monitoring

The application includes built-in monitoring:
- Performance metrics tracking
- Error logging and statistics
- Request/response time monitoring
- Memory usage tracking

Access metrics at `/api/metrics` with proper authentication.

## Troubleshooting

1. **Database Connection Issues**
   - Verify database credentials
   - Check network connectivity
   - Ensure database server is running

2. **SMTP Issues**
   - Verify SMTP credentials
   - Check firewall settings
   - Test with email provider

3. **Authentication Issues**
   - Verify SESSION_SECRET is set
   - Check CSRF_SECRET configuration
   - Ensure database schema is initialized

## Support

For deployment support, refer to the technical documentation or contact the development team.