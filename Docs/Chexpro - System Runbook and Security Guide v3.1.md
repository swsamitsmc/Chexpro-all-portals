# Chexpro.com - System Runbook and Security Guide (SOC 2-Aligned)

**Document Version:** 3.1  
**Last Updated:** 2025-10-27  
**Audience:** Engineering, Security, IT Operations, Compliance, and Audit Teams

---

## Executive Summary

This document serves as the official operational runbook for the Chexpro.com web application. Its purpose is to provide a centralized, living resource for system architecture, operational procedures, security controls, and compliance evidence.

The project's primary objective is to serve as the public-facing marketing and lead-capture platform for Chexpro, informing potential clients about services and capturing sales leads through dedicated "Contact Us" and "Request a Demo" forms. The application is currently live and operational, hosted on a dedicated virtual machine within Oracle Cloud Infrastructure (OCI). The technology stack is modern, comprising a React/Vite frontend, a Node.js/Express backend API, and an OCI MySQL database, all served via an Nginx web server.

From a compliance perspective, the system has been designed with key SOC 2 principles in mind, particularly concerning Security, Availability, and Processing Integrity. Controls are in place for secret management, such as the use of restricted `.env` files, and for availability, through the PM2 process manager which ensures the backend service remains active. A notable strength is the implementation of least-privilege access for the application's database user, a control that was validated during production troubleshooting.

However, a comprehensive review has identified significant risks and control gaps that require immediate attention. The current change management and deployment process is entirely manual, error-prone, and lacks formal approval gates, representing a high risk to system availability and integrity. This is compounded by the absence of a true, segregated staging environment, meaning new code is first fully integrated in the production environment. Furthermore, the codebase contains known, unmitigated vulnerabilities within its open-source dependencies, and server administration relies on a shared user account, which undermines individual accountability.

This document provides a complete overview of the system architecture, operational procedures, and the current control landscape. It also incorporates a detailed strategic roadmap that serves as the formal plan for mitigating the identified risks through initiatives such as implementing a CI/CD pipeline, establishing automated security scanning, and hardening the overall infrastructure. The successful execution of this roadmap is critical to maturing the application's operational posture and ensuring its long-term security and compliance.

On 2025-10-27, routine updates were applied to OS packages (APT), backend NPM dependencies, and PHP Composer dependencies for Mautic and SuiteCRM. Critical service startup issues for Odoo/PostgreSQL and n8n (PM2) identified during the process were remediated.

The maintenance window also identified several items requiring follow-up: persistent Composer vulnerabilities in Mautic and SuiteCRM, a deferred frontend vulnerability patch due to dependency conflicts, missing n8n data in backups, and the need to improve MySQL backup consistency. These items have been documented and tracked.

---

## 1.0 Management Context and Scope

### 1.1 Project Overview and Business Value

The Chexpro.com project is the public-facing marketing website for Chexpro. Its core business objective is to generate sales leads by informing prospective clients about the company's services and capturing their information through "Contact Us" and "Request a Demo" forms. This function places the application at the top of the company's sales funnel, making its reliability and trustworthiness critical for business growth.

The long-term vision for the platform is to evolve beyond a simple marketing site into a core business operations platform, featuring secure self-service portals for both clients and candidates to manage background checks and view reports.

### 1.2 In-Scope Systems, Environments, and Boundaries

The system is comprised of the following components and environments:

**Production Environment:**

- **Tenancy:** Chexpro (OCID: `ocid1.tenancy.oc1..aaaaaaaab6gfnfvyufv6dr3lbox34nzrc6awmwzan3fo6qdzyhdqjbqzeaiq`)
- **Region:** Canada Southeast (Toronto) `ca-toronto-1`
- **Compartment:** chexpro-production (OCID: `ocid1.compartment.oc1..aaaaaaaat3tveligy56b6av4prbps2f7fu4qw223bxtu5i35sdpn2jnyrhia`)
- **Compute:** A single OCI virtual machine, `chexpro-main-server`.
  - OCID: `ocid1.instance.oc1.ca-toronto-1.an2g6ljrpvojynqcfbqopatgd4z2ijdt7jtudvpqngmfrxgonsf3n6l5ohzq`
  - Shape: VM.Standard.A1.Flex (4 OCPUs, 24 GB RAM)
  - Availability: AD-1, Fault Domain: FAULT-DOMAIN-2
  - Image: Ubuntu 24.04 (OCID: `ocid1.image.oc1.ca-toronto-1.aaaaaaaafipjxbt4xn7ebzyhlolxzg5dihd22byojwlc4xifxgbdzkabryha`)
  - Public IP: `132.145.96.174`
- **Database:** An OCI MySQL Database Service instance, `chexpro-mysql-db`.
  - Shape: MySQL.Free (Always Free)
  - Billing Metric: ECPU (1 Count)
  - HeatWave: Restricted/Disabled
- **Network:** An OCI Virtual Cloud Network (VCN), `chexpro-vcn`.
  - OCID: `ocid1.vcn.oc1.ca-toronto-1.amaaaaaapvojynqakckdsoae53to7z3mf7vwsduf2mcvwwpkelehvidtplya`
  - CIDR: `10.0.0.0/16`
  - DNS Domain: `chexprovcn.oraclevcn.com`

**Staging/Development Environments:**

- **Development:** All initial development and testing are performed in segregated local environments, typically using tools like XAMPP and MySQL Workbench to simulate the production stack.
- **Staging:** There is no persistent, dedicated staging environment that mirrors production. Instead, a directory on the production server, `/var/www/chexpro-frontend-build`, is used as a pre-live build and staging area for application code before it is copied to the live serving directory. This configuration means that the first time new code interacts with production configurations and the production database is during the final deployment step, introducing a significant risk to availability.

**Internal Application Portal**

- **Objective:** To provide a centralized, secure, and password-protected portal at `https://internal.chexpro.com` for accessing various internal company applications.
- **Technology Stack:** The portal is hosted on the same `chexpro-main-server` OCI VM. It uses Nginx as a reverse proxy for SSL termination and user authentication, with a Docker container running the Homer dashboard application.
- **Authentication:** Access is controlled via Nginx Basic Authentication, with user credentials stored in a hashed format in the `/etc/nginx/.htpasswd` file.

**Internal Workflow Automation Platform (n8n)**

