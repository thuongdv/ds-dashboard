import * as pulumi from "@pulumi/pulumi";
import Service from "./service";
import * as s3 from "../cloud/aws/s3";

export default class ReactService extends Service {
  async deploy(): Promise<{ [key: string]: pulumi.Input<string> }> {
    const s3Bucket = await s3.deployS3Bucket("react-service-bucket");
    return { bucketName: s3Bucket.bucket };
  }
}
