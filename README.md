# AviatDo — Homepage (Speedrun)

Mockup del homepage de AviatDo (consultoría de aviación B2B, LatAm), exportado como HTML/CSS/JS standalone — sin dependencias del editor de Claude Design.

## Archivos

- `index.html` — versión desktop (diseñada a 1440px, con breakpoints propios para tablet).
- `mobile.html` — versión mobile (Dirección C, diseñada a 390px).
- `images/` — todos los assets (fotos de equipo, logos de partners, fondos, logo de AviatDo).

Ambos archivos son autocontenidos: abrí cualquiera de los dos directo en el navegador y funciona (scroll suave, animaciones on-scroll, contador de stats, carrusel de partners, parallax del hero, etc. — todo vanilla JS, sin librerías externas).

## Fuentes

Cargan desde Google Fonts vía `<link>` en el `<head>` de cada archivo:

- **Inter** — body / texto general.
- **Inter Tight** — labels, botones, eyebrows (uppercase pequeño).
- **Barlow** — headlines (H1, H2) y números grandes (stats, "01/02/03").

Si el proyecto no tiene acceso a internet en build/dev, van a hacer falta local o self-hosted.

## Próximos pasos sugeridos para Claude Code

- Estos dos HTML son mockups estáticos (sin backend, sin build system). Si el objetivo es un sitio real, conviene migrarlos a components (React/Next, Astro, lo que uses) y armar el breakpoint mobile como parte del mismo layout responsive en vez de dos archivos separados.
- El formulario de contacto no tiene lógica de envío — falta conectarlo a un backend/servicio de email.
- Los textos de partners, equipo y testimonios son de ejemplo — reemplazar por contenido real antes de publicar.
