/**
 * Exporte le graphe (SVG) en PNG, entièrement côté client.
 * Aucun réseau, aucune dépendance : sérialisation SVG → canvas → data URL.
 */
export async function downloadSvgAsPng(
  svg: SVGSVGElement,
  filename: string,
): Promise<void> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const width = Math.max(1, Math.round(svg.clientWidth || svg.viewBox.baseVal.width || 1200));
  const height = Math.max(1, Math.round(svg.clientHeight || svg.viewBox.baseVal.height || 800));

  const xml = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Graphe impossible à convertir en image'));
      image.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const context = canvas.getContext('2d');
    if (context === null) throw new Error('Canvas indisponible');

    context.fillStyle = '#0b0e14';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = filename;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
