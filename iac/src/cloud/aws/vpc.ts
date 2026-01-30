import * as awsx from "@pulumi/awsx";

export function createVpc(options: {
  name: string;
  numberOfAvailabilityZones: number;
  cidrBlock?: string;
}): awsx.ec2.Vpc {
  const vpc = new awsx.ec2.Vpc(options.name, {
    cidrBlock: options.cidrBlock || "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    numberOfAvailabilityZones: options.numberOfAvailabilityZones,
    natGateways: { strategy: "None" },
    subnetSpecs: [
      {
        type: awsx.ec2.SubnetType.Public,
        cidrMask: 24, // Creates 10.0.1.0/24 and 10.0.2.0/24...
      },
    ],
    tags: { Name: options.name },
  });

  return vpc;
}
