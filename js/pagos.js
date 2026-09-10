/* ═══════════════════════════════════════════════════════════════
   Roller Shape Studio — pagos
   ESTE ES EL ÚNICO ARCHIVO QUE HAY QUE EDITAR PARA COBRAR EN LÍNEA.

   Cómo llenarlo:
   1. Entra a https://dashboard.stripe.com/payment-links
   2. Crea un Payment Link por cada opción de abajo, en MXN.
   3. En el link, activa Apple Pay y Google Pay (Settings → Payment methods).
      Apple Pay exige verificar el dominio: Stripe lo hace solo cuando el
      sitio corre en HTTPS con dominio propio.
   4. Pega la URL (https://buy.stripe.com/...) en el campo `link`.

   Mientras un `link` esté vacío, esa opción se marca como "en el estudio"
   y no se ofrece pago en línea. Si NINGUNA opción tiene link, el botón
   Reservar sigue yendo a Setmore como hasta ahora. Nunca queda un botón
   de pago que no lleve a ningún lado.

   Aquí NO va ninguna llave secreta. La llave secreta de Stripe (sk_live_…)
   nunca debe estar en un archivo que el navegador descargue: con ella se
   pueden emitir cobros y reembolsos. Los Payment Links son públicos por
   diseño; lo peor que alguien puede hacer con uno es pagarte.
═══════════════════════════════════════════════════════════════ */
window.RS_PAGOS = {

  /* A dónde volver después de pagar. Configúralo también en Stripe. */
  reservaUrl: 'https://rollershapestudiometepec.setmore.com/book',

  planes: {
    sencilla: {
      titulo: 'Sesión Sencilla',
      nota:   'The Roller o Cama Infrarrojo · 30 min',
      opciones: [
        { nombre: '1 Sesión',    precio: 600,   link: '' },
        { nombre: '3 Sesiones',  precio: 1500,  link: '' },
        { nombre: '5 Sesiones',  precio: 2250,  link: '' },
        { nombre: '10 Sesiones', precio: 3500,  link: '', destacar: 'Más elegido' },
        { nombre: '15 Sesiones', precio: 4950,  link: '' }
      ]
    },

    doble: {
      titulo: 'Sesión Doble',
      nota:   'Elige 2 de 4 aparatos · 60 min',
      opciones: [
        { nombre: '1 Sesión',    precio: 800,   link: '' },
        { nombre: '5 Sesiones',  precio: 3000,  link: '' },
        { nombre: '10 Sesiones', precio: 5500,  link: '', destacar: 'Más elegido' },
        { nombre: '15 Sesiones', precio: 6750,  link: '' }
      ]
    },

    membresias: {
      titulo: 'Membresías',
      nota:   'Mensualidades',
      opciones: [
        { nombre: 'Sencilla · 30 min', precio: 6000,  periodo: '/mes', link: '' },
        { nombre: 'Doble · 60 min',    precio: 8000,  periodo: '/mes', link: '' },
        { nombre: '6 Meses · Sencilla', precio: 36000, link: '' },
        { nombre: '6 Meses · Doble',    precio: 42000, link: '' }
      ]
    }
  }
};
