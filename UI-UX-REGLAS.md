# Reglas de CSS / UI / UX — Referencia

Dos partes: **(1)** un checklist general de buenas prácticas de UI/UX/CSS
válido para cualquier proyecto, y **(2)** cómo se aplican concretamente en
el sitio de AviatDo — tokens, componentes y gotchas ya resueltos en este
código. Pensado para consultar rápido, no para leer de punta a punta.

---

## Parte 1 — Reglas generales de UI/UX/CSS

Organizado por prioridad de impacto. Fuente: base de conocimiento del
skill `ui-ux-pro-max` (119 lineamientos).

### 1. Accesibilidad (CRÍTICO)

- **Contraste de color**: mínimo 4.5:1 para texto normal, 3:1 para texto
  grande (≥18px bold o ≥24px regular).
- **Estados de foco visibles**: outline de 2-4px en todo elemento
  interactivo. Nunca `outline:none` sin un reemplazo visible.
- **Alt text** descriptivo en imágenes con significado; `alt=""` solo en
  decorativas.
- **aria-label** en botones de solo-ícono.
- Los íconos decorativos junto a texto visible deben ocultarse del árbol
  de accesibilidad (`aria-hidden="true"`); los íconos funcionales
  necesitan alternativa textual.
- **Navegación por teclado**: el orden de tab debe coincidir con el
  orden visual; soporte completo de teclado.
- **Jerarquía de headings** secuencial (h1→h6), sin saltos de nivel.
- **No usar solo color** para transmitir información (agregar ícono o
  texto también).
- Respetar `prefers-reduced-motion`.
- Los targets táctiles en foco/overlay (banners, sticky UI) no deben
  tapar el control enfocado (WCAG 2.2 AA).
- **Target size web**: 24×24px CSS mínimo o excepción documentada (WCAG
  2.2 AA) — no confundir con las guías nativas de 44pt/48dp.

### 2. Touch & interacción (CRÍTICO)

- **Tamaño mínimo de touch target**: 44×44pt (Apple) / 48×48dp
  (Material) — extender el área de toque más allá del límite visual si
  hace falta.
- **Espaciado mínimo entre targets**: 8px.
- No depender solo de `:hover` para interacciones primarias (no existe
  en touch).
- Botones deshabilitados durante operaciones async, con spinner/progreso.
- `cursor:pointer` en todo elemento clickeable.
- Evitar swipe horizontal en contenido principal; preferir scroll
  vertical.
- `touch-action: manipulation` para reducir el delay de 300ms en mobile.
- Feedback visual inmediato al presionar (ripple, highlight).
- No bloquear gestos del sistema (back-swipe, Control Center, etc.).

### 3. Performance (ALTO)

- Imágenes en WebP/AVIF, `srcset`/`sizes` responsive, `loading="lazy"`
  en todo lo que esté debajo del fold.
- Declarar `width`/`height` o `aspect-ratio` para evitar layout shift
  (CLS).
- `font-display: swap` para evitar texto invisible mientras carga la
  fuente.
- Reservar espacio para contenido async (evitar que el layout "salte").
- Debounce/throttle en eventos de alta frecuencia (scroll, resize,
  input).
- Virtualizar listas de 50+ items.

### 4. Selección de estilo (ALTO)

- Consistencia de estilo en todas las páginas del sitio.
- Íconos SVG (Heroicons, Lucide, etc.), nunca emojis como ícono
  funcional.
- Paleta de color coherente con el tipo de producto/industria.
- Sombras, blur y radios de borde alineados a un mismo lenguaje visual
  (no mezclar flat con skeuomorphic al azar).
- Un único CTA primario por pantalla/sección; las acciones secundarias
  visualmente subordinadas.

### 5. Layout & responsive (ALTO)

- `<meta name="viewport" content="width=device-width, initial-scale=1">`
  — nunca deshabilitar el zoom.
