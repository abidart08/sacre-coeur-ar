# El Secreto del Sacré Coeur — Búsqueda del Tesoro AR

Experiencia web de realidad aumentada basada en marcadores para una búsqueda del tesoro en el Edificio Sacré Coeur.

## Funcionalidades

- 3 marcadores AR diferentes.
- Recorrido secuencial: inicio → Aula Magna → banco del patio central exterior.
- Elementos 3D distintos: brújula, llave y cofre.
- Eventos `markerFound` / `markerLost`.
- Bloqueo del orden de las pistas.
- Progreso persistente con `localStorage`.
- Cronómetro, sonido, vibración y confeti final.
- Página de marcadores lista para imprimir.
- Modo de prueba con `?debug=1`.
- Verificación automática end-to-end con Playwright + Chromium.

## Tecnologías

- A-Frame 1.8.0
- AR.js 3.4.8
- HTML5, CSS3 y JavaScript ES6
- GitHub Actions para verificación
- Sin backend ni base de datos

## Estructura

```text
/
├── index.html
├── game.js
├── styles.css
├── markers-data.js
├── markers.html
├── TESTING.md
├── package.json
├── playwright.config.js
├── tests/
│   └── e2e.spec.js
├── .github/
│   └── workflows/
│       └── verify.yml
└── .nojekyll
```

`markers-data.js` es la única fuente de verdad de los tres patrones. Desde esas matrices se generan los patrones que consume AR.js y los marcadores imprimibles de `markers.html`.

## Pruebas automáticas

En cada push a `main`, GitHub Actions:

1. Levanta el proyecto con un servidor HTTP local.
2. Abre Chromium con cámara simulada.
3. Comprueba que A-Frame y el componente AR.js inicializan.
4. Verifica que los 3 patrones se asignan a sus marcadores.
5. Simula eventos reales `markerFound`.
6. Comprueba el bloqueo del orden 1 → 2 → 3.
7. Completa el juego y verifica el código `SACRE-AR-2026`.
8. Recarga y comprueba la persistencia.
9. Renderiza los tres marcadores imprimibles.

## Publicación

Para la entrega se requiere una URL HTTPS accesible desde los celulares de los beta testers. Si se usa GitHub Pages, el repositorio debe estar en una modalidad que permita Pages. Una vez habilitado:

**Settings → Pages → Deploy from a branch → `main` → `/ (root)`**

La URL esperada será:

```text
https://abidart08.github.io/sacre-coeur-ar/
```

Marcadores:

```text
https://abidart08.github.io/sacre-coeur-ar/markers.html
```

## Nota sobre la prueba física

La automatización valida código, carga de AR.js, eventos, patrones y recorrido. La robustez del reconocimiento físico depende también de cámara, iluminación, enfoque, tamaño de impresión y reflejos; por eso se recomienda imprimir sin plastificado brillante y mantener visible todo el borde negro.
