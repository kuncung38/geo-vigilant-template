import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AlertSystem } from "./components/AlertSystem";
import { Navbar } from "./components/Navbar";
import { useNodes } from "./hooks/useNodes";
import { MapOverview } from "./pages/MapOverview";
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
  const { data: nodes } = useNodes();

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      <Navbar primaryNodeId={nodes?.[0]?.id} nodes={nodes} />
      <AlertSystem nodes={nodes} />
      <div className="flex pt-16 min-h-screen pb-16 md:pb-0">
        <main className="flex-1 md:ml-64 overflow-y-auto p-gutter md:p-margin-desktop pb-40 md:pb-40 bg-background">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/map" element={<MapOverview />} />
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
