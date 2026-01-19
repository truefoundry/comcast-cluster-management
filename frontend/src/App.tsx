import { BrowserRouter } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import AppRoutes from "./routes"

const App = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="comcast-ui-theme">
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
