export enum MintJobResult {
  JobReceived = 0,
  VaultDuplicated = 1,
  TokenIdSet = 2,
  VaultingSaved = 3,
  TokenStatusSaved = 4,
  ImagePined = 5,
  MetadataPined = 6,
  TxSent = 7,
  TokenMinted = 8,
}

export enum RelayerType {
  Mint = 0,
  Burn = 1,
  Lock = 2,
  Readonly = 3,
}

export enum ContractType {
  ERC721 = 0,
  ERC721Registry = 1,
}

export enum BurnJobResult {
  JobReceived = 0,
  NFTVerified = 1,
  BeckettVerified = 2,
  TxSent = 3,
  TokenBurned = 4,
}

export enum LockJobResult {
  JobReceived = 0,
  LockTxSend = 1,
}

export enum ExecJobResult {
  JobReceived = 0,
  TxSent = 1,
}

export const MintJobResultReadable = {
  0: 'JobReceived',
  1: 'VaultDuplicated',
  2: 'TokenIdSet',
  3: 'VaultingSaved',
  4: 'TokenStatusSaved',
  5: 'ImagePined',
  6: 'MetadataPined',
  7: 'TxSent',
  8: 'TokenMinted',
};

export const BurnJobResultReadable = {
  0: 'JobReceived',
  1: 'NFTExists',
  2: 'BeckettVaultingRecordExists',
  3: 'TxSend',
  4: 'TokenBurned',
};

export const LockJobResultReadable = {
  0: 'JobReceived',
  1: 'HashStoreTxSend',
  2: 'TransferTxSend',
};

export const ExecJobResultReadable = {
  0: 'JobReceived',
  1: 'TxSend',
};

export const TokenStatusReadable = {
  0: 'NotMinted',
  1: 'Minted',
  2: 'Burned',
  3: 'Locked',
  4: 'Minting',
};

export enum TokenStatus {
  NotMinted = 0,
  Minted = 1,
  Burned = 2,
  Locked = 3,
  Minting = 4,
}

/////////////////////////////
// enum from marketplace API

export enum VaultingStatus {
  NotMinted = 0,
  Minting = 1,
  Minted = 2,
  Locking = 3,
  Locked = 4,
  Withdrawing = 5,
  Withdrawn = 6,
}

export enum VaultingUpdateType {
  ToMint = 0,
  Minted = 1,
  ToBurn = 2,
  Burned = 3,
}
