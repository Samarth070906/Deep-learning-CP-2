"""Test the claim extractor on realistic AI agent outputs."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from trustagent.pipeline.claim_extractor import extract_claims

print("=" * 70)
print("  Claim Extractor Test")
print("=" * 70)

# Test 1: Single short claim (should pass through as-is)
text1 = "Price of GameStation X1 is 499 USD."
claims1 = extract_claims(text1)
print(f"\nTest 1: Single claim")
print(f"  Input: \"{text1}\"")
print(f"  Extracted ({len(claims1)}): {claims1}")

# Test 2: Long agent response with multiple claims
text2 = """Based on my research, the GameStation X1 is an excellent gaming console. 
It is priced at 499 USD and comes with 1 TB of storage. The console is available 
in White color and draws about 200 watts of power. I would highly recommend it 
for casual gamers looking for a solid entertainment system."""
claims2 = extract_claims(text2)
print(f"\nTest 2: Long agent response")
print(f"  Input: \"{text2[:80]}...\"")
print(f"  Extracted ({len(claims2)}):")
for i, c in enumerate(claims2, 1):
    print(f"    {i}. \"{c}\"")

# Test 3: Multiple products mentioned
text3 = """Here's a comparison: The SuperPhone X costs 799 USD with 24 hours of 
battery life. The MegaTablet Pro is priced at 1199 USD and has a 12.9 inch screen. 
Both are great electronics products."""
claims3 = extract_claims(text3)
print(f"\nTest 3: Multiple products")
print(f"  Input: \"{text3[:80]}...\"")
print(f"  Extracted ({len(claims3)}):")
for i, c in enumerate(claims3, 1):
    print(f"    {i}. \"{c}\"")

# Test 4: No verifiable claims (just opinions)
text4 = "I think gaming is a great hobby. Everyone should try it sometime."
claims4 = extract_claims(text4)
print(f"\nTest 4: No verifiable claims")
print(f"  Input: \"{text4}\"")
print(f"  Extracted ({len(claims4)}): {claims4}")

# Test 5: Mixed claims with visual attribute
text5 = """The RoboVac S9 is available in Black color and offers 5000 Pa suction power. 
Its battery lasts 180 minutes on a single charge. The BrewMaster 3000 espresso 
machine in Silver has 15 bars of pressure."""
claims5 = extract_claims(text5)
print(f"\nTest 5: Mixed products with visual attributes")
print(f"  Input: \"{text5[:80]}...\"")
print(f"  Extracted ({len(claims5)}):")
for i, c in enumerate(claims5, 1):
    print(f"    {i}. \"{c}\"")

print(f"\n{'=' * 70}")
print("  All tests complete!")
print(f"{'=' * 70}")
