# Nmap Basics Lab

## Description
Lab d'entraînement pour l'exercice "Reconnaissance avec Nmap". Les étudiants doivent scanner la machine cible et trouver les flags cachés.

## Services exposés

| Port | Service | Flag |
|------|---------|------|
| 22 | SSH | - |
| 80 | Apache | `FLAG{apache_found_80}` (dans le code source HTML) |
| 443 | HTTPS | - |
| 3306 | MySQL | - |
| 8080 | Nginx | `FLAG{nginx_8080_secret}` (dans le code source) |
| 9999 | Service secret | `FLAG{secret_port_9999}` (connexion netcat) |

## Flags à trouver

1. **FLAG{apache_found_80}** - Dans le code source de la page Apache (port 80)
2. **FLAG{hidden_directory_found}** - Dans /secret/flag.txt sur Apache
3. **FLAG{nginx_8080_secret}** - Dans le code source Nginx (port 8080)
4. **FLAG{secret_port_9999}** - En se connectant au port 9999

## Build & Run local

```bash
# Build l'image
docker build -t cyberhub/nmap-basics-lab:latest .

# Lancer le container
docker run -d --name nmap-lab \
  -p 22:22 \
  -p 80:80 \
  -p 8080:8080 \
  -p 9999:9999 \
  -p 5900:5900 \
  cyberhub/nmap-basics-lab:latest

# Accès VNC
# Host: localhost:5900
# Password: cyberhub
```

## Accès étudiant

- **SSH** : `ssh student@<ip>` (password: cyberhub2024)
- **VNC** : Port 5900, password: cyberhub

## Commandes pour trouver les flags

```bash
# Scanner les ports
nmap -sV -p- <target>

# Récupérer le flag Apache
curl http://<target>/ | grep FLAG

# Trouver le répertoire caché
curl http://<target>/secret/flag.txt

# Récupérer le flag Nginx
curl http://<target>:8080/ | grep FLAG

# Récupérer le flag du service secret
nc <target> 9999
```
