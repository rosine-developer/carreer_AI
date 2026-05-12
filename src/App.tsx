import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import Home from "./components/home";

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <Suspense fallback={<p>Loading...</p>}>
          <>
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </>
        </Suspense>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;
