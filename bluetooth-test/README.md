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


## NOVO: firmware completo + Bluetooth, integrado ao dashboard (EXPERIMENTAL)

O firmware de teste inicial acima continua disponível em `bluetooth-test/bluetooth-test.ino`. Para o teste completo, use **[`lifebox-ble-full/lifebox-ble-full.ino`](lifebox-ble-full/lifebox-ble-full.ino)**.

Esse novo sketch parte da **versão offline testada** e mantém:
- OLED e a tela de abertura, órgão fixo coração, temperatura, impacto, faixa de 4–8 °C e acento de CENÁRIO.
- Potenciômetros no GPIO34 e GPIO35, ambos aumentando no sentido usado na montagem.
- LED verde GPIO25 e vermelho GPIO26, buzzer passivo 2 kHz no GPIO27 (sem reiniciar PWM a cada loop).
- Botão BOOT no GPIO0: 2 segundos para pausar/retomar.
- Bluetooth BLE com o **mesmo serviço/característica** já testados anteriormente, notificações a cada 500 ms.

O formato agora é `temperatura,impacto,ativo`, exemplo `6.2,1.40,1`; `ativo` vale `0` quando o botão BOOT pausou a simulação. Não usa Wi-Fi. Se ocorrer reinício com rádio BLE + OLED, volte ao sketch original e confira a alimentação; a versão ainda não foi validada na caixa completa.

### Como testar no dashboard principal

1. Na Arduino IDE, abra o novo sketch na pasta `lifebox-ble-full`, selecione **ESP32 Dev Module**, core **3.x**, e envie para a placa.
2. Com a placa alimentada, confirme que o OLED aparece e que os potenciômetros, LEDs e buzzer continuam respondendo localmente.
3. No notebook com Chrome ou Edge e Bluetooth ativo, abra `https://lifebox-expotech.onrender.com` depois do deploy.
4. Em **FONTE**, escolha **ESP32 FÍSICO · BLE**. Aparecerá o painel de conexão.
5. Clique **Conectar ESP32 físico** e selecione **LifeBox BLE**.
6. Gire temperatura e impacto. Confira os números e os alertas na interface. Teste também o BOOT: a pausa deve desligar o alarme.
7. Se quiser voltar ao Wokwi ou DEMO, escolha a outra fonte. A seleção BLE **não altera o modo da API**.

**Limite arquitetural:** no modo BLE, **somente temperatura e impacto, estado do botão BOOT, sinais lógicos e alertas locais** refletem a caixa. Outros componentes (mapa, rotas, gráficos históricos, timeline, umidade, bateria e sinal) continuam referentes à aplicação online e não são alimentados pelo ESP32 físico. Nenhum dado BLE é enviado à API ou ao banco. A caixa funciona normalmente mesmo sem a conexão BLE.

### Voltar à versão segura

Abra [`../firmware-real/sketch.ino`](../firmware-real/sketch.ino) e envie novamente pela Arduino IDE. Esse arquivo **não foi alterado** por esta experiência.
