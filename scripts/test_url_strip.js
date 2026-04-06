function stripUrls(text) {
  if (!text) return "";
  
  // 1. Aggressively remove anything that looks like a URL starting with http, https, or www
  let cleaned = text
    .replace(/\(?(https?:\/\/[^\s\)]+)\)?/gi, "")
    .replace(/\(?(www\.[^\s\)]+)\)?/gi, "")
    .replace(/https?:\/\/[^\s]+|www\.[^\s]+/gi, "");

  // 2. Remove specific encoded URL noise (%28 and %29 usually surround URLs in markdown)
  cleaned = cleaned.replace(/%28/g, "").replace(/%29/g, "");

  // 3. Strip common file extensions that might be left over in the filename/id
  cleaned = cleaned.replace(/\.(pdf|md|docx?|txt|csv|xlsx?)(\b|$)/gi, "");

  // 4. Final cleanup: Remove dangling parentheses or brackets that were surrounding the URL
  cleaned = cleaned.replace(/[\(\)\[\]]/g, " ").replace(/\s+/g, " ").trim();

  return cleaned;
}

const testStrings = [
  "West Bengal Electricity Regulatory Commission(https://github.com/smartlinemanapp/GridMind/blob/main/Standards%20of%20Performance%20%28First%20Amendment%29%20Regulations%2C%202013%20%28Principal%20Regulation%29.pdf)",
  "No. 46/WBERC(https://github.com/smartlinemanapp/GridMind/blob/main/Standards%20of%20Performance%20%28First%20Amendment%29%20Regulations%2C%202013%20%28Principal%20Regulation%29.pdf)",
  "Electricity_Rules.pdf",
  "https://www.example.com",
  "[Official Site](https://google.com)"
];

console.log("--- Testing stripUrls ---");
testStrings.forEach(s => {
  console.log(`Original: ${s}`);
  console.log(`Cleaned : ${stripUrls(s)}`);
  console.log('---');
});
