#!/bin/bash
set -e

echo "==> Creating volume..."
tfy deploy -f volume.yaml --no-wait

echo "==> Deploying service..."
tfy deploy -f truefoundry.yaml --no-wait

echo "==> Done!"
