package com.homebite.makrana;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int HB_NAVY = Color.rgb(1, 7, 45);

    @Override
    public void onCreate(Bundle savedInstanceState) {
        getWindow().setBackgroundDrawable(new ColorDrawable(HB_NAVY));
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(7,11,20));
        getWindow().setNavigationBarColor(Color.rgb(7,11,20));
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null) {
            webView.setBackgroundColor(HB_NAVY);
        }
    }
}
