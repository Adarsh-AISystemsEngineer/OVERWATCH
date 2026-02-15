# Overwatch - Complete Folder Structure

```
overwatch/
│
├── 📁 apps/                              # Application services
│   │
│   ├── 📁 client/                        # Frontend (React + Vite)
│   │   ├── 📁 src/
│   │   │   ├── 📁 components/
│   │   │   │   ├── Map.tsx              # Interactive Leaflet map
│   │   │   │   └── FilterPanel.tsx      # Search/filter UI
│   │   │   ├── 📁 api/
│   │   │   │   └── apiClient.ts         # Axios HTTP client
│   │   │   ├── 📁 store/
│   │   │   │   └── mapStore.ts          # Zustand state management
│   │   │   ├── App.tsx                  # Main component
│   │   │   ├── main.tsx                 # React DOM entry
│   │   │   └── index.css                # Global styles + Tailwind
│   │   ├── index.html                   # HTML entry point
│   │   ├── package.json                 # Dependencies
│   │   ├── vite.config.ts               # Vite config
│   │   ├── tsconfig.json                # TypeScript config
│   │   ├── tailwind.config.cjs          # Tailwind CSS config
│   │   ├── postcss.config.cjs           # PostCSS config
│   │   └── .env.example                 # Environment template
│   │
│   ├── 📁 server/                        # Backend API (Node.js + Express)
│   │   ├── 📁 src/
│   │   │   ├── 📁 models/
│   │   │   │   └── MissingPerson.ts     # MongoDB schema + indexes
│   │   │   ├── 📁 routes/
│   │   │   │   ├── missingPersons.ts    # GET missing persons, nearby, by ID
│   │   │   │   └── analytics.ts         # Hotspots, trends, statistics
│   │   │   ├── 📁 middleware/
│   │   │   │   ├── cache.ts             # In-memory caching
│   │   │   │   └── errorHandler.ts      # Error handling & validation
│   │   │   └── index.ts                 # Express server setup
│   │   ├── dist/                        # Compiled output (ignored)
│   │   ├── Dockerfile                   # Production image (multi-stage)
│   │   ├── package.json                 # Dependencies
│   │   ├── tsconfig.json                # TypeScript config
│   │   ├── .env.example                 # Environment template
│   │   └── .gitignore
│   │
│   ├── 📁 worker/                        # Data ETL Pipeline (Node.js)
│   │   ├── 📁 src/
│   │   │   ├── 📁 scrapers/
│   │   │   │   └── stateSrapers.ts      # Maharashtra, Karnataka scrapers
│   │   │   ├── 📁 transformer/
│   │   │   │   └── transformer.ts       # Data validation & transformation
│   │   │   ├── 📁 services/
│   │   │   │   └── databaseService.ts   # MongoDB insertion & deduplication
│   │   │   ├── 📁 utils/
│   │   │   │   ├── httpClient.ts        # HTTP with retry mechanism
│   │   │   │   ├── validators.ts        # Data validation functions
│   │   │   │   └── errorLogger.ts       # Error logging to JSON
│   │   │   ├── 📁 models/
│   │   │   │   └── MissingPerson.ts     # MongoDB schema
│   │   │   └── index.ts                 # Worker orchestration
│   │   ├── 📁 logs/                     # Error logs (ignored)
│   │   ├── dist/                        # Compiled output (ignored)
│   │   ├── Dockerfile                   # Production image
│   │   ├── package.json                 # Dependencies
│   │   ├── tsconfig.json                # TypeScript config
│   │   ├── .env.example                 # Environment template
│   │   └── .gitignore
│   │
│   └── 📁 llm-service/                   # FastAPI + Qwen2.5
│       ├── main.py                      # FastAPI app + endpoints
│       ├── extractor.py                 # LLM wrapper + model loading
│       ├── schemas.py                   # Pydantic schemas for validation
│       ├── Dockerfile                   # Multi-stage Python image
│       ├── requirements.txt              # Python dependencies
│       ├── .env.example                 # Environment template
│       └── .gitignore
│
├── 📁 packages/                          # Shared code
│   │
│   └── 📁 shared/                        # Types, schemas, constants
│       ├── 📁 src/
│       │   ├── types.ts                 # Zod schemas (MissingPerson, etc.)
│       │   ├── constants.ts             # App constants & configurations
│       │   └── index.ts                 # Re-exports
│       ├── package.json                 # NPM package
│       ├── tsconfig.json                # TypeScript config
│       └── .gitignore
│
├── 📁 .github/                           # GitHub configuration
│   └── 📁 workflows/
│       ├── ci-cd.yml                    # Main pipeline (validate/build/deploy)
│       └── scheduled-scraper.yml        # Scheduled job (every 6 hours)
│
├── 📄 docker-compose.yml                 # Local development stack
├── 📄 package.json                       # Monorepo root (workspaces)
├── 📄 turbo.json                         # Turborepo configuration
├── 📄 tsconfig.json                      # Root TypeScript config
├── 📄 .prettierrc                        # Code formatter config
├── 📄 .gitignore                         # Git ignore patterns
│
├── 📄 README.md                          # Main documentation
├── 📄 ARCHITECTURE.md                    # Detailed architecture
├── 📄 FOLDER_STRUCTURE.md                # This file
│
└── 📄 .env.example                       # Root environment template (if needed)
```

