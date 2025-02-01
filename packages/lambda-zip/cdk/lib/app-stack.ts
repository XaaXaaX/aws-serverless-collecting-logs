import { Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { ApplicationLogLevel, Architecture, FunctionUrlAuthType, LayerVersion, LoggingFormat, Runtime, SystemLogLevel } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { resolve } from 'path';
import { EnforcedStack, EnforcedStackProps } from '@xaaxaax/cdk-core';
export interface LambdaZipStackProps extends EnforcedStackProps {
  extensionName: string,
  streamName: string,
  description?: string
}

export class LambdaZipStack extends EnforcedStack {

  constructor(scope: Construct, id: string, props: LambdaZipStackProps) {
    super(scope, id, props);

    const extensionArn = StringParameter.fromStringParameterName(
      this, 'extensionId', `/${props.contextVariables.stage}/logs-collector-observability-core/telemetry/kinesis/extension/arn`).stringValue;
  
    const managedPolicyName = StringParameter.fromStringParameterName(
      this, 'policyName', `/${props.contextVariables.stage}/logs-collector-observability-core/telemetry/kinesis/runtime/policy/arn`).stringValue;
  
    const functionRole = new Role(this, 'LambdaFunctionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        ManagedPolicy.fromManagedPolicyArn(this, 'managed-policy', managedPolicyName)
      ]
    });

    const lambdaFunction = new NodejsFunction(this, 'LambdaZipFunction', {
      entry: resolve(process.cwd(), 'src/handler.ts'),
      architecture: Architecture.ARM_64,
      runtime: Runtime.NODEJS_20_X,
      loggingFormat: LoggingFormat.JSON,
      role: functionRole,
      memorySize: 256,
      timeout: Duration.seconds(30),
      systemLogLevelV2: SystemLogLevel.INFO,
      applicationLogLevelV2: ApplicationLogLevel.INFO,
      awsSdkConnectionReuse: false,
      bundling: {
        platform: 'node',
        format: OutputFormat.ESM,
        mainFields: ['module', 'main'],
        minify: true,
        sourceMap: true,
        sourcesContent: false,
        sourceMapMode: SourceMapMode.INLINE,
      },
      layers: [ 
        LayerVersion.fromLayerVersionArn(this, 'ExtensionArn', extensionArn) 
      ],
    });

    new LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/lambda/${lambdaFunction.functionName}`,
      retention: 1,
      removalPolicy: RemovalPolicy.DESTROY
    });

    lambdaFunction.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE
    })

  }
}
