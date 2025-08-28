# Image Processing Standards

## WebP Conversion Standards

### Dimensions
- **Standard Width**: 2864px
- **Height**: Variable (maintains aspect ratio)
- **Scaling Method**: Proportional scaling to avoid distortion

### Quality Settings
- **Quality Level**: 85 (-q 85)
- **Format**: WebP with VP8 encoding
- **Color Space**: YUV color

### File Naming Convention
- Pattern: `emely_IMG_[number].webp`
- Location: `public/processed-images/`

### Conversion Command Template
```bash
cwebp -q 85 -resize 2864 0 [input_file] -o public/processed-images/emely_IMG_[number].webp
```

### Example Usage
```bash
# Convert JPEG to WebP maintaining aspect ratio
cwebp -q 85 -resize 2864 0 IMG_1783.jpeg -o public/processed-images/emely_IMG_1783.webp
```

### Technical Specifications
- **Encoding**: VP8 encoding
- **Color Mode**: YUV color with clamping for decoders
- **Compression**: Optimized for web delivery
- **Bit Rate**: Typically 0.15-0.19 bpp for quality level 85

### Processing Notes
- The resize parameter `2864 0` scales width to 2864px while maintaining aspect ratio
- Quality level 85 provides optimal balance between file size and visual quality
- All images should be placed in `public/processed-images/` directory for consistency