- **Objective:** To provide a secure, internal platform for automating workflows and connecting various business applications, thereby improving operational efficiency and reducing manual tasks.
- **Technology Stack:** The platform runs the n8n application as a standard Node.js process on the `chexpro-main-server` OCI VM. It is managed by the PM2 process manager under the name `n8n-service` to ensure high availability and automatic restarts. It is served securely at `https://n8n.chexpro.com` via a dedicated Nginx reverse proxy server block.
- **Data Storage:** All workflow data, credentials, and execution logs are stored in an embedded SQLite database located within the user's home directory (`/home/chexproadmin/.n8n/`). This ensures data is persistent across application restarts.

### 1.3 Data Types Processed, Stored, and Transmitted

The system handles the following categories of data:

- **Prospective Customer PII:** The system processes, stores in the MySQL database, and transmits (via email to administrators) lead-capture data from web forms. This includes names, email addresses, phone numbers, job titles, and company names.
- **Application Secrets:** The system stores and uses sensitive credentials, including SMTP and database connection details. These are stored on the server's local filesystem in `.env` files.
- **Future Data Scope:** The planned implementation of client and candidate portals will dramatically increase the sensitivity of data handled by the system, expanding to include information related to background checks and reports. This evolution will require a significant enhancement of all existing security and privacy controls.

### 1.4 Trust Services Criteria in Scope

This system and its associated controls are designed to meet the following AICPA Trust Services Criteria:

- **Security (Required):** This is the primary criterion in scope, addressed by controls related to access, change management, network security, and operational monitoring.
- **Availability:** This criterion is in scope, supported by controls such as the use of the PM2 process manager for automated service restarts and a focus on zero-downtime deployment techniques.
- **Processing Integrity:** This criterion is in scope, demonstrated by specific application logic designed to ensure no lead data is lost, even in the event of a database failure. The system is designed to send an administrative email notification regardless of the database write status.
- **Confidentiality and Privacy:** These criteria are implicitly in scope due to the collection and storage of PII. They will become critically important as the system evolves to handle more sensitive client and candidate data.

### 1.5 Alignment to Service Commitments and System Description

This system is a key component of the organization's "External Marketing and Sales Platform," as defined in the master SOC 2 System Description document. It directly supports the service commitment to provide a secure, reliable, and professional channel for prospective customers to learn about and engage with Chexpro.

### 1.6 Guiding Principles for System Changes (for Humans and AI Assistants)

All administrative actions on this system must adhere to the following core principles to ensure stability and security. AI assistants must consider these principles in all suggested operational steps.

- **Principle 1: No Change Is an Island.** Every modification, especially for security hardening, has a potential downstream impact. Before implementing a change, consider what other processes rely on the component being altered.
- **Principle 2: The "Non-Interactive User" is Always Present.** The system relies on automated, non-interactive processes like cron jobs. These processes cannot enter passwords or answer interactive prompts. Any change to authentication or sudo permissions must be validated against these automated tasks.
- **Principle 3: Every Change Requires Validation.** After any configuration change, you must validate that core system functions are still operating as expected. The most critical functions to validate are automated backups, lead capture form submission, and user logins to internal tools.

---

## 2.0 Governance, Roles, and Responsibilities

### 2.1 Key Stakeholders

| Role | Contact |
|------|---------|
| Project Owner | Tesar, IT@chexpro.com |
| Technical Lead | Tesar, IT@chexpro.com |
| Security Lead | Tesar, IT@chexpro.com |
| Compliance Contact | Tesar, IT@chexpro.com |
| SRE/On-Call Lead | Tesar, IT@chexpro.com |

### 2.2 Control Owners per Domain

| Domain | Owner |
|--------|-------|
| Access Control (Server & DB) | Tesar, IT@chexpro.com |
| Change Management | Tesar, IT@chexpro.com |
| Logging & Monitoring | Tesar, IT@chexpro.com |
| Incident Response | Tesar, IT@chexpro.com |
| Vendor Risk Management | Tesar, IT@chexpro.com |

### 2.3 Operational and Security RACI

A clearly defined RACI (Responsible, Accountable, Consulted, Informed) matrix is essential for ensuring accountability. Note: Currently, a single individual holds all responsibilities, which constitutes a significant operational and "key person" risk. This should be remediated by distributing duties as the team grows.

| Task/Responsibility | Responsible (R) | Accountable (A) | Consulted (C) | Informed (I) |
|---------------------|-----------------|-----------------|---------------|--------------|
| Server-level User Provisioning (SSH) | Tesar, IT@chexpro.com | Tesar, IT@chexpro.com | Tesar, IT@chexpro.com | Tesar, IT@chexpro.com |
| Code Deployment (Manual Process) | Tesar, IT@chexpro.com | Tesar, IT@chexpro.com | Tesar, IT@chexpro.com | Tesar, IT@chexpro.com |
| Nginx Configuration Change | Tesar, IT@chexpro.com | Tesar, IT@chexpro.com | Tesar, IT@chexpro.com | Tesar, IT@chexpro.com |
| Periodic Access Review | Tesar, IT@chexpro.com | Tesar, IT@chexpro.com | Tesar, IT@chexpro.com | Tesar, IT@chexpro.com |
| Incident Response Execution | Tesar, IT@chexpro.com | Tesar, IT@chexpro.com | Tesar, IT@chexpro.com | Tesar, IT@chexpro.com |
| Database Schema Change | Tesar, IT@chexpro.com | Tesar, IT@chexpro.com | Tesar, IT@chexpro.com | Tesar, IT@chexpro.com |

---

## 3.0 Policies, Procedures, and Evidence Pointers

### 3.1 Applicable Policies

The operation of this system is governed by the following corporate policies. Note: These policies are currently pending creation. They must be drafted, approved, and linked here to address this control gap.

- **Access Control Policy:** [Link to Policy]
- **Data Classification & Retention Policy:** [Link to Policy]
- **Encryption Policy:** [Link to Policy]
- **Logging & Monitoring Policy:** [Link to Policy]
- **Change Management Policy:** All changes to the production environment must be tracked in the ticketing system. Each ticket must include a completed Impact Analysis before the change is approved.
  - **Dependency Check:** What other services or automated jobs depend on the component being changed? (Reference the System Interdependency Matrix).
  - **Validation Plan:** What specific steps will be taken immediately after the change to verify that critical system functions (backups, lead capture, logins) are still working?
  - **Rollback Plan:** What is the exact procedure to revert this change if the validation fails?
- **Incident Response Policy:** [Link to Policy]
- **Vendor Risk Management Policy:** [Link to Policy]
- **Business Continuity & Disaster Recovery Policy:** [Link to Policy]

