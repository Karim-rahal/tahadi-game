"""Reenter the full 1,200 football draft, but VERIFY+FIX the winner-based
questions (fastest / true-false / enumeration) against web-confirmed champion
tables. Writes the corrected 1,200 and prints a verification report. Questions
we can't deterministically check (e.g. Asian Cup) pass through unchanged."""
import json, os, re, sys
sys.stdout.reconfigure(encoding="utf-8")
SRC = "data/football/football_1200_editorial_draft.json  (place the supplied draft here to re-run)"
OUT = "data/football/football_1200.json"

AL = {
 "ريال مدريد":["ريال","Real Madrid"],"برشلونة":["برسا","Barcelona","Barca"],"أتلتيكو مدريد":["أتلتيكو","Atletico Madrid"],
 "فالنسيا":["Valencia"],"ديبورتيفو لاكورونيا":["ديبورتيفو","Deportivo La Coruna"],"بايرن ميونخ":["بايرن","Bayern Munich"],
 "بوروسيا دورتموند":["دورتموند","Borussia Dortmund"],"باير ليفركوزن":["ليفركوزن","Bayer Leverkusen"],"شتوتغارت":["Stuttgart"],
 "فولفسبورغ":["Wolfsburg"],"فيردر بريمن":["Werder Bremen"],"يوفنتوس":["يوفي","Juventus"],"إنتر ميلان":["إنتر","Inter","Inter Milan"],
 "ميلان":["إيه سي ميلان","AC Milan"],"نابولي":["Napoli"],"روما":["Roma"],"لاتسيو":["Lazio"],
 "مانشستر يونايتد":["مان يونايتد","Manchester United","Man Utd"],"مانشستر سيتي":["مان سيتي","Manchester City","Man City"],
 "تشيلسي":["Chelsea"],"أرسنال":["Arsenal"],"ليفربول":["Liverpool"],"ليستر سيتي":["ليستر","Leicester City"],
 "باريس سان جيرمان":["سان جيرمان","PSG"],"أولمبيك ليون":["ليون","Lyon"],"ليل":["Lille"],"موناكو":["Monaco"],
 "مونبلييه":["Montpellier"],"بوردو":["Bordeaux"],"مرسيليا":["Marseille"],"نانت":["Nantes"],"بورتو":["Porto"],
 "البرازيل":["Brazil"],"الأرجنتين":["Argentina"],"ألمانيا":["Germany"],"ألمانيا الغربية":["West Germany"],"إيطاليا":["Italy"],
 "فرنسا":["France"],"إسبانيا":["Spain"],"إنجلترا":["England"],"أوروغواي":["Uruguay"],"اليونان":["Greece"],"البرتغال":["Portugal"],
 "هولندا":["Netherlands"],"الدنمارك":["Denmark"],"تشيكوسلوفاكيا":["Czechoslovakia"],"الاتحاد السوفيتي":["USSR"],"تشيلي":["Chile"],
}
def norm(s): return re.sub(r"\s+","",re.sub(r"[\u064B-\u0652]","",str(s))).replace("أ","ا").replace("إ","ا").replace("آ","ا").replace("ى","ي").replace("ة","ه")
# alias-aware equality
NMAP={}
for c,al in AL.items():
    NMAP[norm(c)]=c
    for a in al: NMAP[norm(a)]=c
def canon(name):
    return NMAP.get(norm(name))
def same_team(a,b):
    ca,cb=canon(a),canon(b)
    if ca and cb: return ca==cb
    return norm(a)==norm(b)

