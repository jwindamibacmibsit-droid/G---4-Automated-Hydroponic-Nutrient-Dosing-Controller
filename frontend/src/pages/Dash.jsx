import React from "react";

import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

import "../css/dashboard.css";

function Dashboard() {
    // =====================================================
    // SENSOR DATA
    // =====================================================

    const waterData = [
        { time: "08:00", temperature: 23.8, ph: 6.1 },
        { time: "09:00", temperature: 24.2, ph: 6.2 },
        { time: "10:00", temperature: 24.7, ph: 6.0 },
        { time: "11:00", temperature: 25.1, ph: 6.3 },
        { time: "12:00", temperature: 25.4, ph: 6.2 },
        { time: "13:00", temperature: 25.0, ph: 6.1 },
        { time: "14:00", temperature: 24.8, ph: 6.2 }
    ];

    const nutrientData = [
        { time: "08:00", nitrogen: 72, phosphorus: 61, potassium: 78 },
        { time: "09:00", nitrogen: 70, phosphorus: 63, potassium: 76 },
        { time: "10:00", nitrogen: 68, phosphorus: 64, potassium: 74 },
        { time: "11:00", nitrogen: 67, phosphorus: 60, potassium: 72 },
        { time: "12:00", nitrogen: 65, phosphorus: 59, potassium: 70 },
        { time: "13:00", nitrogen: 64, phosphorus: 58, potassium: 68 },
        { time: "14:00", nitrogen: 62, phosphorus: 57, potassium: 67 }
    ];

    const pumpData = [
        { name: "Pump 1", runtime: 82 },
        { name: "Pump 2", runtime: 64 },
        { name: "Pump 3", runtime: 48 },
        { name: "Pump 4", runtime: 71 }
    ];

    // =====================================================
    // SENSOR CARD
    // =====================================================

    const SensorCard = ({
        icon,
        title,
        value,
        unit,
        status,
        description
    }) => (
        <div className="sensor-card">
            <div className="sensor-card-top">
                <div className="sensor-icon">
                    {icon}
                </div>

                <span className={`sensor-status ${status}`}>
                    {status === "normal" ? "● Normal" : "● Warning"}
                </span>
            </div>

            <div className="sensor-title">
                {title}
            </div>

            <div className="sensor-value">
                {value}
                <span>{unit}</span>
            </div>

            <div className="sensor-description">
                {description}
            </div>
        </div>
    );

    return (
        <div className="dashboard">

            {/* =================================================
                HEADER
            ================================================== */}

            <header className="dashboard-header">
                <div>
                    <div className="dashboard-breadcrumb">
                        HydroControl / Dashboard
                    </div>

                    <h1>
                        Hydroponic Control Center
                    </h1>

                    <p>
                        Monitor and manage your hydroponic system
                        in real time.
                    </p>
                </div>

                <div className="system-status">
                    <span className="status-dot"></span>

                    <div>
                        <strong>System Online</strong>
                        <small>
                            All systems operational
                        </small>
                    </div>
                </div>
            </header>


            {/* =================================================
                OVERVIEW CARDS
            ================================================== */}

            <section className="sensor-grid">

                <SensorCard
                    icon="🌡️"
                    title="Water Temperature"
                    value="24.8"
                    unit="°C"
                    status="normal"
                    description="Optimal range: 22–26°C"
                />

                <SensorCard
                    icon="⚗️"
                    title="pH Level"
                    value="6.2"
                    unit="pH"
                    status="normal"
                    description="Optimal range: 5.8–6.5"
                />

                <SensorCard
                    icon="💧"
                    title="Water Level"
                    value="78"
                    unit="%"
                    status="normal"
                    description="Reservoir capacity"
                />

                <SensorCard
                    icon="🧪"
                    title="Nutrient Level"
                    value="1.42"
                    unit="EC"
                    status="normal"
                    description="Optimal range: 1.2–1.8 EC"
                />

            </section>


            {/* =================================================
                3D SYSTEM STATUS
            ================================================== */}

            <section className="system-overview">

                <div className="system-3d-card">

                    <div className="system-3d-header">
                        <div>
                            <span className="section-label">
                                SYSTEM STATUS
                            </span>

                            <h2>
                                Hydroponic Environment
                            </h2>
                        </div>

                        <span className="live-badge">
                            ● LIVE
                        </span>
                    </div>

                    <div className="hydroponic-visual">

                        <div className="water-tank">

                            <div className="tank-top">
                                RESERVOIR
                            </div>

                            <div className="water-level">
                                <span>78%</span>
                            </div>

                            <div className="tank-bottom">
                                WATER TANK
                            </div>

                        </div>

                        <div className="plant-system">

                            <div className="plant">
                                🌿
                            </div>

                            <div className="plant">
                                🌱
                            </div>

                            <div className="plant">
                                🌿
                            </div>

                            <div className="plant">
                                🌱
                            </div>

                        </div>

                        <div className="pipe pipe-one"></div>
                        <div className="pipe pipe-two"></div>

                    </div>

                    <div className="system-stats">

                        <div>
                            <span>Pumps</span>
                            <strong>4 / 4</strong>
                        </div>

                        <div>
                            <span>Sensors</span>
                            <strong>8 / 8</strong>
                        </div>

                        <div>
                            <span>Automation</span>
                            <strong>ON</strong>
                        </div>

                        <div>
                            <span>Uptime</span>
                            <strong>99.8%</strong>
                        </div>

                    </div>

                </div>

            </section>


            {/* =================================================
                CHARTS
            ================================================== */}

            <section className="charts-grid">

                {/* WATER ENVIRONMENT */}

                <div className="chart-card">

                    <div className="chart-header">

                        <div>
                            <span className="section-label">
                                WATER MONITORING
                            </span>

                            <h3>
                                Temperature & pH
                            </h3>
                        </div>

                        <span className="chart-period">
                            Last 7 Hours
                        </span>

                    </div>

                    <ResponsiveContainer
                        width="100%"
                        height={300}
                    >
                        <LineChart data={waterData}>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                opacity={0.15}
                            />

                            <XAxis
                                dataKey="time"
                            />

                            <YAxis />

                            <Tooltip />

                            <Legend />

                            <Line
                                type="monotone"
                                dataKey="temperature"
                                name="Temperature °C"
                                strokeWidth={3}
                                dot={{ r: 4 }}
                            />

                            <Line
                                type="monotone"
                                dataKey="ph"
                                name="pH"
                                strokeWidth={3}
                                dot={{ r: 4 }}
                            />

                        </LineChart>
                    </ResponsiveContainer>

                </div>


                {/* NUTRIENTS */}

                <div className="chart-card">

                    <div className="chart-header">

                        <div>
                            <span className="section-label">
                                NUTRIENT CONTROL
                            </span>

                            <h3>
                                Nutrient Levels
                            </h3>
                        </div>

                        <span className="chart-period">
                            Last 7 Hours
                        </span>

                    </div>

                    <ResponsiveContainer
                        width="100%"
                        height={300}
                    >
                        <AreaChart data={nutrientData}>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                opacity={0.15}
                            />

                            <XAxis
                                dataKey="time"
                            />

                            <YAxis />

                            <Tooltip />

                            <Legend />

                            <Area
                                type="monotone"
                                dataKey="nitrogen"
                                name="Nitrogen"
                                fillOpacity={0.15}
                                strokeWidth={2}
                            />

                            <Area
                                type="monotone"
                                dataKey="phosphorus"
                                name="Phosphorus"
                                fillOpacity={0.15}
                                strokeWidth={2}
                            />

                            <Area
                                type="monotone"
                                dataKey="potassium"
                                name="Potassium"
                                fillOpacity={0.15}
                                strokeWidth={2}
                            />

                        </AreaChart>
                    </ResponsiveContainer>

                </div>

            </section>


            {/* =================================================
                PUMP CONTROL + QUICK STATUS
            ================================================== */}

            <section className="bottom-grid">

                <div className="chart-card">

                    <div className="chart-header">

                        <div>
                            <span className="section-label">
                                PUMP CONTROL
                            </span>

                            <h3>
                                Pump Runtime
                            </h3>
                        </div>

                    </div>

                    <ResponsiveContainer
                        width="100%"
                        height={280}
                    >
                        <BarChart data={pumpData}>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                opacity={0.15}
                            />

                            <XAxis
                                dataKey="name"
                            />

                            <YAxis />

                            <Tooltip />

                            <Bar
                                dataKey="runtime"
                                name="Runtime %"
                                radius={[8, 8, 0, 0]}
                            />

                        </BarChart>
                    </ResponsiveContainer>

                </div>


                {/* QUICK STATUS */}

                <div className="quick-status-card">

                    <div className="chart-header">

                        <div>
                            <span className="section-label">
                                CONTROL CENTER
                            </span>

                            <h3>
                                System Components
                            </h3>
                        </div>

                    </div>

                    <div className="component-list">

                        <div className="component-item">
                            <div className="component-icon">
                                💧
                            </div>

                            <div>
                                <strong>
                                    Water Pump
                                </strong>

                                <span>
                                    Running normally
                                </span>
                            </div>

                            <b className="online">
                                ON
                            </b>
                        </div>


                        <div className="component-item">
                            <div className="component-icon">
                                🧪
                            </div>

                            <div>
                                <strong>
                                    Nutrient Pump
                                </strong>

                                <span>
                                    Automatic mode
                                </span>
                            </div>

                            <b className="online">
                                AUTO
                            </b>
                        </div>


                        <div className="component-item">
                            <div className="component-icon">
                                ⚗️
                            </div>

                            <div>
                                <strong>
                                    pH Controller
                                </strong>

                                <span>
                                    Stable at 6.2
                                </span>
                            </div>

                            <b className="online">
                                OK
                            </b>
                        </div>


                        <div className="component-item">
                            <div className="component-icon">
                                📡
                            </div>

                            <div>
                                <strong>
                                    ESP32 Controller
                                </strong>

                                <span>
                                    Connected
                                </span>
                            </div>

                            <b className="online">
                                ONLINE
                            </b>
                        </div>

                    </div>

                </div>

            </section>


            {/* =================================================
                FOOTER
            ================================================== */}

            <footer className="dashboard-footer">

                <span>
                    HydroControl ESP32 System
                </span>

                <span>
                    Last updated: Just now
                </span>

            </footer>

        </div>
    );
}

export default Dashboard;