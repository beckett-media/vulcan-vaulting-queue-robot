export default () => ({
  prod: {
    api_port: 5000,
    webhook_port: 5001,
    redis: {
      host: 'localhost',
      port: 6379,
    },
    queue: {
      mint: 'beckett_mint_prod',
      burn: 'beckett_burn_prod',
      limiter: { max: 1, duration: 10 },
    },
    db: {
      name: 'beckett_db_prod.sqlite',
      sync: false,
    },
    blockchain: {
      tx_config: {},
    },
    min_token_id: 1,
    network_mint_relayer: 'polygon_prod_mint',
    pinata: 'prod',
    webhook_shared_secret: process.env.BECKETT_AUTOTASK_SHARED_SECRET,
  },
  stage: {
    api_port: 4000,
    webhook_port: 4001,
    redis: {
      host: 'localhost',
      port: 6379,
    },
    queue: {
      mint: 'beckett_mint_stage',
      burn: 'beckett_burn_stage',
      limiter: { max: 1, duration: 10 },
    },
    db: {
      name: 'beckett_db_stage.sqlite',
      sync: false,
    },
    blockchain: {
      tx_config: {},
    },
    min_token_id: 1,
    network_mint_relayer: 'polygon_stage',
    pinata: 'stage',
    webhook_shared_secret: process.env.BECKETT_AUTOTASK_SHARED_SECRET,
  },
  awsdev: {
    api_port: 3000,
    webhook_port: 3001,
    redis: {
      host: 'localhost',
      port: 6379,
    },
    queue: {
      mint: 'beckett_mint_dev',
      burn: 'beckett_burn_dev',
      limiter: { max: 1, duration: 10 },
    },
    db: {
      name: 'beckett_dev',
      sync: false,
      host: 'vaulting-api-dev-stage.cluster-cgq6lc7ttzjk.us-west-1.rds.amazonaws.com',
      port: 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
    },
    blockchain: {
      tx_config: {},
    },
    min_token_id: 1000000,
    network_mint_relayer: 'mumbai',
    pinata: 'dev',
    retrieval_manager: '0x49c2376F01016362e41F23170ca2DB668C7f3b34',
    webhook_shared_secret: process.env.BECKETT_AUTOTASK_SHARED_SECRET,
  },
  dev: {
    api_port: 3000,
    webhook_port: 3001,
    redis: {
      host: 'localhost',
      port: 6379,
    },
    queue: {
      mint: 'beckett_mint_dev',
      burn: 'beckett_burn_dev',
      limiter: { max: 1, duration: 10 },
    },
    db: {
      name: 'beckett_db_dev.sqlite',
      sync: true,
    },
    blockchain: {
      tx_config: {},
    },
    min_token_id: 1,
    network_mint_relayer: 'mumbai',
    pinata: 'dev',
    retrieval_manager: '0x49c2376F01016362e41F23170ca2DB668C7f3b34',
    webhook_shared_secret: process.env.BECKETT_AUTOTASK_SHARED_SECRET,
  },
});
