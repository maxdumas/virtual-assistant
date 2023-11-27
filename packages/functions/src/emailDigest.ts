import { Readable } from 'node:stream';
import type { SQSEvent } from 'aws-lambda';
import { simpleParser } from 'mailparser';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import OpenAI from 'openai';
import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = addFormats(new Ajv());

const openai = new OpenAI();
const s3 = new S3Client({
  credentials: fromNodeProviderChain({ profile: 'soteriia' }),
});

const ALLOWED_FORWARDERS = new Set([
  'max@dumas.nyc',
  'max@ulama.tech',
  'mfd64@cornell.edu',
  'maltor124@gmail.com',
]);

interface Event {
  location: string
  start_datetime: Date
  end_datetime: Date
  link?: string
  price?: number
}

interface EventExtractionResponse {
  events: Event[]
}

// TODO(maxdumas): Get the typing for this correct
const eventExtractionSchema: JSONSchemaType<EventExtractionResponse> = {
  additionalProperties: false,
  type: 'object',
  properties: {
    events: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Event name',
          },
          location: {
            type: 'string',
            description: 'The location of the event. Provide a full address if possible.',
          },
          start_datetime: {
            type: 'string',
            description: 'When the event begins.',
            format: 'date-time',
          },
          end_datetime: {
            type: 'string',
            description: 'When the event ends. May not be available. Generally assume that this is one hour after the start_datetime value if it cannot be explicitly determined.',
            format: 'date-time',
          },
          link: {
            type: 'string',
            description: 'RSVP URL, website, tickets, or whatever is needed to actually follow through on the event.',
            format: 'uri',
          },
          price: {
            type: 'number',
            description: 'Price, in USD, of the event. If free, use 0.',
            minimum: 0,
          },
          description: {
            type: 'string',
            description: 'One sentence summary of the event. Tell me what it is and why I should go. What\'s exciting about this event?',
          },
        },
        required: [
          'name',
          'start_datetime',
          'end_datetime',
          'description',
        ],
      },
    },
  },
} as any;

const validateEventExtraction = ajv.compile(eventExtractionSchema);

function extractEventsPrompt(content: string) {
  return `
Extract from me essential info about the events that are contained in the following email message. The information should adhere to the following JSON schema:

${JSON.stringify(eventExtractionSchema)}


Return ONLY the JSON such that your response can be directly parsed as JSON. Do not wrap it in markdown.

BEGIN EMAIL MESSAGE

${content}

END EMAIL MESSAGE`;
};

export async function handler(event: SQSEvent) {
  const allEvents: Event[] = [];

  for (const record of event.Records) {
    const sesEvent = JSON.parse(record.body);
    const message = JSON.parse(sesEvent.Message);

    // Only allow forwards from a pre-approved address.
    if (!ALLOWED_FORWARDERS.has(message.mail.source))
      throw new Error(`Will not parse email from unapproved source ${message.mail.source}`);

    if (message.receipt.action.type !== 'S3')
      throw new Error('Unexpected incoming action type');

    const messageContentS3Location = {
      Bucket: message.receipt.action.bucketName,
      Key: message.receipt.action.objectKey,
    };

    const s3Response = await s3.send(new GetObjectCommand(messageContentS3Location));

    if (!s3Response.Body)
      throw new Error(`S3 object at ${JSON.stringify(messageContentS3Location)} contained nothing.`);

    const parsed = await simpleParser(Readable.fromWeb(s3Response.Body.transformToWebStream()));

    if (!parsed.text)
      continue;

    const content = extractEventsPrompt(parsed.text);
    console.log(content);
    const openAiResponse = await openai.chat.completions.create({
      messages: [{ role: 'user', content }],
      model: 'gpt-4-1106-preview',
    });
    const openAiMessage = openAiResponse.choices[0].message.content;

    console.log(openAiMessage);

    if (!openAiMessage)
      throw new Error('Failed to get a response from OpenAI!');

    const extraction = JSON.parse(openAiMessage);

    if (!validateEventExtraction(extraction))
      throw new Error('OpenAI response was not a valid set of events.');

    const { events } = extraction;
    allEvents.push(...events);
  }

  return new Response(JSON.stringify(allEvents), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
