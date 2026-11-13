"""Snapshot Cloud adapter. Standard-library HTTP; no token is saved."""
import io
import json
import math
import time
import uuid
from pathlib import Path
from urllib import request, error
from PIL import Image, ImageOps

DEFAULT_MODEL = 'Plate Recognizer Snapshot Cloud'
ENDPOINT = 'https://api.platerecognizer.com/v1/plate-reader/'
STATES = set('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split())

class AnalysisError(ValueError):
    def __init__(self,message,usage=None,elapsed_seconds=None):
        super().__init__(message); self.usage=usage; self.elapsed_seconds=elapsed_seconds


def load_image(path):
    path=Path(path)
    if path.stat().st_size > 15*1024*1024:raise ValueError('Source exceeds 15 MB. Save a smaller copy.')
    with Image.open(path) as im:
        if im.format not in ('JPEG','PNG','WEBP'):raise ValueError('Choose JPEG, PNG or WebP.')
        if im.width*im.height > 40_000_000:raise ValueError('Source exceeds 40 megapixels.')
        im.load(); return ImageOps.exif_transpose(im).convert('RGB')


def image_payload(image):
    # Full dimensions retained. Never silently resize plates before recognition.
    buf=io.BytesIO(); image.save(buf,format='JPEG',quality=95,subsampling=0)
    data=buf.getvalue()
    if len(data) > 3_000_000:
        raise AnalysisError('Prepared JPEG exceeds Snapshot Cloud\'s 3 MB limit. Save a smaller copy and retry.',{'lookups':0})
    return data


def score(value):
    return float(value) if type(value) in (int,float) and math.isfinite(value) and 0 <= value <= 1 else None


def state_code(region):
    code=str(region or '').lower()
    # Country-only "us" is not an identified state; other countries are not US states.
    parts=code.split('-')
    return parts[1].upper() if len(parts)==2 and parts[0]=='us' and parts[1].upper() in STATES else None


def parse_response(envelope, mmc=False):
    if not isinstance(envelope,dict) or not isinstance(envelope.get('results'),list):
        raise ValueError('Snapshot returned an unexpected result structure.')
    vehicles=[]
    for n,item in enumerate(envelope['results'],1):
        if not isinstance(item,dict):raise ValueError('Invalid Snapshot detection.')
        raw_plate=item.get('plate')
        if raw_plate is not None and not isinstance(raw_plate,str):raise ValueError('Invalid plate value.')
        plate=raw_plate.strip().upper() if raw_plate else None
        region=item.get('region') or {}
        if not isinstance(region,dict):region={}
        colors=item.get('color') or []
        if not isinstance(colors,list):colors=[]
        colors=[c for c in colors if isinstance(c,dict) and isinstance(c.get('color'),str) and score(c.get('score')) is not None]
        best=max(colors,key=lambda c:c['score']) if colors and mmc else None
        color=best['color'] if best and best['color'].lower() not in ('unknown','unrecognized','') else None
        box=item.get('box') or {}
        if not isinstance(box,dict):box={}
        valid_box=all(type(box.get(k)) in (int,float) and math.isfinite(box[k]) for k in ('xmin','ymin','xmax','ymax'))
        position=f"Plate box x={box['xmin']:g}, y={box['ymin']:g}" if valid_box else f'Detection {n}'
        notes=[]
        if not mmc:notes.append('Color unavailable: MMC is disabled.')
        elif not color:notes.append('Color not returned; check MMC entitlement or image quality.')
        ps=score(item.get('score'))
        if ps is not None:notes.append(f'Plate model score: {ps:.3f} (not verified accuracy).')
        if region.get('code'):notes.append(f"Region returned: {region['code']}")
        vehicles.append({'position':position,'plate':plate or None,'state':state_code(region.get('code')),
                         'color':color,'notes':' '.join(notes),'box':box if valid_box else None,
                         'plate_score':ps,'region_score':score(region.get('score')),
                         'color_score':score(best.get('score')) if best else None,
                         'candidates':item.get('candidates') or []})
    return {'vehicles':vehicles}


def analyze(image, api_key, mmc=False, opener=request.urlopen):
    if not api_key.strip():raise AnalysisError('Enter your Plate Recognizer API token.',{'lookups':0})
    data=image_payload(image)
    boundary='SnapshotDemo'+uuid.uuid4().hex
    body=(f'--{boundary}\r\nContent-Disposition: form-data; name="mmc"\r\n\r\n{str(bool(mmc)).lower()}\r\n'
          f'--{boundary}\r\nContent-Disposition: form-data; name="upload"; filename="image.jpg"\r\n'
          'Content-Type: image/jpeg\r\n\r\n').encode()+data+f'\r\n--{boundary}--\r\n'.encode()
    req=request.Request(ENDPOINT,data=body,headers={'Authorization':'Token '+api_key.strip(),
        'Content-Type':f'multipart/form-data; boundary={boundary}'},method='POST')
    started=time.perf_counter()
    try:
        with opener(req,timeout=90) as response:
            try:envelope=json.load(response)
            except (ValueError,TypeError):raise AnalysisError('Snapshot returned invalid JSON.',{'lookups':1}) from None
    except error.HTTPError as exc:
        messages={400:'Request rejected. Check image size/format and whether your plan includes MMC when enabled.',
                  401:'API token rejected. Use your Plate Recognizer token, not a Gemini key.',
                  402:'Payment or subscription required. Check your Snapshot Cloud plan.',
                  403:'Access denied. Check your token, Cloud subscription and MMC entitlement.',
                  413:'Image exceeds Snapshot Cloud upload limit. Save a smaller copy.',
                  429:'Request rate or lookup quota exceeded. Check your Snapshot dashboard and retry later.'}
        raise AnalysisError(messages.get(exc.code,f'Snapshot Cloud error (HTTP {exc.code}). Retry later.')) from None
    except (error.URLError,TimeoutError,OSError):
        raise AnalysisError('Connection failed or timed out. The lookup may still have been consumed.') from None
    elapsed=round(time.perf_counter()-started,2)
    try:result=parse_response(envelope,mmc)
    except ValueError as exc:raise AnalysisError(str(exc),{'lookups':1},elapsed) from None
    result.update({'model':DEFAULT_MODEL,'elapsed_seconds':elapsed,'usage':{'lookups':1},
                   'account_usage':envelope.get('usage'),'server_processing_time_ms':envelope.get('processing_time'),
                   'mmc_enabled':bool(mmc),'upload_bytes':len(data),'raw_response':envelope})
    return result
