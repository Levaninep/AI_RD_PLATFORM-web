# GPU Ollama Deployment

This project already supports a remote Ollama server in production through the chat route in `web/app/api/chat/route.ts`.

## Recommended Architecture

- Vercel hosts the web app.
- A GPU Linux server runs Ollama.
- Nginx terminates HTTPS and forwards requests to Ollama on `127.0.0.1:11434`.
- The proxy requires a bearer token.
- Vercel uses `OLLAMA_URL`, `OLLAMA_MODEL`, and `OLLAMA_AUTH_TOKEN`.

## Recommended Server Size

For a usable production chatbot, start with one of these:

- NVIDIA T4 16 GB VRAM, 4 vCPU, 16 GB RAM
- NVIDIA L4 24 GB VRAM, 8 vCPU, 32 GB RAM
- NVIDIA A10 24 GB VRAM, 8 vCPU, 32 GB RAM

For `llama3` class models, a T4 or better is the practical floor. CPU-only hosting will work, but latency will be poor.

## OS Assumptions

- Ubuntu 22.04 or 24.04
- Public DNS name such as `ollama.yourdomain.com`
- Ports `80` and `443` open

## 1. Install Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
sudo systemctl enable ollama
sudo systemctl start ollama
ollama pull llama3
```

Verify locally on the server:

```bash
curl http://127.0.0.1:11434/api/tags
```

## 2. Generate a Bearer Token

Create a long random token and keep it for Vercel:

```bash
openssl rand -hex 32
```

Example token variable used below:

```bash
export OLLAMA_PROXY_TOKEN="replace-with-your-token"
```

## 3. Install Nginx

```bash
sudo apt update
sudo apt install -y nginx
```

Create `/etc/nginx/sites-available/ollama`:

```nginx
server {
    listen 80;
    server_name ollama.yourdomain.com;

    client_max_body_size 10m;

    location / {
        if ($http_authorization != "Bearer replace-with-your-token") {
            return 401;
        }

        proxy_pass http://127.0.0.1:11434;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/ollama /etc/nginx/sites-enabled/ollama
sudo nginx -t
sudo systemctl reload nginx
```

## 4. Add HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ollama.yourdomain.com
```

After that, test from your local machine:

```bash
curl https://ollama.yourdomain.com/api/tags \
  -H "Authorization: Bearer replace-with-your-token"
```

## 5. Configure Vercel

Set these production environment variables for the `web` app:

```bash
OLLAMA_URL=https://ollama.yourdomain.com/api/chat
OLLAMA_MODEL=llama3
OLLAMA_AUTH_TOKEN=replace-with-your-token
```

The application server will then call the remote GPU-hosted Ollama endpoint directly.

## 6. Validate the End-to-End Path

After Vercel redeploys, test:

```bash
curl -X POST https://ai-rd-platform.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say hello in one sentence."}]}'
```

Expected behavior:

- `/api/chat` on Vercel returns a normal AI reply.
- The browser no longer needs direct local Ollama access.
- Other users can use the chat from anywhere.

## Security Notes

- Do not expose Ollama publicly without auth.
- Restrict inbound ports to `80` and `443`.
- Keep Ollama bound to localhost behind Nginx.
- Rotate the bearer token if it leaks.
- Consider IP allowlisting if only Vercel should reach the endpoint.

## Recommended Providers

- RunPod: good GPU price/performance for prototypes
- Vast.ai: cheaper, but more operational variance
- AWS EC2 GPU: more expensive, stronger control and networking
- Lambda Labs: straightforward GPU rentals

## Practical Recommendation

If you want the lowest-friction path, use a small GPU VM with Ubuntu, Ollama, Nginx, and a DNS name, then set the three Vercel variables above.
