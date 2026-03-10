#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
#  Spacetoon Pocket — AWS Deployment Script
#  Usage: chmod +x deploy-aws.sh && ./deploy-aws.sh
#
#  Prerequisites:
#    1. AWS CLI installed and configured (aws configure)
#    2. Docker installed
#    3. Region: me-south-1 (Bahrain) — closest to target users
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# ─── Configuration ─────────────────────────────────────────────────────────────
APP_NAME="spacetoon-pocket"
AWS_REGION="me-south-1"
ECR_REPO="${APP_NAME}"
EC2_KEY_NAME="${APP_NAME}-key"
SECURITY_GROUP_NAME="${APP_NAME}-sg"
RDS_INSTANCE="${APP_NAME}-db"
RDS_DB_NAME="spacetoon_pocket"
RDS_USERNAME="spacetoon_admin"
EC2_INSTANCE_TYPE="t3.small"
RDS_INSTANCE_CLASS="db.t3.micro"

echo "══════════════════════════════════════════════════════════"
echo "  🚀 Spacetoon Pocket — AWS Deployment"
echo "  Region: ${AWS_REGION} (Bahrain)"
echo "══════════════════════════════════════════════════════════"

# ─── Step 1: Create ECR Repository ──────────────────────────────────────────
echo ""
echo "📦 Step 1: Creating ECR repository..."
aws ecr create-repository \
    --repository-name ${ECR_REPO} \
    --region ${AWS_REGION} \
    --image-scanning-configuration scanOnPush=true \
    2>/dev/null || echo "  ✓ ECR repository already exists"

ECR_URI=$(aws ecr describe-repositories \
    --repository-names ${ECR_REPO} \
    --region ${AWS_REGION} \
    --query 'repositories[0].repositoryUri' \
    --output text)
echo "  ✓ ECR URI: ${ECR_URI}"

# ─── Step 2: Build & Push Docker Image ──────────────────────────────────────
echo ""
echo "🐳 Step 2: Building Docker image..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URI}

docker build \
    --build-arg DATABASE_URL="${DATABASE_URL}" \
    --build-arg JWT_SECRET="${JWT_SECRET}" \
    -t ${APP_NAME}:latest .

docker tag ${APP_NAME}:latest ${ECR_URI}:latest
docker push ${ECR_URI}:latest
echo "  ✓ Docker image pushed to ECR"

# ─── Step 3: Create Security Group ──────────────────────────────────────────
echo ""
echo "🔒 Step 3: Creating Security Group..."
VPC_ID=$(aws ec2 describe-vpcs --region ${AWS_REGION} \
    --filters "Name=isDefault,Values=true" \
    --query 'Vpcs[0].VpcId' --output text)

SG_ID=$(aws ec2 create-security-group \
    --group-name ${SECURITY_GROUP_NAME} \
    --description "Spacetoon Pocket Security Group" \
    --vpc-id ${VPC_ID} \
    --region ${AWS_REGION} \
    --query 'GroupId' --output text 2>/dev/null || \
    aws ec2 describe-security-groups \
        --group-names ${SECURITY_GROUP_NAME} \
        --region ${AWS_REGION} \
        --query 'SecurityGroups[0].GroupId' --output text)

# Allow HTTP, HTTPS, SSH
aws ec2 authorize-security-group-ingress --group-id ${SG_ID} --protocol tcp --port 80 --cidr 0.0.0.0/0 --region ${AWS_REGION} 2>/dev/null || true
aws ec2 authorize-security-group-ingress --group-id ${SG_ID} --protocol tcp --port 443 --cidr 0.0.0.0/0 --region ${AWS_REGION} 2>/dev/null || true
aws ec2 authorize-security-group-ingress --group-id ${SG_ID} --protocol tcp --port 22 --cidr 0.0.0.0/0 --region ${AWS_REGION} 2>/dev/null || true
aws ec2 authorize-security-group-ingress --group-id ${SG_ID} --protocol tcp --port 3000 --cidr 0.0.0.0/0 --region ${AWS_REGION} 2>/dev/null || true
echo "  ✓ Security Group: ${SG_ID}"

# ─── Step 4: Create RDS PostgreSQL ──────────────────────────────────────────
echo ""
echo "🗄️  Step 4: Creating RDS PostgreSQL..."
read -sp "Enter RDS password for ${RDS_USERNAME}: " RDS_PASSWORD
echo ""

