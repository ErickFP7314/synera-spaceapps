/**
 * Galley — skin temperature helpers (pure C++, no Arduino dependency; tested on the laptop).
 *
 * Supported sensors (auto-detected at boot by main.cpp, first found wins):
 *   1. MAX30205  — I2C, same bus as the MAX30102, address 0x48-0x4F (A0..A2), ±0.1 °C clinical-grade
 *   2. DS18B20   — 1-Wire on GPIO4 with a 4.7 kΩ pull-up to 3V3, ±0.5 °C
 * None found -> temperature is omitted from the frame (never invented).
 *
 * Both measure SKIN temperature, not core temperature. Galley compares against the
 * astronaut's own baseline, so the absolute offset of the body site does not matter as long
 * as the site stays the same (e.g., forehead/temple with medical tape).
 */
#pragma once
#include <math.h>
#include <stdint.h>

namespace galley {

constexpr uint8_t MAX30205_ADDR_FIRST = 0x48;
constexpr uint8_t MAX30205_ADDR_LAST = 0x4F;
constexpr uint8_t MAX30205_REG_TEMP = 0x00;
constexpr float MAX30205_LSB_C = 0.00390625f;   // 1/256 °C, two's complement, normal format

// DS18B20 sentinel values: -127 = disconnected, 85 = power-on reset value (no conversion yet)
constexpr float DS18B20_DISCONNECTED_C = -127.0f;
constexpr float DS18B20_POWER_ON_C = 85.0f;

/** MAX30205 temperature register (MSB, LSB) -> °C. */
inline float max30205RawToC(uint8_t msb, uint8_t lsb) {
  int16_t raw = (int16_t)(((uint16_t)msb << 8) | lsb);
  return raw * MAX30205_LSB_C;
}

/** A reading we are willing to send: plausible skin range and not a DS18B20 sentinel. */
inline bool plausibleSkinTemp(float c) {
  if (isnan(c) || c == DS18B20_DISCONNECTED_C || c == DS18B20_POWER_ON_C) return false;
  return c >= 30.0f && c <= 44.0f;   // same range as the SerialFrame contract
}

/** Exponential moving average to steady the 1-decimal display. Implausible samples are ignored. */
struct TempFilter {
  float alpha = 0.3f;
  float value = NAN;
  int bad = 0;                 // consecutive implausible samples
  void add(float c) {
    if (!plausibleSkinTemp(c)) {
      if (++bad >= 3) value = NAN;   // sensor unplugged / off the skin: stop reporting
      return;
    }
    bad = 0;
    value = isnan(value) ? c : alpha * c + (1.0f - alpha) * value;
  }
  float get() const { return value; }
};

}  // namespace galley
