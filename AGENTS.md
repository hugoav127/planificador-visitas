# Guía del proyecto para agentes

## Objetivo y alcance

`planificador-visitas` es una prueba técnica para planificar visitas de técnicos a obras. La interfaz y los mensajes están en español. Prioriza soluciones sencillas y mantenibles; implementa únicamente lo solicitado, sin añadir funcionalidades, dependencias o capas de arquitectura innecesarias.

Antes de modificar archivos, revisa el código existente y reutiliza sus funciones. Conserva los cambios locales del usuario. Este documento describe el estado actual; comprueba el código y `package.json` si detectas diferencias.

## Tecnologías y ejecución

- Next.js 16.4.3 con App Router, React 19.3 y TypeScript con modo estricto.
- Tailwind CSS 4, configurado mediante `@tailwindcss/turbopack` en `next.config.ts`.
- PostgreSQL en Neon, mediante `@neondatabase/serverless`.
- FullCalendar para React 7.1.3 y `temporal-polyfill`.
- Vitest para pruebas y ESLint para revisión estática.
- Gestor de paquetes: pnpm; conserva `pnpm-lock.yaml`.

Comandos habituales:

```sh
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm build
pnpm start
```

En Windows, si PowerShell bloquea `pnpm.ps1`, utiliza `pnpm.cmd` sin cambiar la política de ejecución del sistema.

La conexión requiere `DATABASE_URL`, configurada en el entorno local o de despliegue. No copies el contenido de `.env`, credenciales ni cadenas de conexión a código, documentación, registros o respuestas. El build utiliza `next/font/google` y puede necesitar acceso a Google Fonts.

## Estructura y responsabilidades

| Archivo | Responsabilidad |
| --- | --- |
| `src/app/page.tsx` | Página dinámica del dashboard. Consulta técnicos, obras y visitas en el servidor; compone indicadores, calendario, formulario y listado. |
| `src/app/actions.ts` | Server Actions: `programarVisita()`, `anularVisita()` y `finalizarVisita()`. Devuelven resultados controlados y llaman a `revalidatePath("/")` tras guardar cambios. |
| `src/app/layout.tsx` | Estructura común, idioma español, metadatos y fuentes. |
| `src/app/globals.css` | Tailwind, estilos generales y personalización visual del calendario. |
| `src/components/VisitaForm.tsx` | Botón «Nueva visita» y modal de creación. |
| `src/components/ListaVisitas.tsx` | Filtros, listado de visitas programadas y cancelación con confirmación. |
| `src/components/CalendarioVisitas.tsx` | FullCalendar, navegación, tarjetas de visitas y modal de detalles. |
| `src/components/DetalleVisita.tsx` | Modal compartido de detalles, abierto desde el calendario y el listado. |
| `src/components/AccionesVisita.tsx` | Botones compartidos para completar o cancelar, confirmación y mensajes de resultado. |
| `src/lib/db.ts` | Conexión a Neon, protegida mediante `server-only`. |
| `src/lib/visitas.ts` | Acceso a datos: `listarVisitas()`, `crearVisita()`, `cancelarVisita()` y `completarVisita()`. |
| `src/lib/validaciones.ts` | Tipos y reglas de planificación, duraciones permitidas y cálculo de finalización. |
| `src/lib/filtros.ts` | Filtrado de visitas no canceladas por técnico y fecha local. |
| `src/lib/calendario.ts` | Conversión de visitas a eventos y colores estables por técnico. |
| `database/crear_visita.sql` | Definición de la función atómica de PostgreSQL que valida y guarda reservas. |
| `src/**/*.test.ts` | Pruebas de validaciones, acceso a datos, acciones, filtros y eventos. |

## Base de datos y límites del servidor

Tablas utilizadas:

- `tecnicos`: `id`, `nombre`.
- `obras`: `id`, `nombre`, `municipio`.
- `visitas`: `id`, `tecnico_id`, `obra_id`, `fecha_inicio`, `fecha_fin`, `estado`.

Los identificadores se generan en PostgreSQL. Los estados utilizados son exactamente `Programada`, `Cancelada` y `Completada`. La migración `database/estado_completada.sql` amplía la restricción `estado_valido` para permitir el tercer estado.

