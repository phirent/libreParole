# Spécifications Fonctionnelles — Libre Parole (MVP V1)

## Liste fixe des Vécus / Thèmes
`["Trahison amicale", "Jalousie sur un projet", "Solitude", "Pression familiale", "Déception amoureuse", "Échec"]`

## Écran 1 : Porte d'Entrée (`/`)
- Affiche `/logo.png`, le nom "Libre Parole" et l'accroche : "Dépose ce que tu portes en silence. Échange avec ceux qui ont traversé la même épreuve."
- Bouton principal (`#F59E0B`) : "Entrer anonymement".
- Ouvre un formulaire minimaliste Email + Mot de passe (connexion ou création automatique sans confirmation email bloquante).
- Redirection : vers `/onboarding` si le profil n'existe pas encore, sinon vers `/app/deposer`.

## Écran 2 : Onboarding Express (`/onboarding`)
- Génère automatiquement un pseudo unique au format `[Nom][Adjectif]_[Chiffre]` (ex: `VeilleurCalme_42`) avec bouton pour régénérer ou modifier.
- Sélection obligatoire de 1 à 3 vécus parmi la liste fixe.
- Validation enregistre dans `profiles` (`is_available = true`) et redirige vers `/app/deposer`.

## Écran 3 : Espace Principal (`/app/*` avec barre de navigation fixe en bas à 3 onglets)
1. **Onglet "Déposer" (`/app/deposer`) :**
   - Sélecteur d'un thème parmi la liste fixe + zone de texte (20 à 1000 caractères).
   - Bouton "Ouvrir un Cercle" : appelle la fonction RPC `create_parole_and_match` et redirige vers `/app/cercle/[id]`.
2. **Onglet "Mes Cercles" (`/app/cercles`) :**
   - Liste des cercles actifs (`status = 'open'` et moins de 48h depuis `created_at`) où l'utilisateur est membre non banni.
   - Affiche le thème, le rôle ("Votre parole" ou "Cercle d'écoute") et le temps restant sur 48h.
3. **Onglet "Cicatrices Dorées" (`/app/cicatrices`) :**
   - Fil public en lecture seule des paroles clôturées avec `is_public_scar = true`, affichant le thème, le texte initial et le conseil retenu (`golden_advice`).

## Écran 4 : Salon du Cercle (`/app/cercle/[id]`)
- Chat temps réel via Supabase Realtime (`messages`).
- Identité : l'auteur apparaît toujours sous le nom "Auteur" ; les écoutants apparaissent sous leur `pseudo`.
- Modération : bouton "Signaler" sur les messages des autres membres. 2 signalements distincts dans le même cercle excluent immédiatement le membre (`is_banned = true`).
- Clôture (uniquement visible par l'auteur) : bouton "Clôturer et apaiser". Ouvre une modale permettant de choisir un message marquant comme conseil retenu et de cocher "Partager anonymement sur le Mur des Cicatrices Dorées".

## Fonctionnalité Virale : Carte d'Écho
- Bouton "Carte d'Écho" visible uniquement par l'auteur sous chaque réponse reçue.
- Génère côté client (`html-to-image`) un PNG `1080x1920px` (fond `#0D1117`, extrait de la parole en `#8B949E`, réponse en `#F0F6FC`, signature "Libre Parole" en `#F59E0B`, aucun pseudo).
- Utilise `navigator.share` pour partager directement vers WhatsApp Status, Instagram Stories et Facebook Stories, avec fallback téléchargement PNG.
