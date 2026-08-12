#!/bin/bash

cd ~/dev/impecca-reviews-control
bun run build
rsync -avz -e "sudo ssh -i  /home/yakov/Documents/zrSSH/id_rsa"  \
    ./dist ./server root@review-control.impecca.com:/var/www/impecca-reviews-control/
sudo ssh -i /home/yakov/Documents/zrSSH/id_rsa root@167.99.232.95 "pm2 restart impecca"


