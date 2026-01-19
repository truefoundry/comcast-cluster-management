import {
  Drawer,
  DrawerClose,
  DrawerContentRight,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import ConfigurationForm, { type ConfigurationFormData } from "./ConfigurationForm"
import type { Cluster, Workspace } from "@/lib/types"

interface EditDrawerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  formData: ConfigurationFormData
  onFormChange: (data: ConfigurationFormData) => void
  onSubmit: () => void
  clusters: Cluster[]
  workspaces: Workspace[]
  isSubmitting?: boolean
}

const EditDrawer = ({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  clusters,
  workspaces,
  isSubmitting = false,
}: EditDrawerProps) => {
  const isFormValid =
    formData.sourceCluster &&
    formData.sourceWorkspace &&
    formData.destinationCluster &&
    formData.destinationWorkspace

  return (
    <Drawer direction="right" open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContentRight>
        <DrawerHeader className="border-b">
          <DrawerTitle>Edit Fallback Configuration</DrawerTitle>
          <DrawerDescription>
            Update the cluster fallback configuration settings.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <ConfigurationForm
            formData={formData}
            onFormChange={onFormChange}
            idPrefix="edit"
            clusters={clusters}
            workspaces={workspaces}
          />
        </div>

        <DrawerFooter className="border-t">
          <Button onClick={onSubmit} disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
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

export default EditDrawer
