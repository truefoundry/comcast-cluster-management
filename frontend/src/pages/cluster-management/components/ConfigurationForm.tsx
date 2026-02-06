import { ArrowRight } from "lucide-react"
import { useMemo } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { Cluster, Workspace } from "@/lib/types"

export interface ConfigurationFormData {
  sourceCluster: string
  sourceWorkspace: string
  sourceJobId: string
  destinationCluster: string
  destinationWorkspace: string
}

interface ConfigurationFormProps {
  formData: ConfigurationFormData
  onFormChange: (data: ConfigurationFormData) => void
  idPrefix: string
  clusters: Cluster[]
  workspaces: Workspace[]
}

const ConfigurationForm = ({
  formData,
  onFormChange,
  idPrefix,
  clusters,
  workspaces,
}: ConfigurationFormProps) => {
  // Filter workspaces based on selected cluster
  const sourceWorkspaces = useMemo(() => {
    if (!formData.sourceCluster) return []
    return workspaces.filter((w) => w.clusterId === formData.sourceCluster)
  }, [workspaces, formData.sourceCluster])

  const destinationWorkspaces = useMemo(() => {
    if (!formData.destinationCluster) return []
    return workspaces.filter((w) => w.clusterId === formData.destinationCluster)
  }, [workspaces, formData.destinationCluster])

  const updateField = (field: keyof ConfigurationFormData, value: string) => {
    const newData = { ...formData, [field]: value }

    // When source cluster changes, clear source workspace if it doesn't belong to the new cluster
    if (field === "sourceCluster") {
      const currentWorkspace = workspaces.find((w) => w.id === formData.sourceWorkspace)
      if (currentWorkspace && currentWorkspace.clusterId !== value) {
        newData.sourceWorkspace = ""
      }
    }

    // When destination cluster changes, clear destination workspace if it doesn't belong to the new cluster
    if (field === "destinationCluster") {
      const currentWorkspace = workspaces.find((w) => w.id === formData.destinationWorkspace)
      if (currentWorkspace && currentWorkspace.clusterId !== value) {
        newData.destinationWorkspace = ""
      }
    }

    onFormChange(newData)
  }

  return (
    <div className="space-y-6">
      {/* Source Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Source
        </h3>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-source-cluster`}>Cluster</Label>
          <Select
            value={formData.sourceCluster}
            onValueChange={(value) => updateField("sourceCluster", value)}
          >
            <SelectTrigger id={`${idPrefix}-source-cluster`}>
              <SelectValue placeholder="Select source cluster" />
            </SelectTrigger>
            <SelectContent>
              {clusters.map((cluster) => (
                <SelectItem key={cluster.id} value={cluster.id}>
                  {cluster.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-source-workspace`}>Workspace</Label>
          <Select
            value={formData.sourceWorkspace}
            onValueChange={(value) => updateField("sourceWorkspace", value)}
            disabled={!formData.sourceCluster}
          >
            <SelectTrigger id={`${idPrefix}-source-workspace`}>
              <SelectValue placeholder={formData.sourceCluster ? "Select source workspace" : "Select a cluster first"} />
            </SelectTrigger>
            <SelectContent>
              {sourceWorkspaces.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-source-job-id`}>Job ID (Optional)</Label>
          <Input
            id={`${idPrefix}-source-job-id`}
            placeholder="Enter job ID"
            value={formData.sourceJobId}
            onChange={(e) => updateField("sourceJobId", e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Destination Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Destination (Fallback)
        </h3>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-destination-cluster`}>Cluster</Label>
          <Select
            value={formData.destinationCluster}
            onValueChange={(value) => updateField("destinationCluster", value)}
          >
            <SelectTrigger id={`${idPrefix}-destination-cluster`}>
              <SelectValue placeholder="Select fallback cluster" />
            </SelectTrigger>
            <SelectContent>
              {clusters.map((cluster) => (
                <SelectItem key={cluster.id} value={cluster.id}>
                  {cluster.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-destination-workspace`}>Workspace</Label>
          <Select
            value={formData.destinationWorkspace}
            onValueChange={(value) => updateField("destinationWorkspace", value)}
            disabled={!formData.destinationCluster}
          >
            <SelectTrigger id={`${idPrefix}-destination-workspace`}>
              <SelectValue placeholder={formData.destinationCluster ? "Select fallback workspace" : "Select a cluster first"} />
            </SelectTrigger>
            <SelectContent>
              {destinationWorkspaces.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export default ConfigurationForm
