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
js/pagos.js         ← lo único que hay que editar para cobrar en línea
js/app.js           Loader, menú, reveals, carril, hoja de pago y de reserva
img/                Fotos en WebP + favicons
vercel.json         Cabeceras de seguridad (Vercel)
_headers            Las mismas, para Netlify o Cloudflare Pages
```

## Cobrar en línea

`js/pagos.js` trae los 13 paquetes con sus precios y un campo `link` vacío
en cada uno. Para activar el cobro:

1. Crea un Payment Link por paquete en
   [dashboard.stripe.com/payment-links](https://dashboard.stripe.com/payment-links),
   en MXN.
2. Activa Apple Pay y Google Pay en Settings → Payment methods. Apple Pay
   exige verificar el dominio; Stripe lo hace solo si el sitio corre en
   HTTPS con dominio propio.
3. Pega cada URL `https://buy.stripe.com/…` en su campo `link`.

Mientras un `link` esté vacío, esa opción se muestra como "se paga en el
studio". Si un paquete completo no tiene ningún link, su botón Reservar
sigue yendo a la agenda, como antes. Nunca queda un botón de pago que no
lleve a ningún lado.

**Aquí no va ninguna llave secreta.** La `sk_live_…` de Stripe jamás debe
estar en un archivo que el navegador descargue: con ella se pueden emitir
cobros y reembolsos. Los Payment Links son públicos por diseño; lo peor que
alguien puede hacer con uno es pagarte.

Ningún campo de tarjeta vive en este sitio. Los datos van del navegador a
Stripe sin pasar por aquí, así que no hay nada que filtrar ni que almacenar.

## Seguridad

Las cabeceras están en `vercel.json` y `_headers`, y hay una CSP de
respaldo en un `<meta>` de `index.html` por si el host no lee ninguno de
los dos. Cubren CSP, HSTS, `nosniff`, `X-Frame-Options`, Referrer-Policy y
Permissions-Policy.

La CSP no permite scripts inline: si algún día hace falta un `<script>`
dentro del HTML o un `onclick=`, no se ejecutará. Es a propósito — es lo
que convierte un XSS en un error de consola en vez de en una fuga.
Cualquier dominio nuevo (analítica, chat, pixel) hay que añadirlo a mano
en los tres archivos.

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
