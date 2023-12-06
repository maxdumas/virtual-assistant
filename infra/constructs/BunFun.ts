import path from 'node:path';
import { Construct } from 'constructs';
import type { FunctionUrlAuthType, ILayerVersion } from 'aws-cdk-lib/aws-lambda';
import { Architecture, Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import type * as Bun from 'bun';
import { CfnOutput, DockerImage } from 'aws-cdk-lib';
import { AnyPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';

export interface BunFunPropsBase {
  entrypoint: string
  handler: string
  bunLayer: ILayerVersion
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
  public lambda!: Function;

  constructor(scope: Construct, id: string, props: BunFunProps) {
    super(scope, id);

    const projectPath = path.dirname(props.entrypoint);

    this.lambda = new Function(this, 'BunFunction', {
      code: Code.fromAsset(projectPath, {
        bundling: {
          image: DockerImage.fromRegistry('oven/bun'),
          command: [
            'bash',
            '-c',
            `bun install && bun build --target ${props.bunConfig?.target ?? 'bun'} --outfile /asset-output/${path.basename(props.entrypoint)}`,
          ],
        },
      }),
      handler: props.handler,
      runtime: Runtime.PROVIDED_AL2,
      layers: [props.bunLayer],
      architecture: Architecture.ARM_64,
    });

    this.lambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['lambda:GetLayerVersion'],
        resources: [props.bunLayer.layerVersionArn],
      }),
    );

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
