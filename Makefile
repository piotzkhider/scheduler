run:
	node -r dotenv/config app.js
.PHONY: run

serve:
	ssh -R 80:localhost:3000 serveo.net
.PHONY: serve
