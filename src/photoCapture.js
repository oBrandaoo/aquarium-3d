import * as THREE from 'three';

export function captureAquariumPhoto(renderer, scene, camera) {
  const width = camera.aspect >= 1 ? 640 : Math.round(640 * camera.aspect);
  const height = camera.aspect >= 1 ? Math.round(640 / camera.aspect) : 640;
  const target = new THREE.WebGLRenderTarget(width, height, { stencilBuffer: false });
  target.texture.colorSpace = THREE.SRGBColorSpace;
  const previousTarget = renderer.getRenderTarget();
  const pixels = new Uint8Array(width * height * 4);

  try {
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);
  } finally {
    renderer.setRenderTarget(previousTarget);
    target.dispose();
  }

  const output = document.createElement('canvas');
  output.width = width;
  output.height = height;
  const context = output.getContext('2d');
  const image = context.createImageData(width, height);
  for (let y = 0; y < height; y++) {
    const from = (height - 1 - y) * width * 4;
    image.data.set(pixels.subarray(from, from + width * 4), y * width * 4);
  }
  context.putImageData(image, 0, 0);
  return output.toDataURL('image/jpeg', .84);
}
