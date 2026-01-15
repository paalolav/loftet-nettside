#!/bin/bash
# Publiser Loftet til Webhuset
# Køyrast automatisk når brukar trykker PUBLISER-knappen

cd "$(dirname "$0")"

echo "Byggjer nettsida..."
hugo --minify

echo "Lastar opp til loftet.no..."
ncftpput -R -u "8668_ftp" -p "Bonzo49j" ftp.loftet.no /www public/*

echo "FERDIG! loftet.no er oppdatert."
