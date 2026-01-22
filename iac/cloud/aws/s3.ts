import * as aws from "@pulumi/aws";
import { Bucket } from "@pulumi/aws/s3";

export async function deployS3Bucket(bucketName: string): Promise<Bucket> {
  const bucket = new aws.s3.Bucket(bucketName);
  return bucket;
}
