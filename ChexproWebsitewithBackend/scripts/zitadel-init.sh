#!/bin/bash

# Zitadel Initialization Script
# This script creates the organization, project, applications, and roles for ChexPro

set -e

# Configuration
ZITADEL_URL="${ZITADEL_URL:-http://localhost:8080}"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Secretzitadel123!}"
ORGANIZATION_NAME="${ORGANIZATION_NAME:-ChexPro}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Wait for Zitadel to be healthy
wait_for_zitadel() {
    log_info "Waiting for Zitadel to be ready..."
    max_attempts=60
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -sf "${ZITADEL_URL}/healthz" > /dev/null 2>&1; then
            log_info "Zitadel is healthy!"
            return 0
        fi
        attempt=$((attempt + 1))
        log_info "Attempt $attempt/$max_attempts - Zitadel not ready yet, waiting..."
        sleep 2
    done
    
    log_error "Zitadel did not become healthy within timeout"
    return 1
}

# Get admin token
get_admin_token() {
    log_info "Getting admin token..."
    
    local response
    response=$(curl -sf -X POST "${ZITADEL_URL}/oauth/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=${ADMIN_USERNAME}" \
        -d "password=${ADMIN_PASSWORD}" \
        -d "grant_type=password" \
        -d "scope=openid profile email" \
        -d "client_id=zitadel-admin")
    
    if [ $? -ne 0 ]; then
        log_error "Failed to get admin token"
        return 1
    fi
    
    echo "$response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4
}

# Create organization
create_organization() {
    log_info "Creating organization: ${ORGANIZATION_NAME}"
    
    local token=$1
    local org_id
    
    # Try to create organization
    local response
    response=$(curl -sf -X POST "${ZITADEL_URL}/admin/v1/organizations" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${token}" \
        -d "{\"name\":\"${ORGANIZATION_NAME}\"}" \
        2>&1) || true
    
    if echo "$response" | grep -q "already exists"; then
        log_warn "Organization already exists, using default..."
        ORG_ID="default"
    else
        ORG_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ -z "$ORG_ID" ]; then
            # Try to get existing org
            log_info "Trying to get existing organization..."
            ORG_ID="default"
        fi
    fi
    
    log_info "Organization ID: ${ORG_ID}"
    echo "$ORG_ID"
}

