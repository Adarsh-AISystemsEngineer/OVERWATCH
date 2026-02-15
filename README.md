# Overwatch - Missing Persons Mapping Platform

A production-grade, public-facing missing persons mapping platform for India. Uses official police data to display missing and found persons on an interactive map with advanced filtering and analytics.

## Key Features

### Platform
- ✅ Interactive map with OpenStreetMap (Leaflet)
- ✅ Real-time filtering (gender, age, date range, location)
- ✅ Geographic hotspot detection (heatmap)
- ✅ Timeline trend analysis
- ✅ Zero login/signup required
- ✅ Read-only public system
- ✅ Source attribution for all records

### Data
- ✅ Automated scraping from police websites
- ✅ Maharashtra & Karnataka (V1, easily scalable)
- ✅ Structured data: name, age, gender, location, status
- ✅ Status tracking: missing → found
- ✅ Deduplication by content hash
- ✅ Validation before DB insertion

### Architecture
- ✅ Monorepo with Turborepo
- ✅ TypeScript across all services
- ✅ MongoDB with geospatial (2dsphere) indexing
- ✅ Advanced aggregation pipelines
- ✅ Caching strategy (5-60 min TTL)
- ✅ Error logging with context
- ✅ Optional LLM for HTML parsing

### Deployment
- ✅ CI/CD with GitHub Actions
- ✅ Frontend → Vercel (React + Vite)
- ✅ Backend → Railway (Node.js + Express)
- ✅ Worker → Railway (scheduled ETL job)
- ✅ LLM → Docker container
- ✅ Docker Compose for local dev

---

## Project Structure

```
overwatch/
├── apps/
│   ├── client/                 # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/    # Map, FilterPanel
│   │   │   ├── api/           # API client
│   │   │   ├── store/         # Zustand state
│   │   │   └── App.tsx
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.cjs
│   │   └── package.json
│   │
│   ├── server/                 # Node.js + Express API
│   │   ├── src/
│   │   │   ├── models/        # MongoDB schema
│   │   │   ├── routes/        # API endpoints + aggregations
│   │   │   ├── middleware/    # Cache, error handling
│   │   │   └── index.ts       # Server entry
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── worker/                 # ETL scraper service
│   │   ├── src/
│   │   │   ├── scrapers/      # State scrapers
│   │   │   ├── transformer/   # Data validation
│   │   │   ├── services/      # Database service
│   │   │   ├── utils/         # Validators, error logger
│   │   │   └── index.ts       # Worker orchestration
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── llm-service/            # FastAPI + Qwen2.5
│       ├── main.py             # FastAPI app
│       ├── extractor.py        # LLM wrapper
│       ├── schemas.py          # Pydantic schemas
│       ├── Dockerfile
│       ├── requirements.txt
│       └── .env.example
│
├── packages/
│   └── shared/                 # Shared types & constants
│       ├── src/
│       │   ├── types.ts        # Zod schemas
│       │   ├── constants.ts    # App constants
│       │   └── index.ts
│       └── package.json
│
├── .github/
│   └── workflows/
│       ├── ci-cd.yml           # Main pipeline
│       └── scheduled-scraper.yml  # Worker job
│
├── docker-compose.yml          # Local development
├── package.json                # Monorepo root
├── turbo.json                  # Turborepo config
├── tsconfig.json               # TypeScript config
├── ARCHITECTURE.md             # Detailed architecture
└── README.md                   # This file
```

---

## MongoDB Schema

### MissingPerson Collection

```javascript
{
  _id: ObjectId,
  name: String,                    // 1-255 chars, required
  age: Number,                     // 0-150, required
  gender: "male" | "female" | "other",
  lastSeenDate: Date,              // required
  lastKnownLocation: String,       // required
  geolocation: {
    type: "Point",
    coordinates: [longitude, latitude]  // Indexed for map queries
  },
  status: "missing" | "found",
  description: String,             // Optional, ≤1000 chars
  photoUrl: String,                // Optional URL
  contactName: String,             // Optional
  contactPhone: String,            // Optional
  sourceURL: String,               // Attribution (required)
  sourceState: String,             // Maharashtra, Karnataka
  dataHash: String,                // SHA256, unique (deduplication)
  createdAt: Date,                 // Immutable
  updatedAt: Date                  // Auto-updated
}
```

### Indexes

```javascript
// Geospatial queries (map visualization)
{ "geolocation.coordinates": "2dsphere" }

// Common filtering
{ "status": 1, "lastSeenDate": -1 }
{ "sourceState": 1, "status": 1 }
{ "gender": 1, "age": 1, "status": 1 }

// Deduplication
{ "dataHash": 1 } (unique, sparse)
```

---

## API Endpoints

### Missing Persons Queries

