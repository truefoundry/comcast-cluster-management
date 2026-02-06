import type { RouteObject } from "react-router-dom"
import MainLayout from "@/layout/MainLayout"
import ClusterManagement from "@/pages/cluster-management"
import Documentation from "@/pages/documentation"

const routes: RouteObject[] = [
  {
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <ClusterManagement />,
      },
      {
        path: "docs",
        element: <Documentation />,
      },
    ],
  },
]

export default routes