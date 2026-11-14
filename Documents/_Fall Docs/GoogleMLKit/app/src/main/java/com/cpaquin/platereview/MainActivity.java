package com.cpaquin.platereview;

import android.app.*;
import android.os.*;
import android.content.*;
import android.database.Cursor;
import android.graphics.*;
import android.net.Uri;
import android.provider.*;
import android.view.*;
import android.widget.*;
import androidx.exifinterface.media.ExifInterface;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.*;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;

public class MainActivity extends Activity {
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private final TextRecognizer recognizer=TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
    private final ArrayList<Uri> images=new ArrayList<>();
    private JSONArray records=new JSONArray();
    private JSONObject current;
    private int index=0;
    private boolean busy=false, queueActive=false, destroyed=false;
    private TextView progress, output, stats, fileLabel;
    private ImageView preview;
    private Button choose, folder, cancel, pass, fail, close, skip, retry, reset;
    private Bitmap shown;
    private String exportPayload="";
    private static final int PICK=11,TREE=12,EXPORT=13;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        try {records=new JSONArray(getPreferences(0).getString("records","[]"));}catch(Exception ignored){}
        LinearLayout root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setPadding(dp(12),dp(8),dp(12),dp(8)); root.setBackgroundColor(Color.rgb(245,247,246));
        root.setOnApplyWindowInsetsListener((v,insets)->{v.setPadding(dp(12)+insets.getSystemWindowInsetLeft(),dp(8)+insets.getSystemWindowInsetTop(),dp(12)+insets.getSystemWindowInsetRight(),dp(8)+insets.getSystemWindowInsetBottom());return insets;});
        setContentView(root);
        TextView title=text("ML Kit • Plate review",22); title.setTypeface(null,Typeface.BOLD); root.addView(title);
        root.addView(text("On-device OCR • Latin model • API cost $0",12));
        LinearLayout controls=row(root);
        choose=button(controls,"Images",v->pick()); folder=button(controls,"Folder",v->folder()); cancel=button(controls,"Cancel",v->{queueActive=false;progress.setText(busy?"Cancelled queue; current image will finish.":"Queue cancelled; results retained.");refresh();});
        progress=text("Choose images or a folder to begin.",16); root.addView(progress);
        fileLabel=text("",12); root.addView(fileLabel);
        ScrollView scroll=new ScrollView(this); root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
        LinearLayout content=new LinearLayout(this); content.setOrientation(LinearLayout.VERTICAL); scroll.addView(content);
        preview=new ImageView(this); preview.setScaleType(ImageView.ScaleType.FIT_CENTER); preview.setAdjustViewBounds(true); content.addView(preview,new LinearLayout.LayoutParams(-1,dp(230)));
        output=text("Original image and OCR results appear here. Tap the image for a larger view.",17); output.setTextIsSelectable(true); content.addView(output);
        preview.setOnClickListener(v->{if(shown!=null){ImageView large=new ImageView(this);large.setImageBitmap(shown);large.setAdjustViewBounds(true);new AlertDialog.Builder(this).setTitle("Image used for OCR").setView(large).setPositiveButton("Done",null).show();}});
        stats=text("",13); stats.setTypeface(null,Typeface.BOLD); root.addView(stats);
        LinearLayout actions=row(root); button(actions,"Export",v->exportMenu()); reset=button(actions,"Reset",v->new AlertDialog.Builder(this).setMessage("Clear all saved session results? Export first to keep them.").setNegativeButton("Keep",null).setPositiveButton("Reset",(d,w)->{records=new JSONArray();current=null;save();refresh();output.setText("Session reset.");}).show());
        retry=button(actions,"Retry",v->analyze()); skip=button(actions,"Skip",v->advance());
        LinearLayout grades=row(root); grades.setGravity(Gravity.END);
        pass=button(grades,"Pass",v->grade("Pass")); fail=button(grades,"Fail",v->grade("Fail")); close=button(grades,"Close",v->grade("Close"));
        root.addView(text("Pass = correct  •  Fail = incorrect  •  Close = near match",11));
        if(records.length()>0)progress.setText("Previous results restored. Select images to continue.");
        refresh();
    }
    private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
    private TextView text(String s,int size){TextView t=new TextView(this);t.setText(s);t.setTextSize(size);t.setTextColor(Color.rgb(25,40,35));t.setPadding(0,dp(3),0,dp(3));return t;}
    private LinearLayout row(LinearLayout parent){LinearLayout r=new LinearLayout(this);r.setOrientation(LinearLayout.HORIZONTAL);parent.addView(r);return r;}
    private Button button(LinearLayout row,String label,View.OnClickListener action){Button b=new Button(this);b.setText(label);b.setAllCaps(false);b.setTextSize(13);b.setMinWidth(0);b.setMinimumWidth(0);b.setPadding(dp(3),0,dp(3),0);row.addView(b,new LinearLayout.LayoutParams(0,dp(48),1));b.setOnClickListener(action);return b;}
    private void pick(){
        Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE);
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,true);startActivityForResult(intent,PICK);
    }
    private void folder(){startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE),TREE);}
    private String name(Uri uri){
        try(Cursor c=getContentResolver().query(uri,new String[]{OpenableColumns.DISPLAY_NAME},null,null,null)) {if(c!=null&&c.moveToFirst())return c.getString(0);}catch(Exception ignored){}
        return "Image";
    }
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data); if(result!=RESULT_OK||data==null)return;
        if(request==EXPORT){Uri uri=data.getData(); if(uri!=null){final String payload=exportPayload;worker.execute(()->{try(OutputStream out=getContentResolver().openOutputStream(uri,"wt")){if(out==null)throw new IOException("Cannot open export");out.write(payload.getBytes(StandardCharsets.UTF_8));runOnUiThread(()->Toast.makeText(this,"Export saved",Toast.LENGTH_SHORT).show());}catch(Exception ex){runOnUiThread(()->errorDialog("Export failed: "+ex.getMessage()));}});}return;}
        ArrayList<Uri> selected=new ArrayList<>();
        if(request==PICK){
            if(data.getClipData()!=null)for(int i=0;i<data.getClipData().getItemCount();i++)selected.add(data.getClipData().getItemAt(i).getUri());
            else if(data.getData()!=null)selected.add(data.getData());
            begin(selected);return;
        }
        if(request==TREE&&data.getData()!=null){Uri tree=data.getData();busy=true;refresh();progress.setText("Reading folder…");worker.execute(()->{
            try {Uri children=DocumentsContract.buildChildDocumentsUriUsingTree(tree,DocumentsContract.getTreeDocumentId(tree));
                try(Cursor c=getContentResolver().query(children,new String[]{DocumentsContract.Document.COLUMN_DOCUMENT_ID,DocumentsContract.Document.COLUMN_MIME_TYPE},null,null,null)){
                    if(c!=null)while(c.moveToNext())if(c.getString(1)!=null&&c.getString(1).startsWith("image/"))selected.add(DocumentsContract.buildDocumentUriUsingTree(tree,c.getString(0)));
                }
                runOnUiThread(()->{busy=false;begin(selected);});
            }catch(Exception ex){runOnUiThread(()->{busy=false;refresh();errorDialog("Cannot read folder: "+ex.getMessage());});}
        });}
    }
    private void begin(ArrayList<Uri> selected){
        if(selected.isEmpty()){errorDialog("No images found. Subfolders are not included.");refresh();return;}
        selected.sort(Comparator.comparing(this::name,String.CASE_INSENSITIVE_ORDER));
        images.clear();images.addAll(selected);index=0;queueActive=images.size()>1;analyze();
    }
    private void analyze(){
        if(busy||index>=images.size())return;
        busy=true;current=null;refresh();output.setText("Analyzing…");preview.setImageDrawable(null);shown=null;
        Uri uri=images.get(index);String filename=name(uri);
        progress.setText("Analyzing image "+(index+1)+" of "+images.size());fileLabel.setText(filename);
        final long totalStart=SystemClock.elapsedRealtimeNanos();
        worker.execute(()->{
            try {
                Bitmap bitmap=decode(uri);
                runOnUiThread(()->{
                    if(destroyed)return;
                    shown=bitmap;preview.setImageBitmap(bitmap);
                    final long ocrStart=SystemClock.elapsedRealtimeNanos();
                    recognizer.process(InputImage.fromBitmap(bitmap,0)).addOnSuccessListener(text->{
                        long finished=SystemClock.elapsedRealtimeNanos();
                        ArrayList<String> lines=new ArrayList<>();for(Text.TextBlock block:text.getTextBlocks())for(Text.Line line:block.getLines())lines.add(line.getText());
                        List<String> candidates=PlateCandidates.fromLines(lines);
                        JSONObject record=new JSONObject();
                        try {record.put("filename",filename).put("timestamp_ms",System.currentTimeMillis()).put("status","analyzed").put("grade",JSONObject.NULL)
                            .put("plate_candidate",candidates.isEmpty()?JSONObject.NULL:candidates.get(0)).put("candidates",new JSONArray(candidates)).put("raw_ocr",text.getText())
                            .put("ocr_ms",(finished-ocrStart)/1e6).put("total_ms",(finished-totalStart)/1e6).put("width",bitmap.getWidth()).put("height",bitmap.getHeight())
                            .put("state",JSONObject.NULL).put("color",JSONObject.NULL).put("source",images.size()>1?"batch":"single");
                        }catch(JSONException ignored){}
                        complete(record);
                    }).addOnFailureListener(ex->failed(filename,totalStart,ex));
                });
            }catch(OutOfMemoryError ex){runOnUiThread(()->failed(filename,totalStart,new IOException("Insufficient memory; select a smaller image.")));}
            catch(Exception ex){runOnUiThread(()->failed(filename,totalStart,ex));}
        });
    }
    private Bitmap decode(Uri uri)throws IOException{
        BitmapFactory.Options options=new BitmapFactory.Options();options.inJustDecodeBounds=true;
        try(InputStream in=getContentResolver().openInputStream(uri)){BitmapFactory.decodeStream(in,null,options);}
        if(options.outWidth<=0||options.outHeight<=0)throw new IOException("Unsupported or unreadable image");
        if((long)options.outWidth*options.outHeight>16_000_000)throw new IOException("Image exceeds 16 megapixels. Use a smaller source image; this demo does not silently resize.");
        options.inJustDecodeBounds=false;options.inPreferredConfig=Bitmap.Config.ARGB_8888;
        Bitmap bitmap;try(InputStream in=getContentResolver().openInputStream(uri)){bitmap=BitmapFactory.decodeStream(in,null,options);}
        if(bitmap==null)throw new IOException("Cannot decode image");
        int orientation;try(InputStream in=getContentResolver().openInputStream(uri)){if(in==null)throw new IOException("Cannot read image");orientation=new ExifInterface(in).getAttributeInt(ExifInterface.TAG_ORIENTATION,1);}
        Matrix m=new Matrix();
        switch(orientation){case 2:m.setScale(-1,1);break;case 3:m.setRotate(180);break;case 4:m.setScale(1,-1);break;case 5:m.setRotate(90);m.postScale(-1,1);break;case 6:m.setRotate(90);break;case 7:m.setRotate(-90);m.postScale(-1,1);break;case 8:m.setRotate(-90);break;}
        if(!m.isIdentity()){Bitmap rotated=Bitmap.createBitmap(bitmap,0,0,bitmap.getWidth(),bitmap.getHeight(),m,true);if(rotated!=bitmap)bitmap.recycle();bitmap=rotated;}
        return bitmap;
    }
    private void failed(String filename,long start,Exception ex){
        JSONObject r=new JSONObject();try{r.put("filename",filename).put("status","error").put("error",ex.getMessage()).put("total_ms",(SystemClock.elapsedRealtimeNanos()-start)/1e6).put("timestamp_ms",System.currentTimeMillis()).put("source",images.size()>1?"batch":"single");}catch(JSONException ignored){}
        complete(r);
    }
    private void complete(JSONObject r){
        if(destroyed)return;busy=false;current=r;records.put(r);save();
        if(r.optString("status").equals("error")){output.setText("Analysis error: "+r.optString("error"));progress.setText("Paused — retry, skip, or cancel.");}
        else {
            String plate=r.isNull("plate_candidate")?"None found":r.optString("plate_candidate");
            output.setText("PLATE CANDIDATE   "+plate+"\nState / color: Not supported\n\nOCR: "+ms(r.optDouble("ocr_ms"))+"   Total: "+ms(r.optDouble("total_ms"))+"\n\nCandidates: "+r.optJSONArray("candidates")+"\nHeuristic suggestions; not verified plates.\n\nFull OCR text:\n"+r.optString("raw_ocr"));
            progress.setText("Image "+(index+1)+" of "+images.size()+" — waiting for grade"+(queueActive||images.size()==1?"":" (queue stopped)"));
        }refresh();
    }
    private void grade(String grade){if(busy||current==null||!current.optString("status").equals("analyzed")||!current.isNull("grade"))return;
        try{current.put("grade",grade);}catch(JSONException ignored){}save();progress.setText("Recorded: "+grade);refresh();if(queueActive)advance();}
    private void advance(){if(busy)return;index++;if(index<images.size()&&queueActive)analyze();else{queueActive=false;progress.setText("Queue complete / stopped — results saved.");refresh();}}
    private String ms(double value){return String.format(Locale.US,"%.1f ms",value);}
    private void refresh(){
        int count=0,p=0,f=0,c=0,ungraded=0,errors=0;double sum=0,min=Double.MAX_VALUE,max=0;
        for(int i=0;i<records.length();i++){JSONObject r=records.optJSONObject(i);if(!r.optString("status").equals("analyzed")){errors++;continue;}count++;double t=r.optDouble("total_ms",0);sum+=t;min=Math.min(min,t);max=Math.max(max,t);switch(r.optString("grade")){case "Pass":p++;break;case "Fail":f++;break;case "Close":c++;break;default:ungraded++;}}
        stats.setText("Analyzed "+count+"  •  Pass "+p+"  Fail "+f+"  Close "+c+"\nUngraded "+ungraded+"  •  Errors "+errors+"  •  API $0\nTotal avg / fastest / slowest: "+(count==0?"—":ms(sum/count)+" / "+ms(min)+" / "+ms(max)));
        boolean awaiting=current!=null&&current.optString("status").equals("analyzed")&&current.isNull("grade");
        choose.setEnabled(!busy&&!queueActive&&!awaiting);folder.setEnabled(choose.isEnabled());reset.setEnabled(!busy&&!queueActive);
        cancel.setEnabled(queueActive);pass.setEnabled(!busy&&awaiting);fail.setEnabled(pass.isEnabled());close.setEnabled(pass.isEnabled());
        retry.setEnabled(!busy&&current!=null&&current.optString("status").equals("error"));skip.setEnabled(retry.isEnabled()&&queueActive);
    }
    private void save(){getPreferences(0).edit().putString("records",records.toString()).apply();}
    private void errorDialog(String message){if(!destroyed)new AlertDialog.Builder(this).setMessage(message).setPositiveButton("OK",null).show();}
    private String csvCell(String value){return "\""+value.replace("\"","\"\"")+"\"";}
    private void exportMenu(){new AlertDialog.Builder(this).setTitle("Export saved results").setItems(new String[]{"JSON (all data)","CSV (spreadsheet)"},(d,which)->{
        if(which==0){JSONObject all=new JSONObject();try{all.put("engine","ML Kit bundled Latin 16.0.1").put("device",Build.MANUFACTURER+" "+Build.MODEL).put("android",Build.VERSION.RELEASE).put("api_cost_usd",0).put("records",records);exportPayload=all.toString(2);}catch(JSONException ex){return;}}
        else {String[] keys={"filename","status","grade","plate_candidate","ocr_ms","total_ms","width","height","source","raw_ocr","error"};StringBuilder csv=new StringBuilder(android.text.TextUtils.join(",",keys)+"\r\n");for(int i=0;i<records.length();i++){JSONObject r=records.optJSONObject(i);for(int k=0;k<keys.length;k++){if(k>0)csv.append(',');csv.append(csvCell(r.isNull(keys[k])?"":r.optString(keys[k])));}csv.append("\r\n");}exportPayload=csv.toString();}
        Intent save=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(which==0?"application/json":"text/csv").putExtra(Intent.EXTRA_TITLE,"mlkit-session-"+System.currentTimeMillis()+(which==0?".json":".csv"));startActivityForResult(save,EXPORT);
    }).show();}
    @Override protected void onDestroy(){destroyed=true;queueActive=false;recognizer.close();worker.shutdown();super.onDestroy();}
}
