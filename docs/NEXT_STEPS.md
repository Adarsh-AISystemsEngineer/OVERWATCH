# Overwatch - Next Steps

## Current Status

**Completed:**
- ✅ Full monorepo structure with 4 services (client, server, worker, llm-service)
- ✅ Shared TypeScript types, constants, and Zod schemas
- ✅ MongoDB schema with geospatial indexes
- ✅ Express API with 6 endpoints (3 missing persons + 3 analytics)
- ✅ ETL worker pipeline with data transformation & validation
- ✅ Maharashtra & Karnataka scraper templates
- ✅ **Delhi ZIPNET scraper for multi-state data (NEW)**
- ✅ React frontend with interactive map and filters
- ✅ FastAPI LLM service with Qwen2.5 integration
- ✅ Docker setup for all services
- ✅ GitHub Actions CI/CD pipelines
- ✅ Comprehensive documentation

**Just Integrated:**
- ✅ Delhi Police ZIPNET database scraper (covers Delhi + 7 NCR states, 636K+ records)
- ✅ Worker pipeline orchestration with all 3 states
- ✅ Constants and data sources updated

---

## Phase 1: Local Testing & Validation

### Task 1.1: Test Delhi ZIPNET Scraper
**Priority**: 🔴 CRITICAL  
**Owner**: You / Agent  
**Estimated Time**: 30-60 minutes

**What**: Run the Delhi scraper locally and verify it correctly parses the ZIPNET website.

**Steps**:
1. Set up local MongoDB (use MongoDB Atlas free tier or local instance)
   ```bash
   # Option A: Use MongoDB Atlas
   # Create cluster at mongodb.com, get connection string
   
   # Option B: Use local MongoDB
   mongod --dbpath ./data
   ```

2. Configure environment variables
   ```bash
   # Create .env.local in monorepo root
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/overwatch
   NODE_ENV=development
   ```

3. Run worker to test Delhi scraper
   ```bash
   npm install  # Install all dependencies
   npm run dev --workspace=overwatch-worker
   ```

4. Monitor logs for:
   - ✅ HTML parsing success (rows extracted)
   - ✅ Data validation (names, dates, locations)
   - ✅ Coordinates assigned correctly per state
   - ✅ Records inserted into MongoDB
   - ❌ Parsing errors → Check CSS selectors
   - ❌ Date format errors → Check `parseIndianDate()` utility
   - ❌ Age validation errors → Check `validateAge()` utility

5. Expected output in logs:
   ```
   [Delhi ZIPNET] Scraping started...
   [Delhi ZIPNET] Fetched 636,131 records from ZIPNET
   [Delhi ZIPNET] Parsed 50 rows (sample from first page)
   [Delhi ZIPNET] Valid records: 48
   [Delhi ZIPNET] Invalid records: 2
   [Delhi ZIPNET] Inserted: 47
   [Delhi ZIPNET] Duplicates skipped: 1
   ```

6. Verify in MongoDB:
   ```bash
   # Connect to MongoDB
   mongo <connection_string>
   
   # Query
   db.missingpersons.countDocuments({ sourceState: "Delhi" })
   db.missingpersons.find({ sourceState: "Delhi" }).limit(5)
   ```

**Success Criteria**:
- [ ] No parsing errors in logs
- [ ] Records visible in MongoDB
- [ ] Coordinates assigned (not null)
- [ ] Status field populated (missing/found)
- [ ] sourceState correctly set to "Delhi"

**If Scraper Fails**:
- Check console errors for HTML selector issues
- Inspect actual ZIPNET HTML: Right-click → Inspect on website
- Update selectors in `apps/worker/src/scrapers/delhiZIPNET.ts`
- Common issues:
  - Table structure changed
  - Image alt text format differs
  - Date format unexpected

---

### Task 1.2: Test Maharashtra & Karnataka Scrapers
**Priority**: 🟡 HIGH  
**Owner**: You / Agent  
**Estimated Time**: 20-30 minutes

**What**: Verify Maharashtra and Karnataka scrapers also work correctly.

