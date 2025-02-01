import { EnforcedStackProps, EnforcedStack } from '@xaaxaax/cdk-core'
import { Effect, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Stream } from 'aws-cdk-lib/aws-kinesis';
import { Architecture, Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { resolve } from 'path';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { ContainerImage } from 'aws-cdk-lib/aws-ecs';
import { DockerImage, RemovalPolicy } from 'aws-cdk-lib';
export interface TelemetryApiExtensionStackProps extends EnforcedStackProps {
  extensionName: string,
  streamName: string,
  description?: string
}

export class TelemetryApiKinesisExtensionStack extends EnforcedStack {

  constructor(scope: Construct, id: string, props: TelemetryApiExtensionStackProps) {
    super(scope, id, props);

    const kinesis = new Stream(this, 'TelemetryStream', { streamName: props.streamName });
    const extension = new LayerVersion(this, 'kinesis-telemetry-api-extension', {
      layerVersionName: `${props?.extensionName}-v1`,
      removalPolicy: RemovalPolicy.RETAIN,
      code: Code.fromAsset(resolve(process.cwd(), `build`)),
      compatibleArchitectures: [
        Architecture.X86_64,
        Architecture.ARM_64
      ],
      compatibleRuntimes: [
        Runtime.NODEJS_18_X,
        Runtime.NODEJS_20_X,
        Runtime.NODEJS_22_X,
      ],
      description: props?.extensionName
    });

    const kinesisManagedPolicy = new ManagedPolicy(this, 'kinesis-telemetry-api-extension-managed-policy', {
      managedPolicyName: `${props?.extensionName}-runtime`,
      statements: [
        new PolicyStatement({
          actions: [
            'kinesis:PutRecord',
            'kinesis:PutRecords'
          ],
          resources: [ 
            kinesis.streamArn 
          ],
          effect: Effect.ALLOW
        }),
        new PolicyStatement({
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents'
          ],
          resources: [
            'arn:aws:logs:*:*:*'
          ],
          effect: Effect.ALLOW
        })
      ]
    })

    new Repository(this, 'TelemetryApiExtensionRepository', {
      repositoryName: 'lambda-telemetry-image',
      removalPolicy: RemovalPolicy.DESTROY,
      emptyOnDelete: true
    });

    new StringParameter(this, `LambdaExtensionArnParam`, {
      parameterName: `/${props.contextVariables.stage}/${props.contextVariables.context}/telemetry/kinesis/extension/arn`,
      stringValue: extension.layerVersionArn,
    });
    
    new StringParameter(this, `LambdaExtensionManagedPolicyArnParam`, {
      parameterName: `/${props.contextVariables.stage}/${props.contextVariables.context}/telemetry/kinesis/runtime/policy/arn`,
      stringValue: kinesisManagedPolicy.managedPolicyArn
    });

    new StringParameter(this, `TelemetryKinesisStreamArnParam`, {
      parameterName: `/${props.contextVariables.stage}/${props.contextVariables.context}/telemetry/stream/arn`,
      stringValue: kinesis.streamArn
    });
  }
}