- Diseñar mobile-first, escalar hacia tablet/desktop.
- Breakpoints sistemáticos y consistentes (ej. 375 / 768 / 1024 / 1440).
- Texto de cuerpo mínimo 16px en mobile (evita el auto-zoom de iOS en
  inputs).
- Line-length: 35-60 caracteres en mobile, 60-75 en desktop.
- **Cero scroll horizontal** en mobile — el contenido debe entrar en el
  ancho del viewport.
- Escala de espaciado incremental (4pt/8dp).
- `max-width` consistente en contenedores de desktop.
- Escala de z-index definida (0/10/20/40/100/1000), no valores sueltos.

### 6. Tipografía & color (MEDIO)

- `line-height` 1.5–1.75 en texto de cuerpo.
- Escala tipográfica consistente (ej. 12/14/16/18/24/32).
- Texto oscuro sobre fondo claro (nunca gris sobre gris).
- Tokens de color semánticos (`primary`, `error`, `surface`...), no hex
  crudo repetido en cada componente.
- Pares foreground/background deben cumplir 4.5:1 (AA) o 7:1 (AAA).
- Preferir el wrap de texto sobre el truncamiento; si se trunca, usar
  ellipsis + acceso al texto completo (tooltip/expand).
- Cifras tabulares (`font-variant-numeric: tabular-nums`) en columnas de
  datos, precios o timers.

### 7. Animación (MEDIO)

- Transform/opacity únicamente para animar — nunca `width`/`height`/
  `top`/`left` (causa reflow).
- Máximo 1-2 elementos animados por vista a la vez.
- Toda animación debe expresar una relación causa-efecto, no ser
  decorativa porque sí.
- Las animaciones deben poder interrumpirse; nunca bloquear el input
  del usuario mientras corren.
- Fade que no llega a opacity 1 se ve como un bug — o el elemento queda
  completamente visible o completamente oculto, nunca a medio camino
  permanentemente.

### 8. Formularios & feedback (MEDIO)

- Label visible por input (nunca solo placeholder).
- Error específico debajo del campo, conectado con `aria-describedby`.
- Loading → success/error state en cada submit.
- Validar en blur, no en cada tecla.
- Tipo de input semántico (`email`, `tel`, `number`) para el teclado
  mobile correcto.
- El mensaje de error debe indicar causa + cómo solucionarlo (no solo
  "Invalid input").
- Con múltiples errores tras un submit fallido: foco al resumen de
  errores; sin resumen, foco al primer campo inválido.

### 9. Navegación (ALTO)

- Ubicación de la navegación consistente en todas las páginas.
- El destino actual debe estar visualmente resaltado en la navegación.
- Back/atrás predecible; preservar scroll y estado.
- Breadcrumbs en jerarquías de 3+ niveles.
- No mezclar patrones de navegación (tabs + sidebar + bottom nav) en el
  mismo nivel de jerarquía.

### 10. Gráficos & datos (BAJO)

- Tipo de gráfico según el dato (tendencia→línea, comparación→barra,
  proporción→pie/donut, evitar pie con más de 5 categorías).
- Siempre con leyenda visible y tooltips con el valor exacto.
- No usar solo color para diferenciar series (agregar patrón/textura
  para daltónicos).
- Alternativa en tabla para accesibilidad.

---

## Parte 2 — Cómo se aplica en AviatDo

### Design tokens (`:root` en `style.css`)

```css
--obsidian:#000000        --on-obsidian:#ffffff
--paper-white:#ffffff     --sand-beige:#e2dfd8
--graphite:#5e5d5c        --brand-red:#CC242C
--muted:#6e6d6b           --divider:#d4d4d8
--cloud-gray:#e5e7eb
--gradient: linear-gradient(90deg,#00c6c6...#a162ff)
--font-display:'Inter'           /* texto general */
--font-condensed:'Inter Tight'   /* headings/labels/eyebrows */
--font-headline:'Barlow'         /* números grandes, hero */
```

