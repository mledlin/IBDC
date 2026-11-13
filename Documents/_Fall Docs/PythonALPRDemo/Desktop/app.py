"""Local desktop review app. FastALPR requests run online, one image at a time."""
import csv
import json
import os
import queue
import threading
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from tkinter.scrolledtext import ScrolledText
from pathlib import Path
from PIL import Image, ImageTk
from recognition import DEFAULT_MODEL, load_image, analyze
from session import Session, Batch, Rates, default_rates, folder_images


class App:
    def __init__(self, root, analyzer=analyze):
        self.root = root; self.analyzer = analyzer
        self.image = None; self.path = None; self.entry = None; self.busy = False
        self.session = Session(); self.batch = Batch(); self.events = queue.Queue()
        self.model = DEFAULT_MODEL
        self.endpoint = 'http://127.0.0.1:8000'
        self.key = os.getenv('FASTALPR_API_TOKEN', '')
        self.rates = default_rates(self.model)
        self.cancelled = False; self.pending_next = None; self.active_request = None
        root.title('FastALPR Plate Review'); root.geometry('1280x850'); root.minsize(1000,700)
        root.protocol('WM_DELETE_WINDOW', self.close_app)
        style = ttk.Style(root); style.theme_use('clam')
        style.configure('TButton',font=('Segoe UI',10),padding=(10,7))
        style.configure('Grade.TButton',font=('Segoe UI',13,'bold'),padding=(20,10))
        outer = ttk.Frame(root,padding=16); outer.pack(fill='both',expand=True)
        header=ttk.Frame(outer); header.pack(fill='x')
        ttk.Label(header,text='License plate review',font=('Segoe UI',20,'bold')).pack(side='left')
        self.settings_btn=ttk.Button(header,text='Connection and hosting settings',command=self.settings)
        self.settings_btn.pack(side='right')
        self.model_label=ttk.Label(outer,text='',font=('Segoe UI',10)); self.model_label.pack(anchor='w',pady=(3,10))
        controls=ttk.Frame(outer); controls.pack(fill='x')
        self.choose_btn=ttk.Button(controls,text='Choose image',command=self.choose); self.choose_btn.pack(side='left')
        self.folder_btn=ttk.Button(controls,text='Choose folder and start',command=self.choose_folder); self.folder_btn.pack(side='left',padx=6)
        self.run_btn=ttk.Button(controls,text='Analyze image',command=self.start); self.run_btn.pack(side='left')
        self.cancel_btn=ttk.Button(controls,text='Cancel',command=self.cancel); self.cancel_btn.pack(side='left',padx=6)
        self.skip_btn=ttk.Button(controls,text='Skip error',command=self.skip_error); self.skip_btn.pack(side='left')
        self.full_btn=ttk.Button(controls,text='Full resolution',command=self.full_image); self.full_btn.pack(side='right')
        self.progress=tk.StringVar(value='Choose an image or a folder to begin.')
        ttk.Label(outer,textvariable=self.progress,font=('Segoe UI',14,'bold')).pack(anchor='w',pady=(12,3))
        self.file_label=tk.StringVar(value='No image selected')
        ttk.Label(outer,textvariable=self.file_label,wraplength=1150).pack(anchor='w',pady=(0,8))
        # Footer is packed before the expanding image area so grades/stats remain visible.
        footer=ttk.Frame(outer); footer.pack(side='bottom',fill='x',pady=(10,0))
        ttk.Separator(footer).pack(fill='x',pady=(0,8))
        self.stats=tk.StringVar(); ttk.Label(footer,textvariable=self.stats,font=('Segoe UI',13,'bold')).pack(anchor='w')
        self.cost_note=tk.StringVar(); ttk.Label(footer,textvariable=self.cost_note,font=('Segoe UI',9),wraplength=1150).pack(anchor='w',pady=(4,8))
        actions=ttk.Frame(footer); actions.pack(fill='x')
        self.export_btn=ttk.Button(actions,text='Export session',command=self.export); self.export_btn.pack(side='left')
        self.result_btn=ttk.Button(actions,text='Save current result',command=self.save_result); self.result_btn.pack(side='left',padx=6)
        self.reset_btn=ttk.Button(actions,text='Reset session',command=self.reset); self.reset_btn.pack(side='left')
        self.grade_buttons={}
        for grade in ('Close','Fail','Pass'):
            btn=ttk.Button(actions,text=grade,style='Grade.TButton',command=lambda g=grade:self.grade(g))
            btn.pack(side='right',padx=(6,0)); self.grade_buttons[grade]=btn
        ttk.Label(footer,text='Pass = correct     Fail = incorrect     Close = near match     One manual grade per image result.').pack(anchor='e',pady=(5,0))
        panes=ttk.Panedwindow(outer,orient='horizontal'); panes.pack(fill='both',expand=True)
        left=ttk.Frame(panes); right=ttk.Frame(panes); panes.add(left,weight=3); panes.add(right,weight=2)
        ttk.Label(left,text='Original image',font=('Segoe UI',11,'bold')).pack(anchor='w')
        self.preview=ttk.Label(left,anchor='center'); self.preview.pack(fill='both',expand=True)
        self.preview.bind('<Configure>',self.resize)
        self.result_title=tk.StringVar(value='Suggestions — not yet analyzed')
        ttk.Label(right,textvariable=self.result_title,font=('Segoe UI',12,'bold'),wraplength=430).pack(anchor='w')
        self.output=ScrolledText(right,wrap='word',width=42,font=('Segoe UI',14),state='disabled')
        self.output.pack(fill='both',expand=True,pady=(5,0))
        self.write('Plate results and response times will appear here. State and color are not supported in this demo.')
        self.refresh(); root.after(100,self.poll)

    def refresh(self):
        locked = self.busy or self.batch.active or self.pending_next is not None
        for w in (self.choose_btn,self.folder_btn,self.settings_btn,self.reset_btn):
            w.config(state='disabled' if locked else 'normal')
        awaiting=self.entry is not None and self.entry['status']=='analyzed' and self.entry['grade'] is None
        self.run_btn.config(state='normal' if self.image is not None and not self.busy and not awaiting and self.pending_next is None else 'disabled')
        self.cancel_btn.config(state='normal' if self.busy or self.batch.active or self.pending_next is not None else 'disabled')
        self.skip_btn.config(state='normal' if self.batch.active and not self.busy and self.entry and self.entry['status']=='error' else 'disabled')
        self.full_btn.config(state='normal' if self.image else 'disabled')
        for w in self.grade_buttons.values(): w.config(state='normal' if awaiting and not self.busy and self.pending_next is None else 'disabled')
        self.result_btn.config(state='normal' if self.entry else 'disabled')
        self.export_btn.config(state='normal' if self.session.records else 'disabled')
        t=self.session.totals()
        timing=self.session.timing(); hosting=self.session.hosting()
        fmt=lambda x: f'{x:.3f}s' if x is not None else '—'
        cost=f"${hosting['estimated_hosting_usd']:.6f}"
        if hosting['unpriced_seconds'] > 1: cost += ' + unpriced time'
        self.stats.set(f"Analyzed: {t['analyzed']}    Pass: {t['pass']}    Fail: {t['fail']}    Close: {t['close']}    Ungraded: {t['ungraded']}    Errors: {t['errors']}\nResponse — Avg: {fmt(timing['average'])}    Fastest: {fmt(timing['fastest'])}    Slowest: {fmt(timing['slowest'])}    Hosting: {cost}")
        self.cost_note.set('Hosting estimate covers desktop session time, including grading/idle time; excludes AWS time outside this session, storage and transfer. Export before closing.')
        self.model_label.config(text=f'{self.model}  |  {self.endpoint}  |  CPU on your AWS server')

    def settings(self):
        win=tk.Toplevel(self.root); win.title('Connection and hosting'); win.transient(self.root); win.grab_set()
        frame=ttk.Frame(win,padding=18); frame.pack()
        endpoint=tk.StringVar(value=self.endpoint); key=tk.StringVar(value=self.key)
        fee=tk.StringVar(value=str(self.rates.hourly_usd) if self.rates else '')
        for i,(label,var) in enumerate([('Server URL (SSH tunnel)',endpoint),('Server token (not saved)',key),('AWS hourly USD (blank = unknown)',fee)]):
            ttk.Label(frame,text=label).grid(row=i,column=0,sticky='w',pady=5)
            ttk.Entry(frame,textvariable=var,width=42,show='*' if i==1 else '').grid(row=i,column=1,padx=10,pady=5)
        ttk.Label(frame,text='Use http://127.0.0.1:8000 with the SSH tunnel running.\nThe hourly rate estimates this desktop session only, not your AWS invoice.').grid(row=3,column=0,columnspan=2,pady=10)
        def save():
            try:
                from recognition import validate_endpoint
                url=validate_endpoint(endpoint.get())
                rate=Rates(float(fee.get())) if fee.get().strip() else None
            except ValueError as exc: messagebox.showerror('Settings',str(exc),parent=win); return
            self.endpoint=url; self.key=key.get().strip(); self.rates=rate
            self.session.set_rate(rate); win.destroy(); self.refresh()
        ttk.Button(frame,text='Save settings',command=save).grid(row=4,column=1,sticky='e')

    def write(self,text):
        self.output.config(state='normal'); self.output.delete('1.0','end'); self.output.insert('end',text); self.output.config(state='disabled')

    def leave_current(self):
        if self.entry and self.entry['status']=='analyzed' and self.entry['grade'] is None:
            return messagebox.askyesno('Leave ungraded?','Leave this result ungraded and choose another image? It remains in session totals.')
        return True

    def choose(self):
        if self.busy or self.batch.active or not self.leave_current():return
        path=filedialog.askopenfilename(filetypes=[('Images','*.jpg *.jpeg *.png *.webp'),('All files','*.*')])
        if path:self.open_image(Path(path))

    def choose_folder(self):
        if self.busy or self.batch.active or not self.leave_current():return
        if not self.key:
            messagebox.showinfo('API key required','Enter your key in Connection and hosting settings before starting a folder.'); self.settings(); return
        folder=filedialog.askdirectory(title='Choose a folder of images (not recursive)')
        if not folder:return
        try:self.batch.start(folder_images(folder))
        except (ValueError,OSError) as exc:messagebox.showerror('Folder',str(exc)); return
        self.cancelled=False; self.next_image()

    def open_image(self,path):
        self.entry=None; self.image=None; self.path=Path(path); self.preview.config(image=''); self.photo=None
        self.file_label.set(self.path.name); self.result_title.set('Suggestions — not yet analyzed')
        try:self.image=load_image(self.path)
        except Exception as exc:
            self.entry=self.session.record(self.path.name,{'usage':{'lookups':0}},None,error=f'Image could not be opened: {exc}',source='folder' if self.batch.active else 'single',model=self.model)
            self.write(self.entry['error']); self.progress.set('Image error — skip this file or cancel.'); self.refresh(); return False
        self.file_label.set(f'{self.path.name}  |  {self.image.width} × {self.image.height} pixels')
        self.write('Ready to analyze.'); self.progress.set('Image ready'); self.resize(); self.refresh(); return True

    def next_image(self):
        self.pending_next=None
        if not self.batch.active:self.refresh(); return
        if self.open_image(self.batch.current):self.start()

    def resize(self,event=None):
        if self.image is None:return
        copy=self.image.copy(); copy.thumbnail((max(1,self.preview.winfo_width()-12),max(1,self.preview.winfo_height()-12)),Image.Resampling.LANCZOS)
        self.photo=ImageTk.PhotoImage(copy); self.preview.config(image=self.photo)

    def full_image(self):
        if self.image is None:return
        win=tk.Toplevel(self.root); win.title(f'Full resolution — {self.path.name}'); win.geometry('900x650')
        canvas=tk.Canvas(win); sx=ttk.Scrollbar(win,orient='horizontal',command=canvas.xview); sy=ttk.Scrollbar(win,orient='vertical',command=canvas.yview)
        sy.pack(side='right',fill='y'); sx.pack(side='bottom',fill='x'); canvas.pack(fill='both',expand=True)
        canvas.configure(xscrollcommand=sx.set,yscrollcommand=sy.set,scrollregion=(0,0,self.image.width,self.image.height))
        canvas.photo=ImageTk.PhotoImage(self.image); canvas.create_image(0,0,anchor='nw',image=canvas.photo)

    def start(self):
        if self.busy or self.image is None or self.pending_next is not None:return
        if self.entry and self.entry['status']=='analyzed' and self.entry['grade'] is None:return
        if not self.key:
            messagebox.showinfo('API key required','Enter your key in Connection and hosting settings.'); self.settings(); return
        self.busy=True; self.cancelled=False; self.entry=None
        self.active_request={'filename':self.path.name,'dimensions':list(self.image.size),'rates':self.rates,
                             'model':self.model,'source':'folder' if self.batch.active else 'single',
                             'position':self.batch.position if self.batch.active else None}
        label=f'Analyzing image {self.batch.position}' if self.batch.active else 'Analyzing image'
        self.progress.set(label); self.result_title.set('Waiting for FastALPR'); self.write('Analyzing…'); self.refresh()
        image=self.image.copy(); key=self.key; endpoint=self.endpoint
        def worker():
            try:self.events.put(('ok',self.analyzer(image,key,endpoint)))
            except Exception as exc:self.events.put(('error',{'message':str(exc),'usage':getattr(exc,'usage',None),'elapsed_seconds':getattr(exc,'elapsed_seconds',None)}))
        threading.Thread(target=worker,daemon=True).start()

    def poll(self):
        try:kind,data=self.events.get_nowait()
        except queue.Empty:pass
        else:self.finish(kind,data)
        self.refresh()
        self.root.after(250,self.poll)

    def finish(self,kind,data):
        self.busy=False; req=self.active_request
        if kind=='error':
            self.entry=self.session.record(req['filename'],{'usage':data.get('usage'),'elapsed_seconds':data.get('elapsed_seconds'),'model':req['model']},req['rates'],error=data['message'],source=req['source'])
            self.write(data['message']); self.result_title.set('Analysis error — no grade recorded')
            self.progress.set('Folder paused — retry, skip this image, or cancel.' if self.batch.active else 'Analysis failed.')
        else:
            data['image_dimensions']=req['dimensions']
            self.entry=self.session.record(req['filename'],data,req['rates'],source=req['source'])
            rows=[]
            for i,v in enumerate(data['vehicles'],1):
                rows.append(f"Vehicle {i} — {v['position']}\n\nPLATE    {v['plate'] or 'Unknown'}\nSTATE    {v['state'] or 'Not supported'}\nCOLOR    {v['color'] or 'Not supported'}\n\n{v['notes'] or ''}")
            self.write('\n\n────────────────────\n\n'.join(rows) if rows else 'No plates detected by FastALPR. A vehicle may still be visible; verify against the original image.')
            self.write(self.output.get('1.0','end').strip() + f"\n\nTotal response: {data['elapsed_seconds']:.3f}s\nModel processing: {data['processing_seconds']:.3f}s\nOther overhead: {data['overhead_seconds']:.3f}s")
            self.result_title.set(f"Suggestions  |  {data['elapsed_seconds']:.2f}s  |  Ungraded")
            if self.cancelled:self.progress.set('Queue cancelled — current request finished. You may grade this result.')
            elif self.batch.active:self.progress.set(f'Image {self.batch.position} — waiting for Pass / Fail / Close')
            else:self.progress.set('Analysis complete — choose Pass, Fail or Close.')
        self.active_request=None; self.refresh()

    def grade(self,grade):
        if self.busy or self.pending_next is not None or not self.entry:return
        try:self.session.grade(self.entry,grade)
        except ValueError:return
        self.result_title.set(f"Suggestions  |  {self.entry['result']['elapsed_seconds']:.2f}s  |  {grade.upper()}")
        self.progress.set(f'Grade recorded: {grade}')
        if self.batch.active:
            if self.batch.advance() is not None:
                # Briefly retain the graded result for visual feedback; cancel stays usable.
                self.progress.set(f'{grade} recorded — next image starts shortly.')
                self.pending_next=self.root.after(700,self.next_image)
            else:self.progress.set(f'Folder complete — {len(self.batch.paths)} images processed. Last grade: {grade}')
        self.refresh()

    def skip_error(self):
        if self.busy or not self.batch.active or not self.entry or self.entry['status']!='error':return
        if self.batch.advance() is not None:self.next_image()
        else:self.progress.set('Folder complete — errors remain listed in session totals.'); self.refresh()

    def cancel(self):
        self.cancelled=True; self.batch.cancel()
        if self.pending_next is not None:
            self.root.after_cancel(self.pending_next); self.pending_next=None
        self.progress.set('Cancelled — no further images will be sent. Waiting for the in-flight request; server processing may still complete.' if self.busy else 'Folder cancelled — session totals retained.')
        self.refresh()

    def export(self):
        path=filedialog.asksaveasfilename(defaultextension='.json',initialfile='fastalpr_review_session.json',filetypes=[('JSON session','*.json'),('CSV table','*.csv')])
        if not path:return
        try:
            if Path(path).suffix.lower()=='.csv':
                fields=['id','image_filename','source','status','grade','model','elapsed_seconds','processing_seconds','overhead_seconds','plate','state','color','position','notes','error']
                with open(path,'w',newline='',encoding='utf-8-sig') as f:
                    writer=csv.DictWriter(f,fieldnames=fields); writer.writeheader()
                    for r in self.session.records:
                        row={k:r.get(k) for k in fields}
                        for k in ('plate','state','color','position','notes'):
                            row[k]=' | '.join(str(v.get(k) or 'Unknown') for v in r['result'].get('vehicles',[]))
                        for metric in ('elapsed_seconds','processing_seconds','overhead_seconds'): row[metric]=r['result'].get(metric)
                        writer.writerow(row)
                Path(path).with_suffix('.summary.json').write_text(json.dumps({'totals':self.session.totals(),'timing':self.session.timing(),'hosting':self.session.hosting()},indent=2),encoding='utf-8')
            else:Path(path).write_text(json.dumps({'totals':self.session.totals(),'timing':self.session.timing(),'hosting':self.session.hosting(),'records':self.session.records},indent=2),encoding='utf-8')
        except OSError as exc:messagebox.showerror('Export failed',str(exc))

    def save_result(self):
        if not self.entry:return
        path=filedialog.asksaveasfilename(defaultextension='.json',initialfile=self.path.stem+'_fastalpr.json',filetypes=[('JSON','*.json')])
        if path:
            try:Path(path).write_text(json.dumps(self.entry,indent=2),encoding='utf-8')
            except OSError as exc:messagebox.showerror('Save failed',str(exc))

    def reset(self):
        if self.busy or self.batch.active:return
        if self.session.records and not messagebox.askyesno('Reset session?','Clear all session totals and grades? Export first if you want to keep them.'):return
        self.session=Session(); self.session.set_rate(self.rates); self.entry=None; self.write('Session reset. Analyze the selected image or choose another.'); self.result_title.set('Suggestions — not yet analyzed'); self.progress.set('Session reset.'); self.refresh()

    def close_app(self):
        if (self.busy or self.session.records) and not messagebox.askyesno('Exit?', 'Exit the app? Unexported session data will be lost. An in-flight API request may still complete.'):return
        self.batch.cancel()
        if self.pending_next is not None:self.root.after_cancel(self.pending_next)
        self.root.destroy()

if __name__=='__main__':
    root=tk.Tk(); App(root); root.mainloop()
