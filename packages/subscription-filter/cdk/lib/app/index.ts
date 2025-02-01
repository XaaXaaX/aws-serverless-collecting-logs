import { Construct } from 'constructs';
import { Stream } from 'aws-cdk-lib/aws-kinesis';
import { NodejsFunction, OutputFormat, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs';
import { resolve } from 'path';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { ApplicationLogLevel, Architecture, FunctionUrlAuthType, LoggingFormat, Runtime, SystemLogLevel } from 'aws-cdk-lib/aws-lambda';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { KinesisDestination } from 'aws-cdk-lib/aws-logs-destinations';
import { EnforcedStack, EnforcedStackProps } from '@xaaxaax/cdk-core';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export type SubscriptionFilterStackProps = EnforcedStackProps & { streamName: string };
export class SubscriptionFilterStack extends EnforcedStack {
  constructor(scope: Construct, id: string, props: SubscriptionFilterStackProps) {
    super(scope, id, props);

    const streamArn = StringParameter.fromStringParameterName(
      this, 'StreamArnParam', `/${props.contextVariables.stage}/logs-collector-observability-core/telemetry/stream/arn`).stringValue;
  

    const LogStream = Stream.fromStreamArn(this, 'LogStream', streamArn);

    const lambdaServiceRole = new ServicePrincipal('lambda.amazonaws.com');
    const lambdaFunctionRole = new Role(this, `LambdaFunctionRole`, { 
      assumedBy: lambdaServiceRole,
      managedPolicies: [ ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole') ],
    });

    const lambdaWithCloudwatch = new NodejsFunction(this, 'lambdaWithCloudwatch', {
      entry: resolve(process.cwd(), 'src/handler.ts'),
      architecture: Architecture.ARM_64,
      runtime: Runtime.NODEJS_20_X,
      loggingFormat: LoggingFormat.JSON,
      memorySize: 256,
      timeout: Duration.seconds(30),
      systemLogLevelV2: SystemLogLevel.INFO,
      role: lambdaFunctionRole,
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
    });

    lambdaWithCloudwatch.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE
    })

    const logGropup = new LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/lambda/${lambdaWithCloudwatch.functionName}`,
      retention: RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const logsDeliveryRole = new Role(this, `LogsDeliveryRole`, { 
      assumedBy: new ServicePrincipal('logs.amazonaws.com'),
    });

    logGropup.addSubscriptionFilter('SubscriptionFilter', {
      destination: new KinesisDestination(LogStream,{
        role: logsDeliveryRole
      }),
      filterPattern: {
        logPatternString: ' ',
      }
    })

    LogStream.grantWrite(logsDeliveryRole);
  }
}
