import * as pulumi from "@pulumi/pulumi";
import * as vpc from "../cloud/aws/vpc";
import Service from "./service";

export default class DashboardService extends Service {
  async deploy(): Promise<{ [key: string]: pulumi.Input<string> }> {
    // Create a VPC
    const vpcResources = vpc.createVPC();

    // Create an internet gateway (IGW) and attach it to the VPC
    // This enables internet access for public subnets

    // Create public subnets in different availability zones

    // Create a route table and associate it with the public subnets

    // Create ALB security groups

    // Create Application Load Balancer

    // Create HTTP listener for ALB

    // Create HTTPS listener for ALB

    // Create private subnets in different availability zones

    // Create ECS cluster

    // Create 2 ECS task definitions

    // Create task execution role for ECS tasks

    // Create security groups for ECS tasks

    return {
      vpcId: vpcResources.vpcId,
      publicSubnetIds: vpcResources.publicSubnetIds.apply((ids) => ids.join(",")),
      privateSubnetIds: vpcResources.privateSubnetIds.apply((ids) => ids.join(",")),
    };
  }
}
