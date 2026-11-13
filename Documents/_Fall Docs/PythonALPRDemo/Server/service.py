"""Single-model CPU API. Bind to loopback; access through SSH forwarding."""
import asyncio
import io
import os
import secrets
import time
from contextlib import asynccontextmanager
from pathlib import Path
from statistics import mean
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError
from fastapi import FastAPI, Request, HTTPException
from starlette.concurrency import run_in_threadpool

MAX_BYTES=15*1024*1024
Image.MAX_IMAGE_PIXELS=40_000_000
DETECTOR='yolo-v9-t-384-license-plate-end2end'
OCR='cct-xs-v2-global-model'

def load_model():
    from fast_alpr import ALPR
    import onnxruntime as ort
    ort.disable_telemetry_events()
    options=ort.SessionOptions(); options.intra_op_num_threads=2; options.inter_op_num_threads=1
    return ALPR(detector_model=DETECTOR,ocr_model=OCR,ocr_device='cpu',
                detector_providers=['CPUExecutionProvider'],ocr_providers=['CPUExecutionProvider'],
                detector_sess_options=options,ocr_sess_options=options)

def recognize(model, raw):
    try:
        with Image.open(io.BytesIO(raw)) as image:
            if image.format not in ('PNG','JPEG','WEBP'): raise HTTPException(415,'Unsupported image')
            if image.width*image.height>40_000_000: raise HTTPException(413,'Too many pixels')
            rgb=ImageOps.exif_transpose(image).convert('RGB')
            frame=np.array(rgb)[:,:,::-1].copy()
    except (UnidentifiedImageError,OSError,ValueError,Image.DecompressionBombError):
        raise HTTPException(422,'Cannot decode image') from None
    start=time.perf_counter(); predictions=model.predict(frame); duration=time.perf_counter()-start
    vehicles=[]
    for item in predictions:
        box=item.detection.bounding_box
        coords={k:int(getattr(box,k)) for k in ('x1','y1','x2','y2')}
        ocr=item.ocr
        confidence=ocr.confidence if ocr else None
        if isinstance(confidence,list): confidence=mean(confidence) if confidence else None
        score=float(confidence) if confidence is not None else None
        vehicles.append({'plate':ocr.text.strip().upper() if ocr and ocr.text else None,
            'state':None,'color':None,'position':str(coords),'box':coords,
            'plate_score':score,'notes':f'OCR model score: {score:.3f}. Not a calibrated accuracy probability.' if score is not None else 'Plate detected; OCR unreadable.'})
    return {'vehicles':vehicles,'processing_seconds':duration,'model':'FastALPR CPU / self-hosted',
            'detector_model':DETECTOR,'ocr_model':OCR,'state_supported':False,'color_supported':False}

def create_app(model_factory=load_model, token=None):
    @asynccontextmanager
    async def lifespan(app):
        app.state.token=token or os.environ.get('FASTALPR_API_TOKEN') or Path(__file__).with_name('token.txt').read_text().strip()
        if len(app.state.token)<24: raise RuntimeError('Server token must have at least 24 characters.')
        app.state.model=await run_in_threadpool(model_factory)
        app.state.lock=asyncio.Lock()
        yield
    app=FastAPI(lifespan=lifespan,docs_url=None,redoc_url=None,openapi_url=None)
    @app.get('/health')
    def health(): return {'status':'ready','detector':DETECTOR,'ocr':OCR}
    @app.post('/analyze')
    async def analyze(request: Request):
        supplied=request.headers.get('authorization','')
        if not secrets.compare_digest(supplied.encode(),('Bearer '+app.state.token).encode()): raise HTTPException(401,'Unauthorized')
        if app.state.lock.locked(): raise HTTPException(503,'Busy')
        async with app.state.lock:
            raw=bytearray()
            async for chunk in request.stream():
                raw.extend(chunk)
                if len(raw)>MAX_BYTES: raise HTTPException(413,'Too large')
            return await run_in_threadpool(recognize,app.state.model,bytes(raw))
    return app

app=create_app()
