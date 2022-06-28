export enum SubmissionStatus {
  Failed = 0,
  Submitted = 1,
  Received = 2,
  Rejected = 3,
  Minted = 4,
}

export const SubmissionStatusReadable = {
  0: 'Failed',
  1: 'Submitted',
  2: 'Received',
  3: 'Rejected',
  4: 'Minted',
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
