import path from 'node:path';
import { Construct } from 'constructs';
import type { FunctionProps, FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';
import { Architecture, Code, Function, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import type * as Bun from 'bun';
import { CfnOutput, DockerImage } from 'aws-cdk-lib';
import { AnyPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { getProjectRoot } from '../utils.js';

export interface BunFunPropsBase extends Omit<FunctionProps, 'runtime' | 'code'> {
  entrypoint: string
  bunConfig?: Omit<Bun.BuildConfig, 'entrypoints' | 'target'> & {
    target: Bun.Target
  }
}

export interface BunFunPropsWithFunctionUrl extends BunFunPropsBase {
  functionsUrl: true
  functionUrlAuthType: FunctionUrlAuthType
}

export interface BunFunPropsWithoutFunctionUrl extends BunFunPropsBase {
  functionsUrl?: false
}

type BunFunProps = BunFunPropsWithFunctionUrl | BunFunPropsWithoutFunctionUrl;

/**
 * A Lambda function that is bundled by (and optionally run by) Bun. If the
 * build target is set to bun (the default), then a layer containing the bun
 * runtime will be published. If the runtime is node, then Bun will just be used
 * to generate a bundle.
 */
export class BunFun extends Construct {
  readonly lambda: Function;

  constructor(scope: Construct, id: string, props: BunFunProps) {
    super(scope, id);

    const projectPath = getProjectRoot()[0];

    const relativeEntrypointPath = path.relative(projectPath, props.entrypoint);

    const { target = 'bun' } = props.bunConfig ?? {};

    this.lambda = new Function(this, 'BunFunction', {
      ...props,
      code: Code.fromAsset(projectPath, {
        bundling: {
          image: DockerImage.fromRegistry('oven/bun'),
          command: [
            'bash',
            '-c',
            `bun install && bun build ${relativeEntrypointPath} --target ${target} --outfile /asset-output/${path.basename(props.entrypoint, '.ts')}${target === 'bun' ? '.ts' : '.mjs'}`,
          ],
        },
      }),
      handler: props.handler,
      runtime: target === 'bun' ? Runtime.PROVIDED_AL2 : Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      allowPublicSubnet: true,
    });

    if (target === 'bun') {
      // Target is bun, so we need to add the bun runtime. We expect it to have
      // already been published into the account. See here for how to do so:
      // https://github.com/oven-sh/bun/tree/1a2643520b216c4c95b7543ed62d4fed30882ce3/packages/bun-lambda
      const layer = LayerVersion.fromLayerVersionArn(this, 'Layer', 'arn:aws:lambda:us-east-1:353161589245:layer:bun:2');
      this.lambda.addLayers(layer);
      this.lambda.addToRolePolicy(
        new PolicyStatement({
          actions: ['lambda:GetLayerVersion'],
          resources: [layer.layerVersionArn],
        }),
      );
    }

    if (props.functionsUrl) {
      this.lambda.addPermission('InvokeFunctionsUrl', {
        principal: new AnyPrincipal(),
        action: 'lambda:InvokeFunctionUrl',
        functionUrlAuthType: props.functionUrlAuthType,
      });

      const fnUrl = this.lambda.addFunctionUrl({
        authType: props.functionUrlAuthType,
      });

      new CfnOutput(this, `${props.handler}Url`, {
        value: fnUrl.url,
      });
    }
  }
}