EPL={2000:"مانشستر يونايتد",2001:"مانشستر يونايتد",2002:"أرسنال",2003:"مانشستر يونايتد",2004:"أرسنال",2005:"تشيلسي",2006:"تشيلسي",2007:"مانشستر يونايتد",2008:"مانشستر يونايتد",2009:"مانشستر يونايتد",2010:"تشيلسي",2011:"مانشستر يونايتد",2012:"مانشستر سيتي",2013:"مانشستر يونايتد",2014:"مانشستر سيتي",2015:"تشيلسي",2016:"ليستر سيتي",2017:"تشيلسي",2018:"مانشستر سيتي",2019:"مانشستر سيتي",2020:"ليفربول",2021:"مانشستر سيتي",2022:"مانشستر سيتي",2023:"مانشستر سيتي",2024:"مانشستر سيتي",2025:"ليفربول"}
LALIGA={2000:"ديبورتيفو لاكورونيا",2001:"ريال مدريد",2002:"فالنسيا",2003:"ريال مدريد",2004:"فالنسيا",2005:"برشلونة",2006:"برشلونة",2007:"ريال مدريد",2008:"ريال مدريد",2009:"برشلونة",2010:"برشلونة",2011:"برشلونة",2012:"ريال مدريد",2013:"برشلونة",2014:"أتلتيكو مدريد",2015:"برشلونة",2016:"برشلونة",2017:"ريال مدريد",2018:"برشلونة",2019:"برشلونة",2020:"ريال مدريد",2021:"أتلتيكو مدريد",2022:"ريال مدريد",2023:"برشلونة",2024:"ريال مدريد",2025:"برشلونة"}
SERIEA={2000:"لاتسيو",2001:"روما",2002:"يوفنتوس",2003:"يوفنتوس",2004:"ميلان",2007:"إنتر ميلان",2008:"إنتر ميلان",2009:"إنتر ميلان",2010:"إنتر ميلان",2011:"ميلان",2012:"يوفنتوس",2013:"يوفنتوس",2014:"يوفنتوس",2015:"يوفنتوس",2016:"يوفنتوس",2017:"يوفنتوس",2018:"يوفنتوس",2019:"يوفنتوس",2020:"يوفنتوس",2021:"إنتر ميلان",2022:"ميلان",2023:"نابولي",2024:"إنتر ميلان",2025:"نابولي"}
BUNDES={2000:"بايرن ميونخ",2001:"بايرن ميونخ",2002:"بوروسيا دورتموند",2003:"بايرن ميونخ",2004:"فيردر بريمن",2005:"بايرن ميونخ",2006:"بايرن ميونخ",2007:"شتوتغارت",2008:"بايرن ميونخ",2009:"فولفسبورغ",2010:"بايرن ميونخ",2011:"بوروسيا دورتموند",2012:"بوروسيا دورتموند",2013:"بايرن ميونخ",2014:"بايرن ميونخ",2015:"بايرن ميونخ",2016:"بايرن ميونخ",2017:"بايرن ميونخ",2018:"بايرن ميونخ",2019:"بايرن ميونخ",2020:"بايرن ميونخ",2021:"بايرن ميونخ",2022:"بايرن ميونخ",2023:"بايرن ميونخ",2024:"باير ليفركوزن",2025:"بايرن ميونخ"}
UCL={2000:"ريال مدريد",2001:"بايرن ميونخ",2002:"ريال مدريد",2003:"ميلان",2004:"بورتو",2005:"ليفربول",2006:"برشلونة",2007:"ميلان",2008:"مانشستر يونايتد",2009:"برشلونة",2010:"إنتر ميلان",2011:"برشلونة",2012:"تشيلسي",2013:"بايرن ميونخ",2014:"ريال مدريد",2015:"برشلونة",2016:"ريال مدريد",2017:"ريال مدريد",2018:"ريال مدريد",2019:"ليفربول",2020:"بايرن ميونخ",2021:"تشيلسي",2022:"ريال مدريد",2023:"مانشستر سيتي",2024:"ريال مدريد",2025:"باريس سان جيرمان"}
WC={1930:"أوروغواي",1934:"إيطاليا",1938:"إيطاليا",1950:"أوروغواي",1954:"ألمانيا الغربية",1958:"البرازيل",1962:"البرازيل",1966:"إنجلترا",1970:"البرازيل",1974:"ألمانيا الغربية",1978:"الأرجنتين",1982:"إيطاليا",1986:"الأرجنتين",1990:"ألمانيا الغربية",1994:"البرازيل",1998:"فرنسا",2002:"البرازيل",2006:"إيطاليا",2010:"إسبانيا",2014:"ألمانيا",2018:"فرنسا",2022:"الأرجنتين"}
EURO={1960:"الاتحاد السوفيتي",1964:"إسبانيا",1968:"إيطاليا",1972:"ألمانيا الغربية",1976:"تشيكوسلوفاكيا",1980:"ألمانيا الغربية",1984:"فرنسا",1988:"هولندا",1992:"الدنمارك",1996:"ألمانيا",2000:"فرنسا",2004:"اليونان",2008:"إسبانيا",2012:"إسبانيا",2016:"البرتغال",2020:"إيطاليا",2024:"إسبانيا"}
COPA={2007:"البرازيل",2011:"أوروغواي",2015:"تشيلي",2016:"تشيلي",2019:"البرازيل",2021:"الأرجنتين",2024:"الأرجنتين"}

