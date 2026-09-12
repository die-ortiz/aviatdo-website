# Ajustes para migrar a WordPress — Referencia

Documento vivo: lo vamos actualizando a medida que avanzamos con la
migración, no es una lista cerrada. Pensado para el que arme el theme
(seas vos, un dev, o una agencia) — parte de lo que ya sabemos de este
mockup y de las decisiones ya tomadas (ver `CLAUDE.md`, sección
"Decisiones confirmadas"): CPT nativos + ACF free + Polylang para EN/ES.

**Estado:** sin empezar. Cada sección abajo tiene un check `[ ]` que
vamos marcando `[x]` cuando esa parte quede resuelta en el theme real
(no en este repo de mockup, que sigue siendo estático).

---

## 1. Estilos inline → clases del theme

- [ ] Auditar y extraer

Casi todo el sitio está armado con `style="..."` directo en cada
elemento (fue la forma más rápida de iterar el mockup en Claude Code,
sin build step). Para WordPress esto tiene que pasar a clases reales
en el stylesheet del theme.

**Qué debería seguir siendo inline/dinámico:**
- Valores que vienen de un campo ACF (color de un badge, ancho de una
  barra de progreso calculado, etc.)
- Nada más — todo lo demás (padding, tipografía, colores fijos, grids)
  debería ser clase.

**Ya existen buenas candidatas a clase reutilizable** en `style.css`
que se pueden usar como base: `.card-flat`, `.card-sheen` (+ variantes
`.sheen-light/.sheen-dark/.sheen-service/.sheen-testimonial`),
`.tilt-card`, `.section-h2`, `.section-pad-x`, `.eyebrow-pill`,
`.btn-focus`, `.photo-wipe`/`.expert-name`/`.expert-role`. El theme
debería partir de estas, no reinventarlas.

## 2. Contenido repetido → CPT / ACF repeater, no HTML copiado

- [ ] Definir estructura de campos por tipo de contenido

Esto es lo que realmente justifica migrar a un CMS — que el cliente
pueda agregar/editar/sacar un item sin tocar código:

| Contenido | Cantidad actual | Dónde vive hoy |
|---|---|---|
| Servicios | 7 | `services.html`, tarjetas `.service-card` |
| Expertos (equipo) | 8 | `experts.html` + preview en home (`#experts-carousel`) |
| Testimonios | 3 | `#testimonials` en home |
| Partners/logos | ~9 | `#partners`, filas `.partner-row` |
| Speakers AviatDo 360° | 22 | `aviatdo-360-speakers.html` |
| Días del programa 360° | 3 | `aviatdo-360-program.html` |
| Tiers de precio (registro 360°) | 6 | `aviatdo-360-register.html` |

Cada fila de esta tabla = un CPT o un repeater field, con sus propios
campos (foto, nombre, rol, bio, redes, etc. para expertos/speakers;
nombre + logo + descripción para partners; etc.).

## 3. Bilingüe con Polylang, no dos archivos por página

- [ ] Migrar contenido a Polylang (posts enlazados EN↔ES)

Hoy cada página existe duplicada (`experts.html` / `experts-es.html`,
y así con las 20 páginas) y hay que mantenerlas sincronizadas a mano
— es la fuente más común de que una corrección se aplique en un
idioma y se olvide en el otro. Con Polylang pasa a ser una sola
plantilla con contenido traducido enlazado como post relacionado; la
duplicación de código desaparece, solo queda la traducción del
contenido en sí (y ahí sigue siendo trabajo humano/editorial, no
técnico).

## 4. Auditar el JS custom antes de reusarlo tal cual

- [ ] Decidir qué de `script.js` se porta, qué se simplifica

Todo es JS vanilla hecho a medida, sin dependencias. Antes de portarlo
al theme, revisar si convive bien con lo que WordPress/el theme
agregan (jQuery ya cargado por WP core, admin bar, un page builder si
lo hay):

- **Smooth-scroll de `#page-root`** (`position:fixed` + `transform` en
  desktop) — hace que `scrollIntoView`/`scrollTo` nativos se
  desincronicen del scroll visual. Es justo el tipo de cosa que rompe
  cuando algo externo (un plugin, el admin bar de WP) inserta
  elementos con sus propias asunciones de scroll. Evaluar si vale la
  pena mantenerlo o simplificar a scroll nativo + CSS `scroll-behavior`.
