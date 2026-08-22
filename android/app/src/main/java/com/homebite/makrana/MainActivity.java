package com.homebite.makrana;

import android.animation.AnimatorSet;
import android.animation.ObjectAnimator;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.TextView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int HB_NAVY = Color.rgb(1, 7, 45);
    private static final int SPLASH_TIME = 2600;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        getWindow().setBackgroundDrawable(new ColorDrawable(HB_NAVY));
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(Color.rgb(7, 11, 20));
        getWindow().setNavigationBarColor(Color.rgb(7, 11, 20));

        WebView webView = getBridge() != null ? getBridge().getWebView() : null;

        if (webView != null) {
            webView.setBackgroundColor(HB_NAVY);
            showHomeBiteSplash(webView);
        } else {
            new Handler().postDelayed(() -> {
                WebView w = getBridge() != null ? getBridge().getWebView() : null;
                if (w != null) {
                    w.setBackgroundColor(HB_NAVY);
                    showHomeBiteSplash(w);
                }
            }, 100);
        }
    }

    private void showHomeBiteSplash(WebView webView) {
        ViewGroup parent = (ViewGroup) webView.getParent();
        if (parent == null) return;

        FrameLayout splash = new FrameLayout(this);
        splash.setBackgroundColor(Color.BLACK);
        splash.setClickable(true);
        splash.setFocusable(true);

        TextView home = splashText("HOME");
        TextView bite = splashText("BITE");

        FrameLayout.LayoutParams hp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        hp.gravity = Gravity.CENTER;
        hp.setMargins(0, -115, 0, 0);

        FrameLayout.LayoutParams bp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        bp.gravity = Gravity.CENTER;
        bp.setMargins(0, 115, 0, 0);

        splash.addView(home, hp);
        splash.addView(bite, bp);

        parent.addView(splash, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        home.setTranslationY(-500f);
        bite.setTranslationY(500f);
        home.setScaleX(0.72f);
        home.setScaleY(0.72f);
        bite.setScaleX(0.72f);
        bite.setScaleY(0.72f);
        splash.setAlpha(1f);

        ObjectAnimator homeMove = ObjectAnimator.ofFloat(home, View.TRANSLATION_Y, -500f, 0f);
        ObjectAnimator biteMove = ObjectAnimator.ofFloat(bite, View.TRANSLATION_Y, 500f, 0f);

        ObjectAnimator homeScaleX = ObjectAnimator.ofFloat(home, View.SCALE_X, 0.72f, 1f);
        ObjectAnimator homeScaleY = ObjectAnimator.ofFloat(home, View.SCALE_Y, 0.72f, 1f);
        ObjectAnimator biteScaleX = ObjectAnimator.ofFloat(bite, View.SCALE_X, 0.72f, 1f);
        ObjectAnimator biteScaleY = ObjectAnimator.ofFloat(bite, View.SCALE_Y, 0.72f, 1f);

        AnimatorSet enter = new AnimatorSet();
        enter.playTogether(
                homeMove, biteMove,
                homeScaleX, homeScaleY,
                biteScaleX, biteScaleY
        );
        enter.setDuration(1200);
        enter.setStartDelay(150);
        enter.start();

        new Handler().postDelayed(() -> {
            ObjectAnimator fade = ObjectAnimator.ofFloat(splash, View.ALPHA, 1f, 0f);
            fade.setDuration(450);
            fade.addListener(new android.animation.AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(android.animation.Animator animation) {
                    if (splash.getParent() != null) {
                        ((ViewGroup) splash.getParent()).removeView(splash);
                    }
                }
            });
            fade.start();
        }, SPLASH_TIME);
    }

    private TextView splashText(String text) {
        TextView v = new TextView(this);
        v.setText(text);
        v.setTextColor(Color.WHITE);
        v.setTextSize(46);
        v.setGravity(Gravity.CENTER);
        v.setTypeface(Typeface.create("sans-serif-black", Typeface.BOLD));
        v.setLetterSpacing(0.08f);
        return v;
    }
}
