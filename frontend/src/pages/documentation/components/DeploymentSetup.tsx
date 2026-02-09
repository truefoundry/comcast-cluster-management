import { Rocket, HardDrive, ExternalLink, CheckCircle2 } from "lucide-react"

export const DeploymentSetup = () => {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Rocket className="h-5 w-5 text-primary" />
        Deploying the Service on TrueFoundry
      </h2>
      
      <div className="bg-card border rounded-lg p-6 mb-6">
        <p className="text-muted-foreground leading-relaxed mb-4">
          Follow these steps to deploy the Cluster Fallback Management service on TrueFoundry.
        </p>

        {/* Prerequisites */}
        <div className="bg-muted/50 rounded-md p-4 mb-6">
          <p className="font-medium mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Before you begin, make sure you have:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm ml-6">
            <li>Access to a TrueFoundry account</li>
            <li>A workspace where you want to deploy the service</li>
            <li>The Docker image URL or GitHub repository URL for this service</li>
          </ul>
        </div>

        {/* Step 1: Create Service */}
        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">1</span>
            Create a New Service
          </h3>
          <div className="ml-9 space-y-3">
            <p className="text-muted-foreground text-sm">
              A <strong className="text-foreground">Service</strong> is a running application on TrueFoundry. 
              We'll create one to host the Cluster Fallback Management app.
            </p>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">1.1</span>
                <span>Log in to your TrueFoundry dashboard</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">1.2</span>
                <span>Navigate to your target <strong className="text-foreground">Workspace</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">1.3</span>
                <span>Click <strong className="text-foreground">+ New Deployment</strong> → <strong className="text-foreground">Service</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">1.4</span>
                <span>Enter a name (e.g., <code className="bg-muted px-1.5 py-0.5 rounded text-xs">cluster-fallback-manager</code>)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">1.5</span>
                <span>Select your source: <strong className="text-foreground">Docker Image</strong> (paste image URL) or <strong className="text-foreground">GitHub</strong> (connect your repository)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">1.6</span>
                <span>Set the port to <code className="bg-muted px-1.5 py-0.5 rounded text-xs">8000</code> (this is the default port for our service)</span>
              </li>
            </ol>
            <a
              href="https://www.truefoundry.com/docs/deploy-first-service"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Detailed guide: Deploying a Service on TrueFoundry
            </a>
          </div>
        </div>

        {/* Step 2: Create Volume */}
        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">2</span>
            Create a Volume for Data Storage
          </h3>
          <div className="ml-9 space-y-3">
            <p className="text-muted-foreground text-sm">
              A <strong className="text-foreground">Volume</strong> is persistent storage that keeps your data safe even if the service restarts. 
              We need this to store fallback configurations.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3 text-sm">
              <p className="text-amber-600 dark:text-amber-400 font-medium mb-1">⚠️ Important</p>
              <p className="text-muted-foreground">
                Without a volume, your configurations will be lost every time the service restarts!
              </p>
            </div>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">2.1</span>
                <span>In your workspace, go to <strong className="text-foreground">Storage</strong> → <strong className="text-foreground">Volumes</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">2.2</span>
                <span>Click <strong className="text-foreground">Create Volume</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">2.3</span>
                <span>Name it something descriptive (e.g., <code className="bg-muted px-1.5 py-0.5 rounded text-xs">fallback-config-data</code>)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">2.4</span>
                <span>Set size to at least <code className="bg-muted px-1.5 py-0.5 rounded text-xs">1 GB</code> (configurations are small, so this is plenty)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">2.5</span>
                <span>Click <strong className="text-foreground">Create</strong></span>
              </li>
            </ol>
            <a
              href="https://www.truefoundry.com/docs/creating-a-volume"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Detailed guide: Creating a Volume on TrueFoundry
            </a>
          </div>
        </div>

        {/* Step 3: Attach Volume */}
        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">3</span>
            Attach Volume to Service
          </h3>
          <div className="ml-9 space-y-3">
            <p className="text-muted-foreground text-sm">
              Now we'll connect the volume to your service so it can store configuration data.
            </p>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">3.1</span>
                <span>Go to your service's <strong className="text-foreground">Configuration</strong> or <strong className="text-foreground">Edit</strong> page</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">3.2</span>
                <span>Find the <strong className="text-foreground">Volumes</strong> or <strong className="text-foreground">Storage</strong> section</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">3.3</span>
                <span>Click <strong className="text-foreground">Add Volume</strong> and select the volume you created</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">3.4</span>
                <span>
                  Set the <strong className="text-foreground">Mount Path</strong> to: 
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs ml-1">/app/data</code>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">3.5</span>
                <span>Save and redeploy the service</span>
              </li>
            </ol>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-md p-3 text-sm mt-3">
              <p className="text-blue-600 dark:text-blue-400 font-medium mb-1">💡 Tip</p>
              <p className="text-muted-foreground">
                The mount path <code className="bg-muted px-1 rounded">/app/data</code> is where the service looks for its configuration files. 
                Make sure to use this exact path!
              </p>
            </div>
          </div>
        </div>

        {/* Step 4: Configure Environment Variables */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">4</span>
            Add Environment Variables
          </h3>
          <div className="ml-9 space-y-3">
            <p className="text-muted-foreground text-sm">
              Environment variables are settings that tell the service how to behave. 
              You'll need to add these in the service configuration.
            </p>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">4.1</span>
                <span>In your service configuration, find the <strong className="text-foreground">Environment Variables</strong> section</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">4.2</span>
                <span>Add each variable listed in the <strong className="text-foreground">Environment Variables</strong> section below</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">4.3</span>
                <span>For sensitive values (like API tokens), use TrueFoundry's <strong className="text-foreground">Secrets</strong> feature</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium shrink-0">4.4</span>
                <span>Save and redeploy</span>
              </li>
            </ol>
            <p className="text-muted-foreground text-sm mt-3">
              👇 See the complete list of environment variables in the next section.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Reference Card */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-primary" />
          Quick Reference
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Service Port</p>
            <code className="bg-muted px-2 py-1 rounded block">8000</code>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Volume Mount Path</p>
            <code className="bg-muted px-2 py-1 rounded block">/app/data</code>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Minimum Volume Size</p>
            <code className="bg-muted px-2 py-1 rounded block">1 GB</code>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Config File Location</p>
            <code className="bg-muted px-2 py-1 rounded block">/app/data/cluster-fallback-configs.json</code>
          </div>
        </div>
      </div>
    </section>
  )
}
