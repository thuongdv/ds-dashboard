# Docker Configuration

This directory contains Docker configurations for the HAProxy and Nginx services used in the dashboard deployment.

## Files

- `Dockerfile.haproxy`: Production HAProxy container
- `Dockerfile.haproxy.local`: Local development HAProxy container with self-signed certificates
- `Dockerfile.nginx`: Nginx container for serving static dashboard files
- `haproxy.cfg`: Production HAProxy configuration
- `haproxy.local.cfg`: Local development HAProxy configuration
- `nginx.conf`: Nginx configuration

## Security Warning: HAProxy Stats Endpoint

⚠️ **IMPORTANT**: The `haproxy.cfg` file contains a stats endpoint with default credentials (`admin:changeme123`).

**Before deploying to production, you MUST do one of the following:**

1. **Change the credentials** to a strong password in `haproxy.cfg`:
   ```
   stats auth your-username:your-strong-password
   ```

2. **Disable the stats endpoint** by commenting out or removing these lines in `haproxy.cfg`:
   ```
   # stats enable
   # stats uri /haproxy-stats
   # stats realm HAProxy\ Statistics
   # stats auth admin:changeme123
   # stats refresh 30s
   # stats show-legends
   # stats show-node
   ```

3. **Use network-level restrictions** (recommended in addition to authentication):
   - Configure AWS security groups to restrict access to the stats endpoint
   - Use VPC rules to limit which IPs can access the endpoint
   - Place HAProxy behind a WAF with appropriate rules

## Building Images

See the root-level scripts for building and pushing images:
- `scripts/build-and-push-haproxy.sh`
- `scripts/build-and-push-nginx.sh`

## Local Development

For local development, use Docker Compose:
```bash
./scripts/start-local.sh
```

This uses `haproxy.local.cfg` and self-signed certificates for local HTTPS testing.
