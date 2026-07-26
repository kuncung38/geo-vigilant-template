import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { NodeDetail } from "./pages/NodeDetail";
import { Overview } from "./pages/Overview";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

export function AppContent() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <Navbar />
      <div className="flex pt-16 min-h-screen pb-16 md:pb-0">
        <main className="flex-1 md:ml-64 overflow-y-auto p-gutter md:p-margin-desktop bg-background">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/nodes/:id" element={<NodeDetail />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
