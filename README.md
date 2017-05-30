# Chat
Two way web chat app

# Requirements
* node.js

```
$ sudo apt-get update && sudo apt-get upgrade

$ sudo apt-get install -y nodejs nodejs-legacy

$ npm install pm2 -g --unsafe-perm
```
* mongodb

On DigitalOcean droplet:

1. Add repositories:
```
$ sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927

$ echo "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list

$ sudo apt-get update
```

2. Installing mongodb:
```
$ sudo apt-get install -y mongodb-org

$ sudo nano /etc/systemd/system/mongodb.service
```
  Paste the following in editor:
```
[Unit]
Description=High-performance, schema-free document-oriented database
After=network.target

[Service]
User=mongodb
ExecStart=/usr/bin/mongod --quiet --config /etc/mongod.conf

[Install]
WantedBy=multi-user.target
```

3. Start mongodb and include at startup:
```
$ sudo systemctl start mongodb

$ sudo systemctl status mongodb

$ sudo systemctl enable mongodb
```

# Installation
```
$ git clone https://github.com/gaiustemple/chat.git
$ cd ~/chat
$ npm install
```
