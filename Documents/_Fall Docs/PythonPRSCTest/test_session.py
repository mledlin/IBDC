import tempfile
import unittest
from pathlib import Path
from session import Rates, estimate_cost, Session, Batch, folder_images

class SessionTests(unittest.TestCase):
    def test_subscription_allocation(self):
        self.assertEqual(estimate_cost({'lookups':1},Rates(50,50000)),.001)
        self.assertEqual(estimate_cost({'lookups':1},Rates(75,50000)),.0015)
    def test_unknown_not_zero(self):
        self.assertIsNone(estimate_cost({},Rates(50,50000)))
        self.assertIsNone(estimate_cost({'lookups':1},None))
        self.assertEqual(estimate_cost({'lookups':0},Rates(50,50000)),0)
    def test_invalid_plan(self):
        for args in ((-1,100),(50,0),(50,1.5),(float('nan'),10)):
            with self.assertRaises(ValueError):Rates(*args)
    def test_combined_grades(self):
        s=Session(); a=s.record('a',{'usage':{'lookups':1}},Rates(50,50000))
        b=s.record('b',{'usage':{'lookups':1}},Rates(50,50000),source='folder')
        s.grade(a,'Pass'); s.grade(b,'Close')
        with self.assertRaises(ValueError):s.grade(b,'Fail')
        t=s.totals(); self.assertEqual((t['analyzed'],t['pass'],t['close'],t['lookups']),(2,1,1,2))
        self.assertEqual(t['estimated_cost_usd'],.002)
    def test_invalid_response_counts_lookup_but_not_analyzed(self):
        s=Session(); r=s.record('a',{'usage':{'lookups':1}},Rates(50,50000),error='Invalid JSON')
        self.assertEqual(s.totals()['lookups'],1); self.assertEqual(s.totals()['analyzed'],0)
        with self.assertRaises(ValueError):s.grade(r,'Fail')
    def test_timeout_unknown(self):
        s=Session(); s.record('a',{'usage':None},Rates(50,50000),error='timeout')
        self.assertEqual(s.totals()['unknown_cost_requests'],1)
    def test_rates_snapshot(self):
        s=Session(); s.record('a',{'usage':{'lookups':1}},Rates(50,50000)); s.record('b',{'usage':{'lookups':1}},Rates(75,50000))
        self.assertEqual(s.totals()['estimated_cost_usd'],.0025)
    def test_wait_advance_cancel(self):
        b=Batch(); b.start(['a','b']); self.assertEqual(b.current,'a'); self.assertEqual(b.position,'1 of 2')
        self.assertEqual(b.advance(),'b'); b.cancel(); self.assertIsNone(b.advance())
    def test_empty_and_complete(self):
        b=Batch()
        with self.assertRaises(ValueError):b.start([])
        b.start(['a']); self.assertIsNone(b.advance()); self.assertFalse(b.active)
    def test_folder_filter(self):
        with tempfile.TemporaryDirectory() as d:
            for name in ('b.PNG','a.jpg','no.txt'):Path(d,name).touch()
            (Path(d)/'sub').mkdir(); (Path(d)/'sub'/'nested.jpg').touch()
            self.assertEqual([p.name for p in folder_images(d)],['a.jpg','b.PNG'])
