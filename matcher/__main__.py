#!/usr/bin/env python3
"""CLI: classify a post for hire-intent vs complaint."""

from __future__ import annotations

import argparse
import json
import sys

from matcher import classify_post, ensure_classifier


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Classify HVAC/plumbing Facebook-style posts (hire vs complaint)."
    )
    parser.add_argument("text", nargs="?", help="Post text to classify")
    parser.add_argument("--file", "-f", help="Read post text from a file")
    parser.add_argument("--json", action="store_true", help="Print JSON result")
    parser.add_argument(
        "--no-textrazor",
        action="store_true",
        help="Force heuristic-only mode (skip TextRazor)",
    )
    parser.add_argument(
        "--sync-classifier",
        action="store_true",
        help="Upload custom TextRazor classifier, then exit",
    )
    args = parser.parse_args(argv)

    if args.sync_classifier:
        import os

        key = os.getenv("TEXTRAZOR_API_KEY", "").strip()
        if not key or key == "your_textrazor_api_key_here":
            print("Set TEXTRAZOR_API_KEY first.", file=sys.stderr)
            return 1
        ensure_classifier(key)
        print("Classifier synced:", "speedlead_hvac_plumbing_intent")
        return 0

    text = args.text
    if args.file:
        text = open(args.file, encoding="utf-8").read()
    if not text:
        parser.error("Provide post text or --file")

    result = classify_post(text, use_textrazor=False if args.no_textrazor else None)

    if args.json:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        flag = "ALERT" if result.should_alert else "skip"
        print(f"[{flag}] intent={result.intent.value} trade={result.trade} confidence={result.confidence}")
        if result.matched_keywords:
            print("keywords:", ", ".join(result.matched_keywords))
        if result.reasons:
            print("reasons:", "; ".join(result.reasons))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
