import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError, URLError
from email.parser import BytesParser
from email.policy import default
from PIL import Image
from recognition import analyze, parse_response, state_code, load_image, image_payload, AnalysisError


def detection():
    return {'plate':'abc123','score':.91,'region':{'code':'us-az','score':.8},
            'box':{'xmin':10,'ymin':20,'xmax':100,'ymax':60},
            'color':[{'color':'blue','score':.2},{'color':'red','score':.9}],
            'candidates':[{'plate':'abc123','score':.91}]}

class RecognitionTests(unittest.TestCase):
    def test_plate_state_and_best_color(self):
        v=parse_response({'results':[detection()]},True)['vehicles'][0]
        self.assertEqual((v['plate'],v['state'],v['color']),('ABC123','AZ','red'))
        self.assertEqual(v['plate_score'],.91)

    def test_country_or_foreign_region_not_guessed_as_state(self):
        for code in ('us','ca-bc','unknown','az','us-zz',None):self.assertIsNone(state_code(code))
        self.assertEqual(state_code('us-nh'),'NH'); self.assertEqual(state_code('us-ga'),'GA')

    def test_color_disabled(self):
        v=parse_response({'results':[detection()]},False)['vehicles'][0]
        self.assertIsNone(v['color']); self.assertIn('MMC is disabled',v['notes'])

    def test_no_color_returned(self):
        d=detection(); del d['color']
        v=parse_response({'results':[d]},True)['vehicles'][0]
        self.assertIsNone(v['color']); self.assertIn('Color not returned',v['notes'])

    def test_empty_results_valid(self):
        self.assertEqual(parse_response({'results':[]})['vehicles'],[])

    def test_multiple_detections(self):
        self.assertEqual(len(parse_response({'results':[detection(),detection()]})['vehicles']),2)

    def test_invalid_shape(self):
        for data in ({},[],{'results':[None]},{'results':'bad'}):
            with self.assertRaises(ValueError):parse_response(data)

    def test_multipart_auth_and_single_lookup(self):
        def fake(req,timeout):
            self.assertEqual(req.full_url,'https://api.platerecognizer.com/v1/plate-reader/')
            self.assertEqual(req.get_header('Authorization'),'Token secret')
            self.assertNotIn('secret',req.full_url)
            message=BytesParser(policy=default).parsebytes(('Content-Type: '+req.get_header('Content-type')+'\r\n\r\n').encode()+req.data)
            parts={p.get_param('name',header='content-disposition'):p for p in message.iter_parts()}
            self.assertEqual(parts['mmc'].get_payload(decode=True),b'true')
            with Image.open(io.BytesIO(parts['upload'].get_payload(decode=True))) as im:self.assertEqual(im.size,(100,80))
            return io.BytesIO(json.dumps({'results':[detection()],'usage':{'calls':10,'max_calls':50000}}).encode())
        r=analyze(Image.new('RGB',(100,80)),'secret',True,opener=fake)
        self.assertEqual(r['usage']['lookups'],1)
        self.assertEqual(r['account_usage']['calls'],10)
        self.assertNotIn('secret',json.dumps(r))

    def test_disabled_mmc_explicit(self):
        def fake(req,timeout):
            self.assertIn(b'\r\nfalse\r\n',req.data)
            return io.BytesIO(b'{"results":[]}')
        self.assertEqual(analyze(Image.new('RGB',(2,2)),'secret',False,opener=fake)['usage']['lookups'],1)

    def test_request_errors_do_not_leak_token(self):
        for code in (400,401,402,403,413,429,500):
            def fake(req,timeout):raise HTTPError(req.full_url,code,'secret',None,None)
            with self.assertRaises(AnalysisError) as cm:analyze(Image.new('RGB',(2,2)),'secret',opener=fake)
            self.assertNotIn('secret',str(cm.exception))

    def test_timeout_lookup_unknown(self):
        def fake(req,timeout):raise URLError('secret')
        with self.assertRaises(AnalysisError) as cm:analyze(Image.new('RGB',(2,2)),'secret',opener=fake)
        self.assertIsNone(cm.exception.usage)

    def test_bad_json_and_schema_retain_lookup(self):
        for payload in (b'not json',b'{"wrong":true}'):
            def fake(req,timeout):return io.BytesIO(payload)
            with self.assertRaises(AnalysisError) as cm:analyze(Image.new('RGB',(2,2)),'secret',opener=fake)
            self.assertEqual(cm.exception.usage,{'lookups':1})

    def test_no_key_no_call(self):
        def fake(*args,**kwargs):self.fail('Network should not be called')
        with self.assertRaises(AnalysisError) as cm:analyze(Image.new('RGB',(2,2)),'',opener=fake)
        self.assertEqual(cm.exception.usage,{'lookups':0})

    def test_upload_limit(self):
        image=Image.new('RGB',(2,2))
        with patch.object(image,'save',side_effect=lambda out,**kw:out.write(b'x'*3_000_001)):
            with self.assertRaises(AnalysisError) as cm:image_payload(image)
        self.assertEqual(cm.exception.usage,{'lookups':0})

    def test_orientation_source_unchanged(self):
        with tempfile.TemporaryDirectory() as td:
            path=Path(td)/'a.jpg'; exif=Image.Exif(); exif[274]=6
            Image.new('RGB',(30,20)).save(path,exif=exif)
            before=path.read_bytes(); self.assertEqual(load_image(path).size,(20,30)); self.assertEqual(path.read_bytes(),before)
