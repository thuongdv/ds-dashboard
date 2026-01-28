import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export function certificateArn(domainName: string): pulumi.Output<string> {
  const cert = new aws.acm.Certificate("app-cert", {
    domainName: domainName,
    validationMethod: "DNS",
  });

  return cert.arn;
}
