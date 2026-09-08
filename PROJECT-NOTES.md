# AviatDo — notas técnicas del proyecto

Léeme primero, antes de abrir `index.html` / `index-es.html` completos. El
objetivo es ubicar la sección correcta con `grep`/`sed` y editar solo esa
porción, sin cargar los ~140KB completos de cada archivo.

## Qué es esto

Mockup del homepage de AviatDo (consultoría de aviación B2B para
aerolíneas/aeropuertos/reguladores en LatAm), para iCorporate Lab. Es un sitio
estático de una sola página, en dos idiomas (`index.html` EN / `index-es.html`
ES), pensado como demo/mockup — no como el sitio final (ver sección
"Decisiones pendientes" abajo).

## Archivos

- `index.html` / `index-es.html` — markup, ~139-140KB c/u. Estructuralmente
  casi idénticos entre sí (mismo orden de secciones); difieren en el texto
  traducido y en un par de strings que el JS resuelve en runtime
  (`document.documentElement.lang === 'es'`).
- `style.css` — CSS compartido por ambos HTML (single source, ya no está
  duplicado inline).
- `script.js` — JS compartido por ambos HTML, mismo trato.
- `images/` — assets.
- `README.md` — descripción orientada al cliente/repo (setup, publicación).
  Este archivo (`PROJECT-NOTES.md`) es el complemento técnico para trabajar
  rápido, no reemplaza al README.

## Mapa de secciones (por `id`, no por número de línea — las líneas se
mueven con cada edit)

Para ubicar una sección: `grep -n '<section id=' index.html`. Los ids son
los mismos en `index-es.html`:

- `#hero`
- `#stats`
- `#services` — tarjetas de servicios, clase `.service-card` (hover:
  fondo pasa a `--brand-red`, sombra, texto/icono a blanco).
- `#why-aviatdo`
- `#experts` — "Our team". Cada experto tiene íconos LinkedIn + email
  (`.social-icon`, 36px inline, ver "Convenciones" abajo).
- `#aviatdo-360` — sección con parallax (`.s360-bg` / `.s360-parallax`).
- `#talks`
- `#partners`
- `#testimonials` — "What clients say", 3 tarjetas. Estructura en dos
  niveles (ver gotcha del reveal loop, abajo).
- `#contact` — footer/cierre oscuro.

Para saltar directo a una sección sin abrir todo el archivo:
`sed -n '/id="testimonials"/,/<\/section>/p' index.html | head -100`

## Design tokens (`:root` en `style.css`)

```
--obsidian:#000000       --on-obsidian:#ffffff
--paper-white:#ffffff    --sand-beige:#e2dfd8
--graphite:#5e5d5c       --brand-red:#CC242C
--muted:#9ca3af          --divider:#d4d4d8
--cloud-gray:#e5e7eb
--gradient: linear-gradient(90deg,#00c6c6...#a162ff)  (barra multicolor de marca)
--font-display:'Inter'          (texto general)
--font-condensed:'Inter Tight'  (headings/labels/eyebrows)
--font-headline:'Barlow'
```

## Convenciones establecidas

- **Sistema de shine/sheen en hover** (`.card-sheen` + `::after` con barrido
  diagonal, `@keyframes sheenSweep`): variantes por contexto —
  `.sheen-light` (blanco, para tarjetas obsidian/oscuras), `.sheen-dark`
  (graphite, para tarjetas blancas genéricas), `.sheen-service` (rojo tenue,
  tarjetas de servicios), `.sheen-testimonial` (gris claro, testimonios).
  Antes de crear una variante nueva, revisar si alguna de estas ya sirve.
- **Hover "grow" en tarjetas** — dos variantes, mismo resultado (~3% de
  escala): en `#testimonials`, CSS puro (`.testi-card:hover{transform:
  scale(1.03); box-shadow:...}`); en `#services`, ya existía un tilt 3D por
  JS en mousemove (`.tilt-card`, listener en `script.js`) que incluye
  `scale3d(1.03,1.03,1.03)` — se aumentó desde 1.015 para igualar la
  magnitud de testimonials. Ambas dependían del mismo fix de estructura de
  abajo para funcionar. Ver gotcha del reveal loop antes de aplicar este
  patrón a una tarjeta nueva.
- **Iconos sociales** (`.social-icon`): 44px por defecto vía clase; en
  `#experts` se usa override inline `style="width:36px;height:36px"` con
  `<svg width="15" height="15">` explícito — tamaño elegido tras iterar con
  el cliente (44px "quedó grande", 32px "casi no se ve"). No cambiar sin
  motivo.
- **`prefers-reduced-motion`**: hay un bloque `@media` dedicado en
  `style.css` que anula transiciones/transforms de `.magnetic`, `.tilt-card`,
  `.testi-card`, `.card-sheen::after`, `.reveal`, etc. Cualquier efecto de
  hover/animación nuevo debe sumarse ahí también.

