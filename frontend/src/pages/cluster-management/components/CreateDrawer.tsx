import { Plus } from "lucide-react"
import {
  Drawer,
  DrawerClose,
  DrawerContentRight,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import ConfigurationForm, { type ConfigurationFormData } from "./ConfigurationForm"
import type { Cluster, Workspace } from "@/lib/types"

interface CreateDrawerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  formData: ConfigurationFormData
  onFormChange: (data: ConfigurationFormData) => void
  onSubmit: () => void
  clusters: Cluster[]
  workspaces: Workspace[]
  isSubmitting?: boolean
}

const CreateDrawer = ({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  clusters,
  workspaces,
  isSubmitting = false,
}: CreateDrawerProps) => {
  const isFormValid =
    formData.sourceCluster &&
    formData.sourceWorkspace &&
    formData.destinationCluster &&
    formData.destinationWorkspace

  return (
    <Drawer direction="right" open={isOpen} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Add Configuration
        </Button>
      </DrawerTrigger>
      <DrawerContentRight>
        <DrawerHeader className="border-b">
          <DrawerTitle>New Fallback Configuration</DrawerTitle>
          <DrawerDescription>
            Create a new cluster fallback configuration for disaster recovery.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <ConfigurationForm
            formData={formData}
            onFormChange={onFormChange}
            idPrefix="create"
            clusters={clusters}
            workspaces={workspaces}
          />
        </div>

        <DrawerFooter className="border-t">
          <Button onClick={onSubmit} disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Configuration"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContentRight>
    </Drawer>
  )
}

export default CreateDrawer
