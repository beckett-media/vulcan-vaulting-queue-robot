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
