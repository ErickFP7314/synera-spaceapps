// Host test for src/frame.h (same code that runs on the ESP32).
// Build & run:  g++ -std=c++17 -Wall -Wextra -Werror -I../../src test_frame.cpp -o /tmp/test_frame && /tmp/test_frame
// Prints one SerialFrame per scenario on stdout (validated against the contract by test_firmware_host.py),
// and diagnostics on stderr. Exit code != 0 on any failed check.
#include <cassert>
#include <cstdio>
#include <cstring>
#include <cmath>
#include "frame.h"
#include "temp.h"

using namespace galley;
static int failures = 0;
#define CHECK(cond) do { if (!(cond)) { fprintf(stderr, "FAIL %s:%d %s\n", __FILE__, __LINE__, #cond); failures++; } } while (0)

static void print(const Frame &f) {
  char buf[96];
  int n = formatFrame(buf, sizeof(buf), f);
  CHECK(n > 0);
  CHECK(strchr(buf, '\n') == nullptr);
  printf("%s\n", buf);
}

int main() {
  // --- signal quality
  CHECK(signalQuality(120000, 500, 62) == 1);   // finger, fresh beat, plausible HR
  CHECK(signalQuality(20000, 500, 62) == 0);    // no finger
  CHECK(signalQuality(120000, 5000, 62) == 0);  // stale beat
  CHECK(signalQuality(120000, 500, 0) == 0);    // no average yet
  CHECK(signalQuality(120000, 500, 300) == 0);  // impossible HR

  // --- beat averager
  BeatAverager<4> b;
  CHECK(b.average() == 0);
  b.add(60); b.add(64); CHECK(b.average() == 62);
  b.add(500); CHECK(b.average() == 62);         // impossible interval ignored
  b.add(62); b.add(62); b.add(62); b.add(62); CHECK(b.average() == 62);
  b.reset(); CHECK(b.average() == 0);

  // --- skin temperature (temp.h)
  CHECK(fabsf(max30205RawToC(0x25, 0x00) - 37.0f) < 1e-4);      // 0x2500 = 37.0 °C
  CHECK(fabsf(max30205RawToC(0x24, 0x80) - 36.5f) < 1e-4);      // 0x2480 = 36.5 °C
  CHECK(fabsf(max30205RawToC(0x00, 0x01) - 0.00390625f) < 1e-7);// 1 LSB
  CHECK(max30205RawToC(0xFF, 0x00) < 0.0f);                     // two's complement negative
  CHECK(!plausibleSkinTemp(-127.0f));                           // DS18B20 disconnected
  CHECK(!plausibleSkinTemp(85.0f));                             // DS18B20 power-on value
  CHECK(!plausibleSkinTemp(NAN));
  CHECK(plausibleSkinTemp(33.4f) && plausibleSkinTemp(36.6f));
  TempFilter tf;
  CHECK(isnan(tf.get()));
  tf.add(36.0f); CHECK(fabsf(tf.get() - 36.0f) < 1e-4);         // first sample taken as-is
  tf.add(37.0f); CHECK(fabsf(tf.get() - 36.3f) < 1e-4);         // EMA alpha 0.3
  tf.add(85.0f); CHECK(fabsf(tf.get() - 36.3f) < 1e-4);         // sentinel ignored
  tf.add(-127.0f); tf.add(NAN); CHECK(isnan(tf.get()));         // 3 bad in a row -> stop reporting

  // --- simulated-pulse frames (no MAX30102, e.g. Wokwi): temperature source
  // A real temp sensor is present -> send its reading, or omit it; NEVER replace it with a fake value.
  CHECK(fabsf(simFrameTemp(true, 38.5f, 36.5f) - 38.5f) < 1e-4); // DS18B20 slider at 38.5 °C
  CHECK(isnan(simFrameTemp(true, NAN, 36.5f)));                  // real sensor out of skin range -> omit
  CHECK(fabsf(simFrameTemp(false, NAN, 36.5f) - 36.5f) < 1e-4);  // no temp sensor at all -> simulated
  TempFilter hot;                                                // Wokwi slider at 125 °C (bug report)
  hot.add(125.0f); hot.add(125.0f); hot.add(125.0f);
  CHECK(isnan(simFrameTemp(true, hot.get(), 36.5f)));

  // --- formatting rules
  char small[8];
  Frame big; big.t = 123456; big.hr = 62; big.q = 1;
  CHECK(formatFrame(small, sizeof(small), big) == -1);   // never overflows

  Frame finger;  finger.t = 12; finger.hr = 62; finger.temp = 36.64f; finger.q = 1;           // finger on
  Frame off;     off.t = 13; off.hr = 62; off.spo2 = 97; off.q = 0;                          // finger off: drop hr/spo2
  Frame spo2;    spo2.t = 14; spo2.hr = 71; spo2.spo2 = 97; spo2.q = 1;                      // SpO2 build
  Frame bogus;   bogus.t = 15; bogus.hr = 300; bogus.spo2 = 40; bogus.temp = 80.0f; bogus.q = 1; // out of range: omit
  Frame skin;    skin.t = 17; skin.hr = 64; skin.temp = max30205RawToC(0x24, 0x9A); skin.q = 1;   // 36.6 °C from MAX30205 raw
  Frame sim;     sim.t = 16; sim.hr = 63; sim.spo2 = 98; sim.temp = 36.5f; sim.q = 1; sim.simulated = true;

  char buf[96];
  formatFrame(buf, sizeof(buf), finger);
  CHECK(strcmp(buf, "{\"t\":12,\"hr\":62,\"temp\":36.6,\"q\":1,\"src\":\"sensor\"}") == 0);
  formatFrame(buf, sizeof(buf), off);
  CHECK(strcmp(buf, "{\"t\":13,\"q\":0,\"src\":\"sensor\"}") == 0);
  formatFrame(buf, sizeof(buf), bogus);
  CHECK(strcmp(buf, "{\"t\":15,\"q\":1,\"src\":\"sensor\"}") == 0);
  formatFrame(buf, sizeof(buf), sim);
  CHECK(strstr(buf, "\"src\":\"sim\"") != nullptr);

  formatFrame(buf, sizeof(buf), skin);
  CHECK(strstr(buf, "\"temp\":36.6") != nullptr);

  print(finger); print(off); print(spo2); print(bogus); print(sim); print(skin);

  if (failures) { fprintf(stderr, "%d check(s) failed\n", failures); return 1; }
  fprintf(stderr, "all frame.h checks passed\n");
  return 0;
}
