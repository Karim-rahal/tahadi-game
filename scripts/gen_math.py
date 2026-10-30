"""Deterministic generator for the الحساب السريع (Fast Mathematics) bank.

Every question is built FROM a computation, so the answer is correct by
construction (no LLM guessing). Mental-solvable only; clean integer/short
decimal answers. Hits the required topic + difficulty distribution.
"""
import json, os, random, sys
from fractions import Fraction

sys.stdout.reconfigure(encoding="utf-8")
random.seed(42)

OUT = "data/mathematics/fast_mathematics_600.json"

# (topic_key, easy, medium, hard)  — columns sum to 180/240/180, total 600
PLAN = [
    ("add_sub",         40, 40, 20),
    ("mul_div",         40, 48, 32),
    ("pct_frac",        30, 54, 36),
    ("multistep",       24, 60, 36),
    ("powers_patterns", 20, 24, 26),
    ("word",            26, 14, 30),
]

AR_TOPIC = {
    "add_sub": "الجمع والطرح",
    "mul_div": "الضرب والقسمة",
    "pct_frac": "النِّسب والكسور",
    "multistep": "عمليات متعددة الخطوات",
    "powers_patterns": "القوى والجذور والأنماط",
    "word": "مسائل كلامية",
}

def num(n):
    # integer -> plain; short decimal -> trimmed
    if isinstance(n, float):
        if abs(n - round(n)) < 1e-9:
            return str(int(round(n)))
        return ("%g" % n)
    if isinstance(n, Fraction):
        return str(n.numerator) if n.denominator == 1 else f"{n.numerator}/{n.denominator}"
    return str(n)

def R(a, b):
    return random.randint(a, b)

# ---------- generators: return (question, answer, explanation) ----------
def g_add_sub(diff):
    if diff == "easy":
        a, b = R(11, 89), R(11, 89)
        if random.random() < 0.5:
            return f"{a} + {b} = ؟", a + b, f"{a} + {b} = {a+b}"
        a, b = max(a, b), min(a, b)
        return f"{a} − {b} = ؟", a - b, f"{a} − {b} = {a-b}"
    if diff == "medium":
        if random.random() < 0.5:
            a, b, c = R(20, 90), R(20, 90), R(10, 60)
            return f"{a} + {b} − {c} = ؟", a + b - c, f"{a} + {b} − {c} = {a+b-c}"
        a, b = R(120, 480), R(30, 290)
        if random.random() < 0.5:
            return f"{a} + {b} = ؟", a + b, f"{a} + {b} = {a+b}"
        a = max(a, b); b = min(a, b)
        return f"{a} − {b} = ؟", a - b, f"{a} − {b} = {a-b}"
    a, b = R(150, 880), R(120, 850)
    if random.random() < 0.5:
        return f"{a} + {b} = ؟", a + b, f"{a} + {b} = {a+b}"
    a, b = max(a, b), min(a, b)
    return f"{a} − {b} = ؟", a - b, f"{a} − {b} = {a-b}"

def g_mul_div(diff):
    if diff == "easy":
        if random.random() < 0.5:
            a, b = R(2, 9), R(2, 12)
            return f"{a} × {b} = ؟", a * b, f"{a} × {b} = {a*b}"
        b, q = R(2, 9), R(2, 10)
        a = b * q
        return f"{a} ÷ {b} = ؟", q, f"{a} ÷ {b} = {q}"
    if diff == "medium":
        if random.random() < 0.5:
            a, b = R(11, 29), R(3, 9)
            return f"{a} × {b} = ؟", a * b, f"{a} × {b} = {a*b}"
        b, q = R(3, 12), R(6, 15)
        a = b * q
        return f"{a} ÷ {b} = ؟", q, f"{a} ÷ {b} = {q}"
    if random.random() < 0.5:
        a, b = R(12, 49), random.choice([11, 12, 15, 20, 25, 99])
        return f"{a} × {b} = ؟", a * b, f"{a} × {b} = {a*b}"
    b, q = random.choice([12, 15, 16, 25]), R(7, 18)
    a = b * q
    return f"{a} ÷ {b} = ؟", q, f"{a} ÷ {b} = {q}"

