# Pageflip Visor El Día

Visor de PDFs estilo "flipbook" para Diario El Día.

## Características
- React + Vite.
- Renderizado PDF con `react-pdf`.
- Animación flip con `react-pageflip`.
- Responsive (Móvil/Desktop).
- Herramientas: Zoom, Pan, Fullscreen, Download, Share.
- Deploy: `npx serve` o Nginx estático via `npm run build`.

## Desarrollo Local

1.  Clonar repo.
2.  `npm install`
3.  `npm run dev`

## Despliegue en Producción (srv.eldia.la)

El sitio productivo está vinculado a este repositorio en `/home/ubuntu/pageflip-visor-eldia`.

Para actualizar la versión en vivo:

```bash
ssh ubuntu@srv.eldia.la
cd ~/pageflip-visor-eldia
git pull origin main
npm install
npm run build
```

El directorio `dist/` es servido automáticamente por Nginx en `https://papeldigital.eldia.la`.
