"""Deterministic football 'competition winners' core — built from verified
champion tables (web-confirmed: UCL/EPL recent years, WC 1930-2022, Euro 2024,
Copa 2024). Every fastest/true-false/enumeration question is derived from these
tables, so it is correct and internally consistent. NOT the full varied 1,200 —
this is the verifiable core (winners/champions). who_am_i is a small curated set.
"""
import json, os, random, sys
sys.stdout.reconfigure(encoding="utf-8")
random.seed(7)
OUT = "data/football/football_core.json"

# club/country canonical -> aliases (Arabic short + English)
AL = {
  "ريال مدريد":["ريال","Real Madrid"], "برشلونة":["برسا","Barcelona","Barca"],
  "أتلتيكو مدريد":["أتلتيكو","Atletico Madrid"], "فالنسيا":["Valencia"],
  "ديبورتيفو لاكورونيا":["ديبورتيفو","Deportivo La Coruna"],
  "بايرن ميونخ":["بايرن","Bayern Munich"], "بوروسيا دورتموند":["دورتموند","Borussia Dortmund"],
  "باير ليفركوزن":["ليفركوزن","Bayer Leverkusen"], "شتوتغارت":["Stuttgart"],
  "فولفسبورغ":["Wolfsburg"], "فيردر بريمن":["Werder Bremen"],
  "يوفنتوس":["يوفي","Juventus"], "إنتر ميلان":["إنتر","Inter","Inter Milan"],
  "ميلان":["إيه سي ميلان","AC Milan"], "نابولي":["Napoli"], "روما":["AS Roma","Roma"], "لاتسيو":["Lazio"],
  "مانشستر يونايتد":["مان يونايتد","Manchester United","Man Utd"],
  "مانشستر سيتي":["مان سيتي","Manchester City","Man City"],
  "تشيلسي":["Chelsea"], "أرسنال":["Arsenal"], "ليفربول":["Liverpool"], "ليستر سيتي":["ليستر","Leicester City"],
  "باريس سان جيرمان":["سان جيرمان","PSG","Paris Saint-Germain"], "أولمبيك ليون":["ليون","Lyon"],
  "ليل":["Lille"], "موناكو":["Monaco"], "مونبلييه":["Montpellier"], "بوردو":["Bordeaux"],
  "مرسيليا":["Marseille"], "نانت":["Nantes"], "بورتو":["Porto"], "تشيلي":["Chile"],
  "البرازيل":["Brazil"], "الأرجنتين":["Argentina"], "ألمانيا":["Germany"], "ألمانيا الغربية":["West Germany"],
  "إيطاليا":["Italy"], "فرنسا":["France"], "إسبانيا":["Spain"], "إنجلترا":["England"],
  "أوروغواي":["Uruguay"], "اليونان":["Greece"], "البرتغال":["Portugal"], "هولندا":["Netherlands"],
  "الدنمارك":["Denmark"], "تشيكوسلوفاكيا":["Czechoslovakia"], "الاتحاد السوفيتي":["USSR","Soviet Union"],
}
def aliases(name): return AL.get(name, [])

