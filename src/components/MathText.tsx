import React from "react";
import { Text, TextStyle } from "react-native";

/**
 * Converts LaTeX math expressions to readable Unicode text.
 * Handles inline ($...$) and display ($$...$$) math blocks.
 */
function latexToReadable(latex: string): string {
  return latex
    // ── Fractions: \frac{a}{b} → a/b ──────────────────────────────────────
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)") // second pass for nested

    // ── Square root ────────────────────────────────────────────────────────
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\sqrt(\w)/g, "√$1")

    // ── Decorators ─────────────────────────────────────────────────────────
    .replace(/\\bar\{([^}]+)\}/g, "$1̄")
    .replace(/\\hat\{([^}]+)\}/g, "$1̂")
    .replace(/\\tilde\{([^}]+)\}/g, "$1̃")
    .replace(/\\overline\{([^}]+)\}/g, "$1̄")

    // ── Greek letters ──────────────────────────────────────────────────────
    .replace(/\\alpha/g, "α").replace(/\\Alpha/g, "Α")
    .replace(/\\beta/g, "β").replace(/\\Beta/g, "Β")
    .replace(/\\gamma/g, "γ").replace(/\\Gamma/g, "Γ")
    .replace(/\\delta/g, "δ").replace(/\\Delta/g, "Δ")
    .replace(/\\epsilon/g, "ε").replace(/\\varepsilon/g, "ε")
    .replace(/\\zeta/g, "ζ")
    .replace(/\\eta/g, "η")
    .replace(/\\theta/g, "θ").replace(/\\Theta/g, "Θ")
    .replace(/\\lambda/g, "λ").replace(/\\Lambda/g, "Λ")
    .replace(/\\mu/g, "μ")
    .replace(/\\nu/g, "ν")
    .replace(/\\xi/g, "ξ").replace(/\\Xi/g, "Ξ")
    .replace(/\\pi/g, "π").replace(/\\Pi/g, "Π")
    .replace(/\\rho/g, "ρ")
    .replace(/\\sigma/g, "σ").replace(/\\Sigma/g, "Σ")
    .replace(/\\tau/g, "τ")
    .replace(/\\phi/g, "φ").replace(/\\Phi/g, "Φ")
    .replace(/\\chi/g, "χ")
    .replace(/\\psi/g, "ψ").replace(/\\Psi/g, "Ψ")
    .replace(/\\omega/g, "ω").replace(/\\Omega/g, "Ω")

    // ── Operators & relations ──────────────────────────────────────────────
    .replace(/\\neq/g, "≠").replace(/\\ne/g, "≠")
    .replace(/\\leq/g, "≤").replace(/\\le/g, "≤")
    .replace(/\\geq/g, "≥").replace(/\\ge/g, "≥")
    .replace(/\\approx/g, "≈")
    .replace(/\\sim/g, "~")
    .replace(/\\pm/g, "±")
    .replace(/\\mp/g, "∓")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\cdot/g, "·")
    .replace(/\\infty/g, "∞")
    .replace(/\\in/g, "∈")
    .replace(/\\notin/g, "∉")
    .replace(/\\subset/g, "⊂")
    .replace(/\\cup/g, "∪")
    .replace(/\\cap/g, "∩")
    .replace(/\\rightarrow/g, "→").replace(/\\to/g, "→")
    .replace(/\\leftarrow/g, "←")
    .replace(/\\Rightarrow/g, "⇒")
    .replace(/\\forall/g, "∀")
    .replace(/\\exists/g, "∃")
    .replace(/\\partial/g, "∂")
    .replace(/\\nabla/g, "∇")
    .replace(/\\sum/g, "Σ")
    .replace(/\\prod/g, "Π")
    .replace(/\\int/g, "∫")

    // ── Superscripts ───────────────────────────────────────────────────────
    .replace(/\^\{2\}|(\s*)\^2/g, "²")
    .replace(/\^\{3\}|(\s*)\^3/g, "³")
    .replace(/\^\{n\}|(\s*)\^n/g, "ⁿ")
    .replace(/\^\{T\}/g, "ᵀ")
    .replace(/\^\{-1\}/g, "⁻¹")
    .replace(/\^\{([^}]+)\}/g, "^($1)")

    // ── Subscripts ─────────────────────────────────────────────────────────
    .replace(/_\{0\}|_0/g, "₀")
    .replace(/_\{1\}|_1/g, "₁")
    .replace(/_\{2\}|_2/g, "₂")
    .replace(/_\{3\}|_3/g, "₃")
    .replace(/_\{n\}|_n/g, "ₙ")
    .replace(/_\{i\}|_i/g, "ᵢ")
    .replace(/_\{x\}|_x/g, "ₓ")
    .replace(/_\{([^}]+)\}/g, "($1)")

    // ── Text commands ──────────────────────────────────────────────────────
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\mathrm\{([^}]+)\}/g, "$1")
    .replace(/\\mathbf\{([^}]+)\}/g, "$1")
    .replace(/\\textbf\{([^}]+)\}/g, "$1")

    // ── Cleanup ────────────────────────────────────────────────────────────
    .replace(/\{([^{}]+)\}/g, "$1") // remove remaining braces
    .replace(/[{}]/g, "")
    .replace(/\\\\/g, "")
    .replace(/\\/g, "")
    .trim();
}

/**
 * Splits text by $...$ and $$...$$ blocks and renders math segments
 * inline with a slightly different style so they stand out cleanly.
 */
export function MathText({
  text,
  style,
  mathStyle,
  isFinal,
}: {
  text: string;
  style?: TextStyle;
  mathStyle?: TextStyle;
  isFinal?: boolean;
}) {
  // Split on display math ($$) first, then inline ($)
  const segments = splitMath(text);

  return (
    <Text style={style}>
      {segments.map((seg, i) =>
        seg.isMath ? (
          <Text
            key={i}
            style={[
              {
                fontFamily: "monospace" as any,
                fontWeight: "600",
                color: isFinal ? "#1a7a45" : "#1E4D8C",
                backgroundColor: isFinal ? "#e8f7ef" : "#EEF4FF",
                borderRadius: 3,
                paddingHorizontal: 2,
              },
              mathStyle,
            ]}
          >
            {" "}{latexToReadable(seg.content)}{" "}
          </Text>
        ) : (
          <Text key={i}>{cleanMarkdown(seg.content)}</Text>
        )
      )}
    </Text>
  );
}

interface Segment {
  isMath: boolean;
  content: string;
}

function splitMath(text: string): Segment[] {
  const segments: Segment[] = [];
  // Match $$...$$ first, then $...$
  const pattern = /\$\$([^$]+)\$\$|\$([^$\n]+)\$/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ isMath: false, content: text.slice(lastIndex, match.index) });
    }
    segments.push({ isMath: true, content: match[1] ?? match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ isMath: false, content: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ isMath: false, content: text }];
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*Step \d+:\*\*/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")   // bold → plain
    .replace(/\*([^*]+)\*/g, "$1")        // italic → plain
    .replace(/^#+\s*/gm, "")              // headers
    .replace(/^\*\s/gm, "• ")            // bullet *
    .replace(/^-\s/gm, "• ");            // bullet -
}