### 3.2 Procedure References

Detailed operational procedures are described within this document. Key procedures include:

- **System Deployment:** See Section 6.0, Standard Operating Procedures (SOPs).
- **Server Access Management:** See Section 5.0, Access and Identity Controls.
- **Incident Troubleshooting:** See Section 7.0, Logging, Monitoring, and Operations.

### 3.3 Evidence Repository Pointers

Evidence of control execution is maintained in the following locations:

- **Ticketing System:** [Link to Ticketing System]
- **Code Reviews & Pull Requests:** All code modifications are tracked via commits and pull requests in the GitHub repository: <https://github.com/swsamitsmc/ChexproWebsitewithBackend>
- **Access Review Records:** [Link to Access Review Folder]
- **Log Review Records:** [Link to Log Review Folder]
- **Evidence Retention:** In accordance with the Data Retention Policy, all evidence related to SOC 2 controls will be retained for a minimum period of [Specify Period, e.g., 3 years].

---

## 4.0 System Architecture and Asset Inventory

### 4.1 System Architecture Summary

The application employs a simple three-tier architecture hosted on OCI.

- **Web Tier (Nginx):** Nginx version 1.24.0 serves as the public-facing entry point. It handles SSL/TLS termination using a Let's Encrypt certificate, enforces HTTPS via redirects, serves the static React/Vite frontend assets, and acts as a reverse proxy for all API calls.
- **Application Tier (Node.js):** A backend API built with Node.js and the Express framework listens on the local loopback interface (`http://127.0.0.1:3000`). It is responsible for all business logic, including validating form submissions and interacting with the database. The PM2 process manager ensures the Node.js application is always running.
- **Data Tier (MySQL):** An OCI MySQL Database Service instance (`chexpro-mysql-db`) stores all persistent data, such as form submissions. It is located in a private subnet, isolated from the public internet, and only accessible from the application server.

### 4.2 Trust Zones and Data Flows

The architecture establishes clear trust boundaries to protect sensitive components.

- **Untrusted Zone (Public Internet):** This includes any user accessing `https://chexpro.com`.
- **DMZ / Edge Zone:** This consists of the Nginx process running on `chexpro-main-server`. All incoming traffic is terminated and inspected here.
- **Trusted Application Zone:** This zone is the internal environment on the server. Communication between Nginx and the backend Node.js application occurs over the local loopback interface.
- **Highly Trusted Data Zone:** This zone is the private OCI subnet containing the MySQL database. Access is strictly controlled by Network Security Groups (NSGs) to only allow traffic from the application server.

**Form Submission Data Flow:** A user submits a form, initiating a POST request to an `/api/` endpoint. Nginx terminates the TLS connection and proxies the request to the backend Node.js application. The application validates the input and attempts to save the data to the MySQL database. Regardless of the database outcome, the application then sends an email notification to administrators. Finally, a response (200 OK or 500 Internal Server Error) is sent back to the user based on the success of the database write operation.

### 4.3 Asset Inventory

A complete and accurate asset inventory is fundamental for security management and compliance.

| Asset Type | Asset Name/Identifier | Description | Owner |
|------------|-----------------------|-------------|-------|
| Compute | chexpro-main-server | OCID: ...sf3n6l5ohzq (See Sec 1.2). Shape: VM.Standard.A1.Flex. OS: Ubuntu 24.04. Fault Domain: FD-2. | Tesar, IT@chexpro.com |
| Database | chexpro-mysql-db | Shape: MySQL.Free (Always Free), Metric: ECPU (1 Count). Version: 9.6.0 - Innovation. Region: Toronto. Deletion Protected: Enabled. | Tesar, IT@chexpro.com |
| Service | OpenSSH Server 1:9.6p1-3ubuntu13.14 | Secure shell (SSH) access service | Tesar, IT@chexpro.com |
| Service | Fail2Ban v1.0.2 | Brute-force attack mitigation service | Tesar, IT@chexpro.com |
| Service | Oracle Cloud Agent 1.48.0-17 | OCI platform management service | Tesar, IT@chexpro.com |
| Service | Nginx 1.24.0 | Web Server / Reverse Proxy | Tesar, IT@chexpro.com |
| Service | Node.js/Express v22.18.0 | Backend API | Tesar, IT@chexpro.com |
| Service | PM2 6.0.8 | Process Manager | Tesar, IT@chexpro.com |
| Service | Docker Engine 27.5.1 | Containerization Platform | Tesar, IT@chexpro.com |
| Service | Docker Compose 1.29.2 | Manages multi-container Docker applications | Tesar, IT@chexpro.com |
| Service | UFW (Uncomplicated Firewall) 0.36.2 | Host-based firewall service | Tesar, IT@chexpro.com |
| Service | Odoo 18.0 (Community Edition) | ERP and business management software. Runs as a systemd service from `/opt/odoo`. | Tesar, IT@chexpro.com |
| Service | PostgreSQL 16.9 | SQL database service, supporting Odoo. Listens only on localhost. | Tesar, IT@chexpro.com |
| Service | PHP-FPM 8.3.25 | PHP process manager, likely supporting Mautic and SuiteCRM. | Tesar, IT@chexpro.com |
| Service | n8n-service (PM2) | Workflow automation platform running as a Node.js process managed by PM2. | Tesar, IT@chexpro.com |
| Service | Cron 3.0pl1 | System task scheduler | Tesar, IT@chexpro.com |
| Web App | Mautic v6.0 | Marketing automation platform located at `/var/www/mautic` | Tesar, IT@chexpro.com |
| Web App | SuiteCRM v8.8.1 | Customer Relationship Management platform at `/var/www/suitecrm`. Accessible at `https://scrm.chexpro.com` | Tesar, IT@chexpro.com |
| Code Repo | swsamitsmc/Chexpro... | Monorepo for all source code | Tesar, IT@chexpro.com |
| Code Repo | swsamitsmc/ChexproIT-oci | Private GitHub repository for Infrastructure as Code (IaC). Contains all server configuration files and the disaster recovery runbook (README.md) | Tesar, IT@chexpro.com |
| Data Store | .env files | Secret storage on host | Tesar, IT@chexpro.com |
| Container | homer | Dashboard Application (Image: b4bz/homer:latest) running in Docker. | Tesar, IT@chexpro.com |
| Data Store | /etc/nginx/.htpasswd | Stores hashed user credentials for portal access. | Tesar, IT@chexpro.com |
| Data Store | /home/chexproadmin/.n8n/ | Stores all n8n data, including the SQLite database, workflows, and credentials | Tesar, IT@chexpro.com |
| Configuration | /etc/nginx/sites-available/... | Nginx virtual host configuration files. | Tesar, IT@chexpro.com |
| Configuration | /opt/n8n/docker-compose.yml | Defines the n8n service, its environment, and volume configuration. | Tesar, IT@chexpro.com |
| Configuration | /etc/odoo.conf | Main Odoo configuration file. | Tesar, IT@chexpro.com |
| Data Store | /opt/n8n/.env | Secret storage for n8n service, including the encryption key, domain, and other environment-specific variables. | |
| Configuration | /home/chexproadmin/homer_data/assets/config.yml | Homer dashboard content and layout configuration file. | |
| Configuration | /etc/nginx/sites-available/n8n.chexpro.com | Nginx virtual host configuration for the n8n subdomain. | |
| Configuration | /opt/n8n/docker-compose.yml | Defines the n8n service, its environment, and volume configuration for Docker Compose. | |
| Configuration | /etc/nginx/sites-available/internal-portal | Nginx virtual host configuration for the portal. | |
| Network | chexpro-vcn | OCID: ...lehvidtplya. CIDR: 10.0.0.0/16. Contains public/private subnets. | Tesar, IT@chexpro.com |

