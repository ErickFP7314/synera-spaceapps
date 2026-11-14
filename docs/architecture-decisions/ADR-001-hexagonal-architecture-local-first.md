# ADR 001: Arquitectura Hexagonal con Enfoque Local-First y Motor de Reglas Determinista en el Borde

## Estado
Aceptado

## Contexto y Restricciones
El proyecto **Synera ("Copiloto de salud para astronautas")** aborda los desafíos médicos en misiones de exploración espacial (LEO, órbita cislunar Artemis y futuras misiones a Marte). Las limitaciones fundamentales identificadas son:
1. **Comunicaciones intermitentes o con alta latencia con la Tierra:** Los astronautas no pueden depender de servidores en la nube para saber si su condición de salud es crítica o si deben iniciar contramedidas inmediatas.
2. **Explicabilidad clínica estricta:** Un astronauta no necesariamente tiene formación médica. Las decisiones de escalamiento (por ejemplo, suspender una actividad extravehicular - EVA o evacuar la nave como en la misión Crew-11 de 2026) deben ser 100% auditables, trazables y libres de alucinaciones.
3. **Desarrollo concurrente de Hardware y Software:** Equipos de electrónica/sensores y de desarrollo frontend/backend deben trabajar en paralelo sin bloquearse por la disponibilidad física de circuitos integrados soldados.

## Decisión de Arquitectura
1. **Arquitectura Hexagonal (Puertos y Adaptadores):**
   - El núcleo del dominio médico no depende de frameworks, bases de datos ni protocolos de transporte.
   - Interfaces unificadas (`SensorInputPort`, `EarthSyncPort`) permiten desacoplar el hardware físico de simuladores de prueba y de formularios de entrada manual.
2. **Patrón Local-First y Cola Asíncrona (Store-and-Forward):**
   - Todos los datos se almacenan localmente en una base de datos embebida ligera (SQLite con WAL).
   - El "Parte para Tierra" se genera como un paquete autosuficiente y se encola para su despacho automático durante las ventanas de enlace satelital.
3. **Motor Determinista vs. Inteligencia Artificial Caja Negra:**
   - Se prioriza un motor de reglas explícito, inferencia multivariable y modelado estadístico individualizado (Z-Score sobre línea base móvil personal) sobre modelos de Deep Learning opacos.
4. **Directorio Compartido de Contratos (`/contracts`):**
   - El monorepo establece esquemas JSON estrictos y perfiles BLE GATT como la única fuente de verdad compartida entre hardware y software.

## Matriz de Consecuencias y Trade-offs
| Atributo Priorizado | Atributo Sacrificado | Justificación |
|---|---|---|
| **Disponibilidad Offline** | Consistencia global inmediata | Garantiza autonomía médica total en caso de corte total de comunicaciones. |
| **Determinismo y Seguridad** | Flexibilidad de modelos black-box | Cero alucinaciones; justificación clínica verificable requerida por la NASA. |
| **Desacoplamiento / Testabilidad** | Simplicidad inicial de archivos | Permite a Software probar escenarios de fatiga con el simulador mientras Hardware diseña PCBs. |
