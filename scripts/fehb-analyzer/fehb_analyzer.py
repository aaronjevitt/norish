#!/usr/bin/env python3
"""
FEHB Plan Analyzer — 2026 plan year, Self Plus One
===================================================

Ranks nationwide FEHB plans by expected total net cost for a two-person
household (you + spouse), with a cost-benefit lens that gives HSA plans
full credit for premium pass-through dollars and payroll-tax savings.

Methodology (per plan, per utilization scenario):

    net cost = after-tax premiums
             + your share of medical costs (deductible/coinsurance, capped at OOP max)
             - employer HSA pass-through ("free money")
             - tax savings on your own HSA contributions (HDHP plans)
             - tax savings on FSA contributions (non-HDHP plans, capped at
               the lesser of expected out-of-pocket and the FSA limit)

Scenarios are weighted (default: 35% low / 40% moderate / 20% high /
5% catastrophic) to produce an expected annual cost, and the worst-case
(catastrophic) column shows each plan's true downside exposure.

DATA FRESHNESS
--------------
Premiums are 2026 biweekly EMPLOYEE shares (non-postal, Self Plus One)
gathered from GEHA/MHBP/FEP published rates in mid-2026. Entries flagged
"verify" could not be independently cross-checked — confirm at:
    https://www.opm.gov/healthcare-insurance/healthcare/plan-information/compare-plans/
Benefit parameters (deductibles, coinsurance, OOP max) for copay-style
plans are simplified into an "effective coinsurance" model; check the
official plan brochures before making a final election.

Usage:
    python3 fehb_analyzer.py                       # defaults: 22% fed, 5% state
    python3 fehb_analyzer.py --fed 0.24 --state 0.06
    python3 fehb_analyzer.py --spend 8000          # single custom spend level
    python3 fehb_analyzer.py --hsa-contrib 4000    # you'd only put $4k/yr in the HSA
    python3 fehb_analyzer.py --no-pretax-premiums  # if not using premium conversion
    python3 fehb_analyzer.py --json                # machine-readable output
"""

import argparse
import json
import sys
from dataclasses import dataclass, field, asdict

PAY_PERIODS = 26

# 2026 IRS limits
HSA_LIMIT_FAMILY = 8750     # family/Self+1 HSA contribution limit (excl. catch-up)
HSA_CATCHUP = 1000          # per spouse age 55+ (needs separate spouse HSA)
FSA_LIMIT = 3400            # health FSA employee limit (approx for 2026 — verify)
FICA_RATE = 0.0765          # Social Security + Medicare


@dataclass
class Plan:
    name: str
    code: str                 # Self Plus One enrollment code
    biweekly_premium: float   # 2026 employee share, biweekly, Self Plus One
    deductible: float         # in-network, Self Plus One
    coinsurance: float        # effective member share after deductible
    oop_max: float            # in-network OOP maximum, Self Plus One
    hsa_qualified: bool = False
    hsa_passthrough: float = 0.0   # employer premium pass-through to HSA, $/yr
    notes: str = ""
    premium_confidence: str = "verified"  # "verified" | "verify"

    @property
    def annual_premium(self) -> float:
        return self.biweekly_premium * PAY_PERIODS

    def member_medical_cost(self, gross_spend: float) -> float:
        """Your share of allowed in-network costs for a year of care."""
        if gross_spend <= self.deductible:
            share = gross_spend
        else:
            share = self.deductible + (gross_spend - self.deductible) * self.coinsurance
        return min(share, self.oop_max)


