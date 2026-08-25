import { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Navbar";
import "../css/ph-control.css";

const API_URL = "http://localhost:8000/api/ph-control.php";
const DEVICE_UID = "ESP32-HYDRO-001";

const TARGET_PH = 6.0;
const MIN_PH = 5.8;
const MAX_PH = 6.5;
const DEADBAND = 0.2;
const DOSE_LIMIT = 15;

function PhControl() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [autoMode, setAutoMode] = useState(true);

    const [phDownPump, setPhDownPump] = useState(false);
    const [phUpPump, setPhUpPump] = useState(false);

    const [loading, setLoading] = useState(true);
    const [commandLoading, setCommandLoading] = useState(false);

    const [error, setError] = useState("");

    const [data, setData] = useState({
        device: {
            id: null,
            name: "",
            uid: DEVICE_UID,
            type: "",
            firmware: "",
            status: "offline",
            last_seen: null
        },

        ph: {
            value: 0,
            raw: 0,
            status: "unknown",
            recorded_at: null
        },

        water: {
            percentage: 0,
            raw: 0,
            status: "unknown",
            recorded_at: null
        },

        relays: {
            ph_up: false,
            ph_down: false,
            nutrient_a: false,
            nutrient_b: false
        },

        history: []
    });

    /*
    |--------------------------------------------------------------------------
    | LOAD DATA
    |--------------------------------------------------------------------------
    */

    const loadData = useCallback(async () => {
        try {
            setError("");

            const response = await fetch(
                `${API_URL}?device_uid=${encodeURIComponent(DEVICE_UID)}`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json"
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(
                    result.message || "Failed to load pH data."
                );
            }

            const apiData = result.data || {};

            setData({
                device: {
                    id: apiData.device?.id ?? null,
                    name: apiData.device?.name ?? "",
                    uid: apiData.device?.uid ?? DEVICE_UID,
                    type: apiData.device?.type ?? "",
                    firmware: apiData.device?.firmware ?? "",
                    status: apiData.device?.status ?? "offline",
                    last_seen: apiData.device?.last_seen ?? null
                },

                ph: {
                    value: Number(apiData.ph?.value ?? 0),
                    raw: Number(apiData.ph?.raw ?? 0),
                    status: apiData.ph?.status ?? "unknown",
                    recorded_at: apiData.ph?.recorded_at ?? null
                },

                water: {
                    percentage: Number(
                        apiData.water?.percentage ?? 0
                    ),
                    raw: Number(apiData.water?.raw ?? 0),
                    status: apiData.water?.status ?? "unknown",
                    recorded_at:
                        apiData.water?.recorded_at ?? null
                },

                relays: {
                    ph_up: Boolean(apiData.relays?.ph_up),
                    ph_down: Boolean(apiData.relays?.ph_down),
                    nutrient_a: Boolean(
                        apiData.relays?.nutrient_a
                    ),
                    nutrient_b: Boolean(
                        apiData.relays?.nutrient_b
                    )
                },

                history: Array.isArray(apiData.history)
                    ? apiData.history
                    : []
            });

            setPhUpPump(
                Boolean(apiData.relays?.ph_up)
            );

            setPhDownPump(
                Boolean(apiData.relays?.ph_down)
            );

        } catch (err) {
            console.error("pH API Error:", err);

            setError(
                err.message ||
                "Unable to connect to HydroControl API."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    /*
    |--------------------------------------------------------------------------
    | AUTO REFRESH
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        loadData();

        const interval = setInterval(
            loadData,
            3000
        );

        return () => clearInterval(interval);
    }, [loadData]);

    /*
    |--------------------------------------------------------------------------
    | RELAY COMMAND
    |--------------------------------------------------------------------------
    */

    const sendPumpCommand = async (pump, state) => {
        if (autoMode) {
            setError(
                "Switch to MANUAL mode before controlling the pumps."
            );
            return;
        }

        try {
            setCommandLoading(true);
            setError("");

            const response = await fetch(API_URL, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },

                body: JSON.stringify({
                    action: "relay",
                    device_uid: DEVICE_UID,
                    pump,
                    state: Boolean(state)
                })
            });

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}`
                );
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(
                    result.message ||
                    "Pump command failed."
                );
            }

            if (pump === "ph_up") {
                setPhUpPump(Boolean(state));
            }

            if (pump === "ph_down") {
                setPhDownPump(Boolean(state));
            }

            await loadData();

        } catch (err) {
            console.error(
                "Pump command error:",
                err
            );

            setError(
                err.message ||
                "Unable to control pump."
            );
        } finally {
            setCommandLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | AUTO / MANUAL MODE
    |--------------------------------------------------------------------------
    */

    const toggleAutoMode = async () => {
        const newMode = !autoMode;

        try {
            setCommandLoading(true);
            setError("");

            const response = await fetch(API_URL, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },

                body: JSON.stringify({
                    action: "mode",
                    device_uid: DEVICE_UID,
                    auto_mode: newMode
                })
            });

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}`
                );
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(
                    result.message ||
                    "Failed to change control mode."
                );
            }

            setAutoMode(newMode);

            /*
             * Safety:
             * Turning AUTO on should stop manual pumps.
             */

            if (newMode) {
                setPhUpPump(false);
                setPhDownPump(false);
            }

        } catch (err) {
            console.error(
                "Mode error:",
                err
            );

            setError(
                err.message ||
                "Unable to change control mode."
            );
        } finally {
            setCommandLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | PH CALCULATIONS
    |--------------------------------------------------------------------------
    */

    const ph = Number(
        data.ph?.value ?? 0
    );

    const phStatus =
        ph <= 0
            ? "UNKNOWN"
            : ph < MIN_PH
                ? "LOW"
                : ph > MAX_PH
                    ? "HIGH"
                    : "NORMAL";

    const phPosition = Math.min(
        100,
        Math.max(
            0,
            ((ph - 4) / 4) * 100
        )
    );

    const deviation =
        ph - TARGET_PH;

    const getDeviation = () => {
        if (ph <= 0) {
            return "—";
        }

        if (deviation === 0) {
            return "0.00 pH";
        }

        return deviation > 0
            ? `+${deviation.toFixed(2)} pH`
            : `${deviation.toFixed(2)} pH`;
    };

    /*
    |--------------------------------------------------------------------------
    | HISTORY
    |--------------------------------------------------------------------------
    */

    const history =
        Array.isArray(data.history)
            ? data.history
            : [];

    /*
    |--------------------------------------------------------------------------
    | DEVICE STATUS
    |--------------------------------------------------------------------------
    */

    const deviceOnline =
        data.device?.status === "online";

    /*
    |--------------------------------------------------------------------------
    | SENSOR STATUS
    |--------------------------------------------------------------------------
    */

    const phSensorOnline =
        data.ph?.status !== "unknown";

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <div className="ph-page">

            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            <main className="ph-main">

                {/* =====================================================
                    HEADER
                ====================================================== */}

                <header className="ph-header">

                    <div className="ph-header-left">

                        <button
                            className="ph-menu-button"
                            onClick={() =>
                                setSidebarOpen(true)
                            }
                            aria-label="Open menu"
                        >
                            ☰
                        </button>

                        <div>

                            <h1>
                                pH Control
                            </h1>
                        </div>

                    </div>

                    <div
                        className={`ph-header-status ${
                            deviceOnline
                                ? "online"
                                : "offline"
                        }`}
                    >

                        <span></span>

                        {deviceOnline
                            ? "ESP32 ONLINE"
                            : "ESP32 OFFLINE"}

                    </div>

                </header>

                {/* =====================================================
                    ERROR
                ====================================================== */}

                {error && (
                    <div className="ph-api-error">
                        ⚠ {error}
                    </div>
                )}

                {/* =====================================================
                    STAT CARDS
                ====================================================== */}

                <section className="ph-stats">

                    {/* CURRENT PH */}

                    <div className="ph-stat-card">

                        <div className="ph-card-header">

                            <div className="ph-stat-icon">
                                🧪
                            </div>

                            <span className="ph-card-label">
                                CURRENT PH
                            </span>

                            <span
                                className={
                                    phStatus === "NORMAL"
                                        ? "ph-normal-badge"
                                        : "ph-warning-badge"
                                }
                            >
                                {loading
                                    ? "LOADING"
                                    : phStatus}
                            </span>

                        </div>

                        <div className="ph-stat-value">

                            {loading
                                ? "—"
                                : ph.toFixed(2)}

                            <span>
                                {" "}pH
                            </span>

                        </div>

                        <div className="ph-main-scale">

                            <div className="ph-main-track">

                                <div
                                    className="ph-main-point"
                                    style={{
                                        left:
                                            `${phPosition}%`
                                    }}
                                />

                            </div>

                            <div className="ph-scale-labels">
                                <span>4.0</span>
                                <span>5.0</span>
                                <span>6.0</span>
                                <span>7.0</span>
                                <span>8.0</span>
                            </div>

                        </div>

                        <div className="ph-stat-footer">

                            <span>
                                Target
                            </span>

                            <strong>
                                {MIN_PH} - {MAX_PH}
                            </strong>

                        </div>

                    </div>

                    {/* TARGET PH */}

                    <div className="ph-stat-card">

                        <div className="ph-card-header">

                            <div className="ph-stat-icon">
                                🎯
                            </div>

                            <span className="ph-card-label">
                                TARGET PH
                            </span>

                        </div>

                        <div className="ph-stat-value">

                            {TARGET_PH.toFixed(1)}

                            <span>
                                {" "}pH
                            </span>

                        </div>

                        <div className="target-range">

                            <div className="target-range-line">

                                <div className="target-range-safe">
                                    <span></span>
                                </div>

                            </div>

                            <div className="target-range-labels">

                                <span>
                                    {MIN_PH}
                                </span>

                                <strong>
                                    IDEAL
                                </strong>

                                <span>
                                    {MAX_PH}
                                </span>

                            </div>

                        </div>

                        <div className="ph-stat-footer">

                            <span>
                                Deviation
                            </span>

                            <strong>
                                {getDeviation()}
                            </strong>

                        </div>

                    </div>

                    {/* STABILITY */}

                    <div className="ph-stat-card">

                        <div className="ph-card-header">

                            <div className="ph-stat-icon">
                                📈
                            </div>

                            <span className="ph-card-label">
                                PH STABILITY
                            </span>

                        </div>

                        <div className="stability-value">

                            {phStatus === "NORMAL"
                                ? "STABLE"
                                : phStatus === "UNKNOWN"
                                    ? "UNKNOWN"
                                    : "CHECK"}

                        </div>

                        <div className="stability-chart">

                            {history
                                .slice(0, 10)
                                .reverse()
                                .map(
                                    (item) => {

                                        const value =
                                            Number(
                                                item.ph ?? 0
                                            );

                                        const height =
                                            Math.min(
                                                100,
                                                Math.max(
                                                    10,
                                                    ((value - 4) / 4) *
                                                        100
                                                )
                                            );

                                        return (
                                            <span
                                                key={
                                                    item.id
                                                }
                                                style={{
                                                    height:
                                                        `${height}%`
                                                }}
                                                title={
                                                    `${value.toFixed(
                                                        2
                                                    )} pH`
                                                }
                                            />
                                        );
                                    }
                                )}

                        </div>

                        <div className="ph-stat-footer">

                            <span>
                                Recent readings
                            </span>

                            <strong>
                                {history.length}
                            </strong>

                        </div>

                    </div>

                    {/* CONTROL MODE */}

                    <div className="ph-stat-card">

                        <div className="ph-card-header">

                            <div className="ph-stat-icon">
                                ⚙️
                            </div>

                            <span className="ph-card-label">
                                CONTROL MODE
                            </span>

                        </div>

                        <div className="control-mode-value">

                            {autoMode
                                ? "AUTO"
                                : "MANUAL"}

                        </div>

                        <div className="control-mode-indicator">

                            <span
                                className={
                                    autoMode
                                        ? "mode-active"
                                        : ""
                                }
                            >
                                AUTO
                            </span>

                            <span
                                className={
                                    !autoMode
                                        ? "mode-active"
                                        : ""
                                }
                            >
                                MANUAL
                            </span>

                        </div>

                        <div className="ph-stat-footer">

                            <span>
                                System control
                            </span>

                            <strong>
                                {autoMode
                                    ? "Automatic"
                                    : "Manual"}
                            </strong>

                        </div>

                    </div>

                </section>

                {/* =====================================================
                    MAIN CONTENT
                ====================================================== */}

                <section className="ph-content">

                    {/* =================================================
                        PH MANAGEMENT
                    ================================================== */}

                    <div className="ph-panel ph-control-panel">

                        <div className="ph-panel-header">

                            <div>

                                <span className="ph-panel-label">
                                    PH MANAGEMENT
                                </span>

                                <h2>
                                    Automatic pH Control
                                </h2>

                            </div>

                            <div className="ph-live-badge">

                                <span></span>

                                LIVE

                            </div>

                        </div>

                        {/* GAUGE */}

                        <div className="ph-gauge-section">

                            <div className="ph-gauge">

                                <div className="ph-gauge-inner">

                                    <span className="gauge-label">
                                        CURRENT
                                    </span>

                                    <strong>
                                        {ph.toFixed(2)}
                                    </strong>

                                    <small>
                                        pH
                                    </small>

                                </div>

                            </div>

                            <div className="gauge-info">

                                <div className="gauge-info-item">
                                    <span>
                                        Current
                                    </span>

                                    <strong>
                                        {ph.toFixed(2)} pH
                                    </strong>
                                </div>

                                <div className="gauge-info-item">
                                    <span>
                                        Target
                                    </span>

                                    <strong>
                                        {TARGET_PH.toFixed(1)} pH
                                    </strong>
                                </div>

                                <div className="gauge-info-item">
                                    <span>
                                        Minimum
                                    </span>

                                    <strong>
                                        {MIN_PH} pH
                                    </strong>
                                </div>

                                <div className="gauge-info-item">
                                    <span>
                                        Maximum
                                    </span>

                                    <strong>
                                        {MAX_PH} pH
                                    </strong>
                                </div>

                            </div>

                        </div>

                        {/* AUTO CONTROL */}

                        <div className="ph-setting-row">

                            <div className="ph-setting-icon">
                                ⚙️
                            </div>

                            <div className="ph-setting-info">

                                <strong>
                                    Automatic pH Regulation
                                </strong>

                                <span>
                                    Automatically activate
                                    dosing pumps when pH
                                    leaves the target range.
                                </span>

                            </div>

                            <button
                                type="button"
                                disabled={commandLoading}
                                className={`ph-toggle ${
                                    autoMode
                                        ? "active"
                                        : ""
                                }`}
                                onClick={toggleAutoMode}
                                aria-label={
                                    autoMode
                                        ? "Disable automatic pH control"
                                        : "Enable automatic pH control"
                                }
                            >
                                <span></span>
                            </button>

                        </div>

                        {/* SETTINGS */}

                        <div className="ph-settings-grid">

                            <div className="ph-setting-card">

                                <span>
                                    TARGET PH
                                </span>

                                <strong>
                                    {TARGET_PH.toFixed(1)}
                                </strong>

                                <small>
                                    Optimal level
                                </small>

                            </div>

                            <div className="ph-setting-card">

                                <span>
                                    DEADBAND
                                </span>

                                <strong>
                                    ±{DEADBAND.toFixed(1)}
                                </strong>

                                <small>
                                    Adjustment tolerance
                                </small>

                            </div>

                            <div className="ph-setting-card">

                                <span>
                                    DOSE LIMIT
                                </span>

                                <strong>
                                    {DOSE_LIMIT} mL
                                </strong>

                                <small>
                                    Maximum per cycle
                                </small>

                            </div>

                        </div>

                    </div>

                    {/* =================================================
                        PUMPS
                    ================================================== */}

                    <div className="ph-panel pump-panel">

                        <div className="ph-panel-header">

                            <div>

                                <span className="ph-panel-label">
                                    DOSING SYSTEM
                                </span>

                                <h2>
                                    pH Pumps
                                </h2>

                            </div>

                            <div className="pump-count">
                                2 / 2
                            </div>

                        </div>

                        {/* PH DOWN */}

                        <div className="pump-card">

                            <div className="pump-icon ph-down">
                                ↓
                            </div>

                            <div className="pump-info">

                                <strong>
                                    pH Down Pump
                                </strong>

                                <span>
                                    Acid solution • GPIO 19
                                </span>

                            </div>

                            <div className="pump-status">

                                {phDownPump
                                    ? "RUNNING"
                                    : "READY"}

                            </div>

                            <button
                                type="button"
                                disabled={
                                    autoMode ||
                                    commandLoading
                                }
                                className={`pump-toggle ${
                                    phDownPump
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    sendPumpCommand(
                                        "ph_down",
                                        !phDownPump
                                    )
                                }
                            >
                                <span></span>
                            </button>

                        </div>

                        {/* PH UP */}

                        <div className="pump-card">

                            <div className="pump-icon ph-up">
                                ↑
                            </div>

                            <div className="pump-info">

                                <strong>
                                    pH Up Pump
                                </strong>

                                <span>
                                    Alkaline solution • GPIO 18
                                </span>

                            </div>

                            <div className="pump-status">

                                {phUpPump
                                    ? "RUNNING"
                                    : "READY"}

                            </div>

                            <button
                                type="button"
                                disabled={
                                    autoMode ||
                                    commandLoading
                                }
                                className={`pump-toggle ${
                                    phUpPump
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    sendPumpCommand(
                                        "ph_up",
                                        !phUpPump
                                    )
                                }
                            >
                                <span></span>
                            </button>

                        </div>

                        {/* MANUAL */}

                        <div className="manual-ph-control">

                            <span>
                                MANUAL ADJUSTMENT
                            </span>

                            <div className="manual-ph-buttons">

                                <button
                                    type="button"
                                    className="ph-down-button"
                                    disabled={
                                        autoMode ||
                                        commandLoading
                                    }
                                    onClick={() =>
                                        sendPumpCommand(
                                            "ph_down",
                                            true
                                        )
                                    }
                                >
                                    ↓ pH Down
                                </button>

                                <button
                                    type="button"
                                    className="ph-up-button"
                                    disabled={
                                        autoMode ||
                                        commandLoading
                                    }
                                    onClick={() =>
                                        sendPumpCommand(
                                            "ph_up",
                                            true
                                        )
                                    }
                                >
                                    ↑ pH Up
                                </button>

                            </div>

                        </div>

                    </div>

                </section>

                {/* =====================================================
                    HISTORY
                ====================================================== */}

                <section className="ph-panel history-panel">

                    <div className="ph-panel-header">

                        <div>

                            <span className="ph-panel-label">
                                SENSOR HISTORY
                            </span>

                            <h2>
                                Recent pH Readings
                            </h2>

                        </div>

                        <button
                            type="button"
                            className="ph-refresh-button"
                            onClick={loadData}
                            disabled={loading}
                        >
                            ↻{" "}
                            {loading
                                ? "Loading..."
                                : "Refresh"}
                        </button>

                    </div>

                    <div className="ph-table-wrapper">

                        <table className="ph-table">

                            <thead>

                                <tr>
                                    <th>TIME</th>
                                    <th>PH LEVEL</th>
                                    <th>ACTION</th>
                                    <th>AMOUNT</th>
                                    <th>STATUS</th>
                                </tr>

                            </thead>

                            <tbody>

                                {loading ? (

                                    <tr>

                                        <td
                                            colSpan="5"
                                            style={{
                                                textAlign:
                                                    "center"
                                            }}
                                        >
                                            Loading pH
                                            history...

                                        </td>

                                    </tr>

                                ) : history.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="5"
                                            style={{
                                                textAlign:
                                                    "center"
                                            }}
                                        >
                                            No pH readings
                                            available.

                                        </td>

                                    </tr>

                                ) : (

                                    history.map(
                                        (reading, index) => (

                                            <tr
                                                key={
                                                    reading.id ||
                                                    index
                                                }
                                            >

                                                <td>
                                                    {
                                                        reading.time
                                                    }
                                                </td>

                                                <td>
                                                    <strong>
                                                        {Number(
                                                            reading.ph ??
                                                                0
                                                        ).toFixed(
                                                            2
                                                        )}
                                                    </strong>
                                                </td>

                                                <td>
                                                    {
                                                        reading.action
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        reading.amount
                                                    }
                                                </td>

                                                <td>

                                                    <span className="ph-table-status">

                                                        <i></i>

                                                        {
                                                            reading.status
                                                        }

                                                    </span>

                                                </td>

                                            </tr>

                                        )
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>

                {/* =====================================================
                    HARDWARE
                ====================================================== */}

                <section className="ph-panel sensor-panel">

                    <div className="ph-panel-header">

                        <div>

                            <span className="ph-panel-label">
                                HARDWARE
                            </span>

                            <h2>
                                pH Control Sensors
                            </h2>

                        </div>

                        <div className="sensor-count">
                            4 / 4
                        </div>

                    </div>

                    <div className="ph-sensor-grid">

                        {/* PH SENSOR */}

                        <div className="ph-sensor-item">

                            <div className="ph-sensor-icon">
                                🧪
                            </div>

                            <div>

                                <strong>
                                    pH Sensor
                                </strong>

                                <span>
                                    GPIO 34 • Analog
                                </span>

                            </div>

                            <b>

                                <i></i>

                                {phSensorOnline
                                    ? "Online"
                                    : "Offline"}

                            </b>

                        </div>

                        {/* PH DOWN */}

                        <div className="ph-sensor-item">

                            <div className="ph-sensor-icon">
                                ↓
                            </div>

                            <div>

                                <strong>
                                    pH Down Pump
                                </strong>

                                <span>
                                    GPIO 19 • Relay
                                </span>

                            </div>

                            <b>

                                <i></i>

                                {deviceOnline
                                    ? "Online"
                                    : "Offline"}

                            </b>

                        </div>

                        {/* PH UP */}

                        <div className="ph-sensor-item">

                            <div className="ph-sensor-icon">
                                ↑
                            </div>

                            <div>

                                <strong>
                                    pH Up Pump
                                </strong>

                                <span>
                                    GPIO 18 • Relay
                                </span>

                            </div>

                            <b>

                                <i></i>

                                {deviceOnline
                                    ? "Online"
                                    : "Offline"}

                            </b>

                        </div>

                        {/* ESP32 */}

                        <div className="ph-sensor-item">

                            <div className="ph-sensor-icon">
                                📡
                            </div>

                            <div>

                                <strong>
                                    ESP32 Controller
                                </strong>

                                <span>
                                    {data.device?.type ||
                                        "ESP32"}{" "}
                                    •{" "}
                                    {data.device?.uid ||
                                        DEVICE_UID}
                                </span>

                            </div>

                            <b>

                                <i></i>

                                {deviceOnline
                                    ? "Online"
                                    : "Offline"}

                            </b>

                        </div>

                    </div>

                </section>


            </main>

        </div>
    );
}

export default PhControl;