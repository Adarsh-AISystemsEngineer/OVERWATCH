# Overwatch - Missing Persons Mapping Platform

## System Architecture

### Overview

Overwatch is a production-grade missing persons mapping platform for India with the following architecture:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (Vercel)                            │
│                    React + Vite + TypeScript                        │
│              (Leaflet Map, Zustand State, TailwindCSS)              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
                               ↓
┌──────────────────────────────────────────────────────────────────────┐
│                      Backend API (Railway)                           │
│                    Node.js + Express + MongoDB                      │
│          (Validation, Filtering, Aggregation, Caching)             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ 
                ┌──────────────┼──────────────┐
                ↓              ↓              ↓
         ┌─────────────┐ ┌──────────┐ ┌────────────────┐
         │  MongoDB    │ │ Worker   │ │  LLM Service   │
         │  (Atlas)    │ │(Railway) │ │  (Docker)      │
         │             │ │          │ │                │
         │ - Indexes   │ │ - Scraper│ │ - FastAPI      │
         │ - GeoJSON   │ │ - ETL    │ │ - Qwen2.5      │
         │ - Validation│ │ - Logs   │ │ - Extraction   │
         └─────────────┘ └──────────┘ └────────────────┘
```

### Components

#### 1. **Frontend (React + Vite)**
- **Location**: `apps/client`
- **Deployment**: Vercel
- **Features**:
  - Interactive Leaflet map with OpenStreetMap
  - Real-time filtering (gender, age, date, location)
  - Hotspot visualization
  - Responsive UI with TailwindCSS
  - Zero login/signup

#### 2. **Backend API (Node.js + Express)**
- **Location**: `apps/server`
- **Deployment**: Railway
- **Features**:
  - RESTful API endpoints
  - MongoDB aggregation pipelines
  - In-memory caching (5-60 min TTL)
  - Geospatial queries (2dsphere indexing)
  - Rate limiting & CORS
  - Error handling & validation (Zod)

#### 3. **Data Worker (ETL Pipeline)**
- **Location**: `apps/worker`
- **Deployment**: Railway scheduled job (every 6 hours)
- **Features**:
  - State-based scraper modules (Maharashtra, Karnataka)
  - HTML parsing with Cheerio
  - Data transformation & validation
  - Deduplication by hash
  - Error logging with context
  - Database insertion with conflict handling

#### 4. **LLM Service (FastAPI)**
- **Location**: `apps/llm-service`
- **Deployment**: Docker container
- **Features**:
  - Qwen2.5-7B-Instruct model
  - Structured JSON extraction from HTML
  - Retry mechanism with exponential backoff
  - Never writes to database
  - Schema validation
  - Response caching

#### 5. **Shared Packages**
- **Location**: `packages/shared`
- **Features**:
  - Zod schemas for validation
  - TypeScript types
  - Constants & enums
  - Used by all services

---

## MongoDB Schema

### MissingPerson Collection

```javascript
{
  _id: ObjectId,
  name: String (required),
  age: Number (required, 0-150),
  gender: Enum("male", "female", "other"),
  lastSeenDate: Date (required),
  lastKnownLocation: String (required),
  geolocation: {
    type: "Point",
    coordinates: [longitude, latitude]  // 2dsphere indexed
  },
  status: Enum("missing", "found"),
  description: String (optional),
  photoUrl: String (optional, URL),
  contactName: String (optional),
  contactPhone: String (optional),
  sourceURL: String (required),
  sourceState: String (required),
  dataHash: String (unique, deduplication),
  createdAt: Date (immutable),
  updatedAt: Date
}
```

### Indexes

```
1. { "geolocation.coordinates": "2dsphere" }     // Geographic queries
2. { "status": 1, "lastSeenDate": -1 }           // Status + time filtering
3. { "sourceState": 1, "status": 1 }             // State filtering
4. { "gender": 1, "age": 1, "status": 1 }        // Demographic filtering
5. { "dataHash": 1 } (unique, sparse)            // Deduplication
```

---

## API Endpoints

### Missing Persons

```
GET /api/missing-persons
Query params: gender, ageMin, ageMax, status, startDate, endDate, state, limit, offset
Returns: { results: [...], pagination: { total, pages, limit, offset } }

GET /api/missing-persons/:id
Returns: Single missing person object

GET /api/missing-persons/nearby
Query params: longitude, latitude, radiusKm, limit
Returns: { centerPoint, radiusKm, results: [...] }
```

### Analytics

```
GET /api/analytics/hotspots
Returns: { hotspots: [...], totalHotspots: N, generatedAt: timestamp }
- Groups by state
- Calculates risk score: missing/(missing+found) * 100
- Aggregates in 90-day window

GET /api/analytics/trends
Returns: { trends: [...], period: "Last 12 months" }
- Monthly aggregations
- Resolution rates
- Average ages

GET /api/analytics/statistics
Returns: { totals, byGender, byState, ageRanges }
- Overall statistics
- Faceted aggregations
```

---

## Data Pipeline (Worker)

### Flow

```
[Source HTML]
     ↓
[State Scraper] → [HTTP Client with retries] → [HTML parsing]
     ↓
[Data Transformer] → [Validation] → [Deduplication by hash]
     ↓
[Error Logger] ← [Invalid records]
     ↓
[Database Service] → [Insert/Update] → [MongoDB]
     ↓
[Statistics] → [Logging]
```

### Scraper Features

- **Retry mechanism**: 3 attempts with exponential backoff
- **Timeout**: 30 seconds per request
- **User-Agent**: Identifies as OverwatchBot
- **Error logging**: JSON logs with context
- **Validation before insertion**: Schema checking
- **Deduplication**: SHA256 hash of (name + date + sourceURL)

---

## LLM Integration (Optional)

### Architecture

```
[HTML Content]
     ↓
