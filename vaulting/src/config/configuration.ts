export default () => ({
  prod: {
    api_port: process.env.VAULTING_PROD_API_PORT || 5000,
    webhook_port: process.env.VAULTING_PROD_WEBHOOK_PORT || 5001,
    blockchain: {
      tx_config: {},
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
        url:
          process.env.VAULTING_PROD_MARKETPLACE_MINT_URL ||
          'http://localhost:3300/marketplace/vaulting',
        headers: { 'Content-Type': 'application/json' },
      },
      burn: {
        url:
          process.env.VAULTING_PROD_MARKETPLACE_BURN_URL ||
          'http://localhost:3300/marketplace/vaulting',
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
    },
    min_token_id: process.env.VAULTING_PROD_MIN_TOKEN_ID || 1,
    network_mint_relayer: 'polygon_prod_mint',
    network_lock_relayer: 'polygon_prod_lock',
    network_burn_relayer: 'polygon_prod_burn',
    pinata: 'prod',
    webhook_shared_secret:
      process.env.VAULTING_PROD_AUTOTASK_SHARED_SECRET_PROD,
    check_palantir_request_auth: true,
  },
  stage: {
    api_port: process.env.VAULTING_STAGE_API_PORT || 4000,
    webhook_port: process.env.VAULTING_STAGE_WEBHOOK_PORT || 4001,
    blockchain: {
      tx_config: {},
    },
    db: {
      name: process.env.VAULTING_STAGE_DB_NAME,
      sync: false,
      host: process.env.VAULTING_STAGE_DB_HOST,
      port: process.env.VAULTING_STAGE_DB_PORT,
      username: process.env.VAULTING_STAGE_DB_USERNAME,
      password: process.env.VAULTING_STAGE_DB_PASSWORD,
    },
    marketplace: {
      mint: {
        url:
          process.env.VAULTING_STAGE_MARKETPLACE_MINT_URL ||
          'http://localhost:3300/marketplace/vaulting',
        headers: { 'Content-Type': 'application/json' },
      },
      burn: {
        url:
          process.env.VAULTING_STAGE_MARKETPLACE_BURN_URL ||
          'http://localhost:3300/marketplace/vaulting',
        headers: { 'Content-Type': 'application/json' },
      },
    },
    queue: {
      mint: '{beckett_mint_prod}',
      burn: '{beckett_burn_prod}',
      lock: '{beckett_lock_prod}',
      exec: '{beckett_exec_prod}',
      limiter: { max: 1, duration: 10 },
    },
    redis: {
      host: process.env.VAULTING_STAGE_REDIS_HOST,
      port: process.env.VAULTING_STAGE_REDIS_PORT,
    },
    min_token_id: process.env.VAULTING_STAGE_MIN_TOKEN_ID || 1,
    network_mint_relayer: 'polygon_stage',
    pinata: 'stage',
    webhook_shared_secret: process.env.VAULTING_STAGE_AUTOTASK_SHARED_SECRET,
    check_palantir_request_auth: false,
  },
  awsdev: {
    api_port: process.env.VAULTING_AWSDEV_API_PORT || 3000,
    webhook_port: process.env.VAULTING_AWSDEV_WEBHOOK_PORT || 3001,
    blockchain: {
      tx_config: {},
    },
    db: {
      name: process.env.VAULTING_AWSDEV_DB_NAME || 'beckett_dev',
      sync: true,
      host:
        process.env.VAULTING_AWSDEV_DB_HOST ||
        'vaulting-api-dev-stage.cluster-cgq6lc7ttzjk.us-west-1.rds.amazonaws.com',
      port: process.env.VAULTING_AWSDEV_DB_PORT || 3306,
      username: process.env.VAULTING_AWSDEV_DB_USERNAME,
      password: process.env.VAULTING_AWSDEV_DB_PASSWORD,
    },
    marketplace: {
      mint: {
        url:
          process.env.VAULTING_AWSDEV_MARKETPLACE_MINT_URL ||
          'https://dev.beckett.com:3300/marketplace/vaulting',
        headers: { 'Content-Type': 'application/json' },
      },
      burn: {
        url:
          process.env.VAULTING_AWSDEV_MARKETPLACE_BURN_URL ||
          'https://dev.beckett.com:3300/marketplace/vaulting',
        headers: { 'Content-Type': 'application/json' },
      },
    },
    queue: {
      mint: '{beckett_mint_prod}',
      burn: '{beckett_burn_prod}',
      lock: '{beckett_lock_prod}',
      exec: '{beckett_exec_prod}',
      limiter: { max: 1, duration: 10 },
    },
    redis: {
      host:
        process.env.VAULTING_AWSDEV_REDIS_HOST ||
        'clustercfg.vaulting-redis-cluster.qux2cn.memorydb.us-west-1.amazonaws.com',
      port: process.env.VAULTING_AWSDEV_REDIS_PORT || 6379,
      enableTLS: true,
    },
    min_token_id: process.env.VAULTING_AWSDEV_MIN_TOKEN_ID || 1000000,
    network_mint_relayer: 'mumbai',
    pinata: 'dev',
    webhook_shared_secret: process.env.VAULTING_AWSDEV_AUTOTASK_SHARED_SECRET,
    check_palantir_request_auth: false,
  },
  dev: {
    api_port: process.env.VAULTING_DEV_API_PORT || 3000,
    webhook_port: process.env.VAULTING_DEV_WEBHOOK_PORT || 3001,
    blockchain: {
      tx_config: {},
    },
    db: {
      name: process.env.VAULTING_DEV_DB_NAME || 'beckett_db_dev.sqlite',
      sync: true,
    },
    marketplace: {
      mint: {
        url:
          process.env.VAULTING_DEV_MARKETPLACE_MINT_URL ||
          'http://localhost:3300/marketplace/vaulting',
        headers: { 'Content-Type': 'application/json' },
      },
      burn: {
        url:
          process.env.VAULTING_DEV_MARKETPLACE_BURN_URL ||
          'http://localhost:3300/marketplace/vaulting',
        headers: { 'Content-Type': 'application/json' },
      },
    },
    queue: {
      mint: '{beckett_mint_prod}',
      burn: '{beckett_burn_prod}',
      lock: '{beckett_lock_prod}',
      exec: '{beckett_exec_prod}',
      limiter: { max: 1, duration: 10 },
    },
    redis: {
      host: process.env.VAULTING_DEV_REDIS_HOST || 'localhost',
      port: process.env.VAULTING_DEV_REDIS_PORT || 6379,
      enableTLS: false,
    },
    min_token_id: process.env.VAULTING_DEV_MIN_TOKEN_ID || 1,
    network_mint_relayer: 'mumbai',
    pinata: 'dev',
    webhook_shared_secret: process.env.VAULTING_DEV_AUTOTASK_SHARED_SECRET,
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
