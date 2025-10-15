# Terragrunt Configuration for Production Environment
# Learning Notes:
# - Environment-specific configuration with remote state
# - Proper state locking and encryption
# - Input validation and dependency management

include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../modules//eks"
}

inputs = {
  cluster_name       = "yeelo-production"
  environment        = "production"
  kubernetes_version = "1.28"

  # VPC Configuration
  vpc_cidr        = "10.0.0.0/16"
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  # Node Group Configuration
  node_instance_types     = ["m5.large", "m5.xlarge"]
  node_group_min_size     = 3
  node_group_max_size     = 20
  node_group_desired_size = 6

  # Spot Instance Configuration
  spot_instance_types = ["m5.large", "m5.xlarge", "m5.2xlarge", "c5.large", "c5.xlarge"]
  spot_max_size       = 50
  spot_desired_size   = 10

  # Add-ons
  cluster_addons = {
    coredns = {
      version = "v1.10.1-eksbuild.5"
    }
    kube-proxy = {
      version = "v1.28.2-eksbuild.2"
    }
    vpc-cni = {
      version = "v1.15.1-eksbuild.1"
    }
    aws-ebs-csi-driver = {
      version = "v1.24.0-eksbuild.1"
    }
  }

  tags = {
    Environment = "production"
    Project     = "yeelo-homeopathy"
    ManagedBy   = "terraform"
    Owner       = "platform-team"
  }
}