# ---------------------------------------------------------------------------
# 2026 plan data — Self Plus One, non-postal federal employee, in-network.
# Edit freely; premiums are the biweekly amount YOU pay (not the total).
# ---------------------------------------------------------------------------
PLANS = [
    Plan(
        name="GEHA HDHP", code="343", biweekly_premium=175.47,
        deductible=3600, coinsurance=0.05, oop_max=10000,
        hsa_qualified=True, hsa_passthrough=2000,
        notes="5% coinsurance after deductible; OOP max approximate. "
              "Pass-through $2,000/yr deposited to your HSA.",
    ),
    Plan(
        name="MHBP Consumer Option (HDHP)", code="483", biweekly_premium=212.42,
        deductible=4000, coinsurance=0.10, oop_max=12000,
        hsa_qualified=True, hsa_passthrough=2400,
        notes="Pass-through $2,400/yr. Coinsurance/OOP max approximate.",
    ),
    Plan(
        name="FEP Blue Focus", code="133", biweekly_premium=143.63,
        deductible=1000, coinsurance=0.30, oop_max=9000,
        notes="First 10 primary-care visits low-copay; 30% coinsurance is the "
              "dominant cost share. OOP max approximate.",
    ),
    Plan(
        name="FEP Blue Basic", code="113", biweekly_premium=319.25,
        deductible=0, coinsurance=0.18, oop_max=13000,
        notes="Copay-based plan modeled as ~18% effective coinsurance; "
              "no deductible. OOP max approximate.",
    ),
    Plan(
        name="FEP Blue Standard", code="106", biweekly_premium=410.88,
        deductible=700, coinsurance=0.15, oop_max=12000,
        notes="Richest BCBS option; deductible/OOP max approximate.",
    ),
    Plan(
        name="MHBP Standard", code="456", biweekly_premium=216.12,
        deductible=1200, coinsurance=0.15, oop_max=12000,
        notes="Copays + coinsurance modeled as ~15% effective. "
              "Deductible/OOP max/code approximate.",
    ),
    Plan(
        name="GEHA Elevate", code="256", biweekly_premium=187.99,
        deductible=1200, coinsurance=0.25, oop_max=12000,
        premium_confidence="verify",
        notes="Premium NOT independently cross-checked (large 2026 increase "
              "reported). Benefit params approximate.",
    ),
    Plan(
        name="GEHA Elevate Plus", code="253", biweekly_premium=449.58,
        deductible=1000, coinsurance=0.15, oop_max=10000,
        premium_confidence="verify",
        notes="Premium NOT independently cross-checked — may be the TOTAL "
              "premium rather than employee share. Verify before trusting.",
    ),
]

# Utilization scenarios: gross allowed in-network spend for BOTH of you, $/yr.
DEFAULT_SCENARIOS = [
    ("low",          1500, 0.35),  # routine care, a couple sick visits, generics
    ("moderate",     5000, 0.40),  # imaging, PT, a minor procedure, brand Rx
    ("high",        12000, 0.20),  # ongoing condition or one surgery
    ("catastrophic", 60000, 0.05), # hospitalization / major diagnosis
]


@dataclass
class Result:
    plan: Plan
    scenario_costs: dict = field(default_factory=dict)  # name -> net cost
    expected_cost: float = 0.0
    worst_case: float = 0.0
    tax_detail: dict = field(default_factory=dict)


def analyze(plans, scenarios, fed, state, hsa_contrib_cap, pretax_premiums):
    marginal = fed + state + FICA_RATE  # payroll pre-tax rate (premium conversion & HSA via payroll)
    results = []

    for p in plans:
        premium = p.annual_premium
        premium_tax_savings = premium * marginal if pretax_premiums else 0.0

        if p.hsa_qualified:
            headroom = max(0.0, HSA_LIMIT_FAMILY - p.hsa_passthrough)
            own_contrib = min(headroom, hsa_contrib_cap)
            hsa_tax_savings = own_contrib * marginal
            fsa_tax_savings_base = 0.0
        else:
            own_contrib = 0.0
            hsa_tax_savings = 0.0
            fsa_tax_savings_base = None  # computed per scenario below

        r = Result(plan=p)
        r.tax_detail = {
            "marginal_rate": marginal,
            "premium_tax_savings": round(premium_tax_savings, 2),
            "hsa_own_contribution": round(own_contrib, 2),
            "hsa_tax_savings": round(hsa_tax_savings, 2),
            "hsa_passthrough": p.hsa_passthrough,
        }

        weighted = 0.0
        for name, spend, weight in scenarios:
            oop = p.member_medical_cost(spend)
            if fsa_tax_savings_base is None:
                fsa_savings = min(oop, FSA_LIMIT) * marginal
            else:
                fsa_savings = 0.0
            net = (premium - premium_tax_savings) + oop \
                - p.hsa_passthrough - hsa_tax_savings - fsa_savings
            r.scenario_costs[name] = round(net, 2)
            weighted += net * weight

        r.expected_cost = round(weighted, 2)
        # worst case: hit the OOP max
        worst_oop = p.oop_max
        worst_fsa = 0.0 if p.hsa_qualified else min(worst_oop, FSA_LIMIT) * marginal
        r.worst_case = round(
            (premium - premium_tax_savings) + worst_oop
            - p.hsa_passthrough - hsa_tax_savings - worst_fsa, 2)
        results.append(r)

    results.sort(key=lambda r: r.expected_cost)
    return results


