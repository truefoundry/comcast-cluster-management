import { BrowserRouter } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

import AppRoutes from "./routes"

const App = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="comcast-ui-theme">
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Toaster position="top-center" richColors closeButton />
    </ThemeProvider>
  )
}

export default App
