# PHOTOANTS

Application web minimaliste (format portrait) pour buralistes : photo d'identité conforme ANTS, puis planche 10 × 15 cm prête à imprimer.
Next.js 15 (App Router) · Tailwind CSS 3 · JavaScript · déployable tel quel sur Vercel.

## Parcours
1. **Photo** : caméra de l'appareil ou import d'un fichier. Le client se place devant la toile murale.
2. **Cadrage** : analyse IA, zoom / flèches / auto-cadrage.
3. **Format** (après « Valider le cadrage ») :
   - 3,5 × 4,5 cm : 8 photos (4 + 4) sur une planche 15 × 10 cm en paysage (4 × 35 mm = 14 cm).
   - 4 × 6 cm : 4 photos (2 × 2) sur une planche 10 × 15 cm en portrait.
   Sortie : impression directe, JPEG 300 dpi ou PDF. Un fin trait de coupe gris est tracé autour de chaque photo, hors de la photo.

## Fond : la toile murale
L'application ne modifie pas le fond : c'est la toile qui le fixe. Pour qu'il soit conforme :
- toile unie, mate (non brillante), gris clair ou bleu clair, jamais blanche ni foncée ;
- toile bien tendue, sans plis marqués ;
- client éloigné de la toile (environ 1 m) et éclairé de face, de façon uniforme, pour éviter les ombres portées.

L'IA vérifie le fond (alerte orange s'il paraît blanc, foncé ou non uni) et bloque s'il y a des ombres.

## Qui fait quoi
| Contrôle | Où | Clé requise |
|---|---|---|
| Visage unique, tête droite, yeux ouverts, bouche fermée, taille 32–36 mm, cadrage dans la photo | Navigateur (MediaPipe) | non |
| Lunettes épaisses, ombres, fond, dents, torse nu, couvre-chef | `/api/analyze` (OpenAI) | `OPENAI_API_KEY` |

Sans clé OpenAI : alerte orange « Contrôle IA non configuré », sans blocage.

## Variable d'environnement
| Nom | Valeur |
|---|---|
| `OPENAI_API_KEY` | votre clé OpenAI (`sk-...`) |

Facultative : `OPENAI_MODEL` (défaut `gpt-4o`).

**Sur Vercel** : à l'import du projet (écran « Configure Project » → *Environment Variables*), ou plus tard dans Project → Settings → Environment Variables. Ajoutez le nom ci-dessus avec votre valeur, cochez Production, Preview et Development, puis Save. Les changements ne s'appliquent qu'aux nouveaux déploiements : Deployments → ⋯ → Redeploy.

**En local** : `cp .env.example .env.local`, puis renseignez la valeur (le fichier est ignoré par git).

Ne mettez jamais cette clé dans le code ni sur GitHub.

## Lancer en local
```bash
cp .env.example .env.local   # renseigner la clé
npm install
npm run dev
```

## Déployer (GitHub + Vercel)
1. Créez un dépôt GitHub et envoyez le contenu de ce dossier à la racine :
   ```bash
   git init && git add . && git commit -m "PHOTOANTS" && git branch -M main
   git remote add origin <URL_DU_DEPOT> && git push -u origin main
   ```
2. vercel.com → Add New → Project → importez le dépôt (Next.js est détecté automatiquement).
3. Renseignez la variable d'environnement (section ci-dessus) → Deploy.

La caméra exige HTTPS (fourni par Vercel).

## Points d'attention
- Le sommet du crâne est estimé à partir des points du visage (marge d'environ 2 mm) : la vérification humaine reste obligatoire (case à cocher avant impression).
- La route `/api/analyze` consomme votre clé payante : fixez un plafond de dépense chez OpenAI et ne diffusez pas l'URL publiquement.
- RGPD : les photos transitent par OpenAI pour l'analyse ; l'application ne stocke rien. Informez vos clients.
- Normes visées : visage de 32 à 36 mm (menton → sommet du crâne), fond uni clair (jamais blanc), expression neutre, bouche fermée, pas de lunettes épaisses, pas d'ombres.
