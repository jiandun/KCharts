package com.kcharts;

import android.view.KeyEvent;

import com.facebook.react.ReactActivity;

public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "KCharts";
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        switch (keyCode) {
            case KeyEvent.KEYCODE_VOLUME_DOWN:
                getReactInstanceManager().showDevOptionsDialog();
                return true;
            default:
                break;
        }
        return super.onKeyDown(keyCode, event);
    }
}
