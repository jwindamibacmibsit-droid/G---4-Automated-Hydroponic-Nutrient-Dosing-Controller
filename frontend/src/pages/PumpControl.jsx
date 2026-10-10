
import { useState } from "react";
import Sidebar from "../components/Navbar";
import "../css/pump-control.css";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "".replace(/\/$/, "");

const COMMAND_ENDPOINT = "/api/esp/pumps/commands";
const DEVICE_UID = "ESP32-HYDRO-001";
const MAX_DURATION_MS = 5000;

const INITIAL_PUMPS = [
    {
        id: 1,
        name: "pH Dosing Pump",
        type: "pH Adjustment",
        icon: "🧪",
        gpio: "GPIO 25",
        command: "ph",
        flow: "Not measured",
        runtime: "00h 00m",
    },
    {
        id: 2,
        name: "Nutrient Pump A",
        type: "Nutrient Dosing",
        icon: "🧪",
        gpio: "GPIO 26",
        command: "nutrient_a",
        flow: "Not measured",
        runtime: "00h 00m",
    },
    {
        id: 3,
        name: "Nutrient Pump B",
        type: "Nutrient Dosing",
        icon: "💧",
        gpio: "GPIO 27",
        command: "nutrient_b",
        flow: "Not measured",
        runtime: "00h 00m",
    },
];

