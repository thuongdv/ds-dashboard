import * as aws from "@pulumi/aws";

export function createEcrRepository(repoName: string): aws.ecr.Repository {
  const repository = new aws.ecr.Repository(repoName, {
    name: repoName,
    imageScanningConfiguration: {
      scanOnPush: true,
    },
    tags: {
      Name: repoName,
    },
  });

  return repository;
}
