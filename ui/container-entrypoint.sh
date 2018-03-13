#!/bin/sh
sed -i 's~API-GW-PLACEHOLDER~'$API_HOST'~g' src/js/factories/*.js
sed -i 's~API-KEY-PLACEHOLDER~'$API_KEY'~g' src/js/appController.js

ojet serve --release --server-port=8080 --server-only
