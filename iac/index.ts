import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as factory from "./src/deployment/factory";
import { registerAutoTags } from "./src/autotag";

const config = new pulumi.Config();
const environmentName = config.require("environmentName");
const serviceName = config.require("serviceName");

export = async (): Promise<any> => {
  await pulumi.log.info(`Hello, Pulumi! You are deploying the service: ${serviceName}`);

  const caller = await aws.getCallerIdentity();

  registerAutoTags({
    Creator: caller.arn,
    PulumiStack: pulumi.getStack(),
    Environment: environmentName,
    Service: serviceName,
  });

  const service = factory.createService(serviceName, config);
  const outputs = await service.deploy();

  await pulumi.log.info(`Deployment of service ${serviceName} completed.`);
  return outputs;
};
