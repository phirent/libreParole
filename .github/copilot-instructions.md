# Projet : Libre Parole

## 1. Vision & Concept
"Libre Parole" est une web-app (PWA) d'expression anonyme et de soutien par les pairs destinée à un public francophone (Cameroun et Afrique francophone).
- **Cercles de Résonance :** Une parole déposée est envoyée uniquement à un salon privé de 3 à 5 personnes ("Veilleurs") ayant déjà vécu une épreuve similaire.
- **Cartes d'Écho :** L'auteur peut générer en un clic une image verticale (1080x1920px) d'une réponse reçue pour la partager en Statut WhatsApp, Story Instagram ou Story Facebook.
- **Mur des Cicatrices Dorées :** Une fois apaisé, l'auteur peut clôturer son cercle et publier son histoire résolue anonymement.

## 2. Stack Technique
- **Framework :** Next.js (App Router) + TypeScript strict
- **Styling :** Tailwind CSS (Mobile-First, < 300 Ko par vue pour économiser la data mobile)
- **Icônes :** `lucide-react` (toujours `strokeWidth={1.5}`)
- **Backend / BDD / Realtime :** Supabase (`@supabase/supabase-js` & `@supabase/ssr`)
- **Génération d'images :** `html-to-image` + API native `navigator.share`

## 3. Règles Anti-Design IA (STRICTES)
- **Inspiration :** Sobriété éditoriale inspirée de *Linear*, *Day One* et *Substack*.
- **INTERDICTIONS ABSOLUES :**
  - ZÉRO dégradé violet, bleu ou néon.
  - ZÉRO effet glassmorphism / flou d'arrière-plan.
  - ZÉRO ombre portée lourde.
  - ZÉRO emoji dans les titres, boutons ou libellés de l'interface.
  - ZÉRO texte marketing creux. Ton français naturel, sobre, humain et direct.
- **Palette stricte ("Nuit Apaisante") :**
  - Fond principal : `#0D1117`
  - Surface cartes / bulles : `#161B22` avec bordure fine `1px solid #30363D`
  - Accent unique (Lumière / Écoute) : `#F59E0B` (hover `#D97706`), texte sur bouton accent `#0D1117`
  - Texte principal : `#F0F6FC` | Texte secondaire : `#8B949E`
  - Danger / Signalement : `#EF4444`
- **Typographie :** `Plus Jakarta Sans` (titres), `Inter` (corps de texte).

## 4. Règles Métier & Sécurité
- **Anonymat strict :** Jamais d'email, vrai nom ou numéro affiché. Uniquement le `pseudo` (ou le label "Auteur" dans son propre cercle).
- **Modération :** 2 signalements distincts sur un membre dans un cercle passent `is_banned = true` automatiquement.
- **Confidentialité :** Seul l'auteur d'une parole peut générer une Carte d'Écho ou autoriser l'affichage sur le Mur des Cicatrices Dorées.
