# 🛡️ CyberHub

Plateforme de formation en cybersécurité avec exercices pratiques, système de scoring et labs virtuels.

## 🎯 Fonctionnalités

- **Red Team** 🔴 : Pentesting, Cryptographie, Exploitation, Social Engineering
- **Blue Team** 🔵 : OSINT, SIEM, Forensics, Firewall, SOC
- **Système de scoring** : Questions/réponses avec points et classement
- **Scoreboard** : Classement en temps réel des étudiants
- **Labs virtuels** : Environnements pratiques via Cloudflare Containers

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    PAGES     │  │   WORKERS    │  │      D1      │      │
│  │  (Frontend)  │──│    (API)     │──│  (Database)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐               │
│         ▼                 ▼                 ▼               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │      KV      │  │  CONTAINERS  │  │      R2      │      │
│  │  (Sessions)  │  │   (Labs)     │  │   (PDFs)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- npm ou pnpm
- Wrangler CLI (`npm install -g wrangler`)
- Compte Cloudflare

### Installation

```bash
# Cloner le projet
git clone https://github.com/samirdawaliby/cyberhub.git
cd cyberhub

# Installer les dépendances
cd workers && npm install && cd ..

# Se connecter à Cloudflare
wrangler login

# Lancer en développement
cd workers && npm run dev
```

## 📁 Structure

```
cyberhub/
├── frontend/               # Interface utilisateur
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── api.js
│       └── app.js
├── workers/                # API Backend
│   ├── src/index.ts
│   ├── wrangler.toml
│   └── package.json
├── database/               # Schémas SQL
│   ├── schema.sql
│   └── seed.sql
└── docs/                   # Documentation
```

## 🎨 Design System

### Couleurs
- **Red Team** : `#DC2626` (rouge), `#EF4444` (accent)
- **Blue Team** : `#2563EB` (bleu), `#3B82F6` (accent)
- **Background** : `#0F172A` (dark), `#1E293B` (secondary)

## 📊 Système de Scoring

1. Chaque exercice contient des questions (QCM, texte, flag)
2. Les réponses correctes rapportent des points
3. Le scoreboard affiche le classement global et par team
4. Les étudiants peuvent voir leur progression

## 🔗 Liens

- **Production** : https://cyberhub.pages.dev
- **API** : https://cyberhub-api.cyberhub.workers.dev

## 📄 License

MIT
