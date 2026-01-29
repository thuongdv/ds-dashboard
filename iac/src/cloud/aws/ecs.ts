import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export function createEcsCluster(config: { clusterName: string; tags?: { [key: string]: string } }): aws.ecs.Cluster {
  const cluster = new aws.ecs.Cluster(config.clusterName, {
    name: config.clusterName,
    settings: [
      {
        name: "containerInsights",
        value: "enabled",
      },
    ],
    tags: {
      Name: config.clusterName,
      ...config.tags,
    },
  });

  return cluster;
}

export function createEcsFargateTaskDefinition(config: {
  taskName: string;
  family: string;
  cpu: string;
  memory: string;
  executionRoleArn: pulumi.Input<string>;
  containerDefinitions: pulumi.Input<string>;
}): aws.ecs.TaskDefinition {
  const taskDefinition = new aws.ecs.TaskDefinition(config.taskName, {
    family: config.family,
    cpu: config.cpu,
    memory: config.memory,
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    executionRoleArn: config.executionRoleArn,
    containerDefinitions: config.containerDefinitions,
  });

  return taskDefinition;
}

export function createEcsFargateSpotService(config: {
  serviceName: string;
  clusterArn: pulumi.Input<string>;
  desiredCount: number;
  taskDefinitionArn: pulumi.Input<string>;
  vpcSubnetIds: pulumi.Input<string[]>;
  vpcSecurityGroupIds: pulumi.Input<string[]>;
  albTargetGroupArn: pulumi.Input<string>;
  httpsListener: aws.lb.Listener;
  haproxyContainerName: string;
}): aws.ecs.Service {
  const appService = new aws.ecs.Service(
    config.serviceName,
    {
      cluster: config.clusterArn,
      desiredCount: config.desiredCount,
      // --- COST OPTIMIZATION START ---
      capacityProviderStrategies: [
        {
          capacityProvider: "FARGATE_SPOT",
          weight: 100,
        },
      ],
      // --- COST OPTIMIZATION END ---
      taskDefinition: config.taskDefinitionArn,
      networkConfiguration: {
        subnets: config.vpcSubnetIds,
        securityGroups: config.vpcSecurityGroupIds,
        assignPublicIp: true,
      },
      loadBalancers: [
        {
          targetGroupArn: config.albTargetGroupArn,
          containerName: config.haproxyContainerName,
          containerPort: 8080,
        },
      ],
      healthCheckGracePeriodSeconds: 60,
    },
    { dependsOn: [config.httpsListener] },
  );

  return appService;
}
