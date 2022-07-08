import { Item, Submission, Vaulting, User } from 'src/database/database.entity';
import {
  SubmissionStatusReadable,
  VaultingStatusReadable,
} from 'src/config/enum';
import {
  SubmissionDetails,
  VaultingDetails,
} from 'src/marketplace/dtos/marketplace.dto';

export function newSubmissionDetails(
  submission: Submission,
  item: Item,
  user: User,
): SubmissionDetails {
  return new SubmissionDetails({
    id: submission.id,
    user: user.uuid,
    item_id: item.id,
    item_uuid: item.uuid,
    status: submission.status,
    status_desc: SubmissionStatusReadable[submission.status],
    grading_company: item.grading_company,
    serial_number: item.serial_number,
    title: item.title,
    description: item.description,
    genre: item.genre,
    manufacturer: item.manufacturer,
    year: item.year,
    overall_grade: item.overall_grade,
    sub_grades: item.sub_grades,
    autograph: item.autograph,
    subject: item.subject,
    est_value: item.est_value,
    image_url: submission.image,
    created_at: submission.created_at,
    received_at: submission.received_at,
    approved_at: submission.approved_at,
    rejected_at: submission.rejected_at,
  });
}

export function newVaultingDetails(
  vaulting: Vaulting,
  item: Item,
  user: User,
): VaultingDetails {
  return new VaultingDetails({
    id: vaulting.id,
    user: user.uuid,
    item_id: item.id,
    item_uuid: item.uuid,
    collection: vaulting.collection,
    token_id: vaulting.token_id,
    grading_company: item.grading_company,
    serial_number: item.serial_number,
    title: item.title,
    description: item.description,
    genre: item.genre,
    manufacturer: item.manufacturer,
    year: item.year,
    overall_grade: item.overall_grade,
    sub_grades: item.sub_grades,
    autograph: item.autograph,
    subject: item.subject,
    est_value: item.est_value,
    image_url: vaulting.image,
    status: vaulting.status,
    status_desc: VaultingStatusReadable[vaulting.status],
    mint_tx_hash: vaulting.mint_tx_hash,
    minted_at: vaulting.minted_at,
    burn_tx_hash: vaulting.burn_tx_hash,
    burned_at: vaulting.burned_at,
    chain_id: vaulting.chain_id,
  });
}

const base64Threshold = 1000;

export function removeBase64(body) {
  var _body = Object.assign({}, body);
  // loop through body and params and shorten base64 data
  for (const key in _body) {
    if (key.includes('base64')) {
      // shorten base64 data
      _body[key] = _body[key].substring(0, 100) + '......';
    }

    if (key.includes('image') && _body[key].length > base64Threshold) {
      // shorten base64 data
      _body[key] = _body[key].substring(0, 100) + '......';
    }
  }

  return _body;
}
