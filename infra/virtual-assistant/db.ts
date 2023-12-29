import type { StackProps } from 'aws-cdk-lib';
import { Stack } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import type { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';

interface VaDatabaseStackProps extends StackProps {
  vpc: ec2.IVpc
}

export class VaDatabaseStack extends Stack {
  readonly db: rds.IDatabaseCluster;
  readonly dbConnectionString: string;

  constructor(scope: Construct, id: string, props: VaDatabaseStackProps) {
    super(scope, id, props);

    const { vpc } = props;

    const db = new rds.DatabaseCluster(this, 'Database', {
      credentials: rds.Credentials.fromGeneratedSecret('postgres', {
        secretName: `VirtualAssistant/Prod/Database`,
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\^',
      }),
      engine: rds.DatabaseClusterEngine.auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_15_3 }),
      writer: rds.ClusterInstance.serverlessV2('writer', {
        // We enable public access for now because we want to be able to
      // connect to the instance from our dev machine, which may not be inside
      // the VPC.
        publiclyAccessible: true,
      }),
      readers: [
        rds.ClusterInstance.serverlessV2('reader', {
          scaleWithWriter: true,
        }),
      ],
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 1,
      vpc,
      // We enable the public subnet for now because we want to be able to
      // connect to the instance from our dev machine, which may not be inside
      // the VPC.
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      port: 5432,
    });

    // Allow outside connections from Max's dev machine.
    // TODO(maxdumas): Disable this in non-testing environments.
    db.connections.allowDefaultPortFrom(ec2.Peer.ipv4('104.28.236.175/32'));
    // db.connections.allowDefaultPortFrom(digestFunction);
    db.connections.allowDefaultPortFrom(ec2.Peer.ipv4(vpc.vpcCidrBlock));

    const secret = db.secret!;

    this.dbConnectionString = `postgres://${secret.secretValueFromJson('username').unsafeUnwrap()}:${secret.secretValueFromJson('password').unsafeUnwrap()}@${db.clusterEndpoint.socketAddress}/postgres`;
    this.db = db;
  }
}
