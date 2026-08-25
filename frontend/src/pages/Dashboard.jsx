import {
    useEffect,
    useState
} from "react";

import Sidebar from "../components/Navbar";

import "../css/dashboard.css";


const API_BASE = "http://localhost:8000/api";


function Dashboard() {

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [dashboard, setDashboard] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    /*
    |--------------------------------------------------------------------------
    | LOAD DASHBOARD DATA
    |--------------------------------------------------------------------------
    */

    const loadDashboard = async () => {

        try {

            const response = await fetch(
                `${API_BASE}/dashboard.php`
            );

            const result = await response.json();

            if (!result.success) {

                throw new Error(
                    result.message ||
                    "Unable to load dashboard."
                );

            }

            setDashboard(result.data);

            setError("");

        } catch (error) {

            console.error(
                "Dashboard API Error:",
                error
            );

            setError(
                "Unable to connect to server."
            );

        } finally {

            setLoading(false);

        }

    };


    /*
    |--------------------------------------------------------------------------
    | AUTO REFRESH
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        loadDashboard();

        const interval = setInterval(
            loadDashboard,
            5000
        );

        return () => clearInterval(interval);

    }, []);


    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    if (loading) {

        return (
            <div className="dashboard">

                <Sidebar
                    isOpen={sidebarOpen}
                    setIsOpen={setSidebarOpen}
                />

                <main className="dashboard-main">

                    <div className="dashboard-loading">
                        Loading dashboard...
                    </div>

                </main>

            </div>
        );

    }


    /*
    |--------------------------------------------------------------------------
    | ERROR
    |--------------------------------------------------------------------------
    */

    if (error || !dashboard) {

        return (
            <div className="dashboard">

                <Sidebar
                    isOpen={sidebarOpen}
                    setIsOpen={setSidebarOpen}
                />

                <main className="dashboard-main">

                    <div className="dashboard-error">

                        <h2>
                            Dashboard Unavailable
                        </h2>

                        <p>
                            {error}
                        </p>

                        <button
                            onClick={loadDashboard}
                        >
                            Retry
                        </button>

                    </div>

                </main>

            </div>
        );

    }


    /*
    |--------------------------------------------------------------------------
    | DATA
    |--------------------------------------------------------------------------
    */

    const {
        system,
        device,
        water,
        ph,
        nutrient,
        sensors,
        pumps,
        automation,
        activity
    } = dashboard;


    return (
        <div className="dashboard">

            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            <main className="dashboard-main">

                {/* TOP BAR */}
                <header className="dashboard-header">

                    <div className="header-left">

                        <button
                            className="menu-button"
                            onClick={() =>
                                setSidebarOpen(true)
                            }
                        >
                            ☰
                        </button>

                        <div>

                            <h1>
                                Dashboard
                            </h1>

                            <p>
                                Automated Hydroponic Nutrient Dosing Controller
                            </p>

                        </div>

                    </div>


                    <div className="header-right">

                        <div className="connection-status">

                            <span></span>

                            {device?.status === "online"
                                ? "ESP32 Connected"
                                : "ESP32 Offline"}

                        </div>


                        <div className="profile">

                            <div className="profile-avatar">
                                JD
                            </div>

                            <div className="profile-info">

                                <strong>
                                    Admin
                                </strong>

                                <span>
                                    System Administrator
                                </span>

                            </div>

                        </div>

                    </div>

                </header>

                {/* STAT CARDS */}
                <section className="stats-grid">

                    <div className="stat-card water-card">

                        <div className="stat-top">

                            <div className="stat-icon">
                                💧
                            </div>

                            <span className="stat-label">
                                WATER LEVEL
                            </span>

                        </div>


                        <div className="stat-value">

                            {water.percentage}

                            <span>%</span>

                        </div>


                        <div className="progress">

                            <div
                                className="progress-fill"
                                style={{
                                    width:
                                        `${water.percentage}%`
                                }}
                            />

                        </div>


                        <p>

                            {water.status === "normal"
                                ? "Reservoir level is normal"
                                : `Reservoir level is ${water.status}`}

                        </p>

                    </div>


                    <div className="stat-card ph-card">

                        <div className="stat-top">

                            <div className="stat-icon">
                                ⚗️
                            </div>

                            <span className="stat-label">
                                pH LEVEL
                            </span>

                        </div>


                        <div className="stat-value">

                            {ph.value}

                        </div>


                        <div className="ph-range">

                            <span>
                                {ph.minimum}
                            </span>

                            <div className="ph-bar">

                                <div
                                    className="ph-indicator"
                                    style={{
                                        left: `${Math.min(
                                            100,
                                            Math.max(
                                                0,
                                                (
                                                    (
                                                        ph.value -
                                                        ph.minimum
                                                    ) /
                                                    (
                                                        ph.maximum -
                                                        ph.minimum
                                                    )
                                                ) * 100
                                            )
                                        )}%`
                                    }}
                                />

                            </div>

                            <span>
                                {ph.maximum}
                            </span>

                        </div>


                        <p>

                            {ph.status === "normal"
                                ? "Optimal range"
                                : `pH ${ph.status}`}

                        </p>

                    </div>


                    <div className="stat-card nutrient-card">

                        <div className="stat-top">

                            <div className="stat-icon">
                                🧪
                            </div>

                            <span className="stat-label">
                                NUTRIENT
                            </span>

                        </div>


                        <div className="stat-value">

                            {nutrient.ppm}

                            <span>
                                {" "}ppm
                            </span>

                        </div>


                        <div className="nutrient-status">

                            ● {nutrient.status === "normal"
                                ? "Normal concentration"
                                : nutrient.status}

                        </div>


                        <p>
                            Nutrient solution stable
                        </p>

                    </div>

                </section>


                {/* CONTENT GRID */}
                <section className="content-grid">

                    {/* LIVE MONITORING */}
                    <div className="panel monitoring-panel">

                        <div className="panel-header">

                            <div>

                                <span className="panel-label">
                                    REAL-TIME DATA
                                </span>

                                <h2>
                                    Live System Monitoring
                                </h2>

                            </div>

                            <span className="live-indicator">

                                <i></i>

                                LIVE

                            </span>

                        </div>


                        <div className="monitor-grid">

                            <div className="monitor-item">

                                <div className="monitor-icon">
                                    💧
                                </div>

                                <div>

                                    <span>
                                        Water Level
                                    </span>

                                    <strong>
                                        {water.percentage}%
                                    </strong>

                                </div>

                            </div>


                            <div className="monitor-item">

                                <div className="monitor-icon">
                                    ⚗️
                                </div>

                                <div>

                                    <span>
                                        pH Sensor
                                    </span>

                                    <strong>
                                        {ph.value}
                                    </strong>

                                </div>

                            </div>


                            <div className="monitor-item">

                                <div className="monitor-icon">
                                    🧪
                                </div>

                                <div>

                                    <span>
                                        Nutrient Level
                                    </span>

                                    <strong>
                                        {nutrient.ppm} ppm
                                    </strong>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* PUMP CONTROL */}
                    <div className="panel pump-panel">

                        <div className="panel-header">

                            <div>

                                <span className="panel-label">
                                    AUTOMATION
                                </span>

                                <h2>
                                    Pump Status
                                </h2>

                            </div>

                            <span className="auto-badge">

                                {automation.mode.toUpperCase()}

                            </span>

                        </div>


                        <div className="pump-list">

                            {pumps
                                .filter(
                                    pump =>
                                        pump.type === "ph_up" ||
                                        pump.type === "ph_down" ||
                                        pump.type === "nutrient_a" ||
                                        pump.type === "nutrient_b"
                                )
                                .slice(0, 3)
                                .map(pump => (

                                    <div
                                        className="pump-item"
                                        key={pump.id}
                                    >

                                        <div className="pump-info">

                                            <div className="pump-icon">

                                                {pump.type === "ph_up"
                                                    ? "⬆"
                                                    : pump.type === "ph_down"
                                                        ? "⬇"
                                                        : "🧪"}

                                            </div>

                                            <div>

                                                <strong>
                                                    {pump.name}
                                                </strong>

                                                <span>
                                                    Dosing system
                                                </span>

                                            </div>

                                        </div>


                                        <div
                                            className={
                                                pump.status
                                                    ? "switch active"
                                                    : "switch"
                                            }
                                        >
                                            <span></span>
                                        </div>

                                    </div>

                                ))}

                        </div>

                    </div>

                </section>


                {/* BOTTOM GRID */}
                <section className="bottom-grid">

                    {/* AUTOMATION */}
                    <div className="panel automation-panel">

                        <div className="panel-header">

                            <div>

                                <span className="panel-label">
                                    CONTROL MODE
                                </span>

                                <h2>
                                    Automation
                                </h2>

                            </div>

                            <div className="automation-icon">
                                ⚡
                            </div>

                        </div>


                        <div className="automation-content">

                            <div className="automation-status">

                                <span className="big-status-dot"></span>

                                <div>

                                    <strong>
                                        {automation.message}
                                    </strong>

                                    <p>
                                        System automatically adjusts
                                        nutrient dosing based on sensor data.
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* RECENT ACTIVITY */}
                    <div className="panel activity-panel">

                        <div className="panel-header">

                            <div>

                                <span className="panel-label">
                                    SYSTEM LOG
                                </span>

                                <h2>
                                    Recent Activity
                                </h2>

                            </div>

                        </div>


                        <div className="activity-list">

                            {activity.map((item, index) => (

                                <div
                                    className="activity"
                                    key={item.id}
                                >

                                    <span
                                        className={
                                            index === 0
                                                ? "activity-dot green"
                                                : index === 1
                                                    ? "activity-dot blue"
                                                    : "activity-dot orange"
                                        }
                                    ></span>

                                    <div>

                                        <strong>
                                            {item.message}
                                        </strong>

                                        <small>
                                            {new Date(
                                                item.created_at
                                            ).toLocaleString()}
                                        </small>

                                    </div>

                                </div>

                            ))}

                        </div>

                    </div>

                </section>
            </main>

        </div>
    );
}


export default Dashboard;