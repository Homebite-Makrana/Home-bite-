package com.homebite.makrana;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ObjectAnimator;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ImageView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int HB_NAVY = Color.rgb(1, 7, 45);
    private static final int SPLASH_TIME = 2400;

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
        splash.setBackgroundColor(HB_NAVY);
        splash.setClickable(true);
        splash.setFocusable(true);

        ImageView logo = new ImageView(this);
        logo.setImageResource(com.homebite.makrana.R.drawable.home_bite_final_launch);
        logo.setScaleType(ImageView.ScaleType.FIT_CENTER);
        logo.setAdjustViewBounds(true);
        logo.setPadding(35, 35, 35, 35);

        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        );
        lp.gravity = Gravity.CENTER;

        splash.addView(logo, lp);

        parent.addView(
                splash,
                new ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                )
        );

        logo.setScaleX(0.72f);
        logo.setScaleY(0.72f);
        logo.setAlpha(0.35f);

        ObjectAnimator sx = ObjectAnimator.ofFloat(logo, View.SCALE_X, 0.72f, 1.0f);
        ObjectAnimator sy = ObjectAnimator.ofFloat(logo, View.SCALE_Y, 0.72f, 1.0f);
        ObjectAnimator alpha = ObjectAnimator.ofFloat(logo, View.ALPHA, 0.35f, 1.0f);

        sx.setDuration(900);
        sy.setDuration(900);
        alpha.setDuration(900);

        sx.start();
        sy.start();
        alpha.start();

        new Handler().postDelayed(() -> {
            ObjectAnimator fade =
                    ObjectAnimator.ofFloat(splash, View.ALPHA, 1f, 0f);
            fade.setDuration(300);

            fade.addListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    if (splash.getParent() != null) {
                        ((ViewGroup) splash.getParent()).removeView(splash);
                    }
                }
            });

            fade.start();
        }, SPLASH_TIME);
    }
}
