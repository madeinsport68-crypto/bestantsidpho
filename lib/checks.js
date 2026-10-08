// Règles de conformité ANTS : transforme les résultats d'analyse en liste de contrôles.
// state : "ok" | "warn" (alerte, non bloquante) | "error" (bloquante) | "wait" (analyse en cours)
const MIN = 32;
const MAX = 36;

const FOND = {
  blanc: "Fond blanc ou presque blanc : l'ANTS refuse le blanc, utilisez la toile gris clair",
  fonce: "Fond trop foncé : utilisez la toile unie claire",
  non_uni: "Fond non uni (motifs, objets, plis marqués) : tendez la toile et dégagez le mur",
};

export function buildChecks({ face, ai, fit, headMm }) {
  const list = [];
  const add = (label, state, msg = "") => list.push({ label, state, msg });
  const test = (label, bad, msg, level = "error") => add(label, bad ? level : "ok", bad ? msg : "");

  // --- Géométrie du visage (MediaPipe, dans le navigateur)
  if (!face) add("Visage", "wait");
  else if (face.error) add("Visage", "error", "Détection du visage indisponible : vérifiez la connexion internet puis reprenez la photo.");
  else if (face.count !== 1)
    add("Visage", "error", face.count ? "Plusieurs visages détectés : une seule personne par photo." : "Aucun visage détecté : reprenez la photo de face.");
  else {
    add("Un seul visage", "ok");
    test("Tête droite", Math.abs(face.roll) > 5, "Tête penchée, redressez-vous");
    test("Regard face à l'objectif", face.yaw > 0.07, "Tête tournée : le client doit regarder droit devant lui");
    test("Yeux ouverts", !face.eyesOpen, "Yeux fermés ou plissés : demandez des yeux grands ouverts");
    test("Bouche fermée", face.mouthOpen, "Bouche ouverte : bouche fermée et expression neutre");
    test("Expression neutre", face.smile > 0.4, "Sourire détecté : expression neutre demandée", "warn");
    test("Résolution suffisante", face.headH < 250, "Visage trop petit dans l'image : rapprochez le client de l'appareil", "warn");
    if (headMm != null)
      test(
        `Taille du visage : ${headMm.toFixed(1).replace(".", ",")} mm (norme ${MIN} à ${MAX} mm)`,
        headMm < MIN - 0.05 || headMm > MAX + 0.05,
        "Taille du visage hors norme : utilisez Zoom, Dézoom ou Auto-cadrage"
      );
    if (fit != null)
      test("Cadrage dans la photo", !fit, "Le cadrage dépasse de la photo : déplacez-le avec les flèches ou reprenez la photo en laissant plus de marge autour du visage");
  }

  // --- Contrôles visuels (OpenAI Vision), dont le fond (la toile murale fixe le fond, l'IA le vérifie)
  const AI = "Lunettes, ombres, fond, tenue";
  if (ai.state === "loading") add(AI, "wait");
  else if (ai.state !== "ok" || !ai.data)
    add(AI, "warn", ai.state === "off" ? "Contrôle IA non configuré (clé OpenAI absente) : vérification visuelle renforcée." : "Contrôle IA indisponible : vérification visuelle renforcée.");
  else {
    const a = ai.data;
    test("Pas de lunettes à monture épaisse", a.lunettes === "epaisses", "Lunettes à monture épaisse : à retirer");
    test("Pas de reflets sur les verres", a.reflets_lunettes, "Reflets sur les verres de lunettes", "warn");
    test("Pas d'ombres", a.ombres, "Ombres sur le visage ou la toile : éclairer de face et éloigner le client de la toile");
    test("Fond uni et clair", a.fond !== "uni_clair", FOND[a.fond] || "Fond non conforme", "warn");
    test("Pas de sourire avec dents", a.sourire_dents, "Sourire avec dents apparentes : expression neutre demandée");
    test("Tenue correcte", a.torse_nu, "Veuillez demander au client de mettre un HABIT");
    test("Visage dégagé", a.couvre_chef || a.visage_masque, "Front, yeux ou visage masqués (couvre-chef, cheveux, main...)");
    test("Photo nette et bien éclairée", a.qualite !== "bonne", "Photo floue, sombre ou surexposée", "warn");
  }

  return {
    list,
    errors: list.filter((c) => c.state === "error"),
    warns: list.filter((c) => c.state === "warn"),
    waiting: list.some((c) => c.state === "wait"),
  };
}
