import { BookOpen, Settings, ArrowRight, Clock } from "lucide-react"

const Documentation = () => {
  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Documentation</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Learn how to configure cluster fallback settings for your jobs.
        </p>
      </div>

      {/* What is Cluster Fallback */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          What does this App do?
        </h2>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-muted-foreground leading-relaxed">
            This App is an automated system that monitors your jobs running on a 
            <strong className="text-foreground"> source cluster</strong>. When jobs get stuck 
            (remain in CREATED or SCHEDULED state beyond a threshold), the system automatically 
            moves them to a <strong className="text-foreground">destination cluster</strong> to 
            ensure your workloads continue running without manual intervention.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          How It Works
        </h2>
        <div className="bg-card border rounded-lg p-6">
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">1</span>
              <div>
                <p className="font-medium">Monitoring</p>
                <p className="text-muted-foreground text-sm">The system periodically checks for jobs in CREATED or SCHEDULED state on configured source clusters.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">2</span>
              <div>
                <p className="font-medium">Detection</p>
                <p className="text-muted-foreground text-sm">Jobs stuck longer than the configured threshold (default: 60 minutes) are flagged for fallback.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">3</span>
              <div>
                <p className="font-medium">Migration</p>
                <p className="text-muted-foreground text-sm">The job is recreated on the destination cluster with the same configuration and triggered automatically.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">4</span>
              <div>
                <p className="font-medium">Cleanup</p>
                <p className="text-muted-foreground text-sm">The original stuck job run on the source cluster is terminated.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Configuration Fields */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Configuration Fields</h2>
        
        {/* Source Configuration */}
        <div className="bg-card border rounded-lg p-6 mb-4">
          <h3 className="font-semibold text-lg mb-4 text-blue-500 dark:text-blue-400">
            Source Configuration
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Defines where to monitor for stuck jobs.
          </p>
          <div className="space-y-4">
            <div className="border-l-2 border-blue-500 pl-4">
              <p className="font-medium">Source Cluster</p>
              <p className="text-muted-foreground text-sm">The cluster where your jobs are currently running and being monitored.</p>
            </div>
            <div className="border-l-2 border-blue-500 pl-4">
              <p className="font-medium">Source Workspace</p>
              <p className="text-muted-foreground text-sm">The workspace within the source cluster to monitor.</p>
            </div>
            <div className="border-l-2 border-blue-500/50 pl-4">
              <p className="font-medium">Job ID <span className="text-xs text-muted-foreground font-normal">(Optional)</span></p>
              <p className="text-muted-foreground text-sm">
                Specify a particular job application ID to monitor. If left empty, all jobs in the workspace will be monitored.
              </p>
            </div>
          </div>
        </div>

        {/* Destination Configuration */}
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4 text-emerald-500 dark:text-emerald-400">
            Destination Configuration
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Defines where stuck jobs will be moved to.
          </p>
          <div className="space-y-4">
            <div className="border-l-2 border-emerald-500 pl-4">
              <p className="font-medium">Destination Cluster</p>
              <p className="text-muted-foreground text-sm">The fallback cluster where stuck jobs will be recreated.</p>
            </div>
            <div className="border-l-2 border-emerald-500 pl-4">
              <p className="font-medium">Destination Workspace</p>
              <p className="text-muted-foreground text-sm">The workspace in the destination cluster where jobs will run.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Creating a Configuration */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ArrowRight className="h-5 w-5 text-primary" />
          Creating a Configuration
        </h2>
        <div className="bg-card border rounded-lg p-6">
          <ol className="space-y-3 text-muted-foreground">
            <li className="flex gap-3">
              <span className="text-primary font-medium">1.</span>
              Navigate to <strong className="text-foreground">Cluster Management</strong> from the sidebar.
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-medium">2.</span>
              Click the <strong className="text-foreground">Create Configuration</strong> button.
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-medium">3.</span>
              Select a <strong className="text-foreground">Source Cluster</strong> and <strong className="text-foreground">Workspace</strong> to monitor.
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-medium">4.</span>
              (Optional) Enter a specific <strong className="text-foreground">Job ID</strong> or leave empty to monitor all jobs.
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-medium">5.</span>
              Select a <strong className="text-foreground">Destination Cluster</strong> and <strong className="text-foreground">Workspace</strong> for fallback.
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-medium">6.</span>
              Click <strong className="text-foreground">Create</strong> to save the configuration.
            </li>
          </ol>
        </div>
      </section>
    </div>
  )
}

export default Documentation
