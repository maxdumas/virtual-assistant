import path from 'node:path';
import type { StackProps } from 'aws-cdk-lib';
import { Duration, Stack } from 'aws-cdk-lib';
import type * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import type * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import type * as sns from 'aws-cdk-lib/aws-sns';
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import type { Construct } from 'constructs';
import { BunFun } from '../constructs/BunFun.js';
import { getProjectRoot } from '../utils.js';

const lambdaDir = path.resolve(getProjectRoot()[0], './packages/functions');

interface VaEmailProcessingStackProps extends StackProps {
  readonly vpc: ec2.IVpc
  readonly dbConnectionString: string
  readonly topic: sns.ITopic
  readonly bucket: s3.IBucket
}

export class VaEmailProcessingStack extends Stack {
  constructor(scope: Construct, id: string, props: VaEmailProcessingStackProps) {
    super(scope, id, props);

    const { vpc, bucket, dbConnectionString, topic } = props;

    // An SQS queue with a retention policy set to 14 days should listen to this
    // topic
    const queue = new sqs.Queue(this, 'EmailReceiptQueue', {
      retentionPeriod: Duration.days(14),
    });
    topic.addSubscription(new SqsSubscription(queue));

    const emailDigestFunctionSecret = secretsmanager.Secret.fromSecretNameV2(this, 'EmailDigestFunctionOpenAiApiKey', 'EmailDigestFunctionOpenAiApiKey');

    // For every email that comes into the queue, we trigger a lambda function
    // to extract events from the email.
    // TODO(maxdumas): Use the SecretsManager layer on this lambda to safely use this secret.
    const digestFunction = new BunFun(this, 'EmailDigestFunction', {
      entrypoint: `${lambdaDir}/src/emailDigest.ts`,
      handler: 'emailDigest.handler',
      vpc,
      memorySize: 1024,
      timeout: Duration.minutes(15),
      bunConfig: {
        target: 'bun',
      },
      environment: {
        DB_CONNECTION_STRING: dbConnectionString,
        OPENAI_API_KEY: emailDigestFunctionSecret.secretValue.unsafeUnwrap(),
      },
    }).lambda;

    digestFunction.addEventSource(new SqsEventSource(queue));

    bucket.grantRead(digestFunction);
  }
}
