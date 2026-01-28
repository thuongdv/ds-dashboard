import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export function createAlb(albConfig: {
  name: string;
  publicSubnetIds: pulumi.Input<string[]>;
  albSg: aws.ec2.SecurityGroup;
}): aws.alb.LoadBalancer {
  const alb = new aws.alb.LoadBalancer(albConfig.name, {
    internal: false,
    securityGroups: [albConfig.albSg.id],
    subnets: albConfig.publicSubnetIds,
    loadBalancerType: "application",
  });

  return alb;
}

export function createAlbTargetGroup(targetGroupConfig: {
  name: string;
  vpcId: pulumi.Input<string>;
  port: number;
  protocol: string;
}): aws.alb.TargetGroup {
  const targetGroup = new aws.alb.TargetGroup(targetGroupConfig.name, {
    port: targetGroupConfig.port,
    protocol: targetGroupConfig.protocol,
    vpcId: targetGroupConfig.vpcId,
    targetType: "ip",
    healthCheck: { path: "/", port: targetGroupConfig.port.toString() },
  });

  return targetGroup;
}

export function createHttpListenerToRedirectToHttps(httpConfig: {
  name: string;
  albArn: pulumi.Input<string>;
}): aws.alb.Listener {
  const httpListener = new aws.alb.Listener(httpConfig.name, {
    loadBalancerArn: httpConfig.albArn,
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

export function createHttpsListener(httpsConfig: {
  name: string;
  albArn: pulumi.Input<string>;
  certificateArn: pulumi.Input<string>;
  targetGroupArn: pulumi.Input<string>;
}): aws.alb.Listener {
  const httpsListener = new aws.alb.Listener(httpsConfig.name, {
    loadBalancerArn: httpsConfig.albArn,
    port: 443,
    protocol: "HTTPS",
    sslPolicy: "ELBSecurityPolicy-2016-08",
    certificateArn: httpsConfig.certificateArn,
    defaultActions: [
      {
        type: "forward",
        targetGroupArn: httpsConfig.targetGroupArn,
      },
    ],
  });

  return httpsListener;
}
