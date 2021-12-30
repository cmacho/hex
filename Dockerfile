FROM python:3.8
WORKDIR /app
COPY . .
RUN pip install django==3.2.7
RUN python3 manage.py makemigrations
RUN python3 manage.py migrate
# adapted from nikolaik/docker-python-nodejs
RUN \
    echo "deb https://deb.nodesource.com/node_14.x buster main" > /etc/apt/sources.list.d/nodesource.list && \
    wget -qO- https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" > /etc/apt/sources.list.d/yarn.list && \
    wget -qO- https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    apt-get update && \
    apt-get install -yqq nodejs=$(apt-cache show nodejs|grep Version|grep nodesource|cut -c 10-) yarn && \
    apt-mark hold nodejs && \
    pip install -U pip && pip install pipenv && \
    npm i -g npm@^8
RUN npm install
RUN npm run build
CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]
