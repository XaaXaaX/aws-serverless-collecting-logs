#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { getConfig } from '@config';
import { getEnv } from '@helpers';
import { ApplicationStack } from '@libs';

const app = new cdk.App();
const environment = getEnv(app);
const { 
  contextVariables,
  someConfig
} = getConfig(environment);

const hostedZoneStack = new ApplicationStack(app, `${contextVariables.context}-application-${contextVariables.stage}`, {
  contextVariables,
  someConfig,
});

