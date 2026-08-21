#!/usr/bin/env bash
# Rebaixa os arquivos de fonte do Google Fonts para assets/fonts/ e regera
# assets/css/fonts.css. Só é preciso rodar para atualizar de versão.
set -euo pipefail
cd "$(dirname "$0")/.."

UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
URL="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@300..600&display=swap"

mkdir -p assets/fonts
curl -fsS -A "$UA" "$URL" -o /tmp/brasa-fonts.css

python3 - <<'PY'
import re, urllib.request, os

css = open('/tmp/brasa-fonts.css').read()
blocks = re.findall(r'/\* (\S+) \*/\s*@font-face \{(.*?)\}', css, re.S)
want = {'latin', 'latin-ext'}   # suficiente para pt-BR
out = []

for subset, body in blocks:
    if subset not in want:
        continue
    fam = re.search(r"font-family: '([^']+)'", body).group(1)
    url = re.search(r'url\((https://[^)]+)\)', body).group(1)
    rng = re.search(r'unicode-range: ([^;]+);', body).group(1)
    weight = re.search(r'font-weight: ([^;]+);', body).group(1).strip()
    name = f"{fam.lower()}-{subset}.woff2"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    data = urllib.request.urlopen(req, timeout=30).read()
    open(os.path.join('assets/fonts', name), 'wb').write(data)
    print(f"  {name}: {len(data)//1024} KB")
    out.append((fam, weight, name, rng, subset))

header = """/* ==========================================================================
   Fontes locais — Anton e Inter, ambas sob a SIL Open Font License 1.1.
   Baixadas do Google Fonts e servidas daqui: uma requisição a menos para
   terceiros, sem depender de CDN e sem cookies de fora.
   Só os subsets latin e latin-ext estão inclusos (suficiente para pt-BR).
   Para atualizar, rode tools/fetch-fonts.sh.
   ========================================================================== */"""

lines = [header]
for fam, weight, name, rng, subset in out:
    lines.append(f"""/* {fam} — {subset} */
@font-face {{
  font-family: '{fam}';
  font-style: normal;
  font-weight: {weight};
  font-display: swap;
  src: url('../fonts/{name}') format('woff2');
  unicode-range: {rng};
}}""")

open('assets/css/fonts.css', 'w').write("\n".join(lines) + "\n")
print("assets/css/fonts.css atualizado")
PY
