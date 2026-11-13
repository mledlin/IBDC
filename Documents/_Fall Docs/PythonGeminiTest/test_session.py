import tempfile
import unittest
from datetime import date
from pathlib import Path
from session import Batch, Rates, Session, default_rates, estimate_cost, folder_images

class SessionTests(unittest.TestCase):
    def test_thinking_and_cache_pricing(self):
        usage={'promptTokenCount':1000,'cachedContentTokenCount':200,'candidatesTokenCount':100,'thoughtsTokenCount':300}
        self.assertAlmostEqual(estimate_cost(usage,Rates(1,5,.1)),.00282)

    def test_unknown_usage_is_not_free(self):
        self.assertIsNone(estimate_cost({},Rates(1,2,.1)))
        self.assertIsNone(estimate_cost({'promptTokenCount':100},None))

    def test_bad_counts(self):
        self.assertIsNone(estimate_cost({'promptTokenCount':-1},Rates(1,2,.1)))
        self.assertIsNone(estimate_cost({'promptTokenCount':100,'cachedContentTokenCount':101},Rates(1,2,.1)))

    def test_free_tier(self):
        self.assertEqual(estimate_cost({'promptTokenCount':100,'candidatesTokenCount':50},Rates(0,0,0)),0)

    def test_invalid_rates(self):
        for n in (float('nan'),float('inf'),-1):
            with self.assertRaises(ValueError):Rates(n,1,1)

    def test_price_schedule_and_unknown_model(self):
        self.assertEqual(default_rates('gemini-3.8-flash',date(2026,12,31)).input,.75)
        self.assertEqual(default_rates('gemini-3.8-flash',date(2027,1,1)).input,1.5)
        self.assertIsNone(default_rates('custom-model'))

    def test_single_folder_combine_and_duplicates_rejected(self):
        s=Session(); a=s.record('one.jpg',{'usage':{'promptTokenCount':100}},Rates(1,1,1))
        b=s.record('two.jpg',{'usage':{'promptTokenCount':100}},Rates(1,1,1),source='folder')
        s.grade(a,'Pass'); s.grade(b,'Close')
        with self.assertRaises(ValueError):s.grade(b,'Fail')
        t=s.totals(); self.assertEqual((t['analyzed'],t['pass'],t['close'],t['ungraded']),(2,1,1,0))
        self.assertAlmostEqual(t['estimated_cost_usd'],.0002)

    def test_error_and_unknown_cost_accounted_without_grade(self):
        s=Session(); e=s.record('one.jpg',{},None,error='Network failure')
        with self.assertRaises(ValueError):s.grade(e,'Fail')
        self.assertEqual(s.totals()['errors'],1)
        self.assertEqual(s.totals()['analyzed'],0)
        self.assertEqual(s.totals()['unknown_cost_requests'],1)

    def test_error_with_usage_still_costs(self):
        s=Session(); s.record('bad.jpg',{'usage':{'promptTokenCount':1000}},Rates(1,1,1),error='Malformed result')
        self.assertEqual(s.totals()['estimated_cost_usd'],.001)

    def test_historical_cost_not_repriced(self):
        s=Session(); s.record('a',{'usage':{'promptTokenCount':1000000}},Rates(1,1,1))
        s.record('b',{'usage':{'promptTokenCount':1000000}},Rates(2,2,2))
        self.assertEqual(s.totals()['estimated_cost_usd'],3)

    def test_batch_does_not_advance_without_grade(self):
        b=Batch(); b.start(['a','b']); self.assertEqual(b.current,'a')
        self.assertEqual(b.current,'a'); self.assertEqual(b.position,'1 of 2')
        self.assertEqual(b.advance(),'b'); self.assertIsNone(b.advance()); self.assertFalse(b.active)

    def test_cancel_prevents_advancing(self):
        b=Batch(); b.start(['a','b']); b.cancel()
        self.assertIsNone(b.advance()); self.assertIsNone(b.current)

    def test_folder_filter_sort_no_recursion(self):
        with tempfile.TemporaryDirectory() as d:
            for name in ['b.PNG','a.jpg','notes.txt','c.webp']:Path(d,name).touch()
            sub=Path(d,'nested'); sub.mkdir(); (sub/'x.jpg').touch()
            self.assertEqual([p.name for p in folder_images(d)],['a.jpg','b.PNG','c.webp'])
