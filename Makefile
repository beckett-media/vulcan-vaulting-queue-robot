docker:
	cd vaulting && npm run build
	docker build -t vaulting-api:1.0.0 -f docker/vaulting.api.dockerfile .

clean:
	rm -rf vaulting/node_modules
	rm -rf vaulting/package-lock.json
	rm -rf vaulting/dist

install:
	cd vaulting && yarn install;

run:
	cd vaulting && npm run start;

.PHONY: docker install run