```bash
# Get all missing persons with filters
GET /api/missing-persons?gender=female&ageMin=20&ageMax=40&status=missing&limit=20
Response: { success: true, data: { results: [...], pagination: {...} } }

# Get by ID
GET /api/missing-persons/:id

# Geospatial search (e.g., 50km radius)
GET /api/missing-persons/nearby?longitude=75.75&latitude=19.75&radiusKm=50
Response: { success: true, data: { centerPoint, radiusKm, results: [...] } }
```

### Analytics

```bash
# Hotspot detection (state-level clustering)
GET /api/analytics/hotspots
Response: {
  hotspots: [
    {
      state: "Maharashtra",
      missingCount: 45,
      foundCount: 12,
      riskScore: 79.1,
      coordinates: [lat, lng]
    }
  ]
}

# Timeline trends (monthly aggregations)
GET /api/analytics/trends
Response: {
  trends: [
    {
      year: 2024, month: 1,
      missingCount: 23,
      foundCount: 8,
      resolutionRate: 25.8
    }
  ]
}

# Overall statistics
GET /api/analytics/statistics
Response: {
  totals: { total: 500, missing: 450, found: 50, resolutionRate: "10%" },
  byGender: [...],
  byState: [...],
  ageRanges: [...]
}
```

---

## Data Pipeline

### Worker Flow

```
┌─────────────────────────────────────────────────────────┐
│           Scheduled Job (Every 6 hours)                 │
│                  GitHub Actions                         │
└───────────────────────┬─────────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │   State Scraper Modules       │
        │ (Maharashtra, Karnataka)      │
        └───────────┬───────────────────┘
                    ↓
        ┌───────────────────────────────┐
        │   HTTP Client                 │
        │ (Retry: 3x, Timeout: 30s)    │
        └───────────┬───────────────────┘
                    ↓
        ┌───────────────────────────────┐
        │   HTML Parsing (Cheerio)      │
        │ Extract: name, age, location  │
        └───────────┬───────────────────┘
                    ↓
        ┌───────────────────────────────┐
        │   Data Transformer            │
        │ Validation, Type Conversion   │
        └───────────┬───────────────────┘
                    ↓ Valid              ↓ Invalid
        ┌───────────────────────┐   ┌──────────────────┐
        │  Deduplication        │   │  Error Logger    │
        │  SHA256(name+date+url)│   │  (JSON logs)     │
        └───────────┬───────────┘   └──────────────────┘
                    ↓
        ┌───────────────────────────────┐
        │   Database Service            │
        │ Insert/Update to MongoDB      │
        │ Handle duplicates             │
        └───────────┬───────────────────┘
                    ↓
        ┌───────────────────────────────┐
        │   Statistics & Logging        │
        │ (Console + Slack notification)│
        └───────────────────────────────┘
```

### Scraper Features

- **State-based modules**: Separate scraper per state (scalable)
- **Retry mechanism**: Exponential backoff (3 attempts)
- **Validation**: Zod schema before DB insertion
- **Deduplication**: Hash(name + lastSeenDate + sourceURL)
- **Error logging**: Context-rich JSON logs
- **Non-destructive**: Never deletes old records

---

## LLM Integration (Optional)

### Design

```python
# FastAPI endpoint
POST /api/extract
{
  "html_content": "<div>...",
  "source_state": "Maharashtra",
  "source_url": "https://..."
}

Response:
{
  "success": true,
  "extracted_records": [
    {
      "name": "Priya Sharma",
      "age": 28,
      "gender": "female",
      "last_seen_date": "2024-01-15T10:30:00",
      "last_known_location": "Mumbai",
      "status": "missing"
    }
  ],
  "extraction_confidence": [0.95]
}
```

### Key Constraints

- ✅ **No geocoding**: Only extracts text
- ✅ **No DB writes**: Returns JSON only
- ✅ **Never called directly from client**: Internal use only
- ✅ **Retry mechanism**: Up to 3 attempts with exponential backoff
- ✅ **Timeout**: 60 seconds per request
- ✅ **Temperature 0.1**: Consistent, deterministic extractions

---

## CI/CD Pipeline

### GitHub Actions Workflows

#### Main Pipeline (`.github/workflows/ci-cd.yml`)

```yaml
1. Validate (PR/push)
   ├── Lint (ESLint)
   ├── Type check (TypeScript)
   └── Tests (Vitest)

2. Build (PR/push)
   ├── Compile TypeScript
   ├── Build Vite frontend
   └── Build Docker images

3. Deploy (main push only)
   ├── Frontend → Vercel
   ├── Server → Railway
   ├── Worker → Railway
   └── LLM → GitHub Container Registry

4. Smoke Tests (post-deploy)
   ├── Health checks
   ├── Database connectivity
   └── Slack notifications
```

#### Scheduled Worker (`.github/workflows/scheduled-scraper.yml`)

```yaml
Trigger: Every 6 hours (cron: "0 */6 * * *")
Action:
  ├── Build worker
  ├── Run scraper
  ├── Log results
  └── Notify on failure (Slack)
```

