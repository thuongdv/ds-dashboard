import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

/**
 * Look up an existing validated ACM certificate for the given domain.
 * If no validated certificate exists, you'll need to create one manually
 * and complete DNS validation before running Pulumi.
 */
export function certificateArn(domainName: string): pulumi.Output<string> {
  const cert = aws.acm.getCertificateOutput({
    domain: domainName,
    statuses: ["ISSUED"], // Only look for validated certificates
    mostRecent: true,
  });

  return cert.arn;
}

/**
 * Create a new ACM certificate and wait for DNS validation.
 * This requires the DNS records to be created manually or via Route53.
 */
export function createAndValidateCertificate(domainName: string): aws.acm.Certificate {
  const cert = new aws.acm.Certificate("app-cert", {
    domainName: domainName,
    validationMethod: "DNS",
  });

  return cert;
}
