import * as aws from "@pulumi/aws";

/**
 * Creates a CloudWatch Log Group with specified retention period
 *
 * @param options - Configuration options for the log group
 * @returns The created CloudWatch Log Group
 */
export function createLogGroup(options: { name: string; retentionInDays: number }): aws.cloudwatch.LogGroup {
  return new aws.cloudwatch.LogGroup(options.name, {
    name: options.name,
    retentionInDays: options.retentionInDays,
  });
}
