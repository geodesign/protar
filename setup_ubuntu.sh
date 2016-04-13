# Setenv
echo "export DB_NAME=protar" >> ~/.bashrc
echo "export PYTHONPATH=\$PYTHONPATH:/protar" >> ~/.bashrc
echo "export DJANGO_SETTINGS_MODULE=protar.settings" >> ~/.bashrc
echo "export SECRET_KEY=protarkey" >> ~/.bashrc

# Update apt packages
apt-get update
apt-get upgrade -y

# Install apt libraries
apt-get install -y\
    build-essential\
    git\
    unrar-free\
    npm\
    python3-pip\
    python3-dev\
    python3-setuptools\
    libjpeg8-dev\
    postgresql-9.3\
    postgresql-client-9.3\
    postgresql-server-dev-9.3\
    postgresql-9.3-postgis-2.1\
    libproj-dev\
    libgeos-3.4.2\
    gdal-bin\
    rabbitmq-server\
    redis-server\
    supervisor\
    memcached

# Install npm libraries
npm install -g requirejs less less-plugin-autoprefix bower

# Tell bower where to find node
ln -s /usr/bin/nodejs /usr/bin/node

# Change psql access settings
sed -i "s/md5/trust/" /etc/postgresql/9.3/main/pg_hba.conf
sed -i "s/peer/trust/" /etc/postgresql/9.3/main/pg_hba.conf
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/9.3/main/postgresql.conf

# Create protar database
service postgresql restart
psql -U postgres -c 'create database protar'
psql -U postgres -d protar -c 'create extension postgis'

# Setup celery user
groupadd workers
useradd -G workers celery

# Create supervisord script -- supervisorctl tail celery stderr
echo '[program:celery]' > /etc/supervisor/conf.d/celery.conf
echo 'directory=/protar' >> /etc/supervisor/conf.d/celery.conf
echo 'command = celery worker -A protar --loglevel=INFO' >> /etc/supervisor/conf.d/celery.conf
echo 'user = celery' >> /etc/supervisor/conf.d/celery.conf
echo 'group = workers' >> /etc/supervisor/conf.d/celery.conf
echo 'stdout_logfile = /var/log/celeryd.log' >> /etc/supervisor/conf.d/celery.conf
echo 'stderr_logfile = /var/log/celeryd.err' >> /etc/supervisor/conf.d/celery.conf
echo 'autostart = true' >> /etc/supervisor/conf.d/celery.conf
echo 'environment=SECRET_KEY=celerykey,DB_NAME=protar,DJANGO_SETTINGS_MODULE=protar.settings' >> /etc/supervisor/conf.d/celery.conf

# Superivsed Gunicorn
echo '[program:gunicorn]' > /etc/supervisor/conf.d/gunicorn.conf
echo 'command = gunicorn protar.wsgi --log-file=- --env DEBUG=False --env SECRET_KEY=gunicornkey --env DJANGO_SETTINGS_MODULE=protar.settings --env STATIC_ROOT=/protar_static --env MEDIA_ROOT=/protar_media' >> /etc/supervisor/conf.d/gunicorn.conf
echo 'directory=/protar' >> /etc/supervisor/conf.d/gunicorn.conf
echo 'user = www-data' >> /etc/supervisor/conf.d/gunicorn.conf
echo 'group = www-data' >> /etc/supervisor/conf.d/gunicorn.conf
echo 'stdout_logfile = /var/log/gunicornd.log' >> /etc/supervisor/conf.d/gunicorn.conf
echo 'stderr_logfile = /var/log/gunicornd.err' >> /etc/supervisor/conf.d/gunicorn.conf
echo 'autostart = true' >> /etc/supervisor/conf.d/gunicorn.conf

# Restart supervisor to include celery
service supervisor restart

# Add repoo
git clone https://github.com/geodesign/protar.git /protar

# Install python dependencies
pip3 install -r /protar/requirements.txt

# Install js dependencies
cd /protar && bower install --allow-root

# Build frontend
r.js -o /protar/frontend/js/build.js

# Run tests to check setup
python3 /protar/manage.py test

# Start celery
supervisorctl start celery

# Start gunicorn
supervisorctl start gunicorn

# Reread and restart nginx
supervisorctl reread

# Deploy steps
git pull
r.js -o frontend/js/build.js
python3 manage.py collectstatic
python3 manage.py compress
python3 manage.py migrate
supervisorctl restart gunicorn

# Nginx setup in /etc/nginx/sites-available/protar
upstream protar_app_server {
  server 127.0.0.1:8000 fail_timeout=0;
}

server {

    listen   80;
    server_name protar.org www.protar.org;

    client_max_body_size 1G;

    access_log /var/log/nginx-protar-access.log;
    error_log /var/log/nginx-protar-error.log;

    location /static/ {
        alias   /protar_static/;
    }

    location /media/ {
        alias   /protar_media/;
    }

    location / {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_redirect off;
        if (!-f $request_filename) {
            proxy_pass http://protar_app_server;
            break;
        }
    }

    # Error pages
    error_page 500 502 503 504 /500.html;
    location = /500.html {
        root /protar_static/;
    }
}
