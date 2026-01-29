import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

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

  // Add permission to create CloudWatch log groups
  const caller = aws.getCallerIdentity({});
  const region = aws.getRegion({});
  const config = new pulumi.Config();
  const logGroupName = config.require("logGroupName");

  new aws.iam.RolePolicy(`${serviceName}-task-exec-logs-policy`, {
    role: taskExecRole.id,
    policy: pulumi.all([caller, region]).apply(([callerData, regionData]) =>
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
            Resource: `arn:aws:logs:${regionData.region}:${callerData.accountId}:log-group:${logGroupName}:*`,
          },
        ],
      }),
    ),
  });

  return taskExecRole;
}
