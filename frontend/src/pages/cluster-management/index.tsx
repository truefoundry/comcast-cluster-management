import { useState, useMemo, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Searchbar } from "@/components/ui/searchbar"
import { Spin } from "@/components/ui/spin"
import {
  CreateDrawer,
  EditDrawer,
  DeleteDialog,
  ClusterListTable,
  type ConfigurationFormData,
} from "./components"
import type { ClusterFallbackConfig, Cluster, Workspace } from "@/lib/types"
import {
  clusterFallbackConfigService,
  externalDataService,
} from "@/lib/services"
import { getErrorMessage } from "@/lib/utils"

const initialFormData: ConfigurationFormData = {
  sourceCluster: "",
  sourceWorkspace: "",
  sourceJobId: "",
  destinationCluster: "",
  destinationWorkspace: "",
}

const ClusterManagement = () => {
  // Data state
  const [configurations, setConfigurations] = useState<ClusterFallbackConfig[]>([])
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState("")

  // Drawer states
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [configToDelete, setConfigToDelete] = useState<ClusterFallbackConfig | null>(null)

  // Config being edited
  const [configToEdit, setConfigToEdit] = useState<ClusterFallbackConfig | null>(null)

  // Form states
  const [createFormData, setCreateFormData] = useState<ConfigurationFormData>(initialFormData)
  const [editFormData, setEditFormData] = useState<ConfigurationFormData>(initialFormData)

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [configsData, clustersData, workspacesData] = await Promise.all([
        clusterFallbackConfigService.getAll(),
        externalDataService.getClusters(),
        externalDataService.getWorkspaces(),
      ])
      setConfigurations(configsData)
      setClusters(clustersData)
      setWorkspaces(workspacesData)
    } catch (err) {
      console.error("Failed to fetch data:", err)
      setError("Failed to load data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Create lookup maps for names (for search)
  const clusterNameMap = useMemo(() => {
    const map = new Map<string, string>()
    clusters.forEach((c) => map.set(c.id, c.name))
    return map
  }, [clusters])

  const workspaceNameMap = useMemo(() => {
    const map = new Map<string, string>()
    workspaces.forEach((w) => map.set(w.id, w.name))
    return map
  }, [workspaces])

  // Filter data based on search query across all columns (IDs and names)
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return configurations
    }

    const query = searchQuery.toLowerCase().trim()

    return configurations.filter((config) => {
      const searchableFields = [
        config.source.clusterId,
        config.source.workspaceId,
        config.source.jobId ?? "",
        config.destination.clusterId,
        config.destination.workspaceId,
        // Also search by names
        clusterNameMap.get(config.source.clusterId) ?? "",
        workspaceNameMap.get(config.source.workspaceId) ?? "",
        clusterNameMap.get(config.destination.clusterId) ?? "",
        workspaceNameMap.get(config.destination.workspaceId) ?? "",
      ]

      return searchableFields.some((field) =>
        field.toLowerCase().includes(query)
      )
    })
  }, [searchQuery, configurations, clusterNameMap, workspaceNameMap])

  const handleCreateSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Use workspace.clusterId for consistency - allows backend to use single API call
      const sourceWorkspace = workspaces.find(w => w.id === createFormData.sourceWorkspace)
      const destWorkspace = workspaces.find(w => w.id === createFormData.destinationWorkspace)

      await clusterFallbackConfigService.create({
        source: {
          clusterId: sourceWorkspace?.clusterId ?? createFormData.sourceCluster,
          workspaceId: createFormData.sourceWorkspace,
          jobId: createFormData.sourceJobId || undefined,
        },
        destination: {
          clusterId: destWorkspace?.clusterId ?? createFormData.destinationCluster,
          workspaceId: createFormData.destinationWorkspace,
          workspaceFqn: destWorkspace?.fqn,
        },
      })
      setCreateFormData(initialFormData)
      setIsCreateDrawerOpen(false)
      toast.success("Configuration created successfully")
      // Refresh data
      await fetchData()
    } catch (err) {
      console.error("Failed to create configuration:", err)
      setIsCreateDrawerOpen(false)
      toast.error("Failed to create configuration", {
        description: getErrorMessage(err),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async () => {
    if (!configToEdit) return

    setIsSubmitting(true)
    try {
      // Use workspace.clusterId for consistency - allows backend to use single API call
      const sourceWorkspace = workspaces.find(w => w.id === editFormData.sourceWorkspace)
      const destWorkspace = workspaces.find(w => w.id === editFormData.destinationWorkspace)

      await clusterFallbackConfigService.update(configToEdit.id, {
        source: {
          clusterId: sourceWorkspace?.clusterId ?? editFormData.sourceCluster,
          workspaceId: editFormData.sourceWorkspace,
          jobId: editFormData.sourceJobId || undefined,
        },
        destination: {
          clusterId: destWorkspace?.clusterId ?? editFormData.destinationCluster,
          workspaceId: editFormData.destinationWorkspace,
          workspaceFqn: destWorkspace?.fqn,
        },
      })
      setIsEditDrawerOpen(false)
      setConfigToEdit(null)
      toast.success("Configuration updated successfully")
      // Refresh data
      await fetchData()
    } catch (err) {
      console.error("Failed to update configuration:", err)
      setIsEditDrawerOpen(false)
      setConfigToEdit(null)
      toast.error("Failed to update configuration", {
        description: getErrorMessage(err),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (config: ClusterFallbackConfig) => {
    setConfigToEdit(config)
    setEditFormData({
      sourceCluster: config.source.clusterId,
      sourceWorkspace: config.source.workspaceId,
      sourceJobId: config.source.jobId ?? "",
      destinationCluster: config.destination.clusterId,
      destinationWorkspace: config.destination.workspaceId,
    })
    setIsEditDrawerOpen(true)
  }

  const handleDeleteClick = (config: ClusterFallbackConfig) => {
    setConfigToDelete(config)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!configToDelete) return

    setIsSubmitting(true)
    try {
      await clusterFallbackConfigService.delete(configToDelete.id)
      setIsDeleteDialogOpen(false)
      setConfigToDelete(null)
      toast.success("Configuration deleted successfully")
      // Refresh data
      await fetchData()
    } catch (err) {
      console.error("Failed to delete configuration:", err)
      setIsDeleteDialogOpen(false)
      setConfigToDelete(null)
      toast.error("Failed to delete configuration", {
        description: getErrorMessage(err),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSearch = (value: string): void => {
    setSearchQuery(value)
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Spin size="large" />
          <span className="text-muted-foreground text-sm">Loading configurations...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Cluster Management</h1>
          </div>
          <div className="text-muted-foreground text-base">
            Configure and manage cluster fallback settings for your jobs. Each source cluster
            has a designated fallback destination for recovery.
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Searchbar
            placeholder="Search configurations..."
            value={searchQuery}
            onSearch={handleSearch}
            containerClassName="w-64"
          />
          <CreateDrawer
            isOpen={isCreateDrawerOpen}
            onOpenChange={setIsCreateDrawerOpen}
            formData={createFormData}
            onFormChange={setCreateFormData}
            onSubmit={handleCreateSubmit}
            clusters={clusters}
            workspaces={workspaces}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      <ClusterListTable
        data={filteredData}
        clusters={clusters}
        workspaces={workspaces}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      <p className="mt-4 text-sm text-muted-foreground">
        Showing {filteredData.length} of {configurations.length} fallback configurations
      </p>

      <EditDrawer
        isOpen={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
        formData={editFormData}
        onFormChange={setEditFormData}
        onSubmit={handleEditSubmit}
        clusters={clusters}
        workspaces={workspaces}
        isSubmitting={isSubmitting}
      />

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        config={configToDelete}
        onConfirm={handleDeleteConfirm}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

export default ClusterManagement
