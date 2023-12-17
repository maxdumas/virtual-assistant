import path from 'node:path';
import type { StackProps } from 'aws-cdk-lib';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import type { LayerVersionPermission } from 'aws-cdk-lib/aws-lambda';
import {
  Architecture,
  Code,
  LayerVersion,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import type { Construct } from 'constructs';
import { getProjectRoot } from './utils.js';

const dir = getProjectRoot()[0];

export type BunFunLayerStackProps = StackProps & LayerVersionPermission;

export class BunFunLayerStack extends Stack {
  readonly layer: LayerVersion;

  constructor(scope: Construct, id: string, props: BunFunLayerStackProps) {
    super(scope, id, props);

    this.layer = new LayerVersion(this, 'BunFunLayer', {
      description: 'A custom Lambda layer for Bun.',
      removalPolicy: RemovalPolicy.DESTROY,
      code: Code.fromAsset(path.join(dir, 'bun-lambda-layer.zip')),
      compatibleArchitectures: [Architecture.X86_64, Architecture.ARM_64],
      compatibleRuntimes: [Runtime.PROVIDED_AL2],
      layerVersionName: 'BunFunLayer',
      license: 'MIT',
    });

    this.layer.addPermission('BunFunLayerPermission', {
      accountId: props.accountId,
      organizationId: props.organizationId,
    });
  }
}