def g_pct_frac(diff):
    if random.random() < 0.4:  # fraction of
        d = random.choice([2, 4, 5, 8] if diff != "easy" else [2, 4])
        n = R(1, d - 1)
        base = d * R(3, 12 if diff != "hard" else 20)
        val = base * n // d
        return f"ما هو {n}/{d} من {base}؟", val, f"{n}/{d} × {base} = {val}"
    if diff == "easy":
        p = random.choice([10, 25, 50])
    elif diff == "medium":
        p = random.choice([15, 20, 30, 40, 75])
    else:
        p = random.choice([5, 12.5, 35, 45, 60, 65, 37.5])
    # choose base so result is a clean integer
    base = int(round(100 / Fraction(p).limit_denominator(1000).denominator)) if False else None
    frac = Fraction(str(p)) / 100
    step = frac.denominator
    base = step * R(2, 20)
    val = int(base * frac)
    pdisp = num(p)
    return f"كم يساوي {pdisp}% من {base}؟", val, f"{pdisp}% × {base} = {val}"

def g_multistep(diff):
    if diff == "easy":
        a, b, c = R(2, 9), R(2, 9), R(2, 20)
        if random.random() < 0.5:
            return f"{a} × {b} + {c} = ؟", a*b+c, f"{a}×{b} + {c} = {a*b+c}"
        return f"{c} + {a} × {b} = ؟", c+a*b, f"{a}×{b} + {c} = {c+a*b}"
    if diff == "medium":
        if random.random() < 0.5:
            a, b, c, d = R(3, 12), R(3, 9), R(2, 9), R(2, 9)
            return f"{a} × {b} − {c} × {d} = ؟", a*b-c*d, f"{a*b} − {c*d} = {a*b-c*d}"
        a, b, c = R(5, 25), R(5, 25), R(2, 9)
        return f"({a} + {b}) × {c} = ؟", (a+b)*c, f"({a}+{b})×{c} = {(a+b)*c}"
    if random.random() < 0.5:
        a, b, c, d = R(10, 40), R(3, 9), R(3, 9), R(2, 12)
        return f"{a} + {b} × {c} − {d} = ؟", a+b*c-d, f"{a} + {b*c} − {d} = {a+b*c-d}"
    c = random.choice([3, 4, 5, 6])
    a, b = R(2, 12)*c, R(1, 8)*c  # ensure divisible
    e = R(2, 9)
    total = (a + b)//c * e
    return f"({a} + {b}) ÷ {c} × {e} = ؟", total, f"({a}+{b})÷{c}×{e} = {total}"

def _arith_pattern(a, step):
    seq = [a + step * i for i in range(4)]
    return (f"أكمل النمط: {seq[0]}، {seq[1]}، {seq[2]}، {seq[3]}، ؟",
            seq[3] + step, f"نمط حسابي الفرق {step}: التالي {seq[3]+step}")

def _geo_pattern(a, r):
    seq = [a * r ** i for i in range(4)]
    return (f"أكمل النمط: {seq[0]}، {seq[1]}، {seq[2]}، {seq[3]}، ؟",
            seq[3] * r, f"نمط هندسي ×{r}: التالي {seq[3]*r}")

def g_powers_patterns(diff):
    kind = random.random()
    if diff == "easy":
        if kind < 0.35:
            n = R(2, 12); return f"{n}² = ؟", n*n, f"{n}² = {n*n}"
        if kind < 0.65:
            n = R(2, 12); return f"الجذر التربيعي للعدد {n*n} = ؟", n, f"√{n*n} = {n}"
        return _arith_pattern(R(1, 12), R(2, 7))
    if diff == "medium":
        if kind < 0.22:
            n = R(2, 8); return f"{n}³ = ؟", n**3, f"{n}³ = {n**3}"
        if kind < 0.42:
            k = R(4, 7); return f"2 أس {k} = ؟", 2**k, f"2^{k} = {2**k}"
        if kind < 0.60:
            n = R(10, 25); return f"الجذر التربيعي للعدد {n*n} = ؟", n, f"√{n*n} = {n}"
        if kind < 0.80:
            return _geo_pattern(R(1, 6), random.choice([2, 3]))
        return _arith_pattern(R(5, 30), R(6, 15))
    # hard
    if kind < 0.28:
        n = R(13, 25); return f"{n}² = ؟", n*n, f"{n}² = {n*n}"
    if kind < 0.48:
        k = R(6, 9); return f"2 أس {k} = ؟", 2**k, f"2^{k} = {2**k}"
    if kind < 0.68:
        n = R(15, 35); return f"الجذر التربيعي للعدد {n*n} = ؟", n, f"√{n*n} = {n}"
    if kind < 0.84:
        s = R(2, 6); return _geo_pattern(s, 3)
    # quadratic / triangular patterns
    start = R(1, 6)
    seq = [i*(i+1) for i in range(start, start+4)]
    nxt = (start+4)*(start+5)
    return (f"أكمل النمط: {seq[0]}، {seq[1]}، {seq[2]}، {seq[3]}، ؟", nxt,
            f"نمط n(n+1): التالي {nxt}")

