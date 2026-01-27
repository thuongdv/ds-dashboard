import * as pulumi from "@pulumi/pulumi";
import Service from "./service";
import * as s3 from "../cloud/aws/s3";

export default class DashboardService extends Service {
  async deploy(): Promise<{ [key: string]: pulumi.Input<string> }> {
    // const s3Bucket = s3.deployS3Bucket("dashboard-service-bucket");
    // return { bucketName: s3Bucket.bucket };

    // Create a VPC for the dashboard service
    
    // Create an internet gateway (IGW) and attach it to the VPC
    // This enables internet access for public subnets
    
    // Create public subnets in different availability zones
    
    // Create a route table and associate it with the public subnets
    
    // Create security groups for the dashboard service

    // Create Application Load Balancer
    
    // Create private subnets in different availability zones

    // Create ECS cluster

    // Create 2 ECS task definitions
  }
}
