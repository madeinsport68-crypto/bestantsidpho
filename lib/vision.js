// Détection du visage : MediaPipe (WASM), chargé depuis un CDN et exécuté dans le navigateur.
// Gratuit, et aucune photo ne quitte l'appareil pour cette partie.
const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODELS = "https://storage.googleapis.com/mediapipe-models";

const once = (fn) => {
  let p;
  return () =>
    (p ??= fn().catch((e) => {
      p = null; // permet de réessayer après un échec réseau
      throw e;
    }));
};

const lib = once(async () => {
  const m = await import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs");
  return { m, files: await m.FilesetResolver.forVisionTasks(WASM) };
});

const faceModel = once(async () => {
  const { m, files } = await lib();
  return m.FaceLandmarker.createFromOptions(files, {
    baseOptions: { modelAssetPath: `${MODELS}/face_landmarker/face_landmarker/float16/1/face_landmarker.task`, delegate: "CPU" },
    runningMode: "IMAGE",
    numFaces: 2,
    outputFaceBlendshapes: true,
  });
});

// Géométrie et expression du visage, en pixels du canvas.
export async function detectFace(canvas) {
  const lm = await faceModel();
  const r = lm.detect(canvas);
  const faces = r.faceLandmarks || [];
  if (faces.length !== 1) return { count: faces.length };

  const L = faces[0].map((p) => ({ x: p.x * canvas.width, y: p.y * canvas.height }));
  const bs = {};
  (r.faceBlendshapes?.[0]?.categories || []).forEach((c) => (bs[c.categoryName] = c.score));

  const chin = L[152]; // menton
  const top = L[10]; // haut du front
  const ux = top.x - chin.x;
  const uy = top.y - chin.y;
  const faceLen = Math.hypot(ux, uy);
  // Le sommet du crâne se situe environ 28 % de la hauteur de visage au-dessus du haut du front.
  const crown = { x: top.x + ux * 0.28, y: top.y + uy * 0.28 };
  const faceW = Math.abs(L[454].x - L[234].x) || 1;

  return {
    count: 1,
    headH: faceLen * 1.28, // menton -> sommet du crâne (px)
    cx: (chin.x + crown.x) / 2,
    cy: (chin.y + crown.y) / 2,
    nose: L[1],
    roll: (Math.atan2(L[263].y - L[33].y, L[263].x - L[33].x) * 180) / Math.PI, // inclinaison de la tête (°)
    yaw: Math.abs((L[1].x - Math.min(L[234].x, L[454].x)) / faceW - 0.5), // 0 = de face
    eyesOpen: (bs.eyeBlinkLeft ?? 0) < 0.5 && (bs.eyeBlinkRight ?? 0) < 0.5,
    mouthOpen: Math.abs(L[14].y - L[13].y) / faceLen > 0.025 || (bs.jawOpen ?? 0) > 0.25,
    smile: ((bs.mouthSmileLeft ?? 0) + (bs.mouthSmileRight ?? 0)) / 2,
  };
}