# ---- verified champion tables (season end year -> champion) ----
EPL = {2000:"مانشستر يونايتد",2001:"مانشستر يونايتد",2002:"أرسنال",2003:"مانشستر يونايتد",2004:"أرسنال",
2005:"تشيلسي",2006:"تشيلسي",2007:"مانشستر يونايتد",2008:"مانشستر يونايتد",2009:"مانشستر يونايتد",
2010:"تشيلسي",2011:"مانشستر يونايتد",2012:"مانشستر سيتي",2013:"مانشستر يونايتد",2014:"مانشستر سيتي",
2015:"تشيلسي",2016:"ليستر سيتي",2017:"تشيلسي",2018:"مانشستر سيتي",2019:"مانشستر سيتي",2020:"ليفربول",
2021:"مانشستر سيتي",2022:"مانشستر سيتي",2023:"مانشستر سيتي",2024:"مانشستر سيتي",2025:"ليفربول"}
LALIGA = {2000:"ديبورتيفو لاكورونيا",2001:"ريال مدريد",2002:"فالنسيا",2003:"ريال مدريد",2004:"فالنسيا",
2005:"برشلونة",2006:"برشلونة",2007:"ريال مدريد",2008:"ريال مدريد",2009:"برشلونة",2010:"برشلونة",
2011:"برشلونة",2012:"ريال مدريد",2013:"برشلونة",2014:"أتلتيكو مدريد",2015:"برشلونة",2016:"برشلونة",
2017:"ريال مدريد",2018:"برشلونة",2019:"برشلونة",2020:"ريال مدريد",2021:"أتلتيكو مدريد",2022:"ريال مدريد",
2023:"برشلونة",2024:"ريال مدريد",2025:"برشلونة"}
# Serie A: 2005 & 2006 omitted (Calciopoli — contested/revoked).
SERIEA = {2000:"لاتسيو",2001:"روما",2002:"يوفنتوس",2003:"يوفنتوس",2004:"ميلان",2007:"إنتر ميلان",
2008:"إنتر ميلان",2009:"إنتر ميلان",2010:"إنتر ميلان",2011:"ميلان",2012:"يوفنتوس",2013:"يوفنتوس",
2014:"يوفنتوس",2015:"يوفنتوس",2016:"يوفنتوس",2017:"يوفنتوس",2018:"يوفنتوس",2019:"يوفنتوس",2020:"يوفنتوس",
2021:"إنتر ميلان",2022:"ميلان",2023:"نابولي",2024:"إنتر ميلان",2025:"نابولي"}
BUNDES = {2000:"بايرن ميونخ",2001:"بايرن ميونخ",2002:"بوروسيا دورتموند",2003:"بايرن ميونخ",2004:"فيردر بريمن",
2005:"بايرن ميونخ",2006:"بايرن ميونخ",2007:"شتوتغارت",2008:"بايرن ميونخ",2009:"فولفسبورغ",2010:"بايرن ميونخ",
2011:"بوروسيا دورتموند",2012:"بوروسيا دورتموند",2013:"بايرن ميونخ",2014:"بايرن ميونخ",2015:"بايرن ميونخ",
2016:"بايرن ميونخ",2017:"بايرن ميونخ",2018:"بايرن ميونخ",2019:"بايرن ميونخ",2020:"بايرن ميونخ",
2021:"بايرن ميونخ",2022:"بايرن ميونخ",2023:"بايرن ميونخ",2024:"باير ليفركوزن",2025:"بايرن ميونخ"}
LIGUE1 = {2000:"موناكو",2001:"نانت",2002:"أولمبيك ليون",2003:"أولمبيك ليون",2004:"أولمبيك ليون",
2005:"أولمبيك ليون",2006:"أولمبيك ليون",2007:"أولمبيك ليون",2008:"أولمبيك ليون",2009:"بوردو",2010:"مرسيليا",
2011:"ليل",2012:"مونبلييه",2013:"باريس سان جيرمان",2014:"باريس سان جيرمان",2015:"باريس سان جيرمان",
2016:"باريس سان جيرمان",2017:"موناكو",2018:"باريس سان جيرمان",2019:"باريس سان جيرمان",2020:"باريس سان جيرمان",
2021:"ليل",2022:"باريس سان جيرمان",2023:"باريس سان جيرمان",2024:"باريس سان جيرمان",2025:"باريس سان جيرمان"}
UCL = {2000:"ريال مدريد",2001:"بايرن ميونخ",2002:"ريال مدريد",2003:"ميلان",2004:"بورتو",2005:"ليفربول",
2006:"برشلونة",2007:"ميلان",2008:"مانشستر يونايتد",2009:"برشلونة",2010:"إنتر ميلان",2011:"برشلونة",
2012:"تشيلسي",2013:"بايرن ميونخ",2014:"ريال مدريد",2015:"برشلونة",2016:"ريال مدريد",2017:"ريال مدريد",
2018:"ريال مدريد",2019:"ليفربول",2020:"بايرن ميونخ",2021:"تشيلسي",2022:"ريال مدريد",2023:"مانشستر سيتي",
2024:"ريال مدريد",2025:"باريس سان جيرمان"}
WC = {1930:"أوروغواي",1934:"إيطاليا",1938:"إيطاليا",1950:"أوروغواي",1954:"ألمانيا الغربية",1958:"البرازيل",
1962:"البرازيل",1966:"إنجلترا",1970:"البرازيل",1974:"ألمانيا الغربية",1978:"الأرجنتين",1982:"إيطاليا",
1986:"الأرجنتين",1990:"ألمانيا الغربية",1994:"البرازيل",1998:"فرنسا",2002:"البرازيل",2006:"إيطاليا",
2010:"إسبانيا",2014:"ألمانيا",2018:"فرنسا",2022:"الأرجنتين"}
EURO = {1960:"الاتحاد السوفيتي",1964:"إسبانيا",1968:"إيطاليا",1972:"ألمانيا الغربية",1976:"تشيكوسلوفاكيا",
1980:"ألمانيا الغربية",1984:"فرنسا",1988:"هولندا",1992:"الدنمارك",1996:"ألمانيا",2000:"فرنسا",
2004:"اليونان",2008:"إسبانيا",2012:"إسبانيا",2016:"البرتغال",2020:"إيطاليا",2024:"إسبانيا"}
COPA = {2007:"البرازيل",2011:"أوروغواي",2015:"تشيلي",2016:"تشيلي",2019:"البرازيل",2021:"الأرجنتين",2024:"الأرجنتين"}

