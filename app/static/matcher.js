(() => {
  const TRADE_TERMS = {
    plumbing: [
      "plumber", "plumbing", "leak", "leaking", "pipe", "clog", "clogged", "drain",
      "sewer", "toilet", "water heater", "hot water", "sump pump", "faucet",
      "garbage disposal", "slab leak", "water line",
    ],
    hvac: [
      "hvac", "ac", "a/c", "air conditioner", "air conditioning", "furnace", "heater",
      "heating", "no heat", "no ac", "thermostat", "heat pump", "mini split", "duct",
      "ductwork", "ac repair", "furnace repair",
    ],
  };

  const HIRE_CUES = [
    "looking for", "need a", "need an", "anyone know", "any one know", "recommend",
    "recommendation", "who do you use", "who should i call", "can someone", "please help",
    "asap", "emergency", "urgent", "available today", "available tomorrow", "come out",
    "service call",
  ];

  const COMPLAINT_CUES = [
    "terrible", "horrible", "worst", "scam", "ripoff", "rip off", "ripped off",
    "never hire", "never use", "avoid", "do not use", "don't use", "dont use",
    "complaint", "complaining", "sucks", "overcharged", "ruined", "messed up",
    "nightmare", "waste of money", "stay away", "beware", "unprofessional", "no show",
    "didn't show", "did not show",
  ];

  const JOB_CUES = [
    "we are hiring", "we're hiring", "now hiring", "job opening", "looking to hire",
    "hiring plumber", "hiring hvac", "apply now", "seeking technician", "join our team",
  ];

  const DIY_CUES = [
    "how do i", "how to fix", "diy", "youtube", "myself", "what tool", "can i replace",
  ];

  function normalize(text) {
    return String(text || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function findTerms(text, terms) {
    return terms.filter((term) => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`).test(text);
    });
  }

  function detectTrade(text) {
    const hits = [];
    const scores = { plumbing: 0, hvac: 0 };
    Object.entries(TRADE_TERMS).forEach(([trade, terms]) => {
      const found = findTerms(text, terms);
      hits.push(...found);
      scores[trade] += found.length;
    });
    if (!scores.plumbing && !scores.hvac) return { trade: null, keywords: [] };
    const trade = scores.plumbing >= scores.hvac ? "plumbing" : "hvac";
    return { trade, keywords: hits };
  }

  window.SpeedLeadMatcher = {
    classify(text) {
      const cleaned = normalize(text);
      const { trade, keywords } = detectTrade(cleaned);
      const hireHits = findTerms(cleaned, HIRE_CUES);
      const complaintHits = findTerms(cleaned, COMPLAINT_CUES);
      const jobHits = findTerms(cleaned, JOB_CUES);
      const diyHits = findTerms(cleaned, DIY_CUES);
      const reasons = [];
      if (keywords.length) reasons.push(`trade_terms:${keywords.slice(0, 6).join(",")}`);

      if (jobHits.length) {
        reasons.push(`job_cues:${jobHits.join(",")}`);
        return { intent: "job_posting", should_alert: false, confidence: 0.9, trade, matched_keywords: keywords, reasons };
      }
      if (diyHits.length && !hireHits.length) {
        reasons.push(`diy_cues:${diyHits.join(",")}`);
        return { intent: "diy_noise", should_alert: false, confidence: 0.75, trade, matched_keywords: keywords, reasons };
      }
      if (!trade) {
        reasons.push("no_trade_terms");
        return { intent: "unrelated", should_alert: false, confidence: 0.95, trade: null, matched_keywords: [], reasons };
      }
      if (complaintHits.length && !hireHits.length) {
        reasons.push(`complaint_cues:${complaintHits.join(",")}`);
        return { intent: "complaint", should_alert: false, confidence: 0.88, trade, matched_keywords: keywords, reasons };
      }
      if (complaintHits.length && hireHits.length) {
        reasons.push(`hire_cues:${hireHits.join(",")}`);
        reasons.push(`complaint_cues_secondary:${complaintHits.join(",")}`);
        return { intent: "hire_request", should_alert: true, confidence: 0.8, trade, matched_keywords: keywords, reasons };
      }
      if (hireHits.length) {
        reasons.push(`hire_cues:${hireHits.join(",")}`);
        return { intent: "hire_request", should_alert: true, confidence: 0.86, trade, matched_keywords: keywords, reasons };
      }
      reasons.push("trade_without_clear_intent");
      return { intent: "unrelated", should_alert: false, confidence: 0.55, trade, matched_keywords: keywords, reasons };
    },
  };
})();
