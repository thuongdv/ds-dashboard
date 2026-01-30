import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export function createAlb(options: {
  name: string;
  publicSubnetIds: pulumi.Input<string[]>;
  albSg: aws.ec2.SecurityGroup;
}): aws.alb.LoadBalancer {
  const alb = new aws.alb.LoadBalancer(options.name, {
    internal: false,
    securityGroups: [options.albSg.id],
    subnets: options.publicSubnetIds,
    loadBalancerType: "application",
  });

  return alb;
}

export function createAlbTargetGroup(options: {
  name: string;
  vpcId: pulumi.Input<string>;
  port: number;
  protocol: string;
}): aws.alb.TargetGroup {
  const targetGroup = new aws.alb.TargetGroup(options.name, {
    port: options.port,
    protocol: options.protocol,
    vpcId: options.vpcId,
    targetType: "ip",
    healthCheck: {
      enabled: true,
      path: "/health",
      port: options.port.toString(),
      protocol: options.protocol,
      healthyThreshold: 2,
      unhealthyThreshold: 3,
      timeout: 5,
      interval: 30,
      matcher: "200",
    },
  });

  return targetGroup;
}

export function createHttpListenerToRedirectToHttps(options: {
  name: string;
  albArn: pulumi.Input<string>;
}): aws.alb.Listener {
  const httpListener = new aws.alb.Listener(options.name, {
    loadBalancerArn: options.albArn,
    port: 80,
    defaultActions: [
      {
        type: "redirect",
        redirect: { port: "443", protocol: "HTTPS", statusCode: "HTTP_301" },
      },
    ],
  });

  return httpListener;
}

export function createHttpsListener(options: {
  name: string;
  albArn: pulumi.Input<string>;
  certificateArn: pulumi.Input<string>;
  targetGroupArn: pulumi.Input<string>;
}): aws.alb.Listener {
  const httpsListener = new aws.alb.Listener(options.name, {
    loadBalancerArn: options.albArn,
    port: 443,
    protocol: "HTTPS",
    sslPolicy: "ELBSecurityPolicy-2016-08",
    certificateArn: options.certificateArn,
    defaultActions: [
      {
        type: "forward",
        targetGroupArn: options.targetGroupArn,
      },
    ],
  });

  return httpsListener;
}
