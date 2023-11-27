import path from 'node:path';

import type { StackProps } from 'aws-cdk-lib';
import { Duration, Stack } from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as sesActions from 'aws-cdk-lib/aws-ses-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import type { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';

import { BunFun } from './constructs/BunFun';
import { BunFunLayerStack } from './bun-fun-layer-stack';

const lambdaDir = path.join(import.meta.dir, '../packages/functions/src');

export class VirtualAssistantStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const hostedZone = new route53.HostedZone(this, 'HostedZone', {
      zoneName: 'va.dumas.nyc',
    });

    const receivingAddress = `events@${hostedZone.zoneName}`;

    new ses.EmailIdentity(this, 'EmailIdentity', {
      identity: ses.Identity.publicHostedZone(hostedZone),
    });

    const bucket = new s3.Bucket(this, 'EmailStorageBucket');
    const topic = new sns.Topic(this, 'EmailReceiptTopic');

    // An SES Receiver accepts emails and dumps them to an S3 bucket
    // An SNS topic will then publish messages when the
    // bucket is written to.
    new ses.ReceiptRuleSet(this, 'ReceiptRule', {
      rules: [
        {
          recipients: [receivingAddress],
          actions: [new sesActions.S3({ bucket, topic })],
        },
      ],
    });

    // An SQS queue with a retention policy set to 14 days should listen to this
    // topic
    const queue = new sqs.Queue(this, 'EmailReceiptQueue', {
      retentionPeriod: Duration.days(14),
    });
    topic.addSubscription(new SqsSubscription(queue));

    const layer = new BunFunLayerStack(this, 'BunFunLayerStack', {
      accountId: this.account, // Or make it '*' to make it public
    });

    // Every X hours (once a day?) we should trigger a lambda function that will
    // pull all of the messages from the queue, parse them into a digest, and
    // then send that digest back to the recipient.
    const digestFunction = new BunFun(this, 'EmailDigestFunction', {
      entrypoint: `${lambdaDir}/emailDigest.ts`,
      handler: 'emailDigest.handler',
      bunLayer: layer.layer.layerVersionArn,
    });

    queue.grantConsumeMessages(digestFunction.lambda);

    // TODO: In the future, we'll want to just automatically add these events to
    // the user's calendar as they come in.
    new events.Rule(this, 'EmailDigestRule', {
      // Every day at 3 AM UTC, which is 8 or 9 AM EST.
      schedule: events.Schedule.cron({ hour: '3', minute: '0' }),
      targets: [new eventsTargets.LambdaFunction(digestFunction.lambda)],
    });

    // It will attempt to render the message to a format usable by Textract, and
    // then run textract on it to (hopefully) get information about everything
    // in that email, even if it's stored in an image.

    // Hm, what about links? We should follow those too if we can't get enough
    // information on the page itself... so we'd need to follow links in the
    // email text.

    // For each email text, we then ask GPT-4 to summarize it and extract
    // structured information about the event, such as when it is, where it is, a brief description, how much it costs, the link to RSVP, etc.
  }
}
