"""Download Thai+Latin woff2 subsets from Google Fonts and emit @font-face CSS.

Google Fonts serves woff2 ONLY to a modern browser UA; a generic UA silently
returns TTF instead. Hence the explicit Chrome UA below.
"""
import os
import re
import sys
import urllib.request

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")

CSS_URL = ("https://fonts.googleapis.com/css2"
           "?family=Mitr:wght@400;500;600"
           "&family=IBM+Plex+Sans+Thai+Looped:wght@400;500;600"
           "&family=Itim"
           "&display=swap")

WANTED_SUBSETS = {"thai", "latin"}

OUT_DIR = sys.argv[1] if len(sys.argv) > 1 else "public/fonts"
CSS_OUT = sys.argv[2] if len(sys.argv) > 2 else "fontface.css"


def get(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    return data if binary else data.decode("utf-8")


def slug(family):
    return re.sub(r"[^a-z0-9]+", "-", family.lower()).strip("-")


def main():
    css = get(CSS_URL)

    # Each face is preceded by a /* subset */ comment.
    chunks = re.split(r"/\*\s*([a-z0-9-]+)\s*\*/", css)
    faces = []
    for i in range(1, len(chunks) - 1, 2):
        subset, body = chunks[i], chunks[i + 1]
        if subset not in WANTED_SUBSETS:
            continue
        fam = re.search(r"font-family:\s*'([^']+)'", body)
        wt = re.search(r"font-weight:\s*(\d+)", body)
        url = re.search(r"url\((https://[^)]+\.woff2)\)", body)
        ur = re.search(r"unicode-range:\s*([^;]+);", body)
        if not (fam and wt and url and ur):
            continue
        faces.append({
            "family": fam.group(1),
            "weight": wt.group(1),
            "subset": subset,
            "url": url.group(1),
            "range": ur.group(1).strip(),
        })

    if not faces:
        sys.exit("ERROR: no woff2 faces parsed - Google may have served TTF.")

    os.makedirs(OUT_DIR, exist_ok=True)
    blocks = []
    for f in faces:
        name = "%s-%s-%s.woff2" % (slug(f["family"]), f["weight"], f["subset"])
        path = os.path.join(OUT_DIR, name)
        data = get(f["url"], binary=True)
        if data[:4] != b"wOF2":
            sys.exit("ERROR: %s is not woff2 (got %r)" % (name, data[:4]))
        with open(path, "wb") as fh:
            fh.write(data)
        print("  %-46s %6.1f KB" % (name, len(data) / 1024))
        blocks.append(
            "@font-face {\n"
            "  font-family: '%s';\n"
            "  font-style: normal;\n"
            "  font-weight: %s;\n"
            "  font-display: swap;\n"
            "  src: url('/fonts/%s') format('woff2');\n"
            "  unicode-range: %s;\n"
            "}" % (f["family"], f["weight"], name, f["range"])
        )

    # thai first so it wins the race for the primary script
    blocks.sort(key=lambda b: ("latin" in b.split("url('/fonts/")[1][:80], b))
    with open(CSS_OUT, "w", encoding="utf-8") as fh:
        fh.write("\n\n".join(blocks) + "\n")
    print("\n%d faces -> %s" % (len(faces), OUT_DIR))


if __name__ == "__main__":
    main()
