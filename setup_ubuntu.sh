# Setenv
export DB_NAME=protar
export PYTHONPATH=$PYTHONPATH:/protar
export DJANGO_SETTINGS_MODULE=protar.settings
export SECRET_KEY=protarkey

# Update apt packages
apt-get update
apt-get upgrade -y

# Install apt libraries
apt-get install -y\
    git\
    npm\
    python-pip\
    python-dev\
    libjpeg8-dev\
    postgresql-9.3\
    postgresql-client-9.3\
    postgresql-server-dev-9.3\
    postgresql-9.3-postgis-2.1\
    libproj-dev\
    libgeos-3.4.2\
    gdal-bin

# Install npm libraries
npm install -g requirejs less less-plugin-autoprefix bower

# Tell bower where to find node
ln -s /usr/bin/nodejs /usr/bin/node

# Change psql access settings
sed -i "s/md5/trust/" etc/postgresql/9.3/main/pg_hba.conf
sed -i "s/peer/trust/" etc/postgresql/9.3/main/pg_hba.conf
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/9.3/main/postgresql.conf

# Create protar database
service postgresql restart
psql -U postgres -c 'create database protar'
psql -U postgres -d protar -c 'create extension postgis'

# Add repoo
git clone git@github.com:geodesign/protar.git 

# Install python dependencies
pip install -r /protar/requirements.txt

# Install js dependencies
cd /protar && bower install --allow-root

# Build frontend
r.js -o /protar/frontend/js/build.js

# Run tests to check setup
python /protar/manage.py test
