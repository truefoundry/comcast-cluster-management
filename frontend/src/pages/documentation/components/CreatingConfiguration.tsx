import { ArrowRight } from "lucide-react"

export const CreatingConfiguration = () => {
  return (
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
  )
}
