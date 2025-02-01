#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LambdaCustomImageWithExtensionStack } from '../lib/app-stack';
import { getConfig, getEnv } from '@xaaxaax/cdk-core';

const app = new cdk.App();
const environment = getEnv(app);

const { 
  contextVariables 
} = getConfig(environment, 'lambda-custom-image');

new LambdaCustomImageWithExtensionStack(app, LambdaCustomImageWithExtensionStack.name, {
  contextVariables,
  extensionName: `kinesis-telemetry-extension`,
  description: 'Telemetry Extension for Kinesis push',
	streamName: 'telemetry-kinesis-stream'
});
