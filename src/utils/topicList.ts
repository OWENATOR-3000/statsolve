import type { Topic } from "@/types";

export const TOPICS: Topic[] = [
  {
    id: "descriptive-stats",
    title: "Descriptive Statistics",
    description: "Mean, median, mode, variance, standard deviation, skewness",
    icon: "bar-chart",
    color: "#3B82F6",
  },
  {
    id: "probability-theory",
    title: "Probability Theory",
    description: "Events, rules, conditional probability, Bayes' theorem",
    icon: "dice",
    color: "#8B5CF6",
  },
  {
    id: "discrete-distributions",
    title: "Discrete Distributions",
    description: "Binomial, Poisson, Geometric, Hypergeometric",
    icon: "stats-chart",
    color: "#06B6D4",
  },
  {
    id: "continuous-distributions",
    title: "Continuous Distributions",
    description: "Normal, Uniform, Exponential — PDF, CDF, percentiles",
    icon: "trending-up",
    color: "#10B981",
  },
  {
    id: "sampling-distributions",
    title: "Sampling Distributions",
    description: "Central Limit Theorem, standard error, sampling distributions",
    icon: "people",
    color: "#F59E0B",
  },
  {
    id: "point-estimation",
    title: "Point Estimation",
    description: "Estimators, unbiasedness, consistency, MLE basics",
    icon: "locate",
    color: "#EF4444",
  },
  {
    id: "confidence-intervals",
    title: "Confidence Intervals",
    description: "For mean, proportion, variance — construction and interpretation",
    icon: "remove-circle",
    color: "#6366F1",
  },
  {
    id: "hypothesis-testing",
    title: "Hypothesis Testing",
    description: "Null/alternative hypotheses, Type I & II errors, p-values",
    icon: "checkmark-circle",
    color: "#EC4899",
  },
  {
    id: "z-t-tests",
    title: "Z-test & T-test",
    description: "One-sample, two-sample, paired t-test",
    icon: "calculator",
    color: "#14B8A6",
  },
  {
    id: "chi-square-tests",
    title: "Chi-Square Tests",
    description: "Goodness of fit, independence, contingency tables",
    icon: "grid",
    color: "#F97316",
  },
  {
    id: "anova",
    title: "F-test & ANOVA",
    description: "One-way ANOVA, two-way ANOVA, F-distribution",
    icon: "layers",
    color: "#A855F7",
  },
  {
    id: "simple-regression",
    title: "Simple Linear Regression",
    description: "Least squares, R-squared, residuals, prediction",
    icon: "analytics",
    color: "#0EA5E9",
  },
  {
    id: "multiple-regression",
    title: "Multiple Regression",
    description: "Multiple predictors, adjusted R-squared, multicollinearity",
    icon: "git-branch",
    color: "#84CC16",
  },
  {
    id: "correlation",
    title: "Correlation Analysis",
    description: "Pearson correlation, Spearman rank, testing significance",
    icon: "swap-horizontal",
    color: "#F43F5E",
  },
  {
    id: "nonparametric-tests",
    title: "Non-parametric Tests",
    description: "Mann-Whitney, Wilcoxon, Kruskal-Wallis, Sign test",
    icon: "funnel",
    color: "#D97706",
  },
  {
    id: "time-series",
    title: "Time Series",
    description: "Components, moving averages, exponential smoothing",
    icon: "time",
    color: "#7C3AED",
  },
];

export const getTopicById = (id: string): Topic | undefined =>
  TOPICS.find((t) => t.id === id);
