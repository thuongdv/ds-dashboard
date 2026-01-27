import * as awsx from "@pulumi/awsx";

export function createVPC(): awsx.ec2.Vpc {
  const vpc = new awsx.ec2.Vpc("app-vpc", {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    numberOfAvailabilityZones: 2, // Automatically spreads across 2 AZs
    natGateways: { strategy: "None" },
    subnetSpecs: [
      {
        type: awsx.ec2.SubnetType.Public,
        cidrMask: 24, // Creates 10.0.1.0/24 and 10.0.2.0/24...
      },
    ],
    tags: { Name: "app-vpc" },
  });

  return vpc;
}
