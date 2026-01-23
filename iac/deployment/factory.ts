import { Config } from "@pulumi/pulumi";
import DashboardService from "./dashboard-service";
import Service from "./service";

const registeredServices: {
  [name: string]: { new (config: Config): Service };
} = {
  "dashboard-service": DashboardService,
};

export function createService(name: string, config: Config): Service {
  const serviceConstructor = registeredServices[name];
  if (!serviceConstructor) {
    throw new Error(`No service registered for stack ${name}`);
  }
  return new serviceConstructor(config);
}
