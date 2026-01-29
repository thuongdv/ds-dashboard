import * as pulumi from "@pulumi/pulumi";
import * as vpc from "../cloud/aws/vpc";
import * as alb from "../cloud/aws/alb";
import * as ec2 from "../cloud/aws/ec2";
import * as acm from "../cloud/aws/acm";
import * as ecr from "../cloud/aws/ecr";
import * as ecs from "../cloud/aws/ecs";
import * as aws from "@pulumi/aws";
import * as iam from "../cloud/aws/iam";
import Service from "./service";

const config = new pulumi.Config();
const awsConfig = new pulumi.Config("aws");
const domainName = config.require("domainName");
const region = awsConfig.require("region");
const haproxyRepoUrl = config.require("haproxyEcrRepoUrl");
const nginxRepoUrl = config.require("nginxEcrRepoUrl");
const haproxyContainerName = "haproxy";

export default class DashboardService extends Service {
  async deploy(): Promise<{ [key: string]: pulumi.Input<string> }> {
    // Create a VPC
    // Create an internet gateway (IGW) and attach it to the VPC
    // This enables internet access for public subnets
    // Create public subnets in different availability zones
    // Create a route table and associate it with the public subnets
    const vpcResources = vpc.createVpc({ name: "dashboard-vpc", numberOfAvailabilityZones: 2 });

    // Create ECR repositories
    const haproxyRepo = ecr.createEcrRepository("dashboard-haproxy");
    const nginxRepo = ecr.createEcrRepository("dashboard-nginx");

    // Create ALB security groups
    const albSg = ec2.createSecurityGroup({
      name: "dashboard-alb-sg",
      vpcId: vpcResources.vpcId,
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

    // Create ECS cluster
    const ecsCluster = ecs.createEcsCluster({
      clusterName: "dashboard-ecs-cluster",
    });

    // Create ECS task definition
    const taskDefinition = ecs.createEcsFargateTaskDefinition({
      taskName: "dashboard-task-def",
      family: "dashboard-family",
      cpu: "256",
      memory: "512",
      executionRoleArn: iam.createTaskExecutionRole().arn,
      containerDefinitions: this.containerDefinitions(),
    });

    // Create ECS Fargate Spot Service
    ecs.createEcsFargateSpotService({
      serviceName: "dashboard-ecs-service",
      clusterArn: ecsCluster.arn,
      desiredCount: 2,
      taskDefinitionArn: taskDefinition.arn,
      vpcSubnetIds: vpcResources.publicSubnetIds,
      vpcSecurityGroupIds: albSg.id.apply((id) => [id]),
      albTargetGroupArn: albTargetGroup.arn,
      httpsListener: httpsListener,
      haproxyContainerName: haproxyContainerName,
    });

    return {
      vpcId: vpcResources.vpcId,
      publicSubnetIds: vpcResources.publicSubnetIds.apply((ids) => ids.join(",")),
      privateSubnetIds: vpcResources.privateSubnetIds.apply((ids) => ids.join(",")),
      haproxyRepoUrl: haproxyRepo.repositoryUrl,
      nginxRepoUrl: nginxRepo.repositoryUrl,
      albDnsName: albInstance.dnsName,
    };
  }

  private containerDefinitions = () => {
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
            "awslogs-group": "/ecs/haproxy-app",
            "awslogs-region": region,
            "awslogs-stream-prefix": haproxyContainerName,
            "awslogs-create-group": "true",
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
            "awslogs-group": "/ecs/haproxy-app",
            "awslogs-region": region,
            "awslogs-stream-prefix": "nginx",
            "awslogs-create-group": "true",
          },
        },
      },
    ]);
  };
}
