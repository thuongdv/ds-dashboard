import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

interface SecurityGroupConfig {
  name: string;
  vpcId: pulumi.Input<string>;
}

export function createSecurityGroup(config: SecurityGroupConfig): aws.ec2.SecurityGroup {
  const albSg = new aws.ec2.SecurityGroup(config.name, {
    vpcId: config.vpcId,
    ingress: [
      { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
      { protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"] },
    ],
    egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
  });

  return albSg;
}
