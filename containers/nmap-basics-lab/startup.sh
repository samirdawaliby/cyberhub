#!/bin/bash
# CyberHub - Nmap Basics Lab Startup Script

echo "=========================================="
echo "   CyberHub - Nmap Training Lab"
echo "=========================================="

# Démarrer SSH
echo "[+] Starting SSH server..."
service ssh start

# Démarrer Apache
echo "[+] Starting Apache on port 80..."
service apache2 start

# Démarrer Nginx
echo "[+] Starting Nginx on port 8080..."
service nginx start

# Démarrer MySQL
echo "[+] Starting MySQL on port 3306..."
service mysql start

# Démarrer le service secret Python
echo "[+] Starting secret service on port 9999..."
python3 /opt/services/secret_service.py &

# Démarrer VNC pour accès graphique
echo "[+] Setting up VNC server..."
mkdir -p /home/student/.vnc
echo "cyberhub" | vncpasswd -f > /home/student/.vnc/passwd
chmod 600 /home/student/.vnc/passwd
chown -R student:student /home/student/.vnc

# Créer le fichier xstartup pour VNC
cat > /home/student/.vnc/xstartup << 'EOF'
#!/bin/bash
xrdb $HOME/.Xresources
startxfce4 &
EOF
chmod +x /home/student/.vnc/xstartup
chown student:student /home/student/.vnc/xstartup

# Démarrer VNC en tant qu'utilisateur student
su - student -c "vncserver :1 -geometry 1280x800 -depth 24" || true

echo ""
echo "=========================================="
echo "   Lab is ready!"
echo "=========================================="
echo ""
echo "Services running:"
echo "  - SSH:    port 22"
echo "  - HTTP:   port 80 (Apache)"
echo "  - HTTPS:  port 443"
echo "  - MySQL:  port 3306"
echo "  - HTTP:   port 8080 (Nginx)"
echo "  - Secret: port 9999"
echo "  - VNC:    port 5900"
echo ""
echo "Credentials:"
echo "  - SSH/VNC User: student"
echo "  - SSH/VNC Pass: cyberhub2024"
echo ""
echo "Your mission: Find all the hidden flags!"
echo "=========================================="

# Garder le container actif
tail -f /dev/null
