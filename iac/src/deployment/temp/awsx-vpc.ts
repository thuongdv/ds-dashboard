import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx"; // Import AWSX

// --- 0. Networking (VPC) ---

// Create the VPC using AWSX
// This automatically creates: VPC, Public Subnets, Internet Gateway, and Route Tables
const vpc = new awsx.ec2.Vpc("app-vpc", {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    numberOfAvailabilityZones: 2, // Automatically spreads across 2 AZs
    natGateways: { strategy: "None" }, // Save cost: No NAT Gateways (since we only use Public subnets)
    subnetSpecs: [
        {
            type: awsx.ec2.SubnetType.Public,
            cidrMask: 24, // Creates 10.0.1.0/24 and 10.0.2.0/24...
        },
    ],
    tags: { Name: "app-vpc" },
});

// --- Configuration Variables ---
const vpcId = vpc.vpcId;
const publicSubnetIds = vpc.publicSubnetIds;
const fargateSubnetIds = publicSubnetIds; 
const domainName = "example.com"; 

// --- 1. IAM Roles ---
const taskExecRole = new aws.iam.Role("task-exec-role", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: "ecs-tasks.amazonaws.com" }),
});

new aws.iam.RolePolicyAttachment("task-exec-policy", {
    role: taskExecRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
});

// --- 2. ECR Repositories ---
const haproxyRepo = new aws.ecr.Repository("haproxy-repo", { forceDelete: true });
const nginxRepo = new aws.ecr.Repository("nginx-repo", { forceDelete: true });

// --- 3. Security Groups ---
const albSg = new aws.ec2.SecurityGroup("alb-sg", {
    vpcId: vpcId,
    ingress: [
        { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
        { protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"] },
    ],
    egress: [
        { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] },
    ],
});

const fargateSg = new aws.ec2.SecurityGroup("fargate-sg", {
    vpcId: vpcId,
    ingress: [
        { 
            protocol: "tcp", 
            fromPort: 8080, 
            toPort: 8080, 
            securityGroups: [albSg.id] 
        },
    ],
    egress: [
        { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] },
    ],
});

// --- 4. Load Balancer & Certificate ---
const cert = new aws.acm.Certificate("app-cert", {
    domainName: domainName,
    validationMethod: "DNS",
});

const alb = new aws.lb.LoadBalancer("app-alb", {
    internal: false,
    securityGroups: [albSg.id],
    subnets: publicSubnetIds,
    loadBalancerType: "application",
});

const haproxyTargetGroup = new aws.lb.TargetGroup("haproxy-tg", {
    port: 8080,
    protocol: "HTTP",
    vpcId: vpcId,
    targetType: "ip", 
    healthCheck: { path: "/", port: "8080" },
});

// --- 5. Listeners ---
const httpListener = new aws.lb.Listener("http-listener", {
    loadBalancerArn: alb.arn,
    port: 80,
    defaultActions: [{
        type: "redirect",
        redirect: { port: "443", protocol: "HTTPS", statusCode: "HTTP_301" },
    }],
});

const httpsListener = new aws.lb.Listener("https-listener", {
    loadBalancerArn: alb.arn,
    port: 443,
    protocol: "HTTPS",
    sslPolicy: "ELBSecurityPolicy-2016-08",
    certificateArn: cert.arn,
    defaultActions: [{
        type: "forward",
        targetGroupArn: haproxyTargetGroup.arn,
    }],
});

// --- 6. ECS Service ---
const cluster = new aws.ecs.Cluster("app-cluster");

const appTask = new aws.ecs.TaskDefinition("app-task", {
    family: "haproxy-nginx-stack",
    cpu: "256",    
    memory: "512", 
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    executionRoleArn: taskExecRole.arn,
    containerDefinitions: pulumi.jsonStringify([
        {
            name: "haproxy",
            image: pulumi.interpolate`${haproxyRepo.repositoryUrl}:latest`, 
            essential: true,
            portMappings: [{ containerPort: 8080 }],
            logConfiguration: {
                logDriver: "awslogs",
                options: {
                    "awslogs-group": "/ecs/haproxy-app",
                    "awslogs-region": aws.config.region,
                    "awslogs-stream-prefix": "haproxy",
                    "awslogs-create-group": "true",
                },
            },
        },
        {
            name: "nginx",
            image: pulumi.interpolate`${nginxRepo.repositoryUrl}:latest`, 
            essential: true,
            portMappings: [{ containerPort: 80 }],
            logConfiguration: {
                logDriver: "awslogs",
                options: {
                    "awslogs-group": "/ecs/haproxy-app",
                    "awslogs-region": aws.config.region,
                    "awslogs-stream-prefix": "nginx",
                    "awslogs-create-group": "true",
                },
            },
        },
    ]),
});

const appService = new aws.ecs.Service("app-service", {
    cluster: cluster.arn,
    desiredCount: 2,
    // --- COST OPTIMIZATION START ---
    capacityProviderStrategies: [
        {
            capacityProvider: "FARGATE_SPOT",
            weight: 100, 
        },
    ],
    // --- COST OPTIMIZATION END ---
    taskDefinition: appTask.arn,
    networkConfiguration: {
        subnets: fargateSubnetIds,
        securityGroups: [fargateSg.id],
        assignPublicIp: true, 
    },
    loadBalancers: [{
        targetGroupArn: haproxyTargetGroup.arn,
        containerName: "haproxy",
        containerPort: 8080,
    }],
}, { dependsOn: [httpsListener] }); 

// --- 7. CloudWatch Dashboard ---
const dashboard = new aws.cloudwatch.Dashboard("app-dashboard", {
    dashboardName: "App-Performance-Monitor",
    dashboardBody: pulumi.all([cluster.name, appService.name, alb.arnSuffix]).apply(([clusterName, serviceName, albArnSuffix]) => JSON.stringify({
        widgets: [
            // Row 1: ECS Cluster Health
            {
                type: "metric",
                x: 0, y: 0, width: 12, height: 6,
                properties: {
                    metrics: [
                        ["AWS/ECS", "CPUUtilization", "ServiceName", serviceName, "ClusterName", clusterName, { color: "#d62728", label: "CPU %" }],
                        [".", "MemoryUtilization", ".", ".", ".", ".", { color: "#1f77b4", label: "Memory %" }]
                    ],
                    period: 60,
                    stat: "Average",
                    region: aws.config.region,
                    title: "Container Health (CPU & RAM)",
                    yAxis: { left: { min: 0, max: 100 } }
                }
            },
            // Row 1: Traffic Volume
            {
                type: "metric",
                x: 12, y: 0, width: 12, height: 6,
                properties: {
                    metrics: [
                        ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", albArnSuffix, { stat: "Sum", color: "#2ca02c", label: "Total Requests" }]
                    ],
                    period: 60,
                    region: aws.config.region,
                    title: "Traffic Volume",
                }
            },
            // Row 2: Latency
            {
                type: "metric",
                x: 0, y: 6, width: 24, height: 6,
                properties: {
                     metrics: [
                        ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", albArnSuffix, { color: "#9467bd", label: "Seconds" }]
                    ],
                    period: 60,
                    stat: "Average",
                    region: aws.config.region,
                    title: "App Latency (Target Response Time)",
                }
            }
        ]
    }))
});

// Export output variables
export const albDnsName = alb.dnsName;
export const haproxyRepoUrl = haproxyRepo.repositoryUrl;
export const nginxRepoUrl = nginxRepo.repositoryUrl;
export const dashboardName = dashboard.dashboardName;
export const vpcIdExport = vpc.vpcId;