def g_word(diff):
    if diff == "easy":
        x, y = R(2, 9), R(2, 9)
        return f"اشترى أحمد {x} أقلام بسعر {y} ل.ل للقلم. كم دفع؟", x*y, f"{x} × {y} = {x*y}"
    if diff == "medium":
        if random.random() < 0.5:
            y, z = R(40, 90), R(2, 5)
            return f"تسير سيارة بسرعة {y} كم/س لمدة {z} ساعات. كم المسافة بالكيلومترات؟", y*z, f"{y} × {z} = {y*z}"
        k, each = R(4, 9), R(3, 12); tot = k*each
        return f"وُزِّعت {tot} حبة حلوى بالتساوي على {k} أطفال. كم لكل طفل؟", each, f"{tot} ÷ {k} = {each}"
    if random.random() < 0.5:
        p = random.choice([80, 120, 150, 200, 240]); d = random.choice([10, 20, 25, 50])
        val = p*(100-d)//100
        return f"ثمن قميص {p} ل.ل وعليه خصم {d}%. كم السعر بعد الخصم؟", val, f"{p} − {d}% = {val}"
    a, b, c = R(20, 60), R(10, 40), R(5, 30)
    return f"في السلة {a} تفاحة، أُضيفت {b}، ثم أُخذت {c}. كم بقي؟", a+b-c, f"{a} + {b} − {c} = {a+b-c}"

GEN = {
    "add_sub": g_add_sub, "mul_div": g_mul_div, "pct_frac": g_pct_frac,
    "multistep": g_multistep, "powers_patterns": g_powers_patterns, "word": g_word,
}

records = []
seen = set()
counter = 1
for topic, ne, nm, nh in PLAN:
    for diff, n in (("easy", ne), ("medium", nm), ("hard", nh)):
        made = 0
        attempts = 0
        while made < n:
            attempts += 1
            if attempts > n * 400:
                raise SystemExit(f"stuck generating {topic}/{diff} ({made}/{n})")
            q, ans, expl = GEN[topic](diff)
            if q in seen:
                continue
            seen.add(q)
            ans_s = num(ans)
            accepted = [ans_s]
            # also accept a bare-integer form if answer is like "12.0"
            records.append({
                "id": f"MATH-{counter:04d}",
                "category": "الحساب السريع",
                "type": "fastest_answer",
                "difficulty": diff,
                "topic": AR_TOPIC[topic],
                "question": q,
                "answer": ans_s,
                "accepted_answers": accepted,
                "explanation": expl,
                "points": 1,
                "turn_mode": "fastest",
                "review_status": "calculation_verified",
                "source": "deterministic-generator v1",
            })
            counter += 1
            made += 1

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump({"metadata": {"category": "الحساب السريع", "generator": "deterministic v1", "count": len(records)}, "questions": records}, f, ensure_ascii=False, indent=1)

# summary
from collections import Counter
bd = Counter(r["difficulty"] for r in records)
bt = Counter(r["topic"] for r in records)
print("total:", len(records), "| unique questions:", len(seen))
print("byDifficulty:", dict(bd))
print("byTopic:", dict(bt))
print("sample:", json.dumps(records[0], ensure_ascii=False), json.dumps(records[300], ensure_ascii=False))
print("wrote:", OUT)
