# Installation & Setup Guide

## Prerequisites
- Node.js >= 16.x
- MongoDB >= 5.x
- npm or yarn

## Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

New dependencies added:
- `compression` - Response compression middleware
- `express-rate-limit` - API rate limiting
- `helmet` - Security headers
- `nodemon` - Development auto-reload (dev dependency)

## Step 2: Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update the `.env` file with your values:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/codesync
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
```

## Step 3: Create MongoDB Indexes

The application will automatically create indexes on startup. To manually create indexes:

```bash
mongosh
use codesync

# Session indexes
db.sessions.createIndex({ "sessionCode": 1, "status": 1 })
db.sessions.createIndex({ "host": 1, "status": 1 })
db.sessions.createIndex({ "sessionCode": 1 })
db.sessions.createIndex({ "status": 1 })

# CodeSnippet indexes
db.codesnippets.createIndex({ "sessionId": 1, "lastUpdated": -1 })
db.codesnippets.createIndex({ "sessionId": 1 })
```

## Step 4: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

No new frontend dependencies required - using existing packages more efficiently.

## Step 5: Run the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Production Mode

**Build Frontend:**
```bash
cd frontend
npm run build
```

**Start Backend:**
```bash
cd backend
NODE_ENV=production npm start
```

The frontend will be served from the backend in production mode.

## Step 6: Verify Installation

1. Open http://localhost:5173 (dev) or http://localhost:5000 (prod)
2. Create an account
3. Create a new session
4. Open the same session in another browser/incognito window
5. Test real-time collaboration

## Performance Verification

### Check Health Endpoint
```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-01-08T..."
}
```

### Monitor MongoDB Performance
```bash
mongosh
use codesync
db.sessions.getIndexes()
db.codesnippets.getIndexes()
```

### Check Compression
```bash
curl -I -H "Accept-Encoding: gzip" http://localhost:5000/api/health
```

Should see `Content-Encoding: gzip` in headers.

## Troubleshooting

### Port Already in Use
```bash
# Find process on port 5000
netstat -ano | findstr :5000

# Kill process (Windows)
taskkill /PID <PID> /F

# Or change PORT in .env
PORT=5001
```

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Start MongoDB service (Windows)
net start MongoDB

# Start MongoDB service (Linux/Mac)
sudo systemctl start mongod
```

### Socket.IO Connection Issues
- Ensure FRONTEND_URL in backend .env matches your frontend URL
- Check CORS settings in backend/index.js
- Verify WebSocket is not blocked by firewall

### High Memory Usage
- Increase Node.js memory limit:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

- Clean up old sessions:
```javascript
// Run in mongosh
db.sessions.deleteMany({ status: "ended", createdAt: { $lt: new Date(Date.now() - 7*24*60*60*1000) } })
```

## Next Steps

1. **Enable Redis (Optional - for scaling):**
   - Install Redis: `npm install redis @socket.io/redis-adapter`
   - Configure Redis adapter in socket.js
   - Add Redis connection to config.js

2. **Add Logging (Optional):**
   - Install Winston: `npm install winston`
   - Configure structured logging
   - Add log rotation

3. **Deploy to Production:**
   - Set up reverse proxy (Nginx)
   - Configure SSL/TLS
   - Set up process manager (PM2)
   - Configure environment variables

## Support

For issues or questions:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Include error logs and environment details
