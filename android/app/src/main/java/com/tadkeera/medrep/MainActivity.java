package com.tadkeera.medrep;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.util.Base64;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.ItemTouchHelper;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.TimeZone;
/* loaded from: classes.dex */
public class MainActivity extends AppCompatActivity {
    private static final String DOCTOR_ANALYSIS_MOCK = "{\n  \"analysis\": \"### 📈 تحليل تردد الزيارات للطبيب: د. أحمد سليمان\\n* **إجمالي الزيارات المسجلة**: 8 زيارات.\\n* **معدل التباعد الزمني**: متوسط 12 يوماً بين كل زيارة، وهو ما يطابق النطاق الآمن لزيارات الفئة (أ).\\n* **تسلسل توزيع العينات**: تم تفريغ (باندول إكسترا) و(أتور) بنجاح وفق قاعدة FIFO للمخزون الأقدم.\\n\\n#### 💡 توصيات الذكاء الاصطناعي لرفع الإنتاجية:\\n1. **ثبات المتابعة**: حافظ على وتيرة الزيارات الحالية لتجنب هبوط الفئة المعيارية.\\n2. **بروتوكول التفصيل الطبي**: ركز في الزيارة القادمة على شرح دراسات تماثل الإذابة الحيوية لباندول إكسترا لدعم اتخاذ القرار الطبي.\\n3. **تلافي الخروج الجغرافي**: تم رصد تباعد بسيط بنسبة 20% في إحداثيات الزيارة السابقة، ننصح ببدء نظام التحقق (Check-in) مباشرةً في عيادة الطبيب قبل الدخول لتجنب إنذار الـ Geofencing.\",\n  \"success\": true,\n  \"source\": \"simulated\"\n}";
    private static final int FILE_CHOOSER_REQUEST_CODE = 1002;
    private static final int PERMISSION_REQUEST_CODE = 1001;
    private static final String PLAN_GENERATOR_MOCK = "{\n  \"plan\": \"### 🗺️ خطة سير ذكية مقترحة (خوارزمية الذكاء الاصطناعي لحساب الجغرافيا)\\n1. **النوبة الصباحية - مجمع الملك فهد ومستشفى الحبيب (المنطقة الشمالية)**:\\n   - زيارة **د. أحمد سليمان** (الفئة أ - فحص القلب) لتقليل وقت الترانزيت.\\n   - زيارة **د. خالد الحربي** (الفئة ب - العظام).\\n   - *الهدف*: تغطية مستشفيات قريبة جغرافياً لتقليص مسافات الانتقال بنسبة 40%.\\n\\n2. **النوبة المسائية - مستشفى دلة ومجمع التخصصي (المنطقة الوسطى)**:\\n   - زيارة **د. سارة مراد** (الفئة أ - جلدية) - *تنبيه إهمال*: لم تُزر منذ 14 يوماً!\\n   - زيارة **د. ياسر العتيبي** (الفئة ب - أطفال).\\n\\n3. **ملاحظات توجيهية هامة**:\\n   - ⚠️ **تنبيه إهمال فئة أ**: الطبيبة ريما القحطاني أهملت زيارتها لأكثر من 15 يوماً، تم التوصية بضمها ليوم الأحد نوبة صباحية كأولوية قصوى.\\n   - 🚗 عزل المسارات: تم تجميع الأطباء بناءً على نسبة التقارب الجغرافي (Clustering) لخفض التكلفة الزائدة للرحلة وتفادي الاختناقات المروية.\",\n  \"success\": true,\n  \"source\": \"simulated\"\n}";
    private ValueCallback<Uri[]> mFilePathCallback;
    private WebView webView;