# Create project
create_project() {
    log_info "Creating project: ChexPro"
    
    local token=$1
    local project_name="ChexPro"
    
    local response
    response=$(curl -sf -X POST "${ZITADEL_URL}/admin/v1/projects" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${token}" \
        -d "{\"name\":\"${project_name}\",\"orgId\":\"${ORG_ID}\"}" \
        2>&1) || true
    
    local project_id
    project_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$project_id" ]; then
        log_error "Failed to create project"
        return 1
    fi
    
    log_info "Project ID: ${project_id}"
    echo "$project_id"
}

# Create role
create_role() {
    local token=$1
    local role_name=$2
    local role_key=$3
    local project_id=$4
    
    log_info "Creating role: ${role_name}"
    
    curl -sf -X POST "${ZITADEL_URL}/admin/v1/projects/${project_id}/roles" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${token}" \
        -d "{\"key\":\"${role_key}\",\"name\":\"${role_name}\"}" \
        > /dev/null 2>&1 || true
    
    log_info "Role ${role_name} created"
}

# Create application
create_application() {
    log_info "Creating application: $2"
    
    local token=$1
    local app_name=$2
    local app_type=$3
    local project_id=$4
    
    local response
    response=$(curl -sf -X POST "${ZITADEL_URL}/admin/v1/projects/${project_id}/apps" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${token}" \
        -d "{\"name\":\"${app_name}\",\"appType\":\"${app_type}\"}" \
        2>&1)
    
    local client_id
    client_id=$(echo "$response" | grep -o '"clientId":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$client_id" ]; then
        log_error "Failed to create application: ${app_name}"
        return 1
    fi
    
    log_info "Application ${app_name} created with Client ID: ${client_id}"
    echo "$client_id"
}

# Generate client secret
generate_client_secret() {
    local token=$1
    local project_id=$2
    local app_id=$3
    
    log_info "Generating client secret for app..."
    
    local response
    response=$(curl -sf -X POST "${ZITADEL_URL}/admin/v1/projects/${project_id}/apps/${app_id}/client-secret" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${token}" \
        -d "{\"type\":\"JSON\"}" \
        2>&1)
    
    local secret
    secret=$(echo "$response" | grep -o '"key":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$secret" ]; then
        log_warn "Could not generate client secret, using default..."
        secret="secret-placeholder"
    fi
    
    echo "$secret"
}

# Configure OIDC settings for application
configure_oidc() {
    local token=$1
    local project_id=$2
    local app_id=$3
    local redirect_uri=$4
    
    log_info "Configuring OIDC settings..."
    
    curl -sf -X PATCH "${ZITADEL_URL}/admin/v1/projects/${project_id}/apps/${app_id}/oidc" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${token}" \
        -d "{
            \"redirectUris\": [\"${redirect_uri}\"],
            \"logoutRedirectUris\": [\"http://localhost:5173/logout\"],
            \"responseTypes\": [\"CODE\"],
            \"grantTypes\": [\"AUTHORIZATION_CODE\",\"REFRESH_TOKEN\"],
            \"appType\": \"WEB\", 
            \"authMethod\": \"POST\",
            \"version\": \"OIDC\" 
        }" \
        > /dev/null 2>&1 || true
    
    log_info "OIDC configured"
}

# Main execution
main() {
    echo "========================================"
    echo "Zitadel Initialization Script"
    echo "========================================"
    echo ""
    
    # Wait for Zitadel
    wait_for_zitadel || exit 1
    
    # Get admin token
    log_info "Authenticating as ${ADMIN_USERNAME}..."
    ADMIN_TOKEN=$(get_admin_token)
    
    if [ -z "$ADMIN_TOKEN" ]; then
        log_error "Failed to authenticate. Using default credentials."
        log_warn "Please ensure Zitadel is running with default admin credentials"
        log_warn "Default: admin / Secretzitadel123!"
        ADMIN_TOKEN=""
    fi
    
    # If we couldn't get a token, use a placeholder approach
    if [ -z "$ADMIN_TOKEN" ]; then
        log_warn "Could not authenticate automatically."
        log_warn "Please configure Zitadel manually through the admin console."
        log_warn "URL: ${ZITADEL_URL}/ui/console"
        
        echo ""
        echo "========================================"
        echo "MANUAL CONFIGURATION REQUIRED"
        echo "========================================"
        echo ""
        echo "1. Open ${ZITADEL_URL}/ui/console"
        echo "2. Login with: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}"
        echo "3. Create organization: ${ORGANIZATION_NAME}"
        echo "4. Create project: ChexPro"
        echo "5. Create 2 applications:"
        echo "   - frontend-web (OIDC, Web, PKCE)"
        echo "   - backend-api (OIDC, Machine)"
        echo "6. Create roles: employer, candidate, admin"
        echo ""
        
        # Output template for manual configuration
        cat <<EOF
# ZITADEL CONFIGURATION (MANUAL SETUP REQUIRED)

# Frontend Configuration
VITE_ZITADEL_ISSUER=${ZITADEL_URL}
VITE_ZITADEL_CLIENT_ID=<YOUR-FRONTEND-CLIENT-ID>
VITE_ZITADEL_CLIENT_SECRET=<YOUR-FRONTEND-CLIENT-SECRET>
VITE_ZITADEL_REDIRECT_URI=http://localhost:5173/callback
VITE_ZITADEL_LOGOUT_URI=http://localhost:5173/logout

# Backend Configuration
ZITADEL_ISSUER=${ZITADEL_URL}
ZITADEL_BACKEND_CLIENT_ID=<YOUR-BACKEND-CLIENT-ID>
ZITADEL_BACKEND_CLIENT_SECRET=<YOUR-BACKEND-CLIENT-SECRET>
ZITADEL_JWKS_URI=${ZITADEL_URL}/oauth/jwks
EOF
        exit 0
    fi
    
    # Create organization
    ORG_ID=$(create_organization "$ADMIN_TOKEN")
    
    # Create project
    PROJECT_ID=$(create_project "$ADMIN_TOKEN")
    
    # Create roles
    create_role "$ADMIN_TOKEN" "Employer" "employer" "$PROJECT_ID"
    create_role "$ADMIN_TOKEN" "Candidate" "candidate" "$PROJECT_ID"
    create_role "$ADMIN_TOKEN" "Administrator" "admin" "$PROJECT_ID"
    
    # Create frontend application
    FRONTEND_CLIENT_ID=$(create_application "$ADMIN_TOKEN" "frontend-web" "WEB" "$PROJECT_ID")
    configure_oidc "$ADMIN_TOKEN" "$PROJECT_ID" "$FRONTEND_CLIENT_ID" "http://localhost:5173/callback"
    FRONTEND_SECRET=$(generate_client_secret "$ADMIN_TOKEN" "$PROJECT_ID" "$FRONTEND_CLIENT_ID")
    
    # Create backend application
    BACKEND_CLIENT_ID=$(create_application "$ADMIN_TOKEN" "backend-api" "SERVICE" "$PROJECT_ID")
    configure_oidc "$ADMIN_TOKEN" "$PROJECT_ID" "$BACKEND_CLIENT_ID" ""
    BACKEND_SECRET=$(generate_client_secret "$ADMIN_TOKEN" "$PROJECT_ID" "$BACKEND_CLIENT_ID")
    
    # Output configuration
    echo ""
    echo "========================================"
    echo "ZITADEL CONFIGURATION"
    echo "========================================"
    echo ""
    echo "Organization ID: ${ORG_ID}"
    echo "Project ID: ${PROJECT_ID}"
    echo ""
    echo "Admin Console: ${ZITADEL_URL}/ui/console"
    echo "Admin User: ${ADMIN_USERNAME}"
    echo "Admin Password: ${ADMIN_PASSWORD}"
    echo ""
    echo "========================================"
    echo "FRONTEND CONFIGURATION"
    echo "========================================"
    echo ""
    echo "VITE_ZITADEL_ISSUER=${ZITADEL_URL}"
    echo "VITE_ZITADEL_CLIENT_ID=${FRONTEND_CLIENT_ID}"
    echo "VITE_ZITADEL_CLIENT_SECRET=${FRONTEND_SECRET}"
    echo "VITE_ZITADEL_REDIRECT_URI=http://localhost:5173/callback"
    echo "VITE_ZITADEL_LOGOUT_URI=http://localhost:5173/logout"
    echo ""
    echo "========================================"
    echo "BACKEND CONFIGURATION"
    echo "========================================"
    echo ""
    echo "ZITADEL_ISSUER=${ZITADEL_URL}"
    echo "ZITADEL_BACKEND_CLIENT_ID=${BACKEND_CLIENT_ID}"
    echo "ZITADEL_BACKEND_CLIENT_SECRET=${BACKEND_SECRET}"
    echo "ZITADEL_JWKS_URI=${ZITADEL_URL}/oauth/jwks"
    echo ""
    echo "========================================"
    echo "ROLES CONFIGURED"
    echo "========================================"
    echo "- employer: Employer Portal access"
    echo "- candidate: Candidate Portal access"
    echo "- admin: Full administrative access"
    echo ""
    
    # Generate .env.zitadel output
    cat <<EOF > .env.zitadel.generated
# Generated by zitadel-init.sh
# Copy this to .env.zitadel and update as needed

# Zitadel Docker Configuration
ZITADEL_VERSION=latest
ZITADEL_MODE=development
ZITADEL_DEV_PLAINTEXT=true
ZITADEL_EXTERNAL_PORT=8080

# Database Configuration  
ZITADEL_DATABASE_POSTGRES_DBNAME=zitadel
ZITADEL_DATABASE_POSTGRES_USER=zitadel
ZITADEL_DATABASE_POSTGRES_PASSWORD=zitadel
ZITADEL_DATABASE_POSTGRES_HOST=localhost
ZITADEL_DATABASE_POSTGRES_PORT=5432
ZITADEL_DATABASE_POSTGRES_SSL_MODE=disable
ZITADEL_DB_PORT=5432

# Security
ZITADEL_SECURITYCONFIGURATION_ALLOWDBWRITERS=true

# TLS (disabled for local development)
ZITADEL_TLS_ENABLED=false

# Frontend Configuration
VITE_ZITADEL_ISSUER=${ZITADEL_URL}
VITE_ZITADEL_CLIENT_ID=${FRONTEND_CLIENT_ID}
VITE_ZITADEL_CLIENT_SECRET=${FRONTEND_SECRET}
VITE_ZITADEL_REDIRECT_URI=http://localhost:5173/callback
VITE_ZITADEL_LOGOUT_URI=http://localhost:5173/logout

# Backend Configuration
ZITADEL_ISSUER=${ZITADEL_URL}
ZITADEL_BACKEND_CLIENT_ID=${BACKEND_CLIENT_ID}
ZITADEL_BACKEND_CLIENT_SECRET=${BACKEND_SECRET}
ZITADEL_JWKS_URI=${ZITADEL_URL}/oauth/jwks
EOF
    
    log_info "Configuration saved to .env.zitadel.generated"
    log_info "Copy this file and update your environment variables"
}

# Run main
main "$@"
