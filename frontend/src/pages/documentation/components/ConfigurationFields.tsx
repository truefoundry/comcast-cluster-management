export const ConfigurationFields = () => {
  return (
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
  )
}
