import type { RouteObject } from "react-router-dom"
import MainLayout from "@/layout/MainLayout"
import ClusterManagement from "@/pages/cluster-management"

const routes: RouteObject[] = [
  {
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <ClusterManagement />,
      },
    ],
  },
]

export default routes