function PumpControl() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [autoMode, setAutoMode] = useState(false);
    const [duration, setDuration] = useState(3000);

    const [commands, setCommands] = useState({});
    const [errors, setErrors] = useState({});
    const [systemMessage, setSystemMessage] = useState("");
    const [sendingAll, setSendingAll] = useState(false);

    // A relay can switch a pump on or off, but cannot
    // control its speed without a suitable motor controller.
    const sendPumpCommand = async (pump, durationMs = duration) => {
        if (autoMode) {
            setSystemMessage(
                "Switch to Manual mode to issue manual commands."
            );
            return false;
        }

        if (
            !pump ||
            !Number.isFinite(Number(durationMs)) ||
            durationMs < 100 ||
            durationMs > MAX_DURATION_MS
        ) {
            setSystemMessage(
                "Pump duration must be between 100 and 5000 ms."
            );
            return false;
        }

        if (
            commands[pump.id]?.status === "sending" ||
            sendingAll
        ) {
            return false;
        }

        setCommands((previous) => ({
            ...previous,
            [pump.id]: {
                status: "sending",
                message: "Sending command...",
            },
        }));

        setErrors((previous) => ({
            ...previous,
            [pump.id]: "",
        }));

        setSystemMessage("");

        try {
            const response = await fetch(
                `${API_BASE_URL}${COMMAND_ENDPOINT}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        device_uid: DEVICE_UID,
                        pump: pump.command,
                        duration_ms: Number(durationMs),
                    }),
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok || result.success === false) {
                throw new Error(
                    result.message ||
                    `Server request failed (${response.status}).`
                );
            }

            setCommands((previous) => ({
                ...previous,
                [pump.id]: {
                    status: "pending",
                    message: "Command accepted; awaiting ESP32.",
                    commandId: result.command?.id || result.id || null,
                },
            }));

            setSystemMessage(
                `${pump.name}: command accepted by the API.`
            );

            return true;
        } catch (error) {
            setCommands((previous) => ({
                ...previous,
                [pump.id]: {
                    status: "failed",
                    message: error.message,
                },
            }));

            setErrors((previous) => ({
                ...previous,
                [pump.id]: error.message,
            }));

            setSystemMessage(
                `Failed to send ${pump.name} command: ${error.message}`
            );

            return false;
        }
    };

    const runPump = (pump) => {
        return sendPumpCommand(pump, duration);
    };

    const startAllPumps = async () => {
        if (autoMode || sendingAll) return;

        setSendingAll(true);
        setSystemMessage("Sending pump commands...");

        try {
            // Queue one command at a time. The backend must
            // support multiple pending commands for this to work.
            for (const pump of INITIAL_PUMPS) {
                const accepted = await sendPumpCommandInternal(
                    pump,
                    duration
                );

                if (!accepted) {
                    setSystemMessage(
                        `Stopped queueing after ${pump.name} failed.`
                    );
                    return;
                }
            }

            setSystemMessage(
                "All pump commands were accepted by the API."
            );
        } finally {
            setSendingAll(false);
        }
    };

    // Internal request used by Start All. It avoids the
    // individual-button lock used by sendPumpCommand.
    const sendPumpCommandInternal = async (pump, durationMs) => {
        setCommands((previous) => ({
            ...previous,
            [pump.id]: {
                status: "sending",
                message: "Sending command...",
            },
        }));

        setErrors((previous) => ({
            ...previous,
            [pump.id]: "",
        }));

        try {
            const response = await fetch(
                `${API_BASE_URL}${COMMAND_ENDPOINT}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        device_uid: DEVICE_UID,
                        pump: pump.command,
                        duration_ms: Number(durationMs),
                    }),
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok || result.success === false) {
                throw new Error(
                    result.message ||
                    `HTTP ${response.status}`
                );
            }

            setCommands((previous) => ({
                ...previous,
                [pump.id]: {
                    status: "pending",
                    message: "Awaiting ESP32 execution.",
                    commandId: result.command?.id || result.id || null,
                },
            }));

            return true;
        } catch (error) {
            setCommands((previous) => ({
                ...previous,
                [pump.id]: {
                    status: "failed",
                    message: error.message,
                },
            }));

            setErrors((previous) => ({
                ...previous,
                [pump.id]: error.message,
            }));

            return false;
        }
    };

    const activeCount = INITIAL_PUMPS.filter(
        (pump) => commands[pump.id]?.status === "running"
    ).length;

    const pendingCount = INITIAL_PUMPS.filter(
        (pump) => commands[pump.id]?.status === "pending" ||
                  commands[pump.id]?.status === "sending"
    ).length;

    return (
        <div className="pump-page">
            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            <main className="pump-main">
                <header className="pump-header">
                    <div className="pump-header-left">
                        <button
                            className="pump-menu-button"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open navigation"
                        >
                            ☰
                        </button>

                        <div>
                            <h1>Pump Control</h1>
                            <p>HydroControl IoT pump management</p>
                        </div>
                    </div>

                    <div className="pump-header-actions">
                        <div className="pump-header-status">
                            <span />
                            ESP32 CONNECTION NOT VERIFIED
                        </div>
                    </div>
                </header>

                {systemMessage && (
                    <div
                        className="pump-system-message"
                        role="status"
                        aria-live="polite"
                    >
                        {systemMessage}
                    </div>
                )}

                <section className="pump-stats">
                    <div className="pump-stat-card">
                        <div className="pump-card-header">
                            <div className="pump-stat-icon">⚙️</div>
                            <span className="pump-card-label">
                                CONFIRMED RUNNING
                            </span>
                        </div>

                        <div className="pump-stat-value">
                            {activeCount}
                            <span> / {INITIAL_PUMPS.length}</span>
                        </div>

                        <div className="pump-mini-status">
                            Hardware running status requires telemetry.
                        </div>
                    </div>

                    <div className="pump-stat-card">
                        <div className="pump-card-header">
                            <div className="pump-stat-icon">📡</div>
                            <span className="pump-card-label">
                                PENDING COMMANDS
                            </span>
                        </div>

                        <div className="pump-stat-value">
                            {pendingCount}
                        </div>

                        <div className="pump-mini-status">
                            Accepted or awaiting execution
                        </div>
                    </div>

                    <div className="pump-stat-card">
                        <div className="pump-card-header">
                            <div className="pump-stat-icon">⏱️</div>
                            <span className="pump-card-label">
                                CYCLE DURATION
                            </span>
                        </div>

                        <div className="pump-stat-value">
                            {(duration / 1000).toFixed(1)}
                            <span> sec</span>
                        </div>

                        <input
                            type="range"
                            min="1000"
                            max={MAX_DURATION_MS}
                            step="1000"
                            value={duration}
                            onChange={(event) =>
                                setDuration(Number(event.target.value))
                            }
                            disabled={autoMode || sendingAll}
                            aria-label="Pump cycle duration in seconds"
                        />
                    </div>

                    <div className="pump-stat-card">
                        <div className="pump-card-header">
                            <div className="pump-stat-icon">🤖</div>
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
                                onClick={() => {
                                    setAutoMode(true);
                                    setSystemMessage(
                                        "Manual commands disabled. Automatic dosing logic must be implemented separately."
                                    );
                                }}
                            >
                                AUTO
                            </button>

                            <button
                                className={!autoMode ? "mode-active" : ""}
                                onClick={() => {
                                    setAutoMode(false);
                                    setSystemMessage(
                                        "Manual control enabled."
                                    );
                                }}
                            >
                                MANUAL
                            </button>
                        </div>
                    </div>
                </section>

                <section className="pump-content">
                    <div className="pump-panel controllers-panel">
                        <div className="pump-panel-header">
                            <div>
                                <span className="pump-panel-label">
                                    DEVICE CONTROL
                                </span>
                                <h2>Pump Controllers</h2>
                            </div>

                            <div className="live-badge">
                                <span />
                                COMMAND API
                            </div>
                        </div>

                        <div className="pump-list">
                            {INITIAL_PUMPS.map((pump) => {
                                const command = commands[pump.id];
                                const status = command?.status || "idle";
                                const busy =
                                    status === "sending" || sendingAll;

                                return (
                                    <div
                                        className={`pump-control-card ${
                                            status === "running"
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
                                                <strong>{pump.name}</strong>
                                                <span>{pump.type}</span>
                                            </div>

                                            <div
                                                className={`pump-status ${
                                                    status === "running"
                                                        ? "running"
                                                        : "stopped"
                                                }`}
                                            >
                                                <i />
                                                {status === "idle"
                                                    ? "Idle"
                                                    : status === "sending"
                                                    ? "Sending"
                                                    : status === "pending"
                                                    ? "Queued"
                                                    : status === "running"
                                                    ? "Running"
                                                    : "Failed"}
                                            </div>
                                        </div>

                                        <div className="pump-control-divider" />

                                        <div className="pump-control-details">
                                            <div className="pump-detail">
                                                <span>GPIO</span>
                                                <strong>{pump.gpio}</strong>
                                            </div>

                                            <div className="pump-detail">
                                                <span>FLOW</span>
                                                <strong>{pump.flow}</strong>
                                            </div>

                                            <div className="pump-detail">
                                                <span>CYCLE</span>
                                                <strong>
                                                    {(duration / 1000).toFixed(1)} sec
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="pump-control-actions">
                                            <button
                                                className="pump-toggle start"
                                                onClick={() => runPump(pump)}
                                                disabled={autoMode || busy}
                                            >
                                                {status === "sending"
                                                    ? "Sending..."
                                                    : status === "pending"
                                                    ? "Queue Another Cycle"
                                                    : status === "failed"
                                                    ? "Retry Pump"
                                                    : `▶ Run for ${(duration / 1000).toFixed(1)} sec`}
                                            </button>
                                        </div>

                                        {command?.message && (
                                            <p role="status">
                                                {command.message}
                                            </p>
                                        )}

                                        {errors[pump.id] && (
                                            <p role="alert" className="pump-error">
                                                {errors[pump.id]}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pump-panel quick-panel">
                        <div className="pump-panel-header">
                            <div>
                                <span className="pump-panel-label">
                                    QUICK CONTROL
                                </span>
                                <h2>System Actions</h2>
                            </div>
                        </div>

                        <div className="quick-actions">
                            <button
                                className="quick-action"
                                disabled={autoMode || sendingAll}
                                onClick={startAllPumps}
                            >
                                <span className="quick-icon">▶</span>
                                <div>
                                    <strong>
                                        {sendingAll
                                            ? "Queueing..."
                                            : "Run All Pumps"}
                                    </strong>
                                    <small>
                                        Queue a timed cycle for each pump
                                    </small>
                                </div>
                            </button>

                            <button
                                className="quick-action"
                                onClick={() => {
                                    setSystemMessage(
                                        "Emergency stop is not available through the current firmware. Switch off the pump power supply or use a properly designed hardware cutoff in an actual emergency."
                                    );
                                }}
                            >
                                <span className="quick-icon">■</span>
                                <div>
                                    <strong>Emergency Stop Instructions</strong>
                                    <small>
                                        Current firmware cannot interrupt a running cycle
                                    </small>
                                </div>
                            </button>
                        </div>

                        <div className="emergency-box">
                            <div className="emergency-icon">⚠️</div>
                            <div>
                                <strong>Hardware safety</strong>
                                <span>
                                    Use an independent, appropriately rated
                                    power cutoff for emergencies.
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="pump-panel schedule-panel">
                    <div className="pump-panel-header">
                        <div>
                            <span className="pump-panel-label">
                                AUTOMATION
                            </span>
                            <h2>Pump Schedule</h2>
                        </div>
                    </div>

                    <p>
                        Scheduled dosing is not configured in this component.
                        Implement schedules on the backend or ESP32 with
                        dosing limits and safety checks before enabling
                        automatic operation.
                    </p>
                </section>

                <footer className="pump-footer">
                    <span>© 2026 HydroControl</span>
                    <span>Pump Control System • ESP32</span>
                    <span>API status must be verified</span>
                </footer>
            </main>
        </div>
    );
}

export default PumpControl;
