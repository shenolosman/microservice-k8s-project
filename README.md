## Microservice K8s Project

Simple microservice shopping website with three Python/Flask microservices and a React frontend.
- Auth service: register/login, JWT, users
- Product service: list/add/get/delete products
- Order service: place/list/delete orders (calls product service) per user
- Frontend: login/register, browse products, add/delete products as admin, place orders, view orders, list user as admin

### Prerequisites
- Docker + Docker Compose
- Node.js 18+ (for running the frontend locally)
- kubectl and an AKS cluster (for Kubernetes deployment)

### Run backend locally (Docker Compose)
1) In a terminal:
   - cd `backend`
   - `docker compose up --build`
   Services:
   - MongoDB: 27017 (container)
   - Auth: http://localhost:5000
   - Product: http://localhost:5001
   - Order: http://localhost:5002

### Seeding (first run)
- Product service automatically inserts 20 default products if the collection is empty.
- Auth service automatically creates an admin user if missing.
  - Username: `ADMIN_USERNAME` (default `admin`)
  - Password: `ADMIN_PASSWORD` (default `admin123`)
  - These are set in `backend/docker-compose.yml` for local dev.

### Run frontend locally (Vite dev proxy)
1) New terminal:
   - cd `frontend`
   - `npm install`
   - `npm run dev`
2) Open the Vite URL (default `http://localhost:5173`).
   Proxy routes:
   - `/api/auth`     -> `http://localhost:5000`
   - `/api/products` -> `http://localhost:5001`
   - `/api/orders`   -> `http://localhost:5002`

### API quick reference
- Auth
  - POST `/register` { username, password }
  - POST `/login` { username, password } -> { token }
  - POST `/refresh` (Authorization: Bearer <token>) -> { token }
- Products
  - GET `/products`
  - GET `/products/:id`
  - POST `/products` { name, price }
- Orders
  - POST `/orders` { product_id } (Authorization: Bearer <token>)
  - GET `/orders` (Authorization: Bearer <token>)

### Environment
- `MONGO_URI` (default `mongodb://mongo:27017` in compose)
- `JWT_SECRET` for auth/order (default "secret" if not set)
- `PRODUCT_SERVICE_URL` for order (default `http://product-service:5001`)
- `REDIS_HOST` optional (enable caching)
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` for admin user (auth-service)

### Deploy to AKS (example)
1) Namespace and secrets:
   - `kubectl apply -f k8s/namespace.yaml`
   - `kubectl apply -f k8s/jwt-secret.yaml`
   - `kubectl apply -f k8s/mongo-secret.yaml`
2) Storage + MongoDB:
   - `kubectl apply -f k8s/mongo-pvc.yaml`
   - `kubectl apply -f k8s/mongo-deployment.yaml`
   - `kubectl apply -f k8s/mongo-service.yaml`
3) Services + Frontend:
   - `kubectl apply -f k8s/product-deployment.yaml -f k8s/product-service.yaml`
   - `kubectl apply -f k8s/auth-deployment.yaml -f k8s/auth-service.yaml`
   - `kubectl apply -f k8s/order-deployment.yaml -f k8s/order-service.yaml`
   - `kubectl apply -f k8s/frontend-deployment.yaml -f k8s/frontend-service.yaml`
4) Ingress (requires NGINX ingress controller):
   - Update host in `k8s/ingress.yaml`
   - `kubectl apply -f k8s/ingress.yaml`

Notes:
- Compose file: `backend/docker-compose.yml`
- Frontend proxy: `frontend/vite.config.js`
- For production, build/push images and reference them in K8s deployments.
