#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VirtualAssistantStack } from './infra/virtual-assistant-stack';

const app = new cdk.App();
new VirtualAssistantStack(app, 'VirtualAssistant');
