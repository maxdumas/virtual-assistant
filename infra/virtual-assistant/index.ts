import type { StackProps } from 'aws-cdk-lib';
import { Stack } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { VaDatabaseStack } from './db.js';
import { VaEmailProcessingStack } from './email-processing.js';
import { VaEmailRoutingStack } from './email-routing.js';
import { VaVpcStack } from './vpc.js';

export class VaStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const { env } = props;

    const { vpc } = new VaVpcStack(this, 'VpcStack', { env });
    const { topic, bucket } = new VaEmailRoutingStack(this, 'EmailRoutingStack', { env });
    const { dbConnectionString } = new VaDatabaseStack(this, 'DatabaseStack', { vpc, env });

    new VaEmailProcessingStack(this, 'EmailProcessingStack', {
      env,
      vpc,
      dbConnectionString,
      topic,
      bucket,
    });
  }
}
