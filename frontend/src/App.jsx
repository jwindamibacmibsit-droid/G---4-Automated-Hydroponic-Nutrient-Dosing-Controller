import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PumpControl from "./pages/PumpControl";
import Logs from "./pages/SystemLogs";
import Settings from "./pages/Settings";
import About from "./pages/About";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

/*
 * Check if the user is logged in.
 */

function isAuthenticated() {
    const localUser = localStorage.getItem("hydrocontrol_user");
    const sessionUser = sessionStorage.getItem("hydrocontrol_user");

    return Boolean(localUser || sessionUser);
}

/*
 * Protected routes
 *
 * Users who are not logged in cannot access:
 * /dashboard
 * /water-monitoring
 * /nutrient-control
 * /ph-control
 * /pump-control
 * /logs
 * /settings
 * /about
 */



function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* =========================
                    PUBLIC ROUTES
                ========================== */}

                <Route element={<PublicRoute />}>
                    <Route
                        path="/login"
                        element={<Login />}
                    />
                </Route>


                {/* =========================
                    DEFAULT ROUTE
                ========================== */}

                <Route
                    path="/"
                    element={
                        <Navigate
                            to={
                                isAuthenticated()
                                    ? "/dashboard"
                                    : "/login"
                            }
                            replace
                        />
                    }
                />


                {/* =========================
                    PROTECTED ROUTES
                ========================== */}

                <Route element={<ProtectedRoute />}>

                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
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

                </Route>


                {/* =========================
                    UNKNOWN ROUTES
                ========================== */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;