> **`--muted` fue corregido** (auditoría del 2026-09-11): el valor
> original `#9ca3af` daba un contraste de 2.5:1 sobre blanco — no
> pasaba WCAG AA. Se cambió a `#6e6d6b` (5.2:1). Si en algún momento se
> necesita un gris "casi invisible" de verdad (placeholder, estado
> deshabilitado), usarlo puntualmente ahí — no bajarle el contraste al
> token global, porque se reusa como color de texto de cuerpo en las 20
> páginas del sitio.

### Breakpoints usados

- `1080px` — ajustes puntuales (poco usado).
- `900px` — punto donde el nav pasa a menú hamburguesa (drawer).
- `767px` — breakpoint "mobile" principal: acá vive la mayoría de los
  reflows (grids a 1 columna, tipografía más chica, `.section-pad-x`).
- `640px` — ajustes puntuales.

Para una sección/grid nueva, el patrón esperado es: diseñar para
desktop primero, agregar overrides puntuales a 900px si el nav lo
requiere, y resolver el apilado real a 767px.

### Padding lateral responsive: `.section-pad-x`

Toda `<section>` de contenido (y la tira de sub-nav de AviatDo 360°)
debe llevar `class="section-pad-x"` si su padding lateral está fijado
en px (ej. `padding:96px 40px`). Sin esa clase, el padding no se reduce
en mobile:

```css
@media (max-width:900px){ .section-pad-x{ padding-left/right:24px !important; } }
@media (max-width:767px){ .section-pad-x{ padding-left/right:20px !important; } }
```

Bug real encontrado y corregido: las 12 páginas de AviatDo 360° se
armaron sin esta clase en sus secciones, y el padding de 40px nunca
bajaba en mobile.

### Apilado de grids en mobile

Convención: dar al contenedor grid un `id` único (o clase compartida si
hay más de una instancia), y agregar dentro de
`@media (max-width:767px)`:

```css
#mi-grid-nuevo{ grid-template-columns:1fr !important; }
```

Ejemplos ya resueltos: `#stats` (a 2 columnas), `#s360-tracks-grid`,
`#s360-topics-grid`, `#s360-audience-grid`, `#s360-venue-intro`,
`#s360-hotel-steps-grid`, `#s360-goodtoknow-grid`,
`#s360-why-partner-grid`, `.s360-day-card`.

**Ojo con palabras sueltas sin espacio** dentro de un grid item con
`minmax(0,1fr)`: si el texto no puede hacer wrap (una sola palabra,
ej. "Americas"), desborda la columna y genera scroll horizontal
invisible-a-simple-vista. Fix aplicado en `#stats`:

```css
.num-xl{ overflow-wrap:break-word; }
#stats > div:last-child .num-xl{ font-size:28px; } /* achicar en vez de partir la palabra */
```

### Sistema de reveal / animación de entrada — el gotcha más importante

`script.js` corre un loop de scroll-reveal que sobrescribe
`style.transform` en cada frame, **para siempre**, sobre todo elemento
`.reveal`. Un `transform` inline gana siempre sobre cualquier
`:hover{transform:...}` CSS en ese mismo elemento.

**Regla: nunca poner la clase `.reveal` en el mismo nodo que lleva un
hover-transform.** Separar siempre en dos niveles:

```html
<div class="reveal">                          <!-- el JS solo toca este -->
  <div class="card-flat tilt-card service-card ...">   <!-- el hover va acá -->
    ...
  </div>
</div>
```

**Segundo gotcha relacionado**: `.reveal` calcula su opacidad según la
posición de scroll. Un elemento que arranca ya visible al cargar la
página (ej. el hero) nunca dispara un evento de scroll, así que su
opacidad se queda trabada en un valor intermedio. Para cualquier cosa
que viva en la primera pantalla (hero), usar `.hero-in` en vez de
`.reveal` — es una animación por tiempo (`@keyframes`), no por scroll:

