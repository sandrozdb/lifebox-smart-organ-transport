# LifeBox — teste experimental por Bluetooth BLE

**Prova de conceito separada.** O firmware de apresentação validado permanece em `firmware-real/sketch.ino`. O dashboard e o Wokwi não foram alterados.

## Objetivo

Verificar se o **ESP32 Dev Module** consegue transmitir **temperatura e impacto simulados** pelos dois potenciômetros B10K, **sem Wi-Fi**.

- GPIO34 → temperatura simulada de -2 °C a 14 °C
- GPIO35 → impacto simulado de 0 a 6 g
- Inversão dos controles mantida (`true`): valores aumentam ao girar para a direita na montagem anterior
- Transmissão BLE a cada 500 ms para o notebook, como CSV: `6.2,1.40`
- Serviço BLE: `2d514649-4c65-426f-7820-202600000001`
- Característica READ/NOTIFY: `2d514649-4c65-426f-7820-202600000002`

## Passo a passo do teste

1. Preserve uma cópia do firmware físico que funciona. Abra `bluetooth-test/bluetooth-test.ino` na Arduino IDE, usando **ESP32 by Espressif Systems core 3.x**, placa **ESP32 Dev Module**.
2. Carregue o sketch na placa, conectada por USB a uma **fonte estável**. Desconecte a alimentação antes de alterar cabos. As ligações dos dois potenciômetros permanecem as mesmas.
3. No Monitor Serial 115200, procure `LifeBox BLE anunciado` e valores como `6.2,1.40`. Se reiniciar aqui, investigue alimentação, cabo USB, placa e versão do core.
4. No **notebook com Bluetooth ligado**, abra a página de teste: `https://lifebox-expotech.onrender.com/ble-test.html` em **Chrome ou Edge**.
5. Clique **Conectar ESP32 físico**, selecione **LifeBox BLE**, e gire cada potenciômetro.
6. Os valores devem variar na página mesmo com **Wi-Fi do ESP32 desativado**. Internet pode ser necessária apenas para carregar a página do Render, não para a transmissão BLE.

**Observações:** Web Bluetooth requer HTTPS ou localhost e um navegador compatível. Não é suportado nativamente no Safari do iPhone. Se a placa tiver Arduino-ESP32 core 4.x, a API BLE mudou: use 3.x para este código de teste. Os valores simulados não são medições clínicas.

**Limite:** os dados ficam **apenas no navegador**, sem envio ao Render, MySQL ou dashboard principal. Se o BLE funcionar, a integração poderá ser planejada numa etapa posterior. Ao encerrar o teste, regrave `firmware-real/sketch.ino` na placa para restaurar OLED, LEDs, buzzer e funcionamento offline.