aws rds create-db-instance \
    --db-instance-identifier ${RDS_INSTANCE} \
    --db-instance-class ${RDS_INSTANCE_CLASS} \
    --engine postgres \
    --engine-version "16" \
    --master-username ${RDS_USERNAME} \
    --master-user-password "${RDS_PASSWORD}" \
    --allocated-storage 20 \
    --storage-type gp3 \
    --db-name ${RDS_DB_NAME} \
    --vpc-security-group-ids ${SG_ID} \
    --backup-retention-period 7 \
    --no-multi-az \
    --publicly-accessible \
    --region ${AWS_REGION} \
    2>/dev/null || echo "  ✓ RDS instance already exists"

echo "  ⏳ Waiting for RDS to become available (this takes ~5 minutes)..."
aws rds wait db-instance-available \
    --db-instance-identifier ${RDS_INSTANCE} \
    --region ${AWS_REGION}

RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier ${RDS_INSTANCE} \
    --region ${AWS_REGION} \
    --query 'DBInstances[0].Endpoint.Address' --output text)
echo "  ✓ RDS Endpoint: ${RDS_ENDPOINT}"

DATABASE_URL="postgresql://${RDS_USERNAME}:${RDS_PASSWORD}@${RDS_ENDPOINT}:5432/${RDS_DB_NAME}?sslmode=require"
echo "  ✓ DATABASE_URL configured"

# ─── Step 5: Create EC2 Key Pair ────────────────────────────────────────────
echo ""
echo "🔑 Step 5: Creating EC2 Key Pair..."
aws ec2 create-key-pair \
    --key-name ${EC2_KEY_NAME} \
    --region ${AWS_REGION} \
    --query 'KeyMaterial' --output text > ~/.ssh/${EC2_KEY_NAME}.pem 2>/dev/null && \
    chmod 400 ~/.ssh/${EC2_KEY_NAME}.pem || echo "  ✓ Key pair already exists"

# ─── Step 6: Launch EC2 Instance ────────────────────────────────────────────
echo ""
echo "🖥️  Step 6: Launching EC2 instance..."

# Amazon Linux 2023 AMI (ARM — cheaper for t3)
AMI_ID=$(aws ec2 describe-images \
    --owners amazon \
    --filters "Name=name,Values=al2023-ami-2023*-arm64" "Name=state,Values=available" \
    --region ${AWS_REGION} \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' --output text)

# User data script to install Docker and run the app
USER_DATA=$(cat << 'USERDATA'
#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install AWS CLI v2
yum install -y aws-cli

# Login to ECR and pull image
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/spacetoon-pocket"

aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ECR_URI}
docker pull ${ECR_URI}:latest

# Run the container
docker run -d \
    --name spacetoon-pocket \
    --restart always \
    -p 80:3000 \
    -e PORT=3000 \
    -e HOSTNAME=0.0.0.0 \
    -e NODE_ENV=production \
    ${ECR_URI}:latest
USERDATA
)

INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ${AMI_ID} \
    --instance-type ${EC2_INSTANCE_TYPE} \
    --key-name ${EC2_KEY_NAME} \
    --security-group-ids ${SG_ID} \
    --user-data "${USER_DATA}" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${APP_NAME}}]" \
    --region ${AWS_REGION} \
    --query 'Instances[0].InstanceId' --output text)

echo "  ⏳ Waiting for EC2 instance to start..."
aws ec2 wait instance-running \
    --instance-ids ${INSTANCE_ID} \
    --region ${AWS_REGION}

PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids ${INSTANCE_ID} \
    --region ${AWS_REGION} \
    --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

echo "  ✓ EC2 Instance: ${INSTANCE_ID}"
echo "  ✓ Public IP: ${PUBLIC_IP}"

# ─── Done ────────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════════"
echo "  ✅ Deployment Complete!"
echo ""
echo "  🌐 App URL: http://${PUBLIC_IP}"
echo "  🗄️  RDS: ${RDS_ENDPOINT}"
echo "  🔑 SSH: ssh -i ~/.ssh/${EC2_KEY_NAME}.pem ec2-user@${PUBLIC_IP}"
echo ""
echo "  📝 Next Steps:"
echo "    1. Wait 2-3 minutes for Docker to pull and start"
echo "    2. Visit http://${PUBLIC_IP} to verify"
echo "    3. Set up CloudFront + HTTPS (run deploy-cloudfront.sh)"
echo "    4. Add your domain when ready"
echo "══════════════════════════════════════════════════════════"