```html
<h1 class="hero-in d1">...</h1>   <!-- d1-d4 controlan animation-delay -->
```

### Sistema de hover "sheen" (brillo diagonal en hover)

`.card-sheen` + `::after` con barrido diagonal (`@keyframes
sheenSweep`). Variantes por contexto — revisar si alguna sirve antes de
crear una nueva:

- `.sheen-light` — blanco, tarjetas oscuras/obsidian.
- `.sheen-dark` — graphite, tarjetas blancas genéricas.
- `.sheen-service` — rojo tenue, tarjetas de servicios.
- `.sheen-testimonial` — gris claro, testimonios.

### Hover "grow" (~3% de escala)

Dos implementaciones, mismo resultado:
- `#testimonials`: CSS puro, `.testi-card:hover{ transform:scale(1.03); }`.
- `#services`: tilt 3D por JS en mousemove, `.tilt-card`, incluye
  `scale3d(1.03,1.03,1.03)`.

Ambas dependen del fix de estructura de dos niveles de arriba.

### Hover de foto + nombre (`.photo-wipe` / `.expert-name` / `.expert-role`)

Usado en `#experts` (home) y reutilizado, con selectores scoped por id,
en `#s360-speakers-grid`. Al hacer hover sobre la tarjeta: la foto sube
y escala, el nombre pasa a rojo y escala, el rol escala un poco menos.
Para agregar esto a una grilla nueva, copiar el bloque de reglas
scoped al `id` de esa grilla (no reusar el selector `#experts`
directamente).

### `.service-card:hover` (tarjetas de Servicios)

Fondo pasa a `--brand-red`, texto/ícono a blanco:
`.service-card:hover`, `:hover h3`, `:hover svg`, `:hover .service-desc`
(requiere `class="service-desc"` en el párrafo).

### Iconos sociales (`.social-icon`)

44px por defecto; en `#experts` se usa 36px inline
(`style="width:36px;height:36px"`) — decisión ya iterada con el
cliente (44px "quedó grande", 32px "casi no se ve"). No cambiar sin
motivo — es más chico que el ideal de accesibilidad (44px) pero es un
trade-off consciente, no un descuido.

### `prefers-reduced-motion`

Hay un bloque `@media` dedicado que anula transiciones/transforms de
`.magnetic`, `.tilt-card`, `.testi-card`, `.card-sheen::after`,
`.reveal`, `.hero-in`, `#experts .photo-wipe`, etc. **Todo efecto de
hover/animación nuevo debe sumarse ahí también** — es fácil olvidarlo.

### Modal de booking (`#booking-overlay`)

Markup como **hermano de `#page-root`**, nunca anidado adentro —
`#page-root` lleva el `transform` del smooth-scroll en desktop, y un
`position:fixed` anidado ahí quedaría fijo relativo a ese transform, no
al viewport real. Cualquier modal/overlay nuevo debe seguir el mismo
patrón.

### Checklist rápido antes de dar por terminada una sección nueva

1. ¿Las secciones de contenido tienen `class="section-pad-x"`?
2. ¿Cada grid multi-columna tiene un `id`/clase con su override a
   `1fr` en `@media (max-width:767px)`?
3. ¿Hay alguna palabra suelta sin espacio dentro de una columna angosta
   que pueda desbordar? (`overflow-wrap:break-word` como red de
   seguridad).
4. ¿El elemento con hover-transform está en un nivel separado del
   `.reveal`?
5. ¿Todo lo que vive en la primera pantalla usa `.hero-in`, no
   `.reveal`?
6. ¿Todo texto de cuerpo usa `--graphite` o un color con ≥4.5:1 sobre
   su fondo — no `--muted` a la ligera?
7. ¿El nuevo efecto de hover/animación está también cubierto en el
   bloque `prefers-reduced-motion`?
8. Verificar `document.documentElement.scrollWidth - clientWidth === 0`
   en viewport mobile real (375px) antes de dar por cerrado.
