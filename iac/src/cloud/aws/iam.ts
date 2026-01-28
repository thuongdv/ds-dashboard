import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
const config = new pulumi.Config();

const serviceName = config.require("serviceName");

export function createTaskExecutionRole(): aws.iam.Role {
  const taskExecRole = new aws.iam.Role(`${serviceName}-task-exec-role`, {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: "ecs-tasks.amazonaws.com" }),
  });

  new aws.iam.RolePolicyAttachment(`${serviceName}-task-exec-policy`, {
    role: taskExecRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
  });

  return taskExecRole;
}
