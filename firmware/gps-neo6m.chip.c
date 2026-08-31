// LifeBox - NEO-6M GPS customizado para Wokwi.
// Envia localização e velocidade configuradas nos controles como NMEA real.
#include "wokwi-api.h"

#include <math.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  uart_dev_t uart;
  timer_t timer;
  uint32_t latitude_attr;
  uint32_t longitude_attr;
  uint32_t speed_attr;
  char tx_buffer[256];
} chip_state_t;

static uint8_t nmea_checksum(const char *sentence) {
  uint8_t checksum = 0;
  if (*sentence == '$') sentence++;
  while (*sentence && *sentence != '*') checksum ^= (uint8_t)*sentence++;
  return checksum;
}

static void format_latitude(float latitude, char *value, size_t size,
                            char *hemisphere) {
  const float absolute = fabsf(latitude);
  const int degrees = (int)absolute;
  snprintf(value, size, "%02d%07.4f", degrees,
           (absolute - degrees) * 60.0f);
  *hemisphere = latitude >= 0.0f ? 'N' : 'S';
}

static void format_longitude(float longitude, char *value, size_t size,
                             char *hemisphere) {
  const float absolute = fabsf(longitude);
  const int degrees = (int)absolute;
  snprintf(value, size, "%03d%07.4f", degrees,
           (absolute - degrees) * 60.0f);
  *hemisphere = longitude >= 0.0f ? 'E' : 'W';
}

static void append_checksum(const char *body, char *output,
                            size_t output_size) {
  char sentence[180];
  snprintf(sentence, sizeof(sentence), "$%s", body);
  snprintf(output, output_size, "$%s*%02X\r\n", body,
           nmea_checksum(sentence));
}

static void send_nmea(chip_state_t *chip) {
  const float latitude = attr_read_float(chip->latitude_attr);
  const float longitude = attr_read_float(chip->longitude_attr);
  const float speed_kmh = attr_read_float(chip->speed_attr);
  const float speed_knots = speed_kmh / 1.852f;
  char latitude_value[20], longitude_value[20];
  char latitude_hemisphere, longitude_hemisphere;
  format_latitude(latitude, latitude_value, sizeof(latitude_value),
                  &latitude_hemisphere);
  format_longitude(longitude, longitude_value, sizeof(longitude_value),
                   &longitude_hemisphere);

  const uint64_t seconds_total = get_sim_nanos() / 1000000000ULL;
  char time_string[16];
  snprintf(time_string, sizeof(time_string), "%02d%02d%02d.00",
           (int)((12 + seconds_total / 3600) % 24),
           (int)((seconds_total / 60) % 60),
           (int)(seconds_total % 60));

  char rmc_body[150], gga_body[150], rmc_sentence[180], gga_sentence[180];
  snprintf(rmc_body, sizeof(rmc_body),
           "GPRMC,%s,A,%s,%c,%s,%c,%.2f,0.00,300826,,,A", time_string,
           latitude_value, latitude_hemisphere, longitude_value,
           longitude_hemisphere, speed_knots);
  snprintf(gga_body, sizeof(gga_body),
           "GPGGA,%s,%s,%c,%s,%c,1,08,0.9,760.0,M,-20.0,M,,", time_string,
           latitude_value, latitude_hemisphere, longitude_value,
           longitude_hemisphere);
  append_checksum(rmc_body, rmc_sentence, sizeof(rmc_sentence));
  append_checksum(gga_body, gga_sentence, sizeof(gga_sentence));
  snprintf(chip->tx_buffer, sizeof(chip->tx_buffer), "%s%s", rmc_sentence,
           gga_sentence);
  if (uart_write(chip->uart, (uint8_t *)chip->tx_buffer,
                 strlen(chip->tx_buffer)))
    printf("NEO-6M TX | LAT %.6f | LON %.6f | SPEED %.1f km/h\n", latitude,
           longitude, speed_kmh);
}

static void gps_timer_callback(void *user_data) {
  send_nmea((chip_state_t *)user_data);
}

void chip_init(void) {
  chip_state_t *chip = calloc(1, sizeof(chip_state_t));
  chip->latitude_attr = attr_init_float("latitude", -23.5505f);
  chip->longitude_attr = attr_init_float("longitude", -46.6333f);
  chip->speed_attr = attr_init_float("speedKmh", 40.0f);
  const uart_config_t uart_config = {
      .tx = pin_init("TX", INPUT_PULLUP),
      .rx = pin_init("RX", INPUT),
      .baud_rate = 9600,
      .rx_data = NULL,
      .write_done = NULL,
      .user_data = chip,
  };
  chip->uart = uart_init(&uart_config);
  const timer_config_t timer_config = {
      .callback = gps_timer_callback,
      .user_data = chip,
  };
  chip->timer = timer_init(&timer_config);
  timer_start(chip->timer, 1000000, true);
  printf("LifeBox NEO-6M iniciado - UART 9600 baud\n");
}
