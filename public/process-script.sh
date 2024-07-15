#!/bin/bash
for file in src-images/*.jpeg; do cwebp -m 6 "$file" -o "processed-images/$(basename "$file").webp"; done