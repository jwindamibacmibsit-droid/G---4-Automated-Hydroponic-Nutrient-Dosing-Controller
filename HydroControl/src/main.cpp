#include <Arduino.h>

#include <WiFi.h>
#include <HTTPClient.h>

// ---------------- WiFi ----------------

const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// PHP API running on your PC
const char* API_URL =
    "http://host.wokwi.internal:8000/api/esp.php";

// ---------------- Pin Definitions ----------------

const int PH_SENSOR = 34;
const int WATER_SENSOR = 35;

const int RELAY_PH_UP = 18;
const int RELAY_PH_DOWN = 19;
const int RELAY_NUTRIENT_A = 21;
const int RELAY_NUTRIENT_B = 22;

// ---------------- Thresholds ----------------

float PH_LOW = 5.8;
float PH_HIGH = 6.5;

int WATER_LOW = 1200;

// ---------------- Variables ----------------

float pH = 0;
int phRaw = 0;
int waterRaw = 0;

bool phUpActive = false;
bool phDownActive = false;
bool nutrientAActive = false;
bool nutrientBActive = false;

// ------------------------------------------------

void connectWiFi() {

    Serial.println();
    Serial.println("Connecting to Wokwi WiFi...");

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");  
    }

    Serial.println();
    Serial.println("WiFi Connected!");

    Serial.print("ESP32 IP: ");
    Serial.println(WiFi.localIP());
}

// ------------------------------------------------

void sendDataToPHP() {

    if (WiFi.status() != WL_CONNECTED) {

        Serial.println("WiFi disconnected!");

        connectWiFi();
    }


    HTTPClient http;

    http.begin(API_URL);

    http.addHeader(
        "Content-Type",
        "application/json"
    );


    String json = "{";

    json += "\"device_uid\":\"ESP32-HYDRO-001\",";

    json += "\"ph_raw\":";
    json += String(phRaw);
    json += ",";

    json += "\"ph\":";
    json += String(pH, 2);
    json += ",";

    json += "\"water_raw\":";
    json += String(waterRaw);
    json += ",";

    json += "\"ph_up\":";
    json += phUpActive ? "true" : "false";
    json += ",";

    json += "\"ph_down\":";
    json += phDownActive ? "true" : "false";
    json += ",";

    json += "\"nutrient_a\":";
    json += nutrientAActive ? "true" : "false";
    json += ",";

    json += "\"nutrient_b\":";
    json += nutrientBActive ? "true" : "false";

    json += "}";


    Serial.println();
    Serial.println("========== API DATA ==========");
    Serial.println(json);


    int httpCode =
        http.POST(json);


    Serial.print("HTTP Response: ");
    Serial.println(httpCode);


    if (httpCode > 0) {

        String response =
            http.getString();

        Serial.println("PHP Response:");
        Serial.println(response);

    } else {

        Serial.println(
            "Failed to connect to PHP API"
        );
    }


    http.end();
}
// ------------------------------------------------

void setup() {

    Serial.begin(115200);

    // Relay pins
    pinMode(RELAY_PH_UP, OUTPUT);
    pinMode(RELAY_PH_DOWN, OUTPUT);
    pinMode(RELAY_NUTRIENT_A, OUTPUT);
    pinMode(RELAY_NUTRIENT_B, OUTPUT);

    // Relays OFF - Active LOW
    digitalWrite(RELAY_PH_UP, HIGH);
    digitalWrite(RELAY_PH_DOWN, HIGH);
    digitalWrite(RELAY_NUTRIENT_A, HIGH);
    digitalWrite(RELAY_NUTRIENT_B, HIGH);

    Serial.println("==================================");
    Serial.println("Hydroponic Controller Started");
    Serial.println("==================================");

    connectWiFi();
}

// ------------------------------------------------

void loop() {

    // ---------------- Read Sensors ----------------

    phRaw = analogRead(PH_SENSOR);
    waterRaw = analogRead(WATER_SENSOR);

    // Convert raw ADC to pH
    pH = map(phRaw, 0, 4095, 0, 140) / 10.0;

    // Reset relay states
    phUpActive = false;
    phDownActive = false;
    nutrientAActive = false;
    nutrientBActive = false;

    // ---------------- Display ----------------

    Serial.println();
    Serial.println("========== SENSOR DATA ==========");

    Serial.print("Raw pH: ");
    Serial.println(phRaw);

    Serial.print("pH: ");
    Serial.println(pH);

    Serial.print("Water Level: ");
    Serial.println(waterRaw);

    // ---------------- pH Control ----------------

    if (pH < PH_LOW) {

        Serial.println("Low pH -> Adding pH UP");

        phUpActive = true;

        digitalWrite(RELAY_PH_UP, LOW);

        delay(3000);

        digitalWrite(RELAY_PH_UP, HIGH);

        phUpActive = false;

    }

    else if (pH > PH_HIGH) {

        Serial.println("High pH -> Adding pH DOWN");

        phDownActive = true;

        digitalWrite(RELAY_PH_DOWN, LOW);

        delay(3000);

        digitalWrite(RELAY_PH_DOWN, HIGH);

        phDownActive = false;

    }

    else {

        Serial.println("pH is Normal");

    }

    // ---------------- Water Level ----------------

    if (waterRaw < WATER_LOW) {

        Serial.println("Water Low");

        Serial.println("Adding Nutrient A");

        nutrientAActive = true;

        digitalWrite(RELAY_NUTRIENT_A, LOW);

        delay(2000);

        digitalWrite(RELAY_NUTRIENT_A, HIGH);

        nutrientAActive = false;

        delay(1000);

        Serial.println("Adding Nutrient B");

        nutrientBActive = true;

        digitalWrite(RELAY_NUTRIENT_B, LOW);

        delay(2000);

        digitalWrite(RELAY_NUTRIENT_B, HIGH);

        nutrientBActive = false;

    }

    else {

        Serial.println("Water Level Normal");

    }

    // ---------------- Send to PHP ----------------

    sendDataToPHP();

    Serial.println("--------------------------------");

    delay(3000);
}