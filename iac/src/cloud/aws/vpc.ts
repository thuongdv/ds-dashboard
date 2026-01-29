import * as awsx from "@pulumi/awsx";

export function createVpc(config: {
  name: string;
  cidrBlock?: string;
  numberOfAvailabilityZones?: number;
}): awsx.ec2.Vpc {
  const vpc = new awsx.ec2.Vpc(config.name, {
    cidrBlock: config.cidrBlock || "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    numberOfAvailabilityZones: config.numberOfAvailabilityZones || 2, // Automatically spreads across 2 AZs
    natGateways: { strategy: "None" },
    subnetSpecs: [
      {
        type: awsx.ec2.SubnetType.Public,
        cidrMask: 24, // Creates 10.0.1.0/24 and 10.0.2.0/24...
      },
    ],
    tags: { Name: config.name },
  });

  return vpc;
}