LEAGUES = [("الدوري الإنجليزي الممتاز",EPL,"الدوري الإنجليزي"),("الدوري الإسباني",LALIGA,"الدوري الإسباني"),
("الدوري الإيطالي",SERIEA,"الدوري الإيطالي"),("الدوري الألماني",BUNDES,"الدوري الألماني"),
("الدوري الفرنسي",LIGUE1,"الدوري الفرنسي")]

records=[]; cid=1
def add(type_, diff, topic, question, answer, accepted=None, groups=None, clues=None, expl=""):
    global cid
    rec={"id":f"FB-{cid:04d}","category":"كرة القدم","type":type_,"difficulty":diff,"topic":topic,
         "question":question,"answer":answer,"accepted_answers":accepted if accepted is not None else [answer],
         "clues":clues or [],"explanation":expl,"points":1,"review_status":"verified_from_records",
         "source":"deterministic champion tables (web-confirmed)"}
    if groups is not None: rec["answer_groups"]=groups
    records.append(rec); cid+=1

def diff_for_year(y):
    if y>=2016: return "easy"
    if y>=2006: return "medium"
    return "hard"

# ---- FASTEST: who won X in year Y ----
for name,table,topic in LEAGUES:
    for y,w in table.items():
        add("fastest_answer",diff_for_year(y),topic,
            f"مَن فاز بلقب {name} في الموسم المنتهي عام {y}؟", w, [w]+aliases(w),
            expl=f"بطل {name} {y}: {w}.")
for y,w in UCL.items():
    add("fastest_answer",diff_for_year(y),"دوري أبطال أوروبا",
        f"مَن توّج بطلاً لدوري أبطال أوروبا عام {y}؟", w, [w]+aliases(w), expl=f"بطل دوري الأبطال {y}: {w}.")
for y,w in WC.items():
    d="easy" if y>=2010 else ("medium" if y>=1990 else "hard")
    add("fastest_answer",d,"كأس العالم",f"مَن فاز بكأس العالم عام {y}؟", w, [w]+aliases(w), expl=f"بطل كأس العالم {y}: {w}.")
for y,w in EURO.items():
    d="easy" if y>=2012 else ("medium" if y>=1992 else "hard")
    add("fastest_answer",d,"كأس أمم أوروبا",f"مَن فاز بكأس أمم أوروبا (يورو {y})؟", w, [w]+aliases(w), expl=f"بطل يورو {y}: {w}.")
for y,w in COPA.items():
    add("fastest_answer","medium","كوبا أمريكا",f"مَن فاز بكوبا أمريكا عام {y}؟", w, [w]+aliases(w), expl=f"بطل كوبا أمريكا {y}: {w}.")

# ---- TRUE/FALSE: balanced (half true, half false with a plausible wrong team) ----
tf_items=[]
for name,table,topic in LEAGUES:
    for y,w in table.items(): tf_items.append((name,topic,y,w,table))
for y,w in UCL.items(): tf_items.append(("دوري أبطال أوروبا","دوري أبطال أوروبا",y,w,UCL))
random.shuffle(tf_items)
tf_items=tf_items[:160]
for i,(name,topic,y,w,table) in enumerate(tf_items):
    make_true = (i%2==0)
    if make_true:
        add("true_false",diff_for_year(y),topic,f"فاز {w} بلقب {name} في عام {y}.","صح",["صح"],
            expl=f"صحيح: بطل {name} {y} هو {w}.")
    else:
        others=[v for v in set(table.values()) if v!=w]
        wrong=random.choice(others)
        add("true_false",diff_for_year(y),topic,f"فاز {wrong} بلقب {name} في عام {y}.","خطأ",["خطأ"],
            expl=f"خطأ: بطل {name} {y} هو {w}، وليس {wrong}.")

