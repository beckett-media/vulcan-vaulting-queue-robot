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
    user: user.uuid,
    created_at: submission.created_at,
    received_at: submission.received_at,
    approved_at: submission.approved_at,
    rejected_at: submission.rejected_at,
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
    submission_image: item.submission_image,
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
    image: item.nft_image,
    status: vaulting.status,
    status_desc: VaultingStatusReadable[vaulting.status],
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
