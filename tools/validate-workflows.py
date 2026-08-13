import glob
import sys

import yaml

files = sorted(glob.glob(".github/workflows/*.yml") + glob.glob(".github/workflows/*.yaml"))
ok = True
for f in files:
    try:
        with open(f, encoding="utf-8") as fh:
            yaml.safe_load(fh)
        print(f"OK   {f}")
    except Exception as e:
        ok = False
        print(f"FAIL {f}: {e}")
sys.exit(0 if ok else 1)
