import type { StackProps } from 'aws-cdk-lib';
import { Stack } from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as sesActions from 'aws-cdk-lib/aws-ses-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import type { Construct } from 'constructs';

/**
 * This stack configures email routing. It outputs an S3 bucket that receives
 * copies of all received emails and and SNS topic that notifies when emails are
 * received.
 *
 * Note that replacing the HostedZone here will require manually updating DNS
 * records for domains, so do so so with care. The following steps must be
 * manually taken to recreate this stack:
 *
 * For the domain that owns dumas.nyc, you must re-add NS records for the
 * nameservers of the newly-created hosted zone.
 *
 * For the newly-created hosted zone, you must add an MX record for SES email
 * receiving. See here for details:
 * https://docs.aws.amazon.com/ses/latest/dg/receiving-email-mx-record.html
 */
export class VaEmailRoutingStack extends Stack {
  readonly bucket: s3.IBucket;
  readonly topic: sns.ITopic;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Note that we don't associate this hostedZone with a VPC because we want
    // it to be publicly accessible.
    const hostedZone = new route53.HostedZone(this, 'HostedZone', {
      zoneName: 'va.dumas.nyc',
    });

    const receivingAddress = `events@${hostedZone.zoneName}`;

    new ses.EmailIdentity(this, 'EmailIdentity', {
      identity: ses.Identity.publicHostedZone(hostedZone),
    });

    this.bucket = new s3.Bucket(this, 'EmailStorageBucket');
    this.topic = new sns.Topic(this, 'EmailReceiptTopic');

    // An SES Receiver accepts emails and dumps them to an S3 bucket
    // An SNS topic will then publish messages when the
    // bucket is written to.
    new ses.ReceiptRuleSet(this, 'ReceiptRule', {
      rules: [
        {
          recipients: [receivingAddress],
          actions: [new sesActions.S3({ bucket: this.bucket, topic: this.topic })],
        },
      ],
    });
  }
};
