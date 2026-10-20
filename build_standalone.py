#!/usr/bin/env python3
"""Build downloads/voice-tool.html: voice.html with the PowerPoint and Word libraries inlined,
so it can be sold/sent as a single file."""
import re, pathlib
root = pathlib.Path(__file__).parent
html = (root / "voice.html").read_text(encoding="utf-8")
lib = (root / "assets/pptxgen.bundle.js").read_text(encoding="utf-8").replace("</script", "<\\/script")
html = html.replace('<script src="assets/pptxgen.bundle.js"></script>', "<script>" + lib + "</script>")
dlib = (root / "assets/docx.iife.js").read_text(encoding="utf-8").replace("</script", "<\\/script")
html = html.replace('<script src="assets/docx.iife.js"></script>', "<script>" + dlib + "</script>")
html = re.sub(r'<header class="top">.*?</header>', '<header class="top"><h1>صوتي إلى مستند</h1></header>', html, flags=re.S)
out = root / "downloads/voice-tool.html"
out.write_text(html, encoding="utf-8")
print("wrote", out, len(html) // 1024, "KB")
