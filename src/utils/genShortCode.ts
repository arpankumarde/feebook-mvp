import ShortUniqueId from "short-unique-id";

const genShortCode = (text: string, length?: number) => {
  const words = text.split(" ").filter((word) => word.length > 0);
  let initials;

  if (words.length === 0) {
    initials = "X0"; // Default if no valid words provided
  } else if (words.length === 1) {
    // If only one word, take first two characters or pad with X
    initials = (words[0].charAt(0) + (words[0].charAt(1) || "X")).toUpperCase();
  } else {
    // Take first character of first word and first character of last word
    initials = (
      words[0].charAt(0) + words[words.length - 1].charAt(0)
    ).toUpperCase();
  }

  const uid = new ShortUniqueId({
    length: length ? length - 2 : 4,
    dictionary: "alphanum_upper",
  });

  return initials + uid.rnd();
};

export default genShortCode;