**Steps**:
1. Find actual websites for these states
   - Maharashtra: Check if state police have similar database
   - Karnataka: Check if state police have similar database

2. If websites exist:
   - Update selectors in `apps/worker/src/scrapers/stateSrapers.ts`
   - Run scraper locally
   - Verify data in MongoDB

3. If websites don't exist:
   - Keep as templates for future use
   - Document placeholder status

**Success Criteria**:
- [ ] Scrapers run without errors
- [ ] State-specific records in MongoDB
- [ ] Or clear documentation if websites unavailable

---

### Task 1.3: Test Frontend UI
**Priority**: 🟡 HIGH  
**Estimated Time**: 20-30 minutes

**What**: Verify React frontend displays Delhi data correctly.

**Steps**:
1. Start backend server
   ```bash
   npm run dev --workspace=overwatch-server
   ```

2. Start frontend in separate terminal
   ```bash
   npm run dev --workspace=overwatch-client
   ```

3. Open http://localhost:5173 in browser

4. Test features:
   - [ ] Map loads with markers
   - [ ] Delhi records visible on map (red pins for missing, green for found)
   - [ ] Filter by state shows Delhi data
   - [ ] Filter by status works
   - [ ] Clicking marker shows person details
   - [ ] Zoom/pan works smoothly
   - [ ] Performance acceptable (no lag with 100K+ records)

5. Performance testing:
   - [ ] Map renders within 2 seconds
   - [ ] Filter response time < 500ms
   - [ ] No memory leaks on filter changes

**Success Criteria**:
- [ ] UI loads without errors
- [ ] Delhi data displays correctly
- [ ] Filters work as expected
- [ ] Performance acceptable

---

## Phase 2: Production Deployment

### Task 2.1: Deploy Backend to Railway
**Priority**: 🟠 MEDIUM  
**Owner**: You / Agent  
**Estimated Time**: 30-45 minutes

**What**: Deploy Express server to Railway for production use.

