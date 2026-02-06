import { Cog } from "lucide-react"

export const CronJobOverview = () => {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Cog className="h-5 w-5 text-primary" />
        Cron Job Service Overview
      </h2>
      <div className="bg-card border rounded-lg p-6">
        <p className="text-muted-foreground leading-relaxed mb-4">
          The fallback scheduler is a <strong className="text-foreground">background cron job</strong> that runs 
          every <strong className="text-foreground">5 minutes</strong>. It automatically processes all configured 
          fallback rules and moves stuck jobs without any manual intervention.
        </p>
        <div className="bg-muted/50 rounded-md p-4 text-sm">
          <p className="font-medium mb-2">Key Characteristics:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Runs automatically every 5 minutes</li>
            <li>Processes all fallback configurations in sequence</li>
            <li>Uses a lock mechanism to prevent overlapping runs</li>
            <li>Includes retry logic for transient API failures</li>
            <li>Job-specific configs take priority over generic workspace configs</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
