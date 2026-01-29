# Infrastructure Prerequisites

This document outlines the prerequisites and setup steps required before deploying the dashboard infrastructure using Pulumi.

## Required Tools

1. **Pulumi CLI** (v3.x or later)

   ```bash
   curl -fsSL https://get.pulumi.com | sh
   ```

2. **Node.js** (v20 or later)

   ```bash
   node --version  # Should be >= 20
   ```

3. **AWS CLI** configured with appropriate credentials

   ```bash
   aws configure
   ```

4. **Docker** (for building and pushing container images)
   ```bash
   docker --version
   ```

## AWS Prerequisites

### 1. ECR Repositories

The infrastructure expects pre-existing ECR repositories with pushed images. Create them manually or via separate infrastructure:

```bash
# Create HAProxy repository
aws ecr create-repository --repository-name dashboard-haproxy --region <your-region>

# Create Nginx repository
aws ecr create-repository --repository-name dashboard-nginx --region <your-region>
```

Build and push images:

```bash
# HAProxy
cd docker
docker build -f Dockerfile.haproxy -t dashboard-haproxy .
docker tag dashboard-haproxy:latest <account-id>.dkr.ecr.<region>.amazonaws.com/dashboard-haproxy:latest
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/dashboard-haproxy:latest

# Nginx (similar process)
docker build -f Dockerfile.nginx -t dashboard-nginx .
docker tag dashboard-nginx:latest <account-id>.dkr.ecr.<region>.amazonaws.com/dashboard-nginx:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/dashboard-nginx:latest
```

Or use the provided scripts:

```bash
cd scripts
./build-and-push-haproxy.sh
./build-and-push-nginx.sh
```

### 2. ACM Certificate

Create an SSL/TLS certificate in AWS Certificate Manager for your domain:

```bash
aws acm request-certificate \
  --domain-name yourdomain.com \
  --validation-method DNS \
  --region <your-region>
```

Validate the certificate using DNS validation records.

### 3. Route 53 Hosted Zone (Optional)

If you're using Route 53 for DNS management, ensure you have a hosted zone for your domain.

## Pulumi Configuration

### 1. Initialize Pulumi Stack

```bash
cd iac
npm install
pulumi stack init ds-dashboard-dev  # or your preferred stack name
```

### 2. Configure Required Settings

Set the following configuration values:

```bash
# AWS region
pulumi config set aws:region us-east-1

# Service name (must match factory.ts registration)
pulumi config set iac:serviceName dashboard-service

# Domain name for SSL certificate
pulumi config set iac:domainName yourdomain.com

# ECR repository URLs (from step 1)
pulumi config set iac:haproxyEcrRepoUrl <account-id>.dkr.ecr.<region>.amazonaws.com/dashboard-haproxy:latest
pulumi config set iac:nginxEcrRepoUrl <account-id>.dkr.ecr.<region>.amazonaws.com/dashboard-nginx:latest
```

### 3. Verify Configuration

Check your configuration:

```bash
pulumi config
```

Expected output:

```
KEY                         VALUE
aws:region                  us-east-1
iac:domainName              yourdomain.com
iac:haproxyEcrRepoUrl       <account-id>.dkr.ecr.<region>.amazonaws.com/dashboard-haproxy:latest
iac:nginxEcrRepoUrl         <account-id>.dkr.ecr.<region>.amazonaws.com/dashboard-nginx:latest
iac:serviceName             dashboard-service
```

## Deployment

### Preview Changes

```bash
pulumi preview
```

### Deploy Infrastructure

```bash
pulumi up
```

### View Outputs

After deployment:

```bash
pulumi stack output
```

Expected outputs:

- `vpcId`: VPC identifier
- `publicSubnetIds`: Comma-separated list of public subnet IDs
- `haproxyRepoUrl`: HAProxy ECR repository URL
- `nginxRepoUrl`: Nginx ECR repository URL
- `albDnsName`: Application Load Balancer DNS name

Additional outputs (such as security group IDs or ECS/task ARNs) may also be present; run `pulumi stack output` to see the full list.

## Post-Deployment

### 1. DNS Configuration

Point your domain to the ALB DNS name:

```bash
# Get ALB DNS name
pulumi stack output albDnsName

# Create CNAME or ALIAS record in Route 53 or your DNS provider
# yourdomain.com -> <alb-dns-name>
```

### 2. Verify Deployment

```bash
# Check ECS service status
aws ecs describe-services \
  --cluster dashboard-ecs-cluster \
  --services dashboard-ecs-service \
  --region <your-region>

# Access the application
curl https://yourdomain.com
```

## Troubleshooting

### Certificate Issues

Ensure your ACM certificate is validated and in the same region as your infrastructure.

```bash
aws acm list-certificates --region <your-region>
```

### Container Image Issues

Verify images exist in ECR:

```bash
aws ecr describe-images --repository-name dashboard-haproxy --region <your-region>
aws ecr describe-images --repository-name dashboard-nginx --region <your-region>
```

### Task Definition Failures

Check CloudWatch logs:

```bash
aws logs tail /ecs/haproxy-app --follow --region <your-region>
```

### Fargate Task Launch Failures

Common issues:

- IAM role permissions insufficient
- Security group misconfiguration
- Image pull failures (check ECR permissions)
- Invalid container definitions

Check ECS events:

```bash
aws ecs describe-services \
  --cluster dashboard-ecs-cluster \
  --services dashboard-ecs-service \
  --region <your-region> \
  --query 'services[0].events'
```

## Clean Up

To destroy all resources:

```bash
pulumi destroy
```

**Note**: This will NOT delete ECR repositories by default. Delete them manually if needed:

```bash
aws ecr delete-repository --repository-name dashboard-haproxy --force --region <your-region>
aws ecr delete-repository --repository-name dashboard-nginx --force --region <your-region>
```

## Development Workflow

1. Make infrastructure changes in `iac/src/`
2. Preview: `pulumi preview`
3. Deploy: `pulumi up`
4. Test changes
5. Commit to version control

## Security Considerations

- Store sensitive configuration in Pulumi secrets:
  ```bash
  pulumi config set --secret iac:someSecret <value>
  ```
- Follow least privilege principle for IAM roles
- Enable VPC flow logs for network monitoring
- Use AWS WAF if needed for additional protection
- Regularly update container images with security patches

## Additional Resources

- [Pulumi AWS Documentation](https://www.pulumi.com/docs/clouds/aws/)
- [ECS Fargate Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [Application Load Balancer Documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