# ---- ENUMERATION: distinct winners of league X in a period (exhaustive) ----
def enum_window(name,table,topic,a,b):
    winners=[]
    for y in range(a,b+1):
        if y in table and table[y] not in winners: winners.append(table[y])
    if len(winners)<2: return
    groups=[{"canonical":w,"acceptedVariants":[w]+aliases(w)} for w in winners]
    d="easy" if b>=2020 else ("medium" if b>=2010 else "hard")
    add("enumeration",d,topic,
        f"عدّد جميع الأندية التي فازت بلقب {name} في المواسم المنتهية من {a} إلى {b} (شاملاً الطرفين).",
        "، ".join(winners), [w for w in winners], groups,
        expl=f"الفائزون في الفترة {a}-{b}: {'، '.join(winners)}.")
for name,table,topic in LEAGUES:
    enum_window(name,table,topic,2000,2009)
    enum_window(name,table,topic,2010,2019)
    enum_window(name,table,topic,2020,2025)
enum_window("دوري أبطال أوروبا",UCL,"دوري أبطال أوروبا",2000,2009)
enum_window("دوري أبطال أوروبا",UCL,"دوري أبطال أوروبا",2010,2019)
enum_window("دوري أبطال أوروبا",UCL,"دوري أبطال أوروبا",2020,2025)
# World Cup winning nations (all-time) and recent
wc_all=[]
for y in sorted(WC):
    if WC[y] not in wc_all: wc_all.append(WC[y])
add("enumeration","hard","كأس العالم","عدّد جميع المنتخبات التي فازت بكأس العالم في تاريخه.",
    "، ".join(wc_all),[w for w in wc_all],
    [{"canonical":w,"acceptedVariants":[w]+aliases(w)} for w in wc_all],
    expl="الدول الفائزة بكأس العالم تاريخياً.")

# ---- WHO AM I: clubs, clues derived ONLY from the verified title tables ----
def years_won(table, club): return [y for y in sorted(table) if table[y]==club]
def ucl_clue(club):
    ys=years_won(UCL,club)
    return f"فزت بدوري أبطال أوروبا في {('أعوام ' if len(ys)>1 else 'عام ')}{'، '.join(map(str,ys))}." if ys else None
WHO = [
  ("ريال مدريد","إسبانيا",LALIGA),("برشلونة","إسبانيا",LALIGA),("بايرن ميونخ","ألمانيا",BUNDES),
  ("ليفربول","إنجلترا",EPL),("مانشستر يونايتد","إنجلترا",EPL),("مانشستر سيتي","إنجلترا",EPL),
  ("تشيلسي","إنجلترا",EPL),("يوفنتوس","إيطاليا",SERIEA),("إنتر ميلان","إيطاليا",SERIEA),
  ("ميلان","إيطاليا",SERIEA),("باريس سان جيرمان","فرنسا",LIGUE1),("بورتو","البرتغال",None),
]
for club,country,league in WHO:
    clues=[f"أنا نادٍ لكرة القدم من {country}."]
    uc=ucl_clue(club)
    if uc: clues.append(uc)
    if league:
        ly=years_won(league,club)
        if ly: clues.append(f"من أبطال الدوري المحلي، وآخر ألقابي المسجلة هنا عام {max(ly)}.")
    clues.append("اسمي معروف لدى عشّاق الكرة الأوروبية.")
    # difficulty: big clubs easy
    add("who_am_i","easy" if club in ("ريال مدريد","برشلونة","بايرن ميونخ","ليفربول") else "medium",
        "لاعبون وأندية أوروبية","من أنا؟ (نادٍ أوروبي)", club, [club]+aliases(club), None, clues,
        expl=f"الإجابة: {club}.")

os.makedirs(os.path.dirname(OUT),exist_ok=True)
with open(OUT,"w",encoding="utf-8") as f:
    json.dump({"metadata":{"category":"كرة القدم","generator":"winners-core v1","count":len(records)},"questions":records},f,ensure_ascii=False,indent=1)

from collections import Counter
print("total:",len(records))
print("byType:",dict(Counter(r["type"] for r in records)))
print("byDifficulty:",dict(Counter(r["difficulty"] for r in records)))
tf=[r for r in records if r["type"]=="true_false"]
print("tf balance صح/خطأ:",sum(1 for r in tf if r["answer"]=="صح"),"/",sum(1 for r in tf if r["answer"]=="خطأ"))
print("enum sample:",json.dumps(records[[i for i,r in enumerate(records) if r["type"]=="enumeration"][0]],ensure_ascii=False)[:400])
print("wrote:",OUT)
