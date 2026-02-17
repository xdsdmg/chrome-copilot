#!/usr/bin/env python3
"""
Generate Chrome extension icons for Chrome Copilot.
Creates 16x16, 48x48, and 128x128 PNG icons.
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, background_color=(66, 133, 244), robot_color=(255, 255, 255)):
    """Create a square icon with a simple robot face."""
    # Create image with background color
    image = Image.new('RGBA', (size, size), background_color)
    draw = ImageDraw.Draw(image)
    
    # Draw robot head (circle)
    margin = size // 8
    head_size = size - 2 * margin
    draw.ellipse([margin, margin, margin + head_size, margin + head_size], 
                 fill=robot_color, outline=(50, 50, 50), width=1)
    
    # Draw eyes (two circles)
    eye_size = size // 8
    eye_y = size // 3
    left_eye_x = size // 2 - size // 6
    right_eye_x = size // 2 + size // 6
    draw.ellipse([left_eye_x - eye_size//2, eye_y - eye_size//2,
                  left_eye_x + eye_size//2, eye_y + eye_size//2], 
                 fill=(66, 133, 244))
    draw.ellipse([right_eye_x - eye_size//2, eye_y - eye_size//2,
                  right_eye_x + eye_size//2, eye_y + eye_size//2], 
                 fill=(66, 133, 244))
    
    # Draw mouth (simple line or smile)
    mouth_y = size // 2 + size // 6
    mouth_width = size // 4
    draw.arc([size//2 - mouth_width//2, mouth_y - mouth_width//4,
              size//2 + mouth_width//2, mouth_y + mouth_width//4],
             0, 180, fill=(66, 133, 244), width=2)
    
    # Add "CC" text for small sizes where details are hard to see
    if size >= 48:
        try:
            font_size = size // 4
            font = ImageFont.truetype("Arial", font_size)
            text = "CC"
            text_bbox = draw.textbbox((0, 0), text, font=font)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]
            text_x = (size - text_width) // 2
            text_y = size - text_height - margin // 2
            draw.text((text_x, text_y), text, fill=(66, 133, 244), font=font)
        except:
            pass  # If font not available, skip text
    
    return image

def main():
    """Generate all required icon sizes."""
    sizes = [16, 48, 128]
    filenames = ['icon16.png', 'icon48.png', 'icon128.png']
    
    for size, filename in zip(sizes, filenames):
        print(f'Creating {filename} ({size}x{size})...')
        icon = create_icon(size)
        icon.save(filename, 'PNG')
        print(f'Saved {filename}')
    
    print('All icons generated successfully!')

if __name__ == '__main__':
    main()