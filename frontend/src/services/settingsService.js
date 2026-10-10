
const API_BASE_URL = (
    import.meta.env.VITE_API_URL || ""
).replace(/\/$/, "");

async function request(endpoint = "", options = {}) {
    const url = `${API_BASE_URL}/api/settings${endpoint}`;

    let response;

    try {
        response = await fetch(url, {
            ...options,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                ...options.headers,
            },
        });
    } catch (error) {
        throw new Error(
            `Cannot connect to the backend at ${url}. Check your API URL and server.`
        );
    }

    // Read the response as text first to handle empty responses safely.
    const responseText = await response.text();

    let result = null;

    if (responseText.trim()) {
        try {
            result = JSON.parse(responseText);
        } catch {
            throw new Error(
                `Backend returned invalid JSON (HTTP ${response.status}). ` +
                `Response: ${responseText.slice(0, 250)}`
            );
        }
    }

    if (!response.ok) {
        throw new Error(
            result?.message ||
            result?.error ||
            `Settings API failed with HTTP ${response.status}. ` +
            (responseText.trim()
                ? responseText.slice(0, 200)
                : "The server returned an empty response.")
        );
    }

    if (!result) {
        throw new Error(
            `Settings API returned an empty response (HTTP ${response.status}). ` +
            "Check your backend controller."
        );
    }

    if (result.success === false) {
        throw new Error(
            result.message || "The settings request failed."
        );
    }

    // Supports APIs returning either { success: true, data: ... }
    // or a settings object directly.
    return result.data ?? result;
}

export function getSettings() {
    return request("", {
        method: "GET",
    });
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
