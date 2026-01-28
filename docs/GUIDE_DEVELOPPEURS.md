# CyberHub - Guide Développeurs

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Installation locale](#installation-locale)
4. [Structure du projet](#structure-du-projet)
5. [Créer un exercice](#créer-un-exercice)
6. [Créer un container/lab](#créer-un-containerlab)
7. [Lier un exercice à un container](#lier-un-exercice-à-un-container)
8. [Système de scoring](#système-de-scoring)
9. [Workflow Git](#workflow-git)
10. [Déploiement](#déploiement)
11. [Accès et comptes](#accès-et-comptes)

---

## 🎯 Vue d'ensemble

**CyberHub** est une plateforme de formation en cybersécurité où les étudiants :
1. Choisissent un exercice (Red Team ou Blue Team)
2. Lisent le cours/énoncé
3. Lancent un **lab virtuel** (container) pour pratiquer
4. Répondent aux questions pour valider leurs connaissances
5. Gagnent des **points** affichés sur le **scoreboard**

### Flux Étudiant
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Choisir    │───▶│   Lire le   │───▶│  Lancer le  │───▶│  Répondre   │
│  Exercice   │    │    Cours    │    │     Lab     │    │  Questions  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                │
                   ┌─────────────┐    ┌─────────────┐           │
                   │  Afficher   │◀───│  Calculer   │◀──────────┘
                   │ Scoreboard  │    │   Score     │
                   └─────────────┘    └─────────────┘
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │    PAGES     │     │   WORKERS    │     │      D1      │    │
│  │  (Frontend)  │────▶│    (API)     │────▶│  (Database)  │    │
│  │  HTML/CSS/JS │     │  TypeScript  │     │   SQLite     │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
│         ▼                    ▼                    ▼             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │      KV      │     │  CONTAINERS  │     │      R2      │    │
│  │  (Sessions)  │     │   (Labs)     │     │   (PDFs)     │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Technologies
- **Frontend** : HTML, CSS, JavaScript vanilla
- **Backend** : TypeScript + Hono (framework)
- **Database** : Cloudflare D1 (SQLite)
- **Labs** : Cloudflare Containers (Docker)
- **Déploiement** : Cloudflare Pages + Workers

---

## 💻 Installation locale

### Prérequis
- Node.js 18+
- npm ou pnpm
- Git
- Wrangler CLI

### Étapes

```bash
# 1. Cloner le projet
git clone https://github.com/samirdawaliby/cyberhub.git
cd cyberhub

# 2. Créer votre branche
git checkout -b dev/votre-prenom

# 3. Installer les dépendances
cd workers
npm install

# 4. Se connecter à Cloudflare
npm install -g wrangler
wrangler login
# → Connectez-vous avec cyberhub@caplogy.com

# 5. Lancer en développement
npm run dev
# API disponible sur http://localhost:8787

# 6. Lancer le frontend (autre terminal)
cd ../frontend
npx serve .
# Frontend disponible sur http://localhost:3000
```

---

## 📁 Structure du projet

```
cyberhub/
├── frontend/                    # Interface utilisateur
│   ├── index.html              # Page principale
│   ├── css/
│   │   └── style.css           # Styles (Red/Blue theme)
│   └── js/
│       ├── api.js              # Client API
│       └── app.js              # Logique application
│
├── workers/                     # API Backend
│   ├── src/
│   │   └── index.ts            # Routes API
│   ├── wrangler.toml           # Config Cloudflare
│   └── package.json
│
├── database/                    # Schémas SQL
│   ├── schema.sql              # Structure tables
│   └── seed.sql                # Données initiales
│
├── containers/                  # Définitions des labs
│   ├── nmap-lab/
│   │   ├── Dockerfile
│   │   └── setup.sh
│   ├── metasploit-lab/
│   └── ...
│
└── docs/                        # Documentation
    └── GUIDE_DEVELOPPEURS.md
```

---

## ✏️ Créer un exercice

### Étape 1 : Définir l'exercice en SQL

Ajoutez votre exercice dans `database/seed.sql` ou via une requête SQL :

```sql
-- Insérer l'exercice
INSERT INTO exercises (
    id,                      -- Identifiant unique (slug)
    theme_id,                -- Thématique parente
    title,                   -- Titre affiché
    description,             -- Description courte
    difficulty,              -- débutant | intermédiaire | avancé | expert
    duration_minutes,        -- Durée estimée
    points_max,              -- Points maximum possible
    course_content,          -- Contenu du cours en Markdown
    container_template_id,   -- ID du container (si lab)
    order_index              -- Ordre d'affichage
) VALUES (
    'pentest-nmap-advanced',
    'pentesting',
    'Scan avancé avec Nmap',
    'Maîtrisez les techniques de scan avancées',
    'intermédiaire',
    60,
    150,
    '# Scan Avancé avec Nmap

## Objectifs
- Utiliser les scripts NSE
- Contourner les firewalls
- Analyser les résultats

## Théorie
...

## Exercice Pratique
Lancez le lab et trouvez les flags cachés sur la machine cible.
',
    'nmap-lab',  -- Lié au container nmap-lab
    3
);
```

### Étape 2 : Ajouter les questions

```sql
-- Questions de l'exercice
INSERT INTO questions (id, exercise_id, question_text, question_type, options, correct_answer, points, hint, order_index) VALUES

-- Question QCM
('q-nmap-adv-1', 'pentest-nmap-advanced',
 'Quel script NSE permet de détecter les vulnérabilités SMB ?',
 'qcm',
 '["smb-vuln-*", "smb-enum-*", "smb-brute", "smb-os-discovery"]',
 'smb-vuln-*',
 15,
 'Les scripts de vulnérabilités commencent par vuln',
 1),

-- Question texte libre
('q-nmap-adv-2', 'pentest-nmap-advanced',
 'Quelle option permet de scanner tous les ports TCP ?',
 'text',
 NULL,
 '-p-',
 10,
 'C''est un tiret suivi d''un caractère',
 2),

-- Question FLAG (trouvé dans le lab)
('q-nmap-adv-3', 'pentest-nmap-advanced',
 'Trouvez le flag caché sur le port 8080 de la cible',
 'flag',
 NULL,
 'FLAG{nmap_ninja_2024}',
 50,
 'Utilisez curl ou un navigateur après avoir trouvé le port',
 3),

-- Question code
('q-nmap-adv-4', 'pentest-nmap-advanced',
 'Écrivez la commande Nmap complète pour scanner les ports 1-1000 avec détection de version',
 'code',
 NULL,
 'nmap -sV -p1-1000',
 25,
 'Combinez -sV et -p',
 4);
```

### Étape 3 : Appliquer à la base de données

```bash
# En local
wrangler d1 execute cyberhub-db --local --command="INSERT INTO exercises ..."

# En production
wrangler d1 execute cyberhub-db --remote --command="INSERT INTO exercises ..."

# Ou via un fichier SQL
wrangler d1 execute cyberhub-db --remote --file=./mon-exercice.sql
```

---

## 🐳 Créer un container/lab

### Structure d'un lab

```
containers/
└── nmap-lab/
    ├── Dockerfile           # Image Docker
    ├── docker-compose.yml   # Config locale
    ├── setup.sh            # Script d'initialisation
    ├── flags/              # Fichiers flags à cacher
    │   └── flag.txt
    └── README.md           # Documentation du lab
```

### Exemple de Dockerfile

```dockerfile
# containers/nmap-lab/Dockerfile
FROM kalilinux/kali-rolling

# Installer les outils nécessaires
RUN apt-get update && apt-get install -y \
    nmap \
    netcat-openbsd \
    curl \
    python3 \
    openssh-server \
    apache2 \
    && rm -rf /var/lib/apt/lists/*

# Copier les scripts de configuration
COPY setup.sh /opt/setup.sh
RUN chmod +x /opt/setup.sh

# Copier les flags
COPY flags/ /opt/flags/

# Configurer les services vulnérables pour l'exercice
RUN echo "FLAG{nmap_ninja_2024}" > /var/www/html/secret.txt

# Exposer les ports pour le scan
EXPOSE 22 80 443 8080 3306

# Script de démarrage
CMD ["/opt/setup.sh"]
```

### Script setup.sh

```bash
#!/bin/bash
# containers/nmap-lab/setup.sh

# Démarrer les services
service ssh start
service apache2 start

# Créer des services vulnérables sur différents ports
python3 -m http.server 8080 --directory /opt/flags &

# Garder le container actif
tail -f /dev/null
```

### Enregistrer le container template

```sql
INSERT INTO container_templates (
    id,
    name,
    description,
    image_tag,
    team_type,
    vnc_port,
    resources
) VALUES (
    'nmap-lab',
    'Nmap Training Lab',
    'Environnement d''entraînement pour les scans Nmap avec cibles vulnérables',
    'cyberhub/nmap-lab:latest',
    'red',
    5900,
    '{"cpu": "1", "memory": "2Gi", "timeout": 7200}'
);
```

---

## 🔗 Lier un exercice à un container

### Dans la base de données

```sql
-- Mettre à jour un exercice existant pour lui ajouter un lab
UPDATE exercises
SET container_template_id = 'nmap-lab'
WHERE id = 'pentest-nmap-advanced';
```

### Vérification

```sql
-- Voir les exercices avec leurs labs
SELECT
    e.id,
    e.title,
    e.difficulty,
    ct.name as lab_name,
    ct.image_tag
FROM exercises e
LEFT JOIN container_templates ct ON e.container_template_id = ct.id
WHERE e.theme_id = 'pentesting';
```

---

## 📊 Système de scoring

### Comment ça marche

1. **L'étudiant répond aux questions** de l'exercice
2. **L'API vérifie chaque réponse** et attribue les points
3. **Le score est enregistré** dans `exercise_results`
4. **Le scoreboard est mis à jour** automatiquement

### Types de questions

| Type | Description | Exemple de réponse |
|------|-------------|-------------------|
| `qcm` | Choix multiple | Une des options JSON |
| `text` | Texte libre | Chaîne exacte |
| `flag` | Flag CTF | `FLAG{...}` |
| `code` | Code/commande | Commande exacte |

### Calcul du score

```
Score exercice = Somme des points des questions correctes
Score total = Somme de tous les exercise_results
Rang = Position basée sur le score total
```

### Tables impliquées

```sql
-- Soumissions individuelles
submissions (student_id, question_id, is_correct, points_earned)

-- Résultat par exercice
exercise_results (student_id, exercise_id, score, percentage)

-- Classement global
scoreboard (student_id, total_points, red_team_points, blue_team_points, rank)
```

---

## 🔄 Workflow Git

### Règles importantes

> ⚠️ **NE JAMAIS travailler sur `main`** - Créez toujours une branche !

### Workflow quotidien

```bash
# 1. Récupérer les dernières modifications
git checkout main
git pull origin main

# 2. Créer/retourner sur votre branche
git checkout -b dev/votre-prenom
# ou
git checkout dev/votre-prenom
git merge main

# 3. Faire vos modifications
# ... éditer les fichiers ...

# 4. Commiter régulièrement
git add .
git commit -m "Ajout exercice: Scan Nmap avancé"

# 5. Pousser votre branche
git push origin dev/votre-prenom

# 6. Créer une Pull Request sur GitHub
# → Aller sur github.com/samirdawaliby/cyberhub
# → Cliquer "Pull requests" > "New pull request"
# → Sélectionner votre branche
```

### Conventions de commit

```
feat: Ajout nouvel exercice XSS injection
fix: Correction calcul score
docs: Mise à jour documentation
style: Amélioration CSS scoreboard
refactor: Restructuration API questions
```

---

## 🚀 Déploiement

### Déployer l'API (Workers)

```bash
cd workers
wrangler deploy
```

### Déployer le Frontend (Pages)

```bash
wrangler pages deploy ../frontend --project-name=cyberhub
```

### Mettre à jour la base de données

```bash
# Appliquer un fichier SQL
wrangler d1 execute cyberhub-db --remote --file=./nouveau-exercice.sql

# Exécuter une commande directe
wrangler d1 execute cyberhub-db --remote --command="UPDATE exercises SET ..."
```

### Déployer un container

```bash
# Build l'image
cd containers/nmap-lab
docker build -t cyberhub/nmap-lab:latest .

# Push vers le registry Cloudflare
# (Voir documentation Cloudflare Containers)
```

---

## 🔐 Accès et comptes

### Cloudflare

| | |
|---|---|
| **Dashboard** | https://dash.cloudflare.com |
| **Email** | cyberhub@caplogy.com |
| **Mot de passe** | (demander à Samir) |

### GitHub

| | |
|---|---|
| **Repository** | https://github.com/samirdawaliby/cyberhub |
| **Compte** | samirdawaliby (ou votre compte personnel) |

### URLs de production

| Service | URL |
|---------|-----|
| **Frontend** | https://cyberhub-egk.pages.dev |
| **API** | https://cyberhub-api.cyberhub-e83.workers.dev |

### IDs des ressources Cloudflare

| Ressource | ID |
|-----------|-----|
| **D1 Database** | `3d28fa20-7be6-4339-93f8-9545db6b3eb9` |
| **KV Sessions** | `42e6dfe57dfe476189f7ca9a25079287` |

---

## 📝 Checklist nouveau développeur

- [ ] Cloner le repository
- [ ] Créer ma branche `dev/mon-prenom`
- [ ] Installer les dépendances (`cd workers && npm install`)
- [ ] Me connecter à Cloudflare (`wrangler login`)
- [ ] Lancer l'API en local (`npm run dev`)
- [ ] Lancer le frontend en local (`npx serve .`)
- [ ] Créer mon premier exercice de test
- [ ] Faire une Pull Request

---

## ❓ FAQ

### Comment voir les données en base ?

```bash
wrangler d1 execute cyberhub-db --remote --command="SELECT * FROM exercises"
wrangler d1 execute cyberhub-db --remote --command="SELECT * FROM scoreboard"
```

### Comment tester un exercice localement ?

1. Lancer l'API : `cd workers && npm run dev`
2. Lancer le frontend : `cd frontend && npx serve .`
3. Ouvrir http://localhost:3000
4. Entrer un code étudiant test (ex: TEST001)
5. Naviguer vers l'exercice

### Comment debugger l'API ?

```bash
# Voir les logs en temps réel
wrangler tail

# Tester un endpoint
curl http://localhost:8787/api/themes
curl http://localhost:8787/api/exercises/pentest-nmap-basics
```

### L'exercice n'apparaît pas ?

1. Vérifier `is_active = 1` dans la table exercises
2. Vérifier que `theme_id` existe dans la table themes
3. Redéployer si nécessaire : `wrangler deploy`

---

## 📞 Support

- **Questions techniques** : Contacter Samir
- **Bugs** : Créer une issue sur GitHub
- **Idées d'exercices** : Discuter en équipe

---

*Dernière mise à jour : Janvier 2026*
