import { RUNTIME_ENV } from '../config/configuration';

export function check_env() {
  return true;
  if (process.env[RUNTIME_ENV] == 'prod') {
    if (
      process.env.DB_PROD_USERNAME &&
      process.env.DB_PROD_PASSWORD &&
      process.env.BECKETT_RELAYER_STAGE_API_KEY &&
      process.env.ECKETT_RELAYER_STAGE_API_SECRET &&
      process.env.BECKETT_RELAYER_PROD_MINT_API_KEY &&
      process.env.ECKETT_RELAYER_PROD_MINT_API_SECRET &&
      process.env.BECKETT_RELAYER_PROD_LOCK_API_KEY &&
      process.env.ECKETT_RELAYER_PROD_LOCK_API_SECRET &&
      process.env.BECKETT_RELAYER_PROD_BURN_API_KEY &&
      process.env.ECKETT_RELAYER_PROD_BURN_API_SECRET &&
      process.env.BECKETT_AUTOTASK_SHARED_SECRET_PROD &&
      process.env.PINATA_PROD_API_KEY &&
      process.env.PINATA_PROD_API_SECRET &&
      process.env.PINATA_PROD_JWT
    ) {
      return true;
    } else {
      return false;
    }
  } else {
    return true;
  }
}
