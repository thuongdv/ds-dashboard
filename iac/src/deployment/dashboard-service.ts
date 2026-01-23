import * as pulumi from "@pulumi/pulumi";
import Service from "./service";
import * as s3 from "../cloud/aws/s3";

export default class DashboardService extends Service {
  async deploy(): Promise<{ [key: string]: pulumi.Input<string> }> {
    const s3Bucket = s3.deployS3Bucket("dashboard-service-bucket");
    return { bucketName: s3Bucket.bucket };
  }
}
