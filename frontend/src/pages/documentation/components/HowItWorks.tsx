import { Clock } from "lucide-react"

export const HowItWorks = () => {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        How It Works
      </h2>
      <div className="bg-card border rounded-lg p-6">
        <ol className="space-y-4">
          <li className="flex gap-4">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">1</span>
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
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">3</span>
            <div>
              <p className="font-medium">Migration</p>
              <p className="text-muted-foreground text-sm">The job is recreated on the destination cluster with the same configuration and triggered automatically.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">4</span>
            <div>
              <p className="font-medium">Cleanup</p>
              <p className="text-muted-foreground text-sm">The original stuck job run on the source cluster is terminated.</p>
            </div>
          </li>
        </ol>
      </div>
    </section>
  )
}
