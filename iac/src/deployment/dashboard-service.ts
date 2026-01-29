import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import * as acm from "../cloud/aws/acm";
import * as alb from "../cloud/aws/alb";
import * as cloudwatch from "../cloud/aws/cloudwatch";
import * as ec2 from "../cloud/aws/ec2";
import * as ecs from "../cloud/aws/ecs";
import * as iam from "../cloud/aws/iam";
import * as vpc from "../cloud/aws/vpc";
import Service from "./service";

const config = new pulumi.Config();
const domainName = config.require("domainName");
const haproxyRepoUrl = config.require("haproxyEcrRepoUrl");
const nginxRepoUrl = config.require("nginxEcrRepoUrl");
const numberOfAzs = config.getNumber("numberOfAzs") || 1;
const logRetentionInDays = config.getNumber("logRetentionInDays") || 1;
const fargateDesiredCount = config.getNumber("fargateDesiredCount") || 1;
const fargateCpu = config.get("fargateCpu") || "256";
const fargateMemory = config.get("fargateMemory") || "512";
const haproxyLogGroupName = config.require("logGroupName");

const awsConfig = new pulumi.Config("aws");
const region = awsConfig.require("region");

const haproxyContainerName = "haproxy";

export default class DashboardService extends Service {
  async deploy(): Promise<{ [key: string]: pulumi.Input<string> }> {
    // Create a VPC
    // Create an internet gateway (IGW) and attach it to the VPC
    // This enables internet access for public subnets
    // Create public subnets in different availability zones
    // Create a route table and associate it with the public subnets
    const vpcResources = vpc.createVpc({ name: "dashboard-vpc", numberOfAvailabilityZones: numberOfAzs });

    // Create ALB security groups
    const albSg = ec2.createHttpOnlySecurityGroup({
      name: "dashboard-alb-sg",
      vpcId: vpcResources.vpcId,
    });

    // Create Fargate security groups
    const fargateSg = ec2.createFargateSecurityGroup({
      name: "dashboard-fargate-sg",
      vpcId: vpcResources.vpcId,
      albSecurityGroupId: albSg.id,
    });

    // Create Application Load Balancer
    const albInstance = alb.createAlb({
      name: "dashboard-alb",
      publicSubnetIds: vpcResources.publicSubnetIds,
      albSg: albSg,
    });

    // Create Target Group for ALB
    const albTargetGroup = alb.createAlbTargetGroup({
      name: "dashboard-target-group",
      vpcId: vpcResources.vpcId,
      port: 8080,
      protocol: "HTTP",
    });

    // Create HTTP listener for ALB
    alb.createHttpListenerToRedirectToHttps({
      name: "dashboard-http-listener",
      albArn: albInstance.arn,
    });

    // Create HTTPS listener for ALB
    const httpsListener = alb.createHttpsListener({
      name: "dashboard-https-listener",
      albArn: albInstance.arn,
      certificateArn: acm.certificateArn(domainName),
      targetGroupArn: albTargetGroup.arn,
    });

    // Create CloudWatch Log Group with 7-day retention
    const logGroup = cloudwatch.createLogGroup({
      name: haproxyLogGroupName,
      retentionInDays: logRetentionInDays,
    });

    // Create ECS cluster
    const ecsCluster = ecs.createEcsCluster({
      clusterName: "dashboard-ecs-cluster",
    });

    // Create ECS task definition
    const taskDefinition = ecs.createEcsFargateTaskDefinition({
      taskName: "dashboard-task-def",
      family: "dashboard-family",
      cpu: fargateCpu,
      memory: fargateMemory,
      executionRoleArn: iam.createTaskExecutionRole().arn,
      containerDefinitions: this.containerDefinitions(logGroup),
    });

    // Create ECS Fargate Spot Service
    ecs.createEcsFargateSpotService({
      serviceName: "dashboard-ecs-service",
      clusterArn: ecsCluster.arn,
      desiredCount: fargateDesiredCount,
      taskDefinitionArn: taskDefinition.arn,
      vpcSubnetIds: vpcResources.publicSubnetIds,
      vpcSecurityGroupIds: fargateSg.id.apply((id) => [id]),
      albTargetGroupArn: albTargetGroup.arn,
      httpsListener: httpsListener,
      haproxyContainerName: haproxyContainerName,
    });

    return {
      vpcId: vpcResources.vpcId,
      publicSubnetIds: vpcResources.publicSubnetIds.apply((ids) => ids.join(",")),
      haproxyRepoUrl: haproxyRepoUrl,
      nginxRepoUrl: nginxRepoUrl,
      albDnsName: albInstance.dnsName,
      albArn: albInstance.arn,
      albSecurityGroupId: albSg.id,
      fargateSecurityGroupId: fargateSg.id,
      ecsClusterArn: ecsCluster.arn,
      taskDefinitionArn: taskDefinition.arn,
    };
  }

  private containerDefinitions = (logGroup: aws.cloudwatch.LogGroup) => {
    return pulumi.jsonStringify([
      {
        name: haproxyContainerName,
        image: haproxyRepoUrl,
        essential: true,
        portMappings: [{ containerPort: 8080 }],
        healthCheck: {
          command: ["CMD-SHELL", "wget -qO- http://localhost:8080/health || exit 1"],
          interval: 30,
          timeout: 5,
          retries: 3,
          startPeriod: 10,
        },
        logConfiguration: {
          logDriver: "awslogs",
          options: {
            "awslogs-group": logGroup.name,
            "awslogs-region": region,
            "awslogs-stream-prefix": haproxyContainerName,
          },
        },
      },
      {
        name: "nginx",
        image: nginxRepoUrl,
        essential: true,
        portMappings: [{ containerPort: 80 }],
        healthCheck: {
          command: ["CMD-SHELL", "wget -qO- http://localhost:80/health || exit 1"],
          interval: 30,
          timeout: 5,
          retries: 3,
          startPeriod: 10,
        },
        logConfiguration: {
          logDriver: "awslogs",
          options: {
            "awslogs-group": logGroup.name,
            "awslogs-region": region,
            "awslogs-stream-prefix": "nginx",
          },
        },
      },
    ]);
  };
}
