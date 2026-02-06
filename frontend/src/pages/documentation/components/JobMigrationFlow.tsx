import { Workflow } from "lucide-react"

export const JobMigrationFlow = () => {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Workflow className="h-5 w-5 text-primary" />
        Job Migration Flow (Technical Details)
      </h2>
      <div className="bg-card border rounded-lg p-6">
        <p className="text-muted-foreground mb-4 text-sm">
          Step-by-step breakdown of how a stuck job is moved from source to destination.
        </p>
        
        <ol className="space-y-4">
          <li className="flex gap-4">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">1</span>
            <div>
              <p className="font-medium">Fetch Fallback Configurations</p>
              <p className="text-muted-foreground text-sm">Load all configured fallback rules from storage and group them by source cluster/workspace.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">2</span>
            <div>
              <p className="font-medium">Query Job Runs</p>
              <p className="text-muted-foreground text-sm">For each source cluster/workspace, fetch all job runs with <code className="bg-muted px-1 rounded">CREATED</code> or <code className="bg-muted px-1 rounded">SCHEDULED</code> status.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">3</span>
            <div>
              <p className="font-medium">Filter Stuck Jobs</p>
              <p className="text-muted-foreground text-sm">Compare each job's <code className="bg-muted px-1 rounded">createdAt</code> timestamp against the threshold. Jobs older than the threshold are flagged as stuck.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">4</span>
            <div>
              <p className="font-medium">Match Configuration</p>
              <p className="text-muted-foreground text-sm">Find the appropriate fallback config for each stuck job. Job-specific configs (with Job ID) are checked first, then generic workspace configs.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">5</span>
            <div>
              <p className="font-medium">Get Deployment Manifest</p>
              <p className="text-muted-foreground text-sm">Fetch the original job's deployment manifest from TrueFoundry API using the application ID and deployment version.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">6</span>
            <div>
              <p className="font-medium">Modify Manifest</p>
              <p className="text-muted-foreground text-sm">Update the manifest with a new unique name (with <code className="bg-muted px-1 rounded">-fb-</code> suffix) and the destination workspace FQN.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">7</span>
            <div>
              <p className="font-medium">Create Application on Destination</p>
              <p className="text-muted-foreground text-sm">Deploy the modified manifest to the destination cluster/workspace using TrueFoundry's create application API.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">8</span>
            <div>
              <p className="font-medium">Trigger Job on Destination</p>
              <p className="text-muted-foreground text-sm">After a short delay, trigger the job on the destination with the original command/input parameters. Retries if deployment is not ready.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">9</span>
            <div>
              <p className="font-medium">Terminate Stuck Job on Source</p>
              <p className="text-muted-foreground text-sm">Finally, terminate the original stuck job run on the source cluster to prevent duplicate execution.</p>
            </div>
          </li>
        </ol>
      </div>
    </section>
  )
}
