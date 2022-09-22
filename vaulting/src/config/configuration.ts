export default () => ({
  prod: {
    api_port: process.env.VAULTING_PROD_API_PORT,
    webhook_port: process.env.VAULTING_PROD_WEBHOOK_PORT,
    blockchain: {
      tx_config: {},
      mint_relayer: 'polygon_prod_mint',
      lock_relayer: 'polygon_prod_lock',
      burn_relayer: 'polygon_prod_burn',
      readonly_relayer: 'polygon_prod_readonly',
    },
    db: {
      name: process.env.VAULTING_PROD_DB_NAME,
      sync: false,
      host: process.env.VAULTING_PROD_DB_HOST,
      port: process.env.VAULTING_PROD_DB_PORT,
      username: process.env.VAULTING_PROD_DB_USERNAME,
      password: process.env.VAULTING_PROD_DB_PASSWORD,
    },
    marketplace: {
      mint: {
        callback_url: process.env.VAULTING_PROD_MARKETPLACE_MINT_URL,
        headers: { 'Content-Type': 'application/json' },
      },
      burn: {
        callback_url: process.env.VAULTING_PROD_MARKETPLACE_BURN_URL,
        headers: { 'Content-Type': 'application/json' },
      },
    },
    queue: {
      mint: '{vaulting_mint_prod}',
      burn: '{vaulting_burn_prod}',
      lock: '{vaulting_lock_prod}',
      exec: '{vaulting_exec_prod}',
      limiter: { max: 1, duration: 10 },
    },
    redis: {
      host: process.env.VAULTING_PROD_REDIS_HOST,
      port: process.env.VAULTING_PROD_REDIS_PORT,
      enableTLS: true,
    },
    min_token_id: process.env.VAULTING_PROD_MIN_TOKEN_ID,
    pinata: 'prod',
    webhook_shared_secret:
      process.env.VAULTING_PROD_AUTOTASK_SHARED_SECRET_PROD,
    check_palantir_request_auth: true,
  },
  stage: {
    api_port: process.env.VAULTING_STAGE_API_PORT,
    webhook_port: process.env.VAULTING_STAGE_WEBHOOK_PORT,
    blockchain: {
      tx_config: {},
      mint_relayer: 'mumbai',
      lock_relayer: 'mumbai',
      burn_relayer: 'mumbai',
      readonly_relayer: 'mumbai',
    },
    db: {
      name: process.env.VAULTING_STAGE_DB_NAME,
      sync: true,
      host: process.env.VAULTING_STAGE_DB_HOST,
      port: process.env.VAULTING_STAGE_DB_PORT,
      username: process.env.VAULTING_STAGE_DB_USERNAME,
      password: process.env.VAULTING_STAGE_DB_PASSWORD,
    },
    marketplace: {
      mint: {
        callback_url: process.env.VAULTING_STAGE_MARKETPLACE_MINT_URL,
        headers: { 'Content-Type': 'application/json' },
      },
      burn: {
        callback_url: process.env.VAULTING_STAGE_MARKETPLACE_BURN_URL,
        headers: { 'Content-Type': 'application/json' },
      },
    },
    queue: {
      mint: '{beckett_mint_stage}',
      burn: '{beckett_burn_stage}',
      lock: '{beckett_lock_stage}',
      exec: '{beckett_exec_stage}',
      limiter: { max: 1, duration: 10 },
    },
    redis: {
      host: process.env.VAULTING_STAGE_REDIS_HOST,
      port: process.env.VAULTING_STAGE_REDIS_PORT,
      enableTLS: true,
    },
    min_token_id: process.env.VAULTING_STAGE_MIN_TOKEN_ID,
    pinata: 'stage',
    webhook_shared_secret: process.env.VAULTING_STAGE_AUTOTASK_SHARED_SECRET,
    check_palantir_request_auth: false,
  },
  awsdev: {
    api_port: process.env.VAULTING_AWSDEV_API_PORT,
    webhook_port: process.env.VAULTING_AWSDEV_WEBHOOK_PORT,
    blockchain: {
      tx_config: {},
      mint_relayer: 'mumbai',
      lock_relayer: 'mumbai',
      burn_relayer: 'mumbai',
      readonly_relayer: 'mumbai',
    },
    db: {
      name: process.env.VAULTING_AWSDEV_DB_NAME,
      sync: true,
      host: process.env.VAULTING_AWSDEV_DB_HOST,
      port: process.env.VAULTING_AWSDEV_DB_PORT,
      username: process.env.VAULTING_AWSDEV_DB_USERNAME,
      password: process.env.VAULTING_AWSDEV_DB_PASSWORD,
    },
    marketplace: {
      mint: {
        callback_url: process.env.VAULTING_AWSDEV_MARKETPLACE_MINT_URL,
        headers: { 'Content-Type': 'application/json' },
      },
      burn: {
        callback_url: process.env.VAULTING_AWSDEV_MARKETPLACE_BURN_URL,
        headers: { 'Content-Type': 'application/json' },
      },
    },
    queue: {
      mint: '{beckett_mint_awsdev}',
      burn: '{beckett_burn_awsdev}',
      lock: '{beckett_lock_awsdev}',
      exec: '{beckett_exec_awsdev}',
      limiter: { max: 1, duration: 10 },
    },
    redis: {
      host: process.env.VAULTING_AWSDEV_REDIS_HOST,
      port: process.env.VAULTING_AWSDEV_REDIS_PORT,
      enableTLS: true,
    },
    min_token_id: process.env.VAULTING_AWSDEV_MIN_TOKEN_ID,
    pinata: 'dev',
    webhook_shared_secret: process.env.VAULTING_AWSDEV_AUTOTASK_SHARED_SECRET,
    check_palantir_request_auth: false,
  },
  dev: {
    api_port: process.env.VAULTING_DEV_API_PORT,
    webhook_port: process.env.VAULTING_DEV_WEBHOOK_PORT,
    blockchain: {
      tx_config: {},
      mint_relayer: 'mumbai',
      lock_relayer: 'mumbai',
      burn_relayer: 'mumbai',
      readonly_relayer: 'mumbai',
    },
    db: {
      name: process.env.VAULTING_DEV_DB_NAME,
      sync: true,
      host: process.env.VAULTING_DEV_DB_HOST,
      port: process.env.VAULTING_DEV_DB_PORT,
    },
    marketplace: {
      mint: {
        callback_url: process.env.VAULTING_DEV_MARKETPLACE_MINT_URL,
        headers: { 'Content-Type': 'application/json' },
      },
      burn: {
        callback_url: process.env.VAULTING_DEV_MARKETPLACE_BURN_URL,
        headers: { 'Content-Type': 'application/json' },
      },
    },
    queue: {
      mint: '{beckett_mint_dev}',
      burn: '{beckett_burn_dev}',
      lock: '{beckett_lock_dev}',
      exec: '{beckett_exec_dev}',
      limiter: { max: 1, duration: 10 },
    },
    redis: {
      host: process.env.VAULTING_DEV_REDIS_HOST,
      port: process.env.VAULTING_DEV_REDIS_PORT,
      enableTLS: false,
    },
    min_token_id: process.env.VAULTING_DEV_MIN_TOKEN_ID,
    pinata: 'dev',
    webhook_shared_secret: process.env.VAULTING_DEV_AUTOTASK_SHARED_SECRET,
    check_palantir_request_auth: false,
  },
  test: {
    api_port: 3000,
    webhook_port: 3001,
    blockchain: {
      tx_config: {},
      mint_relayer: 'NOTUSED',
      lock_relayer: 'NOTUSED',
      burn_relayer: 'NOTUSED',
      readonly_relayer: 'NOTUSED',
    },
    db: {
      name: 'beckett_db_test.sqlite',
      sync: true,
      host: 'N/A',
      port: 'N/A',
    },
    marketplace: {
      mint: {
        callback_url: 'NOTUSED',
        headers: { 'Content-Type': 'application/json' },
      },
      burn: {
        callback_url: 'NOTUSED',
        headers: { 'Content-Type': 'application/json' },
      },
    },
    queue: {
      mint: '{beckett_mint_test}',
      burn: '{beckett_burn_test}',
      lock: '{beckett_lock_test}',
      exec: '{beckett_exec_test}',
      limiter: { max: 1, duration: 10 },
    },
    redis: {
      host: 'NOTUSED',
      port: 'NOTUSED',
      enableTLS: false,
    },
    min_token_id: 1,
    pinata: 'NOTUSED',
    webhook_shared_secret: 'NOTUSED',
    check_palantir_request_auth: false,
  },
});

export function redisConfig(config) {
  if (config['redis']['enableTLS']) {
    return {
      redis: {
        host: config['redis']['host'],
        port: config['redis']['port'],
        tls: {},
      },
    };
  } else {
    return {
      redis: {
        host: config['redis']['host'],
        port: config['redis']['port'],
      },
    };
  }
}

export const RUNTIME_ENV = 'VAULTING_RUNTIME';
export const BECKETT_DUMMY_QUEUE = '{beckett_dummy}';
