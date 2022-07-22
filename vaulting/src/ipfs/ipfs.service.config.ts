export module serviceConfig {
  export const Pinata = {
    dev: {
      apiKey: process.env.VAULTING_DEV_PINATA_API_KEY,
      apiSecret: process.env.VAULTING_DEV_PINATA_API_SECRET,
    },
    awsdev: {
      apiKey: process.env.VAULTING_AWSDEV_PINATA_API_KEY,
      apiSecret: process.env.VAULTING_AWSDEV_PINATA_API_SECRET,
    },
    stage: {
      apiKey: process.env.VAULTING_AWSDEV_PINATA_API_KEY,
      apiSecret: process.env.VAULTING_AWSDEV_PINATA_API_SECRET,
    },
    prod: {
      apiKey: process.env.PINATA_PROD_API_KEY,
      apiSecret: process.env.PINATA_PROD_API_SECRET,
      jwt: process.env.PINATA_PROD_JWT,
    },
  };
}
