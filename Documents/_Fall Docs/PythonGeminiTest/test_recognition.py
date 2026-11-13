import base64
import io
import json
import tempfile
import unittest
from pathlib import Path
from urllib.error import HTTPError
from PIL import Image
from recognition import analyze, parse_response, load_image


def envelope(vehicles,finish='STOP'):
    return {'candidates':[{'finishReason':finish,'content':{'parts':[{'text':json.dumps({'vehicles':vehicles})}]}}]}

def vehicle(**changes):
    return dict({'position':'left sedan','plate':'ABC123','state':'AZ','color':'red','notes':''},**changes)

class RecognitionTests(unittest.TestCase):
    def test_multiple_vehicles_and_unknowns(self):
        result=parse_response(envelope([vehicle(),vehicle(plate=None,state=None,color='blue')]))
        self.assertEqual(len(result['vehicles']),2)
        self.assertIsNone(result['vehicles'][1]['plate'])

    def test_no_vehicles(self):
        self.assertEqual(parse_response(envelope([])),{'vehicles':[]})

    def test_truncated_output_rejected(self):
        with self.assertRaises(ValueError):parse_response(envelope([vehicle()],'MAX_TOKENS'))

    def test_invalid_state_rejected(self):
        with self.assertRaises(ValueError):parse_response(envelope([vehicle(state='Arizona')]))

    def test_missing_candidate_rejected(self):
        with self.assertRaises(ValueError):parse_response({'promptFeedback':{'blockReason':'SAFETY'}})

    def test_malformed_json_rejected(self):
        with self.assertRaises(ValueError):parse_response({'candidates':[{'finishReason':'STOP','content':{'parts':[{'text':'not json'}]}}]})

    def test_request_preserves_image_and_key_not_in_result(self):
        def fake(req,timeout):
            self.assertEqual(timeout,90)
            self.assertNotIn('test-secret',req.full_url)
            self.assertEqual(req.get_header('X-goog-api-key'),'test-secret')
            payload=json.loads(req.data)
            raw=base64.b64decode(payload['contents'][0]['parts'][1]['inlineData']['data'])
            with Image.open(io.BytesIO(raw)) as im:self.assertEqual(im.size,(350,200))
            self.assertEqual(payload['generationConfig']['responseMimeType'],'application/json')
            return io.BytesIO(json.dumps(envelope([vehicle()])).encode())
        result=analyze(Image.new('RGB',(350,200)),'test-secret',opener=fake)
        self.assertEqual(result['vehicles'][0]['plate'],'ABC123')
        self.assertNotIn('test-secret',json.dumps(result))

    def test_quota_error_is_actionable_and_redacted(self):
        def fake(req,timeout):raise HTTPError(req.full_url,429,'test-secret',None,None)
        with self.assertRaisesRegex(ValueError,'Quota') as cm:
            analyze(Image.new('RGB',(20,20)),'test-secret',opener=fake)
        self.assertNotIn('test-secret',str(cm.exception))

    def test_blank_key_prevents_call(self):
        def fake(*args,**kwargs):self.fail('Should not call API')
        with self.assertRaises(ValueError):analyze(Image.new('RGB',(10,10)),'',opener=fake)

    def test_exif_rotation_and_source_unchanged(self):
        with tempfile.TemporaryDirectory() as td:
            path=Path(td)/'rotated.jpg'; exif=Image.Exif(); exif[274]=6
            Image.new('RGB',(30,20)).save(path,exif=exif)
            before=path.read_bytes(); image=load_image(path)
            self.assertEqual(image.size,(20,30)); self.assertEqual(before,path.read_bytes())

    def test_invalid_image_rejected(self):
        with tempfile.TemporaryDirectory() as td:
            path=Path(td)/'bad.jpg'; path.write_text('not an image')
            with self.assertRaises(Exception):load_image(path)

if __name__=='__main__':unittest.main()

class BillingAndUsageTests(unittest.TestCase):
    def test_402_explains_billing(self):
        def fake(req,timeout):raise HTTPError(req.full_url,402,'Payment needed',None,None)
        with self.assertRaisesRegex(ValueError,'prepaid balance'):
            analyze(Image.new('RGB',(20,20)),'test-secret',opener=fake)

    def test_malformed_answer_keeps_usage(self):
        from recognition import AnalysisError
        def fake(req,timeout):
            data=envelope([vehicle()],'MAX_TOKENS')
            data['usageMetadata']={'promptTokenCount':100,'thoughtsTokenCount':50}
            return io.BytesIO(json.dumps(data).encode())
        with self.assertRaises(AnalysisError) as cm:
            analyze(Image.new('RGB',(20,20)),'test-secret',opener=fake)
        self.assertEqual(cm.exception.usage['thoughtsTokenCount'],50)
