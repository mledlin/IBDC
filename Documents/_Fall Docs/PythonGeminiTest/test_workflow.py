"""Exercise GUI controller transitions without a display or a live API."""
import unittest
from unittest.mock import Mock
from app import App
from session import Session, Batch, Rates

class WorkflowTests(unittest.TestCase):
    def app(self):
        a=App.__new__(App)
        a.root=Mock(); a.root.after.return_value='timer-1'
        a.session=Session(); a.batch=Batch(); a.entry=None
        a.busy=False; a.pending_next=None; a.cancelled=False
        a.progress=Mock(); a.result_title=Mock(); a.refresh=Mock(); a.write=Mock()
        return a

    def result(self):
        return {'vehicles':[{'position':'left','plate':'ABC123','state':'AZ','color':'red','notes':''}],
                'elapsed_seconds':1,'usage':{'promptTokenCount':100},'model':'test'}

    def test_folder_waits_for_grade_and_counts_once(self):
        a=self.app(); a.batch.start(['a','b'])
        a.active_request={'filename':'a','dimensions':[10,10],'rates':Rates(1,1,1),'source':'folder','model':'test'}
        a.finish('ok',self.result())
        self.assertEqual(a.batch.current,'a'); a.root.after.assert_not_called()
        a.grade('Pass'); self.assertEqual(a.batch.current,'b')
        self.assertEqual(a.session.totals()['pass'],1)
        a.grade('Pass'); self.assertEqual(a.session.totals()['pass'],1)

    def test_cancel_during_request_accounts_result_but_no_next(self):
        a=self.app(); a.batch.start(['a','b']); a.busy=True
        a.active_request={'filename':'a','dimensions':[10,10],'rates':Rates(1,1,1),'source':'folder','model':'test'}
        a.cancel(); a.finish('ok',self.result()); a.grade('Close')
        self.assertFalse(a.batch.active); a.root.after.assert_not_called()
        self.assertEqual(a.session.totals()['analyzed'],1)
        self.assertEqual(a.session.totals()['close'],1)
        self.assertGreater(a.session.totals()['estimated_cost_usd'],0)

    def test_cancel_scheduled_next(self):
        a=self.app(); a.batch.start(['a','b']); a.pending_next='timer-1'
        a.cancel(); a.root.after_cancel.assert_called_once_with('timer-1')
        self.assertIsNone(a.pending_next); self.assertFalse(a.batch.active)

    def test_error_pauses_without_false_fail_grade(self):
        a=self.app(); a.batch.start(['a','b'])
        a.active_request={'filename':'a','dimensions':[10,10],'rates':Rates(1,1,1),'source':'folder','model':'test'}
        a.finish('error',{'message':'quota','usage':None})
        self.assertEqual(a.batch.current,'a'); a.root.after.assert_not_called()
        self.assertEqual(a.session.totals()['fail'],0)
        self.assertEqual(a.session.totals()['errors'],1)
