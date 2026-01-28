# CyberHub - Nmap Basics Lab
# Container d'entraînement pour l'exercice de scan Nmap

FROM ubuntu:22.04

LABEL maintainer="CyberHub Team"
LABEL description="Lab d'entraînement Nmap avec services vulnérables"

# Éviter les prompts interactifs
ENV DEBIAN_FRONTEND=noninteractive

# Installer les services et outils
RUN apt-get update && apt-get install -y \
    # Services à scanner
    openssh-server \
    apache2 \
    nginx \
    mysql-server \
    vsftpd \
    # Outils pour l'étudiant
    nmap \
    netcat-openbsd \
    curl \
    wget \
    vim \
    net-tools \
    iputils-ping \
    # VNC pour accès graphique
    xfce4 \
    xfce4-goodies \
    tightvncserver \
    dbus-x11 \
    # Python pour services custom
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Créer l'utilisateur étudiant
RUN useradd -m -s /bin/bash student && \
    echo "student:cyberhub2024" | chpasswd && \
    usermod -aG sudo student

# Configurer SSH
RUN mkdir /var/run/sshd && \
    echo 'PermitRootLogin no' >> /etc/ssh/sshd_config && \
    echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config

# Configurer Apache avec un flag caché
RUN echo '<html><head><title>CyberHub Target</title></head><body>' > /var/www/html/index.html && \
    echo '<h1>Welcome to CyberHub Target Server</h1>' >> /var/www/html/index.html && \
    echo '<p>This server is part of the Nmap training exercise.</p>' >> /var/www/html/index.html && \
    echo '<!-- FLAG{apache_found_80} -->' >> /var/www/html/index.html && \
    echo '</body></html>' >> /var/www/html/index.html

# Créer une page secrète
RUN mkdir -p /var/www/html/secret && \
    echo 'FLAG{hidden_directory_found}' > /var/www/html/secret/flag.txt

# Configurer Nginx sur un port alternatif avec un flag
RUN echo 'server { listen 8080; root /var/www/nginx; index index.html; }' > /etc/nginx/sites-available/default && \
    mkdir -p /var/www/nginx && \
    echo '<html><body><h1>Nginx Server</h1><!-- FLAG{nginx_8080_secret} --></body></html>' > /var/www/nginx/index.html

# Service Python sur port 9999 avec flag
RUN mkdir -p /opt/services && \
    echo '#!/usr/bin/env python3' > /opt/services/secret_service.py && \
    echo 'import socket' >> /opt/services/secret_service.py && \
    echo 's = socket.socket(socket.AF_INET, socket.SOCK_STREAM)' >> /opt/services/secret_service.py && \
    echo 's.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)' >> /opt/services/secret_service.py && \
    echo 's.bind(("0.0.0.0", 9999))' >> /opt/services/secret_service.py && \
    echo 's.listen(1)' >> /opt/services/secret_service.py && \
    echo 'print("Secret service running on port 9999")' >> /opt/services/secret_service.py && \
    echo 'while True:' >> /opt/services/secret_service.py && \
    echo '    conn, addr = s.accept()' >> /opt/services/secret_service.py && \
    echo '    conn.send(b"Welcome to the secret service!\\nFLAG{secret_port_9999}\\n")' >> /opt/services/secret_service.py && \
    echo '    conn.close()' >> /opt/services/secret_service.py && \
    chmod +x /opt/services/secret_service.py

# Script de démarrage
COPY startup.sh /opt/startup.sh
RUN chmod +x /opt/startup.sh

# Exposer les ports
EXPOSE 22 80 443 3306 8080 9999 5900

# Démarrer les services
CMD ["/opt/startup.sh"]
