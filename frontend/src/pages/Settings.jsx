
import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Navbar";
import "../css/settings.css";

import {
    getSettings,
    updateSettings,
    resetSettings,
} from "../services/settingsService";

const DEFAULT_SETTINGS = {
    language: "English",
    units: "Metric",
    notifications: true,
    emailAlerts: true,
    systemSounds: false,
    autoRefresh: true,
    maintenanceMode: false,
};

// Convert database settings (snake_case) into frontend settings (camelCase).
function normalizeSettings(data = {}) {
    const value = (camelCase, snakeCase, fallback) => {
        const result = data[snakeCase] ?? data[camelCase];
        return result === undefined || result === null
            ? fallback
            : result;
    };

    const language = value(
        "language",
        "language",
        DEFAULT_SETTINGS.language
    );

    const units = value(
        "units",
        "measurement_units",
        DEFAULT_SETTINGS.units
    );

    return {
        language: ["English", "Filipino"].includes(language)
            ? language
            : DEFAULT_SETTINGS.language,

        units: ["Metric", "Imperial"].includes(units)
            ? units
            : DEFAULT_SETTINGS.units,

        notifications: typeof value(
            "notifications",
            "notifications",
            DEFAULT_SETTINGS.notifications
        ) === "boolean"
            ? value("notifications", "notifications", DEFAULT_SETTINGS.notifications)
            : DEFAULT_SETTINGS.notifications,

        emailAlerts: typeof value(
            "emailAlerts",
            "email_alerts",
            DEFAULT_SETTINGS.emailAlerts
        ) === "boolean"
            ? value("emailAlerts", "email_alerts", DEFAULT_SETTINGS.emailAlerts)
            : DEFAULT_SETTINGS.emailAlerts,

        systemSounds: typeof value(
            "systemSounds",
            "system_sounds",
            DEFAULT_SETTINGS.systemSounds
        ) === "boolean"
            ? value("systemSounds", "system_sounds", DEFAULT_SETTINGS.systemSounds)
            : DEFAULT_SETTINGS.systemSounds,

        autoRefresh: typeof value(
            "autoRefresh",
            "auto_refresh",
            DEFAULT_SETTINGS.autoRefresh
        ) === "boolean"
            ? value("autoRefresh", "auto_refresh", DEFAULT_SETTINGS.autoRefresh)
            : DEFAULT_SETTINGS.autoRefresh,

        maintenanceMode: typeof value(
            "maintenanceMode",
            "maintenance_mode",
            DEFAULT_SETTINGS.maintenanceMode
        ) === "boolean"
            ? value("maintenanceMode", "maintenance_mode", DEFAULT_SETTINGS.maintenanceMode)
            : DEFAULT_SETTINGS.maintenanceMode,
    };
}

// Convert frontend settings into the database field names.
function toApiSettings(settings) {
    return {
        language: settings.language,
        measurement_units: settings.units,
        notifications: settings.notifications,
        email_alerts: settings.emailAlerts,
        system_sounds: settings.systemSounds,
        auto_refresh: settings.autoRefresh,
        maintenance_mode: settings.maintenanceMode,
    };
}

// Optional browser cache. The database remains the source of truth.
function cacheSettings(settings) {
    try {
        localStorage.setItem(
            "hydrocontrol-settings-v1",
            JSON.stringify(settings)
        );
    } catch {
        // A cache failure must not undo a successful database save.
    }
}

function Toggle({
    label,
    description,
    checked,
    onChange,
    warning = false,
    disabled = false,
}) {
    return (
        <div className="setting-item">
            <div className="setting-item-icon" aria-hidden="true">
                {checked ? "●" : "○"}
            </div>

            <div className="setting-info">
                <strong>{label}</strong>
                <span>{description}</span>
            </div>

            <button
                type="button"
                role="switch"
                aria-label={label}
                aria-checked={checked}
                disabled={disabled}
                onClick={onChange}
                className={`toggle ${checked ? "active" : ""} ${
                    warning && checked ? "warning-toggle" : ""
                }`}
            >
                <span />
            </button>
        </div>
    );
}

function PanelHeader({ icon, label, title, badge }) {
    return (
        <div className="settings-panel-header">
            <div className="settings-title-group">
                <div className="settings-icon" aria-hidden="true">
                    {icon}
                </div>

                <div>
                    <span className="settings-panel-label">{label}</span>
                    <h2>{title}</h2>
                </div>
            </div>

            {badge && (
                <span className="settings-badge">{badge}</span>
            )}
        </div>
    );
}