### 4.4 Configuration Baselines

- **Nginx:** The baseline configuration is now managed as a set of files. The main server block for chexpro.com is `/etc/nginx/sites-available/chexpro.com.conf`. Global SSL security settings have been centralized into a snippet file at `/etc/nginx/snippets/ssl-params.conf`, which is included by all SSL-enabled virtual hosts.
- **Application Code:** The baseline for all application code is the `master` branch of the GitHub repository.
- **Database Schema:** The baseline schema is defined by the `CREATE TABLE` statements documented in the handover materials.
- **Odoo:** The Odoo service has been hardened by configuring its XML-RPC interface to bind only to `127.0.0.1`. This ensures all traffic is processed securely through the Nginx reverse proxy. The main configuration file is located at `/etc/odoo.conf`.
- **n8n:** The n8n service configuration is managed by the PM2 process manager under the process name `n8n-service`. All of its persistent data, including the SQLite database and configuration files, is stored in the `/home/chexproadmin/.n8n/` directory.
- **SSL Certificates:** The system utilizes a single, wildcard Let's Encrypt certificate (`*.chexpro.com`) for all subdomains. This certificate is managed by Certbot under the name `chexpro.com`. All new Nginx server blocks for subdomains must be configured to use the certificate files located at `/etc/letsencrypt/live/chexpro.com/`.

### 4.5 System Interdependency Matrix

The following table outlines key dependencies between system components. This matrix must be consulted as part of any change management impact analysis.

| Dependent Service | Dependency Component | Requirement / Note |
|-------------------|----------------------|--------------------|
| Automated Backups (Cron) | sudoers Configuration | Requires a NOPASSWD rule for `/home/chexproadmin/app_backup.sh` and `/home/chexproadmin/db_backup.sh`. |
| Odoo Service | postgresql.service | The PostgreSQL service must be running for Odoo to start and operate. |
| Nginx (Reverse Proxy) | Backend Services | Requires upstream services (Node.js, Odoo, n8n) to be listening on their configured localhost ports. |
| DokuWiki (on Hostinger) | Remote SSH Command | Requires a cache-clearing command (`touch`) to be run after file uploads for changes to appear. |

### 4.6 Network Security Groups & Lists

The system utilizes Oracle Cloud Security Lists to enforce network segmentation.

**1. Public Web Tier (Default Security List)**

- **OCID:** `ocid1.securitylist.oc1.ca-toronto-1.aaaaaaaa5cowjgikitr4z4xkfaddrazwolnqvek6qmpnrzj2rdmng7plk3iq`
- **Role:** Protects the public-facing `chexpro-main-server`.
- **Ingress Rules:**
  - Allow HTTPS (TCP 443): From `0.0.0.0/0` (Global Public Internet).
  - Allow HTTP (TCP 80): From `0.0.0.0/0` (Global Public Internet).
  - ICMP (Ping): Permitted for diagnostics.
- **Note:** SSH (Port 22) is not explicitly listed in the global ingress rules here, which suggests it is likely managed via a more specific Network Security Group (NSG) or the rule was removed for hardening (verify if you use an NSG for SSH).

**2. Private Data Tier (Private Subnet Security List)**

- **OCID:** `ocid1.securitylist.oc1.ca-toronto-1.aaaaaaaac2kigblzknhqupi236sr42q7bxwrqvlcaf643573rsjtrank2vla`
- **Role:** Protects the `chexpro-mysql-db` database instance.
- **Ingress Rules:**
  - Allow MySQL (TCP 3306): Restricted to Source `10.0.0.0/24`.
  - **Security Validation:** This ensures the database cannot be accessed from the public internet, satisfying the "Defense in Depth" architectural principle.
  - Allow SSH (TCP 22): Restricted to internal VCN traffic (`10.0.0.0/16`) for internal jump-host management only.

---

## 5.0 Access and Identity Controls (CC6)

### 5.1 Access Model

Access controls are segregated by function, though opportunities for improvement exist.

**Roles and Least Privilege:**

- **Database:** The system demonstrates strong adherence to the principle of least privilege. The application connects to the database using a dedicated user (`chexpro_user`) which has permissions to perform data manipulation (CRUD) but is correctly denied permissions for schema modification (CREATE, ALTER). A separate, more privileged administrative user (`mysqladmin`) is used for schema changes.
- **Deletion Protection:** The production database `chexpro-mysql-db` has "Deletion Protection" enabled in OCI, preventing accidental termination of the instance via the console or API without a secondary confirmation step.
- **Server:** A single user, `chexproadmin`, is used for all administrative SSH access and application deployment tasks. The use of a shared administrative account is a significant control gap as it prevents individual accountability for actions performed on the server. The server also contains default user accounts (`opc`, `ubuntu`) which should be reviewed and disabled if not required.
- **Remediation In Progress:** On 2025-09-01, a new unique administrative account (`tesar`) was created and granted sudo privileges via SSH key-based authentication. This is the first step in a plan to phase out the use of the shared `chexproadmin` account for routine administrative tasks.
- **MFA:** Multi-Factor Authentication is not currently implemented for administrative SSH access.
- **Segregation of Duties:** The current manual deployment process does not enforce segregation of duties, as a single individual with SSH access can both push code changes and deploy them to production.

