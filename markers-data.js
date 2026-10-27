(() => {
  'use strict';

  const MARKER_ROWS = {
    1: [
      '0000000000000000','0000000000000000','0011000000000100','0011100000001100',
      '0011110000000000','0011111000000000','0011101100000000','0011100110000000',
      '0000000011000000','0000000001100000','0000000000110000','0000001111111100',
      '0001000000001100','0001000000000110','0000000000000000','0000000000000000'
    ],
    2: [
      '0000000000000000','0000000000000000','0011111100001100','0010000100000000',
      '0010110100000000','0010110111111100','0010000111111100','0011111100001100',
      '0000000000001100','0000000000111100','0000000000000000','0000000000000000',
      '0010000000000000','0011000000000000','0000000000000000','0000000000000000'
    ],
    3: [
      '0000000000000000','0000000000000000','0111100111000000','0111110111110000',
      '1111111111110000','1111111111110000','0111111111100000','0011111111000000',
      '0001111110000000','0000111100000000','0000011000000000','0000000000011100',
      '0000100000011100','0000110000011100','0000000000000000','0000000000000000'
    ]
  };

  function toMatrix(rows) {
    return rows.map(row => [...row].map(v => v === '1' ? 0 : 255));
  }

  function rotateCW(matrix) {
    const n = matrix.length;
    return Array.from({ length: n }, (_, y) =>
      Array.from({ length: n }, (_, x) => matrix[n - 1 - x][y])
    );
  }

  function patternText(rows) {
    const orientations = [];
    let matrix = toMatrix(rows);
    for (let i = 0; i < 4; i++) {
      orientations.push(matrix);
      matrix = rotateCW(matrix);
    }

    return orientations.map(orientation => {
      const block = orientation.map(row => row.join(' ')).join('\n');
      return [block, block, block].join('\n');
    }).join('\n\n') + '\n';
  }

  function createPatternUrl(step) {
    const text = patternText(MARKER_ROWS[step]);
    return URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  }

  function applyPatternUrls() {
    [1, 2, 3].forEach(step => {
      const marker = document.getElementById('marker-' + step);
      if (marker) marker.setAttribute('url', createPatternUrl(step));
    });
  }

  function drawPrintableMarker(canvas, step, title, subtitle) {
    const ctx = canvas.getContext('2d');
    const width = 720, height = 820;
    canvas.width = width; canvas.height = height;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#000';
    ctx.fillRect(80, 50, 560, 560);

    ctx.fillStyle = '#fff';
    ctx.fillRect(220, 190, 280, 280);

    const rows = MARKER_ROWS[step];
    const cell = 280 / 16;
    ctx.fillStyle = '#000';
    rows.forEach((row, y) => {
      [...row].forEach((bit, x) => {
        if (bit === '1') ctx.fillRect(220 + x * cell, 190 + y * cell, cell + 0.2, cell + 0.2);
      });
    });

    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.font = '700 30px Arial';
    ctx.fillText(title, 360, 670);
    ctx.fillStyle = '#4b5563';
    ctx.font = '20px Arial';
    ctx.fillText(subtitle, 360, 710);
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px Arial';
    ctx.fillText('Imprimir sin recortar el borde negro · evitar plastificado brillante', 360, 752);
  }

  window.SacreMarkers = { MARKER_ROWS, patternText, createPatternUrl, applyPatternUrls, drawPrintableMarker };
})();