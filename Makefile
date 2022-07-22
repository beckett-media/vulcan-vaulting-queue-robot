docker:
	docker build -t vaulting-api:1.0.0 -f docker/vaulting.api.dockerfile .

clean:
	rm -rf vaulting/node_modules
	rm -rf vaulting/package-lock.json

install:
	cd vaulting
	yarn install

.PHONY: docker