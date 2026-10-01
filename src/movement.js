import * as THREE from 'three';

const viewForward = new THREE.Vector3();
const viewRight = new THREE.Vector3();
const worldRotation = new THREE.Quaternion();

export function cameraRelativeDirection(camera, forward, side, vertical, target) {
  camera.getWorldDirection(viewForward);
  camera.getWorldQuaternion(worldRotation);
  viewRight.set(1, 0, 0).applyQuaternion(worldRotation);

  target.copy(viewForward).multiplyScalar(forward);
  target.addScaledVector(viewRight, side);
  target.y += vertical;
  if (target.lengthSq() > 1) target.normalize();
  return target;
}
