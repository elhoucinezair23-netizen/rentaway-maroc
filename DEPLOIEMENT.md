# Déployer RentaWay Maroc sur un VPS

Guide complet pour mettre la plateforme en production sur un serveur Linux avec un domaine + HTTPS.

---

## 1. Prérequis serveur

| | Minimum | Recommandé |
|---|---|---|
| OS  | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| CPU | 2 vCPU           | 4 vCPU           |
| RAM | 4 GB             | 8 GB             |
| SSD | 40 GB            | 80 GB            |

Un domaine pointé vers l'IP du serveur (enregistrements DNS A) :
- `rentaway.ma`     → IP serveur
- `www.rentaway.ma` → IP serveur
- `api.rentaway.ma` → IP serveur

### Hébergeurs recommandés (Maroc)

| Hébergeur    | Tarif        | Note |
|--------------|--------------|------|
| OVH France   | ~15€/mois    | Faible latence depuis le Maroc, support FR |
| Hostinger VPS| ~8€/mois     | Bon rapport qualité/prix |
| Contabo      | ~6€/mois     | Le moins cher, qualité correcte |

---

## 2. Installation du serveur

```bash
# Connexion en root puis création d'un user
ssh root@TON_IP
adduser deploy
usermod -aG sudo deploy
su - deploy

# Docker + Docker Compose
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# Outils utiles
sudo apt update && sudo apt install -y git ufw certbot

# Firewall : autoriser SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 3. Récupération du projet

```bash
cd /opt
sudo git clone https://github.com/TON-COMPTE/rentaway.git
sudo chown -R $USER:$USER rentaway
cd rentaway
```

---

## 4. Configuration des secrets

```bash
cp .env.production.template .env.production
nano .env.production
```

**Remplir TOUTES les valeurs marquées `REMPLIR` :**

```bash
# Générer les secrets aléatoires
openssl rand -base64 32   # → JWT_SECRET
openssl rand -base64 32   # → NEXTAUTH_SECRET
openssl rand -base64 32   # → POSTGRES_PASSWORD
```

Puis renseigner :
- `DATABASE_URL` avec le `POSTGRES_PASSWORD` choisi
- Clés Stripe (mode **live** uniquement en prod) — https://dashboard.stripe.com/apikeys
- Clés Google OAuth — https://console.cloud.google.com
- Clé Google Maps — https://console.cloud.google.com
- Clé Unsplash — https://unsplash.com/developers
- Credentials SMTP (Gmail App Password, SendGrid, etc.)
- Credentials Cloudinary — https://cloudinary.com/console

⚠️ **JAMAIS commit `.env.production` sur GitHub.** Il est dans `.gitignore`.

---

## 5. Certificat SSL (Let's Encrypt — gratuit)

```bash
# Stopper si Nginx tourne déjà
sudo systemctl stop nginx 2>/dev/null || true

# Obtenir le certificat
sudo certbot certonly --standalone \
  -d rentaway.ma \
  -d www.rentaway.ma \
  -d api.rentaway.ma \
  --email admin@rentaway.ma \
  --agree-tos --no-eff-email

# Copier les certificats là où Docker Nginx les attend
mkdir -p ssl
sudo cp /etc/letsencrypt/live/rentaway.ma/fullchain.pem ./ssl/rentaway.ma.crt
sudo cp /etc/letsencrypt/live/rentaway.ma/privkey.pem  ./ssl/rentaway.ma.key
sudo chown $USER:$USER ssl/*

# Renouvellement automatique (cron) — relancera nginx après renew
echo "0 3 * * * cd /opt/rentaway && sudo certbot renew --quiet --post-hook 'docker compose -f docker-compose.prod.yml restart nginx'" | sudo crontab -
```

---

## 6. Premier déploiement

```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Lancer le déploiement
bash deploy.sh
```

Le script :
1. Vérifie que `.env.production` est rempli
2. `git pull origin main`
3. `docker compose down` puis `build --no-cache`
4. `docker compose up -d`
5. Lance `prisma migrate deploy`
6. Affiche les URLs finales

---

## 7. Vérifications post-déploiement

```bash
# Statut des services
docker compose -f docker-compose.prod.yml ps

# Logs en temps réel
npm run logs

# Test des URLs
curl -I https://rentaway.ma
curl    https://api.rentaway.ma/health
```

---

## 8. Opérations courantes

| Commande                           | Description |
|------------------------------------|-------------|
| `npm run deploy`                   | Redéployer après un `git push` |
| `npm run logs`                     | Tous les logs (Ctrl-C pour quitter) |
| `npm run logs:backend`             | Logs API seule |
| `npm run db:migrate`               | Appliquer une nouvelle migration Prisma |
| `npm run db:seed:demo`             | Peupler le catalogue démo |
| `npm run db:backup`                | Sauvegarde Postgres → `backups/AAAAMMJJ_HHMMSS.sql` |
| `npm run db:shell`                 | Ouvrir `psql` sur la DB |
| `npm run restart`                  | Redémarrer tous les services |
| `npm run down`                     | Tout arrêter |

---

## 9. Sauvegardes automatiques (cron quotidien)

```bash
mkdir -p /opt/rentaway/backups

# Ajouter au crontab : backup à 4h, rotation 7 jours
crontab -e
```

```cron
0 4 * * * cd /opt/rentaway && npm run db:backup && find backups/ -name "*.sql" -mtime +7 -delete
```

---

## 10. Mise à jour du code

```bash
cd /opt/rentaway
git pull origin main
npm run deploy
```

Le hook `deploy.sh` rebuild et relance proprement (zero-downtime via `restart: always`).

---

## 11. Sécurité — Checklist

- [x] `.env.production` dans `.gitignore`
- [x] Postgres exposé uniquement sur réseau interne Docker (pas de port 5432 public)
- [x] Helmet + CORS multi-origines stricte côté Express
- [x] Rate limit global (100 req/min/IP) + brute-force `/api/auth` (5 essais/min/IP)
- [x] HSTS + headers de sécurité dans Nginx
- [x] TLS 1.2/1.3 uniquement, ciphers HIGH
- [x] User non-root dans les images Docker
- [x] `ufw` ouvre seulement 22/80/443
- [ ] **À faire :** activer 2FA sur le compte hébergeur + GitHub
- [ ] **À faire :** clé SSH + `PasswordAuthentication no` dans `/etc/ssh/sshd_config`
- [ ] **À faire :** Stripe webhooks vérifiés via `STRIPE_WEBHOOK_SECRET`

---

## 12. Dépannage rapide

**Le site ne répond pas après deploy** → `npm run logs:nginx` ; vérifier que les certificats SSL sont bien dans `ssl/`.

**Backend en boucle de restart** → `npm run logs:backend` ; généralement `DATABASE_URL` invalide ou migration échouée.

**Frontend affiche les anciennes données** → cache Next.js. `npm run rebuild` force la reconstruction.

**Erreur CORS depuis le frontend** → vérifier `ALLOWED_ORIGINS` dans `.env.production` (doit contenir l'URL exacte avec/sans `www`).

---

## 13. Test local de la stack production (avant push)

Sur Mac/Windows avec Docker Desktop :

```bash
# Copier le template
cp .env.production.template .env.production

# Remplir avec des valeurs locales (DATABASE_URL=postgres://...:postgres@postgres:5432/rentaway etc.)
# Lancer
docker compose -f docker-compose.prod.yml --env-file .env.production up --build

# Visiter http://localhost (port 80) — Nginx route vers frontend et backend
```

Note : sans certificats SSL réels, Nginx servira en HTTP uniquement en local. Pour tester HTTPS local, utiliser `mkcert`.
