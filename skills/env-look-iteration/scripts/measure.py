#!/usr/bin/env python3
"""measure.py: compare a render against its reference by measurement, region by region.

Usage:
  python3 measure.py ref.png render.png [--regions regions.json] [--grid 4x3] [--glow X,Y]
                     [--class NAME:hmin,hmax,smin,vmin] [--sbs out.png] [--diff out.png]
  python3 measure.py --self-test

The render is resized to the reference's size first. Regions are boxes in normalised coordinates,
{"name": [x0, y0, x1, y1]}, with (0, 0) at the top-left. --grid adds a tile grid.

Per region, for both images and their difference:
  mean       mean sRGB (0-255)
  pct        luminance percentiles p1, p5, p25, p50, p75, p95, p99 (0-255, Rec.709 luma of sRGB values)
  sat        mean saturation (HSV, 0-1)
  local      median local contrast: std of luminance in 8x8 windows. Flatness shows here even when
             means match.
  clipped    share of pixels with any channel >= 250
  classes    coverage of each --class colour class (fraction of pixels), e.g. gold:20,50,0.35,0.35
             (hue range in degrees, min saturation, min value)
--glow X,Y   radial brightness profile around a normalised point (for example the sun disc), at
             10/25/50/90/140 px. Compare glow width with the reference.
--sbs/--diff write a side-by-side image and an amplified difference image.
Requires Pillow and NumPy.
"""
import sys, json
import numpy as np
from PIL import Image

def load(p, size=None):
    im = Image.open(p).convert("RGB")
    if size and im.size != size: im = im.resize(size, Image.LANCZOS)
    return np.asarray(im, dtype=np.float64)

def luma(a): return a @ np.array([0.2126, 0.7152, 0.0722])

def hsv(a):
    r, g, b = a[..., 0] / 255, a[..., 1] / 255, a[..., 2] / 255
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    d = mx - mn + 1e-12
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = np.where(mx > 1e-6, (mx - mn) / np.maximum(mx, 1e-6), 0)
    return h, s, mx

def local_contrast(L, w=8):
    H, W = (L.shape[0] // w) * w, (L.shape[1] // w) * w
    if H == 0 or W == 0: return 0.0
    blocks = L[:H, :W].reshape(H // w, w, W // w, w).swapaxes(1, 2).reshape(-1, w * w)
    return float(np.median(blocks.std(axis=1)))

def region_stats(a, classes):
    L = luma(a); h, s, v = hsv(a)
    out = {"mean": [round(float(x), 1) for x in a.reshape(-1, 3).mean(0)],
           "pct": {f"p{p}": round(float(np.percentile(L, p)), 1) for p in (1, 5, 25, 50, 75, 95, 99)},
           "sat": round(float(s.mean()), 3), "local": round(local_contrast(L), 2),
           "clipped": round(float((a.max(axis=2) >= 250).mean()), 4)}
    if classes:
        out["classes"] = {}
        for name, (h0, h1, smin, vmin) in classes.items():
            m = (h >= h0) & (h <= h1) & (s >= smin) & (v >= vmin)
            out["classes"][name] = round(float(m.mean()), 4)
    return out

def crop(a, box):
    H, W = a.shape[:2]; x0, y0, x1, y1 = box
    return a[int(y0 * H):max(int(y1 * H), int(y0 * H) + 1), int(x0 * W):max(int(x1 * W), int(x0 * W) + 1)]

def diff(r, q):
    d = {"mean": [round(q["mean"][i] - r["mean"][i], 1) for i in range(3)],
         "pct": {k: round(q["pct"][k] - r["pct"][k], 1) for k in r["pct"]},
         "sat": round(q["sat"] - r["sat"], 3), "local": round(q["local"] - r["local"], 2), "clipped": round(q["clipped"] - r["clipped"], 4)}
    if "classes" in r: d["classes"] = {k: round(q["classes"][k] - r["classes"][k], 4) for k in r["classes"]}
    return d

def glow_profile(a, cx, cy, radii=(10, 25, 50, 90, 140)):
    H, W = a.shape[:2]; X, Y = cx * W, cy * H; L = luma(a)
    yy, xx = np.mgrid[0:H, 0:W]; R = np.hypot(xx - X, yy - Y)
    return {str(r): round(float(L[(R >= r - 2) & (R <= r + 2)].mean()), 1) if ((R >= r - 2) & (R <= r + 2)).any() else None for r in radii}

def measure(ref, ren, regions=None, grid=None, classes=None, glow=None):
    regs = dict(regions or {})
    if grid:
        gx, gy = grid
        for j in range(gy):
            for i in range(gx): regs[f"tile_{i}_{j}"] = [i / gx, j / gy, (i + 1) / gx, (j + 1) / gy]
    regs = {"frame": [0, 0, 1, 1], **regs}
    out = {}
    for name, box in regs.items():
        r, q = region_stats(crop(ref, box), classes), region_stats(crop(ren, box), classes)
        out[name] = {"ref": r, "render": q, "delta": diff(r, q)}
    if glow: out["glow"] = {"ref": glow_profile(ref, *glow), "render": glow_profile(ren, *glow)}
    return out

def self_test():
    rng = np.random.default_rng(0)
    ref = np.clip(120 + 40 * rng.standard_normal((120, 160, 3)), 0, 255)
    flat = np.full_like(ref, 120.0)                                   # same mean, no texture
    m = measure(ref, flat)["frame"]
    assert abs(m["delta"]["mean"][0]) < 2, m["delta"]
    assert m["ref"]["local"] > 20 and m["render"]["local"] < 1, "local contrast should expose flatness"
    gold = np.zeros((40, 40, 3)); gold[..., 0], gold[..., 1], gold[..., 2] = 210, 160, 60
    g = measure(gold, np.full_like(gold, 128.0), classes={"gold": (20, 50, 0.35, 0.35)})["frame"]
    assert g["ref"]["classes"]["gold"] > 0.99 and g["render"]["classes"]["gold"] == 0, g
    print("measure self-test passed")

if __name__ == "__main__":
    a = sys.argv[1:]
    if not a or a[0] in ("-h", "--help"): print(__doc__); sys.exit(0)
    if a[0] == "--self-test": self_test(); sys.exit(0)
    ref_p, ren_p = a[0], a[1]
    opt = lambda k: a[a.index(k) + 1] if k in a else None
    ref = load(ref_p); ren = load(ren_p, (ref.shape[1], ref.shape[0]))
    regions = json.load(open(opt("--regions"))) if opt("--regions") else None
    grid = tuple(int(x) for x in opt("--grid").split("x")) if opt("--grid") else None
    classes = {}
    for i, t in enumerate(a):
        if t == "--class": n, v = a[i + 1].split(":"); classes[n] = tuple(float(x) for x in v.split(","))
    glow = tuple(float(x) for x in opt("--glow").split(",")) if opt("--glow") else None
    print(json.dumps(measure(ref, ren, regions, grid, classes or None, glow), indent=1))
    if opt("--sbs"): Image.fromarray(np.concatenate([ref, ren], axis=1).astype(np.uint8)).save(opt("--sbs"))
    if opt("--diff"): Image.fromarray(np.clip(128 + 3 * (ren - ref), 0, 255).astype(np.uint8)).save(opt("--diff"))
