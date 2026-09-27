import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    Outlet
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PumpControl from "./pages/PumpControl";
import Logs from "./pages/SystemLogs";
import Settings from "./pages/Settings";
import About from "./pages/About";

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
function ProtectedRoute() {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

/*
 * Public routes
 *
 * If the user is already logged in and tries to visit /login,
 * send them back to the dashboard.
 */
function PublicRoute() {
    if (isAuthenticated()) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}

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
                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
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