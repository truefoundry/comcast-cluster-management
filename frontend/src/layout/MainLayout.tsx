import { Suspense } from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/ui/sidebar"
import { Spin } from "@/components/ui/spin"

const MainLayout = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Suspense
          fallback={
            <div className="absolute inset-0 top-1/2 flex size-full -translate-y-1/2 items-center justify-center">
              <Spin size="large" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

export default MainLayout
