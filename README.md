# AviatDo — Homepage

Mockup del homepage de AviatDo (consultoría de aviación B2B, LatAm), exportado como HTML/CSS/JS standalone — sin dependencias del editor de Claude Design.

**Sitio en vivo:** https://die-ortiz.github.io/aviatdo-website/ ([versión en español](https://die-ortiz.github.io/aviatdo-website/index-es.html))

## Archivos

- `index.html` — versión en inglés. Un único layout fluido responsive (desktop, tablet y mobile en el mismo archivo, con drawer de navegación por hamburguesa debajo de los 900px).
- `index-es.html` — versión en español, misma estructura que `index.html`. El switch EN/ES del header navega entre ambos.
- `images/` — todos los assets (fotos de equipo, logos de partners, fondos, logo de AviatDo), incluyendo variantes `-mobile` de las imágenes de fondo más pesadas para los breakpoints chicos.

Ambos archivos son autocontenidos: abrí cualquiera de los dos directo en el navegador y funciona (scroll suave, animaciones on-scroll, contador de stats, carrusel de partners, parallax del hero y de AviatDo 360°, drawer mobile, etc. — todo vanilla JS, sin librerías externas ni build step).

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
