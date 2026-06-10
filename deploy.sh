#!/usr/bin/env bash
# ─── RentaWay Maroc — Script de déploiement ─────────────────
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# Couleurs
G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'; N='\033[0m'

step()  { echo -e "${G}➜${N} $1"; }
warn()  { echo -e "${Y}⚠${N}  $1"; }
fatal() { echo -e "${R}✖${N} $1" >&2; exit 1; }

[[ -f "$ENV_FILE" ]] || fatal "$ENV_FILE introuvable. Copie .env.production.template → $ENV_FILE et remplis les valeurs."

if grep -q "REMPLIR\|CHANGE_ME" "$ENV_FILE"; then
  fatal "$ENV_FILE contient encore des placeholders (REMPLIR / CHANGE_ME). Remplis-les avant de déployer."
fi

command -v docker >/dev/null || fatal "Docker non installé. Voir DEPLOIEMENT.md."

echo -e "${G}🚀 Déploiement RentaWay Maroc${N}"
echo "   Compose : $COMPOSE_FILE"
echo "   Env     : $ENV_FILE"
echo

step "Pull des dernières modifications"
git pull origin main || warn "git pull a échoué (pas un repo ? on continue)"

step "Arrêt des conteneurs en cours"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --remove-orphans

step "Build des images (cache invalidé)"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache

step "Démarrage des services"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

step "Attente du backend (max 90s)"
for i in {1..30}; do
  if docker compose -f "$COMPOSE_FILE" exec -T backend wget -qO- http://localhost:4000/health >/dev/null 2>&1; then
    echo "   ✓ Backend OK"
    break
  fi
  sleep 3
  [[ $i -eq 30 ]] && fatal "Backend n'est pas en ligne — voir 'npm run logs'"
done

step "Migration base de données"
docker compose -f "$COMPOSE_FILE" exec -T backend npx prisma migrate deploy

step "Nettoyage des images dangling"
docker image prune -f >/dev/null

echo
echo -e "${G}✅ Déploiement terminé !${N}"
echo "   🌐 Frontend : https://rentaway.ma"
echo "   🔌 API      : https://api.rentaway.ma/health"
echo "   📊 Logs     : npm run logs"
