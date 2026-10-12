# Informe breve — prototipo (Entrega 2)

## Funciones terminadas

- Carga de asignación y tema configurables
- Cinco interacciones (botones, teclado y gestos con cámara)
- Gráfica 2D (área / arco) y sólido 3D (volúmenes / superficie)
- Resultados con fórmula, valor, unidades y notas
- Integral con signo vs área geométrica
- Autopruebas matemáticas (`npm run check:math`)
- Documentación de usuario y guion de exposición

## Errores / limitaciones conocidos

- El conteo de dedos depende de iluminación y estabilidad; por eso existe fallback 1–5
- Volumen en eje y usa capas; si la docente exige otro método para el problema asignado, se ajusta la fórmula en `js/math/volume.js`
- MediaPipe y Plotly requieren red (CDN)

## Pendiente hacia entrega final

- Sustituir la función de ejemplo por la asignada oficialmente
- Ensayar el guion con las tres integrantes
- Probar en demo los gestos 2/3/4 (lleno vs cascarón) ante la docente

## Ya incorporado tras feedback Entrega 2

- Foto del equipo + branding Areandina / docente Dellerlin Cepeda
- Franja de resultados con KaTeX y f(x) real
- Diferenciación visual 2–3 (sólido lleno) vs 4 (cascarón)

## Cambios vs diseño Entrega 1

- Se mantuvo HTML/CSS/JS + MediaPipe + Plotly
- Se añadió motor Simpson, panel de resultados y kit multi-tema

## IA utilizada

Ver `docs/REGISTRO-IA.md`
