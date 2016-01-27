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
    supervisor

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
