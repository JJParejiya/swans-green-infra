"""Build optimized web images for Swansgreen site.
Generates WebP (primary) + JPG fallbacks at 1600px / 700px.
Also crops the logo icon and produces favicons.
"""
import os
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).parent
SRC = ROOT.parent / "Web Data"
DST = ROOT / "assets" / "img"
THUMB = DST / "thumb"
ICON = ROOT / "assets" / "icon"
DST.mkdir(parents=True, exist_ok=True)
THUMB.mkdir(parents=True, exist_ok=True)
ICON.mkdir(parents=True, exist_ok=True)

MAP = {
    "parwati-river":              SRC / "Parwati Heights" / "3D IMAGES" / "Exterior" / "River View.jpg",
    "parwati-cam03":              SRC / "Parwati Heights" / "3D IMAGES" / "Exterior" / "Cam 03.jpg",
    "parwati-cam14":              SRC / "Parwati Heights" / "3D IMAGES" / "Exterior" / "Cam 14.jpg",
    "parwati-cam18":              SRC / "Parwati Heights" / "3D IMAGES" / "Exterior" / "Cam 18.jpg",
    "parwati-cam24":              SRC / "Parwati Heights" / "3D IMAGES" / "Exterior" / "Cam 24.jpg",
    "parwati-pool1":              SRC / "Parwati Heights" / "3D IMAGES" / "Exterior" / "Swimmingpool 01.jpg",
    "parwati-pool2":              SRC / "Parwati Heights" / "3D IMAGES" / "Exterior" / "Swimmingpool 02.jpg",
    "parwati-living":             SRC / "Parwati Heights" / "3D IMAGES" / "Interior" / "Living.jpg",
    "parwati-master":             SRC / "Parwati Heights" / "3D IMAGES" / "Interior" / "Master Bedroom 01.jpg",
    "parwati-cinema":             SRC / "Parwati Heights" / "3D IMAGES" / "Interior" / "Cinema.jpg",
    "parwati-kitchen":            SRC / "Parwati Heights" / "3D IMAGES" / "Interior" / "Kitchen.jpg",
    "parwati-yoga":               SRC / "Parwati Heights" / "3D IMAGES" / "Interior" / "Yoga.jpg",
    "parwati-business":           SRC / "Parwati Heights" / "3D IMAGES" / "Interior" / "Business center.jpg",
    "parwati-indoor":             SRC / "Parwati Heights" / "3D IMAGES" / "Interior" / "Indoor Game.jpg",
    "parwati-banquet":            SRC / "Parwati Heights" / "3D IMAGES" / "Interior" / "BANQUET.jpg",
    "parwati-foyer":              SRC / "Parwati Heights" / "3D IMAGES" / "Interior" / "Foyer 01.jpg",
    "abhiram-aerial":             SRC / "Abhiram City" / "3D Images" / "AERIAL-VIEW.jpg",
    "abhiram-pool":               SRC / "Abhiram City" / "3D Images" / "POOL ON TERRACE VIEW.jpg",
    "abhiram-entrance":           SRC / "Abhiram City" / "3D Images" / "ENTRANCE GATE VIEW.jpg",
    "abhiram-play":               SRC / "Abhiram City" / "3D Images" / "PLAY AREA.jpg",
    "vrundavan-front":            SRC / "Vrundavan Dham" / "3D Brochre" / "FRONT ELEVATION copy.jpg",
    "vrundavan-aerial":           SRC / "Vrundavan Dham" / "3D Brochre" / "VIEW_003_AERIAL_DAYLIGHT_ copy.jpg",
    "vrundavan-garden":           SRC / "Vrundavan Dham" / "3D Brochre" / "GARDEN AREA copy.jpg",
    "gokuldham-layout":           SRC / "Gokuldham City" / "Swan Homes Infra [142]_Layout 401_2021_07_07.jpg(1).jpeg",
}

def process(key, src, max_w, quality, out_dir):
    if not src.exists():
        print(f"  SKIP missing: {src}")
        return
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        if im.width > max_w:
            ratio = max_w / im.width
            im = im.resize((max_w, int(im.height * ratio)), Image.LANCZOS)
        webp = out_dir / f"{key}.webp"
        im.save(webp, "WEBP", quality=quality, method=6)
        size_kb = webp.stat().st_size / 1024
        print(f"  {webp.name}: {im.width}x{im.height}  {size_kb:.0f} KB (webp)")

print("--- LARGE WebP (1600px, q=78) ---")
for key, src in MAP.items():
    process(key, src, 1600, 78, DST)

print("--- THUMB WebP (700px, q=72) ---")
for key, src in MAP.items():
    process(key, src, 700, 72, THUMB)

# ---- LOGO ICON CROP + FAVICON ----
print("--- LOGO ICON & FAVICONS ---")
logo_src = SRC / "SWANSGREEN INFRA_LOGO" / "SWANSGREEN INFRA_LOGO.jpg"
if logo_src.exists():
    with Image.open(logo_src) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        w, h = im.size
        # Find non-white bounding box of the icon at the top of the image
        # (top half of full lockup contains the G mark)
        top_half = im.crop((0, 0, w, int(h * 0.55)))
        # Compute bbox by inverting (treat near-white as background)
        gray = top_half.convert("L")
        # Threshold: anything darker than 245 is "ink"
        bw = gray.point(lambda v: 0 if v < 245 else 255)
        # Get bbox of non-white pixels
        inv = bw.point(lambda v: 255 - v)  # invert so ink=255
        bbox = inv.getbbox()
        if bbox:
            x0, y0, x1, y1 = bbox
            # add small padding
            pad = 20
            x0 = max(0, x0 - pad); y0 = max(0, y0 - pad)
            x1 = min(top_half.width, x1 + pad); y1 = min(top_half.height, y1 + pad)
            icon = top_half.crop((x0, y0, x1, y1))
        else:
            icon = top_half
        # Square it on a white canvas for clean display
        sq_size = max(icon.size)
        sq = Image.new("RGB", (sq_size, sq_size), (255, 255, 255))
        sq.paste(icon, ((sq_size - icon.width) // 2, (sq_size - icon.height) // 2))

        # Save logo icon at usable sizes (WebP)
        for size in (512, 256, 128):
            r = sq.resize((size, size), Image.LANCZOS)
            r.save(DST / f"logo-{size}.webp", "WEBP", quality=92, method=6)
            print(f"  logo-{size}.webp: {size}x{size}  {(DST/f'logo-{size}.webp').stat().st_size/1024:.0f} KB")

        # Favicons
        for size in (16, 32, 48, 96, 192, 512):
            r = sq.resize((size, size), Image.LANCZOS)
            r.save(ICON / f"favicon-{size}.png", "PNG", optimize=True)
        # Multi-size .ico
        ico_imgs = [sq.resize((s, s), Image.LANCZOS) for s in (16, 32, 48)]
        ico_imgs[0].save(ICON / "favicon.ico", format="ICO", sizes=[(16,16),(32,32),(48,48)])
        # Apple touch
        sq.resize((180, 180), Image.LANCZOS).save(ICON / "apple-touch-icon.png", "PNG", optimize=True)
        print(f"  favicons + apple-touch + ico saved to assets/icon/")

print("Done.")