### 5.2 Periodic Access Review

- **Cadence:** Quarterly
- **Owner:** Tesar, IT@chexpro.com
- **Procedure:** The owner will generate a list of all users with SSH access to `chexpro-main-server` (including `opc`, `ubuntu`, and `chexproadmin`). This list will be provided to the relevant managers for review and attestation. Any access that is no longer required will be promptly revoked.
- **Evidence Location:** [Link to Access Review Folder]

### 5.3 Credential and Secret Handling

- **Storage:** Application secrets, such as database and SMTP credentials, are stored in `.env` files located in the application directories on the server (e.g., `/var/www/chexpro-backend/.env`).
- **Protection:** These files are explicitly excluded from the Git version control repository. On the server, file permissions are set to `600` (`-rw-------`), restricting read/write access to the file's owner (`chexproadmin`).
- **Rotation:** All sensitive credentials, including database passwords and API keys, must be rotated quarterly as per policy.

### 5.4 Admin and Break-Glass Access Procedures

- **Administrative Access:** Privileged SSH access to `chexpro-main-server` is restricted to authorized system administrators.
- **Break-Glass Procedure:**
  1. Emergency access requires verbal approval from the Project Owner.
  2. The OCI Console will be used to reset the password for the `ubuntu` user and a new temporary SSH key will be added.
  3. All actions taken during the session must be documented in a ticket.
  4. Temporary access must be revoked within one hour of the incident's resolution.

---

## 6.0 Standard Operating Procedures (SOPs)

This section contains step-by-step instructions for key operational tasks.

### 6.1 User Lifecycle Management (Internal Portal)

All user lifecycle activities for the internal portal (`internal.chexpro.com`) must be initiated via an approved ticket to ensure a complete audit trail. The following procedures apply to managing credentials in the `/etc/nginx/.htpasswd` file.

**Joiner (New User Provisioning)**

1. A formal access request is submitted and approved.
2. An administrator with sudo access to `chexpro-main-server` executes the command to create the new user:
   ```bash
   sudo htpasswd /etc/nginx/.htpasswd <new_username>
   ```
3. The administrator securely communicates the initial password to the user.

**Mover (Password Change)**

1. Users request password changes via a ticket.
2. An administrator executes the command:
   ```bash
   sudo htpasswd /etc/nginx/.htpasswd <existing_username>
   ```

**Leaver (User De-provisioning)**

1. Upon employee termination or role change, a de-provisioning ticket is generated.
2. An administrator must promptly remove the user using the command:
   ```bash
   sudo htpasswd -D /etc/nginx/.htpasswd <username_to_delete>
   ```

### 6.2 Manual Code Deployment Workflow

The current change deployment process is entirely manual. While informal validation checks are used, this process lacks formal controls.

1. **Connect:** An administrator connects to the production server (`chexpro-main-server`) via SSH.
2. **Pull Code:** The administrator navigates to the build directory (`/var/www/chexpro-frontend-build`), cleans the local repository, and pulls the latest code from the `master` branch of the GitHub repository.
3. **Build Assets:** Frontend dependencies are installed (`npm install`) and the application is built (`npm run build`).
4. **Deploy Files:** The built frontend assets and backend source files are synced to their respective live directories using `rsync`. The process includes a specific exclusion to prevent overwriting the production `.env` file.
5. **Update Dependencies:** Backend dependencies are installed in the live directory.
6. **Restart Service:** The backend application is gracefully reloaded using `pm2 reload chexpro-backend` to apply all changes without downtime.

### 6.3 Backup and Restore Procedures

A robust, automated backup and recovery strategy has been established, leveraging custom scripts and Oracle Cloud Infrastructure (OCI) Object Storage.

**Backup Procedures & Schedule**

**Daily Database Backups**

- **Script:** `/home/chexproadmin/db_backup.sh`
- **Schedule:** Runs daily at 02:00 server time.
- **Process:** The script creates compressed (`.sql.gz`) logical dumps for the Mautic, SuiteCRM, and Odoo databases and uploads them to the `chexpro-backups` OCI bucket.
- **Note:** The `mysqldump` commands currently generate warnings about potential inconsistencies due to missing the `--single-transaction` flag. An Odoo task has been created to investigate and add this flag to improve backup reliability.

**Weekly Application & Configuration Backups**

- **Script:** `/home/chexproadmin/app_backup.sh`
- **Schedule:** Runs weekly every Sunday at 03:00 server time.
- **Process:** The script creates a comprehensive backup (`.tar.gz`) of the `/var/www` and `/opt/odoo` directories, intelligently excluding temporary cache, log, and dependency directories (e.g., `node_modules`, `vendor`) to ensure an efficient backup. It then streams the archive to the `chexpro-backups` OCI bucket.
- **Note (2025-10-27):** It was identified that the n8n data directory (`/home/chexproadmin/.n8n`) is not included in the current `app_backup.sh` script scope. This represents a critical backup gap for n8n workflows and data. An Odoo task has been created to add this directory to the backup script.

**Restore Procedure (Validation Test)**

This procedure is designed to validate the integrity of the off-site backups without impacting the production environment.

1. **Confirm Availability:** List objects in the `chexpro-backups` OCI bucket to confirm recent backups are present.
2. **Download Sample:** Download a recent database archive and the latest application archive to a temporary, isolated directory on the server (e.g., `~/restore-test`).
3. **Validate Integrity:** Decompress the database backup to confirm it is a valid SQL file. List the contents of the application archive (`tar -tzvf <file>`) to verify its structure.
4. **Cleanup:** Securely delete the temporary directory and all downloaded files.

### 6.3.1 OCI Automated Backups (Primary Layer)

- **Mechanism:** Oracle Cloud Infrastructure Native Backup.
- **Status:** Enabled.
- **Schedule:** Automatic daily backups.
- **Backup Window:** 22:21 UTC.
- **Retention:** 1 Day (Default for Always Free).
- **Restoration Method:** Initiated via OCI Console (Point-in-Time Recovery is Disabled for Always Free).

### 6.4 Steps to Rotate a Critical Credential

1. Generate a new, strong password.
2. Update the `chexpro_user` password in the OCI MySQL Database Service console.
3. SSH into `chexpro-main-server`, edit the `/var/www/chexpro-backend/.env` file, and update the `DB_PASSWORD` variable.
4. Gracefully reload the backend application using `pm2 reload chexpro-backend` to apply the new secret.
5. Test the application to confirm it can still connect to the database.