- **Sistema `.reveal`/`.hero-in`** — el gotcha documentado en
  `CLAUDE.md`: `.reveal` es scroll-driven (rompe si el elemento ya está
  visible al cargar, por eso existe `.hero-in` para hero/above-the-fold),
  y un `.reveal` no puede llevar directamente un hover-transform (el
  loop le pisa el `transform` inline 60 veces por segundo). Quien
  reconstruya esto en WP tiene que conocer esta regla o va a reintroducir
  el mismo bug.
- **Carrusel infinito de Our Experts** (`#experts-carousel`) — scroll
  manual con 3 copias del set + reset de `scrollLeft` por JS. Si en WP
  el contenido pasa a ser dinámico (loop de ACF/CPT), este script tiene
  que generar las 3 copias en PHP/template, no en HTML estático.
- **Booking modal** — ver punto 7.

## 5. Nav real de WordPress, no `aria-current` a mano

- [ ] Reemplazar por `wp_nav_menu()`

Hoy marco la página activa a mano en cada archivo con
`aria-current="page"` en el link correspondiente (arreglado el
2026-09-12 para que también funcione en el menú mobile — ver el commit
`86cf04b`/`95ab19a`). `wp_nav_menu()` de WordPress ya resuelve la
página activa automáticamente vía `current-menu-item` — el approach
manual no debería portarse, solo el resultado visual (el subrayado/
color rojo en la página activa).

## 6. Imágenes → Media Library

- [ ] Subir assets a la Media Library, usar `wp_get_attachment_image()`

Hoy las imágenes son archivos en `/images/` con rutas relativas fijas y
`width`/`height`/`loading="lazy"` puestos a mano en cada `<img>`. En WP
deberían vivir en la Media Library, servidas vía
`wp_get_attachment_image()` con `srcset` real generado por WordPress
(no un solo tamaño fijo como ahora).

## 7. Decidir el booking modal de una vez

- [ ] Definir: mockup visual como está, integración propia, o Calendly/similar

