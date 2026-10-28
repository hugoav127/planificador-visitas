# Planificador de visitas

Aplicación en español para organizar visitas de técnicos a obras con Next.js 16, React 19, TypeScript, Tailwind CSS 4, FullCalendar 7 y PostgreSQL en Neon.

## Ejecutar en local en menos de 10 minutos

Requisitos para ejecutar la aplicación correctamente: **Node.js 24 LTS**, **npm**, conexión a Internet y acceso a una **base de datos PostgreSQL**, preferiblemente en Neon.

La instalación descarga dependencias y la compilación puede necesitar acceso a Google Fonts.

### 1. Instalar las dependencias

Abre una terminal en la carpeta del repositorio y ejecuta:

```bash
npm ci
```

### 2. Configurar la conexión con Neon

Crea un archivo `.env.local` en la raíz del proyecto y configura la variable `DATABASE_URL`:

```env
DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@HOST/BASE_DE_DATOS?sslmode=require"
```

Sustituye los valores de ejemplo por la cadena de conexión proporcionada por Neon.

### 3. Preparar la base de datos

Si utilizas una base de datos vacía, ejecuta los siguientes archivos desde el SQL Editor de Neon, respetando este orden:

1. `database/schema.sql`: crea las tablas `tecnicos`, `obras` y `visitas`, con sus relaciones y restricciones.
2. `database/seed.sql`: introduce cuatro técnicos y diez obras de ejemplo.
3. `database/crear_visita.sql`: instala la función encargada de validar y guardar las reservas.

Las fechas utilizan `timestamp without time zone` y los estados disponibles son `Programada`, `Cancelada` y `Completada`.

El archivo `database/estado_completada.sql` permite actualizar bases de datos antiguas que todavía no admitan el estado `Completada`. No es necesario ejecutarlo en una base creada con el esquema actualizado.

Los archivos SQL no se ejecutan automáticamente al iniciar la aplicación.

### 4. Iniciar la aplicación

Ejecuta:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

Verás los indicadores, el calendario y el listado de visitas. Navegar y filtrar no modifica datos; crear, completar o cancelar visitas sí modifica la base de datos configurada.

**Problemas habituales:** ante el error `DATABASE_URL no está configurada`, revisa el archivo `.env.local` y reinicia el servidor. Si falla el guardado porque no existe `crear_visita`, instala la función SQL en la base de datos correspondiente.

## Comprobaciones

```bash
npm test
npm run lint
npm run build
npm start
```

`npm start` ejecuta la compilación de producción y requiere haber ejecutado previamente `npm run build`.

Vitest cubre las validaciones, acciones, acceso a datos, filtros y eventos mediante simulaciones de SQL y de la revalidación de Next.js. Estas pruebas no verifican la configuración real de Neon ni la concurrencia en una base de datos real.

---

## Resumen de la solución

### a) Qué se ha hecho y qué queda pendiente

Se ha desarrollado un dashboard responsive con indicadores, calendario semanal y mensual, filtros por técnico y fecha, creación de visitas mediante un modal y consulta de los detalles de cada visita.

Las visitas programadas se pueden completar o cancelar con confirmación, conservando su registro en PostgreSQL. Las canceladas desaparecen del listado y siguen visibles en gris en el calendario.

Se validan los días laborables, el horario de 08:00 a 17:00, las duraciones de 30, 60, 90 y 120 minutos, los solapamientos y los tiempos de desplazamiento.

No se incluyen autenticación, gestión de técnicos u obras ni edición de visitas programadas. Tampoco se ha creado una pantalla independiente para consultar las visitas, ya que se muestran directamente en el dashboard.

### b) Decisiones principales y motivos

He decidido utilizar Next.js con React y TypeScript para desarrollar la interfaz y gestionar las operaciones del servidor desde un mismo proyecto. Para almacenar los datos, he utilizado PostgreSQL mediante Neon.

Una de las decisiones más importantes que he tomado ha sido priorizar la creación del calendario para darle un aspecto más profesional a la aplicación. Considero que permite visualizar las visitas y los horarios de los técnicos de forma más clara e intuitiva.

Otra decisión relacionada con esto ha sido mantener el listado de visitas ordenadas y sus filtros en la misma pantalla. Al haber dado tanta relevancia al calendario, los estilos y el diseño responsive, he preferido integrar ambas funcionalidades en el dashboard en lugar de crear otra página.

Para el desarrollo, me he establecido un límite aproximado de tres horas, por lo que he priorizado las funcionalidades principales y el calendario.

### c) Supuestos

He supuesto que, aunque no se especifica explícitamente, el horario de trabajo de los técnicos es de lunes a viernes, de 08:00 a 17:00.

También he interpretado que debe existir un mínimo de 30 minutos de desplazamiento entre visitas en obras diferentes. En mi caso, he decidido aplicar este tiempo independientemente del municipio, al no disponer de información sobre las distancias reales.

Un último supuesto relacionado con el horario ha sido no contemplar una pausa específica para comer, ya que tampoco aparece indicada en el enunciado.

### d) Uso de IA y corrección

En esta entrega he utilizado dos herramientas de IA: **Codex** para ayudarme a escribir código y **ChatGPT** para resolver dudas y organizar el desarrollo.

En primer lugar, he utilizado ChatGPT para dividir los requisitos en diferentes fases y elaborar una guía de trabajo según las tecnologías escogidas.

Posteriormente, he utilizado Codex para desarrollar parte de las funcionalidades, proporcionándole instrucciones sobre los requisitos, el comportamiento esperado y la estructura del código. También lo he utilizado para corregir errores y mejorar la interfaz.

**Ejemplo de corrección de IA**

El calendario ha sido la parte que más dificultades me ha presentado. Uno de los principales problemas fue la visualización de visitas simultáneas, ya que las tarjetas se comprimían y dificultaban la lectura.

Para solucionarlo, he tenido que ajustar la distribución de los eventos, simplificar la información mostrada y mejorar el aprovechamiento del espacio. También he corregido problemas de visualización en dispositivos móviles, especialmente con el desplazamiento horizontal.

Todo ello ha requerido varias pruebas y revisiones por mi parte, apoyándome en Codex para implementar las correcciones necesarias.
