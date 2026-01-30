import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export function createEcsCluster(options: { clusterName: string; tags?: { [key: string]: string } }): aws.ecs.Cluster {
  const cluster = new aws.ecs.Cluster(options.clusterName, {
    name: options.clusterName,
    settings: [
      {
        name: "containerInsights",
        value: "enabled",
      },
    ],
    tags: {
      Name: options.clusterName,
      ...options.tags,
    },
  });

  return cluster;
}

export function createEcsFargateTaskDefinition(options: {
  taskName: string;
  family: string;
  cpu: string;
  memory: string;
  executionRoleArn: pulumi.Input<string>;
  containerDefinitions: pulumi.Input<string>;
}): aws.ecs.TaskDefinition {
  const taskDefinition = new aws.ecs.TaskDefinition(options.taskName, {
    family: options.family,
    cpu: options.cpu,
    memory: options.memory,
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    executionRoleArn: options.executionRoleArn,
    containerDefinitions: options.containerDefinitions,
  });

  return taskDefinition;
}

export function createEcsFargateSpotService(options: {
  serviceName: string;
  clusterArn: pulumi.Input<string>;
  desiredCount: number;
  taskDefinitionArn: pulumi.Input<string>;
  vpcSubnetIds: pulumi.Input<string[]>;
  vpcSecurityGroupIds: pulumi.Input<string[]>;
  albTargetGroupArn: pulumi.Input<string>;
  httpsListener: aws.lb.Listener;
  containerName: string;
}): aws.ecs.Service {
  const appService = new aws.ecs.Service(
    options.serviceName,
    {
      cluster: options.clusterArn,
      desiredCount: options.desiredCount,
      // --- COST OPTIMIZATION START ---
      capacityProviderStrategies: [
        {
          capacityProvider: "FARGATE_SPOT",
          weight: 100,
        },
      ],
      // --- COST OPTIMIZATION END ---
      taskDefinition: options.taskDefinitionArn,
      networkConfiguration: {
        subnets: options.vpcSubnetIds,
        securityGroups: options.vpcSecurityGroupIds,
        assignPublicIp: true,
      },
      loadBalancers: [
        {
          targetGroupArn: options.albTargetGroupArn,
          containerName: options.containerName,
          containerPort: 8080,
        },
      ],
      healthCheckGracePeriodSeconds: 60,
    },
    { dependsOn: [options.httpsListener] },
  );

  return appService;
}