def table_for(q):
    t=q["question"]+" "+q.get("topic","")
    if "الإيطالي" in t: return SERIEA
    if "الإنجليزي" in t: return EPL
    if "الإسباني" in t: return LALIGA
    if "الألماني" in t: return BUNDES
    if "أبطال أوروبا" in t: return UCL
    if "كأس العالم" in t: return WC
    if "أمم أوروبا" in t or "يورو" in t: return EURO
    if "كوبا" in t: return COPA
    return None   # Asian Cup / unknown -> unverifiable

def grp(team): return {"canonical":team,"acceptedVariants":[team]+AL.get(team,[])}

data=json.load(open(SRC,encoding="utf-8"))
qs=data["questions"]
rep={"checked":0,"ok":0,"fixed":0,"unverifiable":0}
fixes=[]
for q in qs:
    tab=table_for(q)
    if tab is None:
        rep["unverifiable"]+=1; continue
    typ=q["type"]
    if typ=="fastest_answer":
        m=re.search(r"عام\s*(\d{4})",q["question"])
        if not m: rep["unverifiable"]+=1; continue
        y=int(m.group(1))
        if y not in tab: rep["unverifiable"]+=1; continue
        rep["checked"]+=1; w=tab[y]
        if same_team(q["canonicalAnswer"],w): rep["ok"]+=1
        else:
            if len(fixes)<12: fixes.append(f'{q["id"]} FASTEST y{y}: "{q["canonicalAnswer"]}" -> "{w}"')
            q["canonicalAnswer"]=w; q["acceptedAnswers"]=[w]+AL.get(w,[]); q["explanation"]=f"البطل المسجّل: {w} ({y})."; rep["fixed"]+=1
    elif typ=="true_false":
        m=re.search(r"عام\s*(\d{4})",q["question"])
        tm=re.search(r"فاز\s+(.+?)\s+بلقب",q["question"])  # anchor on بلقب, not any ب
        if not m or not tm: rep["unverifiable"]+=1; continue
        y=int(m.group(1))
        if y not in tab: rep["unverifiable"]+=1; continue
        rep["checked"]+=1; w=tab[y]; claimed=tm.group(1)
        correct="صح" if same_team(claimed,w) else "خطأ"
        if q["canonicalAnswer"]==correct: rep["ok"]+=1
        else:
            if len(fixes)<12: fixes.append(f'{q["id"]} TF y{y} "{claimed}": {q["canonicalAnswer"]} -> {correct}')
            q["canonicalAnswer"]=correct; q["acceptedAnswers"]=[correct]
            q["explanation"]=(f"صحيح: بطل {y} هو {w}." if correct=="صح" else f"خطأ: بطل {y} هو {w}، لا {claimed}."); rep["fixed"]+=1
    elif typ=="enumeration":
        m=re.search(r"من\s*(\d{4})\s*إلى\s*(\d{4})",q["question"])
        if not m: rep["unverifiable"]+=1; continue
        a,b=int(m.group(1)),int(m.group(2))
        # Only verify when EVERY year in the range is covered by our table, else
        # a recompute could wrongly drop a legitimate (uncovered) winner.
        if not all(y in tab for y in range(a,b+1)): rep["unverifiable"]+=1; continue
        yrs=[tab[y] for y in range(a,b+1)]
        rep["checked"]+=1
        winners=[]
        for w in yrs:
            if w not in winners: winners.append(w)
        cur=[canon(g.get("canonical","")) or g.get("canonical","") for g in q.get("answerGroups",[])]
        if [canon(w) or w for w in winners]==cur: rep["ok"]+=1
        else:
            if len(fixes)<12: fixes.append(f'{q["id"]} ENUM {a}-{b}: {len(cur)} -> {len(winners)} groups')
            q["answerGroups"]=[grp(w) for w in winners]; q["canonicalAnswer"]="، ".join(winners); q["acceptedAnswers"]=[]
            q["explanation"]=f"الفائزون {a}-{b}: {'، '.join(winners)}."; rep["fixed"]+=1
    else:
        rep["unverifiable"]+=1

os.makedirs(os.path.dirname(OUT),exist_ok=True)
json.dump(data,open(OUT,"w",encoding="utf-8"),ensure_ascii=False,indent=1)
print("total:",len(qs))
print("verification report:",rep)
print("sample fixes:"); [print("  ",f) for f in fixes]
print("wrote:",OUT)
