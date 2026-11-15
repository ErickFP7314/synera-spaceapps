/**
 * Galley — ESP32 sensor node firmware (starting point, contract v2)
 *
 * Output: one JSON line per second over USB serial @115200 baud
 *   {"t":12345,"hr":62,"spo2":97,"temp":36.6,"q":1,"src":"sensor"}
 * Contract: contracts/telemetry-payload.schema.json#/definitions/SerialFrame
 *
 * Wiring (ESP32 DevKit v1): MAX30102 VIN->3V3, GND->GND, SDA->GPIO21, SCL->GPIO22 (I2C addr 0x57)
 * If the MAX30102 is not found, the node keeps the web demo alive by emitting
 * simulated values with "src":"sim" (never pretend they are real).
 *
 * Notes for the Hardware team:
 *  - HR uses SparkFun's beat detector (checkForBeat) averaged over 4 beats.
 *  - SpO2 here is a PLACEHOLDER (not computed). Add SparkFun's spo2_algorithm.h
 *    (maxim_heart_rate_and_oxygen_saturation) if time allows; otherwise omit "spo2".
 *  - Finger PPG is not clinical grade: q=1 only with a finger (IR > 50000) and a stable beat.
 *  - Temperature: replace readTempC() with MAX30205 / DS18B20 when the part is available.
 */
#include <Arduino.h>
#include <Wire.h>
#include "MAX30105.h"   // SparkFun MAX3010x library (works with MAX30102)
#include "heartRate.h"

MAX30105 sensor;
bool sensorOk = false;

const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
int beatAvg = 0;
unsigned long lastEmit = 0;

float readTempC() {
  // TODO(hardware): MAX30205 / DS18B20. Until then: MAX30102 die temperature is NOT body temperature.
  return NAN;
}

void emit(int hr, int spo2, float temp, int q, const char *src) {
  Serial.print(F("{\"t\":"));
  Serial.print(millis() / 1000);
  if (hr > 0)   { Serial.print(F(",\"hr\":"));   Serial.print(hr); }
  if (spo2 > 0) { Serial.print(F(",\"spo2\":")); Serial.print(spo2); }
  if (!isnan(temp)) { Serial.print(F(",\"temp\":")); Serial.print(temp, 1); }
  Serial.print(F(",\"q\":"));
  Serial.print(q);
  Serial.print(F(",\"src\":\""));
  Serial.print(src);
  Serial.println(F("\"}"));
}

void setup() {
  Serial.begin(115200);
  delay(500);
  sensorOk = sensor.begin(Wire, I2C_SPEED_FAST);
  if (sensorOk) {
    sensor.setup();                    // default config
    sensor.setPulseAmplitudeRed(0x0A); // low red LED: presence indicator
  }
  // No boot banner on purpose: every line on the port must be valid JSON for the web app.
}

void loop() {
  if (sensorOk) {
    long ir = sensor.getIR();
    if (checkForBeat(ir)) {
      long delta = millis() - lastBeat;
      lastBeat = millis();
      float bpm = 60 / (delta / 1000.0);
      if (bpm > 25 && bpm < 240) {
        rates[rateSpot++] = (byte)bpm;
        rateSpot %= RATE_SIZE;
        int sum = 0;
        for (byte i = 0; i < RATE_SIZE; i++) sum += rates[i];
        beatAvg = sum / RATE_SIZE;
      }
    }
    if (millis() - lastEmit >= 1000) {
      lastEmit = millis();
      bool finger = ir > 50000;
      bool fresh = (millis() - lastBeat) < 3000;
      int q = (finger && fresh && beatAvg > 0) ? 1 : 0;
      emit(q ? beatAvg : 0, 0 /* spo2 placeholder: omitted */, readTempC(), q, "sensor");
    }
  } else if (millis() - lastEmit >= 1000) {
    lastEmit = millis();
    emit(random(60, 67), random(97, 100), 36.4 + random(0, 4) / 10.0, 1, "sim");
  }
}
