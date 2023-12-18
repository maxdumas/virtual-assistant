import path from 'node:path';
import { Construct } from 'constructs';
import type { FunctionProps, FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';
import { Architecture, Code, Function, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import type * as Bun from 'bun';
import { CfnOutput, DockerImage, RemovalPolicy } from 'aws-cdk-lib';
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

export class BunFun extends Construct {
  readonly lambda: Function;

  constructor(scope: Construct, id: string, props: BunFunProps) {
    super(scope, id);

    const projectPath = getProjectRoot()[0];

    const relativeEntrypointPath = path.relative(projectPath, props.entrypoint);

    const layer = new LayerVersion(this, 'BunFunLayer', {
      description: 'A custom Lambda layer for Bun.',
      removalPolicy: RemovalPolicy.DESTROY,
      code: Code.fromAsset(path.join(projectPath, 'bun-lambda-layer.zip')),
      compatibleArchitectures: [Architecture.X86_64, Architecture.ARM_64],
      compatibleRuntimes: [Runtime.PROVIDED_AL2],
      layerVersionName: 'BunFunLayer',
      license: 'MIT',
    });

    this.lambda = new Function(this, 'BunFunction', {
      ...props,
      code: Code.fromAsset(projectPath, {
        bundling: {
          image: DockerImage.fromRegistry('oven/bun'),
          command: [
            'bash',
            '-c',
            `bun install && bun build ${relativeEntrypointPath} --target ${props.bunConfig?.target ?? 'bun'} --outfile /asset-output/${path.basename(props.entrypoint)}`,
          ],
        },
      }),
      handler: props.handler,
      runtime: Runtime.PROVIDED_AL2,
      layers: [layer],
      architecture: Architecture.ARM_64,
      allowPublicSubnet: true,
    });

    // this.lambda.addToRolePolicy(
    //   new PolicyStatement({
    //     actions: ['lambda:GetLayerVersion'],
    //     resources: [layer.layerVersionArn],
    //   }),
    // );

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