[FastAPI Endpoint: /api/extract]
     ↓
[Qwen2.5-7B-Instruct Model]
     ↓
[JSON Response Parsing]
     ↓
[Schema Validation]
     ↓
[Return to Worker] → [Never writes to DB]
```

### Key Constraints

- **No geocoding**: LLM only extracts text data
- **No DB writes**: Returns JSON only
- **Low temperature**: 0.1 for consistent extractions
- **Retry mechanism**: Up to 3 attempts
- **Timeout**: 60 seconds per request

---

## CI/CD Pipeline

### Main Workflow (`.github/workflows/ci-cd.yml`)

1. **Validate** (on PR/push)
   - Install dependencies
   - Lint (ESLint)
   - Type check (TypeScript)
   - Run tests (Vitest)

2. **Build** (on PR/push)
   - Compile TypeScript
   - Build Vite frontend
   - Build Docker images

3. **Deploy** (on main push only)
   - Deploy client → Vercel
   - Deploy server → Railway
   - Deploy worker → Railway
   - Build & push LLM image → GitHub Container Registry

4. **Smoke Tests** (post-deploy)
   - Health checks
   - Database connectivity
   - Slack notifications

### Scheduled Worker (`.github/workflows/scheduled-scraper.yml`)

- **Trigger**: Every 6 hours
- **Job**: Run full ETL pipeline
- **Logging**: Upload logs as artifacts
- **Notifications**: Slack alerts on failure

---

## Performance Optimizations

### 1. **Database**
- 2dsphere indexes for geospatial queries
- Compound indexes for common filters
- Sparse index on dataHash (unique)

### 2. **Caching**
- In-memory cache: 5-300 seconds TTL
- Cache key: `${baseUrl}${fullUrl}`
- Automatic expiration

### 3. **Pagination**
- Default: 20 records per page
- Max: 100 records
- Offset-based pagination

### 4. **Aggregation**
- Pre-computed hotspot aggregation (1-hour cache)
- Faceted aggregations for statistics
- Efficient $group and $bucket stages

### 5. **API**
- GZIP compression
- Connection pooling
- Request timeout: 15 seconds

---

## Security & Ethics

### Data Protection

1. **Source Attribution**
   ```
   Every record includes:
   - sourceURL: Original police website URL
   - sourceState: Source state name
   - createdAt: Timestamp
   ```

2. **Read-Only Architecture**
   - No data entry form
   - No user uploads
   - Only scraper writes (background job)

3. **Rate Limiting**
   - 60 requests/minute per IP
   - 1000 requests/hour per IP

4. **Data Privacy**
   - No authentication required
   - No user data collection
   - Public data only

### Ethical Guidelines

- **Accuracy**: Hash deduplication prevents duplicates
- **Attribution**: Always cite police source
- **Timeliness**: Updated every 6 hours
- **Transparency**: Disclaimer on UI
- **Disclaimer**: "Information may not be real-time. For emergencies, contact local police."

---

## Deployment

### Prerequisites

```bash
- Node.js 18+
- npm/yarn
- MongoDB Atlas account
- Vercel account
- Railway account
- GitHub Actions enabled
```

### Environment Variables

**Server** (`.env`)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/overwatch
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://overwatch.vercel.app
```

**Worker** (`.env`)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/overwatch
NODE_ENV=production
```

**LLM Service** (`.env`)
```
FASTAPI_ENV=production
LOG_LEVEL=info
```

### Local Development

```bash
# Install
npm install

# Develop (runs all services with hot reload)
npm run dev

# Docker Compose
docker-compose up

# Build for production
npm run build

# Deploy to Railway
npm install -g @railway/cli
railway up
```

---

## Constraints & Limitations

### V1 Scope

- **States**: Maharashtra, Karnataka only (easily scalable)
- **No real-time**: 6-hour update cycle
- **No geocoding**: Uses approximate state coordinates
- **No LLM**: Optional, for future enhancement
- **No user accounts**: Public read-only system

### Technical Constraints

- **No LLM geocoding**: Coordinates are state-center or extracted
- **No LLM DB writes**: All data validated and written by worker
- **No real-time scraping**: Scheduled background jobs only
- **Monorepo deployment**: All services deploy together

---

## Future Enhancements

1. **More states**: Add scraper modules for other states
2. **Real geocoding**: Integrate Nominatim or Google Maps API
3. **Image recognition**: Extract faces from HTML photos
4. **Advanced filtering**: Date range, bulk export
5. **Analytics dashboard**: Historical trends
6. **Mobile app**: React Native version
7. **Notification system**: RSS feed, email alerts
8. **Multi-language**: Hindi, regional languages

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| MongoDB connection timeout | Check connection string, IP whitelist in Atlas |
| Scraper fails silently | Check error logs in `apps/worker/logs/` |
| API returns 503 | MongoDB/server may be down, check health endpoint |
| LLM service crashes | Check CUDA memory, reduce batch size |
| Deployment fails | Check GitHub secrets, verify environment vars |

### Debugging

```bash
# Server logs
tail -f logs/server.log

# Worker logs
tail -f apps/worker/logs/scraper-errors-*.json

# Database stats
db.missing_persons.countDocuments()
db.missing_persons.getIndexes()

# API health
curl http://localhost:3000/api/health
```

---

## Support & Legal

- **Issues**: File on GitHub issues
- **Data sources**: Maharashtra & Karnataka Police websites
- **License**: To be defined
- **Contact**: maintain ethical standards

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Status**: Production Ready
