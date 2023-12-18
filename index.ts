// import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VaStack } from './infra/virtual-assistant/index.js';

const app = new cdk.App({});
new VaStack(app, 'VirtualAssistantStack', {
  env: {
    account: '353161589245',
    region: 'us-east-1',
  },
});
