import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import WaterMonitoring from "./pages/WaterMonitoring";
import NutrientControl from "./pages/NutrientControl";
import PHControl from "./pages/PhControl";
import PumpControl from "./pages/PumpControl";
import Logs from "./pages/SystemLogs";
import Settings from "./pages/Settings";
import About from "./pages/About";

function App() {

    return (
        <BrowserRouter>

            <Routes>

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/"
                    element={
                        <Navigate to="/login" replace />
                    }
                />

                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />

                <Route
                    path="/water-monitoring"
                    element={<WaterMonitoring />}
                />
                <Route
                    path="/nutrient-control"
                    element={<NutrientControl />}
                />

                <Route
                    path="/ph-control"
                    element={<PHControl />}
                />

                <Route
                    path="/pump-control"
                    element={<PumpControl />}
                />

                <Route
                    path="/logs"
                    element={<Logs />}
                />

                <Route
                    path="/settings"
                    element={<Settings />}
                />

                <Route
                    path="/about"
                    element={<About />}
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;