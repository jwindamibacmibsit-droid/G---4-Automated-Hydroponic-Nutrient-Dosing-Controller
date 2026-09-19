#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>

// =====================================================
// WiFi Configuration
// =====================================================

const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// IMPORTANT:
// Do NOT use "localhost" for an ESP32.
// Replace this with the IP address of the computer
// running your PHP/Laravel API.
//
// Example:
// http://192.168.1.100:8000/api/esp.php
//
const char* API_URL =
    "http://localhost:8000/api/esp.php";

// =====================================================
// Device Information
// =====================================================

const char* DEVICE_ID = "ESP32-HYDRO-001";

// =====================================================
// Pin Definitions
// =====================================================

const int PH_SENSOR = 34;
const int WATER_SENSOR = 35;

const int RELAY_PH_UP = 18;
const int RELAY_PH_DOWN = 19;
const int RELAY_NUTRIENT_A = 21;
const int RELAY_NUTRIENT_B = 22;

// =====================================================
// Thresholds
// =====================================================

float PH_LOW = 5.8;
float PH_HIGH = 6.5;

int WATER_LOW = 1200;

// =====================================================
// Pump Configuration
// =====================================================

// Approximate dosing rate.
// Adjust these values according to your actual pump.
//
// Example:
// 5 ml/second = 0.005 ml/ms
//
const float PH_PUMP_RATE_ML_PER_MS = 0.005;
const float NUTRIENT_PUMP_RATE_ML_PER_MS = 0.005;

// Pump durations
const unsigned long PH_DOSING_DURATION = 3000;
const unsigned long NUTRIENT_DOSING_DURATION = 2000;

// =====================================================
// Sensor Variables
// =====================================================

float pH = 0.0;

int phRaw = 0;
int waterRaw = 0;

// =====================================================
// Function Prototypes
// =====================================================

void connectWiFi();

void readSensors();

void sendSensorReading();

void sendDosingLog(
    const char* dosingType,
    float amountML,
    unsigned long durationMS,
    const char* triggerType,
    const char* targetParameter,
    float beforeValue,
    float afterValue,
    const char* status
);

float readPH();

void dosePHUp();

void dosePHDown();

void doseNutrientA();

void doseNutrientB();

// =====================================================
// WiFi Connection
// =====================================================

void connectWiFi()
{
    Serial.println();
    Serial.println("Connecting to WiFi...");

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;

    while (WiFi.status() != WL_CONNECTED && attempts < 30)
    {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    Serial.println();

    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.println("WiFi Connected!");

        Serial.print("ESP32 IP Address: ");
        Serial.println(WiFi.localIP());
    }
    else
    {
        Serial.println("WiFi connection failed.");
    }
}

// =====================================================
// Read Sensors
// =====================================================

void readSensors()
{
    phRaw = analogRead(PH_SENSOR);
    waterRaw = analogRead(WATER_SENSOR);

    // Convert raw ADC value to approximate pH
    pH = map(phRaw, 0, 4095, 0, 140) / 10.0;

    Serial.println();
    Serial.println("========== SENSOR DATA ==========");

    Serial.print("pH Raw: ");
    Serial.println(phRaw);

    Serial.print("pH: ");
    Serial.println(pH, 2);

    Serial.print("Water Raw: ");
    Serial.println(waterRaw);

    Serial.println("=================================");
}

// =====================================================
// Read pH Again
// Used to record after_value in dosing_logs
// =====================================================

float readPH()
{
    int raw = analogRead(PH_SENSOR);

    float value =
        map(raw, 0, 4095, 0, 140) / 10.0;

    return value;
}

// =====================================================
// Send Sensor Reading
//
// Corresponds to:
//
// sensor_readings
//
// device_id
// ph_value
// water_level
// temperature
// nutrient_a
// nutrient_b
// timestamp
// =====================================================

void sendSensorReading()
{
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("WiFi disconnected.");
        connectWiFi();

        if (WiFi.status() != WL_CONNECTED)
        {
            return;
        }
    }

    HTTPClient http;

    http.begin(API_URL);

    http.addHeader(
        "Content-Type",
        "application/json"
    );

    String json = "{";

    json += "\"type\":\"sensor_reading\",";
    json += "\"device_id\":\"";
    json += DEVICE_ID;
    json += "\",";

    json += "\"ph_value\":";
    json += String(pH, 2);
    json += ",";

    json += "\"water_level\":";
    json += String(waterRaw);

    // Temperature and nutrient values can be added
    // later when the corresponding sensors are installed.

    json += "}";

    Serial.println();
    Serial.println("========== SENSOR API ==========");
    Serial.println(json);

    int httpCode = http.POST(json);

    Serial.print("HTTP Response: ");
    Serial.println(httpCode);

    if (httpCode > 0)
    {
        String response = http.getString();

        Serial.println("API Response:");
        Serial.println(response);
    }
    else
    {
        Serial.println("Failed to send sensor reading.");
    }

    http.end();
}