def fmt(x):
    return f"${x:,.0f}"


def print_report(results, scenarios, fed, state, pretax_premiums):
    marginal = fed + state + FICA_RATE
    scen_names = [s[0] for s in scenarios]

    print("=" * 100)
    print("FEHB PLAN ANALYZER — 2026, Self Plus One (you + spouse)")
    print(f"Assumptions: {fed:.0%} federal + {state:.0%} state + {FICA_RATE:.2%} FICA "
          f"= {marginal:.1%} marginal payroll rate; "
          f"premiums {'pre-tax (premium conversion)' if pretax_premiums else 'after-tax'}; "
          f"HSA plans assume you fill the ${HSA_LIMIT_FAMILY:,} family limit.")
    print("=" * 100)

    header = f"{'Plan':32}{'Biweekly':>9}" + "".join(f"{n:>13}" for n in scen_names) \
             + f"{'Expected':>11}{'Worst':>10}"
    print(header)
    print("-" * len(header))
    for r in results:
        flag = " ⚠" if r.plan.premium_confidence == "verify" else ""
        row = f"{(r.plan.name + flag):32}{r.plan.biweekly_premium:>9.2f}"
        for n in scen_names:
            row += f"{fmt(r.scenario_costs[n]):>13}"
        row += f"{fmt(r.expected_cost):>11}{fmt(r.worst_case):>10}"
        print(row)

    print("-" * len(header))
    print("Columns are NET annual cost: after-tax premiums + your medical cost share")
    print("− HSA pass-through − HSA/FSA tax savings. Lower is better. ⚠ = premium unverified.")

    best = results[0]
    best_hsa = next((r for r in results if r.plan.hsa_qualified), None)
    best_worst = min(results, key=lambda r: r.worst_case)

    print()
    print("SUMMARY")
    print(f"  Best expected value : {best.plan.name} "
          f"(~{fmt(best.expected_cost)}/yr expected)")
    if best_hsa:
        td = best_hsa.tax_detail
        print(f"  Best HSA play       : {best_hsa.plan.name} — "
              f"{fmt(td['hsa_passthrough'])} free pass-through + "
              f"{fmt(td['hsa_tax_savings'])} tax savings on your "
              f"{fmt(td['hsa_own_contribution'])} contribution")
    print(f"  Safest worst case   : {best_worst.plan.name} "
          f"({fmt(best_worst.worst_case)} if catastrophic)")
    print()
    print("Verify premiums & benefits: https://www.opm.gov/healthcare-insurance/")


def main():
    ap = argparse.ArgumentParser(description="FEHB 2026 Self Plus One cost-benefit analyzer")
    ap.add_argument("--fed", type=float, default=0.22, help="marginal federal rate (default 0.22)")
    ap.add_argument("--state", type=float, default=0.05, help="marginal state rate (default 0.05)")
    ap.add_argument("--hsa-contrib", type=float, default=HSA_LIMIT_FAMILY,
                    help="max you'd contribute to the HSA yourself, $/yr (default: fill the limit)")
    ap.add_argument("--spend", type=float, default=None,
                    help="replace scenarios with a single gross annual spend level")
    ap.add_argument("--no-pretax-premiums", action="store_true",
                    help="don't credit premium-conversion tax savings")
    ap.add_argument("--json", action="store_true", help="emit JSON instead of a table")
    args = ap.parse_args()

    scenarios = DEFAULT_SCENARIOS
    if args.spend is not None:
        scenarios = [("custom", args.spend, 1.0)]

    results = analyze(PLANS, scenarios, args.fed, args.state,
                      args.hsa_contrib, not args.no_pretax_premiums)

    if args.json:
        out = [{
            "plan": r.plan.name, "code": r.plan.code,
            "biweekly_premium": r.plan.biweekly_premium,
            "premium_confidence": r.plan.premium_confidence,
            "scenario_costs": r.scenario_costs,
            "expected_cost": r.expected_cost,
            "worst_case": r.worst_case,
            "tax_detail": r.tax_detail,
            "notes": r.plan.notes,
        } for r in results]
        json.dump(out, sys.stdout, indent=2)
        print()
    else:
        print_report(results, scenarios, args.fed, args.state,
                     not args.no_pretax_premiums)


if __name__ == "__main__":
    main()