- Mantén todas las operaciones SQL en el servidor. Los componentes cliente pueden importar tipos mediante `import type`, pero no deben importar conexiones ni ejecutar consultas.
- Usa consultas parametrizadas del cliente Neon.
- `crearVisita()` valida los datos y llama a `crear_visita(...)`; no la sustituyas por un `INSERT` directo ni por comprobaciones y escritura en peticiones separadas.
- La función SQL bloquea la fila del técnico con `FOR UPDATE`, comprueba referencias, día laborable, horario, solapamientos y desplazamientos, y realiza la inserción en la misma operación.
- `cancelarVisita()` actualiza únicamente registros en estado `Programada`. No elimina filas y devuelve `false` si la visita no existe o ya está cancelada.
- No modifiques las tablas de Neon. Si surge una necesidad estrictamente obligatoria, explica el cambio antes de realizarlo.
- Editar `database/crear_visita.sql` no actualiza Neon automáticamente. Si cambias reglas compartidas con PostgreSQL, mantén ambas implementaciones coherentes e indica si la función desplegada también se ha actualizado.
- En una base nueva, comprueba que existe `crear_visita`; la ausencia de esta función ya ha provocado errores de guardado. No crees ni canceles reservas reales para probar sin autorización para esas operaciones.

## Reglas de planificación

1. Técnico y obra deben existir y tener identificadores válidos.
2. Todos los campos del formulario son obligatorios.
3. Las visitas solo se pueden programar de lunes a viernes, entre las 08:00 y las 17:00, terminando el mismo día. Se permite terminar exactamente a las 17:00.
4. Duraciones admitidas: 30, 60, 90 y 120 minutos. El valor predeterminado del formulario es 60 minutos. Esta restricción se valida actualmente en TypeScript antes de llamar a SQL.
5. Un técnico no puede tener visitas programadas solapadas.
6. Entre obras diferentes se necesitan al menos 30 minutos de desplazamiento para el mismo técnico, en cualquiera de los dos sentidos temporales.
7. Se permiten visitas consecutivas en la misma obra.
8. Técnicos distintos pueden tener visitas simultáneas, incluso en obras diferentes.
9. Las visitas canceladas no bloquean nuevas reservas ni desplazamientos.

Reutiliza `validarVisita()`, `horarioValido()`, `haySolape()`, `trasladoValido()` y `calcularFin()` según corresponda. Las validaciones definitivas se ejecutan en el servidor; no confíes exclusivamente en restricciones del formulario.

## Fechas locales: requisito importante

- `fecha_inicio` y `fecha_fin` son `timestamp without time zone`.
- La aplicación utiliza cadenas locales `YYYY-MM-DDTHH:mm`, sin `Z` ni desplazamiento horario.
- `listarVisitas()` utiliza `TO_CHAR` para devolver esas cadenas sin conversiones implícitas del controlador.
- El servidor calcula la finalización a partir de fecha, hora y duración. No acepta una fecha de finalización calculada por el navegador como fuente de verdad.
- Las validaciones utilizan internamente un reloj UTC neutro para comparar minutos y comprobar fechas; no significa que los datos representen instantes UTC. Conserva esa convención y evita conversiones entre zonas horarias.
- La comprobación del fin de semana usa `getUTCDay()` sobre ese reloj neutro: domingo = 0, sábado = 6. PostgreSQL usa `EXTRACT(ISODOW ...)`: sábado = 6, domingo = 7.
- FullCalendar recibe las cadenas originales y utiliza `timeZone="local"`. No conviertas las reservas con `toISOString()` ni añadas offsets antes de mostrarlas o guardarlas.

## Comportamiento de la interfaz

### Dashboard y creación

- Estilo profesional y responsive con blancos, grises suaves y azules.
- Cabecera con título y botón «Nueva visita».
- Tres indicadores: técnicos, visitas programadas y obras. El contador de visitas excluye canceladas.
- Conserva el modal de creación y sus campos: técnico, obra, fecha, hora de inicio y duración. No añadas prioridad, título, observaciones ni estado al formulario.
- Los selectores guardan IDs; la obra se presenta con nombre y municipio.
- El envío se deshabilita con campos incompletos y durante el guardado. Evita envíos repetidos.
- Los errores se muestran dentro del modal sin cerrarlo ni borrar campos. El éxito cierra el modal, confirma y actualiza la agenda.
- El modal admite X, Cancelar y Escape. Conserva el uso accesible de `<dialog>`, etiquetas y mensajes de estado.

### Calendario

