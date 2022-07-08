export enum SubmissionStatus {
  Failed = 0,
  Submitted = 1,
  Received = 2,
  Rejected = 3,
  Approved = 4,
  Vaulted = 5,
}

export const SubmissionStatusReadable = {
  0: 'Failed',
  1: 'Submitted',
  2: 'Received',
  3: 'Rejected',
  4: 'Approved',
  5: 'Vaulted',
};

export const VaultingStatusReadable = {
  0: 'NotMinted',
  1: 'Minting',
  2: 'Minted',
  3: 'Locking',
  4: 'Locked',
  5: 'Withdrawing',
  6: 'Withdrawn',
};

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
  Mint = 1,
  ToBurn = 2,
  Burn = 3,
}
