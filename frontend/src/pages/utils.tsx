export interface SentimentResult {
  score: number;
  label: "positive" | "negative" | "neutral";
  confidence: number;
}

export const analyzeSentiment = (text: string): SentimentResult => {
  // Positive words
  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "wonderful",
    "fantastic",
    "awesome",
    "brilliant",
    "outstanding",
    "superb",
    "magnificent",
    "marvelous",
    "terrific",
    "fabulous",
    "incredible",
    "success",
    "achievement",
    "victory",
    "triumph",
    "win",
    "breakthrough",
    "progress",
    "improve",
    "better",
    "best",
    "perfect",
    "ideal",
    "optimal",
    "effective",
    "efficient",
    "love",
    "like",
    "enjoy",
    "appreciate",
    "admire",
    "respect",
    "praise",
    "celebrate",
    "happy",
    "joy",
    "delight",
    "pleasure",
    "satisfaction",
    "proud",
    "excited",
    "thrilled",
    "hope",
    "optimistic",
    "confident",
    "positive",
    "upbeat",
    "cheerful",
    "bright",
  ];

  // Negative words
  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "disgusting",
    "hate",
    "dislike",
    "despise",
    "failure",
    "disaster",
    "crisis",
    "problem",
    "issue",
    "trouble",
    "difficulty",
    "challenge",
    "wrong",
    "mistake",
    "error",
    "fault",
    "blame",
    "guilty",
    "shame",
    "embarrassing",
    "sad",
    "angry",
    "upset",
    "disappointed",
    "frustrated",
    "annoyed",
    "worried",
    "concerned",
    "fear",
    "afraid",
    "scared",
    "anxious",
    "nervous",
    "stress",
    "pressure",
    "burden",
    "decline",
    "decrease",
    "drop",
    "fall",
    "lose",
    "loss",
    "damage",
    "harm",
    "hurt",
    "corrupt",
    "scandal",
    "controversy",
    "conflict",
    "war",
    "violence",
    "crime",
    "illegal",
  ];

  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach((word) => {
    if (positiveWords.includes(word)) {
      positiveCount++;
    } else if (negativeWords.includes(word)) {
      negativeCount++;
    }
  });

  const totalSentimentWords = positiveCount + negativeCount;
  const score =
    totalSentimentWords > 0
      ? (positiveCount - negativeCount) / totalSentimentWords
      : 0;

  let label: "positive" | "negative" | "neutral";
  let confidence: number;

  if (score > 0.1) {
    label = "positive";
    confidence = Math.min(score * 100, 100);
  } else if (score < -0.1) {
    label = "negative";
    confidence = Math.min(Math.abs(score) * 100, 100);
  } else {
    label = "neutral";
    confidence = 100 - Math.abs(score) * 100;
  }

  return {
    score: Math.round(score * 100) / 100,
    label,
    confidence: Math.round(confidence),
  };
};
