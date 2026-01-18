# BookBharat Admin - Deployment

.PHONY: help build build-push deploy-pull up down logs

# Default Image Name
export IMAGE_NAME ?= marufnwi/bookbharat-admin

help:
	@echo "BookBharat Admin - Deployment Commands:"
	@echo ""
	@echo "  make build-push   - Build local & push to registry"
	@echo "  make deploy-pull  - Pull from registry & restart"
	@echo "  make up           - Start local dev"
	@echo "  make logs         - View logs"

# LOCAL: Build and Push
build-push:
	@echo "🚀 BUILDING & PUSHING Admin Image..."
	@echo "Target: $(IMAGE_NAME):latest"
	@echo ""
	docker compose --env-file .env.production -f docker-compose.yml build admin
	docker compose --env-file .env.production -f docker-compose.yml push admin
	@echo ""
	@echo "✅ Build & Push complete!"

# SERVER: Pull and Deploy
deploy-pull:
	@echo "📥 PULLING & DEPLOYING Admin Image..."
	@echo "Target: $(IMAGE_NAME):latest"
	@echo ""
	docker compose -f docker-compose.yml pull admin
	@echo "🛑 Stopping old container..."
	docker compose -f docker-compose.yml down
	@echo "🚀 Starting new container..."
	docker compose -f docker-compose.yml up -d admin
	@echo ""
	@echo "✅ Deployment complete!"
	@docker compose -f docker-compose.yml ps admin

# Utility commands
up:
	docker compose up -d admin

down:
	docker compose down

logs:
	docker compose logs -f admin
