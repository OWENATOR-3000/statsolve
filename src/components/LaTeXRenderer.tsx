import React from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

interface Props {
  latex:  string;
  fontSize?: number;
  color?: string;
}

/**
 * Renders a LaTeX expression using MathJax in a WebView.
 * Use this for complex formulas that need proper typesetting.
 * For simple inline math in solution steps, plain text is sufficient
 * and faster — only use this component for dedicated formula display.
 */
export function LaTeXRenderer({ latex, fontSize = 16, color = "#1E4D8C" }: Props) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <script>
        MathJax = {
          tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']] },
          svg: { fontCache: 'global' },
          startup: {
            ready() {
              MathJax.startup.defaultReady();
              MathJax.startup.promise.then(() => {
                document.body.style.height = document.body.scrollHeight + 'px';
                window.ReactNativeWebView.postMessage(document.body.scrollHeight);
              });
            }
          }
        };
      </script>
      <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
      <style>
        body {
          margin: 0; padding: 8px;
          font-size: ${fontSize}px;
          color: ${color};
          font-family: -apple-system, sans-serif;
          background: transparent;
        }
      </style>
    </head>
    <body>$$${latex}$$</body>
    </html>
  `;

  return (
    <View style={{ minHeight: 60 }}>
      <WebView
        source={{ html }}
        scrollEnabled={false}
        style={{ backgroundColor: "transparent" }}
        showsVerticalScrollIndicator={false}
        originWhitelist={["*"]}
      />
    </View>
  );
}
