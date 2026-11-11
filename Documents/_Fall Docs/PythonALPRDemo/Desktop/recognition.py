"""Desktop transport. No models or AWS credentials run on the desktop."""
import io
import json
import math
import time
import urllib.request
import urllib.error
from urllib.parse import urlsplit
from PIL import Image, ImageOps

DEFAULT_MODEL = 'FastALPR CPU / self-hosted'
MAX_BYTES = 15 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 40_000_000

class AnalysisError(Exception):
    def __init__(self, message, elapsed_seconds=None):
        super().__init__(message)
        self.elapsed_seconds = elapsed_seconds
        self.usage = None

def validate_endpoint(value):
    value=value.strip().rstrip('/')
    p=urlsplit(value)
    if p.username or p.password or p.query or p.fragment or p.path:
        raise ValueError('Use a base URL only, with no credentials, path or query.')
    if p.scheme not in ('http','https') or not p.hostname:
        raise ValueError('Enter an HTTP or HTTPS server URL.')
    if p.scheme=='http' and p.hostname not in ('127.0.0.1','localhost','::1'):
        raise ValueError('Plain HTTP is allowed only over the local SSH tunnel. Remote URLs require HTTPS.')
    return value

def load_image(path):
    from pathlib import Path
    if Path(path).stat().st_size > MAX_BYTES: raise ValueError('Image exceeds 15 MiB.')
    with Image.open(path) as im:
        if im.format not in ('JPEG','PNG','WEBP'): raise ValueError('Use JPEG, PNG or WebP.')
        if im.width*im.height > 40_000_000: raise ValueError('Image exceeds 40 megapixels.')
        return ImageOps.exif_transpose(im).convert('RGB')

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs): return None

def analyze(image, token, endpoint):
    endpoint=validate_endpoint(endpoint)
    if not token: raise AnalysisError('Enter the server token in settings.')
    buf=io.BytesIO(); image.save(buf,format='PNG')  # Lossless, same displayed pixels.
    data=buf.getvalue()
    if len(data)>MAX_BYTES: raise AnalysisError('Lossless upload exceeds 15 MiB; use a smaller image.')
    req=urllib.request.Request(endpoint+'/analyze',data=data,headers={
        'Content-Type':'image/png','Authorization':'Bearer '+token},method='POST')
    start=time.perf_counter()
    try:
        with urllib.request.build_opener(NoRedirect).open(req,timeout=120) as response:
            raw=response.read(2*1024*1024+1)
        elapsed=time.perf_counter()-start
        if len(raw)>2*1024*1024: raise ValueError('Response too large')
        result=json.loads(raw)
        processing=result['processing_seconds']
        if not isinstance(processing,(float,int)) or not math.isfinite(processing) or processing<0: raise ValueError('Invalid timing')
        if not isinstance(result['vehicles'],list): raise ValueError('Invalid vehicles')
        for v in result['vehicles']:
            if not isinstance(v,dict) or not all(k in v for k in ('plate','state','color','position','notes')): raise ValueError('Invalid plate result')
        result.update(elapsed_seconds=elapsed,overhead_seconds=max(0,elapsed-processing),upload_bytes=len(data),usage={'lookups':1})
        return result
    except urllib.error.HTTPError as exc:
        messages={401:'Server token rejected. Copy the token from server/token.txt.',413:'Image exceeds the server limit.',415:'Unsupported image.',422:'Image could not be decoded.',503:'Server is busy. Retry after the current request completes.'}
        raise AnalysisError(messages.get(exc.code,f'Server returned HTTP {exc.code}. Check server logs.'),time.perf_counter()-start) from None
    except (urllib.error.URLError,TimeoutError,OSError):
        raise AnalysisError('Connection failed or timed out. Check the SSH tunnel and server. The server may still finish processing.',time.perf_counter()-start) from None
    except (ValueError,KeyError,TypeError):
        raise AnalysisError('Invalid server response. Check server and desktop versions.',time.perf_counter()-start) from None
