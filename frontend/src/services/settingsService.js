
const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/$/, "");

async function request(endpoint = "", options = {}) {
    const response = await fetch(
        `${API_BASE_URL}/api/settings${endpoint}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
        }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(
            result.message || "Settings request failed."
        );
    }

    return result.data;
}

export function getSettings() {
    return request();
}

export function updateSettings(settings) {
    return request("", {
        method: "PUT",
        body: JSON.stringify(settings),
    });
}

export function resetSettings() {
    return request("/reset", {
        method: "POST",
    });
}