### 6.5 Log Review Procedure

- **Cadence:** Weekly
- **Logs to Review:** `/var/log/nginx/error.log`, `/var/log/auth.log`, and `pm2 logs chexpro-backend`.
- **What to Look For:** Repeated patterns of 5xx errors, brute-force SSH attempts (`Failed password`), and unexpected application stack traces.
- **Action:** Document findings in the ticketing system.

### 6.6 SOP: Adding a New SSL-Secured Subdomain

1. Create a new Nginx configuration file in `/etc/nginx/sites-available/`.
2. Add the standard server configuration, ensuring the `server_name` is correct and the `root` points to the application's directory.
3. Do **NOT** run `certbot --nginx`. Instead, manually add the `listen 443 ssl;` directive and the following lines to the server block to use the existing wildcard certificate:
   ```nginx
   ssl_certificate /etc/letsencrypt/live/chexpro.com/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/chexpro.com/privkey.pem;
   include /etc/nginx/snippets/ssl-params.conf;
   ```
4. Create the symbolic link in `/etc/nginx/sites-enabled/`.
5. Test and restart Nginx using `sudo nginx -t` and `sudo systemctl restart nginx`.

---

## 7.0 Logging, Monitoring, and Operations (CC7)

### 7.1 Log Sources

The current logging approach is decentralized and primarily used for reactive troubleshooting.

- **Web Server Logs:** Nginx access and error logs are located at `/var/log/nginx/`.
- **Application Logs:** Backend Node.js application logs (stdout/stderr) are managed by PM2 and can be viewed using the command `pm2 logs chexpro-backend`.
- **System Logs:** System-level logs (e.g., syslog, auth.log) are located in `/var/log/`.
- **Application Logs (n8n):** Logs for the n8n service are managed by the PM2 process manager. They can be viewed in real-time using the command `pm2 logs n8n-service`. Persistent log files are also stored on the filesystem, typically within the `/home/chexproadmin/.n8n/logs/` directory.

### 7.2 Log Retention and Protected Storage

Currently, logs are only stored on the local filesystem of the production server. There is no centralized log aggregation or protected storage. This is a significant gap for security monitoring and incident investigation.

- **Log Retention Policy:** A formal policy is not yet defined. Based on the current server configuration:
  - **Nginx Logs:** Rotated daily, retained for 14 days.
  - **Other System Logs:** Default rotation is weekly, retained for 4 weeks.
  - **Application (PM2) Logs:** No rotation configured; these will grow indefinitely until manually cleared.

### 7.3 Alerting, Dashboards, and Paging

Proactive monitoring is in place via the OCI Monitoring service. All 5 active alarms (`VM_High_CPU`, `VM_High_Memory`, `MySQL_High_CPU`, `MySQL_High_Memory`, `MySQL_High_Storage`) were audited on 2025-09-16 and verified as correctly configured. Each alarm is properly tied to its specific `resourceId`.

All alarms are configured to send Critical alerts to the `chexpro-critical-alerts` notification topic, which has been verified as Active with a confirmed email subscription.

### 7.4 Runbooks and Playbooks

- **Operational Runbooks:** The deployment steps (Section 6.2) and service management commands (`pm2 status`, `sudo systemctl status nginx`) form the basis of an operational runbook.
- **Incident Response Playbooks:** [Link to IR Playbooks]

**Odoo "502 Bad Gateway" Incident Response Playbook:**

1. Check the status of the upstream service (`sudo systemctl status odoo.service`, `pm2 status chexpro-backend`).
2. If the service is down, attempt a restart and check logs for startup errors (`journalctl -u odoo.service`, `pm2 logs chexpro-backend`).
3. Check the Nginx error log (`/var/log/nginx/error.log`) for specific upstream connection errors.
4. Verify connectivity to the relevant database (e.g., PostgreSQL for Odoo).

---

## 8.0 Risk Management and Strategic Roadmap (CC3, CC9)

### 8.1 Risk Register

**Risk 1: Manual, Error-Prone Deployment Process**

- **Description:** The manual deployment workflow is susceptible to human error, which has previously caused production outages. It lacks automated quality and security gates.
- **Mitigation:** Implement a fully automated CI/CD pipeline using a tool like GitHub Actions. (Planned)
- **Residual Risk:** High

**Risk 2: Lack of a Segregated Staging Environment**

- **Description:** Without a staging environment that mirrors production, comprehensive testing of changes is impossible.
- **Mitigation:** Procure and configure a dedicated staging environment. (Planned)
- **Residual Risk:** High

**Risk 3: Use of Shared Administrative Account**

- **Description:** The use of the shared chexproadmin account for all server administration prevents individual accountability.
- **Mitigation:** Passwordless sudo was disabled on 2025-08-30. Implement unique named accounts. (In Progress)
- **Residual Risk:** Medium

**Risk 4: Weak Authentication for Internal Portal**

- **Description:** The internal portal uses Nginx Basic Auth which does not support MFA.
- **Mitigation:** Replace Basic Auth with a proper SSO solution that enforces MFA. (Planned)
- **Residual Risk:** Medium

**Risk 5: Manual User Lifecycle Management for Internal Portal**

- **Description:** The process for adding and removing portal users is manual and error-prone.
- **Mitigation:** A quarterly user access review is in place. (Current)
- **Residual Risk:** Low-Medium

**Risk 6: Application Service Not Enabled to Start on Boot (Remediated)**

- **Description:** The PM2 service was not configured to launch automatically on system boot.
- **Mitigation:** PM2 startup script was successfully enabled and verified on 2025-08-30. (Closed)
- **Residual Risk:** Low

**Risk 7: Odoo Service Lacks Automatic Recovery (Remediated)**

- **Description:** The Odoo systemd service was not configured to restart automatically after a crash.
- **Mitigation:** On 2025-09-09, odoo.service was hardened with Restart=always. (Closed)
- **Residual Risk:** Low

**Risk 8: Automated Backups Failing Due to Sudo Permissions (Remediated)**

- **Description:** The cron jobs executing backup scripts were failing silently, producing 0-byte files.
- **Mitigation:** On 2025-09-09, scripts were modified and NOPASSWD rules added to sudoers. (Closed)
- **Residual Risk:** Low

**Risk 9: Inconsistent MySQL Backups**

- **Description:** Daily database backups lack the --single-transaction flag, potentially leading to inconsistent backups under load.
- **Mitigation:** Add --single-transaction flag to mysqldump commands in db_backup.sh. (Planned)
- **Residual Risk:** Low-Medium

