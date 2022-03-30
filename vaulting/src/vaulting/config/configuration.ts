export default () => ({
  prod: {
    port: 3002,
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
    network_mint_relayer: 'polygon_prod_mint',
    pinata: 'prod',
  },
  stage: {
    port: 3001,
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
    network_mint_relayer: 'polygon_stage',
    pinata: 'stage',
  },
  dev: {
    port: 3000,
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
    network_mint_relayer: 'mumbai',
    pinata: 'dev',
    retrieval_manager: '0x49c2376F01016362e41F23170ca2DB668C7f3b34',
  },
});
