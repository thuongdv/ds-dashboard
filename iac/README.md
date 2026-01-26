Infrastructure Visualization

# 1. Traffic Flow Diagram (Mermaid)

This diagram shows how a user request travels through the AWS resources to reach the application.

```mermaid
graph TD
    User((User/Internet)) -->|HTTPS:443| IGW[Internet Gateway]

    subgraph VPC[VPC - Virtual Private Cloud]
        IGW -->|Route to ALB| ALB[Application Load Balancer]

        subgraph PublicSubnets[Public Subnets]
            ALB
            ALBSG[ALB Security Group<br/>Inbound: 80, 443<br/>Outbound: All]
        end

        ALB -->|SSL Termination| Listener443[HTTPS Listener :443]
        ALB -->|Redirect| Listener80[HTTP Listener :80]
        Listener80 -.->|Redirect to 443| User

        Listener443 -->|HTTP:8080| TG[Target Group<br/>Protocol: HTTP<br/>Port: 8080]

        subgraph PrivateSubnets[Private Subnets]
            subgraph FargateCluster[Fargate Cluster]
                TG -->|Health Check & Traffic| Task1[Fargate Task A]
                TG -->|Health Check & Traffic| Task2[Fargate Task B]

                TaskSG[Task Security Group<br/>Inbound: 8080 from ALB SG<br/>Outbound: All]

                subgraph Task1["Inside Task A (Sidecar Pattern)"]
                    H1[HAProxy Container<br/>Port: 8080] -->|Localhost:80| N1[Nginx Container<br/>Port: 80]
                end

                subgraph Task2["Inside Task B (Sidecar Pattern)"]
                    H2[HAProxy Container<br/>Port: 8080] -->|Localhost:80| N2[Nginx Container<br/>Port: 80]
                end
            end
        end

        TaskSG -.->|Protects| Task1
        TaskSG -.->|Protects| Task2
        ALBSG -.->|Protects| ALB
    end
```

# 2. Infrastructure Logic (Pseudo-Code)

This is a high-level translation of the Pulumi code into plain English logic.

START INFRASTRUCTURE SETUP

1.  SETUP PERMISSIONS (IAM)
    CREATE Role "TaskExecRole" ALLOWING Fargate TO: - Pull Docker images from registry - Write logs to CloudWatch

2.  SETUP FIREWALLS (Security Groups)
    CREATE "ALB_Firewall": - ALLOW Inbound Port 80 (HTTP) from ANYWHERE - ALLOW Inbound Port 443 (HTTPS) from ANYWHERE - ALLOW Outbound ALL

    CREATE "Fargate_Firewall": - ALLOW Inbound Port 8080 ONLY FROM "ALB_Firewall" - ALLOW Outbound ALL

3.  SETUP LOAD BALANCER
    REQUEST Certificate for "example.com"
    CREATE ALB "App-Load-Balancer" IN Public Subnets
    CREATE TargetGroup "HAProxy-Group": - Protocol: HTTP - Port: 8080 - TargetType: IP Address (Required for Fargate)

    ADD Listener on ALB Port 80: - ACTION: Redirect to HTTPS (Port 443)

    ADD Listener on ALB Port 443: - CERTIFICATE: "example.com" - ACTION: Forward traffic to "HAProxy-Group"

4.  DEFINE APPLICATION (ECS Task)
    DEFINE Task "HAProxy-Nginx-Stack": - CPU: 0.25 vCPU - RAM: 512 MB - CONTAINER 1 "HAProxy": - Image: Your Custom Image (haproxy.cfg included) - Expose Port: 8080 - CONTAINER 2 "Nginx": - Image: Official Nginx - Expose Port: 80 - (Note: HAProxy talks to Nginx via Localhost inside the task)

5.  LAUNCH SERVICE
    CREATE Service "App-Service": - RUN 2 copies of "HAProxy-Nginx-Stack" - NETWORK: Connect to "Fargate_Firewall" - REGISTER: Add containers to "HAProxy-Group" - PLATFORM: Fargate (Serverless)

END INFRASTRUCTURE SETUP

# 3. Key Takeaways

1. Strict Security: The Fargate tasks (your app) are effectively invisible to the public internet. They only accept traffic specifically from your Load Balancer on port 8080.

2. Sidecar Magic: HAProxy and Nginx live in the same "house" (Task). They talk to each other without leaving the server, ensuring max speed.

3. Self-Healing: If a Fargate task crashes, the ECS Service will automatically notice (via the Target Group health check) and spin up a new replacement.
