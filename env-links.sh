#!/bin/sh

for app_dir in apps/*; do
  app_dir=${app_dir%/}

  echo "Creating symlinks for $app_dir"
  
  ln -s ../../.env "$app_dir/.env" 2>/dev/null || true
done

echo "Symlinks created"