    private void createAppStorageFolders() {
        try {
            File file = new File(Environment.getExternalStorageDirectory(), "Med Rep SFA Pro");
            file.mkdirs();
            new File(file, "BACKUP").mkdirs();
            new File(file, "DOWNLOAD").mkdirs();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /* JADX INFO: Access modifiers changed from: protected */
    @Override // androidx.fragment.app.FragmentActivity, androidx.activity.ComponentActivity, androidx.core.app.ComponentActivity, android.app.Activity
    public void onCreate(Bundle bundle) {
        super.onCreate(bundle);
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Aden"));
        setContentView(R.layout.activity_main);
        this.webView = (WebView) findViewById(R.id.webview);
        requestAppPermissions();
        requestFullStorageAccess();
        createAppStorageFolders();
        setupWebView();
        this.webView.loadUrl("file:///android_asset/www/index.html");
    }

    private void requestAppPermissions() {
        String[] strArr = {"android.permission.ACCESS_FINE_LOCATION", "android.permission.ACCESS_COARSE_LOCATION", "android.permission.WRITE_EXTERNAL_STORAGE", "android.permission.READ_EXTERNAL_STORAGE"};
        for (int i = 0; i < 4; i++) {
            if (ContextCompat.checkSelfPermission(this, strArr[i]) != 0) {
                ActivityCompat.requestPermissions(this, strArr, 1001);
                return;
            }
        }
    }

    private void requestFullStorageAccess() {
        if (Build.VERSION.SDK_INT < 30 || Environment.isExternalStorageManager()) {
            return;
        }
        try {
            Intent intent = new Intent("android.settings.MANAGE_APP_ALL_FILES_ACCESS_PERMISSION");
            intent.setData(Uri.parse("package:" + getPackageName()));
            startActivity(intent);
            Toast.makeText(this, "Please grant 'All files access' permission in Settings for full local storage access (to import database backup files and downloads).", 1).show();
        } catch (Exception unused) {
            startActivity(new Intent("android.settings.MANAGE_ALL_FILES_ACCESS_PERMISSION"));
            Toast.makeText(this, "Enable full storage access in device Settings for downloading backup files and PDFs to local storage.", 1).show();
        }
    }

    @Override // androidx.fragment.app.FragmentActivity, androidx.activity.ComponentActivity, android.app.Activity
    public void onRequestPermissionsResult(int i, String[] strArr, int[] iArr) {
        super.onRequestPermissionsResult(i, strArr, iArr);
        if (i == 1001) {
            for (int i2 : iArr) {
                if (i2 != 0) {
                    Toast.makeText(this, "Some permissions denied. Limited storage/GPS features. Grant permissions in Settings for database file import and PDF downloads.", 1).show();
                    return;
                }
            }
            Toast.makeText(this, "Permissions granted. GPS, Location and Storage access enabled for full functionality (including file import and downloads).", 0).show();
            requestFullStorageAccess();
        }
    }

    private void setupWebView() {
        WebSettings settings = this.webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMixedContentMode(0);
        settings.setLoadsImagesAutomatically(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setTextZoom(100);
        if (Build.VERSION.SDK_INT >= 26) {
            settings.setSafeBrowsingEnabled(false);
        }
        this.webView.setWebViewClient(new CustomWebViewClient());
        this.webView.setWebChromeClient(new CustomWebChromeClient());
        this.webView.addJavascriptInterface(new WebAppInterface(this), "AndroidBridge");
        this.webView.setLayerType(2, null);
    }

    /* loaded from: classes.dex */
    public class WebAppInterface {
        private final Activity activity;

        WebAppInterface(Activity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public void downloadBase64File(final String str, final String str2, String str3) {
            this.activity.runOnUiThread(new Runnable() { // from class: com.tadkeera.medrep.MainActivity.WebAppInterface.1
                @Override // java.lang.Runnable
                public void run() {
                    try {
                        byte[] decode = Base64.decode(str2, 0);
                        File file = new File(Environment.getExternalStorageDirectory(), "Med Rep SFA Pro");
                        file.mkdirs();
                        String str4 = str;
                        String str5 = str4.toLowerCase().endsWith(".json") ? "BACKUP" : "DOWNLOAD";
                        File file2 = new File(file, str5);
                        file2.mkdirs();
                        File file3 = new File(file2, str4);
                        FileOutputStream fileOutputStream = new FileOutputStream(file3);
                        fileOutputStream.write(decode);
                        fileOutputStream.close();
                        MediaScannerConnection.scanFile(WebAppInterface.this.activity, new String[]{file3.getAbsolutePath()}, null, null);
                        Toast.makeText(WebAppInterface.this.activity, "Saved to /Med Rep SFA Pro/" + str5 + "/" + str4, 1).show();
                    } catch (Exception e) {
                        e.printStackTrace();
                        Toast.makeText(WebAppInterface.this.activity, "Save failed: " + e.getMessage() + "\nGrant storage / All files access permission.", 1).show();
                    }
                }
            });
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    /* loaded from: classes.dex */
    public class CustomWebViewClient extends WebViewClient {
        @Override // android.webkit.WebViewClient
        public boolean shouldOverrideUrlLoading(WebView webView, WebResourceRequest webResourceRequest) {
            return false;
        }

        private CustomWebViewClient() {
        }

        @Override // android.webkit.WebViewClient
        public WebResourceResponse shouldInterceptRequest(WebView webView, WebResourceRequest webResourceRequest) {
            String uri = webResourceRequest.getUrl().toString();
            if (uri.contains("/api/ai/plan-generator")) {
                return createJsonResponse(MainActivity.PLAN_GENERATOR_MOCK);
            }
            if (uri.contains("/api/ai/doctor-analysis")) {
                return createJsonResponse(MainActivity.DOCTOR_ANALYSIS_MOCK);
            }
            if (uri.contains("/api/health")) {
                return createJsonResponse("{\"status\":\"ok\",\"serverTime\":\"" + Instant.now().toString() + "\"}");
            }
            return super.shouldInterceptRequest(webView, webResourceRequest);
        }

        private WebResourceResponse createJsonResponse(String str) {
            try {
                ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(str.getBytes(StandardCharsets.UTF_8));
                HashMap hashMap = new HashMap();
                hashMap.put("Content-Type", "application/json; charset=utf-8");
                hashMap.put("Access-Control-Allow-Origin", "*");
                return new WebResourceResponse("application/json", "UTF-8", ItemTouchHelper.Callback.DEFAULT_DRAG_ANIMATION_DURATION, "OK", hashMap, byteArrayInputStream);
            } catch (Exception e) {
                e.printStackTrace();
                return null;
            }
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    /* loaded from: classes.dex */
    public class CustomWebChromeClient extends WebChromeClient {
        private CustomWebChromeClient() {
        }

        @Override // android.webkit.WebChromeClient
        public void onGeolocationPermissionsShowPrompt(String str, GeolocationPermissions.Callback callback) {
            callback.invoke(str, true, false);
        }

        @Override // android.webkit.WebChromeClient
        public void onProgressChanged(WebView webView, int i) {
            super.onProgressChanged(webView, i);
        }

        @Override // android.webkit.WebChromeClient
        public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> valueCallback, WebChromeClient.FileChooserParams fileChooserParams) {
            if (MainActivity.this.mFilePathCallback != null) {
                MainActivity.this.mFilePathCallback.onReceiveValue(null);
                MainActivity.this.mFilePathCallback = null;
            }
            MainActivity.this.mFilePathCallback = valueCallback;
            Intent intent = new Intent("android.intent.action.GET_CONTENT");
            intent.addCategory("android.intent.category.OPENABLE");
            intent.setType("*/*");
            intent.putExtra("android.intent.extra.LOCAL_ONLY", true);
            if (ContextCompat.checkSelfPermission(MainActivity.this, "android.permission.READ_EXTERNAL_STORAGE") != 0) {
                ActivityCompat.requestPermissions(MainActivity.this, new String[]{"android.permission.READ_EXTERNAL_STORAGE", "android.permission.WRITE_EXTERNAL_STORAGE"}, 1001);
            }
            try {
                MainActivity.this.startActivityForResult(Intent.createChooser(intent, "اختر ملف قاعدة بيانات Med Rep (.json) / Select Database Backup File"), 1002);
                return true;
            } catch (ActivityNotFoundException unused) {
                Toast.makeText(MainActivity.this, "No file manager found. Please install a file browser to import database files from storage.", 1).show();
                MainActivity.this.mFilePathCallback.onReceiveValue(null);
                MainActivity.this.mFilePathCallback = null;
                return false;
            }
        }
    }

    /* JADX INFO: Access modifiers changed from: protected */
    @Override // androidx.fragment.app.FragmentActivity, androidx.activity.ComponentActivity, android.app.Activity
    public void onActivityResult(int i, int i2, Intent intent) {
        Uri[] uriArr;
        super.onActivityResult(i, i2, intent);
        if (i != 1002 || this.mFilePathCallback == null) {
            return;
        }
        if (i2 == -1 && intent != null) {
            String dataString = intent.getDataString();
            if (dataString != null) {
                uriArr = new Uri[]{Uri.parse(dataString)};
            } else if (intent.getClipData() != null && intent.getClipData().getItemCount() > 0) {
                int itemCount = intent.getClipData().getItemCount();
                Uri[] uriArr2 = new Uri[itemCount];
                for (int i3 = 0; i3 < itemCount; i3++) {
                    uriArr2[i3] = intent.getClipData().getItemAt(i3).getUri();
                }
                uriArr = uriArr2;
            }
            this.mFilePathCallback.onReceiveValue(uriArr);
            this.mFilePathCallback = null;
        }
        uriArr = null;
        this.mFilePathCallback.onReceiveValue(uriArr);
        this.mFilePathCallback = null;
    }

    @Override // androidx.activity.ComponentActivity, android.app.Activity
    public void onBackPressed() {
        if (this.webView.canGoBack()) {
            this.webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    /* JADX INFO: Access modifiers changed from: protected */
    @Override // androidx.appcompat.app.AppCompatActivity, androidx.fragment.app.FragmentActivity, android.app.Activity
    public void onDestroy() {
        WebView webView = this.webView;
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
