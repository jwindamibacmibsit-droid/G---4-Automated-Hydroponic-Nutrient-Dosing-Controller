import { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Navbar";
import "../css/nutrient-control.css";

const API_URL = "http://localhost:8000/api/nutrient.php";
const DEVICE_UID = "ESP32-HYDRO-001";

function NutrientControl() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [data, setData] = useState({
        ph: null,
        ec: null,
        tanks: [],
        pumps: [],
        device: null,
        ph_settings: null,
        ec_settings: null,
        system_settings: null,
        history: [],
        today_cycles: 0
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
                `${API_URL}?device_uid=${encodeURIComponent(DEVICE_UID)}`
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to connect to nutrient API. HTTP ${response.status}`
                );
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(
                    result.message || "Failed to load nutrient data."
                );
            }

            const apiData = result.data || {};

            setData({
                ph: apiData.ph || null,
                ec: apiData.ec || null,

                tanks: Array.isArray(apiData.tanks)
                    ? apiData.tanks
                    : [],

                pumps: Array.isArray(apiData.pumps)
                    ? apiData.pumps
                    : [],

                device: apiData.device || null,

                ph_settings:
                    apiData.ph_settings || null,

                ec_settings:
                    apiData.ec_settings || null,

                system_settings:
                    apiData.system_settings || null,

                history: Array.isArray(apiData.history)
                    ? apiData.history
                    : [],

                today_cycles:
                    Number(apiData.today_cycles || 0)
            });
        } catch (err) {
            console.error("Nutrient API Error:", err);

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
    | INITIAL LOAD
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        loadData();

        const interval = setInterval(() => {
            loadData();
        }, 5000);

        return () => clearInterval(interval);
    }, [loadData]);

    /*
    |--------------------------------------------------------------------------
    | SAFE ARRAYS
    |--------------------------------------------------------------------------
    */

    const tanks = Array.isArray(data.tanks)
        ? data.tanks
        : [];

    const pumps = Array.isArray(data.pumps)
        ? data.pumps
        : [];

    const history = Array.isArray(data.history)
        ? data.history
        : [];

    /*
    |--------------------------------------------------------------------------
    | FIND PUMP
    |--------------------------------------------------------------------------
    */

    const getPump = (type) => {
        return pumps.find(
            pump =>
                String(pump.pump_type || "")
                    .toLowerCase() ===
                String(type).toLowerCase()
        );
    };

    /*
    |--------------------------------------------------------------------------
    | FIND TANK
    |--------------------------------------------------------------------------
    */

    const getTank = (type) => {
        return tanks.find(
            tank =>
                String(tank.nutrient_type || "")
                    .toUpperCase() ===
                String(type).toUpperCase()
        );
    };

    /*
    |--------------------------------------------------------------------------
    | TOGGLE PUMP
    |--------------------------------------------------------------------------
    */

    const togglePump = async (pumpId) => {
        if (!pumpId) {
            setError("Invalid pump ID.");
            return;
        }

        try {
            setError("");

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action: "toggle_pump",
                    device_uid: DEVICE_UID,
                    pump_id: pumpId
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
                    "Failed to toggle pump."
                );
            }

            await loadData();
        } catch (err) {
            console.error("Toggle pump error:", err);
            setError(err.message);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | MANUAL DOSING
    |--------------------------------------------------------------------------
    */

    const manualDose = async (
        dosingType,
        pumpType,
        tankType = null
    ) => {
        const pump = getPump(pumpType);

        const tank = tankType
            ? getTank(tankType)
            : null;

        if (!pump) {
            setError(
                `Pump "${pumpType}" was not found.`
            );
            return;
        }

        if (tankType && !tank) {
            setError(
                `Nutrient tank "${tankType}" was not found.`
            );
            return;
        }

        try {
            setError("");

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action: "dose",
                    device_uid: DEVICE_UID,
                    dosing_type: dosingType,
                    pump_id: pump.id,
                    nutrient_tank_id:
                        tank?.id || null,
                    amount_ml: 5,
                    duration_seconds: 5
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
                    "Manual dosing failed."
                );
            }

            await loadData();
        } catch (err) {
            console.error(
                "Manual dosing error:",
                err
            );

            setError(err.message);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | VALUES
    |--------------------------------------------------------------------------
    */

    const phValue = Number(
        data.ph?.reading_value ?? 0
    );

    const ecValue = Number(
        data.ec?.reading_value ?? 0
    );

    const tankA = getTank("A");
    const tankB = getTank("B");

    const pumpA = getPump("nutrient_a");
    const pumpB = getPump("nutrient_b");

    const phUpPump = getPump("ph_up");
    const phDownPump = getPump("ph_down");

    const targetPh = Number(
        data.ph_settings?.target_ph ?? 6.0
    );

    const minPh = Number(
        data.ph_settings?.minimum_ph ?? 5.8
    );

    const maxPh = Number(
        data.ph_settings?.maximum_ph ?? 6.5
    );

    const minEc = Number(
        data.ec_settings?.minimum_ec ?? 1.2
    );

    const maxEc = Number(
        data.ec_settings?.maximum_ec ?? 2.4
    );

    const percentageA = Math.min(
        100,
        Math.max(
            0,
            Number(tankA?.percentage ?? 0)
        )
    );

    const percentageB = Math.min(
        100,
        Math.max(
            0,
            Number(tankB?.percentage ?? 0)
        )
    );

    const averageSupply = Math.round(
        (percentageA + percentageB) / 2
    );

    const ecRange =
        maxEc - minEc > 0
            ? maxEc - minEc
            : 1;

    const ecProgress = Math.min(
        100,
        Math.max(
            0,
            ((ecValue - minEc) / ecRange) * 100
        )
    );

    const phProgress = Math.min(
        100,
        Math.max(
            0,
            ((phValue - 4) / 4) * 100
        )
    );

    const phNormal =
        phValue >= minPh &&
        phValue <= maxPh;

    const systemOnline =
        data.device?.status === "online";

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <div className="nutrient-page">

            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            <main className="nutrient-main">

                {/* HEADER */}

                <header className="nutrient-header">

                    <div className="nutrient-header-left">

                        <button
                            className="nutrient-menu-button"
                            onClick={() =>
                                setSidebarOpen(true)
                            }
                        >
                            ☰
                        </button>

                        <div>

                            <h1>
                                Nutrient Control
                            </h1>
                        </div>

                    </div>

                    <div className="nutrient-header-status">

                        <span></span>

                        {systemOnline
                            ? "ESP32 ONLINE"
                            : "ESP32 OFFLINE"}

                    </div>

                </header>

                {/* ERROR */}

                {error && (
                    <div className="api-error">
                        ⚠ {error}
                    </div>
                )}

                {/* LOADING */}

                {loading && (
                    <div className="api-loading">
                        Loading HydroControl data...
                    </div>
                )}

                {/* STAT CARDS */}

                <section className="nutrient-stats">

                    {/* EC */}

                    <div className="nutrient-stat-card">

                        <div className="nutrient-card-header">

                            <div className="nutrient-stat-icon">
                                ⚡
                            </div>

                            <span className="nutrient-card-label">
                                EC LEVEL
                            </span>

                            <span className="nutrient-normal-badge">
                                {data.ec?.reading_status
                                    ?.toUpperCase() ||
                                    "NO DATA"}
                            </span>

                        </div>

                        <div className="nutrient-stat-value">

                            {ecValue.toFixed(2)}

                            <span>
                                {" "}mS/cm
                            </span>

                        </div>

                        <div className="ec-progress">

                            <div
                                className="ec-progress-fill"
                                style={{
                                    width: `${ecProgress}%`
                                }}
                            />

                        </div>

                        <div className="nutrient-stat-footer">

                            <span>
                                Target range
                            </span>

                            <strong>
                                {minEc} - {maxEc} mS/cm
                            </strong>

                        </div>

                    </div>

                    {/* PH */}

                    <div className="nutrient-stat-card">

                        <div className="nutrient-card-header">

                            <div className="nutrient-stat-icon">
                                🧪
                            </div>

                            <span className="nutrient-card-label">
                                PH LEVEL
                            </span>

                            <span
                                className={
                                    phNormal
                                        ? "nutrient-normal-badge"
                                        : "nutrient-warning-badge"
                                }
                            >
                                {phNormal
                                    ? "NORMAL"
                                    : "CHECK"}
                            </span>

                        </div>

                        <div className="nutrient-stat-value">

                            {phValue.toFixed(2)}

                            <span>
                                {" "}pH
                            </span>

                        </div>

                        <div className="ph-scale">

                            <div className="ph-track">

                                <div
                                    className="ph-point"
                                    style={{
                                        left: `${phProgress}%`
                                    }}
                                />

                            </div>

                            <div className="ph-labels">

                                <span>4.0</span>
                                <span>5.5</span>
                                <span>6.5</span>
                                <span>8.0</span>

                            </div>

                        </div>

                        <div className="nutrient-stat-footer">

                            <span>
                                Ideal range
                            </span>

                            <strong>
                                {minPh} - {maxPh} pH
                            </strong>

                        </div>

                    </div>

                    {/* NUTRIENT SUPPLY */}

                    <div className="nutrient-stat-card">

                        <div className="nutrient-card-header">

                            <div className="nutrient-stat-icon">
                                🌱
                            </div>

                            <span className="nutrient-card-label">
                                NUTRIENT SUPPLY
                            </span>

                        </div>

                        <div className="nutrient-stat-value">

                            {averageSupply}

                            <span>
                                {" "}%
                            </span>

                        </div>

                        <div className="nutrient-dual-progress">

                            <div
                                className="dual-progress-a"
                                style={{
                                    width: `${percentageA}%`
                                }}
                            >
                                <span></span>
                            </div>

                            <div
                                className="dual-progress-b"
                                style={{
                                    width: `${percentageB}%`
                                }}
                            >
                                <span></span>
                            </div>

                        </div>

                        <div className="nutrient-stat-footer">

                            <span>
                                A / B remaining
                            </span>

                            <strong>

                                {Number(
                                    tankA?.remaining_ml ?? 0
                                ).toFixed(0)}

                                {" / "}

                                {Number(
                                    tankB?.remaining_ml ?? 0
                                ).toFixed(0)}

                                {" mL"}

                            </strong>

                        </div>

                    </div>

                    {/* DOSING */}

                    <div className="nutrient-stat-card">

                        <div className="nutrient-card-header">

                            <div className="nutrient-stat-icon">
                                💉
                            </div>

                            <span className="nutrient-card-label">
                                DOSING SYSTEM
                            </span>

                        </div>

                        <div className="dosing-status">
                            READY
                        </div>

                        <div className="dosing-indicators">

                            {[1, 2, 3, 4, 5].map(
                                item => (
                                    <span
                                        key={item}
                                        className={
                                            item <= 3
                                                ? "active"
                                                : ""
                                        }
                                    />
                                )
                            )}

                        </div>

                        <div className="nutrient-stat-footer">

                            <span>
                                Today's doses
                            </span>

                            <strong>
                                {Number(
                                    data.today_cycles || 0
                                )} cycles
                            </strong>

                        </div>

                    </div>

                </section>

                {/* MAIN CONTENT */}

                <section className="nutrient-content">

                    {/* CONTROL PANEL */}

                    <div className="nutrient-panel control-panel">

                        <div className="nutrient-panel-header">

                            <div>

                                <span className="nutrient-panel-label">
                                    AUTOMATION
                                </span>

                                <h2>
                                    Nutrient Dosing Control
                                </h2>

                            </div>

                            <div className="automation-badge">

                                <span></span>

                                {data.system_settings
                                    ?.control_mode === "manual"
                                    ? "MANUAL MODE"
                                    : "AUTO MODE"}

                            </div>

                        </div>

                        {/* NUTRIENT A */}

                        <div className="dosing-control">

                            <div className="dosing-control-icon nutrient-a">
                                A
                            </div>

                            <div className="dosing-info">

                                <strong>
                                    Nutrient Solution A
                                </strong>

                                <span>
                                    Primary nutrient concentrate
                                </span>

                                <div className="dosing-meter">

                                    <div
                                        style={{
                                            width: `${percentageA}%`
                                        }}
                                    />

                                </div>

                            </div>

                            <div className="dosing-value">

                                {Number(
                                    tankA?.remaining_ml ?? 0
                                ).toFixed(0)} mL

                            </div>

                            <button
                                className={`toggle-button ${
                                    pumpA?.status
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    pumpA &&
                                    togglePump(pumpA.id)
                                }
                                disabled={!pumpA}
                            >
                                <span></span>
                            </button>

                        </div>

                        {/* NUTRIENT B */}

                        <div className="dosing-control">

                            <div className="dosing-control-icon nutrient-b">
                                B
                            </div>

                            <div className="dosing-info">

                                <strong>
                                    Nutrient Solution B
                                </strong>

                                <span>
                                    Secondary nutrient concentrate
                                </span>

                                <div className="dosing-meter">

                                    <div
                                        className="meter-b"
                                        style={{
                                            width: `${percentageB}%`
                                        }}
                                    />

                                </div>

                            </div>

                            <div className="dosing-value">

                                {Number(
                                    tankB?.remaining_ml ?? 0
                                ).toFixed(0)} mL

                            </div>

                            <button
                                className={`toggle-button ${
                                    pumpB?.status
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    pumpB &&
                                    togglePump(pumpB.id)
                                }
                                disabled={!pumpB}
                            >
                                <span></span>
                            </button>

                        </div>

                        {/* PH CONTROL */}

                        <div className="dosing-control">

                            <div className="dosing-control-icon ph-control">
                                pH
                            </div>

                            <div className="dosing-info">

                                <strong>
                                    Automatic pH Control
                                </strong>

                                <span>
                                    Maintain pH between{" "}
                                    {minPh} - {maxPh}
                                </span>

                                <div className="ph-control-status">

                                    Current pH:{" "}

                                    <strong>
                                        {phValue.toFixed(2)}
                                    </strong>

                                </div>

                            </div>

                            <button
                                className={`toggle-button ${
                                    data.ph_settings
                                        ?.auto_mode
                                        ? "active"
                                        : ""
                                }`}
                                disabled
                            >
                                <span></span>
                            </button>

                        </div>

                        {/* MANUAL DOSING */}

                        <div className="manual-dose">

                            <div>

                                <span>
                                    MANUAL DOSING
                                </span>

                                <strong>
                                    Inject nutrient solution
                                </strong>

                            </div>

                            <div className="dose-actions">

                                <button
                                    className="dose-button nutrient-a-button"
                                    onClick={() =>
                                        manualDose(
                                            "nutrient_a",
                                            "nutrient_a",
                                            "A"
                                        )
                                    }
                                >
                                    + A
                                </button>

                                <button
                                    className="dose-button nutrient-b-button"
                                    onClick={() =>
                                        manualDose(
                                            "nutrient_b",
                                            "nutrient_b",
                                            "B"
                                        )
                                    }
                                >
                                    + B
                                </button>

                                <button
                                    className="dose-button ph-button"
                                    onClick={() =>
                                        manualDose(
                                            "ph_down",
                                            "ph_down"
                                        )
                                    }
                                >
                                    pH
                                </button>

                            </div>

                        </div>

                    </div>

                    {/* SYSTEM STATUS */}

                    <div className="nutrient-panel system-panel">

                        <div className="nutrient-panel-header">

                            <div>

                                <span className="nutrient-panel-label">
                                    HARDWARE
                                </span>

                                <h2>
                                    Nutrient System
                                </h2>

                            </div>

                            <div className="system-count">
                                {pumps.length} pumps
                            </div>

                        </div>

                        <div className="system-list">

                            {pumps.length === 0 ? (

                                <div className="system-item">

                                    <div className="system-symbol">
                                        ⚠
                                    </div>

                                    <div className="system-info">

                                        <strong>
                                            No pumps found
                                        </strong>

                                        <span>
                                            Check the nutrient API
                                        </span>

                                    </div>

                                </div>

                            ) : (

                                pumps.map(pump => (

                                    <div
                                        className="system-item"
                                        key={pump.id}
                                    >

                                        <div className="system-symbol">
                                            💉
                                        </div>

                                        <div className="system-info">

                                            <strong>
                                                {pump.pump_name ||
                                                    pump.pump_type ||
                                                    "Pump"}
                                            </strong>

                                            <span>
                                                GPIO{" "}
                                                {pump.gpio ??
                                                    "N/A"}{" "}
                                                • Relay
                                            </span>

                                        </div>

                                        <div className="system-online">

                                            <i></i>

                                            {pump.status
                                                ? "Running"
                                                : "Online"}

                                        </div>

                                    </div>

                                ))

                            )}

                            {data.device && (

                                <div className="system-item">

                                    <div className="system-symbol">
                                        📡
                                    </div>

                                    <div className="system-info">

                                        <strong>
                                            {data.device.device_name ||
                                                "ESP32 Controller"}
                                        </strong>

                                        <span>
                                            Wi-Fi •{" "}
                                            {data.device.device_uid ||
                                                DEVICE_UID}
                                        </span>

                                    </div>

                                    <div className="system-online">

                                        <i></i>

                                        {data.device.status ||
                                            "offline"}

                                    </div>

                                </div>

                            )}

                        </div>

                    </div>

                </section>

                {/* RESERVOIRS */}

                <section className="nutrient-panel levels-panel">

                    <div className="nutrient-panel-header">

                        <div>

                            <span className="nutrient-panel-label">
                                SOLUTION LEVELS
                            </span>

                            <h2>
                                Nutrient Reservoirs
                            </h2>

                        </div>

                        <div className="live-badge nutrient-live">

                            <span></span>
                            LIVE

                        </div>

                    </div>

                    <div className="reservoir-cards">

                        {tanks.length === 0 ? (

                            <div className="solution-card">

                                <div className="solution-top">

                                    <div className="solution-icon">
                                        !
                                    </div>

                                    <div>

                                        <span>
                                            NUTRIENT
                                        </span>

                                        <strong>
                                            No reservoir data
                                        </strong>

                                    </div>

                                    <b>
                                        0%
                                    </b>

                                </div>

                            </div>

                        ) : (

                            tanks.map(tank => {

                                const percentage = Math.min(
                                    100,
                                    Math.max(
                                        0,
                                        Number(
                                            tank.percentage ?? 0
                                        )
                                    )
                                );

                                return (

                                    <div
                                        className="solution-card"
                                        key={tank.id}
                                    >

                                        <div className="solution-top">

                                            <div className="solution-icon">

                                                {tank.nutrient_type ||
                                                    "?"}

                                            </div>

                                            <div>

                                                <span>
                                                    SOLUTION{" "}
                                                    {tank.nutrient_type ||
                                                        ""}
                                                </span>

                                                <strong>
                                                    {tank.tank_name ||
                                                        "Nutrient Tank"}
                                                </strong>

                                            </div>

                                            <b>
                                                {percentage.toFixed(0)}%
                                            </b>

                                        </div>

                                        <div className="solution-progress">

                                            <div
                                                className="solution-fill"
                                                style={{
                                                    width: `${percentage}%`
                                                }}
                                            />

                                        </div>

                                        <div className="solution-footer">

                                            <span>
                                                Remaining
                                            </span>

                                            <strong>

                                                {Number(
                                                    tank.remaining_ml ??
                                                        0
                                                ).toFixed(0)}

                                                {" / "}

                                                {Number(
                                                    tank.capacity_ml ??
                                                        0
                                                ).toFixed(0)}

                                                {" mL"}

                                            </strong>

                                        </div>

                                    </div>

                                );
                            })

                        )}

                    </div>

                </section>

                {/* HISTORY */}

                <section className="nutrient-panel history-panel">

                    <div className="nutrient-panel-header">

                        <div>

                            <span className="nutrient-panel-label">
                                DOSING HISTORY
                            </span>

                            <h2>
                                Recent Nutrient Activity
                            </h2>

                        </div>

                        <button
                            className="nutrient-refresh-button"
                            onClick={loadData}
                        >
                            ↻ Refresh
                        </button>

                    </div>

                    <div className="history-table-wrapper">

                        <table className="history-table">

                            <thead>

                                <tr>
                                    <th>TIME</th>
                                    <th>NUTRIENT</th>
                                    <th>AMOUNT</th>
                                    <th>DURATION</th>
                                    <th>STATUS</th>
                                </tr>

                            </thead>

                            <tbody>

                                {history.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="5"
                                            style={{
                                                textAlign:
                                                    "center"
                                            }}
                                        >
                                            No dosing history.
                                        </td>

                                    </tr>

                                ) : (

                                    history.map(
                                        (dose, index) => (

                                            <tr
                                                key={
                                                    dose.id ??
                                                    index
                                                }
                                            >

                                                <td>

                                                    {dose.created_at
                                                        ? new Date(
                                                            dose.created_at
                                                        ).toLocaleTimeString(
                                                            [],
                                                            {
                                                                hour:
                                                                    "2-digit",
                                                                minute:
                                                                    "2-digit"
                                                            }
                                                        )
                                                        : "—"}

                                                </td>

                                                <td>

                                                    <strong>
                                                        {dose.dosing_type ||
                                                            dose.pump_type ||
                                                            "Unknown"}
                                                    </strong>

                                                </td>

                                                <td>

                                                    {Number(
                                                        dose.amount_ml ??
                                                            0
                                                    ).toFixed(2)}

                                                    {" mL"}

                                                </td>

                                                <td>

                                                    {Number(
                                                        dose.duration_seconds ??
                                                            0
                                                    ).toFixed(0)}

                                                    {" sec"}

                                                </td>

                                                <td>

                                                    <span className="history-status">

                                                        <i></i>

                                                        {dose.status ||
                                                            "normal"}

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

            </main>

        </div>
    );
}

export default NutrientControl;