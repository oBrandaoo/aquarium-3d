import assert from 'node:assert/strict';
import * as THREE from 'three';
import { cameraRelativeDirection } from '../src/movement.js';

const camera = new THREE.PerspectiveCamera();
camera.rotation.order = 'YXZ';
const direction = new THREE.Vector3();

function expectDirection(forward, side, vertical, expected) {
  cameraRelativeDirection(camera, forward, side, vertical, direction);
  assert.ok(direction.distanceTo(new THREE.Vector3(...expected)) < 1e-6,
    `Expected ${expected}, received ${direction.toArray()}`);
}

expectDirection(1, 0, 0, [0, 0, -1]);
camera.rotation.y = Math.PI / 2;
expectDirection(1, 0, 0, [-1, 0, 0]);
expectDirection(0, 1, 0, [0, 0, -1]);
camera.rotation.y = -Math.PI / 2;
expectDirection(1, 0, 0, [1, 0, 0]);
camera.rotation.set(Math.PI / 4, 0, 0);
expectDirection(1, 0, 0, [0, Math.SQRT1_2, -Math.SQRT1_2]);
expectDirection(0, 1, 0, [1, 0, 0]);
camera.rotation.set(0, 0, 0);
expectDirection(0, 0, 1, [0, 1, 0]);
expectDirection(1, 1, 0, [Math.SQRT1_2, 0, -Math.SQRT1_2]);

console.log('Camera-relative movement passed: forward, strafe, pitch, vertical and diagonal.');
