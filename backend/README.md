# Cluster Fallback Management Backend

A NestJS backend service for managing cluster fallback configurations and automatically moving stuck jobs between TrueFoundry clusters/workspaces.

## Features

- **Cluster Fallback Configuration Management** - Create, read, update, and delete fallback rules that define how stuck jobs should be migrated
- **Automatic Job Fallback** - Scheduled cron job that detects stuck jobs and automatically moves them to destination clusters
- **TrueFoundry API Integration** - Proxy endpoints for fetching clusters, workspaces, and job information
- **Priority-based Matching** - Job-specific configurations take priority over generic workspace-level configurations
- **Retry Logic** - Built-in retry mechanism for handling transient API failures

## Folder Structure

```
backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module with global configuration
│   ├── app.controller.ts          # Health check endpoint
│   ├── app.service.ts             # Basic app service
│   ├── data-source.ts             # TypeORM data source configuration
│   │
│   ├── entities/                  # Database entities
│   │   ├── index.ts
│   │   └── cluster-fallback-config.entity.ts  # Fallback config entity
│   │
│   ├── lib/                       # Shared utilities
│   │   ├── json-storage.ts        # JSON file-based storage (alternative to DB)
│   │   └── retry.ts               # Generic retry utility with configurable options
│   │
│   ├── migrations/                # TypeORM migrations
│   │   ├── 1736927400000-InitialSchema.ts
│   │   ├── 1736928000000-RemoveUserTables.ts
│   │   └── 1736928500000-AddCreatedByColumn.ts
│   │
│   └── modules/
│       ├── cluster-fallback-config/           # Fallback configuration module
│       │   ├── cluster-fallback-config.module.ts
│       │   ├── cluster-fallback-config.controller.ts  # CRUD API endpoints
│       │   ├── cluster-fallback-config.service.ts     # Business logic for configs
│       │   ├── job-fallback-scheduler.service.ts      # Cron job for auto-fallback
│       │   ├── fallback-test.controller.ts            # Test endpoints for debugging
│       │   ├── dto/
│       │   │   ├── create-cluster-fallback-config.dto.ts
│       │   │   └── update-cluster-fallback-config.dto.ts
│       │   └── index.ts
│       │
│       └── external-data/                     # TrueFoundry API integration
│           ├── external-data.module.ts
│           ├── external-data.controller.ts    # Proxy endpoints for TF API
│           ├── external-data.service.ts       # TrueFoundry API client
│           └── index.ts
│
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## Main Business Logic

### 1. Fallback Configuration (`cluster-fallback-config.service.ts`)

Manages fallback rules that define:
- **Source**: Cluster + Workspace (+ optional specific Job ID)
- **Destination**: Cluster + Workspace where stuck jobs should be migrated

**Key Features:**
- Duplicate prevention: Only one generic config per source cluster/workspace
- Job-specific configs: Higher priority than generic configs
- Validation: Ensures source and destination are different

### 2. Job Fallback Scheduler (`job-fallback-scheduler.service.ts`)

Automated cron job that runs periodically to:

1. **Fetch all fallback configurations** from storage
2. **Group configs by source** (cluster + workspace)
3. **For each source**, fetch job runs with `CREATED` and `SCHEDULED` status
4. **Filter stuck jobs** - Jobs running longer than threshold (default: 60 minutes)
5. **Match jobs to configs** - Job-specific first, then generic
6. **Move stuck jobs** to destination:
   - Get deployment manifest from source
   - Create new application in destination workspace
   - Trigger the job with original input
   - Terminate the stuck job on source

**Configuration Matching Priority:**
```
Job Y stuck on Cluster A, Workspace B
  ↓
1. Check: Is there a config for (Cluster A, Workspace B, Job Y)? → Use it
2. Check: Is there a config for (Cluster A, Workspace B, *)? → Use it
3. No config found → Skip this job
```

### 3. External Data Service (`external-data.service.ts`)

TrueFoundry API client providing:
- `getClusters()` / `getClusterById()` - Fetch cluster information
- `getWorkspaces()` / `getWorkspaceById()` - Fetch workspace information
- `getUserInfo()` - Get current user details
- `getJobRunsByClusterAndWorkspace()` - Fetch job runs with pagination
- `getDeployment()` - Get deployment manifest
- `createApplication()` - Create new application
- `triggerJob()` - Trigger a job run
- `terminateJobRun()` - Terminate a running job

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `TRUEFOUNDRY_API_URL` | TrueFoundry API base URL | `https://internal.devtest.truefoundry.tech` |
| `TF_SERVICE_API_TOKEN` | Service account token for API calls | - |
| `JOB_FALLBACK_ENABLED` | Enable/disable the fallback scheduler | `false` |
| `JOB_FALLBACK_STUCK_THRESHOLD_MINUTES` | Minutes before a job is considered stuck | `60` |
| `JOB_FALLBACK_TRIGGER_MAX_RETRIES` | Max retries for job trigger/terminate | `3` |
| `JOB_FALLBACK_TRIGGER_RETRY_DELAY_MS` | Delay between retries | `3000` |
| `JOB_FALLBACK_TRIGGER_DELAY_MS` | Wait time before triggering job | `5000` |
| `DATA_DIR` | Directory for JSON file storage | `/app/data` |

## API Endpoints

### Fallback Configurations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/fallback-configs` | List all configurations |
| `GET` | `/api/fallback-configs/:id` | Get configuration by ID |
| `POST` | `/api/fallback-configs` | Create new configuration |
| `PATCH` | `/api/fallback-configs/:id` | Update configuration |
| `DELETE` | `/api/fallback-configs/:id` | Delete configuration |

### External Data (Proxy to TrueFoundry)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/external/clusters` | List all clusters |
| `GET` | `/api/external/workspaces` | List all workspaces |
| `GET` | `/api/external/workspaces?clusterId=X` | List workspaces by cluster |

## Development

### Setup

```bash
npm install
```

### Run in Development

```bash
npm run start:dev
```

### Run in Production

```bash
npm run build
npm run start:prod
```

### Database Migrations (when using PostgreSQL)

```bash
# Generate a new migration
npm run migration:generate --name=MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## Architecture Notes

- **Storage**: Currently uses JSON file storage (`lib/json-storage.ts`). PostgreSQL/TypeORM is configured but commented out in `app.module.ts` — added for future scaling when higher throughput or data persistence is required.
- **Authentication**: Uses TrueFoundry tokens passed via `Authorization` header. Service account operations use `x-tfy-assume-user` header.
- **Scheduling**: Uses `@nestjs/schedule` with cron expressions. Default interval is every five minute.
- **Error Handling**: Comprehensive error handling with appropriate HTTP status codes and logging.