**Steps**:
1. Create Railway account (https://railway.app)

2. Connect GitHub repository
   - Authorize Railway
   - Select `overwatch` repository

3. Create services in Railway:
   - Service 1: Backend (Node.js)
     - Build command: `npm run build --workspace=overwatch-server`
     - Start command: `npm run start --workspace=overwatch-server`
     - Environment: Set `MONGODB_URI` and `NODE_ENV=production`
   
   - Service 2: Worker (Node.js)
     - Build command: `npm run build --workspace=overwatch-worker`
     - Start command: `npm run start --workspace=overwatch-worker`
     - Environment: Set `MONGODB_URI`
     - Cron: Configure scheduled job (every 6 hours)

4. Set environment variables:
   ```
   MONGODB_URI=<your-atlas-connection-string>
   NODE_ENV=production
   LOG_LEVEL=info
   ```

5. Deploy and test:
   ```bash
   # After Railway deployment
   curl https://<railway-domain>/api/health
   curl https://<railway-domain>/api/analytics/statistics
   ```

6. Verify worker runs successfully:
   - Check Railway logs
   - Confirm new records in MongoDB

**Success Criteria**:
- [ ] Backend deployed and responds to requests
- [ ] Health check passes
- [ ] Worker job runs on schedule
- [ ] Database connection works
- [ ] No errors in Railway logs

---

### Task 2.2: Deploy Frontend to Vercel
**Priority**: 🟠 MEDIUM  
**Owner**: You / Agent  
**Estimated Time**: 15-20 minutes

**What**: Deploy React app to Vercel for fast CDN delivery.

**Steps**:
1. Create Vercel account (https://vercel.com)

2. Connect GitHub:
   - Import `overwatch` repository
   - Configure build:
     - Build command: `npm run build --workspace=overwatch-client`
     - Output directory: `apps/client/dist`

3. Environment variables:
   ```
   VITE_API_BASE_URL=https://<railway-domain>/api
   ```

4. Deploy:
   - Vercel auto-deploys on git push
   - Monitor deployment logs
   - Test production URL

5. Verify:
   - [ ] Frontend loads
   - [ ] API calls work (check Network tab)
   - [ ] Map displays correctly
   - [ ] Filters functional

**Success Criteria**:
- [ ] Frontend deployed to Vercel domain
- [ ] Connected to production API
- [ ] All features working
- [ ] Fast load times (< 3 seconds)

---

### Task 2.3: Configure GitHub Actions Secrets
**Priority**: 🟠 MEDIUM  
**Owner**: You / Agent  
**Estimated Time**: 10-15 minutes

**What**: Set up CI/CD pipeline to auto-deploy on code changes.

**Steps**:
1. Go to GitHub repo → Settings → Secrets and variables → Actions

2. Add secrets:
   ```
   MONGODB_URI = <atlas-connection-string>
   RAILWAY_TOKEN = <railway-api-token>
   VERCEL_TOKEN = <vercel-token>
   ```

3. Verify workflows in `.github/workflows/`:
   - `main.yml` - Runs on push to main (tests, builds, deploys)
   - `scheduled-scraper.yml` - Runs every 6 hours (scraper job)

4. Test pipeline:
   - Push small change to main branch
   - Monitor Actions tab
   - Verify auto-deployment

**Success Criteria**:
- [ ] Secrets configured
- [ ] GitHub Actions workflows active
- [ ] Auto-deployment working
- [ ] Scheduled scraper running

---

## Phase 3: Data Validation & Monitoring

### Task 3.1: Validate Data Quality
**Priority**: 🟠 MEDIUM  
**Owner**: You / Agent  
**Estimated Time**: 30-45 minutes

**What**: Ensure scraped data meets quality standards.

**Steps**:
1. Run analytics queries:
   ```bash
   # Check total records per state
   curl https://api.overwatch.app/api/analytics/statistics
   
   # Expected response:
   {
     "totalRecords": 500000,
     "byState": {
       "Delhi": 150000,
       "Maharashtra": 200000,
       "Karnataka": 150000
     },
     "byStatus": {
       "missing": 420000,
       "found": 80000
     }
   }
   ```

2. Verify geolocation data:
   ```bash
   # Test geospatial query
   curl "https://api.overwatch.app/api/missing-persons/nearby?latitude=28.7041&longitude=77.1025&radiusKm=25"
   
   # Should return records near Delhi center
   ```

3. Check hotspots:
   ```bash
   curl https://api.overwatch.app/api/analytics/hotspots
   
   # Verify risk scores between 0-100
   # Verify states with highest risk identified
   ```

4. Validation checklist:
   - [ ] No null coordinates (except where unavailable)
   - [ ] Ages in range 0-150
   - [ ] Dates are valid
   - [ ] Status is "missing" or "found"
   - [ ] sourceURL matches ZIPNET URL
   - [ ] Names not empty
   - [ ] No duplicate records

**Success Criteria**:
- [ ] 95%+ of records have valid data
- [ ] Geospatial queries work
- [ ] Hotspots calculated correctly
- [ ] Statistics accurate

---

### Task 3.2: Set Up Monitoring & Alerts
**Priority**: 🟢 LOW  
**Owner**: You / Agent  
**Estimated Time**: 20-30 minutes

**What**: Monitor scraper health and API availability.

**Steps**:
1. Add monitoring to Railway:
   - Enable logging
   - Set up alerts for errors
   - Monitor CPU/memory usage

2. Create dashboard:
   ```bash
   # Use Railway dashboard to view:
   - Request rate
   - Error rate
   - Response time
   - Database queries
   ```

3. Set alerts for:
   - [ ] Scraper failed (> 0 errors in run)
   - [ ] API error rate > 1%
   - [ ] Database connection failed
   - [ ] High memory usage (> 500MB)

4. Optional: Use third-party monitoring
   - New Relic, DataDog, or Sentry for APM

**Success Criteria**:
- [ ] Monitoring dashboard accessible
- [ ] Alerts configured
- [ ] Logs persisted
- [ ] Can trace issues quickly

---

## Phase 4: Feature Enhancements (Optional)

### Task 4.1: Implement Geocoding
**Priority**: 🟢 LOW  
**Estimated Time**: 2-3 hours

**What**: Convert addresses to precise coordinates instead of using state centers.

**Implementation**:
- Use Nominatim API (free, open-source)
- Or Google Maps API (paid, more accurate)
- Update `DelhiZIPNETScraper` to geocode locations
- Cache results to avoid rate limiting

**Benefits**:
- More accurate map pins
- Better hotspot analysis
- Improved user experience

---

### Task 4.2: Add Image Processing
**Priority**: 🟢 LOW  
**Estimated Time**: 3-4 hours

**What**: Download and process person images from ZIPNET.

**Implementation**:
- Download images from ZIPNET
- Extract face embeddings (using face-api or similar)
- Store URLs locally
- Enable reverse image search matching

**Benefits**:
- Visual identification
- Face matching across websites
- Better user interface

---

### Task 4.3: Real-Time Updates
**Priority**: 🟢 LOW  
**Estimated Time**: 4-5 hours

**What**: Add WebSocket support for live data updates.

**Implementation**:
- Add Socket.IO to backend
- Broadcast new records to connected clients
- Update map in real-time
- Show recent cases notification

**Benefits**:
- Live data sync
- Real-time alerts
- Better UX for NGOs/police

---

## Immediate Action Items (This Week)

| Priority | Task | Time | Status |
|----------|------|------|--------|
| 🔴 CRITICAL | Test Delhi ZIPNET scraper locally | 1 hour | ⏳ TODO |
| 🟡 HIGH | Test frontend with real data | 30 min | ⏳ TODO |
| 🟠 MEDIUM | Deploy backend to Railway | 45 min | ⏳ TODO |
| 🟠 MEDIUM | Deploy frontend to Vercel | 20 min | ⏳ TODO |
| 🟠 MEDIUM | Configure GitHub Actions secrets | 15 min | ⏳ TODO |
| 🟠 MEDIUM | Validate scraped data quality | 45 min | ⏳ TODO |

---

## Critical Fixes Before Production

```markdown
## Potential Issues to Check

1. **Image alt text parsing**
   - Verify actual format on ZIPNET
   - May need to adjust regex in DelhiZIPNETScraper

2. **Date format variations**
   - Check all possible date formats on ZIPNET
   - Update parseIndianDate() if needed

3. **State coordinate accuracy**
   - Current: Hardcoded state centers
   - Improve: Use Nominatim for real addresses

4. **Rate limiting**
   - ZIPNET may block rapid requests
   - Add delays between requests if needed

5. **Database indexes**
   - Verify indexes created on first insert
   - Monitor query performance as data grows
```

---

## Success Metrics

When all tasks complete, you should have:

- ✅ **Working Production System**
  - Frontend: https://overwatch.vercel.app
  - API: https://overwatch.railway.app/api
  - Worker: Running on schedule
  - Database: 500K+ records from 3 states

- ✅ **Data Quality**
  - 95%+ valid records
  - Accurate geolocation
  - No duplicates
  - Updated every 6 hours

- ✅ **User Experience**
  - Fast map rendering (< 2 sec)
  - Smooth filtering (< 500 ms)
  - Accessible to NGOs/public
  - Mobile-friendly

- ✅ **Operational Excellence**
  - Automated CI/CD pipeline
  - Monitoring & alerts active
  - Logs collected
  - Ready for scaling

---

## Questions to Clarify

Before starting, consider:

1. **Which states to include?**
   - Currently: Delhi, Maharashtra, Karnataka
   - Delhi ZIPNET covers: Delhi + 7 NCR states (628K+ records)
   - Other states: Unknown if public databases exist

2. **MongoDB Atlas setup?**
   - Free tier: 512 MB storage (may be tight for 500K records)
   - Recommend: M0 cluster or paid tier

3. **Who are primary users?**
   - NGOs / Police departments?
   - General public?
   - This affects UI/privacy design

4. **Image storage?**
   - Download ZIPNET images → S3/Cloudinary?
   - Or link directly to ZIPNET?

---

**Created**: February 15, 2026  
**Status**: Ready for Phase 1 Testing  
**Next Review**: After local validation complete
