import { BookOpen } from "lucide-react"
import {
  WhatIsClusterFallback,
  HowItWorks,
  ConfigurationFields,
  CreatingConfiguration,
  CronJobOverview,
  DeploymentSetup,
  EnvironmentVariables,
  JobMigrationFlow,
} from "./components"

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

      {/* User Guide Sections */}
      <WhatIsClusterFallback />
      <HowItWorks />
      <ConfigurationFields />
      <CreatingConfiguration />

      {/* Divider */}
      <div className="border-t my-12" />

      {/* Technical Sections */}
      <CronJobOverview />
      <DeploymentSetup />
      <EnvironmentVariables />
      <JobMigrationFlow />
    </div>
  )
}

export default Documentation
