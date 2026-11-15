// Host test for src/frame.h (same code that runs on the ESP32).
// Build & run:  g++ -std=c++17 -Wall -Wextra -Werror -I../../src test_frame.cpp -o /tmp/test_frame && /tmp/test_frame
// Prints one SerialFrame per scenario on stdout (validated against the contract by test_firmware_host.py),
// and diagnostics on stderr. Exit code != 0 on any failed check.
#include <cassert>
#include <cstdio>
#include <cstring>
#include "frame.h"

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

  // --- formatting rules
  char small[8];
  Frame big; big.t = 123456; big.hr = 62; big.q = 1;
  CHECK(formatFrame(small, sizeof(small), big) == -1);   // never overflows

  Frame finger;  finger.t = 12; finger.hr = 62; finger.temp = 36.64f; finger.q = 1;           // finger on
  Frame off;     off.t = 13; off.hr = 62; off.spo2 = 97; off.q = 0;                          // finger off: drop hr/spo2
  Frame spo2;    spo2.t = 14; spo2.hr = 71; spo2.spo2 = 97; spo2.q = 1;                      // SpO2 build
  Frame bogus;   bogus.t = 15; bogus.hr = 300; bogus.spo2 = 40; bogus.temp = 80.0f; bogus.q = 1; // out of range: omit
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

  print(finger); print(off); print(spo2); print(bogus); print(sim);

  if (failures) { fprintf(stderr, "%d check(s) failed\n", failures); return 1; }
  fprintf(stderr, "all frame.h checks passed\n");
  return 0;
}
