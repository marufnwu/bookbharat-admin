deploy:
	docker compose build admin
	docker compose up -d admin
