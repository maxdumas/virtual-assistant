import path from 'node:path';

import type { StackProps } from 'aws-cdk-lib';
import { Duration, Stack } from 'aws-cdk-lib';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as sesActions from 'aws-cdk-lib/aws-ses-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import type { Construct } from 'constructs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { BunFun } from './constructs/BunFun.js';
import { BunFunLayerStack } from './bun-fun-layer-stack.js';
import { getProjectRoot } from './utils.js';

const lambdaDir = path.resolve(getProjectRoot()[0], './packages/functions');

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
      entrypoint: `${lambdaDir}/src/emailDigest.ts`,
      handler: 'emailDigest.handler',
      bunLayer: layer.layer,
    });

    digestFunction.lambda.addEventSource(new SqsEventSource(queue));

    const emailDigestFunctionSecret = secretsmanager.Secret.fromSecretNameV2(this, 'EmailDigestFunctionOpenAiApiKey', 'EmailDigestFunctionOpenAiApiKey');
    // TODO(maxdumas): Use the SecretsManager layer on this lambda to safely use this secret.
    digestFunction.lambda.addEnvironment('OPENAI_API_KEY', emailDigestFunctionSecret.secretValue.unsafeUnwrap());
  }
}
