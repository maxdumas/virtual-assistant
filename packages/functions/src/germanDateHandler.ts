import type { APIGatewayEvent } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'germanDateHandler' });

export async function germanDateHandler(event: APIGatewayEvent) {
  logger.info('Calling German Date Handler');
  logger.debug('Event', {
    message: 'Event',
    event,
  });
  const { getGermanDateString } = await import('./dateHelper.js');
  return new Response(`It is about time to have some fun with Bun: ${getGermanDateString(new Date())}`, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
  });
}
