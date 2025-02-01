import { RemovalPolicy, Duration } from 'aws-cdk-lib';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Architecture, Code, DockerImageCode, DockerImageFunction, FunctionUrlAuthType, LoggingFormat, Runtime } from 'aws-cdk-lib/aws-lambda';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { join } from 'path';
import { EnforcedStack, EnforcedStackProps } from '@xaaxaax/cdk-core';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
export interface LambdaCustomImageWithExtensionStackProps extends EnforcedStackProps {
  extensionName: string,
  streamName: string,
  description?: string
}

export class LambdaCustomImageWithExtensionStack extends EnforcedStack {

  constructor(scope: Construct, id: string, props: LambdaCustomImageWithExtensionStackProps) {
    super(scope, id, props);

    const managedPolicyName = StringParameter.fromStringParameterName(
      this, 'policyName', `/${props.contextVariables.stage}/logs-collector-observability-core/telemetry/kinesis/runtime/policy/arn`).stringValue;
  
    const functionRole = new Role(this, 'LambdaFunctionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        ManagedPolicy.fromManagedPolicyArn(this, 'managed-policy', managedPolicyName)
      ]
    });

    const customImageLambda = new DockerImageFunction(
      this,
      `Lambda${DockerImageFunction.name}`,
      {
        code: DockerImageCode.fromImageAsset(join(process.cwd())),
        memorySize: 1024,
        architecture: Architecture.ARM_64,
        timeout: Duration.seconds(30),
        role: functionRole,
        environment: {
          REGION: this.region,
        },
        loggingFormat: LoggingFormat.JSON,
        
      }
    );

    new LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/lambda/${customImageLambda.functionName}`,
      retention: 1,
      removalPolicy: RemovalPolicy.DESTROY
    });

    customImageLambda.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE
    })
  }
}
