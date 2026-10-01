import * as THREE from 'three';

function ambientBuffer(context) {
  const duration = 5;
  const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
  const samples = buffer.getChannelData(0);
  let noise = 0, seed = 7219;
  for (let i = 0; i < samples.length; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    noise = noise * .993 + ((seed / 4294967296) * 2 - 1) * .007;
    const time = i / context.sampleRate;
    const fade = Math.min(1, time * 8, (duration - time) * 8);
    samples[i] = (noise * .38 + Math.sin(time * Math.PI * 2 * .4) * .016 + Math.sin(time * Math.PI * 2 * 1.2) * .007) * Math.max(0, fade);
  }
  return buffer;
}

function bubbleBuffer(context) {
  const duration = 4;
  const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
  const samples = buffer.getChannelData(0);
  const bubbles = [
    [.23, .095, 360], [.58, .075, 490], [1.11, .12, 290],
    [1.42, .08, 550], [2.04, .1, 400], [2.67, .12, 320],
    [3.15, .07, 590], [3.56, .11, 380],
  ];
  for (const [start, length, pitch] of bubbles) {
    const first = Math.floor(start * context.sampleRate);
    const count = Math.floor(length * context.sampleRate);
    for (let i = 0; i < count; i++) {
      const t = i / context.sampleRate;
      const envelope = Math.sin(Math.PI * i / count) ** 2;
      samples[first + i] += Math.sin(Math.PI * 2 * (pitch * t + 900 * t * t)) * envelope * .35;
    }
  }
  return buffer;
}

export function createAquariumAudio(camera, emitters) {
  let listener = null;
  let sounds = [];
  let enabled = false;
  const supported = Boolean(window.AudioContext || window.webkitAudioContext);

  function initialize() {
    if (listener) return;
    listener = new THREE.AudioListener();
    camera.add(listener);
    const ambience = new THREE.Audio(listener);
    ambience.setBuffer(ambientBuffer(listener.context));
    ambience.setLoop(true);
    ambience.setVolume(.26);
    sounds.push(ambience);
    const bubbles = bubbleBuffer(listener.context);
    emitters.forEach((object, index) => {
      const sound = new THREE.PositionalAudio(listener);
      sound.setBuffer(bubbles);
      sound.setLoop(true);
      sound.setVolume(index === 0 ? .72 : .62);
      sound.setRefDistance(2.1);
      sound.setRolloffFactor(1.7);
      sound.setDistanceModel('exponential');
      object.add(sound);
      sounds.push(sound);
    });
  }

  function toggle() {
    if (!supported) return false;
    try {
      initialize();
      enabled = !enabled;
      if (enabled) {
        void listener.context.resume();
        sounds.forEach(sound => { if (!sound.isPlaying) sound.play(); });
      } else {
        sounds.forEach(sound => { if (sound.isPlaying) sound.pause(); });
      }
      return enabled;
    } catch (error) {
      console.warn('Não foi possível iniciar o som do aquário:', error);
      enabled = false;
      return false;
    }
  }

  function dispose() {
    sounds.forEach(sound => { if (sound.isPlaying) sound.stop(); });
    if (listener) void listener.context.close();
  }

  return { supported, toggle, dispose };
}
