import * as pulumi from "@pulumi/pulumi";
import * as factory from "./src/deployment/factory";

const config = new pulumi.Config();
const serviceName = config.require("serviceName");

export = async (): Promise<any> => {
  await pulumi.log.info(
    `Hello, Pulumi! You are deploying the service: ${serviceName}`,
  );

  const service = factory.createService(serviceName, config);
  const outputs = await service.deploy();

  await pulumi.log.info(`Deployment of service ${serviceName} completed.`);
  return outputs;
};
