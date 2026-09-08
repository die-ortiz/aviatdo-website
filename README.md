# AviatDo — Homepage

Mockup del homepage de AviatDo (consultoría de aviación B2B, LatAm), exportado como HTML/CSS/JS standalone — sin dependencias del editor de Claude Design.

**Sitio en vivo:** https://die-ortiz.github.io/aviatdo-website/ ([versión en español](https://die-ortiz.github.io/aviatdo-website/index-es.html))

## Archivos

- `index.html` — versión en inglés. Un único layout fluido responsive (desktop, tablet y mobile en el mismo archivo, con drawer de navegación por hamburguesa debajo de los 900px).
- `index-es.html` — versión en español, misma estructura que `index.html`. El switch EN/ES del header navega entre ambos.
- `style.css` — todo el CSS del sitio, compartido por `index.html` e `index-es.html` (un solo archivo, no hay estilos duplicados por idioma).
- `script.js` — todo el JavaScript, también compartido por ambos idiomas (scroll suave, animaciones on-scroll, contador de stats, carrusel de partners, parallax del hero y de AviatDo 360°, drawer mobile, etc. — vanilla JS, sin librerías externas ni build step). Los pocos textos que cambian por idioma (el contador de días para el evento, el aria-label del botón de menú) se resuelven en runtime leyendo `document.documentElement.lang`, así que no hace falta duplicar el script.
- `images/` — todos los assets (fotos de equipo, logos de partners, fondos, logo de AviatDo), incluyendo variantes `-mobile` de las imágenes de fondo más pesadas para los breakpoints chicos.

Los dos HTML siguen abriendo directo en el navegador sin servidor ni build step — solo que ahora referencian `style.css`/`script.js` en vez de tenerlo todo inline.

## Fuentes

Cargan desde Google Fonts vía `<link>` en el `<head>` de cada archivo:

- **Inter** — body / texto general.
- **Inter Tight** — labels, botones, eyebrows (uppercase pequeño).
- **Barlow** — headlines (H1, H2) y números grandes (stats, fechas del evento).

Si el proyecto no tiene acceso a internet en build/dev, van a hacer falta local o self-hosted.

## Publicación

El repo se publica con GitHub Pages directo desde la rama `main` (carpeta raíz) — cualquier push a `main` actualiza el sitio en vivo en uno o dos minutos. No hay build step: los HTML se sirven tal cual están.

## Próximos pasos sugeridos

- El formulario de contacto no tiene lógica de envío — falta conectarlo a un backend/servicio de email.
- Los textos de partners, equipo y testimonios son de ejemplo — reemplazar por contenido real antes de publicar.
- Los links de LinkedIn y email de la sección "Our team" son placeholders (`#`) — completar con las URLs/emails reales de cada experto.
- Si el objetivo final es un sitio con más de una página (About, AviatDo 360°, Talks, Resources, etc. — ver alcance contratado), conviene migrar esto a un framework con componentes (React/Next, Astro, o similar) en vez de seguir agregando páginas HTML sueltas.