function Settings() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [settings, setSettings] = useState({
        ...DEFAULT_SETTINGS,
    });

    const [savedSettings, setSavedSettings] = useState({
        ...DEFAULT_SETTINGS,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [notice, setNotice] = useState(null);

    const busy = loading || saving || resetting;

    const hasChanges = useMemo(
        () =>
            JSON.stringify(settings) !==
            JSON.stringify(savedSettings),
        [settings, savedSettings]
    );

    // Load the persisted settings from the backend.
    useEffect(() => {
        let cancelled = false;

        async function loadFromServer() {
            setLoading(true);

            try {
                const data = await getSettings();

                if (cancelled) return;

                const persisted = normalizeSettings(data);

                setSettings(persisted);
                setSavedSettings(persisted);
                cacheSettings(persisted);
            } catch (error) {
                if (cancelled) return;

                setNotice({
                    type: "error",
                    message:
                        error.message ||
                        "Unable to load settings from the server.",
                });
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadFromServer();

        return () => {
            cancelled = true;
        };
    }, []);

    // Automatically dismiss notices.
    useEffect(() => {
        if (!notice) return undefined;

        const timeout = window.setTimeout(
            () => setNotice(null),
            4500
        );

        return () => window.clearTimeout(timeout);
    }, [notice]);

    // Warn before leaving with unsaved changes.
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (!hasChanges || loading || saving || resetting) {
                return;
            }

            event.preventDefault();
            event.returnValue = "";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener(
                "beforeunload",
                handleBeforeUnload
            );
        };
    }, [hasChanges, loading, saving, resetting]);

    const updateSetting = useCallback((key, value) => {
        setSettings((previous) => ({
            ...previous,
            [key]: value,
        }));
    }, []);

    // Save changes to the backend and database.
    const handleSave = async () => {
        if (busy || !hasChanges) return;

        setSaving(true);
        setNotice(null);

        try {
            const response = await updateSettings(
                toApiSettings(settings)
            );

            // Use the server response as the persisted state.
            const persisted = normalizeSettings(response);

            setSettings(persisted);
            setSavedSettings(persisted);
            cacheSettings(persisted);

            setNotice({
                type: "success",
                message: "Settings saved successfully to the database.",
            });
        } catch (error) {
            setNotice({
                type: "error",
                message:
                    error.message ||
                    "Unable to save settings. Please try again.",
            });
        } finally {
            setSaving(false);
        }
    };

    // Discard unsaved changes.
    const handleCancel = () => {
        if (busy || !hasChanges) return;

        if (
            !window.confirm(
                "Discard all unsaved changes?"
            )
        ) {
            return;
        }

        setSettings({ ...savedSettings });

        setNotice({
            type: "info",
            message: "Unsaved changes have been discarded.",
        });
    };

    // Reset using the backend reset endpoint.
    const handleReset = async () => {
        if (busy) return;

        if (
            !window.confirm(
                "Reset saved preferences to their default values? This will not reset the ESP32."
            )
        ) {
            return;
        }

        setResetting(true);
        setNotice(null);

        try {
            const response = await resetSettings();
            const persisted = normalizeSettings(response);

            setSettings(persisted);
            setSavedSettings(persisted);
            cacheSettings(persisted);

            setNotice({
                type: "success",
                message: "Preferences reset successfully.",
            });
        } catch (error) {
            setNotice({
                type: "error",
                message:
                    error.message ||
                    "Unable to reset preferences.",
            });
        } finally {
            setResetting(false);
        }
    };

    const handleMaintenanceToggle = () => {
        if (busy) return;

        const nextValue = !settings.maintenanceMode;

        if (
            nextValue &&
            !window.confirm(
                "Enable the maintenance preference? This setting does not stop automatic pump operations on the ESP32."
            )
        ) {
            return;
        }

        updateSetting("maintenanceMode", nextValue);
    };

    const handleUnavailableAction = (action) => {
        setNotice({
            type: "info",
            message: `${action} requires a configured backend endpoint. No hardware command was sent.`,
        });
    };

    return (
        <div className="settings-page">
            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            <main className="settings-main">
                <header className="settings-header">
                    <div className="settings-header-left">
                        <button
                            type="button"
                            className="settings-menu-button"
                            aria-label="Open navigation menu"
                            aria-expanded={sidebarOpen}
                            onClick={() => setSidebarOpen(true)}
                        >
                            ☰
                        </button>

                        <div>
                            <div className="settings-breadcrumb">
                                HYDROCONTROL / SYSTEM
                            </div>

                            <h1>Settings</h1>

                            <p>
                                Manage your dashboard preferences and
                                system configuration.
                            </p>
                        </div>
                    </div>

                    <div className="settings-header-status">
                        <span className="status-indicator status-unknown" />
                        HARDWARE STATUS NOT VERIFIED
                    </div>
                </header>

                {notice && (
                    <div
                        className={`settings-notice ${notice.type}`}
                        role="status"
                        aria-live="polite"
                    >
                        <span>{notice.message}</span>

                        <button
                            type="button"
                            aria-label="Dismiss notification"
                            onClick={() => setNotice(null)}
                        >
                            ×
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="settings-notice info" role="status">
                        Loading settings from the server...
                    </div>
                )}

                <section className="settings-grid">
                    {/* GENERAL SETTINGS */}
                    <div className="settings-panel">
                        <PanelHeader
                            icon="⚙"
                            label="SYSTEM"
                            title="General Settings"
                            badge="PREFERENCES"
                        />

                        <div className="settings-list">
                            <div className="setting-item">
                                <div
                                    className="setting-item-icon"
                                    aria-hidden="true"
                                >
                                    文
                                </div>

                                <div className="setting-info">
                                    <strong>Language</strong>
                                    <span>
                                        Choose the preferred interface
                                        language.
                                    </span>
                                </div>

                                <select
                                    className="settings-select"
                                    value={settings.language}
                                    disabled={busy}
                                    onChange={(event) =>
                                        updateSetting(
                                            "language",
                                            event.target.value
                                        )
                                    }
                                    aria-label="Interface language"
                                >
                                    <option value="English">
                                        English
                                    </option>
                                    <option value="Filipino">
                                        Filipino
                                    </option>
                                </select>
                            </div>

                            <div className="setting-item">
                                <div
                                    className="setting-item-icon"
                                    aria-hidden="true"
                                >
                                    ↔
                                </div>

                                <div className="setting-info">
                                    <strong>Measurement Units</strong>
                                    <span>
                                        Choose how measurements are
                                        displayed.
                                    </span>
                                </div>

                                <select
                                    className="settings-select"
                                    value={settings.units}
                                    disabled={busy}
                                    onChange={(event) =>
                                        updateSetting(
                                            "units",
                                            event.target.value
                                        )
                                    }
                                    aria-label="Measurement units"
                                >
                                    <option value="Metric">
                                        Metric
                                    </option>
                                    <option value="Imperial">
                                        Imperial
                                    </option>
                                </select>
                            </div>

                            <Toggle
                                label="Automatic Refresh"
                                description="Allow dashboard data to refresh automatically."
                                checked={settings.autoRefresh}
                                disabled={busy}
                                onChange={() =>
                                    updateSetting(
                                        "autoRefresh",
                                        !settings.autoRefresh
                                    )
                                }
                            />
                        </div>
                    </div>

                    {/* NOTIFICATIONS */}
                    <div className="settings-panel">
                        <PanelHeader
                            icon="♧"
                            label="ALERTS"
                            title="Notifications"
                        />

                        <div className="settings-list">
                            <Toggle
                                label="System Notifications"
                                description="Enable in-app system notifications."
                                checked={settings.notifications}
                                disabled={busy}
                                onChange={() =>
                                    updateSetting(
                                        "notifications",
                                        !settings.notifications
                                    )
                                }
                            />

                            <Toggle
                                label="Email Alerts"
                                description="Enable email alert preferences. Email delivery requires backend support."
                                checked={settings.emailAlerts}
                                disabled={busy}
                                onChange={() =>
                                    updateSetting(
                                        "emailAlerts",
                                        !settings.emailAlerts
                                    )
                                }
                            />

                            <Toggle
                                label="System Sounds"
                                description="Enable the preference for alert sounds."
                                checked={settings.systemSounds}
                                disabled={busy}
                                onChange={() =>
                                    updateSetting(
                                        "systemSounds",
                                        !settings.systemSounds
                                    )
                                }
                            />
                        </div>
                    </div>

                    {/* HARDWARE STATUS */}
                    <div className="settings-panel">
                        <PanelHeader
                            icon="⌁"
                            label="HARDWARE"
                            title="Controller Settings"
                        />

                        <div className="controller-card">
                            <div
                                className="controller-logo"
                                aria-hidden="true"
                            >
                                ⌁
                            </div>

                            <div className="controller-info">
                                <strong>HydroControl ESP32</strong>
                                <span>Main system controller</span>
                                <small>
                                    Device ID: ESP32-HYDRO-001
                                </small>
                            </div>

                            <span className="controller-unknown">
                                Unverified
                            </span>
                        </div>

                        <div className="hardware-stats">
                            <div>
                                <span>CONNECTION</span>
                                <strong>Not verified</strong>
                            </div>

                            <div>
                                <span>SIGNAL</span>
                                <strong>Unavailable</strong>
                            </div>

                            <div>
                                <span>UPTIME</span>
                                <strong>Unavailable</strong>
                            </div>
                        </div>

                        <p className="settings-help">
                            Live controller details will appear here
                            after the device-status API is connected.
                        </p>
                    </div>

                    {/* MAINTENANCE */}
                    <div className="settings-panel">
                        <PanelHeader
                            icon="⚠"
                            label="MAINTENANCE"
                            title="System Maintenance"
                        />

                        <div className="maintenance-warning">
                            <div
                                className="warning-icon"
                                aria-hidden="true"
                            >
                                !
                            </div>

                            <div className="setting-info">
                                <strong>
                                    Maintenance Preference
                                </strong>

                                <span>
                                    This preference does not disable
                                    pumps or ESP32 automation.
                                </span>
                            </div>

                            <button
                                type="button"
                                role="switch"
                                aria-label="Maintenance preference"
                                aria-checked={settings.maintenanceMode}
                                disabled={busy}
                                className={`toggle ${
                                    settings.maintenanceMode
                                        ? "active warning-toggle"
                                        : ""
                                }`}
                                onClick={handleMaintenanceToggle}
                            >
                                <span />
                            </button>
                        </div>

                        <div className="maintenance-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                disabled={busy}
                                onClick={() =>
                                    handleUnavailableAction(
                                        "Restart controller"
                                    )
                                }
                            >
                                ↻ Restart Controller
                            </button>

                            <button
                                type="button"
                                className="secondary-button"
                                disabled={busy}
                                onClick={() =>
                                    handleUnavailableAction(
                                        "Clear application cache"
                                    )
                                }
                            >
                                Clear Cache
                            </button>

                            <button
                                type="button"
                                className="danger-button"
                                disabled={busy}
                                onClick={handleReset}
                            >
                                {resetting
                                    ? "Resetting..."
                                    : "Reset Preferences"}
                            </button>
                        </div>

                        <p className="settings-help">
                            Restart requires a device API. Reset
                            Preferences uses the backend reset endpoint
                            and does not reset the ESP32.
                        </p>
                    </div>
                </section>

                {/* SYSTEM INFORMATION */}
                <section className="settings-panel system-info-panel">
                    <PanelHeader
                        icon="ⓘ"
                        label="INFORMATION"
                        title="System Information"
                    />

                    <div className="system-info-grid">
                        <div className="info-box">
                            <span>SOFTWARE VERSION</span>
                            <strong>v1.0.0</strong>
                        </div>

                        <div className="info-box">
                            <span>FIRMWARE</span>
                            <strong>Not retrieved</strong>
                        </div>

                        <div className="info-box">
                            <span>DATABASE</span>
                            <strong>
                                {loading
                                    ? "Checking..."
                                    : "Settings API"}
                            </strong>
                        </div>

                        <div className="info-box">
                            <span>LAST UPDATE</span>
                            <strong>Not retrieved</strong>
                        </div>
                    </div>
                </section>

                {/* SAVE BAR */}
                <div className="settings-save-bar">
                    <div className="save-message">
                        <span
                            className={`save-dot ${
                                hasChanges ? "unsaved" : ""
                            }`}
                        />

                        <span>
                            {loading
                                ? "Loading saved preferences..."
                                : saving
                                    ? "Saving preferences..."
                                    : hasChanges
                                        ? "You have unsaved changes."
                                        : "All preferences are saved."}
                        </span>
                    </div>

                    <div className="save-actions">
                        <button
                            type="button"
                            className="cancel-button"
                            disabled={busy || !hasChanges}
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="save-button"
                            disabled={busy || !hasChanges}
                            onClick={handleSave}
                        >
                            {saving
                                ? "Saving..."
                                : "✓ Save Settings"}
                        </button>
                    </div>
                </div>

                <footer className="settings-footer">
                    <span>© 2026 HydroControl</span>
                    <span>
                        System Configuration · ESP32
                    </span>
                    <span>
                        Hardware status requires live verification
                    </span>
                </footer>
            </main>
        </div>
    );
}

export default Settings;
