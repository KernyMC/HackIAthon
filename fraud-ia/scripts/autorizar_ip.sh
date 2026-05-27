#!/bin/bash
# Autorizar IP actual de Cloud Shell en AlloyDB
IP=$(curl -s ifconfig.me)
echo "IP actual: $IP"
gcloud alloydb instances update fraudia-primary \
  --cluster=fraudia-cluster \
  --region=us-central1 \
  --project=gen-ai-hackathon-494720 \
  --authorized-external-networks="${IP}/32"
echo "AlloyDB actualizado con $IP/32"
