import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { join } from 'path';
import { EnforcedStack, EnforcedStackProps } from '@xaaxaax/cdk-core';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { IpAddresses, Peer, Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { CapacityProviderStrategy, Cluster, ContainerImage, CpuArchitecture, FargatePlatformVersion, FargateService, FargateTaskDefinition, FirelensConfigFileType, FirelensLogRouterType, LogDrivers, OperatingSystemFamily, PropagatedTagSource } from 'aws-cdk-lib/aws-ecs';
export interface FargateTaskStackProps extends EnforcedStackProps {
  extensionName: string,
  streamName: string,
  description?: string
}

export class FargateTaskStack extends EnforcedStack {

  constructor(scope: Construct, id: string, props: FargateTaskStackProps) {
    super(scope, id, props);

    const { region, account } = Stack.of(this);
    const managedPolicyArn = StringParameter.fromStringParameterName(
      this, 'policyName', `/${props.contextVariables.stage}/logs-collector-observability-core/telemetry/kinesis/runtime/policy/arn`).stringValue;

    
    const vpc = new Vpc(this, "VPC", {
      ipAddresses: IpAddresses.cidr("10.0.0.0/24"),
      natGateways: 0,
      subnetConfiguration: [
        { name: "public-subnet", subnetType: SubnetType.PUBLIC},
      ],
    });

    const taskSecurityGroup = new SecurityGroup(this, 'SecurityGroup', {
      vpc,
      allowAllOutbound: true,
    });
    taskSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.allTraffic());

    const cluster = new Cluster(this, 'Cluster', {
      enableFargateCapacityProviders: true,
      vpc,
    });

    const capacityStrategy: CapacityProviderStrategy[] = [{ capacityProvider: 'FARGATE_SPOT', weight: 1 }];

    const jobTaskRole = new Role(this, 'JobTaskRole', {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromManagedPolicyArn(this, 'TaskRoleManagedPolicy', managedPolicyArn),
      ],
    });

    const jobTaskExecutionRole = new Role(this, 'JobTaskExecutionRole', {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    const jobDefinition = new FargateTaskDefinition(this, 'JobDefinition', {
      cpu: 256,
      memoryLimitMiB: 512,
      runtimePlatform: {
        cpuArchitecture: CpuArchitecture.ARM64,
        operatingSystemFamily: OperatingSystemFamily.LINUX,
      },
      taskRole: jobTaskRole,
      executionRole: jobTaskExecutionRole,
    });

    jobDefinition.addContainer('Container', {
      image: ContainerImage.fromAsset(join(process.cwd())),
      logging: LogDrivers.firelens({
        options: {
          Name: 'kinesis_streams',
          region,
          stream: props.streamName,
        },
      }),
    });

    jobDefinition.addFirelensLogRouter('LoggingContainer', {
      image: ContainerImage.fromAsset(join(process.cwd(), 'fluent-bit')),
      logging: LogDrivers.awsLogs({
        streamPrefix: 'logging',
        logGroup: new LogGroup(this, 'LogGroup', {
          logGroupName: `/ecs/${props.contextVariables.context}`,
          retention: RetentionDays.ONE_DAY,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
      }),
      environment: {
        FLB_LOG_LEVEL: 'info',
      },
      firelensConfig: {
        type: FirelensLogRouterType.FLUENTBIT,
        options: {
          configFileType: FirelensConfigFileType.FILE,
          configFileValue: '/container.conf',
        },
      },
    });

    new FargateService(this, 'Service', {
      cluster,
      capacityProviderStrategies: capacityStrategy,
      desiredCount: 1,
      platformVersion: FargatePlatformVersion.VERSION1_4,
      propagateTags: PropagatedTagSource.TASK_DEFINITION,
      taskDefinition: jobDefinition,
      assignPublicIp: true,
      vpcSubnets: { subnets: vpc.publicSubnets },
      securityGroups: [ taskSecurityGroup ],
    });
  }
}