- Es el elemento principal del dashboard y está encapsulado en un componente independiente.
- Vista semanal predeterminada, de lunes a viernes; vista mensual disponible, navegación anterior/siguiente y botón «Hoy».
- Interfaz en español, semana iniciada en lunes y franja visible de 08:00 a 17:00.
- Dashboard con ancho máximo de 1680 px y calendario con desplazamiento horizontal interno cuando no cabe.
- Presentación inspirada en una agenda de columnas diarias: tarjetas con fondo suave y borde de color que priorizan obra y horario; el técnico aparece cuando hay espacio suficiente. Destaca el día actual.
- Las visitas coincidentes se presentan lado a lado, con un máximo de dos columnas y acceso al resto mediante el enlace de más eventos de FullCalendar. No implementes arrastrar y soltar, redimensionado ni edición de visitas.
- El filtro de técnico del calendario es independiente de los filtros del listado y conserva las visitas canceladas del técnico elegido.
- El color corresponde al técnico y se mantiene según su ID, independientemente de la obra, el orden o los filtros.
- Las canceladas se muestran con fondo gris suave y título tachado en el calendario, aunque estén ocultas en el listado inferior. Esta diferencia es intencionada.
- Al pulsar una tarjeta, se abre el modal con técnico, obra, municipio, fecha, horario y estado.
- El mismo modal se abre al pulsar el nombre de una visita del listado. Ofrece «Completar» con fondo verde y «Cancelar» con fondo rojo para las visitas programadas; reutiliza las acciones del listado y no elimina físicamente registros.
- Recibe los datos de `listarVisitas()`. Las actualizaciones tras crear o cancelar proceden de la revalidación del servidor; no mantengas copias desactualizadas de las visitas en estado cliente.
- En pantallas estrechas, el calendario tiene desplazamiento horizontal interno; la página no debe desbordarse horizontalmente.
- Usa FullCalendar 7, no ejemplos de v6: los plugins y locales se importan desde `@fullcalendar/react/...`; `slotHeaderFormat` reemplaza a `slotLabelFormat`. Se importan los CSS `skeleton`, tema y paleta desde `globals.css`. No instales paquetes separados de plugins v6 ni cambies de versión sin necesidad.

### Listado, filtros y cancelación

- El listado inferior muestra visitas `Programada` y `Completada`, en orden cronológico. `listarVisitas()` devuelve también las canceladas para el calendario; no elimines esas filas de la consulta compartida para ocultarlas en el listado.
- El botón «Completar» solicita confirmación y utiliza `finalizarVisita()` y `completarVisita()`. Solo permite la transición de `Programada` a `Completada`, con un `UPDATE` condicional. Las completadas siguen visibles con un distintivo verde, sin botones de completar ni cancelar. En el calendario conservan el color del técnico, con una marca de completada y el estado en los detalles. El indicador superior cuenta solo las programadas.
- Filtros combinables de técnico y fecha, con «Todos los técnicos» y opción de volver a todas las fechas.
- El botón «Limpiar filtros» restablece ambos filtros del listado sin afectar al calendario.
- Conserva los filtros al revalidar la página.
- El cuerpo del listado tiene `max-height: 420px` y scroll vertical interno; los filtros permanecen visibles encima.
- Cada visita muestra técnico, obra, municipio, fecha, inicio, fin y estado.
- La cancelación requiere confirmación y pasa por `anularVisita()` y `cancelarVisita()`. Deshabilita el envío durante la operación y muestra éxito o error.
- Una visita cancelada desaparece automáticamente del listado, permanece en PostgreSQL y pasa a gris en el calendario. No puede volver a cancelarse.

## Convenciones y comprobaciones

- Funciones pequeñas, nombres cortos y descriptivos en español con `camelCase`; respeta los nombres exigidos por el framework y las convenciones de componentes React.
- Encima de cada función, escribe un comentario breve que explique qué hace, sin describir variables ni parámetros.
- Respeta la estructura existente y los límites entre componentes servidor y cliente.
- No dupliques la lógica de negocio en componentes. Mantén explícitamente las comprobaciones de concurrencia en PostgreSQL.
- No añadas datos ficticios a la interfaz, dependencias visuales adicionales ni funcionalidades fuera del alcance solicitado.
- Para cambios funcionales, añade o actualiza pruebas relevantes. Ejecuta `pnpm test` y `pnpm build`; ejecuta también `pnpm lint` cuando modifiques código.
- Las pruebas actuales simulan SQL y la revalidación de Next.js; no demuestran por sí mismas que Neon esté correctamente configurado ni sustituyen una prueba de concurrencia real.
- Para cambios visuales, revisa escritorio y móvil, navegación, modales y scroll. No confirmes cancelaciones ni crees registros reales como parte de una comprobación visual sin autorización.
- Informa de los archivos modificados, el comportamiento implementado y las comprobaciones realizadas. Distingue pruebas automatizadas, verificación en navegador y operaciones reales sobre Neon.
- No dejes scripts temporales de diagnóstico o carga con rutas de máquina o credenciales en el repositorio.

## Instrucciones obligatorias de Next.js

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
