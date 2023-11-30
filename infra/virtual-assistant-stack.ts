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
import { SqsEventSource} from 'aws-cdk-lib/aws-lambda-event-sources'

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

    // For every email that comes into the queue, we trigger a lambda function
    // to extract events from the email.
    const digestFunction = new BunFun(this, 'EmailDigestFunction', {
      entrypoint: `${lambdaDir}/emailDigest.ts`,
      handler: 'emailDigest.handler',
      bunLayer: layer.layer.layerVersionArn,
    });

    digestFunction.lambda.addEventSource(new SqsEventSource(queue));
  }
}
