# Deploying Topple on Ubuntu/Debian with systemd and NGINX

This guide assumes:

- The app will run on a VPS or home server with Ubuntu or Debian.
- NGINX will reverse proxy the app.
- The site will be served at `topple.vries.land`.
- The app will run as a dedicated `topple` user from `/srv/topple-mithril`.

## 1. DNS and firewall checks

Make sure `topple.vries.land` points at your server's public IP before requesting a certificate.

If you use `ufw`, open SSH, HTTP, and HTTPS:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## 2. Install system packages

Install the packages needed for Node, native module builds, NGINX, and Certbot:

```bash
sudo apt update
sudo apt install -y curl ca-certificates gnupg git build-essential python3 make g++ nginx certbot python3-certbot-nginx
```

Install Node.js 22 LTS from NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify the runtime tools:

```bash
node --version
npm --version
nginx -v
certbot --version
```

## 3. Create the service user and directories

Create a locked-down system user and the runtime directories the app will use:

```bash
sudo useradd --system --home /srv/topple-mithril --create-home --shell /usr/sbin/nologin topple
sudo mkdir -p /srv/topple-mithril
sudo mkdir -p /var/lib/topple
sudo mkdir -p /var/log/topple
sudo mkdir -p /var/www/certbot
sudo chown -R topple:topple /srv/topple-mithril
sudo chown -R topple:topple /var/lib/topple
sudo chown -R topple:topple /var/log/topple
sudo chown -R www-data:www-data /var/www/certbot
```

## 4. Copy the app onto the server

Clone the repo into the service directory:

```bash
sudo -u topple git clone <your-repo-url> /srv/topple-mithril
```

If the directory already exists and is not empty, update it instead:

```bash
sudo -u topple git -C /srv/topple-mithril pull
```

## 5. Install app dependencies and build the frontend

Run the install and build as the `topple` user:

```bash
sudo -u topple npm --prefix /srv/topple-mithril ci
sudo -u topple npm --prefix /srv/topple-mithril run build
```

## 6. Create the production env file

Copy the example env file and set the runtime paths:

```bash
sudo -u topple cp /srv/topple-mithril/.env.example /srv/topple-mithril/.env
sudo -u topple sed -i 's|^HOST=.*|HOST=127.0.0.1|' /srv/topple-mithril/.env
sudo -u topple sed -i 's|^PORT=.*|PORT=3000|' /srv/topple-mithril/.env
sudo -u topple sed -i '/^# DATA_DIR=/c\DATA_DIR=/var/lib/topple' /srv/topple-mithril/.env
sudo -u topple sed -i '/^# DB_FILE=/c\DB_FILE=/var/lib/topple/topple-prod.db' /srv/topple-mithril/.env
sudo -u topple sed -i '/^# LOG_DIR=/c\LOG_DIR=/var/log/topple' /srv/topple-mithril/.env
```

Check the file:

```bash
sudo -u topple cat /srv/topple-mithril/.env
```

## 7. Install the systemd service

Copy the service file into place:

```bash
sudo cp /srv/topple-mithril/deploy/systemd/topple.service /etc/systemd/system/topple.service
```

If your Node binary is not at `/usr/bin/node`, check it now:

```bash
which node
```

If needed, update `ExecStart=` in `/etc/systemd/system/topple.service` before starting the service.

Reload systemd, enable the service, and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable topple.service
sudo systemctl start topple.service
```

Check the service:

```bash
sudo systemctl status topple.service
sudo journalctl -u topple.service -n 100 --no-pager
```

Verify the app is answering locally before putting NGINX in front of it:

```bash
curl -I http://127.0.0.1:3000/
curl http://127.0.0.1:3000/api/v1/
```

## 8. Bootstrap NGINX on HTTP first

Install the HTTP-only bootstrap site before requesting the TLS certificate:

```bash
sudo cp /srv/topple-mithril/deploy/nginx/topple.vries.land.bootstrap.conf /etc/nginx/sites-available/topple.vries.land
sudo ln -sf /etc/nginx/sites-available/topple.vries.land /etc/nginx/sites-enabled/topple.vries.land
sudo nginx -t
sudo systemctl reload nginx
```

Verify the site answers on HTTP:

```bash
curl -I http://topple.vries.land/
```

## 9. Request the TLS certificate

Issue the certificate with Certbot:

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d topple.vries.land
```

Confirm the certificate files exist:

```bash
sudo ls -l /etc/letsencrypt/live/topple.vries.land/
```

## 10. Switch NGINX to the HTTPS config

Replace the bootstrap site with the final TLS-enabled site:

```bash
sudo cp /srv/topple-mithril/deploy/nginx/topple.vries.land.conf /etc/nginx/sites-available/topple.vries.land
sudo nginx -t
sudo systemctl reload nginx
```

Verify the live site:

```bash
curl -I https://topple.vries.land/
curl https://topple.vries.land/api/v1/
```

## 11. Updating the app later

For future deployments:

```bash
sudo -u topple git -C /srv/topple-mithril pull
sudo -u topple npm --prefix /srv/topple-mithril ci
sudo -u topple npm --prefix /srv/topple-mithril run build
sudo systemctl restart topple.service
sudo systemctl status topple.service
```

## 12. Quick troubleshooting

Check the app logs:

```bash
sudo journalctl -u topple.service -f
sudo ls -l /var/log/topple
```

Check NGINX:

```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -n 100 /var/log/nginx/topple.vries.land.error.log
```

Check permissions on the writable directories:

```bash
sudo ls -ld /srv/topple-mithril
sudo ls -ld /var/lib/topple
sudo ls -ld /var/log/topple
```