// =====================================================
// Send Dosing Log
//
// Corresponds to:
//
// dosing_logs
//
// device_id
// dosing_type
// amount_ml
// duration_ms
// trigger_type
// target_parameter
// before_value
// after_value
// status
// timestamp
// =====================================================

void sendDosingLog(
    const char* dosingType,
    float amountML,
    unsigned long durationMS,
    const char* triggerType,
    const char* targetParameter,
    float beforeValue,
    float afterValue,
    const char* status
)
{
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("WiFi disconnected.");
        connectWiFi();

        if (WiFi.status() != WL_CONNECTED)
        {
            return;
        }
    }

    HTTPClient http;

    http.begin(API_URL);

    http.addHeader(
        "Content-Type",
        "application/json"
    );

    String json = "{";

    json += "\"type\":\"dosing_log\",";

    json += "\"device_id\":\"";
    json += DEVICE_ID;
    json += "\",";

    json += "\"dosing_type\":\"";
    json += dosingType;
    json += "\",";

    json += "\"amount_ml\":";
    json += String(amountML, 2);
    json += ",";

    json += "\"duration_ms\":";
    json += String(durationMS);
    json += ",";

    json += "\"trigger_type\":\"";
    json += triggerType;
    json += "\",";

    json += "\"target_parameter\":\"";
    json += targetParameter;
    json += "\",";

    json += "\"before_value\":";
    json += String(beforeValue, 2);
    json += ",";

    json += "\"after_value\":";
    json += String(afterValue, 2);
    json += ",";

    json += "\"status\":\"";
    json += status;
    json += "\"";

    json += "}";

    Serial.println();
    Serial.println("========== DOSING LOG API ==========");
    Serial.println(json);

    int httpCode = http.POST(json);

    Serial.print("HTTP Response: ");
    Serial.println(httpCode);

    if (httpCode > 0)
    {
        String response = http.getString();

        Serial.println("API Response:");
        Serial.println(response);
    }
    else
    {
        Serial.println("Failed to send dosing log.");
    }

    http.end();
}

// =====================================================
// pH UP DOSING
// =====================================================

void dosePHUp()
{
    float beforePH = pH;

    unsigned long startTime = millis();

    Serial.println();
    Serial.println("LOW pH DETECTED");
    Serial.println("Adding pH UP...");

    digitalWrite(RELAY_PH_UP, LOW);

    delay(PH_DOSING_DURATION);

    digitalWrite(RELAY_PH_UP, HIGH);

    unsigned long duration =
        millis() - startTime;

    float amountML =
        duration * PH_PUMP_RATE_ML_PER_MS;

    delay(1000);

    float afterPH = readPH();

    Serial.println("pH UP dosing completed.");

    Serial.print("Before pH: ");
    Serial.println(beforePH, 2);

    Serial.print("After pH: ");
    Serial.println(afterPH, 2);

    Serial.print("Amount: ");
    Serial.print(amountML, 2);
    Serial.println(" ml");

    sendDosingLog(
        "PH_UP",
        amountML,
        duration,
        "automatic",
        "pH",
        beforePH,
        afterPH,
        "completed"
    );

    pH = afterPH;
}

// =====================================================
// pH DOWN DOSING
// =====================================================

void dosePHDown()
{
    float beforePH = pH;

    unsigned long startTime = millis();

    Serial.println();
    Serial.println("HIGH pH DETECTED");
    Serial.println("Adding pH DOWN...");

    digitalWrite(RELAY_PH_DOWN, LOW);

    delay(PH_DOSING_DURATION);

    digitalWrite(RELAY_PH_DOWN, HIGH);

    unsigned long duration =
        millis() - startTime;

    float amountML =
        duration * PH_PUMP_RATE_ML_PER_MS;

    delay(1000);

    float afterPH = readPH();

    Serial.println("pH DOWN dosing completed.");

    Serial.print("Before pH: ");
    Serial.println(beforePH, 2);

    Serial.print("After pH: ");
    Serial.println(afterPH, 2);

    Serial.print("Amount: ");
    Serial.print(amountML, 2);
    Serial.println(" ml");

    sendDosingLog(
        "PH_DOWN",
        amountML,
        duration,
        "automatic",
        "pH",
        beforePH,
        afterPH,
        "completed"
    );

    pH = afterPH;
}

