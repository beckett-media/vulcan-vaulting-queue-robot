## Install

From the root of the repo directly:

```
make install
```

## Connect to Marketplace API

Since NFT minting & burning operations are async, the vaulting API needs to report to the Marketplace API the result of the operation in a separate API call. \
The following two envs are used to indicate the reporting endpoints for NFT minting and burnning.

```
VAULTING_{DEV}_MARKETPLACE_MINT_URL={http://localhost:3300}/marketplace/vaulting
VAULTING_{DEV}_MARKETPLACE_BURN_URL={http://localhost:3300}/marketplace/vaulting
```

Replace the runtime name(DEV) & domain URL (http://localhost:3000) between {} with the actual value of your deployment.

## Setup envs:

```
export VAULTING_RUNTIME=dev
export VAULTING_DEV_MIN_TOKEN_ID=
export VAULTING_DEV_API_PORT=3000
export VAULTING_DEV_WEBHOOK_PORT=3001
export VAULTING_DEV_DB_NAME=
export VAULTING_DEV_DB_HOST=
export VAULTING_DEV_DB_PORT=
export VAULTING_DEV_DB_USERNAME=
export VAULTING_DEV_DB_PASSWORD=DeVB3ck3ttVault1ng
export VAULTING_DEV_MARKETPLACE_MINT_URL=
export VAULTING_DEV_MARKETPLACE_BURN_URL=
export VAULTING_DEV_REDIS_HOST=
export VAULTING_DEV_REDIS_PORT=
export VAULTING_DEV_MINT_RELAYER_API_KEY=
export VAULTING_DEV_MINT_RELAYER_API_SECRET=
export VAULTING_DEV_LOCK_RELAYER_API_KEY=
export VAULTING_DEV_LOCK_RELAYER_API_SECRET=
export VAULTING_DEV_BURN_RELAYER_API_KEY=
export VAULTING_DEV_BURN_RELAYER_API_SECRET=
export VAULTING_DEV_PINATA_API_KEY=
export VAULTING_DEV_PINATA_API_SECRET=
export VAULTING_DEV_AUTOTASK_SHARED_SECRET=
```

## Run Service:

```
cd vaulting
npm run start:dev
```