---

## Performance Optimizations

### Database
- 2dsphere indexes for geospatial queries
- Compound indexes on common filters
- Sparse index on dataHash (unique constraint)

### Caching
- In-memory cache with TTL
- Hotspot data: 1 hour
- Analytics: 30 minutes
- List views: 5 minutes
- Automatic expiration & cleanup

### API
- GZIP compression
- Connection pooling
- Request timeout: 15 seconds
- Rate limiting: 60/min per IP

### Aggregation
- Faceted queries (single scan)
- $bucket for range aggregation
- $group for fast counting

---

## Security & Legal

### Data Protection
1. **Source Attribution**: Every record links to original police website
2. **Read-only**: No user input, no public forms
3. **Rate limiting**: 60 req/min, 1000 req/hour
4. **CORS**: Whitelist only verified domains
5. **Helmet.js**: Security headers

### Ethical Guidelines
- ✅ Display disclaimers ("Information may not be real-time")
- ✅ Always cite police source
- ✅ No false/inaccurate data
- ✅ Deduplication prevents duplicates
- ✅ Updated every 6 hours (not real-time)
- ✅ No user tracking or analytics

---

## Quick Start

### Prerequisites
```bash
- Node.js 18+
- npm or yarn
- MongoDB Atlas account (free tier OK)
- GitHub account
```

### Local Development

```bash
# 1. Clone and install
git clone <repo>
cd overwatch
npm install

# 2. Set up environment
cp apps/server/.env.example apps/server/.env
cp apps/worker/.env.example apps/worker/.env
# Edit .env files with your MongoDB URI

# 3. Run locally (all services)
npm run dev

# Or use Docker Compose
docker-compose up

# Access:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:3000
# - LLM: http://localhost:8000
```

### Build for Production

```bash
npm run build
npm run type-check
npm run test
```

### Deploy

```bash
# Frontend to Vercel
vercel deploy --prod

# Backend/Worker to Railway
railway up

# LLM Docker
docker build -t overwatch-llm ./apps/llm-service
# Push to registry (GitHub, DockerHub, etc.)
```

---

## Environment Variables

### Server (`.env`)
```bash
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/overwatch?retryWrites=true&w=majority
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://overwatch.vercel.app,https://api.overwatch.railway.app
```

### Worker (`.env`)
```bash
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
```

### LLM (`.env`)
```bash
FASTAPI_ENV=production
LOG_LEVEL=info
UVICORN_WORKERS=1
```

---

## Constraints & Limitations

### V1 Scope
- **States**: Maharashtra, Karnataka (2 states minimum)
- **Update frequency**: Every 6 hours (not real-time)
- **Coordinates**: State center (not precise)
- **No LLM by default**: Optional enhancement
- **No real-time scraping**: Background jobs only

### Technical
- No LLM geocoding (no external API calls from LLM)
- No LLM database writes (JSON only)
- Monorepo deployment (single release cycle)
- MongoDB Atlas (managed service)

---

## Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| Port 3000 already in use | `lsof -i :3000` and kill process, or change PORT env var |
| MongoDB connection timeout | Check Atlas IP whitelist, connection string |
| Scraper finds 0 records | Check HTML selector in scraper, website structure might have changed |
| API returns 503 | Server may be starting, wait 30s and retry |
| Build fails | Check Node.js version (`node -v`), ensure ≥18 |

### Debugging

```bash
# API health
curl http://localhost:3000/api/health

# Check database
mongosh "mongodb+srv://..." --eval "db.missing_persons.countDocuments()"

# View worker logs
ls -la apps/worker/logs/

# Check container logs
docker-compose logs server
docker-compose logs worker
```

---

## Future Roadmap

- [ ] Extend to all 28 states
- [ ] Real geocoding (Nominatim API)
- [ ] Photo recognition (ML model)
- [ ] SMS/WhatsApp integration
- [ ] Mobile app (React Native)
- [ ] Multi-language (Hindi, Tamil, etc.)
- [ ] Analytics dashboard
- [ ] Email alerts & RSS feed
- [ ] Voice search
- [ ] Accessibility improvements (WCAG AA)

---

## Support

- 📧 Email: [contact info TBD]
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions
- 📝 Docs: See [ARCHITECTURE.md](ARCHITECTURE.md)

---

## License

[To be determined - recommend MIT or GPL for open-source]

---

## Legal Notice

- **Data Source**: Official state police websites
- **Usage**: Public information only, no sensitive data
- **Disclaimer**: "Information may not be real-time. For emergencies, contact local police."
- **Attribution**: All records link to original source

---

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: February 2026

---

## Contributors

- Architecture & Core: [Team]
- Frontend: React + Vite specialists
- Backend: Node.js + MongoDB experts
- DevOps: GitHub Actions, Railway, Vercel
