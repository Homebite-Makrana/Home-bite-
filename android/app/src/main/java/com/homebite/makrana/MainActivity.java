package com.homebite.makrana;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;

import com.getcapacitor.BridgeActivity;
import androidx.core.splashscreen.SplashScreen;

public class MainActivity extends BridgeActivity {

    private static final int HB_NAVY = Color.rgb(7, 11, 20);
    private final Handler handler = new Handler();
    private FrameLayout launchOverlay;

    @Override
    public void onCreate(Bundle savedInstanceState) {

        // Android 12+ system splash.
        // Its icon is transparent so the old small logo cannot appear.
        SplashScreen.installSplashScreen(this);

        getWindow().setBackgroundDrawable(new ColorDrawable(HB_NAVY));

        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(HB_NAVY);
        getWindow().setNavigationBarColor(HB_NAVY);

        showLargeHomeBiteLaunch();

        // Safety fallback: never leave the user stuck on launch.
        handler.postDelayed(this::hideLargeHomeBiteLaunch, 1800);
    }

    private void showLargeHomeBiteLaunch() {
        ViewGroup root = findViewById(android.R.id.content);
        if (root == null) return;

        launchOverlay = new FrameLayout(this);
        launchOverlay.setBackgroundColor(HB_NAVY);

        ImageView logo = new ImageView(this);
        logo.setImageResource(com.homebite.makrana.R.drawable.home_bite_v49_splash);
        logo.setScaleType(ImageView.ScaleType.CENTER_INSIDE);

        int size = (int) (260 * getResources().getDisplayMetrics().density);

        FrameLayout.LayoutParams lp =
                new FrameLayout.LayoutParams(size, size);
        lp.gravity = Gravity.CENTER;

        launchOverlay.addView(logo, lp);

        root.addView(
                launchOverlay,
                new ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                )
        );
    }

    private void hideLargeHomeBiteLaunch() {
        if (launchOverlay != null) {
            ViewGroup parent = (ViewGroup) launchOverlay.getParent();
            if (parent != null) {
                parent.removeView(launchOverlay);
            }
            launchOverlay = null;
        }
    }
}
