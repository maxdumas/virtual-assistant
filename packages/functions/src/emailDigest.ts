import type { Readable } from 'node:stream';
import type { SQSEvent } from 'aws-lambda';
import { simpleParser } from 'mailparser';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

const s3 = new S3Client({
  credentials: fromNodeProviderChain({ profile: 'soteriia' }),
});

const ALLOWED_FORWARDERS = new Set([
  'max@dumas.nyc',
  'max@ulama.tech',
  'mfd64@cornell.edu',
  'maltor124@gmail.com',
]);

export async function handler(event: SQSEvent) {
  const emailTexts: string[] = [];

  for (const record of event.Records) {
    const sesEvent = JSON.parse(record.body);
    const message = JSON.parse(sesEvent.Message);

    if (!ALLOWED_FORWARDERS.has(message.mail.source)) {
      // Only allow forwards from a pre-approved address.
      throw new Error(`Will not parse email from unapproved source ${message.mail.source}`);
    }

    if (message.receipt.action.type !== 'S3')
      throw new Error('Unexpected incoming action type');

    const messageContentS3Location = {
      Bucket: message.receipt.action.bucketName,
      Key: message.receipt.action.objectKey,
    };

    const s3Response = await s3.send(new GetObjectCommand(messageContentS3Location));

    if (!s3Response.Body)
      throw new Error(`S3 object at ${JSON.stringify(messageContentS3Location)} contained nothing.`);

    const parsed = await simpleParser(s3Response.Body as Readable);
    emailTexts.push(parsed.text ?? '');
  }

  return new Response(JSON.stringify(emailTexts), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
