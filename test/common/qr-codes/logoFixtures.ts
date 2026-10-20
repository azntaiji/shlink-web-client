export const createLogo = (kind: 'opaque' | 'transparent' | 'wide' = 'opaque') => {
  const canvas = document.createElement('canvas');
  canvas.width = kind === 'wide' ? 240 : 120;
  canvas.height = 120;
  const context = canvas.getContext('2d')!;
  if (kind !== 'transparent') {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.fillStyle = '#1456a0';
  context.beginPath();
  context.roundRect(8, 8, canvas.width - 16, 104, 20);
  context.fill();
  context.fillStyle = '#ffffff';
  context.fillRect(canvas.width / 2 - 8, 30, 16, 60);
  context.fillRect(canvas.width / 2 - 30, 52, 60, 16);
  return canvas.toDataURL('image/png');
};
