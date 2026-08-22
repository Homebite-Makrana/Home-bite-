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
import android.widget.FrameLayout;
import android.widget.ImageView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int HB_NAVY = Color.rgb(2, 7, 45);
    private static final int SPLASH_TIME = 2200;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        getWindow().setBackgroundDrawable(new ColorDrawable(HB_NAVY));
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(Color.rgb(7, 11, 20));
        getWindow().setNavigationBarColor(Color.rgb(7, 11, 20));

        ImageView logo = new ImageView(this);
        logo.setImageResource(com.homebite.makrana.R.drawable.home_bite_final_launch);
        logo.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        logo.setBackgroundColor(HB_NAVY);

        FrameLayout splash = new FrameLayout(this);
        splash.setBackgroundColor(HB_NAVY);
        splash.setClickable(true);
        splash.setFocusable(true);

        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        );
        lp.gravity = Gravity.CENTER;

        splash.addView(logo, lp);

        ViewGroup root = (ViewGroup) getBridge().getWebView().getParent();
        root.addView(splash, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        logo.setScaleX(0.55f);
        logo.setScaleY(0.55f);

        ObjectAnimator sx = ObjectAnimator.ofFloat(logo, View.SCALE_X, 0.55f, 1.0f);
        ObjectAnimator sy = ObjectAnimator.ofFloat(logo, View.SCALE_Y, 0.55f, 1.0f);

        sx.setDuration(1400);
        sy.setDuration(1400);

        sx.setStartDelay(150);
        sy.setStartDelay(150);

        sx.start();
        sy.start();

        new Handler().postDelayed(() -> {
            ObjectAnimator fade = ObjectAnimator.ofFloat(
                    splash, View.ALPHA, 1f, 0f
            );
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