## Gotcha importante: el loop de `.reveal` pisa `transform` inline

`script.js` tiene un loop de scroll-reveal (`frameCallbacks.push(update)`,
línea ~235) que corre en cada frame **para siempre** (no solo durante la
entrada), y hace:

```js
item.el.style.transform = progress >= 1 ? 'none' : translate;
```

sobre cada elemento `.reveal` (selector: `.reveal:not(.reveal-no-fade)`,
línea ~168). Un `transform` inline gana siempre sobre cualquier regla CSS
`:hover{transform:...}` en ese mismo elemento — y el JS lo re-aplica 60
veces por segundo, así que un hover-transform puesto directo en un elemento
con clase `.reveal` **nunca va a funcionar**.

**Patrón de solución** (usado en `#testimonials`, replicable a cualquier
tarjeta nueva con hover-transform): separar en dos niveles —

```html
<div class="reveal">                         <!-- wrapper, sin estilo visual,
                                                    el JS lo toca a él -->
  <div class="card-flat ... testi-card" style="...height:100%;">
    <!-- contenido + la clase con :hover{transform:...} va acá -->
  </div>
</div>
```

El loop solo consulta `.reveal`, nunca toca hijos anidados, así que el
`:hover` del div interno queda libre.

Ya aplicado en `#testimonials` (3 tarjetas) y `#services` (las 8 tarjetas de
la grilla, incluida la CTA negra "Not sure which service fits..."). El fix
en `#services` además destrabó el tilt 3D por mousemove, que estaba
silenciosamente roto por este mismo motivo desde antes.

## Flujo de publicación

- Repo: `github.com/die-ortiz/aviatdo-website` (público, GitHub Pages activo
  en `main` / `/`).
- Live URL: `die-ortiz.github.io/aviatdo-website/`
- Diego pidió que **cada cambio se suba (commit + push) automáticamente**,
  sin esperar confirmación previa.
- Flujo típico tras un cambio: copiar `index.html`/`index-es.html`/
  `style.css`/`script.js` (los que cambiaron) a `/mnt/user-data/outputs/` →
  `SendUserFile` → `device_commit_files` a
  `~/mnt/code/aviatdo-export/` en la Mac de Diego → `device_bash` con
  `export PATH="$HOME/.localbin:$PATH"` para `git add -A && git commit -m
  "..." && git push origin main`.
- Si `git commit` falla por locks (`index.lock`, `tmp_obj_*`) es porque la
  carpeta montada no permite `rm` por defecto — pedir permiso con
  `device_request_delete_permission` sobre la raíz de la carpeta conectada,
  no una subcarpeta.

## Verificación antes de shippear (patrón Playwright)

Chromium en `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, navegar a
`file:///home/claude/aviatdo-export/index.html`, esperar 800-2500ms (las
animaciones de reveal por scroll necesitan ese tiempo), chequear
`document.documentElement.scrollWidth - clientWidth` para overflow
horizontal, usar `page.mouse.move()` + `boundingBox()` para probar estados
de hover, screenshot antes de dar por terminado.

## Modal de reserva (booking)

El botón del hero "Book a consultation" / "Agendar una consulta"
(`#book-consultation-btn`) abre un modal de calendario mockup — sin
backend real, es 100% visual (elección explícita de Diego, frente a un
embed funcional tipo Calendly). Markup: `#booking-overlay` en ambos
HTML, como **hermano de `#page-root`** (no anidado adentro) — a
propósito, porque `#page-root` lleva el `transform` del smooth-scroll
en desktop y un `position:fixed` anidado ahí quedaría fijo relativo a
ese transform, no al viewport real. CSS en `style.css` (busca
`#booking-overlay`), lógica en `script.js` (busca `Booking modal`,
cerca del final de `componentDidMount`) — un solo bloque JS sirve a
los dos idiomas vía el mismo `isES` que usa el resto del archivo.

Convención si se agrega otro modal/overlay nuevo: mismo patrón —
markup como hermano de `#page-root`, no dentro.

Suma un selector de especialista (`#booking-expert-select`) arriba del
calendario — un dropdown custom (un `<select>` nativo no puede llevar
foto), armado 100% por JS desde un array `EXPERTS` en `script.js` (los
mismos 4 expertos del preview de `#experts`, único set con foto/bio
disponible). Confirmar ahora exige especialista + fecha + hora.

## Decisiones pendientes / en pausa

- Migración a WordPress (sitio completo, multi-página, autoadministrable
  por el cliente) — **pausada**, Diego la va a consultar con su jefe. No
  retomar sin que él lo pida de nuevo.
- Reemplazo de ACF Pro por Custom Post Types nativos + ACF free, y Polylang
  (free) para EN/ES — decidido en principio, pendiente de la conversación
  de arriba.
