#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VirtualAssistant } from './infra/virtual-assistant';

const app = new cdk.App();
new VirtualAssistant(app, 'VirtualAssistant');
