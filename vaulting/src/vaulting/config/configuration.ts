export default () => ({
  prod: {
    port: 3001,
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
  },
});
