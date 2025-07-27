package com.shadowaccord.characterbuilder;

import android.os.Bundle;
import android.webkit.WebView;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configure WebView for better mobile experience with padding
        configureWebViewPadding();
    }
    
    private void configureWebViewPadding() {
        // Run on UI thread to ensure WebView is available
        runOnUiThread(() -> {
            try {
                // Find the WebView by traversing the view hierarchy
                WebView webView = findWebView(findViewById(android.R.id.content));
                if (webView != null) {
                    // Get the current layout params
                    ViewGroup.LayoutParams layoutParams = webView.getLayoutParams();
                    
                    // Create a new LinearLayout to wrap the WebView with padding
                    LinearLayout wrapper = new LinearLayout(this);
                    wrapper.setOrientation(LinearLayout.VERTICAL);
                    
                    // Convert dp to pixels for consistent padding across devices
                    int paddingDp = 16; // 16dp padding
                    float density = getResources().getDisplayMetrics().density;
                    int paddingPx = (int) (paddingDp * density);
                    
                    // Set padding on the wrapper
                    wrapper.setPadding(paddingPx, paddingPx, paddingPx, paddingPx);
                    
                    // Remove WebView from its current parent
                    ViewGroup parent = (ViewGroup) webView.getParent();
                    if (parent != null) {
                        parent.removeView(webView);
                        
                        // Add wrapper to the parent
                        parent.addView(wrapper, layoutParams);
                        
                        // Add WebView to the wrapper with match_parent
                        LinearLayout.LayoutParams webViewParams = new LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.MATCH_PARENT,
                            LinearLayout.LayoutParams.MATCH_PARENT
                        );
                        wrapper.addView(webView, webViewParams);
                    }
                    
                    // Additional WebView configurations for better mobile experience
                    webView.getSettings().setUseWideViewPort(true);
                    webView.getSettings().setLoadWithOverviewMode(true);
                    webView.setInitialScale(1);
                    
                    // Ensure proper handling of system UI
                    webView.setFitsSystemWindows(true);
                }
            } catch (Exception e) {
                // Fallback: if WebView modification fails, just continue
                e.printStackTrace();
            }
        });
    }
    
    // Helper method to find WebView in the view hierarchy
    private WebView findWebView(View view) {
        if (view instanceof WebView) {
            return (WebView) view;
        }
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0; i < group.getChildCount(); i++) {
                WebView result = findWebView(group.getChildAt(i));
                if (result != null) {
                    return result;
                }
            }
        }
        return null;
    }
}