Está documentado como 100% mockup sin backend real (decisión explícita
tomada para esta etapa de diseño — ver `CLAUDE.md`, sección "Modal de
reserva"). La migración a WordPress es el momento de decidir si se
conecta a algo funcional o se mantiene así, no algo para post-postear
otra vez.

## 8. Estructura de URLs / jerarquía de páginas

- [ ] Definir permalinks antes de crear las páginas en WP

Las 6 páginas de AviatDo 360° hoy son archivos sueltos y planos
(`aviatdo-360-venue.html`, `aviatdo-360-speakers.html`, etc.) En WP
deberían ser páginas **hijas** de una página padre "AviatDo 360°":

```
/aviatdo-360/
/aviatdo-360/la-sede/          (venue)
/aviatdo-360/speakers/
/aviatdo-360/programa/
/aviatdo-360/registro/
/aviatdo-360/partner/
```

Definir esto ANTES de crear las páginas en WP evita tener que migrar
permalinks después.

## 9. Design tokens → `theme.json` o stylesheet del theme

- [ ] Portar los valores de `:root` en `style.css`

```
--obsidian:#000000        --on-obsidian:#ffffff
--paper-white:#ffffff     --sand-beige:#e2dfd8
--graphite:#5e5d5c        --brand-red:#CC242C
--muted:#6e6d6b           --hero-muted:rgba(255,255,255,0.82)
--divider:#d4d4d8         --cloud-gray:#e5e7eb
--font-display:'Inter'    --font-condensed:'Inter Tight'
--font-headline:'Barlow'
```

Si el theme es block theme (FSE), esto va a `theme.json` como paleta y
tipografía del editor — así el cliente no puede "salirse" de la
paleta de marca al editar contenido. Si es theme clásico/híbrido,
quedan como custom properties en el stylesheet igual que hoy.

Ver también [UI-UX-REGLAS.md](UI-UX-REGLAS.md) para el resto de las
convenciones (contraste, breakpoints, hover systems) que deberían
sobrevivir la migración, no perderse en la reconstrucción.

---

## 10. Cómo garantizar que WordPress quede igual al mockup

**Contexto:** lo va a armar un backend developer, en código, también
con Claude Code — sin constructor visual (Elementor/Divi/etc.). Es el
escenario de menor riesgo, PERO esa sesión de Claude Code va a arrancar
sin nada de lo que documentamos en esta sesión (los gotchas del
`.reveal`, el sistema de sheen, por qué el nav no tiene link de Home,
etc.). Si no se le pasa ese contexto, el riesgo real no es que
"no sepa programar" — es que reconstruya el diseño de memoria/a ojo en
vez de portar el código real, y ahí sí se pierde fidelidad justo en los
detalles que el cliente valoró en la reunión.

**Antes de escribir una sola línea del theme, esa sesión de Claude Code
debería:**

1. Tener este repo (`aviatdo-export`) disponible como referencia —
   idealmente clonado localmente junto al proyecto de WordPress, no
   solo mirado una vez.
2. Leer, en este orden: `CLAUDE.md` (mapa de secciones y convenciones
   base) → `UI-UX-REGLAS.md` (reglas de UI/UX + design tokens) →
   este archivo (`WORDPRESS-MIGRACION.md`).
3. Portar `style.css` y `script.js` como assets del theme casi sin
   reescribir — no "reinterpretar" el CSS, copiarlo y adaptarlo
   incrementalmente a medida que cada sección se convierte en template
   PHP. Reescribir desde cero es exactamente donde se pierde fidelidad.
4. Mantener el mockup actual (`die-ortiz.github.io/aviatdo-website/`)
   abierto como referencia visual mientras se construye cada página —
   no solo mirarlo al final.

**Checklist de aceptación, página por página**, antes de dar una
sección por migrada:

- [ ] Comparación visual lado a lado (mockup vs. WordPress) en desktop
      y mobile (375px)
- [ ] Hover de tarjetas de servicios (`.service-card`, fondo pasa a
      rojo) funciona igual
- [ ] Sheen sweep en hover (`.card-sheen`) presente en las tarjetas que
      lo tenían
- [ ] Tilt 3D en mousemove (`#services`, desktop con mouse) presente
- [ ] Animación de entrada por scroll (`.reveal`) funciona, y el hero
      de cada página carga sin quedarse en opacidad parcial
      (`.hero-in` — ver el bug real que tuvimos con esto el 2026-09-11)
- [ ] Hover de foto+nombre en Experts/Speakers (`.photo-wipe`,
      `.expert-name` a rojo) funciona
- [ ] Carrusel de Our Experts: scrolleable con el dedo/mouse, loop
      infinito en ambas direcciones, sin flechas, sin fade en los
      bordes
- [ ] Sub-nav de AviatDo 360° (tabs con subrayado rojo en la página
      activa) presente en las 6 páginas
- [ ] Nav principal: página activa resaltada en rojo, tanto desktop
      como en el menú mobile abierto
- [ ] Modal de booking abre/cierra igual (aunque su backend real se
      decida aparte — ver punto 7)
- [ ] Contraste de texto sobre foto (hero) legible — no volver a
      `--muted` gris sobre fondo oscuro (ver el fix del 2026-09-11)
- [ ] 0px de overflow horizontal en mobile (375px) en cada página
      migrada

Si en algún punto de la migración algo de esta lista queda descartado
a propósito (por tiempo, por decisión del cliente, etc.), anotarlo acá
mismo con la fecha — que sea una decisión explícita, no un olvido.

---

## 11. Pendiente — secciones que necesitan funcionalidad real, no solo portar el diseño

A diferencia de todo lo anterior (que es "llevar este HTML/CSS a WP
manteniendo el resultado"), estas secciones hoy son mockup estático y
van a necesitar diseño de backend real durante la migración — falta
definir el detalle (2026-09-12, marcado por Diego como "para trabajar
más adelante"):

- [ ] **Registro a la conferencia** (`aviatdo-360-register.html`) — hoy
      es una tabla de tarifas fija sin lógica. Necesita: alta/cobro de
      inscripciones, algún tipo de cupo o tier con disponibilidad
      ("Sale ended" ya existe como estado visual para un tier), y
      probablemente notificación/confirmación por email.
- [ ] **Webinars de AviatDo Talks** (`#talks` en home) — hoy es una
      única tarjeta estática ("Next session"). Necesita: listado
      dinámico de próximas/pasadas sesiones, registro de asistentes, y
      definir si el video/replay vive en el sitio o en un tercero
      (YouTube, Vimeo, Zoom Webinars, etc.).

Falta decidir alcance y herramienta para ambas (¿todo nativo en WP con
un CPT + formulario, o integrar algo externo tipo Eventbrite/Calendly/
Zoom?) antes de poder sumarlas al checklist de fidelidad del punto 10.