---

## Directory Purpose Reference

### Frontend (`apps/client/`)
- **React + Vite**: Fast bundler & dev server
- **Leaflet**: Interactive map with markers
- **Zustand**: Lightweight state management
- **TailwindCSS**: Utility-first styling
- **Deployment**: Vercel (automatic from main branch)

### Backend (`apps/server/`)
- **Express**: RESTful API framework
- **MongoDB**: Document database with geospatial support
- **Mongoose**: ODM with schema validation
- **Zod**: Runtime type validation
- **In-memory caching**: Reduce database load
- **Deployment**: Railway (Node environment)

### Worker (`apps/worker/`)
- **Scrapers**: State-specific HTML parsers
- **Cheerio**: HTML parsing library
- **Transformer**: Data validation & transformation
- **Database Service**: Handles deduplication
- **Error Logger**: JSON-based error tracking
- **Deployment**: Railway (scheduled job, every 6 hours)

### LLM Service (`apps/llm-service/`)
- **FastAPI**: Fast Python web framework
- **Qwen2.5-7B**: Open-source LLM model
- **Pydantic**: Data validation (Python)
- **Optional**: Used only if deployed
- **Deployment**: Docker container (any platform)

### Shared (`packages/shared/`)
- **Zod Schemas**: Validate across all services
- **TypeScript Types**: Shared interfaces
- **Constants**: App-wide config
- **NPM Package**: Installed as dependency in all apps

### GitHub Actions (`.github/workflows/`)
- **CI/CD Pipeline**: Validate → Build → Deploy → Test
- **Scheduled Scraper**: Background data collection job
- **Secrets**: Store API tokens, deployment credentials

---

## Key Files Explained

| File | Purpose |
|------|---------|
| `apps/server/src/models/MissingPerson.ts` | MongoDB schema with all indexes |
| `apps/server/src/routes/missingPersons.ts` | API endpoints for data filtering |
| `apps/server/src/routes/analytics.ts` | Aggregation pipelines for statistics |
| `apps/worker/src/scrapers/stateSrapers.ts` | HTML parsers for each state |
| `apps/worker/src/transformer/transformer.ts` | Data validation before DB insertion |
| `apps/llm-service/extractor.py` | LLM wrapper for structured extraction |
| `packages/shared/src/types.ts` | All Zod schemas used across services |
| `.github/workflows/ci-cd.yml` | Main CI/CD pipeline definition |
| `docker-compose.yml` | Local development with all services |
| `turbo.json` | Monorepo build orchestration |

---

## Development Workflow

```
1. Checkout feature branch from develop
2. Make changes across one or more apps
3. Run: npm run lint    (all packages)
4. Run: npm run type-check    (all packages)
5. Run: npm run test    (all packages)
6. Commit with meaningful message
7. Push to feature branch
8. Create PR (auto-runs CI pipeline)
9. Once approved, merge to develop
10. Merge develop → main for production deployment
```

---

## Deployment Checklist

- [ ] All tests passing locally (`npm run test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting warnings (`npm run lint`)
- [ ] Environment variables set in Railway/Vercel
- [ ] MongoDB URI configured
- [ ] Vercel secrets stored
- [ ] Railway environment variables set
- [ ] GitHub Actions secrets configured
- [ ] Slack webhook URL added (for notifications)

---

## Adding New Features

### Example: Add new state (e.g., Tamil Nadu)

1. **Scraper**
   ```typescript
   // apps/worker/src/scrapers/stateSrapers.ts
   export class TamilNaduScraper { ... }
   ```

2. **Add to pipeline**
   ```typescript
   // apps/worker/src/index.ts
   const tamilNaduRecords = await TamilNaduScraper.scrape();
   ```

3. **Update constants**
   ```typescript
   // packages/shared/src/constants.ts
   SUPPORTED_STATES = ['Maharashtra', 'Karnataka', 'Tamil Nadu']
   ```

4. **Test locally**
   ```bash
   npm run dev --workspace=overwatch-worker
   ```

5. **Deploy**
   - Push to main
   - GitHub Actions auto-deploys to Railway

---

## Monitoring & Logs

### Application Logs
- **Server**: Printed to stdout (Railway logs)
- **Worker**: JSON files in `apps/worker/logs/` + uploaded to GitHub Actions artifacts
- **LLM**: Printed to stdout in Docker container
- **Frontend**: Browser console + Sentry (optional)

### Database Monitoring
- **MongoDB Atlas**: Cloud dashboards
- **Indexes**: Check with `db.missing_persons.getIndexes()`
- **Performance**: Monitor slow queries

### Performance Metrics
- **Frontend**: Lighthouse scores in CI
- **Backend**: Response times, DB query times
- **Worker**: Scrape duration, record counts

---

**Total Lines of Code**: ~3,000 (production-ready)  
**Services**: 4 (Frontend, Backend, Worker, LLM)  
**Configuration Files**: 15+  
**GitHub Workflows**: 2  
**Docker Containers**: 4 (+ MongoDB)