**Risk 10: Critical n8n Data Missing from Backups**

- **Description:** The app_backup.sh script does not include /home/chexproadmin/.n8n directory.
- **Mitigation:** Modify app_backup.sh to include the n8n data directory. (Planned)
- **Residual Risk:** High

**Risk 11: Frontend Vulnerability Patch Deferred**

- **Description:** A moderate vulnerability exists in the vite NPM package. Patching is blocked by a dependency conflict.
- **Mitigation:** Surgically update vite using npm install vite@latest --legacy-peer-deps. (Planned)
- **Residual Risk:** Medium

**Risk 12: Unpatched Composer Vulnerabilities (Mautic)**

- **Description:** 3 vulnerabilities (1 High, 2 Medium) that were not resolved by composer update.
- **Mitigation:** Investigate manual remediation or wait for Mautic updates. (Planned)
- **Residual Risk:** Medium-High

**Risk 13: Unpatched Composer Vulnerabilities (SuiteCRM)**

- **Description:** 4 medium vulnerabilities in tinymce/tinymce that were not resolved by composer update.
- **Mitigation:** Investigate manual remediation or wait for SuiteCRM updates. (Planned)
- **Residual Risk:** Medium

### 8.2 Strategic Roadmap

| Initiative | Description | Risk | Owner | Due Date |
|------------|-------------|------|-------|----------|
| Implement CI/CD Pipeline | Automate the entire build, test, and deployment process to eliminate manual errors and enforce quality gates. | High | Tesar, IT@chexpro.com | 2025-12-19 |
| Establish a Staging Environment | Procure and configure a dedicated staging environment that mirrors production. | High | Tesar, IT@chexpro.com | 2025-10-31 |
| Remediate Known Vulnerabilities | Continuously audit and update all third-party dependencies to patch known vulnerabilities. | Medium | Tesar, IT@chexpro.com | 2025-09-26 |
| Automate Weekly Marketing Review Archiving (Completed) | n8n workflow to automate archiving of weekly marketing review is complete as of 2025-09-07. | Low | Tesar, IT@chexpro.com | 2025-09-05 |

### 8.3 Security and Privacy Findings

- **2025-08-30:** npm audit reported zero vulnerabilities.
- **2025-09-09:** Full npm audit on frontend and backend codebases: zero known vulnerabilities.
- **2025-09-16:** Full npm audit: zero known vulnerabilities.
- **2025-10-27:** Backend: 3 moderate vulnerabilities remediated via npm update. Frontend: 1 moderate vulnerability in vite deferred due to dependency conflict. Mautic Composer: 3 vulnerabilities remain. SuiteCRM Composer: 4 medium vulnerabilities remain.

### 8.4 Dependencies and Single Points of Failure

- **Compute:** The entire application resides on a single VM (chexpro-main-server).
- **Database:** The system relies on a single database instance (chexpro-mysql-db).
- **Network:** The system is dependent on the availability of the OCI VCN and related network infrastructure.

---

## 9.0 Vendor and Third-Party Dependencies (CC9)

### 9.1 Inventory of Vendors and Services

| Vendor/Service | Purpose | Due Diligence Evidence Location |
|----------------|---------|----------------------------------|
| Oracle Cloud Infrastructure (OCI) | IaaS Provider | [Link to OCI SOC 2 Report] |
| Lets Encrypt | SSL Certificate Authority | [Link to Lets Encrypt Policy] |
| GitHub | Source Code Hosting and CI/CD | [Link to GitHub SOC 2 Report] |
| NPM (Node Package Manager) | Open-Source Software Registry | [Link to NPM Security Policy] |

### 9.2 Contractual Security Commitments and Monitoring

- **IaaS Provider:** The security and compliance posture of OCI is reviewed annually via their SOC 2 Type 2 report.
- **Open-Source Software:** Risks associated with open-source dependencies are managed through the planned implementation of automated dependency scanning tools (e.g., Snyk, Dependabot) within the CI/CD pipeline. This will serve as the primary control for managing supply chain risk, in alignment with CC9.2.

---

## 10.0 Business Continuity and Incident Response (CC7)

### 10.1 Recovery Objectives (RTO/RPO)

- **Recovery Time Objective (RTO):** 4 hours
- **Recovery Point Objective (RPO):** 24 hours

### 10.2 DR Test Scheduling and Evidence

- **Last Successful Backup Validation:** 2025-08-30

### 10.3 Integration with Organizational IR and BCP/DR

This system is classified as a [Classification Level] application in the corporate Business Continuity Plan. In the event of a major incident, the on-call team will follow the procedures documented in the corporate Incident Response Plan.

---

## 11.0 Evidence Checklist and SOC 2 Control Matrix

| SOC 2 Criteria | Control Description | Evidence Artifact | Evidence Location | Owner | Cadence |
|----------------|---------------------|-------------------|-------------------|-------|---------|
| CC1.2, CC1.3 | Roles and responsibilities are defined and communicated. | RACI Matrix in this document. | Section 2.3 | Tesar, IT@chexpro.com | Annually |
| CC3.2 | Project risks are identified, analyzed, and managed. | Risk Register in this document. | Section 8.1 | Tesar, IT@chexpro.com | Annually |
| CC6.1 | Logical access to the database is based on least privilege. | DB user permissions model description. | Section 5.1 | Tesar, IT@chexpro.com | On Change |
| CC6.1, CC6.5 | GAP: Shared administrative server account is used. | Description of shared chexproadmin account. | Section 5.1 | N/A | N/A |
| CC7.1 | System is monitored for configuration issues. | OCI Alarm definitions (5 active alarms) and the chexpro-critical-alerts topic | Section 7.1 | Tesar, IT@chexpro.com | On Incident |
| CC7.2 | GAP: No formal BCP/DR plan is in place or tested. | Lack of defined RTO/RPO in documentation. | Section 10.1 | N/A | N/A |
| CC8.1 | GAP: Changes are deployed via a manual process. | Manual deployment steps documented. | Section 6.2 | N/A | Per Change |
| CC9.2 | Risks from open-source dependencies are identified. | Mention of npm audit results. | Section 8.3 | Tesar, IT@chexpro.com | On Build |

---

## 12.0 First 30-Day Action Plan

### Week 1: Familiarization and Access Validation

- Review this entire runbook and all linked policies to understand the system architecture, controls, and procedures.
- Obtain and validate necessary privileged SSH credentials for chexpro-main-server and ensure access to all relevant evidence repositories.

