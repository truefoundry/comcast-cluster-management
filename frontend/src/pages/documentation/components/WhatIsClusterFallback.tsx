import { Settings } from "lucide-react"

export const WhatIsClusterFallback = () => {
  return (
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
  )
}
