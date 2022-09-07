uncommitted = $(shell git update-index --refresh)
beckett_vaulting_head = $(shell git rev-parse HEAD | cut -c 1-8)
beckett_vaulting_branch = $(shell git rev-parse --abbrev-ref HEAD)
timestamp = $(shell date '+%Y%m%d')

docker:
ifeq ($(uncommitted),)
	cd vaulting && npm run build
	docker build -t vaulting-api:$(beckett_vaulting_branch)-$(timestamp)-$(beckett_vaulting_head) -f docker/vaulting.api.dockerfile .
else
	@echo "Uncommitted changes detected: $(uncommitted)"
	exit 1
endif

clean:
	rm -rf vaulting/node_modules
	rm -rf vaulting/dist

install:
	cd vaulting && npm install;

run:
	cd vaulting && npm run start;

.PHONY: docker install run
