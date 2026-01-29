import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export function createHttpOnlySecurityGroup(config: {
  name: string;
  vpcId: pulumi.Input<string>;
}): aws.ec2.SecurityGroup {
  const httpOnlySg = new aws.ec2.SecurityGroup(config.name, {
    vpcId: config.vpcId,
    ingress: [
      { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
      { protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"] },
    ],
    egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
  });

  return httpOnlySg;
}

export function createFargateSecurityGroup(config: {
  name: string;
  vpcId: pulumi.Input<string>;
  albSecurityGroupId: pulumi.Input<string>;
}): aws.ec2.SecurityGroup {
  const fargateSg = new aws.ec2.SecurityGroup(config.name, {
    vpcId: config.vpcId,
    ingress: [{ protocol: "tcp", fromPort: 8080, toPort: 8080, securityGroups: [config.albSecurityGroupId] }],
    egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
  });

  return fargateSg;
}
