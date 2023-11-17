/* The class TestStack extends the Stack class. */
import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { test } from 'vitest';
import { BunFunLayerStack } from '../infra/bun-fun-layer-stack'

test('Lambda Created', () => {
  const app = new App();
  // WHEN
  const stack = new BunFunLayerStack(app, 'BunFunLayerTestStack', {
    accountId: '123456789012',
  });
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::Lambda::LayerVersion', {
    CompatibleRuntimes: ['provided.al2'],
  })
});