### Week 2: Initial Audits and Baselining

- Perform a full npm audit on both frontend and backend codebases. Document all identified vulnerabilities and create a remediation plan.
- Formally document the risks identified in Section 8.1 in the corporate risk register.
- Perform a validation test of the backup and restore procedures (Section 6.3).

### Week 3: Operational Readiness and Control Implementation

- Begin the process of replacing the shared chexproadmin account with unique, named administrative accounts.
- Configure basic monitoring and alerting for system health and route alerts to the correct on-call rotation.

### Week 4: Strategic Planning and Governance

- Formally kick off the project to design and implement an automated CI/CD pipeline.
- Schedule the first official quarterly access review and other recurring operational cadences on the team shared calendar.

---

## Appendix A: Key Configuration References

This appendix provides a quick-reference guide to key configuration file locations.

| Component | Configuration File / Location | Notes |
|-----------|-------------------------------|-------|
| Nginx (Main Config) | /etc/nginx/nginx.conf | Global Nginx settings |
| Nginx (ChexPro.com vHost) | /etc/nginx/sites-available/chexpro.com.conf | Primary website config |
| Nginx (Internal Portal) | /etc/nginx/sites-available/internal-portal | Internal portal config |
| Nginx (n8n vHost) | /etc/nginx/sites-available/n8n.chexpro.com | n8n subdomain config |
| Nginx (SSL Snippet) | /etc/nginx/snippets/ssl-params.conf | Shared SSL/TLS hardening settings |
| Nginx (htpasswd) | /etc/nginx/.htpasswd | Portal user credentials |
| SSL Wildcard Certificate | /etc/letsencrypt/live/chexpro.com/ | Managed by Certbot |
| Backend App (.env) | /var/www/chexpro-backend/.env | DB and SMTP secrets |
| Odoo Config | /etc/odoo.conf | Odoo application settings |
| Odoo Service | /etc/systemd/system/odoo.service | Systemd unit file |
| n8n Docker Compose | /opt/n8n/docker-compose.yml | n8n service definition |
| n8n Environment | /opt/n8n/.env | n8n secrets and encryption key |
| n8n Data Directory | /home/chexproadmin/.n8n/ | Workflows, DB, credentials |
| Homer Config | /home/chexproadmin/homer_data/assets/config.yml | Dashboard layout |
| DB Backup Script | /home/chexproadmin/db_backup.sh | Daily database backups |
| App Backup Script | /home/chexproadmin/app_backup.sh | Weekly application backups |

---

## Appendix B: Common Operational Commands

This appendix provides a quick-reference cheatsheet for common administrative tasks.

### Service Management

`ash
# Check status of all PM2 processes
pm2 status

# View live logs for the backend app
pm2 logs chexpro-backend

# Gracefully reload the backend app (zero-downtime)
pm2 reload chexpro-backend

# View live logs for n8n
pm2 logs n8n-service

# Check Nginx syntax and restart
sudo nginx -t && sudo systemctl restart nginx

# Check Odoo service status
sudo systemctl status odoo.service

# Restart Odoo
sudo systemctl restart odoo.service
`

### Backup Operations

`ash
# Run database backup manually
sudo /home/chexproadmin/db_backup.sh

# Run application backup manually
sudo /home/chexproadmin/app_backup.sh

# List contents of the OCI backup bucket
oci os object list --bucket-name chexpro-backups
`

### Log Viewing

`ash
# View Nginx error log
sudo tail -f /var/log/nginx/error.log

# View authentication log (SSH attempts)
sudo tail -f /var/log/auth.log

# View Odoo application logs
sudo journalctl -u odoo.service -f
`

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| BCP | Business Continuity Plan. A documented plan for maintaining essential business functions during and after a disruption. |
| CC | Common Criteria. The control domains used in the SOC 2 framework (e.g., CC6 = Logical and Physical Access). |
| CI/CD | Continuous Integration / Continuous Deployment. An automated software delivery pipeline. |
| DR | Disaster Recovery. The process of restoring systems after a catastrophic event. |
| IaaS | Infrastructure as a Service. Cloud provider that manages the underlying hardware (e.g., OCI). |
| MFA | Multi-Factor Authentication. A security practice requiring more than one form of verification to log in. |
| NSG | Network Security Group. An OCI resource that acts as a virtual firewall for compute instances or databases. |
| OCI | Oracle Cloud Infrastructure. The cloud platform hosting the ChexPro production environment. |
| PM2 | Process Manager 2. A Node.js process manager used to keep the backend application and n8n running persistently. |
| RPO | Recovery Point Objective. The maximum acceptable amount of data loss, measured in time. |
| RTO | Recovery Time Objective. The maximum acceptable downtime after a disaster. |
| SOC 2 | Service Organization Control 2. An auditing framework for SaaS and cloud service providers. |
| SSO | Single Sign-On. An authentication scheme that allows users to log in with a single credential to multiple systems. |
| VCN | Virtual Cloud Network. The software-defined network in OCI. |

---

## Appendix D: Change Log

| Date | Author | Version | Summary of Changes |
|------|--------|---------|--------------------|
| 2025-08-30 | Tesar | 1.0 | Initial document creation. Established system overview, architecture, and initial security assessment. |
| 2025-09-01 | Tesar | 1.1 | Added new admin account (tesar) creation details to Section 5.1. Added Risk 3 and 4 to the Risk Register. |
| 2025-09-07 | Tesar | 1.2 | Added automated weekly marketing review archiving to Strategic Roadmap. |
| 2025-09-09 | Tesar | 1.3 | Closed Risk 7 (Odoo restart) and Risk 8 (backup sudo). Added System Interdependency Matrix (4.5). Added Odoo 502 playbook. Added SOP for new SSL subdomain (6.6). |
| 2025-09-16 | Tesar | 2.0 | Major revision. Added complete Nginx vHost inventory. Updated OCI alarm audit results. Added n8n service and data directory to asset inventory. Added n8n log sources to Section 7.1. |
| 2025-10-27 | Tesar | 3.0 | Major revision. Added Odoo and SuiteCRM to asset inventory. Added new risks (9-13) for backup gaps and vulnerabilities. Added SSL certificate centralization details to Section 4.4. |
| 2025-10-27 | Tesar | 3.1 | Added SOP 6.6 (Adding a New SSL-Secured Subdomain). Added Configuration Baselines section 4.4 note on n8n. Added Homer dashboard to asset inventory. |

