import {
    Navigate,
    Outlet
} from "react-router-dom";

    function isAuthenticated() {
        const localUser = localStorage.getItem("hydrocontrol_user");
        const sessionUser = sessionStorage.getItem("hydrocontrol_user");

        return Boolean(localUser || sessionUser);
    }

function ProtectedRoute() {

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;
