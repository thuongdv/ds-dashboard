import * as aws from "@pulumi/aws";
import { Bucket } from "@pulumi/aws/s3";

export function deployS3Bucket(bucketName: string): Bucket {
  const bucket = new aws.s3.Bucket(bucketName, {
    // Explicitly set the bucket's name
    bucket: bucketName,
    // Enable default server-side encryption
    serverSideEncryptionConfiguration: {
      rule: {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: "aws:kms",
        },
      },
    },
    // Enable versioning to protect against accidental deletions/overwrites
    versioning: {
      enabled: true,
    },
    // Optional: basic tagging for identification/auditing
    tags: {
      Name: bucketName,
    },
  });

  // Block all forms of public access to the bucket
  new aws.s3.BucketPublicAccessBlock(`${bucketName}-public-access-block`, {
    bucket: bucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  });

  return bucket;
}
