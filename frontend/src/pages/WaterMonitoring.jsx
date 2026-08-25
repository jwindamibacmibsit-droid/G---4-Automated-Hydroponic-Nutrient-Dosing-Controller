import {
    useEffect,
    useState
} from "react";

import Sidebar from "../components/Navbar";

import "../css/water-monitoring.css";


const API_BASE = "http://localhost:8000/api/water_monitoring.php";


function WaterMonitoring() {

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [waterData, setWaterData] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    /*
    |--------------------------------------------------------------------------
    | LOAD WATER DATA
    |--------------------------------------------------------------------------
    */

    const loadWaterData = async () => {

        try {

            const response = await fetch(
                `${API_BASE}`
            );

            if (!response.ok) {

                throw new Error(
                    `HTTP Error: ${response.status}`
                );

            }

            const result = await response.json();

            if (!result.success) {

                throw new Error(
                    result.message ||
                    "Unable to load water data."
                );

            }

            setWaterData(result.data);

            setError("");

        } catch (err) {

            console.error(
                "Water API Error:",
                err
            );

            setError(
                "Unable to connect to water monitoring API."
            );

        } finally {

            setLoading(false);

        }
    };


    /*
    |--------------------------------------------------------------------------
    | INITIAL LOAD + AUTO REFRESH
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        loadWaterData();

        const interval = setInterval(
            loadWaterData,
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
            <div className="water-page">

                <Sidebar
                    isOpen={sidebarOpen}
                    setIsOpen={setSidebarOpen}
                />

                <main className="water-main">

                    <div className="water-loading">
                        Loading water monitoring...
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

    if (error || !waterData) {

        return (
            <div className="water-page">

                <Sidebar
                    isOpen={sidebarOpen}
                    setIsOpen={setSidebarOpen}
                />

                <main className="water-main">

                    <div className="water-error">

                        <h2>
                            Water Monitoring Unavailable
                        </h2>

                        <p>
                            {error}
                        </p>

                        <button
                            onClick={loadWaterData}
                        >
                            ↻ Retry
                        </button>

                    </div>

                </main>

            </div>
        );
    }


    /*
    |--------------------------------------------------------------------------
    | API DATA
    |--------------------------------------------------------------------------
    */

    const {
        water,
        temperature,
        flow,
        quality,
        sensors,
        sensor_count,
        device,
        readings,
        system
    } = waterData;


    /*
    |--------------------------------------------------------------------------
    | SAFE VALUES
    |--------------------------------------------------------------------------
    */

    const waterPercentage =
        water?.percentage ?? 0;

    const waterLiters =
        water?.liters ?? 0;

    const waterCapacity =
        water?.capacity ?? 0;

    const lowWaterAlert =
        water?.low_alert ?? 0;

    const temperatureValue =
        temperature?.value ?? 0;

    const flowValue =
        flow?.value ?? 0;

    const averageFlow =
        flow?.today_average ?? 0;

    const waterStatus =
        water?.status ?? "Unknown";

    const flowStatus =
        flow?.status ?? "Unknown";

    const sensorTotal =
        sensor_count?.total ?? 0;

    const sensorOnline =
        sensor_count?.online ?? 0;



    /*
    |--------------------------------------------------------------------------
    | SENSOR ICON
    |--------------------------------------------------------------------------
    */

    const getSensorIcon = (type) => {

        switch (type) {

            case "water_level":
                return "💧";

            case "temperature":
                return "🌡️";

            case "flow":
                return "🌊";

            default:
                return "📡";
        }
    };


    /*
    |--------------------------------------------------------------------------
    | SENSOR TYPE LABEL
    |--------------------------------------------------------------------------
    */

    const getSensorTypeLabel = (type) => {

        switch (type) {

            case "water_level":
                return "Analog";

            default:
                return "Sensor";
        }
    };


    /*
    |--------------------------------------------------------------------------
    | SENSOR STATUS
    |--------------------------------------------------------------------------
    */

    const getSensorStatus = (status) => {

        if (status === "online") {
            return "Online";
        }

        if (status === "error") {
            return "Error";
        }

        return "Offline";
    };


    return (

        <div className="water-page">

            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />


            <main className="water-main">

                {/* HEADER */}

                <header className="water-header">

                    <div className="water-header-left">

                        <button
                            className="water-menu-button"
                            onClick={() =>
                                setSidebarOpen(true)
                            }
                        >
                            ☰
                        </button>


                        <div>
                            <h1>
                                Water Monitoring
                            </h1>
                        </div>

                    </div>


                    <div className="water-header-status">

                        <span></span>

                        {device?.status === "online"
                            ? "ESP32 ONLINE"
                            : "ESP32 OFFLINE"}

                    </div>

                </header>


                {/* TOP CARDS */}

                <section className="water-stats">


                    {/* WATER LEVEL */}

                    <div className="water-stat-card">

                        <div className="water-card-header">

                            <div className="water-stat-icon">
                                💧
                            </div>


                            <span className="water-card-label">
                                WATER LEVEL
                            </span>


                            <span
                                className={
                                    waterStatus === "Normal"
                                        ? "normal-badge"
                                        : "normal-badge warning"
                                }
                            >
                                {waterStatus.toUpperCase()}
                            </span>

                        </div>


                        <div className="water-stat-value">

                            {waterPercentage}

                            <span>
                                %
                            </span>

                        </div>


                        <div className="water-progress">

                            <div
                                className="water-progress-fill"
                                style={{
                                    width:
                                        `${waterPercentage}%`
                                }}
                            />

                        </div>


                        <div className="water-stat-footer">

                            <span>
                                Current level
                            </span>

                            <strong>
                                {waterLiters} / {waterCapacity} L
                            </strong>

                        </div>

                    </div>

                    {/* FLOW RATE */}

                    <div className="water-stat-card">

                        <div className="water-card-header">

                            <div className="water-stat-icon">
                                🌊
                            </div>


                            <span className="water-card-label">
                                FLOW RATE
                            </span>

                        </div>


                        <div className="water-stat-value">

                            {flowValue}

                            <span>
                                {flowValue}L/min
                            </span>

                        </div>


                        <div className="flow-indicator">

                            <span className="flow-wave">
                                ≋
                            </span>


                            <span>
                                {flowStatus === "Normal"
                                    ? "Stable water circulation"
                                    : `Water circulation ${flowStatus.toLowerCase()}`}
                            </span>

                        </div>


                        <div className="water-stat-footer">

                            <span>
                                Today's average
                            </span>

                            <strong>
                                {averageFlow} L/min
                            </strong>

                        </div>

                    </div>


                    {/* WATER QUALITY */}

                    <div className="water-stat-card">

                        <div className="water-card-header">

                            <div className="water-stat-icon">
                                ✨
                            </div>


                            <span className="water-card-label">
                                WATER QUALITY
                            </span>

                        </div>


                        <div className="quality-value">

                            {quality?.value ?? "UNKNOWN"}

                        </div>


                        <div className="quality-bars">

                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>

                        </div>


                        <div className="water-stat-footer">

                            <span>
                                Sensor condition
                            </span>

                            <strong>
                                {quality?.condition ?? "Unknown"}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* MAIN CONTENT */}

                <section className="water-content">


                    {/* RESERVOIR */}

                    <div className="water-panel reservoir-panel">

                        <div className="water-panel-header">

                            <div>

                                <span className="water-panel-label">
                                    RESERVOIR
                                </span>


                                <h2>
                                    Water Tank Level
                                </h2>

                            </div>


                            <div className="live-badge">

                                <span></span>

                                LIVE

                            </div>

                        </div>


                        <div className="reservoir-area">


                            <div className="tank-container">

                                <div className="tank-cap">
                                    RESERVOIR
                                </div>


                                <div className="tank">

                                    <div
                                        className="tank-water"
                                        style={{
                                            height:
                                                `${waterPercentage}%`
                                        }}
                                    >

                                        <div className="water-wave wave-one"></div>

                                        <div className="water-wave wave-two"></div>


                                        <div className="tank-percent">

                                            {waterPercentage}%

                                        </div>


                                        <div className="tank-liters">

                                            {waterLiters} Liters

                                        </div>

                                    </div>

                                </div>


                                <div className="tank-base"></div>

                            </div>


                            <div className="reservoir-details">


                                <div className="level-detail">

                                    <div className="detail-icon">
                                        💧
                                    </div>


                                    <div>

                                        <span>
                                            Current Level
                                        </span>

                                        <strong>
                                            {waterLiters} L
                                        </strong>

                                    </div>

                                </div>


                                <div className="level-detail">

                                    <div className="detail-icon">
                                        📏
                                    </div>


                                    <div>

                                        <span>
                                            Tank Capacity
                                        </span>

                                        <strong>
                                            {waterCapacity} L
                                        </strong>

                                    </div>

                                </div>


                                <div className="level-detail">

                                    <div className="detail-icon">
                                        ⚠️
                                    </div>


                                    <div>

                                        <span>
                                            Low Level Alert
                                        </span>

                                        <strong>
                                            {lowWaterAlert} L
                                        </strong>

                                    </div>

                                </div>


                                <div className="level-detail">

                                    <div className="detail-icon">
                                        📈
                                    </div>


                                    <div>

                                        <span>
                                            Last Change
                                        </span>

                                        <strong>
                                            {water?.last_change >= 0
                                                ? `+${water.last_change}%`
                                                : `${water?.last_change}%`}
                                        </strong>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* SENSOR STATUS */}

                    <div className="water-panel sensor-panel">

                        <div className="water-panel-header">

                            <div>

                                <span className="water-panel-label">
                                    HARDWARE
                                </span>


                                <h2>
                                    Sensor Status
                                </h2>

                            </div>


                            <div className="sensor-count">

                                {sensorOnline} / {sensorTotal}

                            </div>

                        </div>


                        <div className="sensor-list">

                            {sensors?.map((sensor) => (

                                <div
                                    className="sensor-item"
                                    key={sensor.id}
                                >

                                    <div className="sensor-symbol">

                                        {getSensorIcon(
                                            sensor.type
                                        )}

                                    </div>


                                    <div className="sensor-info">

                                        <strong>
                                            {sensor.name}
                                        </strong>

                                        <span>

                                            {sensor.gpio}

                                            {" • "}

                                            {getSensorTypeLabel(
                                                sensor.type
                                            )}

                                        </span>

                                    </div>


                                    <div
                                        className={
                                            sensor.status === "online"
                                                ? "sensor-online"
                                                : "sensor-online offline"
                                        }
                                    >

                                        <i></i>

                                        {getSensorStatus(
                                            sensor.status
                                        )}

                                    </div>

                                </div>

                            ))}


                            {/* ESP32 CONTROLLER */}

                            <div className="sensor-item">

                                <div className="sensor-symbol">
                                    📡
                                </div>


                                <div className="sensor-info">

                                    <strong>
                                        ESP32 Controller
                                    </strong>

                                    <span>
                                        Wi-Fi • {device?.status === "online"
                                            ? "Connected"
                                            : "Disconnected"}
                                    </span>

                                </div>


                                <div
                                    className={
                                        device?.status === "online"
                                            ? "sensor-online"
                                            : "sensor-online offline"
                                    }
                                >

                                    <i></i>

                                    {device?.status === "online"
                                        ? "Online"
                                        : "Offline"}

                                </div>

                            </div>

                        </div>

                    </div>

                </section>


                {/* READINGS */}

                <section className="water-panel readings-panel">

                    <div className="water-panel-header">

                        <div>

                            <span className="water-panel-label">
                                SENSOR HISTORY
                            </span>


                            <h2>
                                Recent Water Readings
                            </h2>

                        </div>


                        <button
                            className="refresh-button"
                            onClick={loadWaterData}
                        >
                            ↻ Refresh
                        </button>

                    </div>


                    <div className="readings-table-wrapper">

                        <table className="readings-table">

                            <thead>

                                <tr>

                                    <th>
                                        TIME
                                    </th>

                                    <th>
                                        WATER LEVEL
                                    </th>

                                    <th>
                                        STATUS
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {readings?.length > 0 ? (

                                    readings.map(
                                        (reading, index) => (

                                            <tr
                                                key={
                                                    reading.datetime ||
                                                    index
                                                }
                                            >

                                                <td>
                                                    {reading.datetime}
                                                </td>


                                                <td>

                                                    <strong>
                                                        {reading.level}
                                                    </strong>

                                                </td>

                                                <td>

                                                    <span className="table-status">

                                                        <i></i>

                                                        {reading.status}

                                                    </span>

                                                </td>

                                            </tr>

                                        )
                                    )

                                ) : (

                                    <tr>

                                        <td
                                            colSpan="5"
                                            className="no-readings"
                                        >
                                            No sensor readings available.
                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>
            </main>

        </div>
    );
}


export default WaterMonitoring;