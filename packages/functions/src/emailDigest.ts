/*
* This function will attempt to render the message to a format usable by Textract, and
* then run textract on it to (hopefully) get information about everything
* in that email, even if it's stored in an image.

* Hm, what about links? We should follow those too if we can't get enough
* information on the page itself... so we'd need to follow links in the
* email text.

* For each email text, we then ask GPT-4 to summarize it and extract
* structured information about the event, such as when it is, where it is, a brief description, how much it costs, the link to RSVP, etc.
*/

import type { SQSEvent } from 'aws-lambda';
import PostalMime from 'postal-mime';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import OpenAI from 'openai';
import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import type { VAEvent } from './types';
import type { Database } from './db.js';

const ajv = addFormats(new Ajv());

const openai = new OpenAI();
const s3 = new S3Client();
const db = new Kysely<Database>({
  log: ['query', 'error'],
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DB_CONNECTION_STRING,
    }),
  }),
});
const emailParser = new PostalMime();

const ALLOWED_FORWARDERS = new Set([
  'max@dumas.nyc',
  'max@ulama.tech',
  'mfd64@cornell.edu',
  'maltor124@gmail.com',
]);

interface EventExtractionResponse {
  events: VAEvent[]
}

const eventExtractionSchema: JSONSchemaType<EventExtractionResponse> = {
  additionalProperties: false,
  type: 'object',
  required: ['events'],
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
          description: {
            type: 'string',
            description: 'One sentence summary of the event. Tell me what it is and why I should go. What\'s exciting about this event?',
          },
          location: {
            type: 'string',
            description: 'The location of the event. Provide a full address if possible.',
          },
          startDateTime: {
            type: 'string',
            description: 'When the event begins.',
            format: 'date-time',
          },
          endDateTime: {
            type: 'string',
            description: 'When the event ends. May not be available. Generally assume that this is one hour after the startDateTime value if it cannot be explicitly determined.',
            format: 'date-time',
          },
          link: {
            type: 'string',
            description: 'RSVP URL, website, tickets, or whatever is needed to actually follow through on the event.',
            nullable: true,
            format: 'uri',
          },
          price: {
            type: 'number',
            description: 'Price, in USD, of the event. If free, use 0.',
            nullable: true,
            minimum: 0,
          },
        },
        required: [
          'name',
          'description',
          'location',
          'startDateTime',
          'endDateTime',
        ],
      },
    },
  },
};

const validateEventExtraction = ajv.compile(eventExtractionSchema);

function extractEventsPrompt(content: string) {
  return `Extract for me essential info about the events that are contained in the following email message. The information should adhere to the following JSON schema:

${JSON.stringify(eventExtractionSchema)}


Return ONLY the JSON such that your response can be directly parsed as JSON. Do not wrap it in markdown.

BEGIN EMAIL MESSAGE

${content}

END EMAIL MESSAGE`;
};

export default {
  async handler(request: Request): Promise<Response> {
    const { event } = await request.json() as { event: SQSEvent };

    const allEvents: VAEvent[] = [];

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

      console.log(`Loading message at ${messageContentS3Location}`);

      const s3Response = await s3.send(new GetObjectCommand(messageContentS3Location));

      if (!s3Response.Body)
        throw new Error(`S3 object at ${JSON.stringify(messageContentS3Location)} contained nothing.`);

      const messageBody = await s3Response.Body.transformToString();

      console.log('Message body loaded.');
      console.log(messageBody);

      const parsed = await emailParser.parse(messageBody);

      if (!parsed.text)
        continue;

      console.log('Message body parsed');
      console.log(parsed.text);

      const content = extractEventsPrompt(parsed.text);

      console.log('Event extraction prompt generated');
      console.log(content);

      const openAiResponse = await openai.chat.completions.create({
        messages: [{ role: 'user', content }],
        model: 'gpt-4-1106-preview',
        response_format: { type: 'json_object' },
      });
      const openAiMessage = openAiResponse.choices[0].message.content;

      console.log('Raw event extraction received.');
      console.log(openAiMessage);

      if (!openAiMessage)
        throw new Error('Failed to get a response from OpenAI!');

      const extraction = JSON.parse(openAiMessage);

      if (!validateEventExtraction(extraction))
        throw new Error('OpenAI response was not a valid set of events.');

      const { events } = extraction;
      allEvents.push(...events);

      console.log('Events extracted.');
      console.log(events);

      // TODO(maxdumas): Can we make this mapping more automatic? Is that
      // desirable?
      await db.insertInto('public.events').values(events.map(e => ({
        name: e.name,
        description: e.description,
        link: e.link,
        location: e.location,
        price: e.price,
        start_date_time: new Date(e.startDateTime),
        end_date_time: new Date(e.endDateTime),
      }))).execute();

      console.log('All events inserted into database.');
    }

    return new Response(JSON.stringify(allEvents), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
};
