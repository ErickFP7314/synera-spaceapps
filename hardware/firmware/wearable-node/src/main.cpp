/**
 * Galley — ESP32 sensor node firmware (contract v2)
 *
 * Output: exactly ONE JSON line per second over USB serial @115200 baud, e.g.
 *   {"t":12,"hr":62,"temp":36.6,"q":1,"src":"sensor"}
 * Contract: contracts/telemetry-payload.schema.json#/definitions/SerialFrame
 * Pure frame logic lives in frame.h (tested on the laptop: test/test_firmware_host.py).
 *
 * Wiring (ESP32 DevKit v1): MAX30102 VIN->3V3, GND->GND, SDA->GPIO21, SCL->GPIO22 (I2C 0x57)
 *
 * Two modes (choose at build time):
 *   default            HR via SparkFun beat detector (checkForBeat), 4-beat average. No SpO2.
 *   -DGALLEY_SPO2=1    HR + SpO2 via Maxim's algorithm (SparkFun spo2_algorithm.h), validity
 *                      flags -> q. PlatformIO env: esp32dev_spo2.
 * If the MAX30102 is not found at boot, the node emits simulated values with "src":"sim"
 * so the web demo keeps working — never pretending they are real.
 *
 * Note: the ESP32 ROM prints a short boot log at 115200 on reset. The app must ignore
 * non-JSON lines (parseSerialLine already does).
 */
#include <Arduino.h>
#include <Wire.h>
#include "MAX30105.h"  // SparkFun MAX3010x library (works with MAX30102)
#include "frame.h"

#ifndef GALLEY_SPO2
#define GALLEY_SPO2 0
#endif

#if GALLEY_SPO2
#include "spo2_algorithm.h"
#else
#include "heartRate.h"
#endif

MAX30105 sensor;
bool sensorOk = false;
unsigned long lastEmit = 0;
char line[96];

// TODO(hardware): read MAX30205 / DS18B20 here. Return NAN until the part is wired:
// the MAX30102 die temperature is NOT body temperature, so we never send it as "temp".
float readSkinTempC() { return NAN; }

void emit(const galley::Frame &f) {
  if (galley::formatFrame(line, sizeof(line), f) > 0) Serial.println(line);
}

void emitSimulated() {
  galley::Frame f;
  f.t = millis() / 1000;
  f.hr = random(60, 67);
  f.spo2 = random(97, 100);
  f.temp = 36.4f + random(0, 4) / 10.0f;
  f.q = 1;
  f.simulated = true;
  emit(f);
}

#if !GALLEY_SPO2
// ---------------------------------------------------------------- HR mode
galley::BeatAverager<4> beats;
unsigned long lastBeat = 0;

void setupSensor() {
  sensor.setup();                     // SparkFun defaults (Example5_HeartRate)
  sensor.setPulseAmplitudeRed(0x0A);  // low red LED = "sensor on" indicator
  sensor.setPulseAmplitudeGreen(0);
}

void loopSensor() {
  long ir = sensor.getIR();
  if (ir < galley::FINGER_IR_MIN) {
    beats.reset();                    // finger removed: never keep a stale average
  } else if (checkForBeat(ir)) {
    unsigned long now = millis();
    if (lastBeat > 0) beats.add(60000.0f / (now - lastBeat));
    lastBeat = now;
  }
  if (millis() - lastEmit >= 1000) {
    lastEmit = millis();
    galley::Frame f;
    f.t = millis() / 1000;
    f.hr = beats.average();
    f.q = galley::signalQuality(ir, millis() - lastBeat, f.hr);
    f.temp = readSkinTempC();
    emit(f);
  }
}
#else
// -------------------------------------------------------------- SpO2 mode
const int32_t BUF = 100;              // 4 s of samples at 25 sps
uint32_t irBuf[BUF], redBuf[BUF];
int32_t spo2 = 0, hr = 0;
int8_t spo2Valid = 0, hrValid = 0;

void readSamples(int32_t from, int32_t to) {
  for (int32_t i = from; i < to; i++) {
    while (!sensor.available()) sensor.check();
    redBuf[i] = sensor.getRed();
    irBuf[i] = sensor.getIR();
    sensor.nextSample();
  }
}

void setupSensor() {
  // SparkFun Example8_SPO2: brightness 60, avg 4, Red+IR, 100 Hz, 411 us, 4096 nA
  sensor.setup(60, 4, 2, 100, 411, 4096);
  readSamples(0, BUF);
}

void loopSensor() {
  // keep the last 75 samples, read 25 new ones (~1 s), recompute
  memmove(redBuf, redBuf + 25, 75 * sizeof(uint32_t));
  memmove(irBuf, irBuf + 25, 75 * sizeof(uint32_t));
  readSamples(75, BUF);
  maxim_heart_rate_and_oxygen_saturation(irBuf, BUF, redBuf, &spo2, &spo2Valid, &hr, &hrValid);
  bool finger = (long)irBuf[BUF - 1] >= galley::FINGER_IR_MIN;
  galley::Frame f;
  f.t = millis() / 1000;
  f.q = (finger && hrValid && spo2Valid && galley::hrInRange(hr) && galley::spo2InRange(spo2)) ? 1 : 0;
  f.hr = hr;
  f.spo2 = spo2;
  f.temp = readSkinTempC();
  emit(f);
  lastEmit = millis();
}
#endif

void setup() {
  Serial.begin(115200);
  delay(300);
  sensorOk = sensor.begin(Wire, I2C_SPEED_FAST);
  if (sensorOk) setupSensor();
  randomSeed(esp_random());
  // No boot banner on purpose: every line we print must be valid JSON for the web app.
}

void loop() {
  if (sensorOk) {
    loopSensor();
  } else if (millis() - lastEmit >= 1000) {
    lastEmit = millis();
    emitSimulated();
  }
}
