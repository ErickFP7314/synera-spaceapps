/**
 * Galley — SerialFrame logic (pure C++, no Arduino dependency).
 * Shared by the ESP32 firmware (main.cpp) and the host tests (test/host/test_frame.cpp),
 * so what we test on the laptop is exactly what runs on the board.
 *
 * Contract: contracts/telemetry-payload.schema.json#/definitions/SerialFrame
 *   {"t":<int>,"hr":<number>,"spo2":<number>,"temp":<number>,"q":0|1,"src":"sensor"|"sim"}
 *   t and q are required; hr/spo2/temp are optional and omitted when not valid.
 */
#pragma once
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

namespace galley {

// Contract ranges (keep in sync with the schema).
constexpr int HR_MIN = 25, HR_MAX = 240;
constexpr int SPO2_MIN = 60, SPO2_MAX = 100;
constexpr float TEMP_MIN = 30.0f, TEMP_MAX = 44.0f;

// Signal-quality thresholds (prototype values; tune with the real sensor).
constexpr long FINGER_IR_MIN = 50000;       // SparkFun examples: IR < 50000 = no finger
constexpr unsigned long BEAT_FRESH_MS = 3000; // a beat must have been seen in the last 3 s

struct Frame {
  long t = 0;          // seconds (unix or since boot)
  int hr = -1;         // -1 = omit
  int spo2 = -1;       // -1 = omit
  float temp = NAN;    // NAN = omit
  int q = 0;           // 1 valid, 0 invalid
  bool simulated = false;
};

inline bool hrInRange(int hr) { return hr >= HR_MIN && hr <= HR_MAX; }
inline bool spo2InRange(int s) { return s >= SPO2_MIN && s <= SPO2_MAX; }
inline bool tempInRange(float c) { return !isnan(c) && c >= TEMP_MIN && c <= TEMP_MAX; }

/** q = 1 only with a finger on the sensor, a recent beat and a plausible average. */
inline int signalQuality(long ir, unsigned long msSinceBeat, int beatAvg) {
  return (ir >= FINGER_IR_MIN && msSinceBeat < BEAT_FRESH_MS && hrInRange(beatAvg)) ? 1 : 0;
}

/**
 * Writes one SerialFrame line (WITHOUT trailing newline) into buf.
 * Out-of-range or invalid values are omitted, never clamped or invented.
 * When q = 0 the hr/spo2 fields are dropped (only temp may remain).
 * Returns the number of chars written, or -1 if buf is too small.
 */
inline int formatFrame(char *buf, size_t n, const Frame &f) {
  int len = snprintf(buf, n, "{\"t\":%ld", f.t);
  auto add = [&](const char *fmt, auto v) {
    if (len < 0 || (size_t)len >= n) { len = -1; return; }
    int w = snprintf(buf + len, n - len, fmt, v);
    len = (w < 0) ? -1 : len + w;
  };
  if (f.q == 1 && hrInRange(f.hr)) add(",\"hr\":%d", f.hr);
  if (f.q == 1 && spo2InRange(f.spo2)) add(",\"spo2\":%d", f.spo2);
  if (tempInRange(f.temp)) add(",\"temp\":%.1f", (double)f.temp);
  add(",\"q\":%d", f.q == 1 ? 1 : 0);
  add(",\"src\":\"%s\"}", f.simulated ? "sim" : "sensor");
  if (len < 0 || (size_t)len >= n) return -1;
  return len;
}

/** Rolling average of the last N beats; reset when the finger is removed. */
template <int N>
struct BeatAverager {
  int rates[N] = {0};
  int count = 0, spot = 0;
  void reset() { count = 0; spot = 0; for (int i = 0; i < N; i++) rates[i] = 0; }
  void add(float bpm) {
    if (bpm < HR_MIN || bpm > HR_MAX) return;   // ignore impossible intervals
    rates[spot] = (int)(bpm + 0.5f);
    spot = (spot + 1) % N;
    if (count < N) count++;
  }
  int average() const {
    if (count == 0) return 0;
    int s = 0;
    for (int i = 0; i < count; i++) s += rates[i];
    return s / count;
  }
};

}  // namespace galley
