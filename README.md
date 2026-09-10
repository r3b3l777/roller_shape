# Roller Shape Studio · Metepec

Sitio web de Roller Shape Studio — wellness corporal con tecnología avanzada en
Plaza Árbol de la Vida, Metepec, Estado de México.

Sitio estático: HTML, CSS y JavaScript sin dependencias ni build. Se publica
subiendo la carpeta tal cual.

## Estructura

```
index.html          Markup
css/styles.css      Estilos y capa adaptativa
css/noscript.css    Respaldo cuando el JS está desactivado
js/app.js           Loader, menú móvil, reveals, carrusel de equipos
img/                Fotos en WebP + favicons
```

Las rutas son relativas, así que funciona abriendo `index.html` directamente o
detrás de cualquier servidor estático. Hay que subir la estructura completa: sin
`css/`, `js/` o `img/` el sitio se ve sin estilos ni fotos.

## Compatibilidad

Diseñado y verificado para iOS, Android, macOS y Windows:

- Responsive de 320 px a escritorio, sin scroll horizontal en ningún ancho
- Áreas táctiles de 44×44 px mínimo en pantallas táctiles
- Respeta `prefers-reduced-motion`
- Navegable por teclado, con foco visible
- Degrada a HTML legible si el JavaScript falla o está desactivado

## Desarrollo

```bash
python3 -m http.server 8080
```

Y abrir http://localhost:8080
