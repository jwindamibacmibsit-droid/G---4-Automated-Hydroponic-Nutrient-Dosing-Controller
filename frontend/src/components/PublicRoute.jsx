import {
    Navigate,
    Outlet
} from "react-router-dom";

function isAuthenticated() {
    const localUser = localStorage.getItem("hydrocontrol_user");
    const sessionUser = sessionStorage.getItem("hydrocontrol_user");

    return Boolean(localUser || sessionUser);
}

export default function PublicRoute() {

    if (isAuthenticated()) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}