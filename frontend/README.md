# Cluster Fallback Management Frontend

A React + TypeScript frontend for managing cluster fallback configurations. Built with Vite, Tailwind CSS, and shadcn/ui components.

## Features

- **Configuration Management UI** - Create, view, edit, and delete fallback configurations
- **Search & Filter** - Search configurations by cluster, workspace, or job ID
- **Cluster/Workspace Selection** - Dropdown selectors populated from TrueFoundry API
- **Toast Notifications** - User feedback for success/error states
- **Responsive Design** - Works on desktop and tablet screens
- **Dark/Light Theme** - Theme toggle support

## Folder Structure

```
frontend/
├── src/
│   ├── main.tsx                 # Application entry point
│   ├── App.tsx                  # Root component with router and providers
│   ├── App.css                  # Global styles
│   ├── index.css                # Tailwind CSS imports
│   │
│   ├── components/
│   │   ├── theme-provider.tsx   # Theme context provider
│   │   └── ui/                  # shadcn/ui components
│   │       ├── alert-dialog.tsx # Confirmation dialogs
│   │       ├── button.tsx       # Button component
│   │       ├── drawer.tsx       # Side drawer (Vaul)
│   │       ├── input.tsx        # Form input
│   │       ├── label.tsx        # Form label
│   │       ├── searchbar.tsx    # Search input with icon
│   │       ├── select.tsx       # Dropdown select
│   │       ├── sidebar.tsx      # Navigation sidebar
│   │       ├── sonner.tsx       # Toast notifications
│   │       ├── spin.tsx         # Loading spinner
│   │       └── table.tsx        # Data table
│   │
│   ├── context/
│   │   └── theme-context.ts     # Theme state context
│   │
│   ├── hooks/
│   │   └── use-theme.ts         # Theme toggle hook
│   │
│   ├── layout/
│   │   └── MainLayout.tsx       # App shell with sidebar
│   │
│   ├── lib/
│   │   ├── api.ts               # Axios client with interceptors
│   │   ├── types.ts             # TypeScript type definitions
│   │   ├── utils.ts             # Utility functions (cn, getErrorMessage)
│   │   └── services/
│   │       ├── index.ts
│   │       ├── cluster-fallback-config.service.ts  # Config CRUD API
│   │       └── external-data.service.ts            # Clusters/Workspaces API
│   │
│   ├── pages/
│   │   ├── cluster-management/  # Main configuration page
│   │   │   ├── index.tsx        # Page component
│   │   │   └── components/
│   │   │       ├── index.ts
│   │   │       ├── ClusterListTable.tsx    # Config table view
│   │   │       ├── ConfigurationForm.tsx   # Create/Edit form
│   │   │       ├── CreateDrawer.tsx        # Create config drawer
│   │   │       ├── EditDrawer.tsx          # Edit config drawer
│   │   │       └── DeleteDialog.tsx        # Delete confirmation
│   │   │
│   │   └── documentation/       # Documentation page
│   │       └── index.tsx
│   │
│   ├── routes/
│   │   ├── index.ts             # Route exports
│   │   └── routes.tsx           # Route definitions
│   │
│   └── assets/
│       └── react.svg
│
├── public/                      # Static assets
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Component library (Radix UI based)
- **React Router 7** - Client-side routing
- **Axios** - HTTP client
- **Sonner** - Toast notifications
- **Vaul** - Drawer component
- **Lucide React** - Icons

## Local Development

### Prerequisites

- Node.js 20+ (used in production Dockerfile)
- npm or yarn

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

### Running the Development Server

```bash
# Start the dev server (default: http://localhost:5173)
npm run dev
```

### Building for Production

```bash
# Type check and build
npm run build

# Preview production build locally
npm run preview
```

### Linting

```bash
# Run ESLint
npm run lint
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Type check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint on all files |

## API Integration

The frontend communicates with the backend via `/api` proxy (configured in Vite). Key services:

### `clusterFallbackConfigService`
- `getAll()` - Fetch all configurations
- `getById(id)` - Fetch single configuration
- `create(data)` - Create new configuration
- `update(id, data)` - Update existing configuration
- `delete(id)` - Delete configuration

### `externalDataService`
- `getClusters()` - Fetch available clusters
- `getWorkspaces(clusterId?)` - Fetch workspaces (optionally filtered by cluster)

## Environment Variables

For local development, the Vite dev server proxies `/api` requests to the backend. No additional environment variables are required.

For production builds, the frontend is served statically by the backend (see `Dockerfile`).
