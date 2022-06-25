import { Item, Submission, Vaulting } from 'src/database/database.entity';
import { SubmissionStatusReadable } from 'src/config/enum';
import {
  SubmissionDetails,
  VaultingDetails,
} from 'src/marketplace/dtos/marketplace.dto';

export function newSubmissionDetails(
  submission: Submission,
  item: Item,
): SubmissionDetails {
  return new SubmissionDetails({
    user_id: submission.user_id,
    created_at: submission.created_at,
    received_at: submission.received_at,
    minted_at: submission.minted_at,
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
    image: item.submission_image,
  });
}

export function newVaultingDetails(
  vaulting: Vaulting,
  item: Item,
): VaultingDetails {
  return new VaultingDetails({
    user_id: vaulting.user_id,
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
    image: item.submission_image,
  });
}
