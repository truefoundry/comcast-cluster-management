import { ArrowRight, Pencil, Trash2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import type { ClusterFallbackConfig } from "@/lib/types"

interface ClusterListTableProps {
  data: ClusterFallbackConfig[]
  onEdit: (config: ClusterFallbackConfig) => void
  onDelete: (config: ClusterFallbackConfig) => void
}

const ClusterListTable = ({ data, onEdit, onDelete }: ClusterListTableProps) => {
  // Ensure data is always an array
  const configs = Array.isArray(data) ? data : []

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Source Cluster</TableHead>
            <TableHead className="font-semibold">Source Workspace</TableHead>
            <TableHead className="font-semibold">Job ID</TableHead>
            <TableHead className="w-12"></TableHead>
            <TableHead className="font-semibold">Fallback Cluster</TableHead>
            <TableHead className="font-semibold">Fallback Workspace</TableHead>
            <TableHead className="font-semibold w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No configurations found
              </TableCell>
            </TableRow>
          ) : null}
          {configs.map((config) => (
            <TableRow key={config.id}>
              <TableCell>
                <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                  {config.source.clusterId}
                </code>
              </TableCell>
              <TableCell>
                <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                  {config.source.workspaceId}
                </code>
              </TableCell>
              <TableCell>
                {config.source.jobId ? (
                  <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                    {config.source.jobId}
                  </code>
                ) : (
                  <span className="text-muted-foreground italic">—</span>
                )}
              </TableCell>
              <TableCell>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </TableCell>
              <TableCell>
                <code className="rounded bg-accent px-2 py-1 text-sm font-mono">
                  {config.destination.clusterId}
                </code>
              </TableCell>
              <TableCell>
                <code className="rounded bg-accent px-2 py-1 text-sm font-mono">
                  {config.destination.workspaceId}
                </code>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(config)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(config)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default ClusterListTable
