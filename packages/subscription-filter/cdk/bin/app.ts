#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SubscriptionFilterStack } from '../lib';
import { getConfig, getEnv } from '@xaaxaax/cdk-core';

const app = new cdk.App();
const environment = getEnv(app);

const { 
  contextVariables 
} = getConfig(environment, 'subscription-filter');

new SubscriptionFilterStack(app, SubscriptionFilterStack.name, {
  contextVariables,
  streamName: 'telemetry-kinesis-stream'
});

