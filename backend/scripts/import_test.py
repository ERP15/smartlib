import sys, pathlib
p = pathlib.Path(__file__).resolve().parent.parent
print('root:', p)
if str(p) not in sys.path:
    sys.path.insert(0, str(p))
print('sys.path[0]:', sys.path[0])
import importlib
mod = importlib.import_module('backend.app')
print('imported backend.app OK')
