import { useState } from "react";

import Sidebar from "../components/Navbar";

import "../css/pump-control.css";

function PumpControl() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [pumps, setPumps] = useState([
        {
            id: 1,
            name: "Main Circulation Pump",
            type: "Water Circulation",
            icon: "🌊",
            gpio: "GPIO 25",
            status: true,
            speed: 75,
            runtime: "08h 42m",
            flow: "2.4 L/min"
        },
        {
            id: 2,
            name: "Nutrient Pump A",
            type: "Nutrient Dosing",
            icon: "🧪",
            gpio: "GPIO 26",
            status: true,
            speed: 60,
            runtime: "02h 18m",
            flow: "1.2 L/min"
        },
        {
            id: 3,
            name: "Nutrient Pump B",
            type: "Nutrient Dosing",
            icon: "💧",
            gpio: "GPIO 27",
            status: false,
            speed: 0,
            runtime: "00h 00m",
            flow: "0.0 L/min"
        }
    ]);

    const [autoMode, setAutoMode] = useState(true);

    const togglePump = (id) => {
        setPumps((currentPumps) =>
            currentPumps.map((pump) =>
                pump.id === id
                    ? {
                        ...pump,
                        status: !pump.status,
                        speed: !pump.status
                            ? pump.speed || 50
                            : 0
                    }
                    : pump
            )
        );
    };

    const updateSpeed = (id, speed) => {
        setPumps((currentPumps) =>
            currentPumps.map((pump) =>
                pump.id === id
                    ? {
                        ...pump,
                        speed: Number(speed),
                        status: Number(speed) > 0
                    }
                    : pump
            )
        );
    };

    return (
        <div className="pump-page">

            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            <main className="pump-main">

                {/* =====================================================
                    HEADER
                ====================================================== */}

                <header className="pump-header">

                    <div className="pump-header-left">

                        <button
                            className="pump-menu-button"
                            onClick={() => setSidebarOpen(true)}
                        >
                            ☰
                        </button>

                        <div>

                            <h1>Pump Control</h1>
                        </div>

                    </div>

                    <div className="pump-header-actions">

                        <div className="pump-header-status">
                            <span></span>
                            ESP32 ONLINE
                        </div>

                    </div>

                </header>


                {/* =====================================================
                    TOP STATS
                ====================================================== */}

                <section className="pump-stats">

                    {/* ACTIVE PUMPS */}

                    <div className="pump-stat-card">

                        <div className="pump-card-header">

                            <div className="pump-stat-icon">
                                ⚙️
                            </div>

                            <span className="pump-card-label">
                                ACTIVE PUMPS
                            </span>

                        </div>

                        <div className="pump-stat-value">
                            {pumps.filter((pump) => pump.status).length}
                            <span> / {pumps.length}</span>
                        </div>

                        <div className="pump-mini-status">
                            <span></span>
                            Pumps currently running
                        </div>

                        <div className="pump-stat-footer">
                            <span>System status</span>
                            <strong>Operational</strong>
                        </div>

                    </div>


                    {/* TOTAL FLOW */}

                    <div className="pump-stat-card">

                        <div className="pump-card-header">

                            <div className="pump-stat-icon">
                                🌊
                            </div>

                            <span className="pump-card-label">
                                TOTAL FLOW
                            </span>

                        </div>

                        <div className="pump-stat-value">
                            3.6
                            <span> L/min</span>
                        </div>

                        <div className="pump-flow-bars">

                            <span className="active"></span>
                            <span className="active"></span>
                            <span className="active"></span>
                            <span></span>
                            <span></span>

                        </div>

                        <div className="pump-stat-footer">
                            <span>Current circulation</span>
                            <strong>Stable</strong>
                        </div>

                    </div>


                    {/* POWER */}

                    <div className="pump-stat-card">

                        <div className="pump-card-header">

                            <div className="pump-stat-icon">
                                ⚡
                            </div>

                            <span className="pump-card-label">
                                POWER USAGE
                            </span>

                        </div>

                        <div className="pump-stat-value">
                            42
                            <span> W</span>
                        </div>

                        <div className="power-progress">

                            <div
                                className="power-progress-fill"
                                style={{ width: "42%" }}
                            />

                        </div>

                        <div className="pump-stat-footer">
                            <span>Today's average</span>
                            <strong>38 W</strong>
                        </div>

                    </div>


                    {/* CONTROL MODE */}

                    <div className="pump-stat-card">

                        <div className="pump-card-header">

                            <div className="pump-stat-icon">
                                🤖
                            </div>

                            <span className="pump-card-label">
                                CONTROL MODE
                            </span>

                        </div>

                        <div className="mode-value">
                            {autoMode ? "AUTO" : "MANUAL"}
                        </div>

                        <div className="mode-switch">

                            <button
                                className={autoMode ? "mode-active" : ""}
                                onClick={() => setAutoMode(true)}
                            >
                                AUTO
                            </button>

                            <button
                                className={!autoMode ? "mode-active" : ""}
                                onClick={() => setAutoMode(false)}
                            >
                                MANUAL
                            </button>

                        </div>

                        <div className="pump-stat-footer">
                            <span>Current controller</span>
                            <strong>
                                {autoMode ? "Automatic" : "User Control"}
                            </strong>
                        </div>

                    </div>

                </section>


                {/* =====================================================
                    MAIN CONTENT
                ====================================================== */}

                <section className="pump-content">

                    {/* =================================================
                        PUMP CONTROLLERS
                    ================================================== */}

                    <div className="pump-panel controllers-panel">

                        <div className="pump-panel-header">

                            <div>

                                <span className="pump-panel-label">
                                    DEVICE CONTROL
                                </span>

                                <h2>
                                    Pump Controllers
                                </h2>

                            </div>

                            <div className="live-badge">
                                <span></span>
                                LIVE
                            </div>

                        </div>


                        <div className="pump-list">

                            {pumps.map((pump) => (

                                <div
                                    className={`pump-control-card ${
                                        pump.status
                                            ? "pump-running"
                                            : "pump-stopped"
                                    }`}
                                    key={pump.id}
                                >

                                    <div className="pump-control-top">

                                        <div className="pump-device-icon">
                                            {pump.icon}
                                        </div>

                                        <div className="pump-device-info">

                                            <strong>
                                                {pump.name}
                                            </strong>

                                            <span>
                                                {pump.type}
                                            </span>

                                        </div>

                                        <div
                                            className={
                                                pump.status
                                                    ? "pump-status running"
                                                    : "pump-status stopped"
                                            }
                                        >
                                            <i></i>
                                            {pump.status
                                                ? "Running"
                                                : "Stopped"}
                                        </div>

                                    </div>


                                    <div className="pump-control-divider"></div>


                                    <div className="pump-control-details">

                                        <div className="pump-detail">

                                            <span>
                                                GPIO
                                            </span>

                                            <strong>
                                                {pump.gpio}
                                            </strong>

                                        </div>

                                        <div className="pump-detail">

                                            <span>
                                                FLOW
                                            </span>

                                            <strong>
                                                {pump.flow}
                                            </strong>

                                        </div>

                                        <div className="pump-detail">

                                            <span>
                                                RUNTIME
                                            </span>

                                            <strong>
                                                {pump.runtime}
                                            </strong>

                                        </div>

                                    </div>


                                    <div className="pump-speed">

                                        <div className="speed-header">

                                            <span>
                                                Pump Speed
                                            </span>

                                            <strong>
                                                {pump.speed}%
                                            </strong>

                                        </div>

                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={pump.speed}
                                            onChange={(event) =>
                                                updateSpeed(
                                                    pump.id,
                                                    event.target.value
                                                )
                                            }
                                            disabled={autoMode}
                                        />

                                        <div className="speed-scale">

                                            <span>0%</span>
                                            <span>50%</span>
                                            <span>100%</span>

                                        </div>

                                    </div>


                                    <div className="pump-control-actions">

                                        <button
                                            className={
                                                pump.status
                                                    ? "pump-toggle stop"
                                                    : "pump-toggle start"
                                            }
                                            onClick={() =>
                                                togglePump(pump.id)
                                            }
                                            disabled={autoMode}
                                        >
                                            {pump.status
                                                ? "■ Stop Pump"
                                                : "▶ Start Pump"}
                                        </button>

                                        <button className="pump-settings">
                                            ⚙ Settings
                                        </button>

                                    </div>

                                </div>

                            ))}

                        </div>

                    </div>


                    {/* =================================================
                        QUICK CONTROL
                    ================================================== */}

                    <div className="pump-panel quick-panel">

                        <div className="pump-panel-header">

                            <div>

                                <span className="pump-panel-label">
                                    QUICK CONTROL
                                </span>

                                <h2>
                                    System Actions
                                </h2>

                            </div>

                        </div>


                        <div className="quick-actions">

                            <button
                                className="quick-action"
                                disabled={autoMode}
                                onClick={() =>
                                    setPumps((items) =>
                                        items.map((pump) => ({
                                            ...pump,
                                            status: true,
                                            speed: pump.speed || 50
                                        }))
                                    )
                                }
                            >

                                <span className="quick-icon">
                                    ▶
                                </span>

                                <div>
                                    <strong>
                                        Start All
                                    </strong>

                                    <small>
                                        Activate all pumps
                                    </small>
                                </div>

                            </button>


                            <button
                                className="quick-action danger"
                                disabled={autoMode}
                                onClick={() =>
                                    setPumps((items) =>
                                        items.map((pump) => ({
                                            ...pump,
                                            status: false,
                                            speed: 0
                                        }))
                                    )
                                }
                            >

                                <span className="quick-icon">
                                    ■
                                </span>

                                <div>
                                    <strong>
                                        Stop All
                                    </strong>

                                    <small>
                                        Stop all pumps
                                    </small>
                                </div>

                            </button>


                            <button className="quick-action">

                                <span className="quick-icon">
                                    🔄
                                </span>

                                <div>
                                    <strong>
                                        Prime System
                                    </strong>

                                    <small>
                                        Run pumps for 30 seconds
                                    </small>
                                </div>

                            </button>


                            <button className="quick-action">

                                <span className="quick-icon">
                                    ⏱️
                                </span>

                                <div>
                                    <strong>
                                        Schedule
                                    </strong>

                                    <small>
                                        Configure pump timing
                                    </small>
                                </div>

                            </button>

                        </div>


                        <div className="emergency-box">

                            <div className="emergency-icon">
                                ⚠️
                            </div>

                            <div>

                                <strong>
                                    Emergency Stop
                                </strong>

                                <span>
                                    Immediately stop every connected pump.
                                </span>

                            </div>

                            <button
                                onClick={() =>
                                    setPumps((items) =>
                                        items.map((pump) => ({
                                            ...pump,
                                            status: false,
                                            speed: 0
                                        }))
                                    )
                                }
                            >
                                EMERGENCY STOP
                            </button>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    SCHEDULE
                ====================================================== */}

                <section className="pump-panel schedule-panel">

                    <div className="pump-panel-header">

                        <div>

                            <span className="pump-panel-label">
                                AUTOMATION
                            </span>

                            <h2>
                                Pump Schedule
                            </h2>

                        </div>

                        <button className="refresh-button">
                            + Add Schedule
                        </button>

                    </div>


                    <div className="schedule-table-wrapper">

                        <table className="schedule-table">

                            <thead>

                                <tr>
                                    <th>TIME</th>
                                    <th>PUMP</th>
                                    <th>DURATION</th>
                                    <th>SPEED</th>
                                    <th>STATUS</th>
                                </tr>

                            </thead>

                            <tbody>

                                <tr>

                                    <td>
                                        <strong>06:00 AM</strong>
                                    </td>

                                    <td>
                                        Main Circulation Pump
                                    </td>

                                    <td>
                                        30 min
                                    </td>

                                    <td>
                                        75%
                                    </td>

                                    <td>
                                        <span className="schedule-status">
                                            <i></i>
                                            Active
                                        </span>
                                    </td>

                                </tr>

                                <tr>

                                    <td>
                                        <strong>12:00 PM</strong>
                                    </td>

                                    <td>
                                        Nutrient Pump A
                                    </td>

                                    <td>
                                        5 min
                                    </td>

                                    <td>
                                        60%
                                    </td>

                                    <td>
                                        <span className="schedule-status">
                                            <i></i>
                                            Active
                                        </span>
                                    </td>

                                </tr>

                                <tr>

                                    <td>
                                        <strong>06:00 PM</strong>
                                    </td>

                                    <td>
                                        Main Circulation Pump
                                    </td>

                                    <td>
                                        30 min
                                    </td>

                                    <td>
                                        75%
                                    </td>

                                    <td>
                                        <span className="schedule-status">
                                            <i></i>
                                            Active
                                        </span>
                                    </td>

                                </tr>

                            </tbody>

                        </table>

                    </div>

                </section>


                {/* =====================================================
                    FOOTER
                ====================================================== */}

                <footer className="pump-footer">

                    <span>
                        © 2026 HydroControl
                    </span>

                    <span>
                        Pump Control System • ESP32
                    </span>

                    <span>
                        System Status: Online
                    </span>

                </footer>

            </main>

        </div>
    );
}

export default PumpControl;