import { Server } from "lucide-react"

export const EnvironmentVariables = () => {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Server className="h-5 w-5 text-primary" />
        Environment Variables
      </h2>
      <div className="bg-card border rounded-lg p-6">
        <p className="text-muted-foreground mb-4 text-sm">
          Configure these environment variables to enable and customize the cron job service.
        </p>
        
        {/* Required Variables */}
        <div className="mb-6">
          <h3 className="font-semibold text-red-500 dark:text-red-400 mb-3">Required</h3>
          <div className="space-y-4">
            <div className="border-l-2 border-red-500 pl-4">
              <code className="text-sm bg-muted px-2 py-0.5 rounded">JOB_FALLBACK_ENABLED</code>
              <p className="text-muted-foreground text-sm mt-1">
                Set to <code className="bg-muted px-1 rounded">true</code> to enable the cron job. Default: <code className="bg-muted px-1 rounded">false</code>
              </p>
            </div>
            <div className="border-l-2 border-red-500 pl-4">
              <code className="text-sm bg-muted px-2 py-0.5 rounded">TF_SERVICE_API_TOKEN</code>
              <p className="text-muted-foreground text-sm mt-1">
                TrueFoundry service account API token for authenticating API calls. The cron job will not start without this.
              </p>
            </div>
            <div className="border-l-2 border-red-500 pl-4">
              <code className="text-sm bg-muted px-2 py-0.5 rounded">TRUEFOUNDRY_API_URL</code>
              <p className="text-muted-foreground text-sm mt-1">
                Base URL for TrueFoundry API. Example: <code className="bg-muted px-1 rounded">https://your-tenant.truefoundry.cloud</code>
              </p>
            </div>
          </div>
        </div>

        {/* Optional Variables */}
        <div>
          <h3 className="font-semibold text-amber-500 dark:text-amber-400 mb-3">Optional</h3>
          <div className="space-y-4">
            <div className="border-l-2 border-amber-500/50 pl-4">
              <code className="text-sm bg-muted px-2 py-0.5 rounded">JOB_FALLBACK_STUCK_THRESHOLD_MINUTES</code>
              <p className="text-muted-foreground text-sm mt-1">
                Time in minutes before a job is considered stuck. Default: <code className="bg-muted px-1 rounded">60</code>
              </p>
            </div>
            <div className="border-l-2 border-amber-500/50 pl-4">
              <code className="text-sm bg-muted px-2 py-0.5 rounded">JOB_FALLBACK_TRIGGER_MAX_RETRIES</code>
              <p className="text-muted-foreground text-sm mt-1">
                Maximum retry attempts for job trigger/terminate operations. Default: <code className="bg-muted px-1 rounded">3</code>
              </p>
            </div>
            <div className="border-l-2 border-amber-500/50 pl-4">
              <code className="text-sm bg-muted px-2 py-0.5 rounded">JOB_FALLBACK_TRIGGER_RETRY_DELAY_MS</code>
              <p className="text-muted-foreground text-sm mt-1">
                Delay between retry attempts in milliseconds. Default: <code className="bg-muted px-1 rounded">3000</code>
              </p>
            </div>
            <div className="border-l-2 border-amber-500/50 pl-4">
              <code className="text-sm bg-muted px-2 py-0.5 rounded">JOB_FALLBACK_TRIGGER_DELAY_MS</code>
              <p className="text-muted-foreground text-sm mt-1">
                Wait time before triggering job on destination after creating application. Default: <code className="bg-muted px-1 rounded">5000</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
