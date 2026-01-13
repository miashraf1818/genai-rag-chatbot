# Deployment Summary & Performance Notes

## 🚀 Key Improvements & Fixes

We have successfully deployed the GenAI RAG Chatbot to AWS EC2. Here is a summary of the critical fixes and improvements implemented:

### 1. **Docker & Deployment Architecture**
*   **Full-Stack Containerization**: Successfully containerized Frontend (Next.js), Backend (FastAPI), and Database (PostgreSQL) using Docker Compose.
*   **Production Build**: Configured Frontend Dockerfile to use `npm run build` and `npm start` for optimized performance, avoiding the slow development server.
*   **Disk Space Optimization**: Cleaned up Docker build layers and unused dependencies to fit within the EC2 volume.

### 2. **Authentication & Security**
*   **Google OAuth Fixed**: Solved the `redirect_uri_mismatch` error by correctly configuring `nip.io` domain and updating Google Cloud Console credentials.
*   **Manual Auth**: Verified password hashing (`argon2`, `passlib`) and email validation for manual signups.
*   **Admin System**: Created `make_admin.py` script to safely promote users to Admin status via CLI.

### 3. **Backend Stability**
*   **Import Fixes**: Resolved `ModuleNotFoundError` by removing incorrect `backend.` prefixes from imports, ensuring compatibility with the Docker `/app` directory structure.
*   **Missing Dependencies**: Added `itsdangerous` and other missing packages to `requirements.txt`.
*   **Email Service**: Fixed hardcoded `localhost` links in welcome emails to point to the live server URL.

### 4. **Frontend Connectivity**
*   **Hardcoded URLs Removed**: Scanned and replaced all instances of `http://localhost:8000` with the dynamic `NEXT_PUBLIC_API_URL` environment variable. This ensures Chat, Upload, and Register features work on the live server.

---

## ⚠️ Known Issues & Performance

### **Current Performance Status: Functional but Slow**
You may notice that the application takes a few seconds to load or respond.

*   **Root Cause**: The application is running on a **`t2.micro`** EC2 instance.
    *   **CPU**: 1 vCPU (burst performance only).
    *   **RAM**: 1 GB.
*   **Impact**:
    *   Running Next.js (SSR), FastAPI (Python), and PostgreSQL simultaneously on 1GB RAM causes heavy memory pressure and swapping.
    *   **First Contentful Paint (FCP)**: ~3.3s (Acceptable for free tier, but not "snappy").
    *   **Interaction Delay**: ~120ms-250ms (Noticeable but usable).

### **Recommendations for Improvement**
If you plan to release this to real users, we highly recommend:

1.  **Upgrade Instance Type**:
    *   Switch to **`t3.small`** (2 vCPU, 2GB RAM) or **`t3.medium`** (2 vCPU, 4GB RAM). This will instantly make the app feel 5x faster.
2.  **Enable HTTPS**:
    *   Use Cloudflare Tunnel or Certbot to get a secure `https://` lock icon.
3.  **External Database**:
    *   Move PostgreSQL to AWS RDS to free up resources on the application server.

---

## 🛠️ How to Manage the App

### **Update Code**
```bash
git pull origin main
docker compose build --no-cache
docker compose up -d
```

### **Make a User Admin**
```bash
docker compose exec backend python make_admin.py your-email@gmail.com
```

```bash
docker compose logs -f backend
```

---

## 🏗️ Architecture & Technical Decisions

### **DNS Strategy: Wildcard Resolution (`nip.io`)**
*   **Context**: Google OAuth 2.0 strictly prohibits the use of raw IP addresses (e.g., `http://54.82.86.123/callback`) for Authorized Redirect URIs. It requires a valid Top-Level Domain (TLD).
*   **Solution**: We utilized `nip.io`, a dynamic wildcard DNS service.
    *   **Mechanism**: `54.82.86.123.nip.io` resolves directly to `54.82.86.123`.
    *   **Benefit**: This satisfies OAuth domain requirements without the overhead of purchasing and configuring a custom domain for the MVP phase.

### **SSL/TLS & Security**
*   **Current State**: The application runs on HTTP (`:3000` and `:8000`) behind the EC2 security group.
*   **Cloudflare Tunnel**: For secure access, we implemented `cloudflared`. This creates an outbound-only connection to Cloudflare's edge, providing an auto-generated HTTPS endpoint (`*.trycloudflare.com`) that tunnels traffic to the local Docker container.
*   **Production Path**: In a production environment, SSL termination should occur at a Load Balancer (ALB) or Reverse Proxy (Nginx) using a custom domain and Let's Encrypt certificates.

### **Infrastructure Scalability**
*   **Compute**: Currently deployed on `t2.micro` (Free Tier). This is resource-constrained (1 vCPU, 1GB RAM).
*   **Scaling Strategy**: The Dockerized architecture allows for horizontal scaling. The database should be migrated to AWS RDS, and the application containers can be orchestrated via ECS or Kubernetes (EKS) for high availability.
