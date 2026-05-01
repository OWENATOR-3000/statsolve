import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// NOTE: These calculations run 100% locally — no API call, instant results.
// All formulas use jStat-equivalent math implemented directly here
// to keep the mobile bundle lean (jStat is server-side only).

function normalCDF(z: number): number {
  // Abramowitz & Stegun approximation — accurate to 7 decimal places
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return 0.5 * (1 + sign * (1 - poly * Math.exp(-x * x)));
}

function zCritical(alpha: number, twoTailed: boolean): number {
  // Rational approximation for normal quantile
  const p = twoTailed ? 1 - alpha / 2 : 1 - alpha;
  const a = [2.515517, 0.802853, 0.010328];
  const b = [1.432788, 0.189269, 0.001308];
  const t_ = Math.sqrt(-2 * Math.log(1 - p));
  const num = a[0] + a[1] * t_ + a[2] * t_ * t_;
  const den = 1 + b[0] * t_ + b[1] * t_ * t_ + b[2] * t_ * t_ * t_;
  return t_ - num / den;
}

type Tool = "zscore" | "ci_mean" | "pvalue_z" | "pvalue_t";

export function CalculatorScreen() {
  const [activeTool, setActiveTool] = useState<Tool>("zscore");

  // Z-score inputs
  const [x, setX]       = useState("");
  const [mu, setMu]     = useState("");
  const [sigma, setSigma] = useState("");
  const [n, setN]       = useState("1");

  // CI inputs
  const [mean, setMean] = useState("");
  const [sd, setSd]     = useState("");
  const [ciN, setCiN]   = useState("");
  const [alpha, setAlpha] = useState("0.05");

  // p-value input
  const [testStat, setTestStat] = useState("");
  const [twoTailed, setTwoTailed] = useState(true);

  const [result, setResult] = useState<string | null>(null);

  function calculate() {
    try {
      if (activeTool === "zscore") {
        const z = (parseFloat(x) - parseFloat(mu)) / (parseFloat(sigma) / Math.sqrt(parseFloat(n)));
        const p = 2 * (1 - normalCDF(Math.abs(z)));
        setResult(`Z-score: ${z.toFixed(4)}\nP(Z ≤ z): ${normalCDF(z).toFixed(4)}\nTwo-tailed p-value: ${p.toFixed(4)}`);
      }

      if (activeTool === "ci_mean") {
        const a = parseFloat(alpha);
        const zc = zCritical(a, true);
        const se = parseFloat(sd) / Math.sqrt(parseFloat(ciN));
        const margin = zc * se;
        const lower = parseFloat(mean) - margin;
        const upper = parseFloat(mean) + margin;
        setResult(
          `${(1 - a) * 100}% Confidence Interval:\n(${lower.toFixed(4)}, ${upper.toFixed(4)})\n\nMargin of Error: ±${margin.toFixed(4)}\nCritical Z: ${zc.toFixed(4)}\nStd Error: ${se.toFixed(4)}`
        );
      }

      if (activeTool === "pvalue_z") {
        const z = parseFloat(testStat);
        const p = twoTailed ? 2 * (1 - normalCDF(Math.abs(z))) : 1 - normalCDF(z);
        setResult(`Z-statistic: ${z}\nP-value (${twoTailed ? "two-tailed" : "one-tailed"}): ${p.toFixed(6)}`);
      }
    } catch {
      setResult("Please check your inputs — all fields must be valid numbers.");
    }
  }

  const tools: { id: Tool; label: string }[] = [
    { id: "zscore",   label: "Z-Score" },
    { id: "ci_mean",  label: "Conf. Interval" },
    { id: "pvalue_z", label: "P-Value (Z)" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
        <Text className="text-xl font-bold text-primary mt-4 mb-4">Calculator</Text>

        {/* Tool selector */}
        <View className="flex-row gap-x-2 mb-5">
          {tools.map((t) => (
            <TouchableOpacity
              key={t.id}
              className={`flex-1 py-2 rounded-xl items-center border ${activeTool === t.id ? "bg-primary border-primary" : "bg-white border-gray-200"}`}
              onPress={() => { setActiveTool(t.id); setResult(null); }}
            >
              <Text className={`text-xs font-bold ${activeTool === t.id ? "text-white" : "text-gray-600"}`}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inputs */}
        <View className="bg-white rounded-2xl p-5 mb-4 gap-y-3">
          {activeTool === "zscore" && (
            <>
              {[["Value (x)", x, setX], ["Population Mean (μ)", mu, setMu], ["Std Deviation (σ)", sigma, setSigma], ["Sample size (n)", n, setN]].map(([label, val, setter]) => (
                <View key={label as string}>
                  <Text className="text-xs font-semibold text-gray-600 mb-1">{label as string}</Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-2 text-base"
                    value={val as string}
                    onChangeText={setter as any}
                    keyboardType="decimal-pad"
                    placeholder="0"
                  />
                </View>
              ))}
            </>
          )}

          {activeTool === "ci_mean" && (
            <>
              {[["Sample Mean (x̄)", mean, setMean], ["Std Deviation (s)", sd, setSd], ["Sample Size (n)", ciN, setCiN], ["Significance (α)", alpha, setAlpha]].map(([label, val, setter]) => (
                <View key={label as string}>
                  <Text className="text-xs font-semibold text-gray-600 mb-1">{label as string}</Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-2 text-base"
                    value={val as string}
                    onChangeText={setter as any}
                    keyboardType="decimal-pad"
                    placeholder="0"
                  />
                </View>
              ))}
            </>
          )}

          {activeTool === "pvalue_z" && (
            <>
              <View>
                <Text className="text-xs font-semibold text-gray-600 mb-1">Z-statistic</Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-2 text-base"
                  value={testStat}
                  onChangeText={setTestStat}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 1.96"
                />
              </View>
              <TouchableOpacity
                className={`flex-row items-center gap-x-3 border rounded-xl px-4 py-3 ${twoTailed ? "border-primary bg-primary/5" : "border-gray-200"}`}
                onPress={() => setTwoTailed(!twoTailed)}
              >
                <View className={`w-5 h-5 rounded border-2 items-center justify-center ${twoTailed ? "bg-primary border-primary" : "border-gray-400"}`}>
                  {twoTailed && <Text className="text-white text-xs font-bold">✓</Text>}
                </View>
                <Text className="text-gray-700 font-medium">Two-tailed test</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mb-5"
          onPress={calculate}
        >
          <Text className="text-white font-bold text-base">Calculate</Text>
        </TouchableOpacity>

        {result && (
          <View className="bg-white rounded-2xl p-5 mb-6 border-l-4 border-accent">
            <Text className="text-xs font-bold text-accent mb-2 uppercase tracking-wide">Result</Text>
            <Text className="text-gray-800 text-sm leading-6 font-mono">{result}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