// =====================================================
// NUTRIENT A DOSING
// =====================================================

void doseNutrientA()
{
    Serial.println();
    Serial.println("LOW WATER LEVEL");
    Serial.println("Adding Nutrient A...");

    unsigned long startTime = millis();

    digitalWrite(RELAY_NUTRIENT_A, LOW);

    delay(NUTRIENT_DOSING_DURATION);

    digitalWrite(RELAY_NUTRIENT_A, HIGH);

    unsigned long duration =
        millis() - startTime;

    float amountML =
        duration * NUTRIENT_PUMP_RATE_ML_PER_MS;

    Serial.print("Nutrient A Amount: ");
    Serial.print(amountML, 2);
    Serial.println(" ml");

    sendDosingLog(
        "NUTRIENT_A",
        amountML,
        duration,
        "automatic",
        "water_level",
        waterRaw,
        waterRaw,
        "completed"
    );
}

// =====================================================
// NUTRIENT B DOSING
// =====================================================

void doseNutrientB()
{
    Serial.println();
    Serial.println("Adding Nutrient B...");

    unsigned long startTime = millis();

    digitalWrite(RELAY_NUTRIENT_B, LOW);

    delay(NUTRIENT_DOSING_DURATION);

    digitalWrite(RELAY_NUTRIENT_B, HIGH);

    unsigned long duration =
        millis() - startTime;

    float amountML =
        duration * NUTRIENT_PUMP_RATE_ML_PER_MS;

    Serial.print("Nutrient B Amount: ");
    Serial.print(amountML, 2);
    Serial.println(" ml");

    sendDosingLog(
        "NUTRIENT_B",
        amountML,
        duration,
        "automatic",
        "water_level",
        waterRaw,
        waterRaw,
        "completed"
    );
}

// =====================================================
// SETUP
// =====================================================

void setup()
{
    Serial.begin(115200);

    // ---------------------------------------------
    // Relay Configuration
    // ---------------------------------------------

    pinMode(RELAY_PH_UP, OUTPUT);
    pinMode(RELAY_PH_DOWN, OUTPUT);
    pinMode(RELAY_NUTRIENT_A, OUTPUT);
    pinMode(RELAY_NUTRIENT_B, OUTPUT);

    // Active LOW relays
    // HIGH = OFF

    digitalWrite(RELAY_PH_UP, HIGH);
    digitalWrite(RELAY_PH_DOWN, HIGH);
    digitalWrite(RELAY_NUTRIENT_A, HIGH);
    digitalWrite(RELAY_NUTRIENT_B, HIGH);

    // ---------------------------------------------
    // Sensor Configuration
    // ---------------------------------------------

    pinMode(PH_SENSOR, INPUT);
    pinMode(WATER_SENSOR, INPUT);

    // ---------------------------------------------
    // Startup Message
    // ---------------------------------------------

    Serial.println();
    Serial.println("======================================");
    Serial.println("     HYDROCONTROL ESP32 SYSTEM");
    Serial.println("======================================");

    Serial.print("Device ID: ");
    Serial.println(DEVICE_ID);

    // ---------------------------------------------
    // Connect WiFi
    // ---------------------------------------------

    connectWiFi();
}

// =====================================================
// LOOP
// =====================================================

void loop()
{
    // ---------------------------------------------
    // Read Sensors
    // ---------------------------------------------

    readSensors();

    // ---------------------------------------------
    // Send Sensor Reading
    // ---------------------------------------------

    sendSensorReading();

    // ---------------------------------------------
    // pH Control
    // ---------------------------------------------

    if (pH < PH_LOW)
    {
        dosePHUp();
    }
    else if (pH > PH_HIGH)
    {
        dosePHDown();
    }
    else
    {
        Serial.println("pH Status: NORMAL");
    }

    // ---------------------------------------------
    // Water Level / Nutrient Control
    // ---------------------------------------------

    if (waterRaw < WATER_LOW)
    {
        Serial.println("Water Level Status: LOW");

        // Nutrient A
        doseNutrientA();

        delay(1000);

        // Nutrient B
        doseNutrientB();
    }
    else
    {
        Serial.println("Water Level Status: NORMAL");
    }

    // ---------------------------------------------
    // Wait Before Next Reading
    // ---------------------------------------------

    Serial.println();
    Serial.println("--------------------------------------");
    Serial.println("Waiting for next sensor cycle...");
    Serial.println("--------------------------------------");

    delay(3000);
}