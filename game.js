/* ============================================================
   SHOCKER OWNZ GROW EMPIRE — vanilla JS grow-sim tycoon
   index.html + styles.css + game.js | GitHub Pages ready
   ============================================================ */
'use strict';
/* ============================================================================
   P3-W4 — AUTOMATION TECH TREE + FACILITY EXPANSION helpers
   ----------------------------------------------------------------------------
   Additive helpers for Wave 4. Facility indices 0-5 keep their meaning;
   new tiers are 6 (Breeding Lab), 7 (Project 0 Facility), 8 (Cultivation
   Empire). Every unlock below is REAL gameplay, never cosmetic.
   ============================================================================ */
function P3W4_facIdx(){ try{ return clamp(int(S.facility,0),0,FACILITIES.length-1); }catch(e){ return 0; } }
/* Breeding Lab: Mother & Clone Wing raises the mother-plant cap 4 -> 6 */
function P3W4_motherCapMax(){ try{ return int(S.facility,0)>=6?6:4; }catch(e){ return 4; } }
/* Cultivation Empire: Automation Nexus cuts automation operating costs 15% */
function P3W4_autoCostMult(){ try{ return int(S.facility,0)>=8?0.85:1; }catch(e){ return 1; } }
/* Breeding Lab: lab-grade precision, crosses hold +5 stability */
function P3W4_breedStabBonus(){ try{ return int(S.facility,0)>=6?5:0; }catch(e){ return 0; } }
/* Project 0 Facility: dry & cure rooms, +5 final harvest quality */
function P3W4_cureQualBonus(){ try{ return int(S.facility,0)>=7?5:0; }catch(e){ return 0; } }
/* Project 0 Facility: preservation lab, +25% P0 points on the preservation track */
function P3W4_p0Mult(track){ try{ return (track==='preservation'&&int(S.facility,0)>=7)?1.25:1; }catch(e){ return 1; } }
/* Cultivation Empire: dispensary flagship serves +6 customers/day */
function P3W4_budCapBonus(){ try{ return int(S.facility,0)>=8?6:0; }catch(e){ return 0; } }
function P3W4_missionDone(mid){ try{ return Array.isArray(S.missionsDone)&&S.missionsDone.indexOf(mid)>=0; }catch(e){ return false; } }
function P3W4_missionName(mid){ try{ var m=MISSIONS.find(function(x){return x.id===mid;}); return m?m.name:mid; }catch(e){ return mid; } }
/* Unlock menu per facility tier, for the facility cards (real effects only) */
function P3W4_facUnlocks(i){
  if(i===6) return [
    {ico:'mothers',t:'Mother & Clone Wing: mother cap 4 \u2192 6'},
    {ico:'dna',t:'Breeding precision: crosses hold +5 stability'},
    {ico:'keepers',t:'Vault Expansion Program: keeper vault up to 80 slots'}
  ];
  if(i===7) return [
    {ico:'project0',t:'P0 Preservation Lab: +25% Project 0 preservation points'},
    {ico:'drycure',t:'Dry & Cure Rooms: +5 final harvest quality'},
    {ico:'aicore',t:'Automation infrastructure: unlocks Advanced Grow AI'}
  ];
  if(i===8) return [
    {ico:'equipment',t:'Automation Nexus: \u221215% automation operating costs'},
    {ico:'customers',t:'Dispensary Flagship: +6 customers served per day'}
  ];
  return [];
}

/* ---------------- Constants ---------------- */
const SAVE_KEY = 'soge_save_v1';
const DIFFS = {
  beginner: { name:'BEGINNER', desc:'Forgiving environment, fewer pests, better prices. Learn the ropes.',
    cash:1000, pestMult:0.5, defMult:0.6, healthLoss:0.7, qualityMult:1.1, econMult:1.15, missionReward:1.0, envTol:1.4 },
  grower: { name:'GROWER', desc:'The standard grind. Balanced challenge and reward.',
    cash:750, pestMult:1.0, defMult:1.0, healthLoss:1.0, qualityMult:1.0, econMult:1.0, missionReward:1.25, envTol:1.0 },
  master: { name:'MASTER', desc:'Brutal. Thin margins, savage pests, but legends earn more.',
    cash:500, pestMult:1.8, defMult:1.6, healthLoss:1.5, qualityMult:0.9, econMult:0.9, missionReward:1.75, envTol:0.7 }
};
const STAGES = ['Seedling','Vegetative','Early Flower','Mid Flower','Late Flower','Harvest Ready'];
const FACILITIES = [
  { name:'Starter Tent',       slots:4,  cost:0 },
  { name:'Grow Room',          slots:8,  cost:2500 },
  { name:'Commercial Room',    slots:16, cost:9000 },
  { name:'Warehouse',          slots:32, cost:28000 },
  { name:'Genetics Laboratory',slots:48, cost:65000 },
  { name:'Preservation Vault', slots:64, cost:150000 },
  /* P3-W4 APPEND-ONLY: indices 0-5 above NEVER change meaning. New tiers 6-8. */
  { name:'Breeding Lab',       slots:80,  cost:300000 },
  { name:'Project 0 Facility', slots:96,  cost:600000 },
  { name:'Cultivation Empire', slots:128, cost:1200000 }
];
const EQUIP_DEFS = [
  { id:'lights',    name:'Lights',            ic:'light',   max:5, base:400,  desc:'+6% yield potential per level. Wider light tolerance.' },
  { id:'hvac',      name:'HVAC',              ic:'temp',    max:5, base:500,  desc:'+8% temperature tolerance per level.' },
  { id:'humid',     name:'Humidification',    ic:'humid',   max:5, base:300,  desc:'+8% low-humidity tolerance per level.' },
  { id:'dehumid',   name:'Dehumidification',  ic:'drop',    max:5, base:300,  desc:'+8% high-humidity tolerance per level.' },
  { id:'co2sys',    name:'CO2 System',        ic:'co2',     max:5, base:600,  desc:'+4% growth speed & yield per level.' },
  { id:'irrigation',name:'Irrigation',        ic:'water',   max:5, base:350,  desc:'Water drains 12% slower per level.' },
  { id:'nutrients', name:'Nutrient System',   ic:'feed',    max:5, base:350,  desc:'Nutrition drains 12% slower, feeding more effective.' },
  { id:'sensors',   name:'Env Sensors',       ic:'inspect', max:5, base:450,  desc:'Better problem detection. +2% quality per level.' },
  { id:'drycure',   name:'Dry/Cure Room',     ic:'jar',     max:5, base:700,  desc:'+3 harvest quality per level.' }
];
const CREW_DEFS = [
  { id:'assistant', name:'Grow Assistant',        ic:'grows',   hire:800,  wage:25, desc:'+5% growth speed.' },
  { id:'irrigation',name:'Irrigation Specialist',ic:'water',   hire:1200, wage:30, desc:'Water drains 30% slower.' },
  { id:'health',    name:'Plant Health Specialist',ic:'check',  hire:1500,wage:35, desc:'+health regen, fewer pests.' },
  { id:'breeder',   name:'Breeder',              ic:'genetics',hire:2500, wage:50, desc:'Better, more stable crosses.' },
  { id:'harvest',   name:'Harvest Crew',         ic:'harvest', hire:1000, wage:40, desc:'+6% harvest yield.' },
  { id:'manager',   name:'Facility Manager',     ic:'crew',    hire:3000, wage:75, desc:'-10% upgrade costs, +rep gains.' }
];
const COMP_TYPES = [
  { id:'flower',  name:'Best Flower',   ic:'leaf',    desc:'Highest quality flower wins.', score:'quality' },
  { id:'resin',   name:'Highest Resin', ic:'trophy',  desc:'Frostiest resin score wins.',  score:'resin' },
  { id:'terps',   name:'Best Terpenes', ic:'star',    desc:'Loudest terpene score wins.',  score:'terpenes' },
  { id:'yield',   name:'Largest Yield', ic:'harvest', desc:'Heaviest single harvest wins.',score:'yield' },
  { id:'overall', name:'Best Overall',  ic:'crown-gold', desc:'Combined excellence wins.', score:'overall' },
  { id:'breeder', name:'Breeder Cup',   ic:'genetics',desc:'Best custom cross wins.',      score:'breeder' }
];
const AI_NAMES = ['DankSinatra','TerpWizard','CannaQueen','GrowMastaFlex','BudProfessor','ResinRebel','ChronicClaus','PistilPete'];
const P0_TRACKS = [
  { id:'genetics',     name:'GENETICS',      ico:'genetics' },
  { id:'nocompromise', name:'NO COMPROMISE', ico:'warn' },
  { id:'preservation', name:'PRESERVATION',  ico:'preserve' },
  { id:'cultivation',  name:'CULTIVATION',   ico:'grow' },
  { id:'family',       name:'FAMILY',        ico:'crew' },
  { id:'freedom',      name:'FREEDOM',       ico:'star' },
  { id:'resin',        name:'RESIN',         ico:'trophy' },
  { id:'knowledge',    name:'KNOWLEDGE',     ico:'scroll' }
];
const P0_LEVEL_PTS = [0, 10, 25, 50, 90, 150]; // points to reach level index

/* ---------------- Strain library (34) ----------------
   stats: yld=yield, pot=potency, terp=terpenes, ft=flower days,
   stab=stability, resin, vigor. lock: {t:'rep'|'cash'|'mission', v} */
const STRAINS = [
 {id:'queens-revenge-s1',type:'hybrid',name:"Queen's Revenge S1",yld:82,pot:94,terp:90,ft:63,stab:88,resin:96,vigor:80,tags:['Gassy','Frosty','Exotic','Keeper'],seed:120,lock:{t:'rep',v:75}},
 {id:'slurricane-7',type:'indica',name:'Slurricane #7',yld:78,pot:88,terp:92,ft:60,stab:85,resin:90,vigor:82,tags:['Frosty','Fruit','Purple','Keeper'],seed:100,lock:{t:'rep',v:50}},
 {id:'gg4-s1',type:'hybrid',name:'GG4 S1',yld:85,pot:90,terp:84,ft:62,stab:90,resin:93,vigor:88,tags:['Gassy','Heavy','Resin Monster','Stable'],seed:90,lock:{t:'rep',v:50}},
 {id:'rks-s1',type:'indica',name:'RKS S1',yld:74,pot:86,terp:78,ft:65,stab:82,resin:84,vigor:76,tags:['Skunky','Old School','Heavy'],seed:85,lock:{t:'rep',v:25}},
 {id:'tangerine-tbone',type:'sativa',name:'Tangerine T-Bone',yld:80,pot:84,terp:95,ft:58,stab:86,resin:82,vigor:90,tags:['Fruit','Exotic','Fast'],seed:95,lock:{t:'rep',v:25}},
 {id:'northern-lights',type:'indica',name:'Northern Lights',yld:76,pot:78,terp:72,ft:55,stab:95,resin:78,vigor:92,tags:['Stable','Fast','Old School'],seed:40},
 {id:'blue-dream',type:'sativa',name:'Blue Dream BX',yld:88,pot:76,terp:80,ft:60,stab:90,resin:74,vigor:95,tags:['Fruit','Heavy','Stable'],seed:45},
 {id:'og-kush',type:'hybrid',name:'OG Kush IBL',yld:70,pot:89,terp:88,ft:64,stab:87,resin:88,vigor:74,tags:['Gassy','Old School','Keeper'],seed:70,lock:{t:'rep',v:25}},
 {id:'sour-diesel',type:'sativa',name:'Sour Diesel',yld:82,pot:85,terp:86,ft:68,stab:84,resin:80,vigor:90,tags:['Gassy','Skunky','Heavy'],seed:60,lock:{t:'rep',v:25}},
 {id:'granddaddy-purp',type:'indica',name:'Granddaddy Purp',yld:75,pot:82,terp:84,ft:58,stab:92,resin:82,vigor:80,tags:['Purple','Fruit','Stable'],seed:50},
 {id:'white-widow',type:'hybrid',name:'White Widow',yld:78,pot:84,terp:76,ft:56,stab:94,resin:92,vigor:88,tags:['Frosty','Resin Monster','Stable','Fast'],seed:55},
 {id:'pineapple-express',type:'hybrid',name:'Pineapple Express',yld:84,pot:78,terp:90,ft:57,stab:86,resin:76,vigor:93,tags:['Fruit','Fast','Heavy'],seed:48,lock:{t:'rep',v:50}},
 {id:'girl-scout-cookies',type:'hybrid',name:'Girl Scout Cookies',yld:72,pot:90,terp:89,ft:62,stab:83,resin:90,vigor:76,tags:['Exotic','Frosty','Keeper'],seed:75,lock:{t:'rep',v:50}},
 {id:'zkittlez',type:'indica',name:'Zkittlez',yld:74,pot:83,terp:96,ft:59,stab:81,resin:84,vigor:82,tags:['Fruit','Exotic','Purple'],seed:80,lock:{t:'rep',v:75}},
 {id:'gelato-33',type:'hybrid',name:'Gelato #33',yld:76,pot:88,terp:91,ft:60,stab:85,resin:89,vigor:80,tags:['Frosty','Exotic','Keeper'],seed:85,lock:{t:'rep',v:75}},
 {id:'wedding-cake',type:'indica',name:'Wedding Cake',yld:79,pot:87,terp:88,ft:61,stab:87,resin:91,vigor:82,tags:['Frosty','Gassy','Keeper'],seed:88,lock:{t:'rep',v:50}},
 {id:'runtz',type:'hybrid',name:'Runtz',yld:73,pot:86,terp:94,ft:58,stab:82,resin:87,vigor:84,tags:['Fruit','Exotic','Frosty'],seed:92,lock:{t:'rep',v:150}},
 {id:'apple-fritter',type:'hybrid',name:'Apple Fritter',yld:81,pot:85,terp:89,ft:60,stab:84,resin:86,vigor:85,tags:['Fruit','Frosty','Heavy'],seed:78,lock:{t:'rep',v:150}},
 {id:'ice-cream-cake',type:'indica',name:'Ice Cream Cake',yld:71,pot:87,terp:90,ft:62,stab:86,resin:90,vigor:75,tags:['Frosty','Exotic','Purple'],seed:82,lock:{t:'rep',v:200}},
 {id:'mac-1',type:'hybrid',name:'MAC 1',yld:70,pot:89,terp:87,ft:66,stab:88,resin:92,vigor:72,tags:['Exotic','Resin Monster','Keeper'],seed:110,lock:{t:'rep',v:150}},
 {id:'gmo-cookies',type:'indica',name:'GMO Cookies',yld:83,pot:91,terp:82,ft:64,stab:85,resin:89,vigor:80,tags:['Gassy','Skunky','Heavy'],seed:95,lock:{t:'rep',v:100}},
 {id:'tropicana-cookies',type:'sativa',name:'Tropicana Cookies',yld:77,pot:84,terp:93,ft:57,stab:83,resin:83,vigor:88,tags:['Fruit','Purple','Fast'],seed:90,lock:{t:'cash',v:500}},
 {id:'jealousy',type:'hybrid',name:'Jealousy',yld:75,pot:88,terp:92,ft:63,stab:84,resin:88,vigor:79,tags:['Exotic','Frosty','Gassy'],seed:105,lock:{t:'rep',v:200}},
 {id:'permanent-marker',type:'hybrid',name:'Permanent Marker',yld:72,pot:90,terp:89,ft:64,stab:80,resin:90,vigor:74,tags:['Gassy','Exotic','Resin Monster'],seed:115,lock:{t:'rep',v:250}},
 {id:'oreoz',type:'indica',name:'Oreoz',yld:74,pot:89,terp:85,ft:61,stab:82,resin:93,vigor:77,tags:['Frosty','Exotic','Purple'],seed:100,lock:{t:'cash',v:750}},
 {id:'gushers',type:'hybrid',name:'Gushers',yld:80,pot:84,terp:92,ft:59,stab:83,resin:85,vigor:86,tags:['Fruit','Exotic','Heavy'],seed:88,lock:{t:'rep',v:350}},
 {id:'sunset-sherbet',type:'indica',name:'Sunset Sherbet',yld:76,pot:85,terp:90,ft:60,stab:86,resin:87,vigor:83,tags:['Fruit','Frosty','Purple'],seed:80,lock:{t:'rep',v:100}},
 {id:'dosidos',type:'indica',name:'Do-Si-Dos',yld:78,pot:88,terp:86,ft:62,stab:87,resin:90,vigor:79,tags:['Gassy','Frosty','Heavy'],seed:85,lock:{t:'rep',v:75}},
 {id:'strawberry-cough',type:'sativa',name:'Strawberry Cough',yld:82,pot:79,terp:88,ft:58,stab:89,resin:76,vigor:91,tags:['Fruit','Fast','Stable'],seed:55,lock:{t:'rep',v:25}},
 {id:'chemdawg',type:'hybrid',name:'Chemdawg 91',yld:77,pot:89,terp:87,ft:66,stab:78,resin:86,vigor:82,tags:['Gassy','Skunky','Old School'],seed:95,lock:{t:'rep',v:120}},
 {id:'ak-47',type:'sativa',name:'AK-47',yld:86,pot:80,terp:75,ft:54,stab:93,resin:80,vigor:94,tags:['Fast','Stable','Heavy','Old School'],seed:42},
 {id:'super-silver-haze',type:'sativa',name:'Super Silver Haze',yld:84,pot:83,terp:82,ft:70,stab:85,resin:82,vigor:89,tags:['Old School','Heavy','Skunky'],seed:58,lock:{t:'rep',v:25}},
 {id:'project-zero-og',type:'hybrid',name:'Project Zero OG',yld:88,pot:96,terp:94,ft:65,stab:95,resin:98,vigor:90,tags:['Keeper','Resin Monster','Exotic','Gassy'],seed:500,lock:{t:'mission',v:'p0-50'}},
 {id:'crown-jewel',type:'hybrid',name:'Crown Jewel',yld:90,pot:95,terp:93,ft:64,stab:92,resin:97,vigor:88,tags:['Keeper','Resin Monster','Exotic','Frosty'],seed:750,lock:{t:'rep',v:500}}
];
function strainById(id){ return STRAINS.find(s=>s.id===id); }

/* ---------------- Missions (55, all track real variables) ----------------
   prog(s)->[cur,target]; reward {cash,rep,xp,gen:[strainIds],p0} */
const unlockedCount = s => STRAINS.filter(st=>!s.lockedStrains.includes(st.id)).length;
const MISSIONS = [
 // TUTORIAL
 {id:'tut-plant',cat:'Tutorial',name:'First Seed',desc:'Plant your first seed.',prog:s=>[Math.min(s.stats.plantsStarted,1),1],reward:{cash:50,xp:20}},
 {id:'tut-germ',cat:'Tutorial',name:'First Sprout',desc:'Germinate a seed into a seedling.',prog:s=>[Math.min(num(s.stats.sprouted,0),1),1],reward:{cash:50,xp:20}},
 {id:'tut-water',cat:'Tutorial',name:'Stay Hydrated',desc:'Water plants 5 times.',prog:s=>[Math.min(s.stats.waterings,5),5],reward:{cash:50,xp:20}},
 {id:'tut-days',cat:'Tutorial',name:'One Week In',desc:'Advance 7 days.',prog:s=>[Math.min(s.stats.daysAdvanced,7),7],reward:{cash:75,xp:30}},
 {id:'tut-harvest',cat:'Tutorial',name:'First Harvest',desc:'Complete your first harvest.',prog:s=>[Math.min(s.stats.harvests,1),1],reward:{cash:100,xp:50,p0:2}},
 {id:'tut-sell',cat:'Tutorial',name:'First Sale',desc:'Sell product at the dispensary.',prog:s=>[Math.min(s.stats.sales,1),1],reward:{cash:100,xp:50}},
 {id:'tut-upgrade',cat:'Tutorial',name:'First Upgrade',desc:'Buy any equipment level from the Equipment Depot.',prog:s=>[Math.min(s.stats.equipmentBought,1),1],reward:{cash:100,xp:50}},
 {id:'tut-dialin',cat:'Tutorial',name:'Dial It In',desc:'Hold temp (70-82F) and humidity (40-60%) in range for a full day.',prog:s=>[Math.min(s.stats.envInRangeDays,1),1],reward:{cash:100,xp:50}},
 // GROW CHALLENGES
 {id:'grow-healthy',cat:'Grow Challenges',name:'Vibrant',desc:'Harvest a plant at 90%+ health.',prog:s=>[Math.min(s.stats.highHealthHarvests,1),1],reward:{cash:150,xp:60}},
 {id:'grow-flawless',cat:'Grow Challenges',name:'Flawless Victory',desc:'Finish a grow with health never dropping below 80%.',prog:s=>[Math.min(s.stats.flawlessGrows,1),1],reward:{cash:300,xp:120,p0:2}},
 {id:'grow-16oz',cat:'Grow Challenges',name:'Sweet Sixteen',desc:'Harvest 16 oz total (lifetime).',prog:s=>[Math.min(Math.floor(s.stats.lifetimeHarvestOz),16),16],reward:{cash:250,xp:100}},
 {id:'grow-100oz',cat:'Grow Challenges',name:'Century Club',desc:'Harvest 100 oz total (lifetime).',prog:s=>[Math.min(Math.floor(s.stats.lifetimeHarvestOz),100),100],reward:{cash:600,xp:250,p0:3}},
 {id:'grow-concurrent',cat:'Grow Challenges',name:'Full House',desc:'Have 6 plants growing at once.',prog:s=>[Math.min(s.stats.maxConcurrent,6),6],reward:{cash:200,xp:80}},
 // STRAIN TRIALS
 {id:'strain-gg4',cat:'Strain Trials',name:'Glue Guy',desc:'Harvest GG4 S1.',prog:s=>[((s.stats.strainGrown['gg4-s1']||{}).count||0)>=1?1:0,1],reward:{cash:150,xp:60}},
 {id:'strain-qr',cat:'Strain Trials',name:'Royal Treatment',desc:'Harvest Queen\'s Revenge S1 at 85+ quality.',prog:s=>[((s.stats.strainGrown['queens-revenge-s1']||{}).best||0)>=85?1:0,1],reward:{cash:400,xp:150,gen:['oreoz']}},
 {id:'strain-slur',cat:'Strain Trials',name:'Slurricane Season',desc:'Harvest Slurricane #7 at 80+ quality.',prog:s=>[((s.stats.strainGrown['slurricane-7']||{}).best||0)>=80?1:0,1],reward:{cash:300,xp:120}},
 {id:'strain-rks',cat:'Strain Trials',name:'Skunk Hunt',desc:'Harvest RKS S1.',prog:s=>[((s.stats.strainGrown['rks-s1']||{}).count||0)>=1?1:0,1],reward:{cash:150,xp:60}},
 {id:'strain-ttb',cat:'Strain Trials',name:'Citrus Press',desc:'Harvest Tangerine T-Bone at 80+ quality.',prog:s=>[((s.stats.strainGrown['tangerine-tbone']||{}).best||0)>=80?1:0,1],reward:{cash:300,xp:120,gen:['tropicana-cookies']}},
 {id:'strain-20gen',cat:'Strain Trials',name:'Genetic Vault',desc:'Own 28 unlocked genetics.',prog:s=>[Math.min(ownedCount(s),28),28],reward:{cash:500,xp:200,p0:3}},
 // QUALITY CHALLENGES
 {id:'q-70',cat:'Quality Challenges',name:'Headstash',desc:'Harvest at 70+ quality.',prog:s=>[s.stats.bestQuality>=70?1:0,1],reward:{cash:150,xp:60}},
 {id:'q-85',cat:'Quality Challenges',name:'Top Shelf',desc:'Harvest at 85+ quality.',prog:s=>[s.stats.bestQuality>=85?1:0,1],reward:{cash:350,xp:140,p0:2}},
 {id:'q-92',cat:'Quality Challenges',name:'Connoisseur',desc:'Harvest at 92+ quality.',prog:s=>[s.stats.bestQuality>=92?1:0,1],reward:{cash:700,xp:280,p0:4}},
 {id:'q-10x80',cat:'Quality Challenges',name:'Consistency King',desc:'10 harvests at 80+ quality.',prog:s=>[Math.min(s.stats.q80Harvests,10),10],reward:{cash:800,xp:300,p0:3}},
 {id:'q-bag90',cat:'Quality Challenges',name:'Bag Appeal',desc:'Reach 90+ bag appeal on a harvest.',prog:s=>[s.stats.bestBagAppeal>=90?1:0,1],reward:{cash:400,xp:160}},
 // YIELD CHALLENGES
 {id:'y-8oz',cat:'Yield Challenges',name:'Heavy Hitter',desc:'Single harvest of 8+ oz.',prog:s=>[s.stats.biggestHarvest>=8?1:0,1],reward:{cash:300,xp:120}},
 {id:'y-10oz',cat:'Yield Challenges',name:'Yield Beast',desc:'Single harvest of 12+ oz.',prog:s=>[s.stats.biggestHarvest>=12?1:0,1],reward:{cash:600,xp:240}},
 {id:'y-250',cat:'Yield Challenges',name:'Quarter Pounder Empire',desc:'Harvest 250 oz lifetime.',prog:s=>[Math.min(Math.floor(s.stats.lifetimeHarvestOz),250),250],reward:{cash:1200,xp:450,p0:4}},
 {id:'y-process',cat:'Yield Challenges',name:'Lab Work',desc:'Process 20 oz into concentrates/edibles.',prog:s=>[Math.min(Math.floor(s.stats.processedOz),20),20],reward:{cash:400,xp:160}},
 // BREEDING
 {id:'br-1',cat:'Breeding',name:'Mad Scientist',desc:'Create your first cross.',prog:s=>[Math.min(s.stats.crosses,1),1],reward:{cash:200,xp:100,p0:3}},
 {id:'br-5',cat:'Breeding',name:'Pollen Chucker',desc:'Create 5 crosses.',prog:s=>[Math.min(s.stats.crosses,5),5],reward:{cash:500,xp:200,p0:4}},
 {id:'br-resin90',cat:'Breeding',name:'Frost Factory',desc:'Breed a custom strain with 90+ resin.',prog:s=>[s.customStrains.some(st=>st.resin>=90)?1:0,1],reward:{cash:450,xp:180,p0:3}},
 {id:'br-pot90',cat:'Breeding',name:'Potency Hunter',desc:'Breed a custom strain with 92+ potency.',prog:s=>[s.customStrains.some(st=>st.pot>=92)?1:0,1],reward:{cash:450,xp:180}},
 {id:'br-gen2',cat:'Breeding',name:'Second Generation',desc:'Use your own cross as a breeding parent.',prog:s=>[Math.min(s.stats.secondGenCrosses,1),1],reward:{cash:600,xp:250,p0:4}},
 {id:'br-5custom',cat:'Breeding',name:'Seed Bank',desc:'Own 5 custom crosses.',prog:s=>[Math.min(s.customStrains.length,5),5],reward:{cash:700,xp:280,p0:3}},
 // SPEED RUNS
 {id:'sp-60',cat:'Speed Runs',name:'Quick Flip',desc:'Seed to harvest in 60 days or less.',prog:s=>[s.stats.fastestGrow>0&&s.stats.fastestGrow<=60?1:0,1],reward:{cash:350,xp:150}},
 {id:'sp-3x120',cat:'Speed Runs',name:'Perpetual Motion',desc:'Complete 3 harvests by day 120.',prog:s=>[(s.stats.harvests>=3&&s.day<=120)?1:0,1],reward:{cash:600,xp:250}},
 {id:'sp-turn',cat:'Speed Runs',name:'Seed To Sale',desc:'Plant, harvest and sell a plant within 75 days.',prog:s=>[Math.min(s.stats.quickTurnarounds,1),1],reward:{cash:500,xp:200}},
 // HARD MODE
 {id:'hm-1',cat:'Hard Mode',name:'Trial By Fire',desc:'Complete a harvest on MASTER difficulty.',prog:s=>[(s.difficulty==='master'&&s.stats.harvests>=1)?1:0,1],reward:{cash:400,xp:200}},
 {id:'hm-85',cat:'Hard Mode',name:'Master Quality',desc:'Harvest 85+ quality on MASTER.',prog:s=>[(s.difficulty==='master'&&s.stats.bestQuality>=85)?1:0,1],reward:{cash:900,xp:400,p0:4}},
 {id:'hm-5',cat:'Hard Mode',name:'Iron Grower',desc:'5 harvests on MASTER difficulty.',prog:s=>[(s.difficulty==='master'?Math.min(s.stats.harvests,5):0),5],reward:{cash:1200,xp:500,p0:5}},
 {id:'hm-rep',cat:'Hard Mode',name:'Master Reputation',desc:'Reach 300 reputation on MASTER.',prog:s=>[(s.difficulty==='master'?Math.min(s.reputation,300):0),300],reward:{cash:800,xp:350}},
 // EMPIRE
 {id:'em-light',cat:'Empire',name:'Let There Be Light',desc:'Upgrade lights to level 2.',prog:s=>[Math.min(s.equipment.lights,2)>=2?1:0,1],reward:{cash:200,xp:80}},
 {id:'em-expand',cat:'Empire',name:'Room To Grow',desc:'Expand beyond the Starter Tent.',prog:s=>[s.facility>=1?1:0,1],reward:{cash:300,xp:120}},
 {id:'em-crew1',cat:'Empire',name:'First Hire',desc:'Hire your first crew member.',prog:s=>[Object.values(s.crew).filter(Boolean).length>=1?1:0,1],reward:{cash:250,xp:100}},
 {id:'em-crew3',cat:'Empire',name:'Full Team',desc:'Employ 3 crew members.',prog:s=>[Math.min(Object.values(s.crew).filter(Boolean).length,3),3],reward:{cash:600,xp:240}},
 {id:'em-warehouse',cat:'Empire',name:'Warehouse Mogul',desc:'Own the Warehouse facility.',prog:s=>[s.facility>=3?1:0,1],reward:{cash:1000,xp:400,p0:3}},
 {id:'em-maxequip',cat:'Empire',name:'Maxed Out',desc:'Max any equipment to level 5.',prog:s=>[Object.values(s.equipment).some(l=>l>=5)?1:0,1],reward:{cash:900,xp:350}},
 // COMPETITIONS
 {id:'cp-enter',cat:'Competitions',name:'Enter The Arena',desc:'Enter your first competition.',prog:s=>[Math.min(s.stats.compsEntered,1),1],reward:{cash:150,xp:80}},
 {id:'cp-win',cat:'Competitions',name:'Champion',desc:'Win a competition.',prog:s=>[Math.min(s.stats.compsWon,1),1],reward:{cash:600,xp:250,p0:3}},
 {id:'cp-win3',cat:'Competitions',name:'Dynasty',desc:'Win 3 competitions.',prog:s=>[Math.min(s.stats.compsWon,3),3],reward:{cash:1500,xp:500,p0:5}},
 {id:'cp-breeder',cat:'Competitions',name:'Breeder Cup Glory',desc:'Win the Breeder Cup.',prog:s=>[s.stats.breederCupWins>=1?1:0,1],reward:{cash:2000,xp:700,p0:6,gen:['crown-jewel']}},
 // SEASONAL
 {id:'se-day100',cat:'Seasonal',name:'Centennial',desc:'Reach day 100.',prog:s=>[Math.min(s.day,100)>=100?1:0,1],reward:{cash:500,xp:200}},
 {id:'se-25m',cat:'Seasonal',name:'Overachiever',desc:'Complete 25 missions.',prog:s=>[Math.min(s.stats.missionsDone,25),25],reward:{cash:1000,xp:400,p0:4}},
 {id:'se-lvl10',cat:'Seasonal',name:'Empire Builder',desc:'Reach player level 10.',prog:s=>[Math.min(s.level,10),10],reward:{cash:800,xp:300}},
 // PROJECT 0
 {id:'p0-50',cat:'Project 0',name:'True Believer',desc:'Earn 50 Project 0 points.',prog:s=>[Math.min(s.project0.points,50),50],reward:{cash:600,xp:250,gen:['project-zero-og']}},
 {id:'p0-track',cat:'Project 0',name:'Devoted',desc:'Reach level 3 in any Project 0 track.',prog:s=>[P0_TRACKS.some(tr=>p0Level(tr.id)>=3)?1:0,1],reward:{cash:700,xp:300,p0:5}},
 {id:'p0-vault',cat:'Project 0',name:'The Vault',desc:'Own the Preservation Vault.',prog:s=>[s.facility>=5?1:0,1],reward:{cash:1500,xp:600,p0:8}},
 /* P3-W4: new facility tiers — appended, never renumbered */
 {id:'em-breedlab',cat:'Empire',name:'Breeding Grounds',desc:'Own the Breeding Lab facility.',prog:s=>[s.facility>=6?1:0,1],reward:{cash:3000,xp:1200,p0:10}},
 {id:'em-p0fac',cat:'Empire',name:'Project 0 HQ',desc:'Own the Project 0 Facility.',prog:s=>[s.facility>=7?1:0,1],reward:{cash:6000,xp:2000,p0:15}},
 {id:'em-empire',cat:'Empire',name:'Cultivation Empire',desc:'Own the Cultivation Empire.',prog:s=>[s.facility>=8?1:0,1],reward:{cash:12000,xp:4000,p0:25}},
 {id:'p0-keepers',cat:'Project 0',name:'Keeper Hunter',desc:'Discover 3 keeper phenotypes (90+ quality harvests).',prog:s=>[Math.min(s.stats.keepers,3),3],reward:{cash:900,xp:350,p0:6}},
 // PHENO HUNT
 {id:'ph-5pheno',cat:'Pheno Hunt',name:'Population Study',desc:'Test 5 phenotypes of a single strain.',prog:s=>[Math.min(maxPhenoTested(s),5),5],reward:{cash:250,xp:100,p0:2}},
 {id:'ph-hunt10',cat:'Pheno Hunt',name:'The Hunt',desc:'Complete a 10-seed pheno hunt.',prog:s=>[Math.min(s.stats.huntsCompleted10,1),1],reward:{cash:600,xp:250,p0:4}},
 {id:'ph-keeper1',cat:'Pheno Hunt',name:'First Keeper',desc:'Mark your first keeper phenotype.',prog:s=>[Math.min(s.stats.keepersFound,1),1],reward:{cash:400,xp:150,p0:4}},
 {id:'ph-85',cat:'Pheno Hunt',name:'Keeper Candidate',desc:'Discover a phenotype scoring 85+.',prog:s=>[s.stats.bestPhenoScore>=85?1:0,1],reward:{cash:350,xp:140,p0:2}},
 {id:'ph-90',cat:'Pheno Hunt',name:'Elite Material',desc:'Discover a phenotype scoring 90+.',prog:s=>[s.stats.bestPhenoScore>=90?1:0,1],reward:{cash:700,xp:280,p0:4}},
 {id:'ph-elite',cat:'Pheno Hunt',name:'Elite Genetics',desc:'Discover an ELITE rarity phenotype.',prog:s=>[Math.min(s.stats.eliteFound,1),1],reward:{cash:800,xp:300,p0:5}},
 {id:'ph-leg',cat:'Pheno Hunt',name:'Unicorn Hunter',desc:'Discover a LEGENDARY phenotype.',prog:s=>[Math.min(s.stats.legendaryFound,1),1],reward:{cash:2000,xp:700,p0:8}},
 {id:'ph-mother',cat:'Pheno Hunt',name:'Mother Knows Best',desc:'Promote a keeper to mother plant.',prog:s=>[Math.min(s.stats.mothersCreated,1),1],reward:{cash:500,xp:200,p0:4}},
 {id:'ph-clone',cat:'Pheno Hunt',name:'Copy Paste',desc:'Take your first clone.',prog:s=>[Math.min(s.stats.clonesTaken,1),1],reward:{cash:300,xp:120,p0:2}},
 {id:'ph-cloneharv',cat:'Pheno Hunt',name:'Proven Genetics',desc:'Harvest a clone.',prog:s=>[Math.min(s.stats.cloneHarvests,1),1],reward:{cash:400,xp:160,p0:3}},
 {id:'ph-keeper5x',cat:'Pheno Hunt',name:'Workhorse',desc:'Harvest the same keeper clone 5 times.',prog:s=>[Math.min(s.stats.provenCut,5),5],reward:{cash:900,xp:350,p0:5}},
 {id:'ph-compare',cat:'Pheno Hunt',name:'Side By Side',desc:'Compare two phenotypes.',prog:s=>[Math.min(s.stats.comparesDone,1),1],reward:{cash:200,xp:80}},
 {id:'ph-vaultfull',cat:'Pheno Hunt',name:'No Room At The Top',desc:'Fill your keeper vault completely.',prog:s=>[Math.min(s.stats.vaultFilledOnce,1),1],reward:{cash:500,xp:200}},
 {id:'ph-capup',cat:'Pheno Hunt',name:'Expanding The Vault',desc:'Upgrade keeper vault capacity.',prog:s=>[Math.min(s.stats.keeperCapUpgrades,1),1],reward:{cash:600,xp:240}},
 {id:'ph-5strains',cat:'Pheno Hunt',name:'Living Library',desc:'Keep phenotypes of 5 different strains.',prog:s=>[Math.min(keeperStrainCount(s),5),5],reward:{cash:1000,xp:400,p0:6}}
];
const ACHIEVEMENTS = [
 {id:'a-cash10k',name:'💰 Money Moves',desc:'Hold $10,000 cash.',t:s=>s.cash>=10000},
 {id:'a-rep500',name:'⭐ Local Legend',desc:'Reach 500 reputation.',t:s=>s.reputation>=500},
 {id:'a-q95',name:'💎 Diamond Standard',desc:'Harvest 95+ quality.',t:s=>s.stats.bestQuality>=95},
 {id:'a-oz500',name:'⚖️ Half Kay',desc:'Harvest 500 oz lifetime.',t:s=>s.stats.lifetimeHarvestOz>=500},
 {id:'a-cross10',name:'🧬 Geneticist',desc:'Create 10 crosses.',t:s=>s.stats.crosses>=10},
 {id:'a-comp5',name:'🏆 Cup Collector',desc:'Win 5 competitions.',t:s=>s.stats.compsWon>=5},
 {id:'a-p0100',name:'🕊️ Project Zero',desc:'Earn 100 Project 0 points.',t:s=>s.project0.points>=100},
 {id:'a-lvl15',name:'👑 Empire Royalty',desc:'Reach level 15.',t:s=>s.level>=15},
 {id:'a-day365',name:'📅 One Year Deep',desc:'Reach day 365.',t:s=>s.day>=365},
 {id:'a-allstrain',name:'🌿 Living Library',desc:'Unlock every strain.',t:s=>STRAINS.every(st=>!s.lockedStrains.includes(st.id))},
 {id:'a-firstkeeper',name:'👑 First Keeper',desc:'Mark your first keeper phenotype.',t:s=>s.stats.keepersFound>=1},
 {id:'a-phenohunter',name:'🧬 Pheno Hunter',desc:'Test 25 phenotypes.',t:s=>s.stats.phenoTested>=25},
 {id:'a-selpress',name:'🔬 Selection Pressure',desc:'Test 100 phenotypes.',t:s=>s.stats.phenoTested>=100},
 {id:'a-elitegen',name:'💎 Elite Genetics',desc:'Discover an ELITE phenotype.',t:s=>s.stats.eliteFound>=1},
 {id:'a-unicorn',name:'🦄 Unicorn Hunter',desc:'Discover a LEGENDARY phenotype.',t:s=>s.stats.legendaryFound>=1},
 {id:'a-pres10',name:'🏦 Preservationist',desc:'Maintain 10 keepers in the vault.',t:s=>s.keepers.length>=10},
 {id:'a-provencut',name:'✂️ Proven Cut',desc:'Harvest the same keeper clone 10 times.',t:s=>s.stats.provenCut>=10}
];
/* P0 track level rewards */
const P0_REWARDS = {
 genetics:{3:{gen:['project-zero-og']},5:{title:'🧬 Preservationist'}},
 nocompromise:{3:{cash:500},5:{title:'💪 No Compromise'}},
 preservation:{3:{gen:['oreoz']},5:{title:'🏦 Vault Keeper'}},
 cultivation:{3:{cash:750,gen:['super-silver-haze']},5:{title:'🌱 Master Cultivator'}},
 family:{3:{rep:50},5:{title:'❤️ Family First'}},
 freedom:{3:{cash:500},5:{title:'🕊️ Free Grower'}},
 resin:{3:{gen:['mac-1']},5:{title:'💎 Resin Royalty'}},
 knowledge:{3:{xp:300},5:{title:'📚 Grow Scholar'}}
};

/* ---------------- State ---------------- */
let S = null;
function defaultState(){
  const locked = STRAINS.filter(st=>st.lock).map(st=>st.id);
  return {
    version:3, cash:0, reputation:0, xp:0, level:1, day:1, difficulty:'beginner',
    started:false,
    ty:TY_defaultTy(),
    env:{ light:80, temp:76, humidity:52, co2:900 },
    plants:[], nextPlantId:1,
    inventory:[], nextInvId:1,
    equipment:{ lights:1,hvac:1,humid:1,dehumid:1,co2sys:1,irrigation:1,nutrients:1,sensors:1,drycure:1 },
    facility:0,
    crew:{ assistant:false,irrigation:false,health:false,breeder:false,harvest:false,manager:false },
    lockedStrains:locked,
    strainOwned:{},
    customStrains:[],
    codexHist:{}, /* P2-W2: Living Codex - per-strain player history (migration-safe) */
    missionsDone:[], missionSeen:[], tutTeaseFired:false, chains:{}, /* P1.5, P2.3 */
    project0:{ points:0, tracks:{genetics:0,nocompromise:0,preservation:0,cultivation:0,family:0,freedom:0,resin:0,knowledge:0}, titles:[] },
    p0vault:{}, /* P3-W3: per-genetic Project 0 preservation tiers (CANDIDATE..LEGACY) */
    msDone:{}, /* P3-W6: major-milestone ledger (id -> {day}) - exactly-once, save-safe */
    stats:{ plantsStarted:0,waterings:0,feedings:0,trainings:0,inspects:0,daysAdvanced:0,harvests:0,
      lifetimeHarvestOz:0,lifetimeRevenue:0,bestQuality:0,bestBagAppeal:0,biggestHarvest:0,
      q80Harvests:0,highHealthHarvests:0,flawlessGrows:0,keepers:0,fastestGrow:0,quickTurnarounds:0,
      crosses:0,secondGenCrosses:0,compsEntered:0,compsWon:0,breederCupWins:0,sales:0,processedOz:0,
      missionsDone:0,maxConcurrent:0,strainGrown:{},preserved:0,
      phenoTested:0,phenoHarvested:0,eliteFound:0,legendaryFound:0,clonesTaken:0,cloneHarvests:0,
      phenoHuntsDone:0,huntsCompleted10:0,keepersFound:0,mothersCreated:0,comparesDone:0,
      keeperCapUpgrades:0,vaultFilledOnce:0,provenCut:0,bestPhenoScore:0,
      equipmentBought:0,envInRangeDays:0 }, /* P1.5 */
    achievements:[],
    titles:[],
    /* --- Phenotype / keeper system --- */
    phenoCounters:{},
    keepers:[], keeperCapacity:3, keeperCapLevel:0,
    mothers:[], motherCapacity:1,
    phenoHunts:[], phenoHistory:{}, phenoArchive:[],
    keeperCloneRuns:{},
    /* --- Expansion namespaces (Builder A/B/C): legacy saves get safe defaults in normalizeState --- */
    wx:{ events:[], cool:{}, market:{}, mday:1, offers:[], contracts:[], chDone:0,
         chal:{daily:null,weekly:null,hist:[]}, cday:1, stats:{contractsDone:0} },
    gx:{strainMeta:{},lineage:{},mutLog:[],grades:0},
    ex:EX_defaultEx()
  };
}
function allStrains(){ return STRAINS.concat(S.customStrains); }
function getStrain(id){ return allStrains().find(s=>s.id===id); }
function isUnlocked(id){ return !S.lockedStrains.includes(id); }
/* first-acquisition tracking: strainId -> day the player actually acquired it
   (seeds first bought, or unlocked through play). Powers every "Own X genetics" counter. */
function markStrainOwned(id){
  if(!id) return;
  try{
    if(!S.strainOwned||typeof S.strainOwned!=='object') S.strainOwned={};
    if(!S.strainOwned[id]) S.strainOwned[id]=Math.max(1,int(S.day,1));
  }catch(e){}
  try{ codexOnAcquired(id); }catch(e){} /* P2-W2: stamp codex acquisition */
}
function ownedCount(s){
  s=(s&&typeof s==='object')?s:S;
  let n=0;
  try{
    const ow=(s.strainOwned&&typeof s.strainOwned==='object')?s.strainOwned:{};
    STRAINS.forEach(st=>{ if(ow[st.id]) n++; });
    n+=(s.customStrains||[]).length; /* bred crosses are owned by construction */
  }catch(e){}
  return n;
}
/* mission-lock reference for lock reasons; null when the id is unknown */
function lockMissionName(v){ try{ const m=MISSIONS.find(m=>m.id===v); return m?m.name:null; }catch(e){ return null; } }
function lockReasonText(l,seedPrice){
  if(!l) return 'Locked genetics';
  if(l.t==='rep') return 'Unlocks at '+l.v+' reputation';
  if(l.t==='cash') return 'Buy for '+fmt$(seedPrice);
  const mn=lockMissionName(l.v);
  return mn?('Complete the Project 0 mission \u201c'+mn+'\u201d'):'Unlock via Project 0 mission';
}
/* mission-locked strains hide their name as ??? until unlocked (discovery tease) */
function strainDisplayName(st){
  try{ if(st&&st.lock&&st.lock.t==='mission'&&!isUnlocked(st.id)) return '???'; }catch(e){}
  return st?st.name:'???';
}

/* ================= P2-W2 LIVING CODEX: per-strain player history =================
   S.codexHist maps strainId -> the player's relationship record with that genetic.
   Deliberately separate from:
     S.lockedStrains     (availability / unlock route)
     S.strainOwned       (first-acquisition state)
     S.stats.strainGrown (harvest aggregates) and S.phenoHistory (evaluation counters)
   States stay separate: database != discovered != unlocked != owned != grown != harvested != bred. */
function codexHist(id){
  try{
    if(!id) return null;
    if(!S.codexHist||typeof S.codexHist!=='object') S.codexHist={};
    let h=S.codexHist[id];
    if(!h||typeof h!=='object') h=S.codexHist[id]={};
    h.acquiredDay=Math.max(0,int(h.acquiredDay,0));
    ['grown','harvested','phenosEvaluated','crossesCreated','completedDay'].forEach(k=>{ h[k]=Math.max(0,int(h[k],0)); });
    ['bestYield','bestPotency','bestTerpene','bestResin','keeperPhenoOverall'].forEach(k=>{ h[k]=Math.max(0,num(h[k],0)); });
    if(!Array.isArray(h.genNotes)) h.genNotes=[];
    else h.genNotes=h.genNotes.filter(n=>typeof n==='string').slice(-24);
    if(typeof h.keeperPheno!=='string') h.keeperPheno=null;
    h.completed=!!h.completed;
    return h;
  }catch(e){ return null; }
}
/* mystery-entry clue: hint mapped to the strain's actual lock route, never a spoiler */
function codexClue(st){
  try{
    const l=st&&st.lock;
    if(!l) return null;
    if(typeof l.clue==='string'&&l.clue) return l.clue; /* data-driven override */
    if(l.t==='rep') return 'Rumored among elite breeders. Reach the required reputation.';
    if(l.t==='cash') return 'Reserved stock \u2014 cash opens this door.';
    if(l.t==='mission') return 'Complete a Project 0 cultivation challenge.';
    if(l.t==='breed') return 'Discover through breeding.';
    if(l.t==='hunt') return 'Complete a phenotype hunt.';
    return 'Locked genetics.';
  }catch(e){ return 'Locked genetics.'; }
}
/* codex entry completion: owned + grown + harvested. Exactly-once toast; silent for backfill. */
function codexCheckComplete(id,silent){
  try{
    const h=codexHist(id); if(!h||h.completed) return false;
    let owned=!!(S.strainOwned&&S.strainOwned[id]);
    if(!owned){ try{ const cs=getStrain(id); owned=!!(cs&&cs.custom); }catch(e){} } /* bred crosses are owned by construction */
    if(owned&&h.grown>0&&h.harvested>0){
      h.completed=true; h.completedDay=Math.max(1,int(S.day,1));
      if(!silent){
        const st=getStrain(id);
        toast(icon('crown-gold','ge-ic-md')+' <b>CODEX COMPLETE</b> \u2014 '+esc(st?st.name:id)+' fully documented. The archive remembers.');
      }
      return true;
    }
  }catch(e){}
  return false;
}
/* stamping helpers - called at the correct lifecycle points only */
function codexOnAcquired(id){ try{ const h=codexHist(id); if(h&&!h.acquiredDay){ h.acquiredDay=Math.max(1,int(S.day,1)); } codexCheckComplete(id); }catch(e){} }
function codexOnGrown(id){ try{ const h=codexHist(id); if(!h) return; h.grown++; h.phenosEvaluated++; codexCheckComplete(id); }catch(e){} }
function codexOnHarvest(id,rec){
  try{
    const h=codexHist(id); if(!h) return;
    h.harvested++;
    if(rec&&typeof rec==='object'){
      h.bestYield=Math.max(h.bestYield,num(rec.yieldOz,0));
      h.bestPotency=Math.max(h.bestPotency,num(rec.potency,0));
      h.bestTerpene=Math.max(h.bestTerpene,num(rec.terpenes,0));
      h.bestResin=Math.max(h.bestResin,num(rec.resin,0));
    }
    codexCheckComplete(id);
  }catch(e){}
}
function codexOnKeeper(strainId,k,silent){
  try{
    const h=codexHist(strainId); if(!h||!k) return;
    const ov=num(k.overall,0), ref='PHENO #'+int(k.phenoNum,0);
    if(!h.keeperPheno||ov>h.keeperPhenoOverall){ h.keeperPheno=ref; h.keeperPhenoOverall=ov; }
    codexCheckComplete(strainId,silent);
  }catch(e){}
}
function codexOnBreedParent(parentId,childName){
  try{ const h=codexHist(parentId); if(!h) return; h.crossesCreated++;
    codexNote(parentId,'Bred into \u201c'+String(childName||'Untitled Cross').slice(0,28)+'\u201d'); }catch(e){}
}
function codexNote(id,note){
  try{
    const h=codexHist(id); if(!h||!note) return;
    h.genNotes.push('Day '+Math.max(1,int(S.day,1))+': '+String(note).slice(0,120));
    if(h.genNotes.length>24) h.genNotes=h.genNotes.slice(-24);
  }catch(e){}
}
function unlockStrain(id, acquired=false){
  if(!S.lockedStrains.includes(id)) return false;
  S.lockedStrains = S.lockedStrains.filter(x=>x!==id);
  if(acquired) markStrainOwned(id); /* QA: availability != owned — stamp only on genuine acquisition */
  const st = getStrain(id);
  toast(icon('dna','ge-ic-md')+' Unlocked genetics: '+(st?st.name:id));
  try{ NT_onStrainUnlock(id); }catch(e){} /* P1.6: strain unlock -> grow-it-now (read-only) */
  return true;
}

/* Scrub a loaded/imported state: missing or invalid numerics become safe defaults.
   Old saves never require a manual reset. */
function normalizeState(){
  if(!S||typeof S!=='object') S=defaultState();
  S.cash=num(S.cash,0); S.reputation=int(S.reputation,0);
  S.xp=num(S.xp,0); S.level=Math.max(1,int(S.level,1)); S.day=Math.max(1,int(S.day,1));
  if(typeof FACILITIES!=='undefined') S.facility=clamp(int(S.facility,0),0,FACILITIES.length-1);
  const st=(S.stats&&typeof S.stats==='object')?S.stats:{};
  ['plantsStarted','sprouted','waterings','feedings','trainings','inspects','daysAdvanced','harvests',
   'lifetimeHarvestOz','lifetimeRevenue','bestQuality','bestBagAppeal','biggestHarvest',
   'q80Harvests','highHealthHarvests','flawlessGrows','keepers','fastestGrow','quickTurnarounds',
   'crosses','secondGenCrosses','compsEntered','compsWon','breederCupWins','sales','processedOz',
   'missionsDone','maxConcurrent','preserved','equipmentBought','envInRangeDays','chainsDone'].forEach(k=>{ st[k]=num(st[k],0); }); /* P1.5, P2.3 */
  if(!st.strainGrown||typeof st.strainGrown!=='object') st.strainGrown={};
  S.stats=st;
  const e=(S.env&&typeof S.env==='object')?S.env:{};
  e.light=clamp(num(e.light,80),0,100); e.temp=clamp(num(e.temp,76),50,100);
  e.humidity=clamp(num(e.humidity,52),0,100); e.co2=clamp(num(e.co2,900),300,2000);
  S.env=e;
  /* QA GE-603: sanitize equipment — corrupt values poison harvest/env math */
  if(!S.equipment||typeof S.equipment!=='object') S.equipment={};
  ["lights","hvac","humid","dehumid","co2sys","irrigation","nutrients","sensors","drycure"].forEach(k=>{
    S.equipment[k]=clamp(int(S.equipment[k],1),1,9);
  });
  if(!S.crew||typeof S.crew!=='object'||Array.isArray(S.crew)) S.crew={};
  ["assistant","irrigation","health","breeder","harvest","manager"].forEach(k=>{ S.crew[k]=!!S.crew[k]; });
  try{ if(typeof P3W5_migrate==='function') P3W5_migrate(); }catch(e){} /* P3-W5: people+business state (save-safe) */
  try{ if(typeof MS_backfill==='function') MS_backfill(); }catch(e){} /* P3-W6: milestone backfill - silent, legacy saves */
  /* QA GE-506: a corrupt difficulty bricks advanceDay — fall back to grower */
  if(typeof DIFFS==='undefined'||!DIFFS[S.difficulty]) S.difficulty='grower';
  if(!Array.isArray(S.plants)) S.plants=[];
  /* QA GE-602: drop poisoned entries before per-item scrub — one null must not nuke the save */
  S.plants=S.plants.filter(p=>p&&typeof p==='object');
  if(!Array.isArray(S.inventory)) S.inventory=[];
  S.inventory=S.inventory.filter(it=>it&&typeof it==='object');
  /* GE-DP-502: sanitize inventory economics. Tampered NaN/negative/zero amounts
     or NaN quality fields poison cash math (NaN cash bricks the save; negative
     amounts deducted cash on sale). Drop poisoned stacks, clamp quality
     numerics. Never grants: stacks can only shrink or vanish. */
  S.inventory.forEach(it=>{
    it.amount=num(it.amount,0);
    ['quality','potency','terpenes','bagAppeal','resin'].forEach(k=>{ it[k]=clamp(num(it[k],50),0,100); });
  });
  S.inventory=S.inventory.filter(it=>it.amount>0);
  if(!Array.isArray(S.titles)) S.titles=[];
  if(!Array.isArray(S.achievements)) S.achievements=[];
  if(!Array.isArray(S.missionsDone)) S.missionsDone=[];
  if(!Array.isArray(S.missionSeen)) S.missionSeen=[];
  S.plants.forEach(p=>{ p.health=clamp(num(p.health,100),0,100); p.water=clamp(num(p.water,70),0,100);
    p.nutrition=clamp(num(p.nutrition,70),0,100); p.stress=clamp(num(p.stress,0),0,100);
    p.day=int(p.day,p.stage===-1?0:1); p.germ=num(p.germ,0); /* P1.1: stage -1 (germination) must survive sanitize */
    p.qualityPotential=clamp(num(p.qualityPotential,50),0,100);
    /* QA GE-DP-201: legacy plants predate the new-plant field set (plantSeed) — backfill so
       advanceDay/render/event paths treat them exactly like new plants (no crash, no NaN math) */
    if(!Array.isArray(p.problems)) p.problems=[];
    p.trained=!!p.trained;
    if(!Number.isFinite(p.minHealth)) p.minHealth=Math.min(100,num(p.health,100));
    p.growthBoost=num(p.growthBoost,0); });
  if(!Array.isArray(S.inventory)) S.inventory=[];
  S.nextPlantId=Math.max(1,int(S.nextPlantId,1)); S.nextInvId=Math.max(1,int(S.nextInvId,1));
  /* QA GE-DP-202: legacy saves may lack (or under-report) the id counters — derive from the
     highest existing entity id so newly created plants/inventory can never collide with
     migrated ones. Counters only ever move up, never down. */
  try{
    let mp=0; S.plants.forEach(p=>{ mp=Math.max(mp,int(p&&p.id,0)); });
    if(mp>=S.nextPlantId) S.nextPlantId=mp+1;
    let mi=0; S.inventory.forEach(it=>{ mi=Math.max(mi,int(it&&it.id,0)); });
    if(mi>=S.nextInvId) S.nextInvId=mi+1;
  }catch(e){}
  /* --- Phenotype / keeper fields (legacy saves get safe defaults) --- */
  if(!S.phenoCounters||typeof S.phenoCounters!=='object') S.phenoCounters={};
  Object.keys(S.phenoCounters).forEach(k=>{ S.phenoCounters[k]=Math.max(0,int(S.phenoCounters[k],0)); });
  if(!Array.isArray(S.keepers)) S.keepers=[];
  S.keepers=S.keepers.filter(k=>k&&typeof k==='object');
  S.keeperCapacity=Math.max(1,int(S.keeperCapacity,3)); S.keeperCapLevel=clamp(int(S.keeperCapLevel,0),0,KEEPER_CAPS.length-1); /* P3-W4: additive */
  if(!Array.isArray(S.mothers)) S.mothers=[];
  S.mothers=S.mothers.filter(m=>m&&typeof m==='object');
  S.motherCapacity=clamp(int(S.motherCapacity,1),1,P3W4_motherCapMax()); /* P3-W4: 6 with Breeding Lab */
  if(!Array.isArray(S.phenoHunts)) S.phenoHunts=[];
  /* P3-W1 deep breeding: migration-safe tracking fields on custom strains (save v3) */
  if(!Array.isArray(S.customStrains)) S.customStrains=[];
  S.customStrains.forEach(s=>{ try{ P3B_backfillCustom(s); }catch(e){} });
  S.customStrains.forEach(s=>{ try{ P3W2_backfillCustom(s); }catch(e){} }); /* P3-W2: ceremony/p0/lineage fields (save v3) */
  /* first-acquisition backfill (save v3): legacy saves never tracked per-strain acquisition.
     LEGACY-ONLY (version<3 — QA GE-DP-211): treat every currently-unlocked base strain as
     acquired so "Own X genetics" progress is preserved. Current-era (v3) saves track
     acquisition genuinely — running this on every load conflates AVAILABLE with OWNED
     (fresh saves reload with all starters "owned"). One-way: bump to v3 once applied. */
  if(!S.strainOwned||typeof S.strainOwned!=='object') S.strainOwned={};
  try{
    if(int(S.version,0)<3){
      const lockedNow=Array.isArray(S.lockedStrains)?S.lockedStrains:[];
      STRAINS.forEach(st=>{ if(lockedNow.indexOf(st.id)<0&&!S.strainOwned[st.id]) S.strainOwned[st.id]=1; });
      S.version=3;
    }
  }catch(e){}
  /* P2-W2 Living Codex: migration-safe history (save v3). The backfill ONLY mirrors
     existing tracked records - it never invents progress. Completion marks stay
     silent here: no toast spam for legacy progress. */
  try{
    if(!S.codexHist||typeof S.codexHist!=='object') S.codexHist={};
    Object.keys(S.codexHist).forEach(id=>{ try{ codexHist(id); }catch(e){} }); /* sanitize loaded records */
    Object.keys(S.strainOwned||{}).forEach(id=>{ const h=codexHist(id); if(h&&!h.acquiredDay) h.acquiredDay=Math.max(1,int(S.strainOwned[id],1)); });
    Object.keys((S.stats&&S.stats.strainGrown)||{}).forEach(id=>{ const h=codexHist(id); if(!h) return;
      const sg=S.stats.strainGrown[id]||{};
      h.harvested=Math.max(h.harvested,int(sg.count,0));
      h.grown=Math.max(h.grown,int(sg.count,0)); /* legacy: every tracked harvest was a grown run */
      h.bestYield=Math.max(h.bestYield,num(sg.yield,0)); });
    Object.keys(S.phenoHistory||{}).forEach(id=>{ const h=codexHist(id);
      if(h&&S.phenoHistory[id]) h.phenosEvaluated=Math.max(h.phenosEvaluated,int(S.phenoHistory[id].tested,0)); });
    (S.keepers||[]).forEach(k=>{ if(k&&k.strainId){ try{ codexOnKeeper(k.strainId,k,true); }catch(e){} } });
    Object.keys(S.codexHist).forEach(id=>{ try{ codexCheckComplete(id,true); }catch(e){} });
  }catch(e){}
  if(!S.phenoHistory||typeof S.phenoHistory!=='object') S.phenoHistory={};
  if(!Array.isArray(S.phenoArchive)) S.phenoArchive=[];
  if(!S.keeperCloneRuns||typeof S.keeperCloneRuns!=='object') S.keeperCloneRuns={};
  if(!S.tips||typeof S.tips!=='object') S.tips={};
  if(!S.stats.buyerSales||typeof S.stats.buyerSales!=='object') S.stats.buyerSales={};
  ['phenoTested','phenoHarvested','eliteFound','legendaryFound','clonesTaken','cloneHarvests',
   'phenoHuntsDone','huntsCompleted10','keepersFound','mothersCreated','comparesDone',
   'keeperCapUpgrades','vaultFilledOnce','provenCut','bestPhenoScore'].forEach(k=>{ S.stats[k]=num(S.stats[k],0); });
  /* legacy plants grown before the phenotype system get a generated pheno */
  S.plants.forEach(p=>{
    if(!p.pheno||typeof p.pheno!=='object'){
      const st=getStrain(p.strainId);
      if(st){ p.pheno=genPheno(st); p.pheno.num=nextPhenoNum(p.strainId); }
      else p.pheno=null;
    }
    if(p.pheno) sanitizePheno(p.pheno);
  });
  S.keepers.forEach(k=>{ if(k.genetics) sanitizePhenoGenetics(k.genetics); });
  S.mothers.forEach(m=>{ if(m.genetics) sanitizePhenoGenetics(m.genetics); });
  /* --- Builder A: World & Economy namespace (legacy saves get safe defaults) --- */
  if(!S.wx||typeof S.wx!=='object') S.wx={};
  { const wx=S.wx;
    if(!Array.isArray(wx.events)) wx.events=[];
    if(!wx.cool||typeof wx.cool!=='object') wx.cool={};
    if(!wx.market||typeof wx.market!=='object') wx.market={};
    wx.mday=Math.max(1,int(wx.mday,1));
    if(!Array.isArray(wx.offers)) wx.offers=[];
    if(!Array.isArray(wx.contracts)) wx.contracts=[];
    wx.chDone=Math.max(0,int(wx.chDone,0));
    if(!wx.chal||typeof wx.chal!=='object') wx.chal={daily:null,weekly:null,hist:[]};
    if(!Array.isArray(wx.chal.hist)) wx.chal.hist=[];
    wx.cday=Math.max(1,int(wx.cday,1));
    if(!wx.stats||typeof wx.stats!=='object') wx.stats={contractsDone:0};
    wx.stats.contractsDone=Math.max(0,int(wx.stats.contractsDone,0));
  }
  /* --- Builder B: Genetics-depth namespace --- */
  if(!S.gx||typeof S.gx!=='object') S.gx={strainMeta:{},lineage:{},mutLog:[],grades:0};
  if(!S.gx.strainMeta||typeof S.gx.strainMeta!=='object') S.gx.strainMeta={};
  if(!S.gx.lineage||typeof S.gx.lineage!=='object') S.gx.lineage={};
  if(!Array.isArray(S.gx.mutLog)) S.gx.mutLog=[];
  S.gx.grades=num(S.gx.grades,0);
  /* --- Tycoon expansion: save versioning + migration (never destroy old saves) --- */
  if(int(S.version,1)<2){ S.version=2; }
  if(!S.ty||typeof S.ty!=='object') S.ty=TY_defaultTy();
  try{ if(typeof TY_normalizeTy==='function') TY_normalizeTy(); }catch(e){}
  /* --- Builder C: Empire-depth namespace --- */
  try{ if(typeof EX_normalizeEx==='function') EX_normalizeEx(); }catch(e){}
  try{ if(typeof WX_init==='function') WX_init(); }catch(e){}
  try{ if(typeof GX_init==='function') GX_init(); }catch(e){}
  /* --- Automation module namespace --- */
  try{ if(typeof AM_migrate==='function') AM_migrate(); }catch(e){}
  /* --- Harder missions module namespace --- */
  try{ if(typeof MN_migrate==='function') MN_migrate(); }catch(e){}
  /* --- Dispensary carts module namespace --- */
  try{ if(typeof CT_migrate==='function') CT_migrate(); }catch(e){}
  /* --- P2.3 mission chains: migration-safe state + anti-skip validation --- */
  try{ if(typeof CHA_migrate==='function') CHA_migrate(); }catch(e){}
  /* --- P2.5 player memory (migration-safe, honestly backfilled) --- */
  try{ if(typeof ME_migrate==='function') ME_migrate(); }catch(e){}
  /* --- P3-W3 preservation tiers: sane defaults for legacy saves --- */
  try{ if(typeof P0T_backfill==='function') P0T_backfill(); }catch(e){}
}

/* ---------------- Save / load ---------------- */
function save(){ try{ if(typeof NX_saveKey==='function'){ try{S.lastSeen=Date.now();}catch(e){} try{ if(typeof NX_stampInv==='function') NX_stampInv(); }catch(e){} localStorage.setItem(NX_saveKey(), JSON.stringify(S)); } else localStorage.setItem(SAVE_KEY, JSON.stringify(S)); }catch(e){} }
function freshStart(){
  /* NEW GAME / RESET wipes progression but preserves genuine settings (prefs,
     tutorial-seen flags) — QA: these must survive a fresh start. */
  let keepPrefs=null, keepTips=null;
  try{ if(S&&S.prefs&&typeof S.prefs==='object') keepPrefs=JSON.parse(JSON.stringify(S.prefs)); }catch(e){}
  try{ if(S&&S.tips&&typeof S.tips==='object') keepTips=JSON.parse(JSON.stringify(S.tips)); }catch(e){}
  S = defaultState(); normalizeState();
  /* QA: new game — the 5 starters are AVAILABLE but not yet acquired; clear legacy backfill */
  S.strainOwned={};
  S.codexHist={}; /* P2-W2: fresh save starts with zero codex history */
  S.version=3; /* QA GE-DP-211: current-era save — the legacy strainOwned backfill must never re-run */
  if(keepPrefs){ S.prefs=keepPrefs; try{ if(typeof CAP_prefs==='function') CAP_prefs(); }catch(e){} }
  if(keepTips){ S.tips=keepTips; }
}
function load(){
  try{
    const raw = localStorage.getItem((typeof NX_saveKey==='function')?NX_saveKey():SAVE_KEY);
    if(!raw){ freshStart(); return 'none'; }
    const d = JSON.parse(raw);
    if(!d || typeof d!=='object' || Array.isArray(d)){ freshStart(); return 'corrupt'; }
    /* QA GE-601: never-erase — repair individual fields instead of wiping the whole save */
    if(int(d.version,0)<1) d.version=1;
    if(typeof d.cash!=='number' || !Number.isFinite(d.cash)) d.cash=0;
    if(!Array.isArray(d.plants)) d.plants=[];
    if(!d.env || typeof d.env!=='object') d.env={ light:80, temp:76, humidity:52, co2:900 };
    const def = defaultState();
    S = Object.assign(def, d);
    S.stats = Object.assign(def.stats, d.stats||{});
    S.equipment = Object.assign(def.equipment, d.equipment||{});
    S.crew = Object.assign(def.crew, d.crew||{});
    S.env = Object.assign(def.env, d.env||{});
    S.project0 = d.project0 || def.project0;
    S.project0.tracks = Object.assign(def.project0.tracks,(d.project0&&d.project0.tracks)||{});
    if(!Array.isArray(S.customStrains)) S.customStrains=[];
    if(!Array.isArray(S.lockedStrains)) S.lockedStrains = def.lockedStrains;
    normalizeState();
    return 'ok';
  }catch(e){ freshStart(); return 'corrupt'; }
}
function exportSave(){
  const blob = new Blob([JSON.stringify(S)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'grow-empire-save-day'+S.day+'.json';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500);
  toast(icon('check','ge-ic-md')+' Save exported.');
}

function importSaveFile(file){
  const r = new FileReader();
  r.onload = ()=>{
    try{
      const d = JSON.parse(r.result);
      if(!d || int(d.version,0)<1 || typeof d.cash!=='number' || !Array.isArray(d.plants)) throw new Error('bad');
      const def = defaultState();
      S = Object.assign(def, d);
      S.stats = Object.assign(def.stats, d.stats||{});
      normalizeState();
      save(); updateHUD(); show('menu');
      toast(icon('box','ge-ic-md')+' Save imported.');
    }catch(e){ toast(icon('x','ge-ic-md')+' Invalid save file.'); }
  };
  r.readAsText(file);
}


/* ---------------- Utils ---------------- */
const $ = id => document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/* Number sanitizer: never let undefined/null/NaN/Infinity reach the UI */
const num=(v,d=0)=>{ const n=Number(v); return Number.isFinite(n)?n:d; };
const int=(v,d=0)=>Math.floor(num(v,d));
const rnd=(a,b)=>a+Math.random()*(b-a);
const rndi=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const fmt$=n=>'$'+Math.round(num(n,0)).toLocaleString();
const fmtW=n=>{ const v=num(n,0); return v>=16?(v/16).toFixed(1)+' lb':(Math.round(v*10)/10)+' oz'; };
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ============================================================
   SHOCKER OWNZ VISUAL SYSTEM — SVG icon set + procedural art
   One consistent art language. No external assets. No emoji
   as primary artwork. All inline SVG / CSS, GitHub Pages safe.
   ============================================================ */
/* Stroke-style icons: 24x24, currentColor. Brand icons carry their own fill. */
const ICONS={
/* --- navigation --- */
grow:'<path d="M12 21v-8"/><path d="M12 13c0-3.6 2.8-6.5 7.5-6.5 0 3.6-2.8 6.5-7.5 6.5z"/><path d="M12 13c0-3.6-2.8-6.5-7.5-6.5 0 3.6 2.8 6.5 7.5 6.5z"/><path d="M5 21h14"/>',
grows:'<rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M6.5 14v-2.6M6.5 11.4c-1 0-1.9-.8-1.9-1.9 1.1 0 1.9.8 1.9 1.9zM6.5 11.4c1 0 1.9-.8 1.9-1.9-1.1 0-1.9.8-1.9 1.9z"/><path d="M17.5 14v-2.6M17.5 11.4c-1 0-1.9-.8-1.9-1.9 1.1 0 1.9.8 1.9 1.9zM17.5 11.4c1 0 1.9-.8 1.9-1.9-1.1 0-1.9.8-1.9 1.9z"/>',
genetics:'<path d="M7 3c0 5.5 10 5.5 10 11s-10 5.5-10 7"/><path d="M17 3c0 5.5-10 5.5-10 11s10 5.5 10 7"/><path d="M8.6 6.8h6.8M8.6 17.2h6.8M7.9 12h8.2"/>',
breeding:'<path d="M9.5 3h5"/><path d="M10.5 3v5.2L5.3 17.6A2.4 2.4 0 0 0 7.4 21h9.2a2.4 2.4 0 0 0 2.1-3.4L13.5 8.2V3"/><path d="M7.6 14.5h8.8"/>',
dispensary:'<path d="M4 10.5V20h16v-9.5"/><path d="M2.8 10.5L4.3 4h15.4l1.5 6.5"/><path d="M2.8 10.5h18.4"/><path d="M10 20v-5.5h4V20"/>',
empire:'<path d="M2.5 21h19"/><path d="M4.5 21V9.5l5 3v-3l5 3V5h5v16"/><path d="M14.5 5V2.8h3V5"/><path d="M7.5 16.5h2M12 16.5h2"/>',
missions:'<path d="M6 3.5h12V21l-3-2.2-3 2.2-3-2.2-3 2.2z"/><path d="M9 8.5h6M9 12h6M9 15.5h3.5"/>',
project0:'<g fill="currentColor" stroke="none"><path d="M12 2.5c-4.6 0-8 3.4-8 8.6 0 3.2 1.6 5.9 4 7.4l1.2 3h5.6l1.2-3c2.4-1.5 4-4.2 4-7.4 0-5.2-3.4-8.6-8-8.6z"/><circle cx="9" cy="11" r="2.6" fill="#0a0a0a"/><circle cx="15" cy="11" r="2.6" fill="#0a0a0a"/><circle cx="9" cy="11" r="1.1" fill="#ff3b3b"/><circle cx="15" cy="11" r="1.1" fill="#ff3b3b"/><rect x="10.4" y="14.5" width="3.2" height="2.6" rx="1" fill="#0a0a0a"/></g>',
settings:'<circle cx="12" cy="12" r="3.4"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"/>',
/* --- actions --- */
water:'<path d="M12 3s6.2 6.8 6.2 11.2a6.2 6.2 0 0 1-12.4 0C5.8 9.8 12 3 12 3z"/><path d="M9.5 14.5a2.8 2.8 0 0 0 2.5 3"/>',
feed:'<path d="M10 3h4"/><path d="M11 3v6l-4.8 8.8A2.2 2.2 0 0 0 8.1 21h7.8a2.2 2.2 0 0 0 1.9-3.2L13 9V3"/><path d="M8.2 15h7.6"/>',
train:'<circle cx="6" cy="6.5" r="2.6"/><circle cx="6" cy="17.5" r="2.6"/><path d="M8.2 8.2L20 20M8.2 15.8L20 4"/>',
inspect:'<circle cx="10.5" cy="10.5" r="6.2"/><path d="M15.3 15.3L21 21"/>',
harvest:'<path d="M12 21V8"/><path d="M12 8C12 4.8 9.5 3 5.5 3c0 4 2.5 5.5 6.5 5z"/><path d="M12 8c0-3.2 2.5-5 6.5-5 0 4-2.5 5.5-6.5 5z"/><path d="M12 13c-2.4 0-4-1.4-4-4M12 13c2.4 0 4-1.4 4-4"/>',
clone:'<path d="M4 21h16"/><path d="M8.5 21v-5.5M8.5 15.5c-1.7 0-2.9-1.2-2.9-2.9 1.7 0 2.9 1.2 2.9 2.9zM8.5 15.5c1.7 0 2.9-1.2 2.9-2.9-1.7 0-2.9 1.2-2.9 2.9z"/><path d="M15.5 21v-5.5M15.5 15.5c-1.7 0-2.9-1.2-2.9-2.9 1.7 0 2.9 1.2 2.9 2.9zM15.5 15.5c1.7 0 2.9-1.2 2.9-2.9-1.7 0-2.9 1.2-2.9 2.9z"/>',
sell:'<path d="M3.5 3.5H11L20.5 13l-7.5 7.5L3.5 11z"/><circle cx="8" cy="8" r="1.7"/>',
trash:'<path d="M4 7h16"/><path d="M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7"/><path d="M6.5 7l.9 12.2a1.8 1.8 0 0 0 1.8 1.7h5.6a1.8 1.8 0 0 0 1.8-1.7L17.5 7"/><path d="M10 11v6M14 11v6"/>',
/* --- HUD --- */
cash:'<circle cx="12" cy="12" r="8.6"/><path d="M12 7v10M14.6 9.2c-.5-.9-1.5-1.4-2.6-1.4-1.6 0-2.9.9-2.9 2.2 0 2.9 5.8 1.4 5.8 4.2 0 1.3-1.3 2.2-2.9 2.2-1.1 0-2.1-.5-2.6-1.4"/>',
rep:'<path d="M12 3l2.7 5.7 6.2.8-4.6 4.2 1.2 6.1L12 16.7l-5.5 3.1 1.2-6.1-4.6-4.2 6.2-.8z"/>',
level:'<path d="M4.5 15.5L12 8l7.5 7.5"/><path d="M4.5 20.5h15"/>',
day:'<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.8M12 18.7v2.8M2.5 12h2.8M18.7 12h2.8M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
xp:'<path d="M13 2.5L4.5 13.5H11l-1.2 8L18.5 10H12z"/>',
/* --- status --- */
lock:'<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
check:'<path d="M4.5 12.5l5 5L19.5 7"/>',
warn:'<path d="M12 3.5L2.5 20h19z"/><path d="M12 10v4.2M12 17.4v.4"/>',
trophy:'<path d="M8 4h8v4.5a4 4 0 0 1-8 0z"/><path d="M8 5H4.5A3.5 3.5 0 0 0 8 12.5M16 5h3.5A3.5 3.5 0 0 1 16 12.5"/><path d="M12 12.5V16M8.5 20.5h7M9.5 16h5"/>',
x:'<path d="M6 6l12 12M18 6L6 18"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
star:'<path d="M12 3l2.7 5.7 6.2.8-4.6 4.2 1.2 6.1L12 16.7l-5.5 3.1 1.2-6.1-4.6-4.2 6.2-.8z"/>',
/* --- environment --- */
temp:'<path d="M10 5a2 2 0 0 1 4 0v8.2a4.6 4.6 0 1 1-4 0z"/><circle cx="12" cy="17.5" r="1.7" fill="currentColor" stroke="none"/>',
humid:'<path d="M12 3s6.2 6.8 6.2 11.2a6.2 6.2 0 0 1-12.4 0C5.8 9.8 12 3 12 3z"/>',
light:'<rect x="4" y="3.5" width="16" height="5.5" rx="1.2"/><path d="M12 9v2.5M7 21h10M6.5 13.5c-1 1.8-1 3.8 0 5.5M17.5 13.5c1 1.8 1 3.8 0 5.5M12 13.5v5.5"/>',
co2:'<path d="M7 18.5a4 4 0 0 1-.6-7.9A6 6 0 0 1 18.2 9a4.4 4.4 0 0 1-.7 9.5z"/>',
drop:'<path d="M12 3s6.2 6.8 6.2 11.2a6.2 6.2 0 0 1-12.4 0C5.8 9.8 12 3 12 3z"/>',
/* --- brand --- */
'crown-red':'<g fill="#e02020" stroke="none"><path d="M2.5 9l4.3 3.4L12 5.5l5.2 6.9L21.5 9 19.3 19H4.7z"/><rect x="4.7" y="20" width="14.6" height="2.2" rx="1"/><circle cx="2.5" cy="8" r="1.6"/><circle cx="12" cy="4.5" r="1.6"/><circle cx="21.5" cy="8" r="1.6"/></g>',
'crown-gold':'<g fill="#d4a017" stroke="none"><path d="M2.5 9l4.3 3.4L12 5.5l5.2 6.9L21.5 9 19.3 19H4.7z"/><rect x="4.7" y="20" width="14.6" height="2.2" rx="1"/><circle cx="2.5" cy="8" r="1.6"/><circle cx="12" cy="4.5" r="1.6"/><circle cx="21.5" cy="8" r="1.6"/><circle cx="12" cy="14" r="1.8" fill="#7a0d0d"/></g>',
gasmask:'<g fill="currentColor" stroke="none"><path d="M12 1.5C7.5 1.5 4.5 4.88 4.5 9.75c0 3 1.5 5.44 3.75 6.75l1.12 3h5.25l1.12-3c2.25-1.31 3.75-3.75 3.75-6.75C19.5 4.88 16.5 1.5 12 1.5z"/><circle cx="8.62" cy="9.75" r="2.81" fill="#0b0b0b"/><circle cx="15.38" cy="9.75" r="2.81" fill="#0b0b0b"/><circle cx="8.62" cy="9.75" r="1.12" fill="#ff3b3b"/><circle cx="15.38" cy="9.75" r="1.12" fill="#ff3b3b"/><rect x="10.12" y="13.5" width="3.75" height="3" rx="1.12" fill="#0b0b0b"/><path d="M5.25 4.5l1.5 1.12M18.75 4.5l-1.5 1.12" stroke="currentColor" stroke-width="1.12"/></g>',
leaf:'<path d="M12 21V9"/><path d="M12 9c0-2.8-1.8-4.8-4.8-5.6.4 2.8 2 4.8 4.8 5.6z"/><path d="M12 9c0-2.8 1.8-4.8 4.8-5.6-.4 2.8-2 4.8-4.8 5.6z"/><path d="M12 13.5c-2.8 0-5.6-1-7.5-3.5 2.8 0 5.6 1 7.5 3.5z"/><path d="M12 13.5c2.8 0 5.6-1 7.5-3.5-2.8 0-5.6 1-7.5 3.5z"/><path d="M12 17.5c-2.2 0-4.4-.8-6-2.8 2.2 0 4.4.8 6 2.8z"/><path d="M12 17.5c2.2 0 4.4-.8 6-2.8-2.2 0-4.4.8-6 2.8z"/>',
dna:'<path d="M7 3c0 5.5 10 5.5 10 11s-10 5.5-10 7"/><path d="M17 3c0 5.5-10 5.5-10 11s10 5.5 10 7"/><path d="M8.6 6.8h6.8M8.6 17.2h6.8M7.9 12h8.2"/>',
jar:'<rect x="6" y="8" width="12" height="13" rx="2.5"/><path d="M8.5 8V5.5h7V8M8.5 4.5h7"/><path d="M12 18v-4M12 15.5c-1.4 0-2.4-1-2.4-2.4 1.4 0 2.4 1 2.4 2.4zM12 15.5c1.4 0 2.4-1 2.4-2.4-1.4 0-2.4 1-2.4 2.4z"/>',
/* --- secondary --- */
keepers:'<path d="M2.5 9l4.3 3.4L12 5.5l5.2 6.9L21.5 9 19.3 19H4.7z"/><path d="M4.7 21.5h14.6"/>',
mothers:'<path d="M12 13v8M8 21h8"/><path d="M12 13c-3 0-5.5-2-5.5-5.5 3 0 5.5 2 5.5 5.5z"/><path d="M12 13c3 0 5.5-2 5.5-5.5-3 0-5.5 2-5.5 5.5z"/><path d="M12 9.5V6M12 8c-1.4 0-2.4-1-2.4-2.4C11 5.6 12 6.6 12 8z"/><path d="M12 8c1.4 0 2.4-1 2.4-2.4C13 5.6 12 6.6 12 8z"/>',
hunt:'<circle cx="10.5" cy="10.5" r="6.2"/><path d="M15.3 15.3L21 21"/><path d="M10.5 13v-4.5M10.5 10.8c-1.4 0-2.6-.9-2.6-2.3 1.5 0 2.6.9 2.6 2.3z"/>',
compete:'<path d="M8 4h8v4.5a4 4 0 0 1-8 0z"/><path d="M8 5H4.5A3.5 3.5 0 0 0 8 12.5M16 5h3.5A3.5 3.5 0 0 1 16 12.5"/><path d="M12 12.5V16M8.5 20.5h7M9.5 16h5"/>',
equipment:'<path d="M14.8 5.8a4.2 4.2 0 0 0-5.7 5.3L3.5 16.7V20.5h3.8l5.6-5.6a4.2 4.2 0 0 0 5.3-5.7l-2.9 2.9-2.4-.7-.7-2.4z"/>',
crew:'<circle cx="9" cy="8" r="3.4"/><path d="M3 20.5c0-3.2 2.7-5.3 6-5.3s6 2.1 6 5.3"/><circle cx="17" cy="9" r="2.6"/><path d="M16.2 15.4c2.7.4 4.8 2.2 4.8 5.1"/>',
preserve:'<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="12" r="4.2"/><path d="M12 9.8v4.4M9.8 12h4.4"/>',
scroll:'<path d="M7 3.5h11a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7z"/><path d="M7 3.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2"/><path d="M10 8.5h6M10 12h6"/>',
 /* --- pests (P1.0: diagnosis events) --- */
 bug:'<ellipse cx="12" cy="13.5" rx="4" ry="5"/><circle cx="12" cy="6.5" r="1.8"/><path d="M8.6 10.5L4.5 8M8.2 14H4M8.6 17.5L4.5 20M15.4 10.5l4.1-2.5M15.8 14H20M15.4 17.5l4.1 2.5"/>',
 spray:'<path d="M9.5 9h5V20a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1z"/><path d="M11 9V6.5h2V9M12 6.5V4.5M12 4.5h3.5M16.5 3.5L19 3M18.5 6.5l2.5.5"/>',
 trap:'<rect x="6" y="10" width="12" height="8" rx="1.5"/><path d="M12 10V4.5M9.5 6.5h5"/><path d="M9.5 13l1.5 1.5M12 12.5V15M14.5 13l-1.5 1.5"/>'
};
/* UI OVERHAUL: extended icon set (merged from design-system/icons.js) */
const GE_NEW_ICONS = {
/* --- missing call sites (rendered empty today) --- */
cart:'<circle cx="9.5" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2.2l2.5 12h10.8l2-8.5H6"/>',
customers:'<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 20c.6-3.4 2.8-5 5.5-5s4.9 1.6 5.5 5"/><circle cx="16.8" cy="9.5" r="2.6"/><path d="M16 15.2c2.3.3 3.9 1.8 4.4 4.3"/>',
shop:'<path d="M6 8h12l1 12.5H5z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
terp:'<path d="M12 4s5 5.5 5 9a5 5 0 0 1-10 0c0-3.5 5-9 5-9z"/><path d="M5.5 5.5c-1 1.5-1.5 3-1.5 4.5M18.5 5.5c1 1.5 1.5 3 1.5 4.5"/>',
/* --- environment telemetry --- */
ph:'<path d="M9 3h6"/><path d="M12 3v9"/><rect x="8.5" y="12" width="7" height="9" rx="3.5"/><path d="M12 15.5v3"/>',
ec:'<circle cx="12" cy="12" r="8.5"/><path d="M7 12h2.5l1.5-3 2 6 1.5-3H17"/>',
vpd:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M12 7.5L9.8 9.7M12 7.5l2.2 2.2M12 16.5l-2.2-2.2M12 16.5l2.2-2.2"/>',
humidity:'<path d="M12 3s6.2 6.8 6.2 11.2a6.2 6.2 0 0 1-12.4 0C5.8 9.8 12 3 12 3z"/>',
lighting:'<path d="M9.5 18a4.5 4.5 0 1 1 5 0"/><path d="M10 21h4M12 2.5V5M4.9 4.9l1.4 1.4M19.1 4.9l-1.4 1.4"/>',
hvac:'<circle cx="12" cy="12" r="8.5"/><path d="M12 12c0-2.5.5-5 2-6.5 1.5 1.5 1 4-1 5.5z"/><path d="M12 12c2.5 0 5 .5 6.5 2-1.5 1.5-4 1-5.5-1z"/><path d="M12 12c0 2.5-.5 5-2 6.5-1.5-1.5-1-4 1-5.5z"/><path d="M12 12c-2.5 0-5-.5-6.5-2 1.5-1.5 4-1 5.5 1z"/>',
irrigation:'<path d="M12 21v-6"/><path d="M5 10a7 7 0 0 1 14 0"/><path d="M12 3v4M5 10l2-2M19 10l-2-2M8 4.5L9 6.5M16 4.5L15 6.5"/>',
nutrients:'<path d="M10 2.5h4"/><path d="M11 2.5V7l-5 11.5A2.4 2.4 0 0 0 8.2 22h7.6a2.4 2.4 0 0 0 2.2-3.5L13 7V2.5"/><path d="M7.8 14.5h8.4"/>',
sensors:'<circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/>',
drycure:'<path d="M5 4h14"/><path d="M12 4v3"/><path d="M12 7c-2.5 0-4 1.8-4 4.5 2.5 0 4-1.8 4-4.5z"/><path d="M12 7c2.5 0 4 1.8 4 4.5-2.5 0-4-1.8-4-4.5z"/><path d="M12 13v8"/>',
/* --- commerce & structure --- */
storefront:'<path d="M4 9l1-4h14l1 4"/><path d="M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0"/><path d="M5.5 11.5V20h13v-8.5"/><path d="M10 20v-5h4v5"/>',
facility:'<path d="M3 21V10l9-6 9 6v11"/><path d="M3 21h18"/><path d="M8 21v-8h8v8"/><path d="M8 17h8"/>',
/* --- brand --- */
crown:'<path d="M3 8.5l4 3 5-6 5 6 4-3-1.5 10h-15z"/><path d="M5 20.5h14"/>',
'crown-gold':'<g fill="#d4a017" stroke="none"><path d="M2.5 9l4.3 3.4L12 5.5l5.2 6.9L21.5 9 19.3 19H4.7z"/><rect x="4.7" y="20" width="14.6" height="2.2" rx="1"/><circle cx="2.5" cy="8" r="1.6"/><circle cx="12" cy="4.5" r="1.6"/><circle cx="21.5" cy="8" r="1.6"/><circle cx="12" cy="14" r="1.8" fill="#7a0d0d"/></g>',
/* --- general gaps --- */
calendar:'<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
wallet:'<path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2"/><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="16.8" cy="13.5" r="1.3" fill="currentColor" stroke="none"/>',
shield:'<path d="M12 3l7.5 2.8v5.4c0 4.6-3.2 7.9-7.5 9.8-4.3-1.9-7.5-5.2-7.5-9.8V5.8z"/><path d="M9.5 11.5l2.3 2.3 3.7-4"/>',
flask:'<path d="M9.5 3h5"/><path d="M10.5 3v6l-4.8 6.9a4 4 0 0 0 3.4 6.1h5.8a4 4 0 0 0 3.4-6.1L13.5 9V3"/><path d="M7.5 14h9"/>',
box:'<path d="M3.5 8L12 3.5 20.5 8v8L12 20.5 3.5 16z"/><path d="M3.5 8L12 12.5 20.5 8M12 12.5V20.5"/>',
truck:'<path d="M2.5 6.5h12V16h-12z"/><path d="M14.5 10h3.8l3.2 3.5V16h-7"/><circle cx="7" cy="17.8" r="1.8"/><circle cx="17.5" cy="17.8" r="1.8"/>',
users:'<circle cx="8.5" cy="8" r="3"/><path d="M3 19.5c.5-3 2.7-4.7 5.5-4.7s5 1.7 5.5 4.7"/><path d="M15.5 5.4a3 3 0 0 1 0 5.7M17.5 15c1.8.7 3 2 3.4 4.5"/>',
chart:'<path d="M4 20h16"/><rect x="6" y="11" width="3" height="9"/><rect x="11" y="7" width="3" height="13"/><rect x="16" y="4" width="3" height="16"/>',
pin:'<path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.3"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/>',
filter:'<path d="M4 5h16l-6.2 7.2V19l-3.6-2v-4.8z"/>',
'arrow-right':'<path d="M4 12h15M13 6l6 6-6 6"/>',
minus:'<path d="M6 12h12"/>',
clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
/* P3-W4: automation tech-tree icons */
timer:'<circle cx="12" cy="13.5" r="7"/><path d="M12 10v3.5l2.5 1.5M9.5 2.5h5M12 2.5V6.5"/>',
aicore:'<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 2.5v3M14 2.5v3M10 18.5v3M14 18.5v3M2.5 10h3M2.5 14h3M18.5 10h3M18.5 14h3"/><circle cx="12" cy="12" r="2"/>',
'alert-triangle':'<path d="M12 3.5L2.5 20h19z"/><path d="M12 9.5v5"/><circle cx="12" cy="17" r="1.1" fill="currentColor" stroke="none"/>'
};
Object.assign(ICONS,GE_NEW_ICONS);

function icon(n,cls){
  const p=ICONS[n];
  if(!p) return '<span class="ic-missing"></span>';
  const filled=(n==='crown-red'||n==='crown-gold'||n==='gasmask'||n==='project0');
  return '<svg class="ic '+(cls||'')+'" viewBox="0 0 24 24" '+(filled?'':'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"')+' aria-hidden="true">'+p+'</svg>';
}

/* ---- deterministic RNG for procedural art ---- */
function sHash(s){ let h=2166136261; s=String(s); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function sRng(seed){ let a=sHash(seed); return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
/* QA GE-003: unique gradient IDs — duplicated fixed ids across inline SVGs break fills */
let GE_svgUid=0; function GE_gid(prefix){ return prefix+'_u'+(++GE_svgUid); }

/* ---- procedural cannabis plant: 10 botanical stages, phenotype + problem aware ----
   stage: 0 SEED, 1 SPROUT, 2 SEEDLING, 3 EARLY VEG, 4 VEG, 5 LATE VEG,
          6 EARLY FLOWER, 7 MID FLOWER, 8 LATE FLOWER, 9 HARVEST READY
   opts: {tall,short,bushy,purple,frost(0-3),dense,trained,
          wilt,overwater,burn,defic,heat,pests} */
const STAGE_GFX=[
 {h:0, br:0, bud:0},{h:11,br:0, bud:0},{h:24,br:0, bud:0},
 {h:38,br:1, bud:0},{h:54,br:2, bud:0},{h:68,br:3, bud:0},
 {h:74,br:3, bud:1},{h:78,br:4, bud:2},{h:82,br:4, bud:3},{h:86,br:5, bud:4}
];
function plantSVG(stage,seedStr,cls,opts){
  const R=sRng('plant|'+seedStr), s=clamp(int(stage,0),0,9), o=opts||{};
  const G=STAGE_GFX[s], uid=sHash(seedStr)%991;
  const j=()=>(R()-0.5)*10;
  let inner='';
  inner+='<defs><linearGradient id="potg'+uid+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2a2a"/><stop offset="1" stop-color="#101010"/></linearGradient></defs>';
  if(o.overwater) inner+='<ellipse cx="60" cy="134" rx="32" ry="4.5" fill="#16283a" opacity="0.45"/>';
  inner+='<ellipse cx="60" cy="112" rx="26" ry="6" fill="#0c0a08"/>';
  inner+='<path d="M36 108 h48 l-4 24 a4 4 0 0 1-4 4 H44 a4 4 0 0 1-4-4 z" fill="url(#potg'+uid+')" stroke="#000"/>';
  inner+='<rect x="33" y="103" width="54" height="8" rx="3" fill="'+(o.exceptional?'#3a2c08':'#3a0d0d')+'" stroke="'+(o.exceptional?'#d4a017':'#7a0d0d')+'" stroke-width="1"/>';
  const baseY=104;
  const leafC=o.defic?['#7a8a3a','#8a9a42','#6e7e32']:['#2e6b34','#35793b','#2a6130'];
  const droop=(o.wilt||o.overwater)?34:0;
  function leaf(x,y,len,ang,c,bleach){
    const w=len*0.42, a=ang+(ang<0?-droop:droop*0.4)+(ang>90?droop:-droop*0.3);
    const fill=bleach?'#a9c08d':c;
    return '<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+a.toFixed(1)+')">'+
      '<path d="M0 0 Q '+(len*0.32).toFixed(1)+' '+(-w).toFixed(1)+' '+len.toFixed(1)+' 0 Q '+(len*0.32).toFixed(1)+' '+w.toFixed(1)+' 0 0" fill="'+fill+'"/>'+
      '<path d="M2 0 L '+(len-2).toFixed(1)+' 0" stroke="#1c4a22" stroke-width="1"/></g>';
  }
  function bud(x,y,r,purple){
    const bc=purple?'#5e3a63':'#4c7a3c', bc2=purple?'#7a4a80':'#5f9448';
    let b='<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+')">';
    b+='<path d="M0 '+r.toFixed(1)+' C '+(-r).toFixed(1)+' '+(-r*0.2).toFixed(1)+' '+(-r*0.62).toFixed(1)+' '+(-r*1.1).toFixed(1)+' 0 '+(-r*1.7).toFixed(1)+
       ' C '+(r*0.62).toFixed(1)+' '+(-r*1.1).toFixed(1)+' '+r.toFixed(1)+' '+(-r*0.2).toFixed(1)+' 0 '+r.toFixed(1)+' z" fill="'+bc+'" stroke="'+bc2+'" stroke-width="1"/>';
    const pn=3+Math.floor(R()*3);
    for(let i=0;i<pn;i++){ const a=-70+i*(140/Math.max(1,pn-1))+(R()-0.5)*20, px=Math.cos(a*Math.PI/180)*r*0.9, py=-r*1.1+Math.sin(a*Math.PI/180)*r*0.5;
      const tipC=o.burn?'#6b4a2a':'#d98a3a';
      b+='<path d="M0 '+(-r*0.9).toFixed(1)+' q '+(px*0.5).toFixed(1)+' '+(py*0.4).toFixed(1)+' '+px.toFixed(1)+' '+py.toFixed(1)+'" stroke="'+tipC+'" stroke-width="1.1" fill="none"/>'; }
    if(s>=8||(o.frost||0)>0){ const n=(o.frost||0)*7+(s>=9?8:0);
      for(let i=0;i<n;i++){ b+='<circle cx="'+((R()-0.5)*r*1.5).toFixed(1)+'" cy="'+(-r*(0.3+R()*1.1)).toFixed(1)+'" r="'+(0.8+R()*0.9).toFixed(1)+'" fill="#fff" opacity="'+(0.55+R()*0.4).toFixed(2)+'"/>'; } }
    return b+'</g>';
  }
  if(s===0){
    /* seed resting on soil */
    inner+='<ellipse cx="60" cy="101" rx="10" ry="3.4" fill="#241a12"/>';
    inner+='<ellipse cx="60" cy="99" rx="3" ry="4" fill="#3a2c1c" stroke="#1c140c" transform="rotate(24 60 99)"/>';
  }else if(s===1){
    /* sprout: hypocotyl + cotyledons */
    inner+='<path d="M60 '+baseY+' C 60 '+(baseY-6)+' 59 '+(baseY-9)+' 60 '+(baseY-11)+'" stroke="#4a9a4f" stroke-width="2.4" fill="none"/>';
    inner+=leaf(60,baseY-10,12,-24,leafC[1])+leaf(60,baseY-10,12,204,leafC[0]);
    inner+='<circle cx="60" cy="'+(baseY-12)+'" r="2" fill="#57a75e"/>';
  }else{
    let H=G.h;
    if(o.tall) H*=1.22; if(o.short) H*=0.8;
    const nodes=2+Math.min(5,G.br+2), pts=[];
    for(let i=0;i<=nodes;i++){ const y=baseY-(H*i/nodes); pts.push([60+j()*0.35,y]); }
    let d='M'+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1);
    for(let i=1;i<pts.length;i++){
      const bend=o.trained?(i%2?7:-7):0, lean=(o.wilt||o.overwater)?6:0;
      d+=' Q '+(pts[i][0]+j()*0.5+bend).toFixed(1)+' '+((pts[i-1][1]+pts[i][1])/2).toFixed(1)+' '+(pts[i][0]+bend*0.4+lean).toFixed(1)+' '+pts[i][1].toFixed(1);
    }
    inner+='<path d="'+d+'" stroke="'+(o.defic?'#5a6b2a':'#2e6b34')+'" stroke-width="'+(s>=6?4:3)+'" fill="none"/>';
    const perNode=G.br+(o.bushy?1:0);
    for(let i=1;i<pts.length;i++){
      const [x,y]=pts[i], L=Math.max(9,(s>=4?24:30)-i*1.6)*(o.bushy?1.15:1);
      for(let bn=0;bn<Math.max(1,perNode);bn++){
        const spread=o.trained?58:32, off=(bn-(perNode-1)/2)*spread;
        inner+=leaf(x,y,L,-off-j()*0.4,leafC[(i+bn)%3])+leaf(x,y,L,180+off+j()*0.4,leafC[(i+bn+1)%3]);
      }
      if(o.pests){ for(let sp=0;sp<3;sp++) inner+='<circle cx="'+(x+(R()-0.5)*L).toFixed(1)+'" cy="'+(y+(R()-0.5)*8).toFixed(1)+'" r="1.1" fill="#1a1208" opacity="0.85"/>'; }
      if(G.bud>0){
        const purple=o.purple||R()<0.28, br=[0,3.4,5.6,8,10.5][G.bud]*(o.dense?1.15:0.95);
        inner+=bud(x-6-j()*0.2,y-3,br*0.72,purple)+bud(x+6+j()*0.2,y-3,br*0.72,purple);
      }
    }
    const [tx,ty]=pts[pts.length-1];
    if(G.bud>0){
      const purple=o.purple||R()<0.4, br=[0,5,8,11,13.5][G.bud]*(o.dense?1.2:1);
      inner+=bud(tx,ty-2,br,purple);
    }else{
      inner+=leaf(tx,ty,15,-90,leafC[1],o.lightStress)+leaf(tx,ty-2,12,-64,leafC[2],o.lightStress)+leaf(tx,ty-2,12,-116,leafC[0],o.lightStress);
    }
    if(s>=9){ for(let i=0;i<10;i++){ inner+='<circle cx="'+(42+R()*36).toFixed(1)+'" cy="'+(ty+R()*(baseY-ty)).toFixed(1)+'" r="'+(0.8+R()).toFixed(1)+'" fill="#fff" opacity="'+(0.4+R()*0.5).toFixed(2)+'"/>'; } }
  }
  /* ---- condition atmosphere (display-only, no filters) ---- */
  if(o.lightStress&&s>=2) inner+='<rect x="0" y="0" width="120" height="58" fill="#e8f0d8" opacity="0.10"/>';
  if(o.heat){
    inner+='<rect x="0" y="0" width="120" height="140" fill="#ff7a1a" opacity="0.10"/>';
    for(let hi=0;hi<3;hi++){ const hx=42+hi*18; inner+='<path d="M'+hx+' 96 q 5 -8 0 -16 q -5 -8 0 -16" stroke="#ff7a1a" stroke-width="1.4" fill="none" opacity="0.45"/>'; }
  }
  if(o.wilt) inner+='<rect x="0" y="0" width="120" height="140" fill="#8a8a8a" opacity="0.07"/>';
  if(o.exceptional&&s>=2){
    for(let gi=0;gi<7;gi++){ inner+='<circle cx="'+(44+R()*32).toFixed(1)+'" cy="'+(26+R()*52).toFixed(1)+'" r="'+(0.9+R()*0.8).toFixed(1)+'" fill="#ffd76a" opacity="'+(0.5+R()*0.4).toFixed(2)+'"/>'; }
  }
  return '<svg class="plant-art '+(cls||'')+'" viewBox="0 0 120 140" aria-hidden="true">'+inner+'</svg>';
}

/* ============================================================
   NPC CAST (original characters) + MARKET BUYERS + EMPIRE HUB
   + FACILITY TIERS + STAGE HELPERS
   ============================================================ */
const NPCS={
 vic:{name:"Vic 'Two-Thumbs' Malone",role:'CULTIVATION MENTOR',acc:'cap',
   lines:["Water before they wilt, feed before they fade — the plant tells you everything.","Big rooms are built one healthy harvest at a time. Patience, kid."]},
 sal:{name:'Big Sal',role:'EQUIPMENT SUPPLIER',acc:'goggles',
   lines:["You want pro results? You buy pro gear. I don't sell junk.","Good lights pay for themselves in a single run. Trust Sal."]},
 marisol:{name:'Judge Marisol Vega',role:'COMPETITION JUDGE',acc:'shades',
   lines:["I judge flower, not stories. Bring me your best or don't come.","Resin, aroma, structure — I score what I can see and smell."]},
 marcus:{name:"Marcus 'The Press' Cole",role:'EXTRACT PROCESSOR',acc:'beard',
   lines:["Frost is money. The frostier the flower, the fatter my offer.","I press what others can't. Resin talks."]},
 lena:{name:'Lena Voss',role:'BOUTIQUE BUYER',acc:'bun',
   lines:["My clients pay for aroma and bag appeal. Loud and pretty wins.","Terpenes are the soul of the flower. Bring me soul."]},
 dana:{name:"Dana 'Scorecard' Reyes",role:'COMPETITION SCOUT',acc:'headset',
   lines:["I buy winners. Potency and trophies catch my eye.","If it could take a cup, I'll pay cup prices."]},
 archive:{name:'The Archivist',role:'GENETICS COLLECTOR',acc:'mask',
   lines:["Rare genetics don't belong in a bargain bin. I pay for history.","A proven keeper cut is worth more than its weight. Bring me legends."]},
 quinn:{name:'Archivist Quinn',role:'PROJECT 0 ARCHIVIST',acc:'hood',
   lines:["We don't chase money here. We chase permanence.","Every keeper you preserve outlives us all. That is the work."]}
};
/* gritty stylized SVG bust portraits — one visual language */
function npcPortrait(id,cls){
  const n=NPCS[id]; if(!n) return '';
  const acc=n.acc;
  let extra='';
  if(acc==='cap') extra='<path d="M18 26c0-9 6-15 14-15s14 6 14 15z" fill="#232326" stroke="#000"/><rect x="14" y="24" width="36" height="5" rx="2.5" fill="#1a1a1d"/><rect x="30" y="12" width="4" height="4" fill="#e02020"/>';
  else if(acc==='goggles') extra='<rect x="14" y="14" width="36" height="4" fill="#111"/><circle cx="24" cy="16" r="6" fill="none" stroke="#8a8a8e" stroke-width="2.5"/><circle cx="40" cy="16" r="6" fill="none" stroke="#8a8a8e" stroke-width="2.5"/><circle cx="24" cy="16" r="2.4" fill="#e02020" opacity="0.8"/><circle cx="40" cy="16" r="2.4" fill="#e02020" opacity="0.8"/>';
  else if(acc==='shades') extra='<rect x="20" y="27" width="24" height="7" rx="3.5" fill="#050505"/><rect x="19" y="28.5" width="26" height="1.6" fill="#e02020" opacity="0.7"/>';
  else if(acc==='beard') extra='<path d="M22 38c0 8 4 13 10 13s10-5 10-13c-3 3-6 4-10 4s-7-1-10-4z" fill="#1c1a18"/>';
  else if(acc==='bun') extra='<circle cx="32" cy="12" r="6" fill="#2a2320"/><path d="M20 24c0-8 5-13 12-13s12 5 12 13c-4-5-8-7-12-7s-8 2-12 7z" fill="#2a2320"/>';
  else if(acc==='headset') extra='<path d="M18 30c0-10 6-17 14-17s14 7 14 17" fill="none" stroke="#3a3a3e" stroke-width="3"/><rect x="43" y="28" width="5" height="10" rx="2" fill="#3a3a3e"/><path d="M45 38c0 4-3 6-7 6" stroke="#3a3a3e" stroke-width="2.5" fill="none"/><circle cx="37" cy="44" r="2.4" fill="#e02020"/>';
  else if(acc==='mask') extra='<path d="M22 36h20v6c0 5-4 8-10 8s-10-3-10-8z" fill="#151517" stroke="#e02020" stroke-width="1.5"/><circle cx="32" cy="42" r="3" fill="#0a0a0a" stroke="#444"/>';
  else if(acc==='hood') extra='<path d="M14 52c0-14 6-24 18-24s18 10 18 24l-6 2c0-11-4-18-12-18s-12 7-12 18z" fill="#191920" stroke="#000"/>';
  return '<svg class="npc-face '+(cls||'')+'" viewBox="0 0 64 64" aria-hidden="true">'+
   '<defs><radialGradient id="npb'+id+'" cx="0.35" cy="0.3" r="0.9"><stop offset="0" stop-color="#2e2e33"/><stop offset="1" stop-color="#0c0c0e"/></radialGradient></defs>'+
   '<circle cx="32" cy="32" r="30" fill="url(#npb'+id+')" stroke="#e02020" stroke-width="1.5" opacity="0.98"/>'+
   '<path d="M10 56c2-9 10-14 22-14s20 5 22 14z" fill="#1b1b1f" stroke="#000"/>'+
   '<ellipse cx="32" cy="31" rx="11" ry="13" fill="#3d3d44" stroke="#000"/>'+
   '<path d="M21 31c0-6 5-10 11-10s11 4 11 10c-3-4-7-6-11-6s-8 2-11 6z" fill="#2c2c31"/>'+
   '<circle cx="27.5" cy="32" r="1.7" fill="#ff3b3b"/><circle cx="36.5" cy="32" r="1.7" fill="#ff3b3b"/>'+
   '<path d="M28 39h8" stroke="#151517" stroke-width="1.6"/>'+
   extra+
   '<path d="M6 50c4-3 8-12 8-20" stroke="#e02020" stroke-width="2" opacity="0.55" fill="none"/>'+
   '</svg>';
}
function npcBlurb(id){
  const n=NPCS[id]; if(!n) return '';
  const line=n.lines[Math.floor(Math.random()*n.lines.length)];
  return '<div class="npc-blurb">'+npcPortrait(id,'npc-md')+
   '<div class="npc-text"><b>'+esc(n.name)+'</b><span class="npc-role">'+esc(n.role)+'</span><p>&ldquo;'+esc(line)+'&rdquo;</p></div></div>';
}
/* ---------------- Market buyers (original) ---------------- */
const BUYERS=[
 {id:'street',npc:null,name:'Corner Regulars',title:'LOCAL DEMAND',
  values:'Fast cash, no questions. Base market price.',blurb:'Steady locals. Always buying, never picky.',
  mult:it=>1.0},
 {id:'marcus',npc:'marcus',name:"Marcus 'The Press' Cole",title:'EXTRACT PROCESSOR',
  values:'Pays up to +90% for RESIN.',blurb:'"Frost is money."',
  mult:it=>1+(num(it.resin,0)/100)*0.9},
 {id:'lena',npc:'lena',name:'Lena Voss',title:'BOUTIQUE BUYER',
  values:'Pays up to +80% for TERPENES + BAG APPEAL.',blurb:'"Loud and pretty wins."',
  mult:it=>1+((num(it.terpenes,0)+num(it.bagAppeal,0))/200)*0.8},
 {id:'dscout',npc:'dana',name:"Dana 'Scorecard' Reyes",title:'COMPETITION SCOUT',
  values:'Pays up to +60% for POTENCY, +25% for 90+ quality.',blurb:'"I buy winners."',
  mult:it=>1+(num(it.potency,0)/100)*0.6+(num(it.quality,0)>=90?0.25:0)},
 {id:'archive',npc:'archive',name:'The Archivist',title:'GENETICS COLLECTOR',
  values:'+60% for CUSTOM crosses, +30% for 90+ quality.',blurb:'"Bring me legends."',
  mult:it=>(it.custom?1.6:1)+(num(it.quality,0)>=90?0.3:0)}
];
/* ---------------- Empire hub: underground compound ---------------- */
const HUB_AREAS=[
 {id:'grow',label:'GROW FACILITY',x:200,y:56,go:'grow',un:()=>true,hint:''},
 {id:'project0',label:'PROJECT 0 VAULT',x:200,y:128,go:'project0',un:()=>S.project0.points>=25,hint:'Earn 25 Project 0 points'},
 {id:'genetics',label:'GENETICS LAB',x:78,y:128,go:'genetics',un:()=>S.level>=3,hint:'Reach level 3'},
 {id:'breeding',label:'BREEDING LAB',x:322,y:128,go:'breeding',un:()=>S.stats.crosses>0||S.facility>=2,hint:'Breed once or expand facility'},
 {id:'dispensary',label:'DISPENSARY',x:78,y:200,go:'dispensary',un:()=>S.stats.harvests>0,hint:'Complete a harvest'},
 {id:'keepers',label:'KEEPER VAULT',x:200,y:200,go:'keepers',un:()=>S.keepers.length>0,hint:'Mark your first keeper'},
 {id:'mothers',label:'MOTHER ROOM',x:322,y:200,go:'keepers',tab:'mothers',un:()=>S.mothers.length>0||S.keepers.length>0,hint:'Keep a phenotype first'},
 {id:'drycure',label:'DRY / CURE',x:78,y:272,go:'dispensary',un:()=>S.stats.harvests>0,hint:'Complete a harvest'},
 {id:'compete',label:'COMPETITION ARENA',x:200,y:272,go:'empire',tab:'compete',un:()=>S.level>=4||S.stats.compsEntered>0,hint:'Reach level 4'},
 {id:'equipment',label:'EQUIPMENT DEPOT',x:322,y:272,go:'empire',tab:'equipment',un:()=>S.facility>=1,hint:'Expand your facility'},
 /* P3-W4: new facility tiers surface on the hub map (append-only) */
 {id:'p0lab',label:'P0 LAB',x:78,y:344,go:'project0',un:()=>S.facility>=7,hint:'Own the Project 0 Facility'},
 {id:'empirehq',label:'EMPIRE HQ',x:200,y:344,go:'empire',tab:'facilities',un:()=>S.facility>=8,hint:'Own the Cultivation Empire'}
];
function empireHubSVG(){
  let s='<svg class="hub-map" viewBox="0 0 400 392" role="img" aria-label="Empire compound map">';
  s+='<defs><radialGradient id="hubgl" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff3b3b" stop-opacity="0.28"/><stop offset="1" stop-color="#ff3b3b" stop-opacity="0"/></radialGradient></defs>';
  s+='<rect x="0" y="0" width="400" height="320" fill="#0b090a"/>';
  s+='<path d="M200 56 L200 128 M200 128 L78 128 M200 128 L322 128 M78 128 L78 200 M322 128 L322 200 M78 200 L200 200 L322 200 M78 200 L78 272 M200 200 L200 272 M322 200 L322 272 M78 272 L78 344 M200 272 L200 344" stroke="#2c2c30" stroke-width="7" fill="none"/>';
  s+='<path d="M200 56 L200 128 M200 128 L78 128 M200 128 L322 128 M78 128 L78 200 M322 128 L322 200 M78 200 L200 200 L322 200 M78 200 L78 272 M200 200 L200 272 M322 200 L322 272 M78 272 L78 344 M200 272 L200 344" stroke="#e02020" stroke-width="1.2" opacity="0.4" fill="none"/>';
  HUB_AREAS.forEach(a=>{
    const open=a.un(), w=106, hh=46, x=a.x-w/2, y=a.y-hh/2;
    const words=a.label.split(' ');
    const l1=words.length>1?words.slice(0,-1).join(' '):words[0], l2=words.length>1?words[words.length-1]:'';
    s+='<g class="hub-node '+(open?'open':'locked')+'" data-hub="'+a.id+'">';
    if(open) s+='<ellipse cx="'+a.x+'" cy="'+a.y+'" rx="68" ry="36" fill="url(#hubgl)"/>';
    s+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+hh+'" rx="8" fill="'+(open?'#1b1214':'#0f0f10')+'" stroke="'+(open?'#e02020':'#2c2c2e')+'" stroke-width="'+(open?2:1)+'"/>';
    s+='<text x="'+a.x+'" y="'+(y+(l2?19:28))+'" text-anchor="middle" class="hub-label'+(open?'':' dim')+'">'+esc(l1)+'</text>';
    if(l2) s+='<text x="'+a.x+'" y="'+(y+34)+'" text-anchor="middle" class="hub-label2'+(open?'':' dim')+'">'+esc(l2)+'</text>';
    if(!open) s+='<g transform="translate('+(x+w-16)+','+(y+6)+') scale(0.55)" fill="none" stroke="#6a6a6e" stroke-width="2.4"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></g>';
    s+='</g>';
  });
  return s+'</svg>';
}
/* ---------------- Facility tiers: 9 visual stages ---------------- */
const FAC_TIERS=[
 {name:'STARTER TENT',lights:1,rows:1,rich:0},
 {name:'ADVANCED TENT',lights:1,rows:2,rich:1},
 {name:'HOME GROW ROOM',lights:2,rows:2,rich:1},
 {name:'PRODUCTION ROOM',lights:2,rows:3,rich:2},
 {name:'COMMERCIAL FACILITY',lights:3,rows:3,rich:2},
 {name:'GENETICS LAB',lights:3,rows:3,rich:3,lab:true},
 {name:'BREEDING FACILITY',lights:4,rows:4,rich:3,lab:true},
 {name:'PRESERVATION VAULT',lights:4,rows:4,rich:4,vault:true},
 {name:'SHOCKER OWNZ EMPIRE',lights:6,rows:5,rich:5,vault:true}
];
/* P3-W4: extended additively — indices 0-5 keep their original visual tiers.
   6 Breeding Lab -> BREEDING FACILITY, 7 Project 0 Facility -> PRESERVATION VAULT,
   8 Cultivation Empire -> SHOCKER OWNZ EMPIRE. */
const FAC_TIER_MAP=[0,2,4,3,5,7,6,7,8]; /* S.facility index -> visual tier */
function facTierIdx(){ return FAC_TIER_MAP[clamp(int(S.facility,0),0,FAC_TIER_MAP.length-1)]; }
function avgEquip(){ const q=S.equipment,ks=Object.keys(q); return ks.reduce((a,k)=>a+num(q[k],1),0)/Math.max(1,ks.length); }
/* parameterized facility scene: equipment visibly changes the room */
function facilitySceneSVG(tier){
  if(!S) return '';
  const T=FAC_TIERS[clamp(int(tier,0),0,8)], q=S.equipment;
  const light=clamp(num(S.env.light,80),0,100), glow=(0.18+light/100*0.75).toFixed(2);
  const hot=S.env.temp>86, cold=S.env.temp<64;
  const nL=T.lights, W=400, H=150;
  let h='<svg class="fac-scene" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid slice" aria-hidden="true">';
  const gidFlg=GE_gid('flg'), gidFwl=GE_gid('fwl');
  h+='<defs><radialGradient id="'+gidFlg+'" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff5a5a" stop-opacity="'+glow+'"/><stop offset="1" stop-color="#ff5a5a" stop-opacity="0"/></radialGradient>'+
     '<linearGradient id="'+gidFwl+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#171114"/><stop offset="1" stop-color="#0a0708"/></linearGradient></defs>';
  h+='<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="url(#'+gidFwl+')"/>';
  for(let i=0;i<10;i++) h+='<rect x="'+(i*44-8)+'" y="0" width="2" height="'+H+'" fill="#ffffff" opacity="0.022"/>';
  /* ceiling duct (hvac) */
  if(q.hvac>=2||T.rich>=2){ h+='<rect x="0" y="10" width="'+W+'" height="8" fill="#1c1c1e" stroke="#333"/>';
    for(let dx=40;dx<W;dx+=80) h+='<rect x="'+dx+'" y="10" width="3" height="8" fill="#333"/>'; }
  /* hanging light bars */
  const span=W/(nL+1);
  for(let i=1;i<=nL;i++){
    const x=Math.round(i*span);
    h+='<path d="M'+x+' 18v-8" stroke="#444" stroke-width="3"/>';
    h+='<rect x="'+(x-34)+'" y="20" width="68" height="8" rx="2" fill="#151517" stroke="#7a0d0d"/>';
    for(let b=0;b<4;b++) h+='<rect x="'+(x-28+b*15)+'" y="22" width="11" height="4" fill="#ff6b6b" opacity="'+(0.35+light/100*0.65).toFixed(2)+'"/>';
    h+='<ellipse cx="'+x+'" cy="86" rx="58" ry="52" fill="url(#'+gidFlg+')"/>';
  }
  /* CO2 tanks */
  if(q.co2sys>=2){ [26,W-26].forEach(x=>{ h+='<rect x="'+(x-9)+'" y="'+(H-64)+'" width="18" height="52" rx="8" fill="#232326" stroke="#4a4a4e"/>'; h+='<rect x="'+(x-9)+'" y="'+(H-64)+'" width="18" height="12" rx="6" fill="#2e4a2e"/>'; }); }
  /* irrigation lines */
  if(q.irrigation>=2){ h+='<rect x="0" y="'+(H-14)+'" width="'+W+'" height="4" fill="#1e3a24"/>';
    for(let dx=30;dx<W;dx+=60) h+='<rect x="'+dx+'" y="'+(H-26)+'" width="3" height="14" fill="#2e5a34"/>'; }
  /* drying rack */
  if(q.drycure>=3){ h+='<rect x="'+(W-70)+'" y="46" width="56" height="60" fill="none" stroke="#3a3a3e" stroke-width="2"/>';
    for(let ry=0;ry<3;ry++) h+='<path d="M'+(W-66)+' '+(58+ry*18)+' q 12 -8 24 0 q 12 8 24 0" stroke="#4c7a3c" stroke-width="2.5" fill="none"/>'; }
  /* plant rows */
  const rows=T.rows;
  for(let ri=0;ri<rows;ri++){
    const y0=H-34-ri*10, n=4+Math.min(6,rows);
    for(let i=0;i<n;i++){
      const x=Math.round(20+i*(W-40)/(n-1)), hh=20+((i*37+ri*13)%3)*6+(T.rich*2);
      const leafC=T.vault?'#1d2b18':'#12240f';
      h+='<path d="M'+x+' '+y0+' v-'+hh+' m0 0 c-8 -4 -11 -11 -7 -18 c5 2 8 9 7 18z m0 0 c8 -4 11 -11 7 -18 c-5 2 -8 9 -7 18z" fill="'+leafC+'" stroke="#1d3a1a" stroke-width="1"/>';
      h+='<rect x="'+(x-8)+'" y="'+(y0-8)+'" width="16" height="8" fill="#141414"/>';
    }
  }
  if(T.lab){ h+='<rect x="14" y="60" width="52" height="70" rx="4" fill="#0e1a1c" stroke="#3a6a6e" stroke-width="1.5" opacity="0.9"/>'; h+='<circle cx="40" cy="95" r="12" fill="none" stroke="#e02020" stroke-width="1.5" opacity="0.7"/>'; }
  if(T.vault){ h+='<rect x="0" y="0" width="'+W+'" height="4" fill="#d4a017" opacity="0.5"/>'; h+='<rect x="0" y="'+(H-4)+'" width="'+W+'" height="4" fill="#d4a017" opacity="0.5"/>'; }
  if(hot) h+='<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="#ff5a1a" opacity="0.10"/>';
  if(cold) h+='<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="#8fa8c4" opacity="0.06"/>';
  return h+'</svg>';
}
/* FACILITY UNLOCKED reveal: before/after cinematic */
function facilityUnlockCine(prevT,newT,name){
  const back=cineOverlay(
   '<div class="fac-cine"><div class="display fac-cine-title">FACILITY UNLOCKED</div>'+
   '<div class="fac-before"><span>BEFORE</span>'+facilitySceneSVG(prevT)+'<b>'+esc(FAC_TIERS[prevT].name)+'</b></div>'+
   '<div class="fac-arrow">\u2192</div>'+
   '<div class="fac-after"><span>NOW</span>'+facilitySceneSVG(newT)+'<b>'+esc(name)+'</b></div>'+
   '<p class="muted">+'+FACILITIES[clamp(int(S.facility,0),0,FACILITIES.length-1)].slots+' grow slots</p></div>',
   'cine-facility',3600);
  return back;
}
/* ---------------- 10-stage helpers ---------------- */
const VIS_STAGES=['SEED','SPROUT','SEEDLING','EARLY VEG','VEG','LATE VEG','EARLY FLOWER','MID FLOWER','LATE FLOWER','HARVEST READY'];
function visStageOf(p){
  /* P1.1: germination reuses the existing SEED->SPROUT visuals (the 10 visual stages are untouched) */
  if(p&&p.stage===-1) return num(p.germ,0)>0?1:0;
  const st=getStrain(p.strainId); if(!st) return 0;
  const pr=p.day/Math.max(1,st.ft);
  if(pr<0.04) return 0; if(pr<0.14) return 1; if(pr<0.24) return 2;
  if(pr<0.36) return 3; if(pr<0.50) return 4; if(pr<0.62) return 5;
  if(pr<0.74) return 6; if(pr<0.85) return 7; if(pr<0.95) return 8; return 9;
}
/* phenotype + problem influences on plant appearance */
function plantVisOpts(p){
  const ph=p.pheno||{}, o={};
  o.tall=(num(ph.vigor,70)>=80&&num(ph.structure,70)<=62);
  o.short=num(ph.structure,70)>=85;
  o.bushy=(num(ph.structure,70)>=78&&num(ph.yieldPot,70)>=78);
  const st=getStrain(p.strainId);
  o.purple=((st&&st.tags&&st.tags.includes('Purple'))||num(ph.bagAppeal,60)>=88);
  o.frost=clamp(Math.round(num(ph.resinPot,50)/100*3),0,3);
  o.dense=num(ph.bagAppeal,60)>=68;
  o.trained=!!p.trained;
  const probs=(p.problems||[]).join(' ').toLowerCase();
  o.wilt=num(p.water,70)<18; o.overwater=num(p.water,70)>95;
  o.burn=num(p.nutrition,70)>92||/burn|overfed/.test(probs);
  o.defic=num(p.nutrition,70)<15||/hungry|deficiency/.test(probs);
  o.heat=S&&S.env?num(S.env.temp,76)>86:false;
  o.pests=/mite|gnat|pest/.test(probs);
  return o;
}
/* ---------------- missions: next suggested objective ---------------- */
function nextMission(){ return MISSIONS.find(m=>!S.missionsDone.includes(m.id))||null; }
function nextUpCard(){
  const m=nextMission(); if(!m) return '';
  const pr=missionProg(m), pct=clamp(pr.cur/pr.target*100,0,100);
  return '<div class="card nextup-card"><div class="nextup-tag">'+icon('missions','b-ico')+'NEXT UP</div>'+
   '<h3>'+esc(m.name)+'</h3><p class="muted">'+esc(m.desc)+'</p>'+
   '<div class="progress"><i style="width:'+pct+'%"></i></div>'+
   '<div class="kv"><span>Progress</span><b>'+Math.min(pr.cur,pr.target)+'/'+pr.target+'</b></div>'+
   '<button class="btn btn-small btn-gold" data-go-missions>'+icon('missions','b-ico')+'VIEW MISSIONS</button></div>';
}
/* ---------------- mentor tips (early game) ---------------- */
const MENTOR_TIPS=[
 "Water before they wilt, feed before they fade — the plant tells you everything.",
 "Keep temperature near 76°F and humidity near 52%. Happy plants grow fast.",
 "Tap a plant to focus it. Water, feed, train — then advance the day and watch.",
 "Don't overwater! Soggy roots stress harder than dry ones.",
 "Train in veg for bigger yields. Flowering plants want peace.",
 "Inspect often. The ??? traits reveal as your plant matures.",
 "Harvest at HARVEST READY. Quality 90+ can become a keeper."
];
/* ---------------- day-transition overlay ---------------- */
function dayTransition(day,lines){
  cineOverlay('<div class="daytrans"><div class="daytrans-sweep"></div>'+
   '<div class="display daytrans-day">DAY '+day+'</div>'+
   '<div class="daytrans-lines">'+lines.map(l=>'<p>'+esc(l)+'</p>').join('')+'</div>'+
   '<p class="muted tap">TAP TO CONTINUE</p></div>','cine-day',1500);
}
/* ---- procedural flower / bud visual for cards ---- */
const GE_flowerCache={}; /* QA GE-704: flowerSVG output is deterministic per seed — memoize (genetics grids rendered 7k+ nodes) */
function flowerSVG(seedStr,cls){
  const ckey='f|'+seedStr+'|'+(cls||'');
  const hit=GE_flowerCache[ckey]; if(hit) return hit;
  const R=sRng('flower|'+seedStr);
  const purp=R()<0.45;
  const bgid=GE_gid('bg'); /* QA GE-003: unique id — no cross-seed gradient collisions */
  let inner='<defs><radialGradient id="'+bgid+'" cx="0.5" cy="0.42" r="0.75"><stop offset="0" stop-color="#2a1215"/><stop offset="1" stop-color="#0b0b0c"/></radialGradient></defs>';
  inner+='<rect x="0" y="0" width="120" height="120" fill="url(#'+bgid+')"/>';
  const cx=60, cy=62;
  const cols=purp?['#3a2440','#4e3054','#5e3a63','#6e4a76']:['#2e4a26','#3a5c2e','#486e38','#57824a'];
  for(let ring=2;ring>=0;ring--){
    const n=10-ring*2, rad=44-ring*13;
    for(let i=0;i<n;i++){
      const a=(i/n)*Math.PI*2+R()*0.3, w=9-ring*1.6, l=20-ring*3.5;
      const x=cx+Math.cos(a)*rad*0.72, y=cy+Math.sin(a)*rad*0.72;
      inner+='<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+(a*180/Math.PI+90).toFixed(1)+')">'+
        '<path d="M0 '+(-l/2).toFixed(1)+' Q '+w.toFixed(1)+' 0 0 '+(l/2).toFixed(1)+' Q '+(-w).toFixed(1)+' 0 0 '+(-l/2).toFixed(1)+'" fill="'+cols[ring]+'" opacity="0.96"/></g>';
    }
  }
  for(let i=0;i<26;i++){ /* calyx cluster */
    const a=R()*Math.PI*2, rr=R()*20;
    inner+='<circle cx="'+(cx+Math.cos(a)*rr).toFixed(1)+'" cy="'+(cy+Math.sin(a)*rr).toFixed(1)+'" r="'+(2.4+R()*2.6).toFixed(1)+'" fill="'+cols[3]+'" stroke="#00000055"/>';
  }
  for(let i=0;i<10;i++){ /* amber pistils */
    const a=R()*Math.PI*2, r1=6+R()*10, r2=r1+6+R()*8;
    inner+='<path d="M'+(cx+Math.cos(a)*r1).toFixed(1)+' '+(cy+Math.sin(a)*r1).toFixed(1)+' q '+((R()-0.5)*8).toFixed(1)+' '+((R()-0.5)*8).toFixed(1)+' '+(cx+Math.cos(a)*r2).toFixed(1)+' '+(cy+Math.sin(a)*r2).toFixed(1)+'" stroke="#d98a3a" stroke-width="1.4" fill="none"/>';
  }
  for(let i=0;i<46;i++){ /* trichome frost */
    inner+='<circle cx="'+(cx+(R()-0.5)*76).toFixed(1)+'" cy="'+(cy+(R()-0.5)*76).toFixed(1)+'" r="'+(0.7+R()*1.1).toFixed(1)+'" fill="#fff" opacity="'+(0.5+R()*0.5).toFixed(2)+'"/>';
  }
  inner+='<rect x="0" y="86" width="120" height="34" fill="url(#'+bgid+')" opacity="0"/>';
  const svg='<svg class="flower-art '+(cls||'')+'" viewBox="0 0 120 120" aria-hidden="true">'+inner+'</svg>';
  if(Object.keys(GE_flowerCache).length<400) GE_flowerCache[ckey]=svg;
  return svg;
}
/* ---- grow-room scene banner: lights react to S.env ---- */
function roomSceneSVG(){
  if(!S) return '';
  const light=clamp(num(S.env.light,80),0,100), glow=(0.18+light/100*0.75).toFixed(2);
  const hot=S.env.temp>86, cold=S.env.temp<64;
  let h='<svg class="room-scene" viewBox="0 0 400 130" preserveAspectRatio="xMidYMid slice" aria-hidden="true">';
  const gidLg=GE_gid('lg'), gidHz=GE_gid('hz');
  h+='<defs><radialGradient id="'+gidLg+'" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff5a5a" stop-opacity="'+glow+'"/><stop offset="1" stop-color="#ff5a5a" stop-opacity="0"/></radialGradient>'+
     '<linearGradient id="'+gidHz+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.05"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>';
  h+='<rect x="0" y="0" width="400" height="130" fill="#0a0708"/>';
  for(let i=0;i<9;i++) h+='<rect x="'+(i*50-10)+'" y="0" width="2" height="130" fill="#ffffff" opacity="0.025"/>';
  h+='<rect x="0" y="14" width="400" height="7" fill="#1c1c1e" stroke="#333"/>'; /* ducting */
  h+='<circle cx="352" cy="60" r="13" fill="none" stroke="#3a3a3e" stroke-width="4"/><path d="M352 47v26M339 60h26M343 51l18 18M361 51l-18 18" stroke="#3a3a3e" stroke-width="2.5"/>'; /* fan */
  [70,200,330].forEach(x=>{
    h+='<rect x="'+(x-46)+'" y="26" width="92" height="9" rx="2" fill="#151517" stroke="#7a0d0d"/>';
    for(let b=0;b<6;b++) h+='<rect x="'+(x-40+b*14)+'" y="28" width="10" height="5" fill="#ff6b6b" opacity="'+(0.35+light/100*0.65).toFixed(2)+'"/>';
    h+='<ellipse cx="'+x+'" cy="78" rx="72" ry="46" fill="url(#'+gidLg+')"/>';
    h+='<path d="M'+(x-46)+' 35v-8M'+(x+46)+' 35v-8" stroke="#444" stroke-width="3"/>';
  });
  h+='<rect x="0" y="0" width="400" height="130" fill="url(#'+gidHz+')"/>';
  /* plant row silhouettes */
  for(let i=0;i<8;i++){ const x=18+i*48, hh=26+((i*37)%3)*8;
    h+='<path d="M'+x+' 130 v-'+hh+' m0 0 c-9 -4 -12 -12 -8 -20 c6 2 9 10 8 20z m0 0 c9 -4 12 -12 8 -20 c-6 2 -9 10 -8 20z" fill="#12240f" stroke="#1d3a1a" stroke-width="1"/>';
    h+='<rect x="'+(x-9)+'" y="122" width="18" height="8" fill="#141414"/>'; }
  if(hot) h+='<rect x="0" y="0" width="400" height="130" fill="#ff5a1a" opacity="0.10" class="room-warn-hot"/>';
  if(cold) h+='<rect x="0" y="0" width="400" height="130" fill="#8fa8c4" opacity="0.06"/>';
  return h+'</svg>';
}
/* ---- brand marks ---- */
function crownSVG(gold,cls){
  const c=gold?'#d4a017':'#e02020';
  const gid=GE_gid('crw'+(gold?'g':'r'));
  return '<svg class="crown-svg '+(cls||'')+'" viewBox="0 0 48 34" aria-hidden="true">'+
   '<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+(gold?'#f4d35e':'#ff5a5a')+'"/><stop offset="1" stop-color="'+c+'"/></linearGradient></defs>'+
   '<path d="M4 10l7 5.5L24 6l13 9.5L44 10 40.5 28h-33z" fill="url(#'+gid+')" stroke="#000" stroke-width="1"/>'+
   '<rect x="7.5" y="29" width="33" height="3" rx="1.5" fill="'+c+'"/>'+
   '<circle cx="4" cy="9" r="2.4" fill="'+c+'"/><circle cx="24" cy="5" r="2.4" fill="'+c+'"/><circle cx="44" cy="9" r="2.4" fill="'+c+'"/>'+
   '<circle cx="24" cy="19" r="2.6" fill="'+(gold?'#7a0d0d':'#ffd7d7')+'"/></svg>';
}
function gasmaskSVG(cls){
  const gid=GE_gid('gmz');
  return '<svg class="gasmask-svg '+(cls||'')+'" viewBox="0 0 64 64" aria-hidden="true">'+
   '<defs><radialGradient id="'+gid+'" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff3b3b"/><stop offset="1" stop-color="#7a0d0d"/></radialGradient></defs>'+
   '<path d="M32 5C20.5 5 13 13.5 13 26c0 7.8 3.8 14 9.6 17.4L25.5 51h13l2.9-7.6C47.2 40 51 33.8 51 26 51 13.5 43.5 5 32 5z" fill="#161616" stroke="#e02020" stroke-width="2"/>'+
   '<circle cx="23.5" cy="26" r="7" fill="#050505" stroke="#333" stroke-width="1.5"/><circle cx="40.5" cy="26" r="7" fill="#050505" stroke="#333" stroke-width="1.5"/>'+
   '<circle cx="23.5" cy="26" r="3.4" fill="url(#'+gid+')"/><circle cx="40.5" cy="26" r="3.4" fill="url(#'+gid+')"/>'+
   '<rect x="27" y="35" width="10" height="8" rx="3" fill="#0a0a0a" stroke="#444"/>'+
   '<path d="M15 13l5 3.5M49 13l-5 3.5" stroke="#e02020" stroke-width="2.5"/></svg>';
}
function dnaSVG(cls){
  let rungs='';
  for(let i=0;i<7;i++){ const y=12+i*15, off=Math.sin(i*0.9)*14;
    rungs+='<line x1="'+(30-off-8)+'" y1="'+y+'" x2="'+(30-off+8)+'" y2="'+y+'" stroke="#e02020" stroke-width="2" opacity="0.8"/>'; }
  return '<svg class="dna-svg '+(cls||'')+'" viewBox="0 0 60 120" aria-hidden="true">'+
   '<path class="dna-strand" d="M16 4 C44 24 44 44 16 60 C-12 76 -12 96 16 116" fill="none" stroke="#ff5a5a" stroke-width="3"/>'+
   '<path class="dna-strand" d="M44 4 C16 24 16 44 44 60 C72 76 72 96 44 116" fill="none" stroke="#8a8a8a" stroke-width="3"/>'+rungs+'</svg>';
}
/* ---- strain art seed ---- */
function strainSeed(st){ return (st?st.id:'x')+'|'+(st?st.name:''); }
/* ---- cinematic overlay shell (keeper / legendary / levelup) ---- */
function cineOverlay(inner,cls,ms){
  const root=$('modal-root');
  const back=document.createElement('div'); back.className='cine-back ge-modal-back '+(cls||'');
  back.innerHTML='<div class="cine-stage ge-cine-stage">'+inner+'</div>';
  root.appendChild(back);
  /* force reflow so the tokens entrance transition (.is-open) plays */
  void back.offsetWidth;
  back.classList.add('is-open');
  if(ms!==0) setTimeout(()=>{ back.classList.add('cine-out'); back.classList.remove('is-open'); setTimeout(()=>back.remove(),450); }, ms||4200);
  /* only close when the backdrop itself is tapped — never on bubbled content taps */
  back.addEventListener('click',(e)=>{ if(e&&e.target!==back) return; back.classList.add('cine-out'); back.classList.remove('is-open');
    /* W4: backdrop dismiss is a real dismissal — run the registered hook after
       removal (same ordering as the Android back path; queue pumps must not
       see the still-attached node). */
    setTimeout(()=>{ try{ back.remove(); }catch(_){} try{ if(typeof back.__geOnDismiss==='function') back.__geOnDismiss(); }catch(_){} },300); });
  const stage=back.querySelector('.cine-stage');
  if(stage) stage.addEventListener('click',(e)=>{ if(e&&e.stopPropagation) e.stopPropagation(); });
  return back;
}

function toast(msg,ms){
  const t=document.createElement('div'); t.className='ge-toast'; t.innerHTML=msg;
  $('toast-root').appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity .4s'; setTimeout(()=>t.remove(),400); }, ms||2600);
}

function modal(html){
  const root=$('modal-root');
  const back=document.createElement('div'); back.className='modal-back ge-modal-back';
  back.innerHTML='<div class="modal ge-modal">'+html+'</div>';
  root.appendChild(back);
  /* QA GE-005: backdrop tap dismisses regular modals (cinematics use cineOverlay, unaffected) */
  back.addEventListener('click',function(e){ if(e.target===back){ try{closeModal(back);}catch(_){ back.remove(); } } });
  if(!window.__geEscWired){ window.__geEscWired=true;
    document.addEventListener('keydown',function(e){ if(e&&e.key==='Escape'){ var r=$('modal-root'); var top=r&&r.lastElementChild;
      if(top&&top.classList.contains('modal-back')){ try{closeModal(top);}catch(_){ top.remove(); } } } }); }
  /* force reflow so the tokens entrance transition (.is-open) plays */
  void back.offsetWidth;
  back.classList.add('is-open');
  return back;
}

function closeModal(back){ back.remove(); }
function confirmModal(title,text,onYes){
  const m=modal('<div class="ge-modal-head"><h3>'+esc(title)+'</h3></div>'+
    '<div class="ge-modal-body"><p class="ge-body">'+esc(text)+'</p></div>'+
    '<div class="ge-modal-foot"><button class="ge-btn ge-btn-danger" id="cm-no">CANCEL</button>'+
    '<button class="ge-btn ge-btn-primary" id="cm-yes">CONFIRM</button></div>');
  m.querySelector('#cm-no').onclick=()=>closeModal(m);
  let cmFired=false; /* QA GE-702: disarm after first activation — detached nodes can still receive events */
  m.querySelector('#cm-yes').onclick=()=>{ if(cmFired) return; cmFired=true; closeModal(m); onYes(); };
}

function statBar(label,val,max,color){
  max=max||100;
  const pct=clamp(Math.round(val/max*100),0,100);
  const tone=color==='green'?'ge-progress-ok':color==='amber'?'ge-progress-warn':color==='red'?'ge-progress-bad':color==='gold'?'ge-progress-gold':'';
  return '<div class="ge-progress-meta"><span class="ge-label">'+label+'</span><b class="ge-data">'+Math.round(val)+'</b></div>'+
    '<div class="ge-progress '+tone+'"><i style="width:'+pct+'%"></i></div>';
}


/* ---------------- Navigation ---------------- */
const SCREENS=['splash','difficulty','menu','home','grow','grows','genetics','dispensary','breeding','project0','empire','missions','challenges','achievements','leaderboards','locations','keepers','settings'];
const RENDER={};
let current='splash';
function show(name){
  if(!SCREENS.includes(name)) name='menu';
  /* P1.5: enforce the Genetics Lab level-3 gate (HUB_AREAS claim) on every nav path */
  try{
    if(name==='genetics'&&typeof S!=='undefined'&&S&&int(S.level,1)<3){
      try{ toast(icon('lock','ge-ic-md')+' GENETICS LAB \u2014 Reach level 3'); }catch(e2){}
      name='menu';
    }
  }catch(e){}
  if((typeof S==='undefined'||!S)&&name!=='login'&&name!=='splash'&&name!=='difficulty'&&name!=='welcome') name='login'; /* QA GE-002: never render with null state */
  try{ if(typeof closeFocus==='function') closeFocus(); }catch(e){}
  try{ const mr=$('modal-root'); if(mr) while(mr.firstChild) mr.firstChild.remove(); }catch(e){} /* QA GE-700: no ghost modals over the new screen */
  SCREENS.forEach(s=>$('scr-'+s).classList.add('hidden'));
  $('scr-'+name).classList.remove('hidden');
  current=name;
  const chrome = (name!=='splash'&&name!=='difficulty'&&name!=='login'&&name!=='welcome');
  $('hud').classList.toggle('hidden',!chrome);
  $('bottomnav').classList.toggle('hidden',!chrome);
  document.querySelectorAll('#bottomnav button').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));
  try{ /* P1.5: dim the Genetics dock button until the level-3 gate opens */
    document.querySelectorAll('#bottomnav [data-nav="genetics"]').forEach(b=>b.classList.toggle('nav-locked',int(S.level,1)<3));
  }catch(e){}
  if(RENDER[name]) RENDER[name]();
  /* expansion: active global-event banner on grow + dashboard screens */
  try{
    if((name==='grow'||name==='home')&&typeof WX_bannerHTML==='function'){
      const bn=WX_bannerHTML();
      /* QA GE-701: remove any previous banner before inserting (no duplicates) */
      if(bn){ const sec=$('scr-'+name); const prev=sec.querySelector(':scope > .ge-wx-banner-wrap'); if(prev) prev.remove();
        const d=document.createElement('div'); d.className='ge-wx-banner-wrap'; d.innerHTML=bn; sec.insertBefore(d,sec.firstChild); }
    }
  }catch(e){}
  try{ document.body.dataset.screen=name; }catch(e){}
  window.scrollTo(0,0);
}
function screenHead(ico,title){
  return '<div class="ge-screenhead"><button class="ge-screenhead-back" onclick="show(\'menu\')">'+icon('x','ge-ic-md')+'<span>MENU</span></button><h2 class="ge-screenhead-title">'+icon(ico,'ge-ic-lg')+esc(title)+'</h2></div>';
}

let _hudPrev={cash:0,rep:0,xp:0,level:1,day:1};
function hudFloat(text,cls){
  const hud=$('hud'); if(!hud) return;
  const f=document.createElement('div'); f.className='ge-hud-float '+(cls||''); f.textContent=text;
  hud.appendChild(f);
  setTimeout(()=>f.remove(),1600);
}

function updateHUD(){
  if(!S) return;
  const cash=Math.round(num(S.cash,0)), rep=int(S.reputation,0),
        lvl=Math.max(1,int(S.level,1)), day=Math.max(1,int(S.day,1));
  const elC=$('hud-cash'), elR=$('hud-rep'), elL=$('hud-level'), elD=$('hud-day');
  if(elC){
    if(cash>_hudPrev.cash&&_hudPrev.cash>0) hudFloat('+'+fmt$(cash-_hudPrev.cash),'gain');
    else if(cash<_hudPrev.cash) hudFloat(fmt$(cash-_hudPrev.cash),'loss');
    elC.innerHTML=icon('cash','ge-ic-sm')+'<span class="ge-num ge-hud-val">'+fmt$(cash)+'</span>';
  }
  if(elR) elR.innerHTML=icon('rep','ge-ic-sm')+'<span class="ge-num ge-hud-val">'+rep+'</span>';
  if(elL) elL.innerHTML=icon('level','ge-ic-sm')+'<span class="ge-num ge-hud-val">'+lvl+'</span>';
  if(elD) elD.innerHTML=icon('day','ge-ic-sm')+'<span class="ge-num ge-hud-val">'+day+'</span>';
  /* XP micro-bar under LVL (element lives in the new topbar markup; guarded) */
  const elX=$('hud-xpbar');
  if(elX){ try{ elX.style.width=clamp(Math.round(num(S.xp,0)/xpNeed(lvl)*100),0,100)+'%'; }catch(e){} }
  _hudPrev={cash:cash,rep:rep,xp:num(S.xp,0),level:lvl,day:day};
}

function levelUpOverlay(lvl){
  cineOverlay('<div class="ge-lvlup ge-anim-rise">'+crownSVG(true,'ge-lvlup-crown')+
   '<div class="ge-display ge-lvlup-title">LEVEL UP</div>'+
   '<div class="ge-label ge-lvlup-sub">LEVEL '+lvl+' &mdash; THE EMPIRE GROWS</div></div>','cine-levelup ge-cine-levelup',2600);
}


/* ---------------- Progression ---------------- */
function xpNeed(lvl){ lvl=Math.max(1,int(lvl,1)); return Math.round(100*Math.pow(1.35,lvl-1)); }
function gainXP(n){
  n=num(n,0); if(!(n>0)) return;
  S.xp=num(S.xp,0)+n; S.level=Math.max(1,int(S.level,1));
  let need=xpNeed(S.level);
  while(S.xp>=need){ S.xp-=need; S.level++; need=xpNeed(S.level);
    setTimeout(((lv)=>()=>{ toast('LEVEL UP! You are now level '+lv); try{levelUpOverlay(lv);}catch(e){} })(S.level),60);
  }
}
function gainRep(n){
  n=num(n,0); if(!(n>0)) return;
  S.reputation=int(S.reputation,0);
  const mult = S.crew.manager?1.1:1;
  S.reputation+=Math.round(n*mult);
  // auto-unlock rep-gated strains
  STRAINS.forEach(st=>{
    if(st.lock&&st.lock.t==='rep'&&S.reputation>=st.lock.v) unlockStrain(st.id,false); /* availability only — owned on first planting */
  });
  try{ if(typeof TY_repMirror==='function') TY_repMirror(n); }catch(e){}
}
function addP0(track,n){
  let p0Before=0; try{ p0Before=p0Level(track); }catch(e){}
  /* P3-W4: Project 0 Facility preservation lab — +25% P0 points on the preservation track */
  try{ if(typeof P3W4_p0Mult==='function') n=Math.ceil(n*P3W4_p0Mult(track)); }catch(e){}
  try{ if(typeof P3W5_p0Mult==='function') n=Math.ceil(n*P3W5_p0Mult()); }catch(e){} /* P3-W5: Archivist's Trust (P0 Rep unlock) */
  S.project0.tracks[track]=Math.min(200,(S.project0.tracks[track]||0)+n);
  S.project0.points+=n;
  try{ const p0After=p0Level(track); if(p0After>p0Before) NT_onP0Level(track,p0After); }catch(e){} /* P1.6: P0 level -> teaser (read-only) */
  checkP0Rewards();
}
function p0Level(track){
  const pts=S.project0.tracks[track]||0;
  let lvl=0;
  P0_LEVEL_PTS.forEach((th,i)=>{ if(pts>=th) lvl=i; });
  return lvl;
}
function checkP0Rewards(){
  Object.keys(P0_REWARDS).forEach(tr=>{
    const lvl=p0Level(tr), rw=P0_REWARDS[tr][lvl];
    if(rw&&!S.project0['rw_'+tr+'_'+lvl]){
      S.project0['rw_'+tr+'_'+lvl]=true;
      if(rw.cash){ S.cash+=rw.cash; toast(icon('project0','ge-ic-md')+' Project 0: +'+fmt$(rw.cash)); }
      if(rw.rep){ gainRep(rw.rep); toast(icon('project0','ge-ic-md')+' Project 0: +'+rw.rep+' rep'); }
      if(rw.xp){ gainXP(rw.xp); }
      if(rw.gen){ rw.gen.forEach(g=>unlockStrain(g,true)); }
      if(rw.title){ S.project0.titles.push(rw.title); S.titles.push(rw.title); toast(icon('trophy','ge-ic-md')+' Title earned: '+rw.title); }
    }
  });
}

/* ---------------- Missions engine ---------------- */
function missionState(m){
  if(S.missionsDone.includes(m.id)) return 'done';
  return 'open';
}
function checkMissions(){
  const D=DIFFS[S.difficulty];
  MISSIONS.forEach(m=>{
    if(S.missionsDone.includes(m.id)) return;
    let cur=0,target=1;
    try{ const p=m.prog(S); cur=p[0]; target=p[1]; }catch(e){ return; }
    if(cur>=target){
      S.missionsDone.push(m.id);
      try{ NT_onMissionDone(m.id); }catch(e){} /* P1.6: mission -> next-mission teaser (read-only) */
      S.stats.missionsDone++;
      const r=m.reward||{};
      const rmult=D.missionReward;
      if(r.cash){ const c=Math.round(r.cash*rmult); S.cash+=c; }
      if(r.rep) gainRep(r.rep);
      if(r.xp) gainXP(r.xp);
      if(r.gen) r.gen.forEach(g=>unlockStrain(g,true));
      if(r.p0) addP0('knowledge',r.p0);
      if(r.unlock){ try{ if(typeof TY_grantUnlock==='function') TY_grantUnlock(r.unlock,m.name); }catch(e){} }
      const nm=m.name;
      setTimeout(()=>toast(icon('trophy','ge-ic-md')+' Mission complete: <b>'+esc(nm)+'</b>'),50);
      // mission-locked strain p0-50
      if(m.id==='p0-50') unlockStrain('project-zero-og',true);
      if(m.id==='tut-sell'){ try{ TU_onFirstSale(); }catch(e){} } /* P1.5: fire tease cards once */
    }
  });
  /* P2.3: mission chains advance on the same sweep (flat mission logic above untouched) */
  try{ if(typeof CHA_check==='function') CHA_check(); }catch(e){}
}

/* ============================================================
   P2.3 — MISSION CHAINS (story arcs)
   Additive layer over flat MISSIONS. Chain-scoped snapshots make
   stage-skipping impossible; CHA_migrate validates on load.
   ============================================================ */
const CHAINS=[
 {id:'ch-pheno',name:'THE PHENO HUNT',
  story:'Every legend starts as a seed. Hunt the phenotypes, crown one keeper, and prove it with a clone run.',
  reward:{cash:1000,xp:400,rep:20,gen:['gelato-33']},
  stages:[
   {id:'own',name:'First Contact',desc:'Own a genetic — buy seeds or unlock a strain.',snap:[],
    prog:(s)=>[Math.min(ownedCount(s),1),1]},
   {id:'sprout',name:'Pop the Seeds',desc:'Germinate 3 seeds into seedlings.',snap:['stats.sprouted'],
    prog:(s,snap)=>[Math.min(CHA_d(snap,'stats.sprouted'),3),3]},
   {id:'subjects',name:'Test Subjects',desc:'Plant 6 seeds — every seed is a new phenotype.',snap:['stats.phenoTested'],
    prog:(s,snap)=>[Math.min(CHA_d(snap,'stats.phenoTested'),6),6]},
   {id:'select',name:'The Selection',desc:'Harvest 3 phenotypes.',snap:['stats.phenoHarvested'],
    prog:(s,snap)=>[Math.min(CHA_d(snap,'stats.phenoHarvested'),3),3]},
   {id:'compare',name:'Side by Side',desc:'Compare phenotypes twice in the lab.',snap:['stats.comparesDone'],
    prog:(s,snap)=>[Math.min(CHA_d(snap,'stats.comparesDone'),2),2]},
   {id:'keeper',name:'Crown One',desc:'Mark a keeper phenotype.',snap:['stats.keepersFound'],
    prog:(s,snap)=>[Math.min(CHA_d(snap,'stats.keepersFound'),1),1]},
   {id:'cut',name:'Take the Cut',desc:'Take a clone of your keeper.',snap:['stats.clonesTaken'],
    prog:(s,snap)=>[Math.min(CHA_d(snap,'stats.clonesTaken'),1),1]},
   {id:'cloneharv',name:'Second Generation',desc:'Grow a clone to harvest.',snap:['stats.cloneHarvests'],
    prog:(s,snap)=>[Math.min(CHA_d(snap,'stats.cloneHarvests'),1),1]},
   {id:'proven',name:'Proven Keeper',desc:'Harvest a keeper clone again — confirm the keeper.',snap:['stats.cloneHarvests'],
    prog:(s,snap)=>[Math.min(CHA_d(snap,'stats.cloneHarvests'),1),1]}
  ]},
 {id:'ch-dialedin',name:'DIALED IN',
  story:'Great weed is grown in the details. Learn the room, hold it steady, then carry a plant through a full growth stage in the zone.',
  reward:{cash:400,xp:200,rep:8},
  stages:[
   {id:'read',name:'Read the Room',desc:'Score 80+ on the environment readout for a day.',snap:[],
    prog:(s,snap,ch)=>[ch.data.env80?1:0,1]},
   {id:'steady',name:'Steady Climate',desc:'Hold a 90+ env score for 3 consecutive days.',snap:[],
    prog:(s,snap,ch)=>[Math.min(int(ch.data.streak90,0),3),3]},
   {id:'stage',name:'Full Stage Dialed',desc:'Keep a plant advancing one full growth stage with env never below 90.',snap:[],
    prog:(s,snap,ch)=>[ch.data.stageDone?1:0,1]}
  ]},
 {id:'ch-comeback',name:'THE COMEBACK',
  story:'Every grower loses a plant. Legends bring one back. Nurse a flatlined plant all the way to harvest.',
  reward:{cash:350,xp:180,rep:8},
  stages:[
   {id:'flat',name:'Flatline',desc:'A plant crashes to 30% health or below.',snap:[],
    prog:(s,snap,ch)=>[ch.data.critical?1:0,1]},
   {id:'brink',name:'Back From the Brink',desc:'Nurse that plant back to 85%+ health.',snap:[],
    prog:(s,snap,ch)=>[ch.data.recovered?1:0,1]},
   {id:'harvest',name:'The Harvest',desc:'Harvest the comeback plant.',snap:[],
    prog:(s,snap,ch)=>[ch.data.comeback?1:0,1]}
  ]},
 {id:'ch-genehunter',name:'GENE HUNTER',
  story:'The hunt never ends. Test phenotypes, chase the elite expressions, and bag the unicorn: a true legendary.',
  reward:{cash:900,xp:400,rep:15,gen:['mac-1']},
  stages:[
   {id:'look',name:'First Look',desc:'Test 3 phenotypes.',snap:['stats.phenoTested'],
    prog:(s,snap)=>[Math.min(CHA_d(snap,'stats.phenoTested'),3),3]},
   {id:'deep',name:'Deep Cuts',desc:'Test 12 phenotypes.',snap:['stats.phenoTested'],
    prog:(s,snap)=>[Math.min(CHA_d(snap,'stats.phenoTested'),12),12]},
   {id:'elite',name:'Elite Blood',desc:'Discover an ELITE phenotype.',snap:['stats.eliteFound'],
    prog:(s,snap)=>[Math.min(CHA_d(snap,'stats.eliteFound'),1),1]},
   {id:'unicorn',name:'The Unicorn',desc:'Discover a LEGENDARY phenotype.',snap:['stats.legendaryFound'],
    prog:(s,snap)=>[Math.min(CHA_d(snap,'stats.legendaryFound'),1),1]}
  ]},
 {id:'ch-seedtoshelf',name:'FROM SEED TO SHELF',
  story:'Dirt to dollars. Run one full pipeline — plant, harvest, process, package, sell — and own every step.',
  reward:{cash:600,xp:250,rep:10},
  stages:[
   {id:'sow',name:'Sow',desc:'Plant a seed.',snap:['stats.plantsStarted'],
    prog:(s,snap)=>[Math.min(CHA_d(snap,'stats.plantsStarted'),1),1]},
   {id:'reap',name:'Reap',desc:'Harvest a plant.',snap:['stats.harvests'],
    prog:(s,snap)=>[Math.min(CHA_d(snap,'stats.harvests'),1),1]},
   {id:'refine',name:'Refine',desc:'Process 1 oz of flower into product.',snap:['stats.processedOz'],
    prog:(s,snap)=>[Math.min(CHA_d(snap,'stats.processedOz'),1),1]},
   {id:'pack',name:'Shelf-Ready',desc:'Package a finished product from this run.',snap:['ty.nextProdId'],
    prog:(s,snap)=>{ const base=num(snap['ty.nextProdId'],1);
      const hit=((s.ty&&s.ty.prod)||[]).some(p=>p&&p.packaged&&num(p.id,0)>=base);
      return [hit?1:0,1]; }},
   {id:'sell',name:'Cash Out',desc:'Sell product.',snap:['stats.sales'],
    prog:(s,snap)=>[Math.min(CHA_d(snap,'stats.sales'),1),1]}
  ]},
 {id:'ch-p0',name:'PROJECT 0 INITIATION',
  story:'It is never about the money — only the genetics. Earn your first preservation score and walk a Project 0 track.',
  reward:{cash:300,xp:150,p0:5},
  stages:[
   {id:'light',name:'First Light',desc:'Earn 3 Project 0 points.',snap:['project0.points'],
    prog:(s,snap)=>[Math.min(CHA_d(snap,'project0.points'),3),3]},
   {id:'preserve',name:'Preserve',desc:'Preserve genetics in the vault.',snap:['stats.preserved'],
    prog:(s,snap)=>[Math.min(CHA_d(snap,'stats.preserved'),1),1]},
   {id:'track',name:'Walk the Path',desc:'Reach level 1 in any Project 0 track.',snap:['project0.tracks'],
    prog:(s,snap)=>{ let g=0;
      (typeof P0_TRACKS!=='undefined'?P0_TRACKS:[]).forEach(tr=>{
        const base=num((snap['project0.tracks']||{})[tr.id],0); let blvl=0;
        P0_LEVEL_PTS.forEach((th,i)=>{ if(base>=th) blvl=i; });
        g=Math.max(g,p0Level(tr.id)-blvl); });
      return [Math.min(g,1),1]; }}
  ]}
];
function CHA_def(id){ return CHAINS.find(c=>c.id===id)||null; }
function CHA_freshChain(){ return {stage:0,done:false,reward:false,sdone:{},snaps:{},data:{}}; }
function CHA_getPath(path){
  try{
    const parts=String(path).split('.'); let o=S;
    for(const k of parts){ if(o==null) return 0; o=o[k]; }
    if(o&&typeof o==='object') return JSON.parse(JSON.stringify(o));
    return num(o,0);
  }catch(e){ return 0; }
}
function CHA_snapOf(keys){ const o={}; (keys||[]).forEach(k=>{ o[k]=CHA_getPath(k); }); return o; }
function CHA_d(snap,path){ return num(CHA_getPath(path),0)-num(snap?snap[path]:0,0); }
function CHA_state(id){
  const def=CHA_def(id); if(!def) return null;
  if(!S.chains||typeof S.chains!=='object') S.chains={};
  let ch=S.chains[id];
  if(!ch||typeof ch!=='object'){ ch=CHA_freshChain(); S.chains[id]=ch; }
  return CHA_validateChain(def,ch);
}
function CHA_ensureSnap(def,ch){
  const st=def.stages[ch.stage]; if(!st) return;
  if(!ch.snaps[st.id]) ch.snaps[st.id]=CHA_snapOf(st.snap);
}
function CHA_validateChain(def,ch){
  const n=def.stages.length;
  ch.stage=clamp(int(ch.stage,0),0,n);
  if(!ch.sdone||typeof ch.sdone!=='object') ch.sdone={};
  if(!ch.snaps||typeof ch.snaps!=='object') ch.snaps={};
  if(!ch.data||typeof ch.data!=='object') ch.data={};
  Object.keys(ch.sdone).forEach(k=>{ const i=int(k,-1); if(i<0||i>=n) delete ch.sdone[k]; });
  let firstOpen=0; while(firstOpen<n&&ch.sdone[firstOpen]) firstOpen++;
  if(ch.stage>firstOpen) ch.stage=firstOpen;
  if(ch.done&&firstOpen<n){ ch.done=false; ch.reward=false; }
  for(let i=0;i<firstOpen;i++){
    const st=def.stages[i], snap=ch.snaps[st.id];
    if(!snap) continue;
    let ok=false, isDone=false;
    try{ const p=st.prog(S,snap,ch); isDone=(p[0]>=p[1]); ok=true; }catch(e){}
    if(ok&&!isDone){
      for(let j=i;j<n;j++) delete ch.sdone[j];
      Object.keys(ch.snaps).forEach(k=>{
        const idx=def.stages.findIndex(x=>x.id===k); if(idx>=i) delete ch.snaps[k]; });
      ch.stage=i; ch.done=false; ch.reward=false;
      break;
    }
  }
  return ch;
}
function CHA_migrate(){
  try{
    if(!S||typeof S!=='object') return;
    if(!S.chains||typeof S.chains!=='object') S.chains={};
    Object.keys(S.chains).forEach(id=>{
      const def=CHA_def(id);
      if(!def){ delete S.chains[id]; return; }
      CHA_validateChain(def,S.chains[id]);
    });
    if(S.stats&&typeof S.stats==='object') S.stats.chainsDone=int(S.stats.chainsDone,0);
  }catch(e){}
}
function CHA_check(){
  if(!S) return;
  CHAINS.forEach(def=>{
    const ch=CHA_state(def.id); if(!ch) return;
    if(ch.done){ if(!ch.reward) CHA_grantReward(ch,def); return; }
    let guard=0;
    while(guard++<16&&ch.stage<def.stages.length){
      CHA_ensureSnap(def,ch);
      const st=def.stages[ch.stage];
      let cur=0,target=1,ok=false;
      try{ const p=st.prog(S,ch.snaps[st.id]||{},ch); cur=p[0]; target=p[1]; ok=true; }catch(e){}
      if(!ok) break;
      if(cur>=target){
        ch.sdone[ch.stage]=1; ch.stage++;
        try{ toast(icon('scroll','ge-ic-md')+' Story arc — stage complete: <b>'+esc(st.name)+'</b>'); }catch(e){}
        continue;
      }
      break;
    }
    if(ch.stage>=def.stages.length&&!ch.done){ ch.done=true; CHA_grantReward(ch,def); }
  });
}
function CHA_grantReward(ch,def){
  if(!ch||ch.reward) return;
  ch.reward=true;
  const r=def.reward||{};
  const D=(typeof DIFFS!=='undefined'&&DIFFS[S.difficulty])||{missionReward:1};
  if(r.cash) S.cash+=Math.round(r.cash*(D.missionReward||1));
  if(r.rep){ try{ gainRep(r.rep); }catch(e){} }
  if(r.xp){ try{ gainXP(r.xp); }catch(e){} }
  if(r.gen) r.gen.forEach(g=>{ try{ unlockStrain(g,true); }catch(e){} });
  if(r.p0){ try{ addP0('knowledge',r.p0); }catch(e){} }
  if(r.unlock){ try{ if(typeof TY_grantUnlock==='function') TY_grantUnlock(r.unlock,def.name); }catch(e){} }
  S.stats.chainsDone=int(S.stats.chainsDone,0)+1;
  try{ toast(icon('trophy','ge-ic-md')+' Story arc complete: <b>'+esc(def.name)+'</b>'); }catch(e){}
  try{ save(); }catch(e){}
}
function CHA_dayTick(){
  if(!S) return;
  let sc=0;
  try{ sc=(typeof envEval==='function')?envEval().score:0; }catch(e){}
  try{
    const def=CHA_def('ch-dialedin'), ch=def?CHA_state('ch-dialedin'):null;
    if(ch&&!ch.done){
      const d=ch.data;
      if(ch.stage===0){ if(sc>=80) d.env80=true; }
      else if(ch.stage===1){ d.streak90=(sc>=90)?int(d.streak90,0)+1:0; }
      else if(ch.stage===2){
        let p=(S.plants||[]).find(x=>x&&x.id===d.anchorId);
        if(!p||sc<90||stageOf(p)<0){
          let best=null;
          (S.plants||[]).forEach(x=>{ if(!x||stageOf(x)<0) return; if(!best||stageOf(x)<stageOf(best)) best=x; });
          d.anchorId=best?best.id:null; d.anchorStage=best?stageOf(best):null;
        } else if(stageOf(p)>d.anchorStage){ d.stageDone=true; }
      }
    }
  }catch(e){}
  try{
    const def=CHA_def('ch-comeback'), ch=def?CHA_state('ch-comeback'):null;
    if(ch&&!ch.done){
      const d=ch.data;
      if(ch.stage===0){
        const p=(S.plants||[]).find(x=>x&&num(x.minHealth,100)<=30);
        if(p){ d.plantId=p.id; d.critical=true; }
      } else {
        const p=(S.plants||[]).find(x=>x&&x.id===d.plantId);
        if(!p&&!d.comeback){
          delete ch.sdone[0]; delete ch.snaps['flat'];
          ch.stage=0; d.plantId=null; d.critical=false; d.recovered=false;
        } else if(p&&ch.stage===1&&num(p.health,0)>=85){ d.recovered=true; }
      }
    }
  }catch(e){}
}
function CHA_onHarvest(p){
  if(!S||!p) return;
  try{
    const ch=CHA_state('ch-comeback'); if(!ch||ch.done) return;
    if(ch.stage===2&&ch.data&&ch.data.plantId===p.id) ch.data.comeback=true;
  }catch(e){}
}
function CHA_storyHTML(){
  let html='<div class="ge-section-title">STORY ARCS<span class="ge-spread ge-num">'+CHAINS.length+'</span></div>';
  CHAINS.forEach(def=>{
    const ch=CHA_state(def.id); if(!ch) return;
    const total=def.stages.length, doneN=Object.keys(ch.sdone).length, done=!!ch.done;
    const pct=clamp(doneN/Math.max(1,total)*100,0,100);
    const pseudo={name:def.name,desc:def.story,reward:def.reward};
    html+='<div class="ge-card ge-mission'+(done?' is-done':'')+'">'+
     '<div class="ms-top"><span class="ms-cat">STORY ARC</span>'+MS_statePill(done,doneN>0)+MS_diffBadge(pseudo)+'</div>'+
     '<h3 class="ms-title">'+(done?icon('check','ge-ic-sm'):'')+icon('scroll','ge-ic-sm')+esc(def.name)+'</h3>'+
     '<p class="ge-body ge-muted">'+esc(def.story)+'</p>'+
     '<ul class="ms-objs">';
    def.stages.forEach((st,i)=>{
      const sdone=!!ch.sdone[i], locked=!sdone&&i>ch.stage;
      let cur=0,target=1;
      try{ const pr=st.prog(S,ch.snaps[st.id]||{},ch); cur=pr[0]; target=pr[1]; }catch(e){}
      const rowDone=sdone||cur>=target;
      html+='<li class="ms-obj'+(rowDone?' is-done':'')+(locked?' is-locked':'')+'">'+
       '<span class="ms-check">'+icon(locked?'lock':(rowDone?'check':'clock'),'ge-ic-sm')+'</span>'+
       '<span class="ms-objt"><b>'+esc(st.name)+'</b> — '+esc(st.desc)+
       (locked?' <span class="ge-muted">(finish the previous stage)</span>':'')+'</span>'+
       '<b class="ge-num">'+Math.min(Math.max(0,cur),target)+'/'+target+'</b></li>';
    });
    html+='</ul>'+
     '<div class="ge-progress-meta"><span>'+icon('level','ge-ic-sm')+'ARC PROGRESS</span><b class="ge-num">'+doneN+'/'+total+'</b></div>'+
     '<div class="ge-progress'+(done?' ge-progress-ok':'')+'"><i style="width:'+pct+'%"></i></div>'+
     MS_rewardHTML(pseudo)+
    '</div>';
  });
  return html;
}

/* ---------------- P1.5: First-Sale tease cards (fire once) ----------------
   After 'First Sale' completes, surface two informational cards linking to
   existing screens: nearest locked genetic + nearest automation unlock. */
function TU_nextGeneticTease(){
  try{ /* reuse EX_nextUnlock verbatim when its pick is a genetic */
    const un=EX_nextUnlock();
    if(un&&un.go==='genetics') return {text:un.text};
  }catch(e){}
  /* fallback: nearest locked strain (same gap logic as EX_nextUnlock) */
  let best=null;
  STRAINS.forEach(st=>{
    if(!st.lock||!S.lockedStrains.includes(st.id)) return;
    const l=st.lock; let gap=Infinity,txt='';
    if(l.t==='rep'){ gap=Math.max(0,int(l.v,0)-int(S.reputation,0)); txt=st.name+': reach '+int(l.v,0)+' rep'+(gap>0?' ('+gap+' to go)':''); }
    else if(l.t==='cash'){ const c=st.seed*3; gap=Math.max(0,c-num(S.cash,0))/100; txt=st.name+(gap>0?': save '+fmt$(c)+' for the genetics':': ready to buy in the Genetics Lab'); }
    else { gap=50; txt=strainDisplayName(st)+': unlock via Project 0 missions'; }
    if(!best||gap<best.gap) best={gap:gap,text:txt};
  });
  return best||{gap:0,text:'All genetics unlocked \u2014 hunt phenotypes!'};
}
function TU_nextAutomationTease(){
  let best=null;
  try{
    Object.keys(AM_SYSTEMS).forEach(id=>{
      const sys=AM_SYSTEMS[id], st=(S.am&&S.am[id])||{};
      if(st.owned) return;
      const gate=int(sys.rankGate,0);
      if(!best||gate<best.gate){
        let rn='rank '+gate; try{ rn=AM_rankName(gate); }catch(e){}
        best={gate:gate,text:sys.name+': reach '+rn};
      }
    });
  }catch(e){}
  return best||{gate:0,text:'All automation owned \u2014 the machine runs itself.'};
}
function TU_onFirstSale(){
  if(S.tutTeaseFired) return;
  S.tutTeaseFired=true; save();
  setTimeout(()=>{ try{ TU_teaseModal(); }catch(e){} },600);
}
function TU_teaseModal(){
  const g=TU_nextGeneticTease(), a=TU_nextAutomationTease();
  const card=(ico,title,text,btn,go)=>'<div class="ge-card ge-tease-card"><div class="ge-card-head">'+icon(ico,'ge-ic-md')+'<h3>'+esc(title)+'</h3></div><p class="ge-muted">'+esc(text)+'</p><button class="ge-btn ge-btn-primary ge-btn-block" data-teasego="'+go+'">'+btn+'</button></div>';
  const m=modal('<div class="ge-display">FIRST SALE COMPLETE</div>'+
    '<p class="ge-muted">The empire compounds. Two power spikes are within reach:</p>'+
    card('genetics','NEXT GENETIC',g.text,'OPEN GENETICS','genetics')+
    card('equipment','NEXT AUTOMATION',a.text,'OPEN AUTOMATION','automation')+
    '<button class="ge-btn ge-btn-ghost ge-btn-block" id="tease-x">GOT IT</button>');
  m.querySelector('#tease-x').onclick=()=>closeModal(m);
  m.querySelectorAll('[data-teasego]').forEach(b=>b.onclick=()=>{ closeModal(m); show(b.dataset.teasego); });
}
function checkAchievements(){
  ACHIEVEMENTS.forEach(a=>{
    if(S.achievements.includes(a.id)) return;
    let ok=false; try{ ok=a.t(S); }catch(e){}
    if(ok){ S.achievements.push(a.id); gainXP(100); setTimeout(()=>toast(icon('trophy','ge-ic-md')+' Achievement: <b>'+esc(MS_stripEmoji(a.name))+'</b><br><span class="muted">'+esc(a.desc)+'</span>'),50); }
  });
}


/* ---------------- New game ---------------- */
function newGame(diff){
  if(!DIFFS[diff]) diff='grower'; /* QA GE-004: never start with an invalid difficulty */
  freshStart();
  const D=DIFFS[diff];
  S.difficulty=diff; S.cash=D.cash; S.started=true;
  /* W6 deploy-path QA: new players watched ~$100/day vanish with no explanation.
     One-time, dismissible card — missions fund the early game until first harvest. */
  try{ NT_queue('nt-opex-day1',{ico:'cash',title:'The empire burns cash daily',
    body:'Rent, power, equipment upkeep and licensing cost you <b>every day</b> — even before your first harvest. <b>Missions pay the bills</b> early on, and the <b>FINANCES</b> card on the Empire Dashboard shows the full daily breakdown.',
    go:'dashboard',cta:'VIEW DASHBOARD'}); }catch(e){}
  show('home'); updateHUD(); save();
  toast(icon('crown','ge-ic-md')+' Welcome to the Empire, '+D.name+'!');
}
RENDER.difficulty=function(){
  $('diff-list').innerHTML=Object.keys(DIFFS).map(k=>{
    const d=DIFFS[k];
    return '<div class="ge-card ge-card-tap ge-diff-card diff-card" data-d="'+k+'">'+
     '<div class="ge-diff-crown">'+crownSVG(false,'c-ico-svg')+'</div>'+
     '<h3 class="ge-h2">'+d.name+'</h3><p class="ge-muted ge-body">'+d.desc+'</p>'+
     '<div class="ge-datarow"><span>'+icon('cash','ge-ic-md')+'Starting cash</span><b class="ge-num">'+fmt$(d.cash)+'</b></div>'+
     '<div class="ge-datarow"><span>'+icon('star','ge-ic-md')+'Mission rewards</span><b class="ge-num">x'+d.missionReward+'</b></div></div>';
  }).join('');
  document.querySelectorAll('#diff-list .diff-card').forEach(c=>{
    c.onclick=()=>{ document.querySelectorAll('#diff-list .diff-card').forEach(x=>x.classList.remove('sel')); c.classList.add('sel'); };
    c.ondblclick=()=>newGame(c.dataset.d);
  });
  if(!$('diff-start')){
    const b=document.createElement('button'); b.id='diff-start'; b.className='ge-btn ge-btn-primary ge-btn-block ge-diff-start'; b.textContent='START GROWING';
    b.onclick=()=>{ const sel=document.querySelector('#diff-list .diff-card.sel'); newGame(sel?sel.dataset.d:'grower'); };
    $('scr-difficulty').appendChild(b);
  }
};


/* ---------------- Main menu ---------------- */
const MENU_ITEMS=[
 {id:'home',ico:'star',label:'DASHBOARD'},
 {id:'grow',ico:'grow',label:'PLAY'},
 {id:'grows',ico:'grows',label:'MY GROWS'},
 {id:'genetics',ico:'genetics',label:'GENETICS'},
 {id:'dispensary',ico:'dispensary',label:'DISPENSARY'},
 {id:'breeding',ico:'breeding',label:'BREEDING'},
 {id:'project0',ico:'project0',label:'PROJECT 0'},
 {id:'empire',ico:'empire',label:'EMPIRE'},
 {id:'missions',ico:'missions',label:'MISSIONS'},
 {id:'challenges',ico:'trophy',label:'CHALLENGES'},
 {id:'achievements',ico:'trophy',label:'TROPHIES'},
 {id:'locations',ico:'empire',label:'TERRITORY'},
 {id:'settings',ico:'settings',label:'SETTINGS'}
];
RENDER.menu=function(){
  let openMissions=0;
  try{ openMissions=MISSIONS.filter(m=>!S.missionsDone.includes(m.id)).length; }catch(e){}
  let html=HM_identityHead();
  html+='<div class="ge-section-title">COMMAND MODULES</div>';
  html+=HM_menuModules(openMissions);
  html+='<div class="ge-section-title">NAVIGATE</div>';
  html+='<div class="ge-card ge-menu-nav">';
  MENU_ITEMS.forEach(mi=>{
    let badge='';
    if(mi.id==='missions'&&openMissions>0) badge='<span class="ge-navdock-badge">'+openMissions+'</span>';
    const glock=mi.id==='genetics'&&int(S.level,1)<3; /* P1.5: hub-claim gate */
    if(glock) badge='<span class="ge-pill ge-pill-neutral">'+icon('lock','ge-ic-sm')+'LVL 3</span>';
    html+='<button class="ge-menu-navrow'+(glock?' ge-locked':'')+'" data-go="'+mi.id+'">'+icon(mi.ico,'ge-ic-md')+'<span>'+mi.label+'</span>'+badge+icon('arrow-right','ge-ic-sm')+'</button>';
  });
  html+='</div>';
  html+=nextUpCard();
  const lvl=Math.max(1,int(S.level,1)), xp=num(S.xp,0), xpN=xpNeed(lvl);
  const fi=clamp(int(S.facility,0),0,FACILITIES.length-1);
  html+='<div class="ge-card ge-home-xp"><div class="ge-progress-meta"><span>'+icon('xp','ge-ic-md')+'LEVEL '+lvl+' &mdash; '+Math.max(0,xpN-xp)+' XP TO NEXT</span><b class="ge-num">'+int(xp,0)+'/'+xpN+'</b></div>'+
   '<div class="ge-progress"><i style="width:'+clamp(xp/xpN*100,0,100)+'%"></i></div>'+
   '<div class="ge-datarow"><span>'+icon('empire','ge-ic-md')+'Facility</span><b>'+esc(FAC_TIERS[facTierIdx()].name)+'</b></div>'+
   '<div class="ge-datarow"><span>'+icon('grow','ge-ic-md')+'Plants growing</span><b class="ge-num">'+S.plants.length+'/'+FACILITIES[fi].slots+'</b></div>'+
   '<div class="ge-datarow"><span>'+icon('genetics','ge-ic-md')+'Genetics unlocked</span><b class="ge-num">'+unlockedCount(S)+'/'+allStrains().length+'</b></div>'+
   (Array.isArray(S.titles)&&S.titles.length?'<div class="ge-home-titles">'+S.titles.map(t=>'<span class="ge-badge ge-badge-legendary">'+esc(t)+'</span>').join('')+'</div>':'')+'</div>';
  html+='<p class="ge-home-motto">&ldquo;IT&rsquo;S NEVER ABOUT THE MONEY.&rdquo; &mdash; PROJECT 0</p>';
  $('menu-buttons').innerHTML=html;
  document.querySelectorAll('#menu-buttons [data-go]').forEach(b=>b.onclick=()=>show(b.dataset.go));
  const gm=document.querySelector('#menu-buttons [data-go-missions]'); if(gm) gm.onclick=()=>show('missions');
};


/* ---------------- Settings ---------------- */
RENDER.settings=function(){
  const r=$('settings-root');
  let html='<div class="ge-screen">'+
   '<div class="ge-screenhead"><button class="ge-screenhead-back" onclick="show(\'menu\')">'+
    icon('x','ge-ic-md')+'<span>MENU</span></button>'+
   '<h2 class="ge-screenhead-title">'+icon('settings','ge-ic-lg')+'SETTINGS</h2></div>'+
   '<div class="ge-card ge-card-hot"><div class="ge-card-head"><h3>'+icon('preserve','ge-ic-lg')+'SAVE DATA</h3></div>'+
   '<div class="ge-btn-row"><button class="ge-btn ge-btn-primary" id="set-save">'+icon('check','ge-ic-md')+'SAVE NOW</button>'+
   '<button class="ge-btn ge-btn-ghost" id="set-export">'+icon('scroll','ge-ic-md')+'EXPORT SAVE</button>'+
   '<button class="ge-btn ge-btn-ghost" id="set-import">'+icon('box','ge-ic-md')+'IMPORT SAVE</button>'+
   '<button class="ge-btn ge-btn-danger" id="set-reset">'+icon('warn','ge-ic-md')+'RESET GAME</button></div>'+
   '<p class="ge-caption ge-muted">Save lives on this device only. Export a JSON backup before switching profiles.</p></div>'+
   '<div class="ge-card"><div class="ge-card-head"><h3>'+icon('trophy','ge-ic-lg')+'ACHIEVEMENTS</h3><span class="ge-spread ge-num">'+S.achievements.length+'/'+ACHIEVEMENTS.length+'</span></div>'+
   ACHIEVEMENTS.map(a=>'<div class="ge-datarow"><span>'+(S.achievements.includes(a.id)?icon('check','ge-ic-sm'):icon('lock','ge-ic-sm'))+icon((typeof MS_achIcon==='function'?MS_achIcon(a.id):'trophy'),'ge-ic-sm')+esc((typeof MS_stripEmoji==='function'?MS_stripEmoji(a.name):a.name))+'<br><span class="ge-caption ge-muted">'+esc(a.desc)+'</span></span></div>').join('')+'</div>'+
   '<div class="ge-card"><div class="ge-card-head"><h3>'+icon('inspect','ge-ic-lg')+'LIFETIME STATS</h3></div>'+
   PF_kv('Days survived','<b class="ge-num">'+S.day+'</b>')+
   PF_kv('Lifetime harvest','<b class="ge-num">'+num(S.stats.lifetimeHarvestOz,0).toFixed(1)+' oz</b>')+
   PF_kv('Lifetime revenue','<b class="ge-num">'+fmt$(S.stats.lifetimeRevenue)+'</b>')+
   PF_kv('Best quality','<b class="ge-num">'+Math.round(S.stats.bestQuality)+'</b>')+
   PF_kv('Crosses created','<b class="ge-num">'+S.stats.crosses+'</b>')+
   PF_kv('Competitions won','<b class="ge-num">'+S.stats.compsWon+'</b>')+
   PF_kv('Missions completed','<b class="ge-num">'+int(S.stats.missionsDone,0)+'/'+MISSIONS.length+' ('+Math.round(int(S.stats.missionsDone,0)/MISSIONS.length*100)+'%)</b>')+
   '</div>'+
   '<div class="ge-card ge-card-flat"><p class="ge-caption ge-muted ge-center">SHOCKER OWNZ GROW EMPIRE v2.0 &mdash; VISUAL OVERHAUL<br>PLANT &bull; GROW &bull; BREED &bull; HARVEST &bull; BUILD</p></div>'+
  '</div>';
  r.innerHTML=html;
  $('set-save').onclick=()=>{ save(); toast(icon('check','ge-ic-md')+' Saved.'); };
  $('set-export').onclick=exportSave;
  $('set-import').onclick=()=>$('import-file').click();
  $('set-reset').onclick=()=>confirmModal('Reset game?','This erases ALL progress. This cannot be undone.',()=>{
    try{localStorage.removeItem((typeof NX_saveKey==='function')?NX_saveKey():SAVE_KEY);}catch(e){}
    freshStart(); show('splash');
  });
};


/* ---------------- Boot ---------------- */
function boot(){
  const res=load();
  try{ if(typeof WX_init==='function') WX_init(); }catch(e){}
  try{ if(typeof GX_init==='function') GX_init(); }catch(e){}
  try{ if(typeof EX_init==='function') EX_init(); }catch(e){}
  try{ if(typeof TY_init==='function') TY_init(); }catch(e){}
  try{ if(typeof AM_init==='function') AM_init(); }catch(e){}
  try{ if(typeof MN_register==='function') MN_register(); }catch(e){}
  $('btn-enter').onclick=()=>{ if(S.started) show('home'); else show('difficulty'); };
  setTimeout(()=>{ if(current==='splash'){ if(S.started) show('home'); else show('difficulty'); } },4000);
  document.querySelectorAll('#bottomnav button').forEach(b=>b.onclick=()=>show(b.dataset.nav));
  $('import-file').addEventListener('change',e=>{ if(e.target.files[0]) importSaveFile(e.target.files[0]); e.target.value=''; });
  if(res==='corrupt') setTimeout(()=>toast(icon('warn','ge-ic-md')+' Old save was unreadable — started fresh.'),600);
  updateHUD();
  show('splash');
}
document.addEventListener('DOMContentLoaded',boot);

/* ---------------- Genetics screen ---------------- */
function strainCard(st,opts){
  opts=opts||{};
  const locked=!isUnlocked(st.id);
  let lockHtml='';
  const gPrice=Math.round(st.seed*3*((typeof WX_discount==='function')?WX_discount('genetics'):1));
  if(locked){
    const l=st.lock;
    lockHtml='<p class="lock-note">'+icon('lock','kv-ico')+' '+esc(lockReasonText(l,st.seed*3))+'</p>';
    const clue=codexClue(st); /* P2-W2: mystery hint per unlock route - a hint, never a spoiler */
    if(clue) lockHtml+='<p class="codex-clue">'+icon('inspect','kv-ico')+' <i>'+esc(clue)+'</i></p>';
    if(l.t==='cash') lockHtml+='<button class="btn btn-small btn-gold" data-buygen="'+st.id+'">BUY GENETICS — '+fmt$(gPrice)+'</button>';
  }
  const custom=st.custom?'<span class="badge gold">CUSTOM</span>':'';
  const lin=st.lineage?'<p class="muted">'+icon('dna','kv-ico')+' '+esc(st.lineage)+'</p>':'';
  /* P2-W2 Living Codex: the player's relationship history with this genetic.
     Every field is stamped at its own lifecycle point (acquire / grow / harvest /
     keeper / breed) - never conflated with strainOwned or the harvest aggregates. */
  const cx=codexHist(st.id);
  const cxHas=cx&&(cx.acquiredDay>0||cx.grown>0||cx.harvested>0||cx.crossesCreated>0||cx.genNotes.length>0);
  const cxRec=(lbl,ic,val)=>'<div class="kv"><span>'+icon(ic,'kv-ico')+' '+lbl+'</span><b>'+val+'</b></div>';
  const cxDash='\u2014';
  const histHtml=cxHas?(
   '<div class="codex-hist-head">'+icon('dna','kv-ico')+'<h4>YOUR HISTORY</h4>'+
   (cx.completed?'<span class="tag gold">'+icon('crown-gold','b-ico')+'CODEX COMPLETE</span>':'')+'</div>'+
   cxRec('Acquired','scroll',(cx.acquiredDay>0?('Day '+cx.acquiredDay):cxDash))+
   cxRec('Times grown','grow',int(cx.grown,0))+
   cxRec('Times harvested','harvest',int(cx.harvested,0))+
   cxRec('Best yield','star',(num(cx.bestYield,0)>0?fmtW(cx.bestYield):cxDash))+
   cxRec('Best potency','flask',(num(cx.bestPotency,0)>0?Math.round(cx.bestPotency):cxDash))+
   cxRec('Best terpenes','flask',(num(cx.bestTerpene,0)>0?Math.round(cx.bestTerpene):cxDash))+
   cxRec('Best resin','flask',(num(cx.bestResin,0)>0?Math.round(cx.bestResin):cxDash))+
   cxRec('Phenos evaluated','hunt',int(cx.phenosEvaluated,0))+
   cxRec('Keeper pheno','keepers',(cx.keeperPheno?esc(cx.keeperPheno):cxDash))+
   cxRec('Crosses created','dna',int(cx.crossesCreated,0))+
   (cx.genNotes.length?'<div class="codex-notes">'+cx.genNotes.slice(-4).map(n=>'<p class="codex-note">'+icon('scroll','kv-ico')+' '+esc(n)+'</p>').join('')+'</div>':'')
  ):'';
  const huntBtns=!locked?'<div class="btn-row"><button class="btn btn-small btn-green" data-growseed="'+st.id+'">'+icon('grow','ic')+'GROW</button>'+
   '<button class="btn btn-small" data-hunt="'+st.id+'">'+icon('hunt','ic')+'PHENO HUNT</button>'+
   '<button class="btn btn-small btn-gold" data-vkeepers="'+st.id+'">'+icon('keepers','ic')+'KEEPERS</button></div>':'';
  return '<div class="card strain-card'+((cx&&cx.completed)?' codex-complete':'')+'"><div class="strain-hero">'+flowerSVG(strainSeed(st),'strain-flower')+'</div>'+
    '<h3>'+esc(strainDisplayName(st))+' '+custom+'</h3>'+lin+
    '<div class="tags">'+st.tags.map(t=>'<span class="tag">'+esc(t)+'</span>').join('')+'</div>'+
    statBar('Yield',st.yld)+statBar('Potency',st.pot)+statBar('Terpenes',st.terp)+
    '<div class="statrow"><span class="slabel">Flower time</span><span class="sval" style="width:auto">'+st.ft+' days</span></div>'+
    statBar('Stability',st.stab)+statBar('Resin',st.resin)+statBar('Vigor',st.vigor)+
    lockHtml+histHtml+huntBtns+
    (opts.preserve&&!locked?'<button class="btn btn-small" data-preserve="'+st.id+'">'+icon('preserve','ic')+'PRESERVE (+P0)</button>':'')+
    '</div>';
}
function collectionHeadHTML(){
  const all=allStrains(), un=unlockedCount(S), pct=Math.round(un/Math.max(1,all.length)*100);
  const grown=Object.keys(S.stats.strainGrown||{}).length;
  let tested=0; Object.values(S.phenoHistory||{}).forEach(h=>{ tested+=int(h.tested,0); });
  return '<div class="card collect-head"><h3>'+icon('dna','ic-lg')+'GENETICS COLLECTION</h3>'+
   '<div class="progress big"><i style="width:'+pct+'%"></i></div>'+
   '<div class="kv"><span>Completion</span><b>'+un+'/'+all.length+' ('+pct+'%)</b></div>'+
   '<div class="collect-stats"><span>'+icon('grow','kv-ico')+grown+' strains grown</span><span>'+icon('hunt','kv-ico')+tested+' phenos tested</span><span>'+icon('keepers','kv-ico')+int(S.stats.keepersFound,0)+' keepers found</span><span>'+icon('star','kv-ico')+'best '+Math.round(num(S.stats.bestPhenoScore,0))+'</span></div></div>'+
   (S.keepers.length?npcBlurb('archive'):'');
}
RENDER.genetics=function(){
  const r=$('genetics-root');
  const all=allStrains();
  let html=screenHead('genetics','GENETICS LIBRARY')+collectionHeadHTML()+
   '<p class="muted">'+icon('dna','kv-ico')+' Preserve strains to earn Project 0 points.</p>';
  all.forEach(st=>{ html+=strainCard(st,{preserve:true}); });
  r.innerHTML=html;
  r.querySelectorAll('[data-buygen]').forEach(b=>b.onclick=()=>{
    const st=getStrain(b.dataset.buygen);
    const gdisc=(typeof WX_discount==='function')?WX_discount('genetics'):1;
    const cost=Math.round(st.seed*3*gdisc);
    if(S.cash<cost){ toast('\u274C Not enough cash.'); return; }
    S.cash-=cost; unlockStrain(st.id,true); save(); updateHUD(); RENDER.genetics();
  });
  r.querySelectorAll('[data-preserve]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.preserve;
    if(S.cash<25){ toast('\u274C Preservation costs $25.'); return; }
    S.cash-=25; S.stats.preserved++;
    addP0('preservation',2); addP0('genetics',1); gainXP(10);
    toast('\uD83C\uDFE6 '+esc(getStrain(id).name)+' preserved. +Project 0');
    save(); updateHUD(); checkMissions();
  });
  r.querySelectorAll('[data-growseed]').forEach(b=>b.onclick=()=>{
    if(plantSeed(b.dataset.growseed)) toast('\uD83C\uDF31 Planted '+esc(getStrain(b.dataset.growseed).name));
    RENDER.genetics();
  });
  r.querySelectorAll('[data-hunt]').forEach(b=>b.onclick=()=>startPhenoHunt(b.dataset.hunt));
  r.querySelectorAll('[data-vkeepers]').forEach(b=>b.onclick=()=>{ keeperFilter=b.dataset.vkeepers; keeperPage=0; show('keepers'); });
  try{ if(typeof GX_wireGenetics==='function') GX_wireGenetics(r); }catch(e){}
};

/* ---------------- Breeding screen ---------------- */
let breedA=null, breedB=null;
function breedPickList(sel,current){
  const avail=allStrains().filter(s=>isUnlocked(s.id));
  return '<select id="'+sel+'">'+avail.map(s=>'<option value="'+s.id+'"'+(s.id===current?' selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select>';
}
function predictTraits(a,b){
  return [
    {n:'HIGH RESIN',v:Math.round((a.resin+b.resin)/2)},
    {n:'GAS',v:Math.round((a.terp+b.terp)/2)},
    {n:'YIELD',v:Math.round((a.yld+b.yld)/2)},
    {n:'COLOR',v:rndi(40,95)},
    {n:'STABILITY',v:Math.round((a.stab+b.stab)/2)-5},
    {n:'VIGOR',v:Math.round((a.vigor+b.vigor)/2)},
    {n:'POTENCY',v:Math.round((a.pot+b.pot)/2)},
    {n:'TERPENES',v:Math.round((a.terp+b.terp)/2)}
  ];
}
RENDER.breeding=function(){
  const r=$('breeding-root');
  const avail=allStrains().filter(s=>isUnlocked(s.id));
  if(!breedA||!getStrain(breedA)) breedA=avail[0]?avail[0].id:null;
  if(!breedB||!getStrain(breedB)) breedB=avail[1]?avail[1].id:breedA;
  const A=getStrain(breedA), B=getStrain(breedB);
  let html='<div class="ge-screen">'+screenHead('breeding','BREEDING LAB');
  /* W6 deploy-path QA: the lab opened straight into mechanics with no WHY.
     One static intro line — no state, no rewards, no flow change. */
  html+='<div class="ge-card ge-card-flat"><p class="ge-body ge-muted">'+icon('dna','ge-ic-sm')+' <b>WHY BREED?</b> Fuse two parents into a strain that is <b>yours</b> — chase potency, yield, rare traits. Grow the seeds, hunt the standout phenotype, crown it a keeper, and it lives in your vault forever.</p></div>';
  html+='<div class="ge-card card"><div class="ge-card-head">'+icon('dna','ge-ic-md')+'<h3>PARENT A</h3></div><div class="ge-breed-parent">'+(A?flowerSVG(strainSeed(A),'breed-flower'):'')+breedPickList('breed-a',breedA)+'</div></div>';
  html+='<div class="ge-breed-vs">×</div>';
  html+='<div class="ge-card card"><div class="ge-card-head">'+icon('dna','ge-ic-md')+'<h3>PARENT B</h3></div><div class="ge-breed-parent">'+(B?flowerSVG(strainSeed(B),'breed-flower'):'')+breedPickList('breed-b',breedB)+'</div></div>';
  if(A&&B){
    /* P2.1: show the pre-selected harvest/compare pheno (session hint) on the breeding screen */
    try{ const hint=(typeof window!=='undefined'&&window.__breedPhenoHint)||null;
      if(hint&&hint.strainId===breedA){
        html+='<div class="ge-card ge-card-flat"><div class="ge-caption">'+icon('dna','ge-ic-sm')+' Pre-selected pheno: <b>'+esc(hint.strainName)+' #'+int(hint.phenoNum,0)+'</b> <span class="ge-muted">(overall '+int(hint.overall,0)+' \u00b7 '+esc(String(hint.rarity||'common')).toUpperCase()+')</span> \u2014 crossing this hunt\u2019s pheno.</div></div>';
      }
    }catch(e){}
    const traits=predictTraits(A,B);
    html+='<div class="ge-card"><div class="ge-card-head">'+icon('inspect','ge-ic-md')+'<h3>PREDICTED OFFSPRING</h3></div>'+
      traits.map(t=>'<div class="ge-progress-meta"><span>'+esc(t.n)+'</span><b>'+Math.round(num(t.v,0))+'</b></div><div class="ge-progress"><i style="width:'+clamp(Math.round(num(t.v,0)),0,100)+'%"></i></div>').join('')+'</div>';
    html+='<div class="ge-card card"><div class="ge-card-head">'+icon('star','ge-ic-md')+'<h3>NAME YOUR CROSS</h3></div>'+
      '<input type="text" id="cross-name" enterkeyhint="done" class="ge-input" maxlength="28" placeholder="e.g. Revenge Cake" value="'+esc(A.name.split(' ')[0])+' x '+esc(B.name.split(' ')[0])+'">'+
      '<p class="ge-caption">Breeding fee: $150'+(S.crew.breeder?' (breeder bonus: more stable)':'')+'</p>'+
      '<button class="ge-btn ge-btn-primary ge-btn-block" id="btn-cross">'+icon('dna','ge-ic-md')+'CREATE CROSS</button></div>';
    html+='<div class="ge-card card"><div class="ge-card-head">'+icon('dna','ge-ic-md')+'<h3>SELF POLLINATE (S1)</h3></div>'+
      '<p class="ge-caption">Reverse '+esc(A.name)+' onto itself for feminized S1 seeds. Fee: $150.</p>'+
      '<button class="ge-btn ge-btn-block" id="btn-self">'+icon('dna','ge-ic-md')+'SELF (S1)</button></div>';
  }
  html+='<div class="ge-card"><div class="ge-card-head">'+icon('dna','ge-ic-md')+'<h3>YOUR CROSSES</h3><span class="ge-spread ge-num ge-muted">'+S.customStrains.length+'</span></div>'+
    (S.customStrains.length?S.customStrains.map(s=>'<div class="ge-datarow"><span>'+esc(s.name)+'<br><span class="ge-caption ge-muted">'+esc(s.lineage)+'</span></span><span class="ge-badge">R'+Math.round(s.resin)+'</span></div>'+
     '<div class="ge-btn-row ge-btn-row-tight"><button type="button" class="ge-btn ge-btn-sm ge-btn-ghost" data-p3w2-stable="'+esc(s.id)+'">'+icon('crown-gold','ge-ic-sm')+'DECLARE STABLE</button>'+
     '<button type="button" class="ge-btn ge-btn-sm ge-btn-ghost" data-p3w2-lin="'+esc(s.id)+'">'+icon('dna','ge-ic-sm')+'LINEAGE</button></div>').join(''):'<p class="ge-muted">No custom crosses yet.</p>')+'</div>';
  html+='</div>';
  r.innerHTML=html;
  $('breed-a').onchange=e=>{ breedA=e.target.value; RENDER.breeding(); };
  $('breed-b').onchange=e=>{ breedB=e.target.value; RENDER.breeding(); };
  const btn=$('btn-cross');
  if(btn) btn.onclick=()=>{ const nm=($('cross-name').value||'Untitled Cross'); createCross(nm); };
  const btnS=$('btn-self');
  if(btnS) btnS.onclick=()=>{ const inp=$('cross-name'); selfCross(inp&&inp.value?inp.value:undefined); };
  /* P3-W2: per-cross stable/lineage actions */
  r.querySelectorAll('[data-p3w2-stable]').forEach(b=>b.onclick=()=>{ if(P3W2_declareStable(b.dataset.p3w2Stable)&&current==='breeding') RENDER.breeding(); });
  r.querySelectorAll('[data-p3w2-lin]').forEach(b=>b.onclick=()=>P3W2_lineageSheet(b.dataset.p3w2Lin));
  try{ if(typeof GX_wireBreeding==='function') GX_wireBreeding(r); }catch(e){}
};

function createCross(name){
  if(!P3W2_validateLineage(breedA,breedB)){ toast(icon('x','ge-ic-md')+' Select two parents.'); return false; } /* P3-W2: lineage integrity — unknown parents rejected */
  const A2=getStrain(breedA), B2=getStrain(breedB);
  if(breedA===breedB){ toast(icon('x','ge-ic-md')+' Select two different parents.'); return false; } /* QA GE-201 */
  if(!isUnlocked(breedA)||!isUnlocked(breedB)){ toast(icon('lock','ge-ic-md')+' Genetics locked.'); return false; } /* QA GE-202 */
  if(S.cash<150){ toast(icon('x','ge-ic-md')+' Need $150 breeding fee.'); return false; }
  S.cash-=150;
  const nm=(String(name||'Untitled Cross')).trim().slice(0,28)||'Untitled Cross';
  /* P3-W1 deep breeding: elite pheno pre-selection (Phase 2 session hint) makes the
     mother inherit from the pheno's actual 18-trait record; otherwise strain averages */
  const hintA=P3B_takePhenoHint(breedA);
  const inh=P3B_inherit(A2,B2,{hintA:hintA,selfing:false});
  const cross=Object.assign({ id:'custom-'+Date.now(), name:nm, custom:true,
    yld:inh.traits.yld, pot:inh.traits.pot, terp:inh.traits.terp,
    ft:inh.traits.ft,
    stab:inh.stab,
    resin:inh.traits.resin, vigor:inh.traits.vigor,
    tags:Array.from(new Set([pick(A2.tags),pick(B2.tags),'Custom'])),
    seed:120, lineage:A2.name+' × '+B2.name }, P3B_trackingFields(A2,B2,inh), P3W2_fields());
  /* P3-W4: Breeding Lab precision — lab-grade crosses hold +5 stability */
  try{ const sb=(typeof P3W4_breedStabBonus==='function')?P3W4_breedStabBonus():0; if(sb>0) cross.stab=clamp(num(cross.stab,0)+sb,5,100); }catch(e){}
  /* P3-W5: Breeder on staff — slight stability lift on new crosses */
  try{ if(typeof P3W5_breederStab==='function') cross.stab=clamp(num(cross.stab,0)+P3W5_breederStab(),5,100); }catch(e){}
  S.customStrains.push(cross);
  try{ if(typeof P3W5_onCrossBred==='function') P3W5_onCrossBred(cross); }catch(e){} /* P3-W5: stable crosses build Breeder Rep */
  try{ if(typeof GX_enrichCross==='function') GX_enrichCross(cross,A2,B2); }catch(e){}
  try{ P3W2_parentStabilize(breedA); if(breedB!==breedA) P3W2_parentStabilize(breedB); }catch(e){} /* P3-W2: selection pressure on parental lines */
  try{ P3W2_maybeCeremony(cross,'stabilized'); }catch(e){} /* P3-W2: >=90 at birth -> NEW GENETIC ceremony */
  /* P2-W2 Living Codex: breeding -> parent cross counts + child generation-history note */
  try{ codexOnBreedParent(breedA,nm); if(breedB!==breedA) codexOnBreedParent(breedB,nm); }catch(e){}
  try{ codexOnAcquired(cross.id); }catch(e){} /* bred = acquired for customs */
  try{ const gl=(typeof TY_genLabelOf==='function')?TY_genLabelOf(cross,A2,B2):null;
    codexNote(cross.id,'Created: '+(A2.name||'?')+' \u00d7 '+(B2.name||'?')+(gl&&gl.label?' ('+gl.label+')':'')); }catch(e){}
  S.stats.crosses++;
  try{ ME_first('custom',{id:cross.id,name:cross.name,day:int(S.day,1)}); }catch(e){} /* P2.5 player memory */
  try{ if(typeof MS_onCross==='function') MS_onCross(cross); }catch(e){} /* P3-W6 milestones: FIRST CROSS / F2 / STABILIZED */
  if(A2.custom||B2.custom) S.stats.secondGenCrosses++;
  try{ P24_breedingDiscovery(cross,A2,B2); }catch(e){} /* P2-4: breeding discovery moment */
  addP0('genetics',3); addP0('nocompromise',1); gainXP(80); gainRep(5);
  toast(icon('dna','ge-ic-md')+' New strain created: <b>'+esc(nm)+'</b>');
  save(); updateHUD(); checkMissions(); checkAchievements();
  if(current==='breeding') RENDER.breeding();
  return true;
}

/* P1.0: explicit S1 selfing path. The GE-201 identical-parent guard stays on createCross;
   selfing goes through this separate function instead. TY_genLabelOf already labels
   identical parents as 'S1', which is what mission tybr-s1 ('Self Made') requires. */
function selfCross(name){
  const A2=getStrain(breedA);
  if(!A2||!P3W2_validateLineage(breedA,breedA)){ toast(icon('x','ge-ic-md')+' Select a parent.'); return false; } /* P3-W2: lineage integrity */
  if(!isUnlocked(breedA)){ toast(icon('lock','ge-ic-md')+' Genetics locked.'); return false; } /* QA GE-202 parity */
  if(S.cash<150){ toast(icon('x','ge-ic-md')+' Need $150 breeding fee.'); return false; }
  S.cash-=150;
  const nm=(String(name||(A2.name+' S1'))).trim().slice(0,28)||(A2.name+' S1');
  /* P3-W1 deep breeding: selfing preserves the line - variance shrinks with selfing depth */
  const hintSelf=P3B_takePhenoHint(breedA);
  const inhS=P3B_inherit(A2,A2,{hintA:hintSelf,hintB:hintSelf,selfing:true});
  const cross=Object.assign({ id:'custom-'+Date.now(), name:nm, custom:true,
    yld:inhS.traits.yld, pot:inhS.traits.pot, terp:inhS.traits.terp,
    ft:inhS.traits.ft,
    stab:inhS.stab,
    resin:inhS.traits.resin, vigor:inhS.traits.vigor,
    tags:Array.from(new Set([pick(A2.tags),pick(A2.tags),'Custom','S1'])),
    seed:120, lineage:A2.name+' (S1 self)' }, P3B_trackingFields(A2,A2,inhS), P3W2_fields());
  /* P3-W4: Breeding Lab precision — lab-grade crosses hold +5 stability */
  try{ const sb=(typeof P3W4_breedStabBonus==='function')?P3W4_breedStabBonus():0; if(sb>0) cross.stab=clamp(num(cross.stab,0)+sb,5,100); }catch(e){}
  /* P3-W5: Breeder on staff — slight stability lift on new crosses */
  try{ if(typeof P3W5_breederStab==='function') cross.stab=clamp(num(cross.stab,0)+P3W5_breederStab(),5,100); }catch(e){}
  S.customStrains.push(cross);
  try{ if(typeof P3W5_onCrossBred==='function') P3W5_onCrossBred(cross); }catch(e){} /* P3-W5: stable crosses build Breeder Rep */
  try{ if(typeof GX_enrichCross==='function') GX_enrichCross(cross,A2,A2); }catch(e){}
  try{ P3W2_parentStabilize(breedA); }catch(e){} /* P3-W2: selection pressure on the parental line */
  try{ P3W2_maybeCeremony(cross,'stabilized'); }catch(e){} /* P3-W2: >=90 at birth -> NEW GENETIC ceremony */
  /* P2-W2 Living Codex: S1 selfing -> parent cross count + child note */
  try{ codexOnBreedParent(breedA,nm); }catch(e){}
  try{ codexOnAcquired(cross.id); }catch(e){} /* bred = acquired for customs */
  try{ codexNote(cross.id,'Created: S1 self of '+(A2.name||'?')); }catch(e){}
  S.stats.crosses++;
  try{ ME_first('custom',{id:cross.id,name:cross.name,day:int(S.day,1)}); }catch(e){} /* P2.5 player memory */
  try{ if(typeof MS_onCross==='function') MS_onCross(cross); }catch(e){} /* P3-W6 milestones: FIRST CROSS / F2 / STABILIZED */
  if(A2.custom) S.stats.secondGenCrosses++;
  try{ P24_breedingDiscovery(cross,A2,A2); }catch(e){} /* P2-4: breeding discovery moment */
  addP0('genetics',3); addP0('nocompromise',1); gainXP(80); gainRep(5);
  toast(icon('dna','ge-ic-md')+' New S1 strain created: <b>'+esc(nm)+'</b>');
  save(); updateHUD(); checkMissions(); checkAchievements();
  if(current==='breeding') RENDER.breeding();
  return true;
}


/* ============================================================
   P3 WAVE 1 — DEEP BREEDING: real inheritance model
   Replaces the flat +/-8 midpoint blend inside createCross()/selfCross()
   with a generation-aware inheritance engine. Call signatures of
   createCross(name)/selfCross(name) are UNCHANGED, and every downstream
   hook (GX_enrichCross, TY_crossHook, codex, missions, NX breed goal)
   still fires exactly as before. Economy untouched.
   MODEL (documented probabilities):
   - Per-trait value starts at the parental midpoint (or a BX/selfing
     adjusted mean), then takes per-trait variance. Variance half-width
     scales with parental stability: high-stability parents -> tighter
     offspring, low-stability parents -> wider spread.
   - RECESSIVE EXPRESSION: P3B_REC_PROB (8%) chance per trait that the
     offspring expresses the LOWER parent's trait region instead of the
     mean (a modest, documented "recessive surprise").
   - F2 SEGREGATION: F2 populations get a 1.6x variance multiplier
     (F1 = uniform first cross; F2 = segregation; F3+ = 1.25x).
   - SELECTION -> STABILIZATION: breeding back toward the same parent
     (BX / selfing) records per-line selection history on the cross.
     Each generation narrows variance toward the selected parent and
     raises stability (+3%/gen, capped at +15). History compounds.
   - BACKCROSSING: the trait mean is pulled toward the RECURRENT parent
     by the standard recurrent-parent proportion 1-(1/2)^(bxDepth+1):
     BX1 = 75%, BX2 = 87.5%, BX3 = 93.75%, blended with variance.
   - SELFING: variance shrinks with depth (S1 0.6x, S2 0.4x, S3+ 0.3x),
     recessive exposure rises slightly (+2%/gen, capped at 20%), and a
     small vigor penalty applies at S3+ (inbreeding depression).
   - ELITE PHENO: when the Phase 2 session hint carries a selected
     pheno's 18-trait genetics record, that parent inherits from the
     PHENO's traits, not the strain average. Fallback: strain values.
   ============================================================ */
const P3B_TRAITS=['yld','pot','terp','resin','stab','vigor','ft'];
const P3B_BASE_W=8;      /* legacy blend half-width, kept as the F1 baseline */
const P3B_REC_PROB=0.08; /* per-trait recessive-expression probability */

/* sanitize an 18-trait pheno genetics record (PHENO_KEYS); null if unusable */
function P3B_sanitizePhenoGenetics(g){
  if(!g||typeof g!=='object') return null;
  try{
    const out={}; let any=false;
    PHENO_KEYS.forEach(k=>{ const v=num(g[k],NaN); if(Number.isFinite(v)){ out[k]=clamp(Math.round(v),5,100); any=true; } });
    return any?out:null;
  }catch(e){ return null; }
}
/* one-shot consume of the Phase 2 elite-pheno session hint (window.__breedPhenoHint).
   Returns the pheno genetics record only when it targets this parent; the hint is
   cleared on a match so later crosses fall back to strain averages. */
function P3B_takePhenoHint(strainId){
  try{
    const h=(typeof window!=='undefined'&&window.__breedPhenoHint)||null;
    if(h&&h.strainId&&String(h.strainId)===String(strainId)&&h.genetics){
      const g=P3B_sanitizePhenoGenetics(h.genetics);
      try{ window.__breedPhenoHint=null; }catch(e2){}
      return g;
    }
  }catch(e){}
  return null;
}
/* map an 18-trait pheno record onto strain-level heritable traits.
   flowerSpeed inverts phenoBase exactly: flowerSpeed=100-(ft-50)*2.5. */
function P3B_phenoToTraits(g){
  g=g||{};
  const c=(k,d)=>clamp(Math.round(num(g[k],d)),5,100);
  return { yld:c('yieldPot',50), pot:c('potencyPot',50), terp:c('terpenePot',50),
    resin:c('resinPot',50), stab:c('stability',50), vigor:c('vigor',50),
    ft:clamp(Math.round(50+(100-num(g.flowerSpeed,50))/2.5),40,110),
    hermRisk:c('hermRisk',50) };
}
/* effective heritable traits of a parent: elite pheno record wins over strain average */
function P3B_parentTraits(st,hintGen){
  if(hintGen) return P3B_phenoToTraits(hintGen);
  st=st||{};
  return { yld:num(st.yld,50), pot:num(st.pot,50), terp:num(st.terp,50),
    resin:num(st.resin,50), stab:num(st.stab,50), vigor:num(st.vigor,50), ft:num(st.ft,60) };
}
/* which parent of the new cross is the recurrent one (true backcross)? null otherwise */
function P3B_recurrentOf(A,B){
  try{
    const lin=S&&S.gx&&S.gx.lineage;
    if(!lin||!A||!B||!A.id||!B.id) return null;
    const isChild=(c,p)=>lin[c]&&(lin[c].a===p||lin[c].b===p);
    if(isChild(A.id,B.id)) return {rec:B,oth:A};
    if(isChild(B.id,A.id)) return {rec:A,oth:B};
  }catch(e){}
  return null;
}
function P3B_breederName(){
  try{ if(typeof NX_activeProfile==='function'){ const p=NX_activeProfile(); if(p&&p.grower) return String(p.grower).slice(0,24); } }catch(e){}
  return 'GUEST';
}
function P3B_terpeneProfile(A,B){
  try{
    const tag=st=>{ const ts=Array.isArray(st&&st.tags)?st.tags.filter(t=>t&&t!=='Custom'&&t!=='S1'):[]; return ts.length?String(ts[0]):null; };
    const tA=P3B_parentTraits(A,null), tB=P3B_parentTraits(B,null);
    return tag(tA.terp>=tB.terp?A:B)||'Balanced';
  }catch(e){ return 'Balanced'; }
}
/* Core inheritance engine. Returns trait values + full tracking payload.
   opts: {hintA, hintB (sanitized pheno genetics or null), selfing (bool)} */
function P3B_inherit(A,B,opts){
  opts=opts||{};
  const selfing=!!opts.selfing;
  const tA=P3B_parentTraits(A,opts.hintA||null);
  const tB=selfing?P3B_parentTraits(A,opts.hintB||null):P3B_parentTraits(B,opts.hintB||null);
  const stabA=num(tA.stab,50), stabB=num(tB.stab,50), avgStab=(stabA+stabB)/2;
  const breederBonus=(typeof S!=='undefined'&&S&&S.crew&&S.crew.breeder)?6:0;
  /* generation context */
  let label='F1', bxDepth=0, selfDepth=0, rec=null;
  try{
    if(selfing){ selfDepth=int(A&&A.selfHist&&A.selfHist.depth,0)+1; label='S'+selfDepth; }
    else{
      const gl=(typeof TY_genLabelOf==='function')?TY_genLabelOf({},A,B):null;
      if(gl&&gl.label) label=String(gl.label);
      const m=/^BX(\d+)$/.exec(label); if(m) bxDepth=Math.max(1,int(m[1],1));
      rec=P3B_recurrentOf(A,B);
      if(rec&&!bxDepth) bxDepth=1;
    }
  }catch(e){}
  /* per-line selection history: repeated breeding toward the same parent compounds */
  let selHist=null, selfHist=null;
  if(selfing){
    selfHist={rootId:(A&&A.id)||null,depth:selfDepth};
    selHist={targetId:(A&&A.id)||null,depth:selfDepth,kind:'self'};
  }else if(rec){
    const prev=(rec.oth&&rec.oth.selHist)||null;
    const depth=(prev&&prev.targetId===(rec.rec&&rec.rec.id))?int(prev.depth,0)+1:1;
    selHist={targetId:(rec.rec&&rec.rec.id)||null,depth:depth,kind:'bx'};
  }
  /* generation-aware variance multiplier */
  let genMult=1.0;
  if(selfing) genMult=selfDepth<=1?0.6:(selfDepth===2?0.4:0.3);
  else if(bxDepth>0) genMult=0.9;
  else{ const fm=/^F(\d+)$/.exec(label), fn=fm?int(fm[1],1):1; genMult=fn<=1?1.0:(fn===2?1.6:1.25); }
  /* stability: legacy -4 penalty + breeder bonus preserved; selection stabilizes */
  const selBonus=selHist?Math.min(int(selHist.depth,0)*3,15):0;
  const stab=clamp(Math.round(avgStab-4+breederBonus+selBonus),10,100);
  const traits={}, traitsInherited={}, dominantTraits=[], recessiveTraits=[];
  let wSum=0;
  P3B_TRAITS.forEach(t=>{
    const a=num(tA[t],t==='ft'?60:50), b=num(tB[t],t==='ft'?60:50);
    const hi=Math.max(a,b), lo=Math.min(a,b);
    let mean, src, note;
    if(selfing){
      mean=a; src='self'; note='S'+selfDepth+' self of '+(A&&A.name?A.name:'parent')+' (homozygosity rises)';
    }else if(rec){
      const pull=1-Math.pow(0.5,bxDepth+1); /* standard recurrent-parent proportion */
      const rT=(rec.rec===A)?a:b, oT=(rec.rec===A)?b:a;
      mean=pull*rT+(1-pull)*oT; src='recurrent';
      note='BX'+bxDepth+' pull '+(Math.round(pull*1000)/10)+'% toward '+(rec.rec&&rec.rec.name?rec.rec.name:'recurrent parent');
    }else{
      mean=(a+b)/2; src=(a===b)?'self':'midpoint';
      note=label+' midpoint '+Math.round(mean)+' of '+(A&&A.name?A.name:'?')+' / '+(B&&B.name?B.name:'?');
    }
    /* variance: stability-modulated, generation-aware, selection-narrowed */
    let w=P3B_BASE_W*(1.5-avgStab/100)*genMult*(breederBonus?0.92:1);
    if(selHist) w*=Math.pow(0.88,Math.min(int(selHist.depth,0),6));
    wSum+=w;
    /* recessive expression: modest chance of the lower parent's region */
    let pRec=P3B_REC_PROB;
    if(selfing) pRec=Math.min(0.20,pRec+0.02*Math.max(0,selfDepth-1));
    const recessive=Math.random()<pRec;
    let v;
    if(recessive){ v=lo+rnd(-2,2); src='recessive'; note='recessive surprise: lower-parent region ('+Math.round(lo)+')'; }
    else v=mean+rnd(-w,w);
    if(selfing&&selfDepth>=3&&t==='vigor') v-=3*(selfDepth-2); /* inbreeding depression at S3+ */
    v=(t==='ft')?clamp(Math.round(v),40,110):clamp(Math.round(v),10,100);
    traits[t]=v;
    traitsInherited[t]={src:src,note:note};
    if(recessive||Math.abs(v-lo)<Math.abs(v-hi)) recessiveTraits.push(t); else dominantTraits.push(t);
  });
  const avgW=wSum/P3B_TRAITS.length;
  const uniformity=clamp(Math.round(112-avgW*5),5,100);
  /* herm risk: elite pheno record wins; otherwise mirror phenoBase (42 - stab*0.3) */
  let hermRisk=null;
  try{
    const hg=opts.hintA||(selfing?opts.hintB:null);
    if(hg&&Number.isFinite(num(hg.hermRisk,NaN))) hermRisk=clamp(Math.round(num(hg.hermRisk)),5,95);
  }catch(e){}
  if(hermRisk===null) hermRisk=clamp(Math.round(42-stab*0.3),5,95);
  return { traits:traits, stab:stab, uniformity:uniformity, hermRisk:hermRisk,
    traitsInherited:traitsInherited, dominantTraits:dominantTraits, recessiveTraits:recessiveTraits,
    selHist:selHist, selfHist:selfHist, label:label, bxDepth:bxDepth, selfDepth:selfDepth, avgW:avgW };
}
/* requirement-8 tracking fields for a new custom strain (genLabel/createdDay come
   from TY_crossHook/GX_enrichCross as before and are NOT duplicated here) */
function P3B_trackingFields(A,B,inh){
  const v=inh.traits;
  return {
    motherId:(A&&A.id)||null, motherName:(A&&A.name)||'?',
    fatherId:(B&&B.id)||null, fatherName:(B&&B.name)||'?',
    breederName:P3B_breederName(),
    phenosEvaluated:0,
    traitsInherited:inh.traitsInherited,
    dominantTraits:inh.dominantTraits.slice(), recessiveTraits:inh.recessiveTraits.slice(),
    stabilityPct:inh.stab, uniformityPct:inh.uniformity, hermRiskPct:inh.hermRisk,
    yieldPot:v.yld, potencyPot:v.pot,
    terpeneProfile:P3B_terpeneProfile(A,B),
    structureScore:clamp(Math.round(inh.stab*0.6+v.vigor*0.4),5,100),
    floweringTime:v.ft,
    envTolerance:clamp(Math.round(inh.stab*0.65+v.vigor*0.35),5,100),
    stressResistance:clamp(Math.round(inh.stab*0.6+v.vigor*0.4),5,100),
    selHist:inh.selHist, selfHist:inh.selfHist
  };
}
/* migration-safe defaults for custom strains bred before this wave.
   Never overwrites values already present. */
function P3B_backfillCustom(s){
  if(!s||typeof s!=='object') return s;
  const d=(k,v)=>{ if(s[k]===undefined||s[k]===null) s[k]=v; };
  const stab=num(s.stab,50), vigor=num(s.vigor,50);
  d('motherId',null); d('motherName','?'); d('fatherId',null); d('fatherName','?');
  d('breederName','GUEST');
  d('phenosEvaluated',0);
  d('traitsInherited',{}); d('dominantTraits',[]); d('recessiveTraits',[]);
  d('stabilityPct',clamp(Math.round(stab),5,100));
  d('uniformityPct',clamp(Math.round(stab),5,100));
  d('hermRiskPct',clamp(Math.round(42-stab*0.3),5,95));
  d('yieldPot',num(s.yld,50)); d('potencyPot',num(s.pot,50));
  d('terpeneProfile','Balanced');
  d('structureScore',clamp(Math.round(stab*0.6+vigor*0.4),5,100));
  d('floweringTime',num(s.ft,60));
  d('envTolerance',clamp(Math.round(stab*0.65+vigor*0.35),5,100));
  d('stressResistance',clamp(Math.round(stab*0.6+vigor*0.4),5,100));
  if(s.selHist===undefined) s.selHist=null;
  if(s.selfHist===undefined) s.selfHist=null;
  if(!s.genLabel&&s.generation) s.genLabel=s.generation;
  if(s.createdDay===undefined||s.createdDay===null) s.createdDay=1;
  return s;
}

/* ============================================================
   P3 WAVE 2 — CUSTOM STRAINS + GENETIC VAULT
   Extends Wave 1 (P3B_ inheritance engine + P3B_trackingFields) and the
   keeper-vault screen. Additive only: no Phase 1/2 system is redesigned,
   economy untouched (customs sell through existing pricePerOz /
   WX_sellMult paths — no new pricing, no new sale paths).
   ============================================================ */
const P3W2_STABLE_BAR=90; /* stabilization threshold: stabilityPct crossing */

/* Per-cross Wave-2 fields. P3B_trackingFields (Wave 1) is untouched;
   these ride alongside it in createCross()/selfCross(). */
function P3W2_fields(){
  return {
    creationDay:Math.max(1,int(S.day,1)),
    ceremonyFired:false,   /* NEW GENETIC ceremony — exactly-once flag */
    declaredStable:false,  /* player chose DECLARE STABLE */
    p0Submitted:false,     /* submitted to Project 0 via the ceremony */
    lineageSaved:false,    /* SAVE LINEAGE persisted the selection history */
    autoName:null          /* pre-ceremony name, kept when the player renames */
  };
}
/* Migration-safe defaults for customs bred before this wave.
   ceremonyFired backfills TRUE: pre-wave customs never had a ceremony and
   must not all fire one on first load after the update. Never overwrites. */
function P3W2_backfillCustom(s){
  if(!s||typeof s!=='object') return s;
  const d=(k,v)=>{ if(s[k]===undefined||s[k]===null) s[k]=v; };
  d('creationDay',Math.max(1,int(s.createdDay,1)));
  d('ceremonyFired',true);
  d('declaredStable',false);
  d('p0Submitted',false);
  d('lineageSaved',false);
  d('autoName',null);
  return s;
}
/* Lineage integrity: a custom can only be created from known parents.
   Unknown parent ids are rejected — no orphan customs. */
function P3W2_validateLineage(aId,bId){
  try{
    if(!aId) return false;
    const A=getStrain(aId); if(!A) return false;
    if(bId&&bId!==aId){ const B=getStrain(bId); if(!B) return false; }
    return true;
  }catch(e){ return false; }
}

/* ---- line stabilization: using a custom as a parent applies selection
   pressure (+2 stabilityPct, +1 uniformityPct, capped). When the line
   crosses P3W2_STABLE_BAR the NEW GENETIC ceremony fires (exactly once).
   Only Wave-1 tracking fields move — the P3B inheritance engine reads
   .stab, which is never touched here. ---- */
function P3W2_parentStabilize(id){
  try{
    const p=getStrain(id);
    if(!p||!p.custom) return false;
    const before=num(p.stabilityPct,50);
    p.stabilityPct=clamp(Math.round(before+2),5,100);
    p.uniformityPct=clamp(Math.round(num(p.uniformityPct,50)+1),5,100);
    if(before<P3W2_STABLE_BAR&&p.stabilityPct>=P3W2_STABLE_BAR) P3W2_maybeCeremony(p,'stabilized');
    return true;
  }catch(e){ return false; }
}

/* ---- ceremony queue: exactly-once per custom, never stacked ---- */
let P3W2_cq=[];
function P3W2_maybeCeremony(c,reason){
  try{
    if(!c||!c.custom||c.ceremonyFired) return false;
    if(reason!=='declared'&&num(c.stabilityPct,0)<P3W2_STABLE_BAR) return false;
    if(P3W2_cq.indexOf(c.id)<0) P3W2_cq.push(c.id);
    P3W2_pumpCeremony();
    return true;
  }catch(e){ return false; }
}
function P3W2_pumpCeremony(){
  try{
    if(!P3W2_cq.length) return;
    if(document.querySelector('#modal-root .cine-back')) return; /* one ceremony at a time */
    const id=P3W2_cq.shift();
    const c=getStrain(id);
    if(!c||!c.custom||c.ceremonyFired){ P3W2_pumpCeremony(); return; }
    P3W2_showCeremony(c);
  }catch(e){}
}
/* player-chosen DECLARE STABLE — fires the ceremony regardless of the bar */
function P3W2_declareStable(id){
  try{
    const c=getStrain(id);
    if(!c||!c.custom) return false;
    if(c.ceremonyFired){ toast(icon('check','ge-ic-md')+' Already honored — this genetic had its ceremony.'); return false; }
    c.declaredStable=true;
    try{ codexNote(id,'Declared STABLE by the breeder.'); }catch(e){}
    try{ save(); }catch(e){}
    P3W2_maybeCeremony(c,'declared');
    return true;
  }catch(e){ return false; }
}

/* SAVE LINEAGE: persist the full selection history into the Living Codex */
function P3W2_saveLineage(c){
  try{
    if(!c) return false;
    const chain=P3W2_selChain(c.id);
    const desc=chain.map(n=>((n.genLabel||n.generation||'?')+' \u201c'+(n.name||n.id)+'\u201d '+Math.round(num(n.stabilityPct,num(n.stab,50)))+'%')).join(' \u2192 ');
    try{ codexNote(c.id,'LINEAGE SAVED: '+desc); }catch(e){}
    c.lineageSaved=true;
    try{ save(); }catch(e){}
    toast(icon('scroll','ge-ic-md')+' Lineage saved to the Living Codex.');
    return true;
  }catch(e){ return false; }
}

/* ---- NEW GENETIC CREATED ceremony ----
   Industrial Shocker OwnZ presentation: black/charcoal/crimson/burnt
   orange, smoke + scan-line restraint, haptics. NOT casino.
   Fires exactly once per custom (ceremonyFired is set before any UI). */
function P3W2_showCeremony(c){
  try{
    if(!c||!c.custom||c.ceremonyFired) return false;
    c.ceremonyFired=true; /* exactly-once: set BEFORE any UI can fail */
    try{ save(); }catch(e){}
    const gen=c.genLabel||c.generation||'F1';
    const lin=c.lineage||((c.motherName||'?')+' \u00d7 '+(c.fatherName||'?'));
    const rows=[['STABILITY',Math.round(num(c.stabilityPct,0))+'%'],['UNIFORMITY',Math.round(num(c.uniformityPct,0))+'%'],
                ['GENERATION',gen],['CREATED','DAY '+Math.max(1,int(c.creationDay||c.createdDay,1))]];
    const inner=
     '<div class="gen-stage"><div class="pr-smoke" aria-hidden="true"></div><div class="pr-scan" aria-hidden="true"></div>'+
     '<div class="gen-kicker">'+icon('gasmask','ge-ic-sm')+'<span>SHOCKER OWNZ // GENETIC STABILIZED</span></div>'+
     '<div class="gen-art">'+dnaSVG('gen-dna')+'</div>'+
     '<div class="ge-display gen-title pr-glitch" data-text="NEW GENETIC CREATED">NEW GENETIC CREATED</div>'+
     '<div class="gen-name" id="gen-cname">'+esc(c.name)+'</div>'+
     '<div class="gen-lin">'+icon('dna','ge-ic-sm')+'<span>'+esc(lin)+'</span></div>'+
     '<div class="gen-grid">'+rows.map((t,i)=>'<div class="gen-cell" style="animation-delay:'+(0.4+i*0.2).toFixed(2)+'s"><span>'+t[0]+'</span><b>'+esc(String(t[1]))+'</b></div>').join('')+'</div>'+
     '<div class="gen-sub">A stabilized line. Name it, log it, hunt it \u2014 the archive remembers.</div>'+
     '<div class="gen-namerow" id="gen-namerow" hidden><input type="text" id="gen-namein" enterkeyhint="done" class="ge-input" maxlength="28" value="'+esc(c.name)+'" aria-label="Genetic name">'+
     '<button type="button" class="ge-btn ge-btn-gold" id="gen-nameok">SET</button></div>'+
     '<div class="ge-btn-grid">'+
      '<button type="button" class="ge-btn ge-btn-gold" id="gen-name">'+icon('star','ge-ic-md')+'NAME GENETIC</button>'+
      '<button type="button" class="ge-btn ge-btn-ghost" id="gen-saveline">'+icon('scroll','ge-ic-md')+'SAVE LINEAGE</button>'+
      '<button type="button" class="ge-btn ge-btn-primary" id="gen-breed">'+icon('dna','ge-ic-md')+'CONTINUE BREEDING</button>'+
      '<button type="button" class="ge-btn ge-btn-ghost" id="gen-hunt">'+icon('hunt','ge-ic-md')+'BEGIN PHENO HUNT</button>'+
      '<button type="button" class="ge-btn ge-btn-ghost" id="gen-p0">'+icon('project0','ge-ic-md')+'SUBMIT TO PROJECT 0</button>'+
     '</div></div>';
    const back=cineOverlay(inner,'cine-genetic',0); /* no auto-dismiss: the player chooses */
    /* W4: Android back / backdrop dismiss must pump the ceremony queue too
       (button dismiss already does via dismiss(); bare removal stalled it,
       stranding every ceremony queued behind the dismissed one). */
    if(back){ back.__geOnDismiss=function(){ try{ P3W2_pumpCeremony(); }catch(e){} }; }
    const q=s=>back.querySelector(s);
    const dismiss=()=>{ try{ back.classList.add('cine-out'); back.classList.remove('is-open'); }catch(e){}
      setTimeout(()=>{ try{ back.remove(); }catch(e){} P3W2_pumpCeremony(); },300); };
    const bn=q('#gen-name'); if(bn) bn.onclick=()=>{ const nr=q('#gen-namerow'); if(nr){ nr.hidden=!nr.hidden; const inp=q('#gen-namein'); if(inp&&!nr.hidden){ try{inp.focus();}catch(e){} } } };
    const ok=q('#gen-nameok'); if(ok) ok.onclick=()=>{
      const inp=q('#gen-namein'); const nm=inp?String(inp.value||'').trim().slice(0,28):'';
      if(nm&&nm!==c.name){ if(!c.autoName) c.autoName=c.name; const old=c.name; c.name=nm;
        try{ codexNote(c.id,'Renamed \u201c'+old+'\u201d \u2192 \u201c'+nm+'\u201d (lineage kept: \u201c'+(c.lineage||'?')+'\u201d)'); }catch(e){}
        const cn=q('#gen-cname'); if(cn) cn.textContent=nm;
        toast(icon('star','ge-ic-md')+' Genetic named: <b>'+esc(nm)+'</b>'); }
      const nr=q('#gen-namerow'); if(nr) nr.hidden=true;
      try{ save(); }catch(e){}
    };
    const sl=q('#gen-saveline'); if(sl) sl.onclick=()=>{ P3W2_saveLineage(c); sl.disabled=true; };
    const br=q('#gen-breed'); if(br) br.onclick=()=>{ dismiss(); try{ show('breeding'); }catch(e){} };
    const hu=q('#gen-hunt'); if(hu) hu.onclick=()=>{ dismiss(); try{ startPhenoHunt(c.id); }catch(e){} };
    const p0=q('#gen-p0'); if(p0){ if(c.p0Submitted) p0.disabled=true;
      p0.onclick=()=>{ if(c.p0Submitted) return;
        c.p0Submitted=true; try{ addP0('genetics',5); }catch(e){}
        try{ codexNote(c.id,'Submitted to PROJECT 0 \u2014 the preservation archive.'); }catch(e){}
        try{ if(typeof P0T_sweep==='function') P0T_sweep(); }catch(e){} /* P3-W3: submit -> preservation pipeline */
        try{ save(); }catch(e){}
        p0.disabled=true;
        toast(icon('project0','ge-ic-md')+' <b>'+esc(c.name)+'</b> submitted to Project 0. The genetics are preserved.'); }; }
    back.addEventListener('click',e=>{ if(e&&e.target===back) setTimeout(P3W2_pumpCeremony,350); });
    /* haptics: heavy pulse then two beats — CAP bridge first, navigator.vibrate fallback */
    try{ PR_haptic('alert'); }catch(e){}
    setTimeout(()=>{ try{ PR_haptic('achievement'); }catch(e){} },350);
    setTimeout(()=>{ try{ PR_haptic('achievement'); }catch(e){} },700);
    try{ if(typeof TY_notify==='function') TY_notify(icon('dna','ge-ic-md')+' <b>NEW GENETIC CREATED:</b> '+esc(c.name),'good'); }catch(e){}
    return true;
  }catch(e){ return false; }
}

/* ---- selection history: walk the Wave-1 selHist.targetId selection line
   (selfing / backcross depth), oldest generation first ---- */
function P3W2_selChain(id){
  const nodes=[]; let cur=null;
  try{ cur=getStrain(id); }catch(e){}
  let guard=0;
  while(cur&&guard<6){
    nodes.push(cur); guard++;
    let tid=null;
    try{ tid=cur.selHist&&cur.selHist.targetId; }catch(e){}
    let nxt=null;
    try{ nxt=tid?getStrain(tid):null; }catch(e){}
    if(!nxt||nxt.id===cur.id) break;
    cur=nxt;
  }
  return nodes.reverse();
}
function P3W2_selChainHTML(id){
  try{
    const chain=P3W2_selChain(id);
    const last=getStrain(id);
    const terminal=last&&last.custom?((last.ceremonyFired||last.declaredStable)?'STABLE':(last.p0Submitted?'PROJECT 0':'SELECTED')):'LINE';
    if(chain.length<2)
      return '<p class="ge-caption ge-muted">Foundation selection \u2014 no recorded selection line yet. Breed toward a target to build one.</p>'+
        '<div class="w2-selchain"><span class="ge-badge ge-badge-gold">'+esc(terminal)+'</span></div>';
    const chips=chain.map(n=>{
      /* P3-W2: prefer the Wave-1 selfing depth for the label — TY_genLabelOf
         always stamps identical-parent crosses 'S1', but selfHist tracks the
         true S-depth (S2, S3...). Display only; the engine is untouched. */
      const lbl=(n.selfHist&&int(n.selfHist.depth,0)>1)?('S'+int(n.selfHist.depth,1)):(n.genLabel||n.generation||'F1');
      const sh=n.selHist||{};
      const sub=sh.kind==='self'?'SELF \u00d7'+int(sh.depth,1):(sh.kind==='bx'?'BX \u00d7'+int(sh.depth,1):'');
      const stb=Math.round(num(n.stabilityPct,num(n.stab,50)));
      return '<button type="button" class="ge-chip" data-w2-lin="'+esc(n.id)+'"><b>'+esc(lbl)+'</b>'+
        (sub?'<span>'+esc(sub)+'</span>':'')+'<span class="ge-muted">'+stb+'% STAB</span>'+
        '<span class="ge-truncate">'+esc(n.name||n.id)+'</span></button>';
    });
    return '<div class="w2-selchain">'+chips.join('<span class="w2-sel-arrow" aria-hidden="true">\u2192</span>')+
      '<span class="w2-sel-arrow" aria-hidden="true">\u2192</span><span class="ge-badge ge-badge-gold">'+esc(terminal)+'</span></div>'+
      '<p class="ge-caption ge-muted">Tap a generation to recenter the tree.</p>';
  }catch(e){ return ''; }
}

/* ---- generic bottom-sheet stack (mobile focus-sheet pattern). The plant
   focus sheet keeps its own path; vault lineage sheets register here so the
   Android back button (CAP_backHandler) closes the topmost sheet first. ---- */
function GE_openSheet(id,titleHTML,bodyHTML){
  try{
    GE_closeSheet(id,true);
    const bd=document.createElement('div'); bd.id=id+'-back'; bd.className='focus-back';
    bd.onclick=()=>GE_closeSheet(id);
    const sh=document.createElement('div'); sh.id=id; sh.className='focus-sheet ge-focus';
    sh.innerHTML='<div class="focus-handle"></div><div class="ge-sheet-head"><h3>'+titleHTML+'</h3>'+
      '<button type="button" class="ge-btn ge-btn-sm ge-btn-ghost" data-sheet-x="'+id+'">'+icon('x','ge-ic-sm')+'CLOSE</button></div>'+
      '<div class="ge-sheet-body">'+bodyHTML+'</div>';
    document.body.appendChild(bd); document.body.appendChild(sh);
    try{ requestAnimationFrame(()=>sh.classList.add('open')); }catch(e){ sh.classList.add('open'); }
    const st=window.__geSheetStack||(window.__geSheetStack=[]);
    if(st.indexOf(id)<0) st.push(id);
    sh.querySelectorAll('[data-sheet-x]').forEach(b=>b.onclick=()=>GE_closeSheet(b.dataset.sheetX));
    return sh;
  }catch(e){ return null; }
}
function GE_closeSheet(id){
  try{
    const sh=document.getElementById(id); if(sh) sh.remove();
    const bd=document.getElementById(id+'-back'); if(bd) bd.remove();
    const st=window.__geSheetStack||[];
    const i=st.lastIndexOf(id); if(i>=0) st.splice(i,1);
  }catch(e){}
}
function GE_closeTopSheet(){
  try{
    const st=window.__geSheetStack||[];
    if(!st.length) return false;
    GE_closeSheet(st[st.length-1]);
    return true;
  }catch(e){ return false; }
}
/* Full lineage tree + selection history in a focus sheet. Tappable ancestors
   via the existing GX lineage infra (GX_lineageHTML + GX_wireLineage). */
function P3W2_lineageSheet(id){
  try{
    const st=getStrain(id); if(!st) return false;
    const tree=(typeof GX_lineageHTML==='function')?GX_lineageHTML(id):'<p class="ge-muted">Lineage unavailable.</p>';
    const body='<div class="ge-card ge-card-flat"><div class="ge-card-head">'+icon('scroll','ge-ic-md')+'<h3>SELECTION HISTORY</h3></div>'+
      P3W2_selChainHTML(id)+'</div><div id="w2-linbox">'+tree+'</div>';
    const sh=GE_openSheet('w2-linsheet',icon('dna','ge-ic-md')+' '+esc(String(st.name||id)).toUpperCase().slice(0,34),body);
    if(!sh) return false;
    const box=sh.querySelector('#w2-linbox');
    if(box){ try{ GX_wireLineage(box); }catch(e){} }
    sh.querySelectorAll('[data-w2-lin]').forEach(b=>b.onclick=()=>{
      const nid=b.dataset.w2Lin, tgt=getStrain(nid);
      if(!tgt||!box) return;
      try{ box.innerHTML=GX_lineageHTML(nid); GX_wireLineage(box); }catch(e){}
    });
    return true;
  }catch(e){ return false; }
}

/* ---- GENETIC VAULT tabs (extend the keeper-vault screen — never forked) ---- */
function P3W2_p0Genetics(){
  const base=[], subs=[];
  try{
    allStrains().forEach(s=>{
      if(s.custom){ if(s.p0Submitted) subs.push(s); return; }
      if(s.id==='project-zero-og'||s.id==='crown-jewel'||(s.tags&&s.tags.indexOf('Keeper')>=0)) base.push(s);
    });
  }catch(e){}
  return {base:base,subs:subs};
}
function P3W2_linBtn(id){ return '<button type="button" class="ge-btn ge-btn-sm ge-btn-ghost" data-w2-lin-open="'+esc(id)+'">'+icon('dna','ge-ic-sm')+'LINEAGE</button>'; }

function P3W2_seedsHtml(){
  const all=allStrains();
  let html='<div class="ge-card"><div class="ge-card-head">'+icon('grow','ge-ic-md')+'<h3>SEED STOCK</h3><span class="ge-spread ge-num ge-muted">'+all.length+' GENETICS</span></div>'+
    '<p class="ge-caption ge-muted">Every genetic in the library with seed cost and stock status. In-house customs are owned on creation.</p></div>';
  all.forEach(st=>{
    const locked=!isUnlocked(st.id);
    const owned=!!st.custom||!!(S.strainOwned&&S.strainOwned[st.id]);
    html+='<div class="ge-card ge-card-flat w2-vault-row"><div class="ge-spec-art">'+flowerSVG(strainSeed(st),'seed-flower')+'</div>'+
     '<div class="ge-spec-main"><div class="ge-spec-top"><h3 class="ge-spec-name">'+esc(st.name)+(st.custom?' <span class="ge-badge">CUSTOM</span>':'')+'</h3></div>'+
     '<div class="ge-datarow"><span>'+icon('grow','ge-ic-sm')+'Seed cost</span><b class="ge-num">'+fmt$(num(st.seed,0))+'</b></div>'+
     '<div class="ge-datarow"><span>'+icon('box','ge-ic-sm')+'Stock</span><b>'+(locked?'LOCKED':(owned?'IN STOCK':'AVAILABLE'))+'</b></div>'+
     '<div class="ge-btn-row">'+(locked?'':'<button type="button" class="ge-btn ge-btn-sm ge-btn-primary" data-w2-grow="'+esc(st.id)+'">'+icon('grow','ge-ic-sm')+'GROW</button>')+
     P3W2_linBtn(st.id)+'</div></div></div>';
  });
  return html;
}

function P3W2_customsHtml(){
  const list=S.customStrains||[];
  let html='<div class="ge-card"><div class="ge-card-head">'+icon('dna','ge-ic-md')+'<h3>CUSTOM GENETICS</h3><span class="ge-spread ge-num ge-muted">'+list.length+' BRED</span></div>'+
    '<p class="ge-caption ge-muted">Your stabilized lines. Declare a line stable to hold its naming ceremony.</p></div>';
  if(!list.length)
    return html+'<div class="ge-card ge-empty"><div>'+icon('dna','ge-ic-xl')+'</div><h3>NO CUSTOM GENETICS YET</h3><p>Breed two parents in the Breeding Lab to create your first line.</p></div>';
  list.forEach(c=>{
    const bars=[['Stability',num(c.stabilityPct,0)],['Uniformity',num(c.uniformityPct,0)],['Herm risk',num(c.hermRiskPct,0)]];
    const honored=!!c.ceremonyFired;
    html+='<div class="ge-card ge-spec-card r-'+(c.rarity||'common')+'"><div class="ge-spec-art">'+flowerSVG(strainSeed(c),'strain-flower')+'</div>'+
     '<div class="ge-spec-main">'+
     '<div class="ge-spec-top"><h3 class="ge-spec-name">'+esc(c.name)+' <span class="ge-badge">CUSTOM</span>'+(honored?' <span class="ge-badge ge-badge-gold">'+icon('crown-gold','ge-ic-sm')+'STABLE</span>':'')+'</h3></div>'+
     '<div class="ge-spec-badges"><span class="ge-pill ge-pill-neutral">'+esc(c.genLabel||c.generation||'F1')+'</span>'+
      (c.autoName?'<span class="ge-pill ge-pill-neutral">BORN &ldquo;'+esc(c.autoName)+'&rdquo;</span>':'')+
      (c.p0Submitted?'<span class="ge-badge ge-badge-legendary">'+icon('project0','ge-ic-sm')+'PROJECT 0</span>':'')+'</div>'+
     '<div class="ge-spec-lin">'+icon('dna','ge-ic-sm')+'<span class="ge-truncate">'+esc(c.lineage||((c.motherName||'?')+' \u00d7 '+(c.fatherName||'?')))+'</span></div>'+
     '<div class="ge-datarow"><span>'+icon('terp','ge-ic-sm')+'Terpenes</span><b>'+esc(c.terpeneProfile||'Balanced')+'</b></div>'+
     '<div class="ge-datarow"><span>'+icon('star','ge-ic-sm')+'Breeder</span><b>'+esc(c.breederName||'GUEST')+'</b></div>'+
     '<div class="ge-datarow"><span>'+icon('grow','ge-ic-sm')+'Created</span><b class="ge-num">DAY '+Math.max(1,int(c.creationDay||c.createdDay,1))+'</b></div>'+
     bars.map(b=>'<div class="ge-progress-meta"><span>'+b[0]+'</span><b>'+Math.round(num(b[1],0))+'%</b></div><div class="ge-progress ge-progress-thin"><i style="width:'+clamp(Math.round(num(b[1],0)),0,100)+'%"></i></div>').join('')+
     '<div class="ge-btn-row">'+
      (honored?'':'<button type="button" class="ge-btn ge-btn-sm ge-btn-gold" data-w2-stable="'+esc(c.id)+'">'+icon('crown-gold','ge-ic-sm')+'DECLARE STABLE</button>')+
      '<button type="button" class="ge-btn ge-btn-sm ge-btn-primary" data-w2-grow="'+esc(c.id)+'">'+icon('grow','ge-ic-sm')+'GROW</button>'+
      '<button type="button" class="ge-btn ge-btn-sm ge-btn-ghost" data-w2-hunt="'+esc(c.id)+'">'+icon('hunt','ge-ic-sm')+'HUNT</button>'+
      P3W2_linBtn(c.id)+'</div></div></div>';
  });
  return html;
}

function P3W2_archiveHtml(){
  const list=S.phenoArchive||[];
  let html='<div class="ge-card"><div class="ge-card-head">'+icon('box','ge-ic-md')+'<h3>ARCHIVED GENETICS</h3><span class="ge-spread ge-num ge-muted">'+list.length+'/200</span></div>'+
    '<p class="ge-caption ge-muted">Preserved phenotype snapshots. The archive never forgets.</p></div>';
  if(!list.length)
    return html+'<div class="ge-card ge-empty"><div>'+icon('box','ge-ic-xl')+'</div><h3>ARCHIVE EMPTY</h3><p>Archive phenotypes from the harvest report to preserve them here.</p></div>';
  list.forEach(a=>{
    html+='<div class="ge-card ge-card-flat w2-vault-row"><div class="ge-spec-main">'+
     '<div class="ge-spec-top"><h3 class="ge-spec-name">'+esc(a.strainName||'?')+' <span class="ge-num">#'+int(a.phenoNum,0)+'</span></h3></div>'+
     '<div class="ge-spec-badges">'+rarityBadge({rarity:a.rarity||'common'})+(a.isClone?' <span class="ge-badge ge-badge-mother">'+icon('clone','ge-ic-sm')+'CLONE</span>':'')+'</div>'+
     '<div class="ge-datarow"><span>'+icon('star','ge-ic-sm')+'Overall</span><b class="ge-num">'+Math.round(num(a.overall,0))+'</b></div>'+
     '<div class="ge-datarow"><span>'+icon('grow','ge-ic-sm')+'Archived</span><b class="ge-num">DAY '+Math.max(1,int(a.day,1))+'</b></div>'+
     '<div class="ge-btn-row">'+(a.strainId?P3W2_linBtn(a.strainId):'')+'</div></div></div>';
  });
  return html;
}

function P3W2_p0Row(s,tag){
  return '<div class="ge-card ge-card-flat w2-vault-row"><div class="ge-spec-art">'+flowerSVG(strainSeed(s),'strain-flower')+'</div>'+
   '<div class="ge-spec-main"><div class="ge-spec-top"><h3 class="ge-spec-name">'+esc(s.name)+(s.custom?' <span class="ge-badge">CUSTOM</span>':'')+'</h3></div>'+
   '<div class="ge-spec-badges"><span class="ge-badge ge-badge-legendary">'+icon('project0','ge-ic-sm')+tag+'</span></div>'+
   '<div class="ge-spec-lin">'+icon('dna','ge-ic-sm')+'<span class="ge-truncate">'+esc(s.lineage||'Foundation genetics')+'</span></div>'+
   '<div class="ge-btn-row">'+P3W2_linBtn(s.id)+'</div></div></div>';
}
function P3W2_p0Html(){
  const g=P3W2_p0Genetics();
  let html='<div class="ge-card"><div class="ge-card-head">'+icon('project0','ge-ic-md')+'<h3>PROJECT 0 GENETICS</h3><span class="ge-spread ge-num ge-muted">'+(g.base.length+g.subs.length)+'</span></div>'+
    '<p class="ge-caption ge-muted">Preservation lines and your submitted customs. It&rsquo;s never about the money \u2014 only the genetics.</p></div>';
  if(!g.base.length&&!g.subs.length)
    return html+'<div class="ge-card ge-empty"><div>'+icon('project0','ge-ic-xl')+'</div><h3>NO PROJECT 0 GENETICS</h3><p>Submit a stabilized custom from its ceremony to preserve it here.</p></div>';
  g.subs.forEach(s=>{ html+=P3W2_p0Row(s,'YOUR SUBMISSION'); });
  g.base.forEach(s=>{ html+=P3W2_p0Row(s,'PRESERVATION LINE'); });
  return html;
}

/* wire the vault tab buttons (called from wireKeepers — additive) */
function P3W2_wireVault(r){
  if(!r) return;
  r.querySelectorAll('[data-w2-lin-open]').forEach(b=>b.onclick=()=>P3W2_lineageSheet(b.dataset.w2LinOpen));
  r.querySelectorAll('[data-w2-stable]').forEach(b=>b.onclick=()=>{ if(P3W2_declareStable(b.dataset.w2Stable)&&current==='keepers') RENDER.keepers(); });
  r.querySelectorAll('[data-w2-grow]').forEach(b=>b.onclick=()=>{ const st=getStrain(b.dataset.w2Grow); if(st&&plantSeed(st.id)){ toast(icon('grow','ge-ic-md')+' Planted '+esc(st.name)); if(current==='keepers') RENDER.keepers(); } });
  r.querySelectorAll('[data-w2-hunt]').forEach(b=>b.onclick=()=>startPhenoHunt(b.dataset.w2Hunt));
}



/* ============================================================
   P3 WAVE 3 — PROJECT 0 PRESERVATION TIERS
   P0 as a true preservation PROGRAM, not another XP bar. Per-genetic
   preservation tiers, tracked per strain/custom id in S.p0vault
   (migration-safe, additive). The existing 8-track P0 points system
   (tracks grant points as before) is untouched — tiers are per-genetic
   and separate.
     CANDIDATE -> DOCUMENTED -> VERIFIED -> PRESERVED -> LEGACY
   Every requirement reads existing tracked state; the only new
   tracking is per-genetic stress-test evidence (stamped at harvest),
   which genuinely did not exist per genetic. PRESERVED is granted via
   an explicit player action (the "effort paid"); tiers 1, 2 and 4
   advance automatically when their requirements are genuinely met.
   Perks are non-economic by design: no cash, no multipliers — only a
   tiny capped breeder-rep nod, a codex distinction, and a permanent
   place of honor. "IT'S NEVER ABOUT THE MONEY — ONLY THE GENETICS."
   ============================================================ */
const P0T_TIERS=['CANDIDATE','DOCUMENTED','VERIFIED','PRESERVED','LEGACY'];
const P0T_DOC_PHENOS=3;    /* DOCUMENTED: phenotypes evaluated */
const P0T_VER_HARVESTS=3;  /* VERIFIED: successful harvests of the genetic */
const P0T_PRES_HARVESTS=5; /* PRESERVED: harvests of the genetic */
const P0T_PRES_CLONES=2;   /* PRESERVED (base): keeper-line clone runs */
const P0T_LEG_HARVESTS=10; /* LEGACY: verified harvests */
const P0T_LEG_DAYS=30;     /* LEGACY: game-days since PRESERVED */
const P0T_PERK_REP=2;      /* PRESERVED perk: +breeder rep per genetic */
const P0T_PERK_CAP=20;     /* ...capped across all genetics (economy-neutral) */

function P0T_name(gid){
  try{ const st=getStrain(gid); if(st&&st.name) return st.name; }catch(e){}
  try{ const e=S.p0vault&&S.p0vault[gid]; if(e&&e.gname) return e.gname; }catch(e){}
  return String(gid);
}
/* get-or-create a vault entry (migration-safe; never throws) */
function P0T_entry(gid,create){
  try{
    if(!gid||typeof S==='undefined'||!S) return null;
    if(!S.p0vault||typeof S.p0vault!=='object') S.p0vault={};
    let e=S.p0vault[gid];
    if((!e||typeof e!=='object')&&create){
      e=S.p0vault[gid]={tier:0,day:{0:Math.max(1,int(S.day,1))},vCine:false,
        stressTested:false,stressTestDay:0,perkGranted:false,gname:P0T_name(gid)};
    }
    return (e&&typeof e==='object')?e:null;
  }catch(e2){ return null; }
}
function P0T_stampTier(e,t){
  try{ if(!e.day||typeof e.day!=='object') e.day={}; if(!e.day[t]) e.day[t]=Math.max(1,int(S.day,1)); }catch(e2){}
  /* P3-W5: preservation tier-ups build Project 0 Rep — once per genetic per tier, ever.
     Legacy saves grandfather earned tiers on first sweep; each grants once, modestly. */
  try{ if(typeof P3W5_onP0Tier==='function') P3W5_onP0Tier(t); }catch(e3){}
}
/* candidacy evidence — the existing flag paths, never invented */
function P0T_isCandidate(gid){
  if(!gid) return false;
  try{
    /* (1) the staged reveal's P0 CANDIDATE banner (per-pheno moment keys) */
    const seen=(S.disc&&S.disc.seen)||{};
    const pre='p0cand-'+gid+'#';
    for(const k in seen){ if(k.indexOf(pre)===0) return true; }
  }catch(e){}
  try{ if((S.keepers||[]).some(k=>k&&k.strainId===gid)) return true; }catch(e){} /* (2) keeper selection */
  try{ const c=(S.customStrains||[]).find(x=>x&&x.id===gid); if(c&&c.p0Submitted) return true; }catch(e){} /* (3) Wave-2 ceremony submit */
  return false;
}
/* every genetic currently in (or eligible for) the pipeline */
function P0T_knownIds(){
  const ids={};
  try{ Object.keys(S.p0vault||{}).forEach(k=>{ ids[k]=1; }); }catch(e){}
  try{ (S.customStrains||[]).forEach(c=>{ if(c&&c.id&&c.p0Submitted) ids[c.id]=1; }); }catch(e){}
  try{ (S.keepers||[]).forEach(k=>{ if(k&&k.strainId) ids[k.strainId]=1; }); }catch(e){}
  try{
    const seen=(S.disc&&S.disc.seen)||{};
    Object.keys(seen).forEach(k=>{
      if(k.indexOf('p0cand-')===0){ const rest=k.slice(7), h=rest.indexOf('#'); if(h>0) ids[rest.slice(0,h)]=1; }
    });
  }catch(e){}
  return Object.keys(ids).filter(id=>{ try{ return !!getStrain(id); }catch(e){ return false; } });
}
/* ---- requirement sets (all read existing tracked state) ---- */
function P0T_docReqs(gid){
  const st=getStrain(gid);
  const ph=((S.phenoHistory||{})[gid])||{};
  const tested=int(ph.tested,0);
  let linMet=false, linLabel='Lineage documented';
  if(st&&st.custom){ linMet=!!(st.motherId&&st.fatherId); linLabel='Lineage documented (parents recorded)'; }
  else { linMet=!!st; linLabel='Catalog lineage (strain registry)'; } /* base strains are canonical registry genetics */
  let notes=0; try{ const hx=codexHist(gid); notes=hx&&Array.isArray(hx.genNotes)?hx.genNotes.length:0; }catch(e){}
  return [
    {id:'phenos',label:'Phenotypes evaluated',cur:tested,need:P0T_DOC_PHENOS,met:tested>=P0T_DOC_PHENOS},
    {id:'lineage',label:linLabel,met:linMet},
    {id:'notes',label:'Trait notes recorded',cur:notes,need:1,met:notes>=1}
  ];
}
function P0T_verReqs(gid){
  const st=getStrain(gid);
  const keepers=(S.keepers||[]).filter(k=>k&&k.strainId===gid);
  let cloneVer=false;
  try{ for(const k of keepers){ if(int((S.keeperCloneRuns||{})[k.id],0)>=1){ cloneVer=true; break; } } }catch(e){}
  /* clone verification reads the REAL clone-harvest ledger (only written by
     harvestPlant's clone branch) — it cannot be faked by flags alone. */
  let stabMet=false, stabLabel='Stability proven';
  if(st&&st.custom){ const v=Math.round(num(st.stabilityPct,0)); stabMet=v>=P3W2_STABLE_BAR; stabLabel='Stability '+v+'% / '+P3W2_STABLE_BAR+'% bar'; }
  else { try{ const hx=codexHist(gid); stabMet=!!(hx&&hx.keeperPheno); }catch(e){} stabLabel='Keeper documented in the codex'; }
  const harv=int((((S.stats||{}).strainGrown||{})[gid]||{}).count,0);
  return [
    {id:'keeper',label:'Keeper selected',cur:keepers.length,need:1,met:keepers.length>=1},
    {id:'clonever',label:'Clone verification (keeper clone grown to harvest)',met:cloneVer},
    {id:'stab',label:stabLabel,met:stabMet},
    {id:'harv',label:'Successful harvests',cur:harv,need:P0T_VER_HARVESTS,met:harv>=P0T_VER_HARVESTS}
  ];
}
function P0T_presReqs(gid){
  const st=getStrain(gid);
  let genMet=false, genLabel='Line advanced';
  if(st&&st.custom){
    const desc=(S.customStrains||[]).some(c=>c&&c.id!==gid&&(c.motherId===gid||c.fatherId===gid));
    const f2=num(st.genNum,1)>=2;
    genMet=desc||f2;
    genLabel=desc?'Line advanced (descendant bred)':(f2?'F2+ generation grown':'F2+ generation grown');
  }else{
    let runs=0;
    (S.keepers||[]).forEach(k=>{ if(k&&k.strainId===gid) runs=Math.max(runs,int(k.clonesGrown,0)); });
    genMet=runs>=P0T_PRES_CLONES; genLabel='Keeper line maintained ('+runs+'/'+P0T_PRES_CLONES+' clone runs)';
  }
  const harv=int((((S.stats||{}).strainGrown||{})[gid]||{}).count,0);
  const e=P0T_entry(gid,false);
  return [
    {id:'gen',label:genLabel,met:genMet},
    {id:'harv',label:'Harvests of this genetic',cur:harv,need:P0T_PRES_HARVESTS,met:harv>=P0T_PRES_HARVESTS},
    {id:'stress',label:'Stress test passed',met:!!(e&&e.stressTested)},
    {id:'effort',label:'Seal it in the vault (your call)',met:false} /* informational: granted via explicit action */
  ];
}
function P0T_legReqs(gid){
  const e=P0T_entry(gid,false);
  const presDay=e&&e.day?int(e.day[3],0):0;
  const daysSince=presDay?Math.max(0,int(S.day,1)-presDay):0;
  const harv=int((((S.stats||{}).strainGrown||{})[gid]||{}).count,0);
  let rank=false; try{ rank=p0Level('preservation')>=3; }catch(e2){}
  return [
    {id:'tier',label:'Genetic PRESERVED',met:!!(e&&int(e.tier,0)>=3)},
    {id:'days',label:'Preserved across time',cur:daysSince,need:P0T_LEG_DAYS,met:daysSince>=P0T_LEG_DAYS},
    {id:'harv',label:'Verified harvests',cur:harv,need:P0T_LEG_HARVESTS,met:harv>=P0T_LEG_HARVESTS},
    {id:'rank',label:'Project 0 preservation rank 3+',met:rank}
  ];
}
function P0T_reqsMet(reqs){ return Array.isArray(reqs)&&reqs.length>0&&reqs.every(r=>r&&r.met); }
function P0T_nextReqs(gid,tier){
  if(tier===0) return P0T_docReqs(gid);
  if(tier===1) return P0T_verReqs(gid);
  if(tier===2) return P0T_presReqs(gid);
  if(tier===3) return P0T_legReqs(gid);
  return [];
}
/* ---- the sweep: advance tiers when requirements are genuinely met.
   Tier 3 (PRESERVED) is NEVER auto-granted — it requires the player's
   explicit SEAL action (the "effort paid"). No tier can be skipped:
   each step's full requirement set is checked in order. ---- */
function P0T_sweep(opts){
  opts=opts||{};
  try{
    if(typeof S==='undefined'||!S) return;
    if(!S.p0vault||typeof S.p0vault!=='object') S.p0vault={};
    P0T_knownIds().forEach(gid=>P0T_entry(gid,true));
    Object.keys(S.p0vault).forEach(gid=>{
      const e=S.p0vault[gid]; if(!e||typeof e!=='object') return;
      let t=clamp(int(e.tier,0),0,4), guard=0;
      while(guard++<6){
        if(t===0&&P0T_reqsMet(P0T_docReqs(gid))){ t=1; P0T_stampTier(e,1); }
        else if(t===1&&P0T_reqsMet(P0T_verReqs(gid))){
          t=2; P0T_stampTier(e,2);
          if(opts.silent){ e.vCine=true; } /* grandfathered on load: no popup, moment kept */
          else P0T_verifiedCeremony(gid);
        }
        else if(t===3&&P0T_reqsMet(P0T_legReqs(gid))){
          t=4; P0T_stampTier(e,4);
          if(!opts.silent){ try{ toast(icon('crown-gold','ge-ic-md')+' <b>PROJECT 0 LEGACY</b> \u2014 '+esc(P0T_name(gid))+' enters the permanent archive.'); }catch(e2){} }
        }
        else break;
      }
      e.tier=t;
    });
    if(!opts.silent){ try{ save(); }catch(e){} }
  }catch(e){}
}
/* harvest hook: stamp stress-test evidence, then sweep.
   A "documented harvest under recorded stress" = minHealth<=65 while
   quality held >=70. Per-genetic evidence did not exist before this. */
function P0T_onHarvest(gid,minHealth,quality){
  try{
    if(!gid||typeof S==='undefined'||!S||!S.p0vault) return;
    if(!P0T_isCandidate(gid)) return;
    const e=P0T_entry(gid,true); if(!e) return;
    if(!e.stressTested&&num(minHealth,100)<=65&&num(quality,0)>=70){
      e.stressTested=true; e.stressTestDay=Math.max(1,int(S.day,1));
      try{ codexNote(gid,'STRESS TEST PASSED \u2014 held quality through a rough run.'); }catch(e2){}
    }
    P0T_sweep();
  }catch(e){}
}
/* ---- PROJECT 0 VERIFIED: a major Shocker OwnZ moment.
   Industrial presentation (black/charcoal/crimson/burnt orange, scan +
   smoke, gas-mask influence — the underground-lab seal), subtle haptics
   via the CAP bridge with navigator.vibrate fallback (PR_haptic).
   Idempotent: vCine is set BEFORE any UI, so exactly one ceremony per
   genetic no matter how often the sweep re-checks. Reuses cineOverlay
   (the elite-expression / Wave-2 ceremony infra) — no new modal system. */
function P0T_verifiedCeremony(gid){
  try{
    const e=P0T_entry(gid,false);
    if(!e||e.vCine) return false;
    e.vCine=true; /* exactly-once: set BEFORE any UI can fail */
    try{ if(typeof MS_onP0Verified==='function') MS_onP0Verified(); }catch(e2){} /* P3-W6 milestone: FIRST P0 VERIFIED GENETIC */
    const nm=P0T_name(gid);
    cineOverlay(
     '<div class="p0v-stage"><div class="pr-smoke" aria-hidden="true"></div><div class="pr-scan" aria-hidden="true"></div>'+
     '<div class="p0v-mask">'+gasmaskSVG('p0v-mask-ic')+'</div>'+
     '<div class="p0v-kicker">'+icon('project0','ge-ic-sm')+'<span>SHOCKER OWNZ // PRESERVATION VAULT</span></div>'+
     '<div class="ge-display p0v-title pr-glitch" data-text="GENETIC VERIFIED">GENETIC VERIFIED</div>'+
     '<div class="p0v-name">'+esc(nm)+'</div>'+
     '<div class="p0v-tiers">'+P0T_TIERS.slice(0,3).map((t,i)=>'<span class="p0v-tier'+(i<2?' done':' now')+'">'+t+'</span>').join('<span class="p0v-arrow">\u2192</span>')+'</div>'+
     '<div class="p0v-sub">Keeper confirmed. Clone run verified. Stability proven.<br>This genetic is under Project 0 protection.</div>'+
     '<button type="button" class="ge-btn ge-btn-gold ge-btn-block" id="p0v-ok">'+icon('project0','ge-ic-md')+'SEAL THE RECORD</button></div>',
     'cine-p0verified',0);
    const back=document.querySelector('#modal-root .cine-back.cine-p0verified');
    if(back){
      const btn=back.querySelector('#p0v-ok');
      if(btn) btn.onclick=()=>{ back.classList.add('cine-out'); back.classList.remove('is-open'); setTimeout(()=>back.remove(),300); };
    }
    try{ PR_haptic('alert'); }catch(e2){}
    setTimeout(()=>{ try{ PR_haptic('achievement'); }catch(e2){} },350);
    setTimeout(()=>{ try{ PR_haptic('achievement'); }catch(e2){} },700);
    try{ save(); }catch(e2){}
    return true;
  }catch(e){ return false; }
}
/* ---- PRESERVED: the explicit player commitment ("effort paid").
   Perks are non-economic by design: a tiny capped breeder-rep nod
   (documented below), a codex distinction — no cash, no multipliers. */
function P0T_perkTotal(){
  let n=0;
  try{ Object.keys(S.p0vault||{}).forEach(gid=>{ const e=S.p0vault[gid]; if(e&&e.perkGranted) n+=P0T_PERK_REP; }); }catch(e){}
  return Math.min(n,P0T_PERK_CAP);
}
function P0T_preserve(gid){
  try{
    const e=P0T_entry(gid,false);
    if(!e||int(e.tier,0)!==2) return false;
    const reqs=P0T_presReqs(gid).filter(r=>r.id!=='effort');
    if(!P0T_reqsMet(reqs)){ try{ toast(icon('lock','ge-ic-md')+' Not ready \u2014 the vault keeps its standards.'); }catch(e2){} return false; }
    const nm=P0T_name(gid);
    confirmModal('SEAL IN THE VAULT',
      'Commit \u201c'+nm+'\u201d to the Project 0 vault as PRESERVED? This is permanent \u2014 the genetic joins the preservation archive. Perk: +'+P0T_PERK_REP+' breeder rep (capped at +'+P0T_PERK_CAP+' total). No cash, no multipliers \u2014 it\u2019s never about the money.',
      ()=>{
        e.tier=3; P0T_stampTier(e,3);
        if(!e.perkGranted){
          e.perkGranted=true;
          const room=P0T_PERK_CAP-P0T_perkTotal();
          if(room>0){ try{ gainRep(Math.min(P0T_PERK_REP,room)); }catch(e2){} }
        }
        try{ codexNote(gid,'PRESERVED \u2014 sealed in the Project 0 vault. It\u2019s never about the money \u2014 only the genetics.'); }catch(e2){}
        try{ PR_haptic('achievement'); }catch(e2){}
        try{ toast(icon('project0','ge-ic-md')+' <b>'+esc(nm)+'</b> PRESERVED in the Project 0 vault.'); }catch(e2){}
        try{ save(); }catch(e2){}
        try{ if(current==='project0') RENDER.project0(); }catch(e2){}
      });
    return true;
  }catch(e){ return false; }
}
/* ---- migration: sane defaults for legacy saves. Candidate entries are
   created from real flag evidence; tiers are computed honestly from
   tracked state; the VERIFIED cinematic is grandfathered (no popup on
   load); PRESERVED/LEGACY are never auto-granted here. ---- */
function P0T_backfill(){
  try{
    if(typeof S==='undefined'||!S) return;
    if(!S.p0vault||typeof S.p0vault!=='object') S.p0vault={};
    Object.keys(S.p0vault).forEach(gid=>{
      const e=S.p0vault[gid];
      if(!e||typeof e!=='object'){ delete S.p0vault[gid]; return; }
      e.tier=clamp(int(e.tier,0),0,4);
      if(!e.day||typeof e.day!=='object') e.day={};
      e.vCine=!!e.vCine; e.stressTested=!!e.stressTested; e.perkGranted=!!e.perkGranted;
      e.stressTestDay=Math.max(0,int(e.stressTestDay,0));
      if(typeof e.gname!=='string') e.gname=P0T_name(gid);
    });
    P0T_knownIds().forEach(gid=>P0T_entry(gid,true));
    P0T_sweep({silent:true});
  }catch(e){}
}
/* ---- P0 screen: the preservation pipeline ---- */
function P0T_reqRow(r){
  const rhs=(r.need!==undefined&&r.need!==null)
    ?'<b class="ge-num">'+int(r.cur,0)+'/'+r.need+'</b>'
    :'<b class="ge-num">'+(r.met?'MET':'\u2014')+'</b>';
  return '<div class="ge-datarow p0t-req'+(r.met?' is-met':'')+'"><span>'+icon(r.met?'check':'x','ge-ic-sm')+esc(r.label)+'</span>'+rhs+'</div>';
}
function P0T_pipelineHTML(){
  const ids=P0T_knownIds();
  let html='<div class="ge-section-title">'+icon('project0','ge-ic-sm')+'PRESERVATION PIPELINE<span class="ge-spread ge-num ge-muted">'+ids.length+' GENETICS</span></div>';
  if(!ids.length)
    return html+'<div class="ge-card ge-empty"><div>'+icon('project0','ge-ic-xl')+'</div><h3>NO GENETICS IN THE PIPELINE</h3><p class="ge-muted">Flag a phenotype for Project 0, crown a keeper, or submit a custom from its ceremony \u2014 the preservation program starts there.</p></div>';
  const groups=[[],[],[],[],[]];
  ids.forEach(gid=>{ const e=P0T_entry(gid,false); groups[clamp(int(e?e.tier:0,0),0,4)].push(gid); });
  P0T_TIERS.forEach((tname,ti)=>{
    const g=groups[ti]; if(!g.length) return;
    html+='<div class="ge-card ge-card-flat"><div class="ge-card-head"><h3>'+icon(ti>=4?'crown-gold':'project0','ge-ic-md')+tname+'</h3><span class="ge-spread ge-num ge-muted">'+g.length+'</span></div>';
    g.forEach(gid=>{
      html+='<div class="p0t-row"><div class="p0t-rowhead"><b>'+esc(P0T_name(gid))+'</b>'+
        '<span class="ge-badge '+(ti>=4?'ge-badge-legendary':ti===3?'ge-badge-legendary':ti===2?'ge-badge-keeper':'ge-badge')+'">'+tname+'</span></div>';
      if(ti<4){
        const reqs=P0T_nextReqs(gid,ti), metN=reqs.filter(r=>r.met).length;
        html+='<div class="ge-progress-meta"><span class="ge-label">NEXT: '+P0T_TIERS[ti+1]+'</span><b class="ge-num">'+metN+'/'+reqs.length+'</b></div>'+
          '<div class="ge-progress'+(ti>=2?' ge-progress-gold':'')+'"><i style="width:'+Math.round(metN/Math.max(1,reqs.length)*100)+'%"></i></div>'+
          reqs.map(P0T_reqRow).join('');
        if(ti===2&&P0T_reqsMet(reqs.filter(r=>r.id!=='effort'))){
          html+='<button type="button" class="ge-btn ge-btn-gold ge-btn-block" data-p0t-seal="'+esc(gid)+'">'+icon('project0','ge-ic-md')+'SEAL IN THE VAULT</button>';
        }
      }else{
        html+='<p class="ge-caption ge-muted">'+icon('crown-gold','ge-ic-sm')+' Permanent place of honor \u2014 this genetic is Project 0 history.</p>';
      }
      html+='</div>';
    });
    html+='</div>';
  });
  return html;
}
function P0T_wirePipeline(r){
  if(!r) return;
  r.querySelectorAll('[data-p0t-seal]').forEach(b=>{ b.onclick=()=>{ P0T_preserve(b.dataset.p0tSeal); }; });
}
/* ---- profile: LEGACY place of honor ---- */
function P0T_legacyHTML(){
  const ids=P0T_knownIds().filter(gid=>{ const e=P0T_entry(gid,false); return e&&int(e.tier,0)>=4; });
  if(!ids.length) return '';
  return '<div class="ge-section-title">'+icon('crown-gold','ge-ic-sm')+'PROJECT 0 LEGACY<span class="ge-spread ge-num">'+ids.length+'</span></div>'+
   '<div class="ge-card ge-card-flat"><p class="ge-caption ge-muted">Genetics preserved for the ages. It\u2019s never about the money \u2014 only the genetics.</p>'+
   ids.map(gid=>'<div class="ge-datarow"><span>'+icon('crown-gold','ge-ic-sm')+esc(P0T_name(gid))+'</span><b class="ge-num ge-gold-text">LEGACY</b></div>').join('')+
   /* P3-W6 endgame cross-link: a LEGACY genetic is never a dead end -
      its lineage lives on in the codex and the breeding lab. */
   '<p class="ge-caption ge-muted">Lineage secured. Next: complete '+(ids.length===1?'its':'their')+
   ' Living Codex entr'+(ids.length===1?'y':'ies')+' or breed the line forward.</p>'+
   '<div class="ge-btn-row"><button class="ge-btn ge-btn-ghost ge-btn-sm" data-ex-go="genetics">CODEX</button>'+
   '<button class="ge-btn ge-btn-ghost ge-btn-sm" data-ex-go="breeding">BREEDING LAB</button></div></div>';
}



/* ============================================================
   PHENOTYPE HUNTING + KEEPER / MOTHER PLANT SYSTEM
   Extends the base game — no existing system is modified destructively.
   ============================================================ */
const PHENO_KEYS=['vigor','structure','yieldPot','potencyPot','resinPot','terpenePot','bagAppeal','flowerSpeed','stressTol','stability','hermRisk','rootVigor','cloneVigor','internode','diseaseRes','stretch','nutrientSensitivity','envTolerance']; /* P1.2: +3 per-seed traits */
const NX_PHENO_LABELS={vigor:'Vigor',structure:'Structure',yieldPot:'Yield',potencyPot:'Potency',resinPot:'Resin',terpenePot:'Terpenes',bagAppeal:'Bag Appeal',flowerSpeed:'Flower Speed',stressTol:'Stress Tolerance',stability:'Stability',hermRisk:'Herm Risk',rootVigor:'Root Vigor',cloneVigor:'Clone Vigor',internode:'Internodal Spacing',diseaseRes:'Disease Resistance',stretch:'Stretch',nutrientSensitivity:'Nutrient Sensitivity',envTolerance:'Environmental Tolerance'}; /* P1.2 */
const PHENO_LABELS={vigor:'Vigor',structure:'Structure',yieldPot:'Yield Pot.',potencyPot:'Potency Pot.',resinPot:'Resin Pot.',terpenePot:'Terpene Pot.',bagAppeal:'Bag Appeal',flowerSpeed:'Flower Speed',stressTol:'Stress Tol.',stability:'Stability'};
const LEGENDARY_TRAITS=[
 {id:'ROYAL GAS',boost:{potencyPot:24,resinPot:20}},
 {id:'RESIN MONSTER',boost:{resinPot:26,bagAppeal:16}},
 {id:'BLACKOUT PURPLE',boost:{bagAppeal:24,terpenePot:18}},
 {id:'OLD SCHOOL FUNK',boost:{terpenePot:24,potencyPot:16}},
 {id:'TRICHOME STORM',boost:{resinPot:24,potencyPot:18}},
 {id:'GIANT YIELDER',boost:{yieldPot:26,vigor:14}},
 {id:'TERPENE BOMB',boost:{terpenePot:26,bagAppeal:14}},
 {id:'IRON VIGOR',boost:{vigor:24,stressTol:20}},
 {id:'MIDNIGHT RESIN',boost:{resinPot:22,stability:14}},
 {id:"EMPEROR'S CUT",boost:{potencyPot:22,yieldPot:16}},
 {id:'VELVET SMOKE',boost:{terpenePot:20,bagAppeal:20}},
 {id:'TITAN BLOOM',boost:{yieldPot:22,resinPot:16}}
];
const RARITY_META={
 common:{label:'COMMON',ico:'leaf',cls:'r-common'},
 promising:{label:'PROMISING',ico:'star',cls:'r-promising'},
 elite:{label:'ELITE',ico:'trophy',cls:'r-elite'},
 legendary:{label:'LEGENDARY',ico:'crown-gold',cls:'r-legendary'}
};
const KEEPER_CAPS=[3,5,10,20,50,80]; /* P3-W4: level 5 (80 slots) needs the Breeding Lab */
const KEEPER_CAP_COSTS=[0,2500,12000,45000,120000,250000];
const MOTHER_CAP_COSTS=[0,5000,15000,40000,80000,150000]; /* P3-W4: slots 5-6 need the Breeding Lab */

/* per-strain pheno history + mission helpers */
function phist(strainId){
  if(!S.phenoHistory[strainId]||typeof S.phenoHistory[strainId]!=='object')
    S.phenoHistory[strainId]={tested:0,harvested:0,keepers:0,elite:0,legendary:0,bestPheno:0,bestScore:0};
  return S.phenoHistory[strainId];
}
function maxPhenoTested(s){ let m=0; Object.values(s.phenoHistory||{}).forEach(h=>{ m=Math.max(m,num(h.tested,0)); }); return m; }
function keeperStrainCount(s){ return new Set((s.keepers||[]).map(k=>k.strainId)).size; }
function keeperCapGate(lvl){
  if(lvl>=5) return S.facility>=6?null:'Requires the Breeding Lab facility'; /* P3-W4 */
  if(lvl>=4) return S.facility>=5?null:'Requires the Preservation Vault facility';
  if(lvl>=3) return S.facility>=3?null:'Requires the Warehouse facility';
  return null;
}

/* ---- phenotype generation: base-weighted, controlled variation ---- */
function phenoBase(strain){
  const st=strain;
  return {
    vigor:st.vigor,
    structure:clamp(st.stab*0.6+st.vigor*0.4,5,100),
    yieldPot:st.yld,
    potencyPot:st.pot,
    resinPot:st.resin,
    terpenePot:st.terp,
    bagAppeal:clamp(st.resin*0.5+st.terp*0.3+st.stab*0.2,5,100),
    flowerSpeed:clamp(100-(st.ft-50)*2.5,5,100),
    stressTol:clamp(st.stab*0.6+st.vigor*0.4,5,100),
    stability:st.stab,
    hermRisk:clamp(42-st.stab*0.3,5,95),
    rootVigor:clamp(st.vigor*0.7+st.stab*0.3,5,100),
    cloneVigor:clamp(st.vigor*0.6+st.stab*0.4,5,100),
    internode:clamp(100-st.vigor*0.4,5,100),
    diseaseRes:clamp(st.stab*0.7+st.vigor*0.3,5,100),
    /* P1.2 per-seed individuality traits (yield-neutral; differentiation only) */
    stretch:clamp(st.vigor*0.5+(100-st.stab)*0.3+30,5,100), /* mirrors GX-lab strain stretch: vigorous, less-stable genetics stretch more */
    nutrientSensitivity:clamp(110-st.stab*0.7,5,100),      /* inverse of stability: unstable genetics are finicky feeders */
    envTolerance:clamp(st.stab*0.65+st.vigor*0.35,5,100)   /* midpoint of the stressTol / diseaseRes baselines */
  };
}
function triSpread(){ return (rnd(-1,1)+rnd(-1,1)); } /* [-2,2] bell-ish */
function phenoOverall(g){
  return g.potencyPot*0.2+g.resinPot*0.2+g.yieldPot*0.15+g.terpenePot*0.15+g.vigor*0.1+g.bagAppeal*0.1+g.stressTol*0.05+g.stability*0.05;
}
function genPheno(strain){
  const base=phenoBase(strain);
  const g={};
  PHENO_KEYS.forEach(k=>{ g[k]=clamp(Math.round(base[k]+triSpread()*16),5,100); });
  let legendaryTrait=null;
  if(Math.random()<0.009){
    const lt=pick(LEGENDARY_TRAITS);
    legendaryTrait=lt.id;
    Object.keys(lt.boost).forEach(k=>{ g[k]=clamp(g[k]+rndi(18,26),5,100); });
  }
  const d=phenoOverall(g)-phenoOverall(base);
  let rarity='common';
  if(legendaryTrait||d>=16) rarity='legendary';
  else if(d>=7) rarity='elite';
  else if(d>=3.5) rarity='promising';
  return {
    num:0, vigor:g.vigor, structure:g.structure, yieldPot:g.yieldPot,
    potencyPot:g.potencyPot, resinPot:g.resinPot, terpenePot:g.terpenePot,
    bagAppeal:g.bagAppeal, flowerSpeed:g.flowerSpeed, stressTol:g.stressTol, stability:g.stability,
    hermRisk:g.hermRisk, rootVigor:g.rootVigor, cloneVigor:g.cloneVigor, internode:g.internode, diseaseRes:g.diseaseRes,
    stretch:g.stretch, nutrientSensitivity:g.nutrientSensitivity, envTolerance:g.envTolerance, /* P1.2 */
    rarity:rarity, legendaryTrait:legendaryTrait, legendaryHidden:!!legendaryTrait,
    known:{}, expressed:[], inspectCount:0, rarityCounted:false,
    isClone:false, motherId:null, keeperId:null, cloneGen:0, huntId:null
  };
}
function nextPhenoNum(strainId){
  S.phenoCounters[strainId]=int(S.phenoCounters[strainId],0)+1;
  return S.phenoCounters[strainId];
}
function sanitizePhenoGenetics(g){
  if(!g||typeof g!=='object') return;
  PHENO_KEYS.forEach(k=>{ g[k]=clamp(num(g[k],50),5,100); });
}
function sanitizePheno(ph){
  if(!ph||typeof ph!=='object') return;
  ph.num=Math.max(1,int(ph.num,1));
  sanitizePhenoGenetics(ph);
  if(!RARITY_META[ph.rarity]) ph.rarity='common';
  if(!ph.known||typeof ph.known!=='object') ph.known={};
  if(!Array.isArray(ph.expressed)) ph.expressed=[];
  ph.inspectCount=int(ph.inspectCount,0); ph.cloneGen=int(ph.cloneGen,0);
  ['isClone','legendaryHidden','rarityCounted'].forEach(k=>{ ph[k]=!!ph[k]; });
}
function phenoName(p){
  const st=getStrain(p.strainId);
  const base=st?st.name:'Unknown';
  const n=p.pheno?(' #'+p.pheno.num):'';
  const cl=p.pheno&&p.pheno.isClone?' 🧬':'';
  return base+n+cl;
}
function rarityBadge(ph){
  const m=RARITY_META[ph.rarity]||RARITY_META.common;
  return '<span class="badge '+m.cls+'">'+icon(m.ico,'b-ico')+m.label+'</span>';
}

/* ---- progressive revelation + visible expression ---- */
function expressionTags(p){
  const ph=p.pheno; if(!ph) return [];
  const s=stageOf(p), g=ph, out=[];
  const st=getStrain(p.strainId);
  if(s>=1){
    if(g.vigor>=88) out.push('VIGOROUS');
    if(g.structure>=85) out.push('COMPACT');
    else if(g.structure<=60&&g.vigor>=80) out.push('TALL');
    if(g.structure>=80&&g.yieldPot>=80) out.push('HEAVY BRANCHING');
    if(g.stressTol>=85) out.push('STRESS RESISTANT');
    if(g.stressTol<=55) out.push('SENSITIVE');
  }
  if(s>=2){
    if(g.flowerSpeed>=80) out.push('EARLY FLOWER');
    if(g.flowerSpeed<=55) out.push('LATE FLOWER');
  }
  if(s>=3){
    if(g.resinPot>=93) out.push('EXTREME RESIN');
    else if(g.resinPot>=82) out.push('FROSTY');
    if(g.terpenePot>=90) out.push('LOUD');
    else if(g.terpenePot>=80){
      if(st&&st.tags.includes('Gassy')) out.push('GASSY');
      else if(st&&st.tags.includes('Skunky')) out.push('SKUNKY');
      else if(st&&st.tags.includes('Fruit')) out.push('FRUITY');
    }
    if(g.yieldPot>=88) out.push('HEAVY YIELD');
    if(g.yieldPot<=58) out.push('LOWER YIELD');
    if(st){ const d=phenoOverall(g)-phenoOverall(phenoBase(st)); if(d>=7) out.push('KEEPER CANDIDATE'); }
  }
  if(s>=4){
    if(g.bagAppeal>=85) out.push('DENSE FLOWERS');
    if(g.bagAppeal<=55) out.push('AIRY FLOWERS');
    if((st&&st.tags.includes('Purple'))||g.bagAppeal>=88) out.push('PURPLE EXPRESSION');
    if(g.terpenePot>=84&&st&&st.tags.includes('Fruit')&&!out.includes('FRUITY')) out.push('CITRUS');
    if(g.terpenePot<=55) out.push('EARTHY');
  }
  if(ph.legendaryTrait&&!ph.legendaryHidden) out.push(ph.legendaryTrait);
  else if(ph.legendaryTrait&&ph.legendaryHidden&&s>=3) out.push('UNKNOWN EXPRESSION');
  return out;
}
function revealForStage(p){
  const ph=p.pheno; if(!ph) return;
  const s=stageOf(p), kn=ph.known;
  if(s===-1) return; /* P1.1: no trait revelation while germinating */
  if(s>=1){ kn.vigor=true; kn.structure=true; kn.stressTol=true; kn.rootVigor=true; kn.stretch=true; }
  if(s>=2){ kn.flowerSpeed=true; kn.internode=true; kn.nutrientSensitivity=true; }
  if(s>=3){ kn.resinPot=true; kn.terpenePot=true; kn.diseaseRes=true; kn.envTolerance=true; }
  if(s>=4){ kn.yieldPot=true; kn.potencyPot=true; kn.bagAppeal=true; kn.stability=true; kn.hermRisk=true; kn.cloneVigor=true; }
  expressionTags(p).forEach(t=>{ if(!ph.expressed.includes(t)) ph.expressed.push(t); });
}
function countRarity(ph,strainId){
  if(!ph||ph.rarityCounted) return;
  ph.rarityCounted=true;
  if(ph.rarity==='elite'){ S.stats.eliteFound++; try{ ME_eliteDetail(strainId,ph,'elite'); }catch(e){} addP0('nocompromise',3); addP0('genetics',2); toast(icon('star','ge-ic-md')+' ELITE phenotype discovered!');
    /* P2.1: one discovery ceremony per pheno — rarityCounted already makes the reward
       idempotent; eliteCelebrated makes the moment idempotent too. */
    ph.eliteCelebrated=true; ph._eliteCinePending=true; }
  if(ph.rarity==='legendary'){ S.stats.legendaryFound++; try{ ME_eliteDetail(strainId,ph,'legendary'); }catch(e){} addP0('genetics',6); addP0('preservation',3); }
  const h=phist(strainId);
  if(ph.rarity==='elite') h.elite++;
  if(ph.rarity==='legendary') h.legendary++;
  checkMissions(); checkAchievements();
}
function legendaryRevealModal(st,ph){
  const seed=(st?st.id:'x')+'#'+ph.num;
  cineOverlay(
   '<div class="cine-blackout"></div><div class="cine-pulse"></div>'+
   '<div class="legend-stage">'+dnaSVG('legend-dna')+
   '<div class="legend-crown">'+crownSVG(true,'crown-anim')+'</div>'+
   '<div class="legend-haze"></div>'+
   '<div class="legend-plant">'+flowerSVG(seed,'legend-flower')+'</div>'+
   '<div class="display legend-title">LEGENDARY PHENOTYPE</div>'+
   '<div class="legend-name">'+esc(st.name)+' #'+ph.num+'</div>'+
   '<div class="legend-trait">'+esc(ph.legendaryTrait)+'</div>'+
   '<div class="legend-sub">A once-in-a-generation cut &mdash; mark it as a keeper.</div>'+
   '<button class="btn btn-gold btn-big" id="leg-ok">CLAIM IT</button></div>',
   'cine-legend',0);
  const back=document.querySelector('#modal-root .cine-back.cine-legend');
  if(back){ const btn=back.querySelector('#leg-ok'); if(btn) btn.onclick=()=>{ back.classList.add('cine-out'); setTimeout(()=>back.remove(),300); }; }
}

/* P2.1: ELITE EXPRESSION DETECTED — a major Shocker OwnZ moment. Industrial
   presentation (black/charcoal/crimson/burnt orange, scan + smoke + glitch,
   SVG icons only, no emoji, no casino chrome). Haptics: CAP bridge with
   navigator.vibrate fallback (via PR_haptic). Idempotent: _eliteCineShown is set
   on first run, so exactly one ceremony per pheno no matter how often discovery
   is re-checked. */
function eliteExpressionCeremony(st,ph){
  try{
    if(!ph||ph._eliteCineShown) return false;
    ph._eliteCineShown=true;
    const seed=(st?st.id:'x')+'#'+ph.num;
    const rows=[['POTENCY',ph.potencyPot],['RESIN',ph.resinPot],['TERPENES',ph.terpenePot],['YIELD',ph.yieldPot]];
    cineOverlay(
     '<div class="elite-stage"><div class="pr-smoke" aria-hidden="true"></div><div class="pr-scan" aria-hidden="true"></div>'+
     '<div class="elite-kicker">'+icon('dna','ge-ic-sm')+'<span>SHOCKER OWNZ // GENETIC SCAN</span></div>'+
     '<div class="elite-art">'+dnaSVG('elite-dna')+plantSVG(9,seed,'elite-plant',{frost:3,dense:true})+'</div>'+
     '<div class="ge-display elite-title pr-glitch" data-text="ELITE EXPRESSION DETECTED">ELITE EXPRESSION DETECTED</div>'+
     '<div class="elite-name">'+esc(st?st.name:'Unknown')+' <span class="elite-pheno">PHENO #'+ph.num+'</span></div>'+
     '<div class="elite-grid">'+rows.map((t,i)=>'<div class="elite-cell" style="animation-delay:'+(0.4+i*0.25).toFixed(2)+'s"><span>'+t[0]+'</span><b data-count="'+num(t[1],0)+'" data-dec="0">0</b></div>').join('')+'</div>'+
     '<div class="elite-sub">A cut above the pack &mdash; preserve it before it&apos;s gone.</div>'+
     '<button type="button" class="ge-btn ge-btn-gold ge-btn-block" id="elite-ok">'+icon('trophy','ge-ic-md')+'LOG IT</button></div>',
     'cine-elite',4000);
    const eb=document.querySelector('#modal-root .cine-back.cine-elite');
    if(eb){
      const btn=eb.querySelector('#elite-ok');
      if(btn) btn.onclick=()=>{ eb.classList.add('cine-out'); eb.classList.remove('is-open'); setTimeout(()=>eb.remove(),300); };
      eb.querySelectorAll('[data-count]').forEach(el=>{
        const target=num(el.dataset.count,0), t0=performance.now(), dur=900, delay=500;
        function tick(t){
          if(t-t0<delay){ requestAnimationFrame(tick); return; }
          const p=clamp((t-t0-delay)/dur,0,1), e=1-Math.pow(1-p,3);
          el.textContent=Math.round(target*e);
          if(p<1) requestAnimationFrame(tick);
        }
        try{ requestAnimationFrame(tick); }catch(e){ el.textContent=Math.round(target); }
      });
    }
    /* haptics: heavy pulse then two beats — CAP bridge first, navigator.vibrate fallback */
    try{ PR_haptic('alert'); }catch(e){}
    setTimeout(()=>{ try{ PR_haptic('achievement'); }catch(e){} },350);
    setTimeout(()=>{ try{ PR_haptic('achievement'); }catch(e){} },700);
    try{ if(typeof TY_notify==='function') TY_notify(icon('trophy','ge-ic-md')+' <b>ELITE EXPRESSION DETECTED:</b> '+esc(st?st.name:'Unknown')+' #'+ph.num,'good'); }catch(e){}
    return true;
  }catch(e){ return false; }
}
/* P2.1: terpene profile for the compare table — derived from data that exists
   (strain flavor tags + terpenePot intensity). No invented per-pheno storage. */
function phenoTerpeneProfile(g,strainId){
  let tags=[];
  try{ const st=strainId?getStrain(strainId):null; if(st&&Array.isArray(st.tags)) tags=st.tags; }catch(e){}
  const fam=tags.indexOf('Gassy')>=0?'GASSY':tags.indexOf('Skunky')>=0?'SKUNKY':
    tags.indexOf('Fruit')>=0?'FRUITY':tags.indexOf('Citrus')>=0?'CITRUS':
    tags.indexOf('Earthy')>=0?'EARTHY':tags.indexOf('Sweet')>=0?'SWEET':
    tags.indexOf('Floral')>=0?'FLORAL':tags.indexOf('Diesel')>=0?'DIESEL':null;
  const v=num(g?g.terpenePot:0,50);
  const inten=v>=90?'OVERWHELMING':v>=78?'LOUD':v>=62?'NOTICEABLE':'FAINT';
  return (fam||'NEUTRAL')+' \u00b7 '+inten;
}

/* ---- phenotype inspection (expands INSPECT) ---- */
function resinDesc(ph){ const v=ph.resinPot; return v>=93?'TRICHOME BLIZZARD':v>=82?'FROSTY':v>=65?'LIGHT FROST':'SPARSE'; }
function aromaDesc(ph){ const v=ph.terpenePot; return v>=90?'OVERWHELMING':v>=78?'LOUD':v>=62?'NOTICEABLE':'FAINT'; }
function structDesc(ph){ const v=ph.bagAppeal; return v>=85?'DENSE, TIGHT':v>=68?'SOLID':v>=50?'AVERAGE':'AIRY / LOOSE'; }
function colorDesc(p){ const ph=p.pheno, st=getStrain(p.strainId);
  if((st&&st.tags.includes('Purple'))||ph.bagAppeal>=88) return 'PURPLE EXPRESSION';
  if(ph.bagAppeal>=70) return 'DEEP GREEN, FROSTY TIPS';
  return 'STANDARD GREEN'; }
function estYield(p){ const ph=p.pheno;
  const est=(ph.yieldPot/100)*3.2*(p.health/100);
  return '~'+(Math.round(est*10)/10)+' oz potential'; }
function traitRow(label,key,ph){
  const known=ph.known[key];
  return '<div class="kv"><span>'+label+'</span><b>'+(known?Math.round(ph[key]):'???')+'</b></div>';
}
/* textual field clues about plant distress — observations, not instant answers */
function inspectClues(p){
  const out=[];
  if(p.water<18) out.push('Leaves hang limp and the pot feels feather-light.');
  else if(p.water>95) out.push('The medium is soggy and heavy; lower leaves look swollen.');
  if(p.nutrition<15) out.push('Lower leaves are fading to pale yellow \u2014 the plant looks hungry.');
  else if(p.nutrition>92) out.push('Leaf tips curl and scorch brown at the edges.');
  if(S.env.temp>86) out.push('Leaves cup upward; the edges feel crisp to the touch.');
  else if(S.env.temp<64) out.push('Growth looks stalled; leaves are dark and rigid.');
  const pr=(p.problems||[]).join(' ').toLowerCase();
  if(/mite|gnat|pest|thrip|aphid/.test(pr)) out.push('Tiny speckles dot the leaf undersides \u2014 something small is feeding.');
  if(/mildew|mold|rot/.test(pr)) out.push('A powdery film ghosts across the foliage.');
  if(p.health<40) out.push('Overall vigor is collapsing. Act fast.');
  if(!out.length) out.push('The plant looks dialed in. No distress signals.');
  return out;
}
function inspectPheno(pid){
  const p=S.plants.find(x=>x.id===pid); if(!p||!p.pheno) return;
  const st=getStrain(p.strainId), ph=p.pheno, s=stageOf(p);
  S.stats.inspects++;
  ph.inspectCount++;
  revealForStage(p);
  if(ph.legendaryTrait&&ph.legendaryHidden&&ph.inspectCount>=3&&s>=2){
    ph.legendaryHidden=false;
    countRarity(ph,p.strainId);
    setTimeout(()=>legendaryRevealModal(st,ph),350);
  }
  /* P2.1: elite ceremony fires at the single discovery moment, once per pheno */
  if(ph._eliteCinePending){ ph._eliteCinePending=false; setTimeout(()=>{ try{ eliteExpressionCeremony(st,ph); }catch(e){} },350); }
  const ug='<span class="unknown-gene">???</span>';
  const tRow=(label,key)=>'<div class="kv"><span>'+label+'</span><b>'+(ph.known[key]?Math.round(ph[key]):ug)+'</b></div>';
  let html='<h3>'+icon('inspect','ic')+' '+esc(phenoName(p)).replace('\U0001F9EC','')+'</h3>'+
   '<p>'+rarityBadge(ph)+(ph.keeperId?' <span class="badge gold">'+icon('keepers','b-ico')+' KEEPER</span>':'')+(ph.isClone?' <span class="badge green">'+icon('clone','b-ico')+' CLONE</span>':'')+'</p>'+
   '<div class="kv"><span>'+icon('grow','kv-ico')+' Stage</span><b>'+stageName(s)+'</b></div>'+
   '<div class="kv"><span>'+icon('day','kv-ico')+' Age</span><b>Day '+Math.floor(p.day)+'</b></div>'+
   tRow('Vigor','vigor')+tRow('Structure','structure')+
   '<div class="kv"><span>'+icon('leaf','kv-ico')+' Health</span><b>'+Math.round(p.health)+'%</b></div>'+
   '<div class="kv"><span>'+icon('warn','kv-ico')+' Stress</span><b>'+Math.round(p.stress)+'%</b></div>'+
   '<h3 style="margin-top:10px">'+icon('dna','ic')+' DEEP GENETICS</h3>'+
   tRow('Herm Risk','hermRisk')+tRow('Root Vigor','rootVigor')+tRow('Clone Vigor','cloneVigor')+tRow('Internodal Spacing','internode')+tRow('Disease Resistance','diseaseRes')+
   tRow('Stretch','stretch')+tRow('Nutrient Sensitivity','nutrientSensitivity')+tRow('Environmental Tolerance','envTolerance');
  if(s>=2){
    html+='<h3 style="margin-top:10px">'+icon('grow','ic')+' FLOWERING</h3>'+
     '<div class="kv"><span>Resin development</span><b>'+(ph.known.resinPot?resinDesc(ph):ug)+'</b></div>'+
     '<div class="kv"><span>Aroma intensity</span><b>'+(ph.known.terpenePot?aromaDesc(ph):ug)+'</b></div>'+
     '<div class="kv"><span>Flower structure</span><b>'+(ph.known.bagAppeal?structDesc(ph):ug)+'</b></div>'+
     '<div class="kv"><span>Color expression</span><b>'+(s>=4?colorDesc(p):ug)+'</b></div>'+
     '<div class="kv"><span>Est. yield</span><b>'+(ph.known.yieldPot?estYield(p):ug)+'</b></div>';
  }
  const knownTags=ph.expressed.filter(t=>!t.startsWith('\u2753'));
  html+='<h3 style="margin-top:10px">'+icon('dna','ic')+' EXPRESSION</h3>';
  html+=knownTags.length?'<div class="tags">'+knownTags.map(t=>'<span class="tag">'+esc(t)+'</span>').join('')+'</div>':'<p class="muted">No traits expressed yet.</p>';
  const unknownN=PHENO_KEYS.filter(k=>!ph.known[k]).length;
  if(unknownN) html+='<p class="muted">'+unknownN+' genetic traits still unknown (???) \u2014 keep growing & inspecting.</p>';
  if(p.problems.length) html+='<p class="prob">'+icon('warn','kv-ico')+' '+p.problems.map(esc).join(', ')+'</p>';
  html+='<h3 style="margin-top:10px">'+icon('inspect','ic')+' FIELD NOTES</h3><ul class="clues">'+inspectClues(p).map(c=>'<li>'+esc(c)+'</li>').join('')+'</ul>';
  html+='<button class="btn" onclick="this.closest(\'.modal-back\').remove()">CLOSE</button>';
  modal(html);
  save(); updateHUD(); refreshGrowUI();
}

/* ---------------- Grow simulation ---------------- */
function stageOf(p){
  if(p&&p.stage===-1) return -1; /* P1.1 germination pre-stage */
  const st=getStrain(p.strainId); if(!st) return 0;
  const pr=p.day/st.ft;
  if(pr<0.15) return 0; if(pr<0.35) return 1; if(pr<0.55) return 2;
  if(pr<0.75) return 3; if(pr<1.0) return 4; return 5;
}
/* display label for a numeric stage, incl. the P1.1 germination pre-stage */
function stageName(s){ return s===-1?'Germination':STAGES[s]; }
function plantIcon(p){
  const seed=p.strainId+'#'+(p.pheno&&p.pheno.num?p.pheno.num:'0');
  const o=plantVisOpts(p);
  try{ o.lightStress=num(S.env.light,80)>95; }catch(e){}
  o.exceptional=!!(p.pheno&&(p.pheno.rarity==='elite'||p.pheno.rarity==='legendary'));
  return plantSVG(visStageOf(p),seed,'slot-plant',o);
}

function envEval(){
  const D=DIFFS[S.difficulty], e=S.env, q=S.equipment;
  const tol=D.envTol;
  const issues=[]; let score=100;
  const tTol=6*(1+0.08*(q.hvac-1))*tol, hTol=8*(1+0.08*(q.humid-1))*tol, hhTol=8*(1+0.08*(q.dehumid-1))*tol;
  if(e.temp<70-tTol){ issues.push({icon:'temp',text:'Too cold',tone:'watch'}); score-=14; }
  else if(e.temp>82+tTol){ issues.push({icon:'temp',text:'Too hot',tone:'critical'}); score-=14; }
  if(e.humidity<40-hTol){ issues.push({icon:'humid',text:'Humidity low',tone:'watch'}); score-=10; }
  else if(e.humidity>60+hhTol){ issues.push({icon:'humid',text:'Humidity high',tone:'warning'}); score-=10; }
  const lTol=10*(1+0.08*(q.lights-1))*tol; /* QA GE-403: lights widen light tolerance (was ignored) */
  if(e.light<70-lTol){ issues.push({icon:'light',text:'Light low',tone:'warning'}); score-=12; }
  if(e.co2<800){ issues.push({icon:'co2',text:'CO2 low',tone:'watch'}); score-=8; }
  else if(e.co2>1500){ issues.push({icon:'co2',text:'CO2 high',tone:'warning'}); score-=6; }
  return { score:clamp(Math.round(score),0,100), issues:issues };
}

function newPlant(strainId){
  const st=getStrain(strainId);
  /* P1.1: seeds begin in the Germination pre-stage (-1); 2 game-days then sprout to stage 0 */
  const p={ id:S.nextPlantId++, strainId:strainId, stage:-1, germ:0, day:0, health:100, water:70, nutrition:60,
    stress:0, trained:false, minHealth:100, problems:[], growthBoost:0 };
  p.pheno=genPheno(st);
  p.pheno.num=nextPhenoNum(strainId);
  return p;
}
function plantSeed(strainId){
  const st=getStrain(strainId);
  const slots=FACILITIES[S.facility].slots;
  if(S.plants.length>=slots){ toast(icon('x','ge-ic-md')+' No free grow slots. Expand your facility!'); return false; }
  if(!isUnlocked(strainId)){ toast(icon('lock','ge-ic-md')+' Genetics locked.'); return false; }
  if(S.cash<st.seed){ toast(icon('x','ge-ic-md')+' Need '+fmt$(st.seed)+' for seeds.'); return false; }
  S.cash-=st.seed;
  const p=newPlant(strainId);
  S.plants.push(p);
  markStrainOwned(strainId);
  S.stats.plantsStarted++; S.stats.phenoTested++;
  try{ ME_first('plant',{strainId:strainId,name:(st?st.name:strainId),day:int(S.day,1)}); }catch(e){} /* P2.5 player memory */
  S.stats.maxConcurrent=Math.max(S.stats.maxConcurrent,S.plants.length);
  const h=phist(strainId); h.tested++;
  try{ codexOnGrown(strainId); }catch(e){} /* P2-W2: plant -> grown */
  const hunt=S.phenoHunts.find(x=>x.active&&x.strainId===strainId);
  if(hunt){ p.pheno.huntId=hunt.id; hunt.planted++; }
  if(S.stats.phenoTested%5===0){ addP0('preservation',1); addP0('knowledge',1); }
  gainXP(10);
  save(); updateHUD(); checkMissions();
  return true;
}
/* seed picker modal — used by the grow room and MY GROWS */
function plantSeedModal(){
  const slots=FACILITIES[S.facility].slots;
  const avail=allStrains().filter(s=>isUnlocked(s.id));
  let html='<h3>'+icon('grow','ic-lg')+'PLANT NEW SEED</h3>'+
   '<p class="muted">'+S.plants.length+'/'+slots+' grow slots used</p><div class="seed-list">';
  if(!avail.length) html+='<p class="muted">No genetics unlocked. Visit the GENETICS LIBRARY.</p>';
  avail.forEach(st=>{
    html+='<div class="seed-row" data-seed="'+st.id+'" role="button" tabindex="0">'+
     '<div class="seed-art">'+flowerSVG(strainSeed(st),'seed-flower')+'</div>'+
     '<div class="seed-info"><b>'+esc(st.name)+'</b><span class="muted">'+st.ft+'d \u2022 '+esc((st.tags||[]).slice(0,2).join(' / '))+'</span></div>'+
     '<span class="seed-cost">'+fmt$(st.seed)+'</span></div>';
  });
  html+='</div><button class="btn btn-small" id="sm-x">'+icon('x','b-ico')+'CANCEL</button>';
  const m=modal(html);
  m.querySelector('#sm-x').onclick=()=>closeModal(m);
  m.querySelectorAll('[data-seed]').forEach(r=>r.onclick=()=>{
    if(plantSeed(r.dataset.seed)) closeModal(m);
  });
}
function doAction(pid,action){
  const p=S.plants.find(x=>x.id===pid); if(!p) return;
  const st=getStrain(p.strainId);
  if(action==='water'){
    if(p.water>92){ p.health=clamp(p.health-6,0,100); p.stress=clamp(p.stress+10,0,100); p.problems.push('Overwatered!'); toast(icon('water','ge-ic-md')+' Overwatered! Roots are stressed.'); }
    else { p.water=clamp(p.water+38,0,100); toast(icon('water','ge-ic-md')+' Watered.'); }
    S.stats.waterings++;
  }else if(action==='feed'){
    const eff=1+0.15*(S.equipment.nutrients-1);
    /* P1.2: nutrient sensitivity shifts the burn threshold ±5 (88 baseline at sensitivity 50) */
    const burnAt=clamp(88-(num(p.pheno&&p.pheno.nutrientSensitivity,50)-50)*0.11,83,93);
    if(p.nutrition>burnAt){ p.health=clamp(p.health-8,0,100); p.stress=clamp(p.stress+12,0,100); p.problems.push('Nutrient burn!'); toast(icon('flask','ge-ic-md')+' Nutrient burn! Too much.'); }
    else { p.nutrition=clamp(p.nutrition+32*eff,0,100); toast(icon('flask','ge-ic-md')+' Fed.'); }
    S.stats.feedings++;
  }else if(action==='train'){
    p.stress=clamp(p.stress+12,0,100); p.trained=true;
    p.health=clamp(p.health-3,0,100); toast(icon('train','ge-ic-md')+' Trained: +yield potential, +stress.');
    S.stats.trainings++;
  }else if(action==='inspect'){
    inspectPheno(pid); return;
  }else if(action==='harvest'){
    harvestPlant(p); return;
  }
  p.minHealth=Math.min(p.minHealth,p.health);
  save(); updateHUD(); refreshGrowUI();
}
function refreshGrowUI(){ if(current==='grow') RENDER.grow(); if(current==='grows') RENDER.grows(); }

/* QA GE-705: inventory stack merge — stacks merge ONLY when every gameplay-relevant
   property matches: strain/genetics id, pheno id, quality, potency, terpenes,
   bagAppeal, resin, processing state (type), weight unit (derived from type:
   edible counts units, flower/concentrate count oz), and custom flag.
   Price basis (pricePerOz) is a pure function of quality/potency/type plus
   global reputation/difficulty, so it cannot differ when the key matches.
   Any difference in any of these => separate stack. Single linear scan matches
   the codebase's existing inventory access pattern (S.inventory.find). */
function INV_mergeKey(it){
  var unit=it.type==='edible'?'unit':'oz';
  return [it.strainId==null?'':it.strainId,
    it.phenoNum==null?'':it.phenoNum,
    num(it.quality,0),num(it.potency,0),num(it.terpenes,0),num(it.bagAppeal,0),num(it.resin,0),
    it.type||'flower',unit,it.custom?1:0].join('|');
}
function INV_add(item){
  if(!Array.isArray(S.inventory)) S.inventory=[];
  var key=INV_mergeKey(item);
  var ex=S.inventory.find(function(x){ return x&&INV_mergeKey(x)===key; });
  if(ex){ ex.amount=Math.round((num(ex.amount,0)+num(item.amount,0))*10)/10; return ex; }
  item.id=S.nextInvId++;
  S.inventory.push(item);
  return item;
}

/* ---------------- Harvest ---------------- */
function harvestPlant(p){
  if(!p||p.harvested) return; /* QA GE-303: idempotency — already harvested (flag survives detached refs) */
  const st=getStrain(p.strainId);
  /* GE-DP-500b: unknown/tampered strain bails before ANY mutation — st.ft and
     genPheno(st) below would throw on undefined, bricking the plant. */
  if(!st){ try{ toast(icon('x','ge-ic-md')+' Unknown genetics — cannot harvest.'); }catch(e){} return; }
  if(stageOf(p)<5){ toast(icon('clock','ge-ic-md')+' Not ready yet \u2014 '+stageName(stageOf(p))+'.'); return; }
  /* W4: flag is set AFTER the ready gate. Marking it before bricked unready
     plants (marked harvested, never removed, never harvestable again). The
     re-entrancy guard still holds: it is set before any grant code below. */
  p.harvested=true;
  if(!p.pheno){ p.pheno=genPheno(st); p.pheno.num=nextPhenoNum(p.strainId); }
  const ph=p.pheno;
  sanitizePheno(ph);
  revealForStage(p);
  PHENO_KEYS.forEach(k=>{ ph.known[k]=true; }); /* full reveal at harvest */
  const D=DIFFS[S.difficulty], q=S.equipment;
  const healthF=p.health/100;
  const stressF=1-p.stress/250;
  const ev=envEval().score/100;
  const trainB=p.trained?1.15:1;
  const lightB=1+0.06*(q.lights-1), co2B=1+0.04*(q.co2sys-1), crewB=S.crew.harvest?1.06:1;
  /* GENETICS vs ENVIRONMENT: pheno potential sets the ceiling, grow performance decides the result */
  const G={yld:ph.yieldPot,pot:ph.potencyPot,terp:ph.terpenePot,resin:ph.resinPot,stab:ph.stability};
  /* P1.0: Project 0 legacy prestige bonus — advertised in EX_legacyHTML, now actually applied; hard-capped */
  const legB=((typeof EX_legacyBonus==='function')?EX_legacyBonus():null)||{qual:0,yield:0};
  const legYieldB=1+clamp(num(legB.yield,0),0,15)/100, legQualB=1+clamp(num(legB.qual,0),0,24)/100;
  const yieldOz=Math.max(0.5,(G.yld/100)*3.2*healthF*stressF*trainB*lightB*co2B*crewB*D.econMult*legYieldB);
  let quality=(G.pot*0.25+G.terp*0.15+G.resin*0.15+G.stab*0.1);
  quality=quality*0.5 + (p.health*0.3) + (ev*20);
  quality+=q.drycure*3 + q.sensors*2 - p.stress*0.15;
  /* P3-W4: Project 0 Facility dry & cure rooms — +5 final harvest quality */
  try{ if(typeof P3W4_cureQualBonus==='function') quality+=P3W4_cureQualBonus(); }catch(e){}
  /* P3-W5: Master Grower on staff — slight final-quality lift, hard-capped by clamp below */
  try{ if(typeof P3W5_masterGrowerBonus==='function') quality+=P3W5_masterGrowerBonus(); }catch(e){}
  if(p.day>st.ft+7) quality-=10; // harvested late
  quality=clamp(quality*D.qualityMult*legQualB,5,100); /* P1.0: legacy prestige bonus, capped +24% */
  /* WAVE 0 FIX (a): consume one-harvest goodEvent/mutation boosts at the advertised "+quality"
     magnitude, then clear so they cannot stack or persist; hard-capped by clamp */
  quality=clamp(quality+num(p.terpBoost,0)+num(p.resinBoost,0),5,100);
  p.terpBoost=0; p.resinBoost=0;
  const potency=clamp(G.pot*0.6+quality*0.4,5,100);
  const terpenes=clamp(G.terp*0.6+quality*0.4,5,100);
  const bagAppeal=clamp(ph.bagAppeal*0.5+quality*0.5,5,100);
  const resin=clamp(G.resin*0.65+quality*0.35,5,100);
  const newInv=INV_add({ strainId:st.id, strainName:st.name, phenoNum:ph.num, amount:Math.round(yieldOz*10)/10,
    quality:Math.round(quality), potency:Math.round(potency), terpenes:Math.round(terpenes),
    bagAppeal:Math.round(bagAppeal), resin:Math.round(resin), type:'flower', custom:!!st.custom });
  S.plants=S.plants.filter(x=>x.id!==p.id);
  const oz=Math.round(yieldOz*10)/10, qq=Math.round(quality);
  try{ if(typeof P3W5_onHarvestRep==='function') P3W5_onHarvestRep(qq); }catch(e){} /* P3-W5: elite harvests build Grower Rep */
  /* ---- expansion: deep harvest grading (Builder B) + perfect-grow note (Builder C) ---- */
  try{ if(typeof EX_harvestNote==='function') EX_harvestNote(qq,p.minHealth); }catch(e){}
  try{ if(typeof TY_harvestHook==='function') TY_harvestHook(st,qq,oz,p); }catch(e){}
  try{
    if(typeof GX_gradeHarvest==='function'){
      const gxG=GX_gradeHarvest({strainId:st.id,pheno:ph,yieldOz:oz,quality:qq,
        potency:Math.round(potency),resin:Math.round(resin),terpenes:Math.round(terpenes),bagAppeal:Math.round(bagAppeal),
        care:{avgWater:p.water,avgNutrition:p.nutrition,stress:p.stress,minHealth:p.minHealth},
        envScore:(typeof envEval==='function'?envEval().score:80),
        equipAvg:(q.lights+q.hvac+q.humid+q.dehumid+q.co2sys+q.irrigation+q.nutrients+q.sensors+q.drycure)/9,
        harvestDay:S.day,flowerDays:p.day});
      const gxInv=newInv;
      if(gxInv) gxInv.gxGrade=gxG.grade;
    }
  }catch(e){}
  const sg=S.stats.strainGrown[st.id]||{count:0,best:0,yield:0};
  sg.count++; sg.best=Math.max(sg.best,qq); sg.yield=Math.max(num(sg.yield,0),num(oz,0)); S.stats.strainGrown[st.id]=sg;
  /* P3-W3: stress-test evidence + preservation-tier sweep (additive) */
  try{ if(typeof P0T_onHarvest==='function') P0T_onHarvest(st.id,p.minHealth,qq); }catch(e){}
  /* P2-W2 Living Codex: harvest -> harvested + best records */
  try{ codexOnHarvest(st.id,{yieldOz:oz,potency:Math.round(potency),terpenes:Math.round(terpenes),resin:Math.round(resin)}); }catch(e){}
  try{ if(ph&&ph.num) codexNote(st.id,'Harvested pheno #'+int(ph.num,0)+' \u2014 Q'+qq+', '+fmtW(oz)); }catch(e){}
  S.stats.harvests++; S.stats.lifetimeHarvestOz+=oz;
  try{ if(typeof CHA_onHarvest==='function') CHA_onHarvest(p); }catch(e){} /* P2.3: comeback-chain harvest hook */
  S.stats.bestQuality=Math.max(S.stats.bestQuality,qq);
  S.stats.bestBagAppeal=Math.max(S.stats.bestBagAppeal,Math.round(bagAppeal));
  S.stats.biggestHarvest=Math.max(S.stats.biggestHarvest,oz);
  try{ ME_first('harvest',{strainId:st.id,strainName:st.name,oz:oz,quality:qq,day:int(S.day,1)}); }catch(e){} /* P2.5 player memory: first */
  try{ if(typeof MS_onHarvest==='function') MS_onHarvest(); }catch(e){} /* P3-W6 milestone: FIRST HARVEST */
  try{ ME_recordHarvest(st,oz,potency,terpenes,resin); }catch(e){} /* P2.5 player memory: records */
  if(qq>=80) S.stats.q80Harvests++;
  if(p.health>=90) S.stats.highHealthHarvests++;
  if(p.minHealth>=80) S.stats.flawlessGrows++;
  if(qq>=90){ S.stats.keepers++; addP0('preservation',2); addP0('family',1); }
  const growDays=p.day;
  if(!S.stats.fastestGrow||growDays<S.stats.fastestGrow) S.stats.fastestGrow=growDays;
  if(growDays<=60) S.stats.quickTurnReady=true;
  if(qq>=85){ addP0('cultivation',2); addP0('resin',1); }
  addP0('nocompromise',1);
  gainXP(60+Math.round(qq/2)); gainRep(Math.round(qq/10));
  if(S.stats.quickTurnReady&&growDays<=75){ S.stats.quickTurnarounds++; S.stats.quickTurnReady=false; }
  /* ---- phenotype bookkeeping ---- */
  S.stats.phenoHarvested++;
  const h=phist(p.strainId); h.harvested++;
  countRarity(ph,p.strainId);
  /* P2.1: elite ceremony plays BEFORE the harvest report (one per pheno); the report waits. */
  const eliteCinePending=!!ph._eliteCinePending; ph._eliteCinePending=false;
  const yieldScore=clamp(Math.round(yieldOz/4.5*100),5,100);
  const overall=Math.round(qq*0.3+potency*0.2+resin*0.15+terpenes*0.15+bagAppeal*0.1+yieldScore*0.1);
  S.stats.bestPhenoScore=Math.max(S.stats.bestPhenoScore,overall);
  if(overall>h.bestScore){ h.bestScore=overall; h.bestPheno=ph.num; }
  /* clone harvest -> mother stats */
  if(ph.isClone&&ph.motherId){
    const mo=S.mothers.find(m=>m.id===ph.motherId);
    if(mo){
      mo.runs++; mo.qualities.push(qq); mo.yields.push(oz);
      if(mo.qualities.length>20) mo.qualities.shift();
      if(mo.yields.length>20) mo.yields.shift();
      mo.bestQ=Math.max(mo.bestQ,qq); mo.bestY=Math.max(mo.bestY,oz);
      if(qq>=90) mo.awards.push('\uD83D\uDCAE 90+');
      S.stats.cloneHarvests++;
      if(ph.keeperId){
        S.keeperCloneRuns[ph.keeperId]=int(S.keeperCloneRuns[ph.keeperId],0)+1;
        S.stats.provenCut=Math.max(S.stats.provenCut,S.keeperCloneRuns[ph.keeperId]);
        const k=S.keepers.find(x=>x.id===ph.keeperId);
        if(k){ k.clonesGrown++; k.cloneRuns=S.keeperCloneRuns[ph.keeperId]; }
      }
      addP0('cultivation',1);
    }
  }
  /* pheno hunt hook */
  if(ph.huntId){
    const hunt=S.phenoHunts.find(x=>x.id===ph.huntId);
    if(hunt&&hunt.active){
      hunt.harvested++;
      if(overall>hunt.bestScore){ hunt.bestScore=overall; hunt.bestPheno=ph.num; }
      if(hunt.harvested>=hunt.total) completeHunt(hunt);
    }
  }
  save(); updateHUD(); checkMissions(); checkAchievements(); refreshGrowUI();
  try{ NT_onHarvest(); }catch(e){} /* P1.6: harvest -> processing nudge (read-only) */
  /* ---- permanent phenotype report ---- */
  const report={
    strainId:st.id, strainName:st.name, phenoNum:ph.num,
    rarity:ph.rarity, legendaryTrait:ph.legendaryHidden?null:ph.legendaryTrait,
    traits:ph.expressed.slice(),
    /* P2.1: snapshot ALL pheno traits. The keeper flow deep-copies report.genetics;
       any dropped key silently becomes 50 in the vault via sanitizePhenoGenetics
       (overwrite-by-default bug: hermRisk/rootVigor/cloneVigor/internode/diseaseRes
       were lost on every harvest report). */
    genetics:(function(){ const g={}; PHENO_KEYS.forEach(k=>{ g[k]=clamp(Math.round(num(ph[k],50)),5,100); }); return g; })(),
    overall:overall,
    harvest:{quality:qq,potency:Math.round(potency),terpenes:Math.round(terpenes),
      bagAppeal:Math.round(bagAppeal),resin:Math.round(resin),yieldOz:oz,yieldScore:yieldScore},
    day:S.day, generation:ph.cloneGen||0,
    lineage:ph.isClone?('Clone of '+st.name+' #'+ph.num):'Seed',
    isClone:ph.isClone, motherId:ph.motherId||null, keeperId:ph.keeperId||null,
    huntId:ph.huntId||null
  };
  const showReport=()=>{ try{
    phenoReportModal(report);
    /* ---- expansion: append deep grade ceremony into the harvest report modal ---- */
    try{
      const gxG2=S.gx&&S.gx.lastGrade;
      if(gxG2&&gxG2.strainId===st.id&&typeof GX_gradeReportHTML==='function'){
        const backs=document.querySelectorAll('#modal-root .modal-back');
        const box=backs.length?backs[backs.length-1].querySelector('.modal'):null;
        if(box) box.insertAdjacentHTML('beforeend',GX_gradeReportHTML(gxG2));
      }
    }catch(e){}
  }catch(e){} };
  /* W4: if the player dismisses the elite ceremony via Android back / backdrop,
     show the harvest report AT ONCE instead of letting it pop up 4.4s later
     (auto-dismiss and LOG IT keep the staged timing). */
  if(eliteCinePending){
    let __eliteBack=null;
    try{ eliteExpressionCeremony(st,ph); __eliteBack=document.querySelector('#modal-root .cine-back.cine-elite'); }catch(e){}
    let __fired=false;
    const __fire=()=>{ if(__fired) return; __fired=true; showReport(); };
    if(__eliteBack) __eliteBack.__geOnDismiss=__fire;
    setTimeout(__fire,4400);
  }
  else showReport();
}

/* ---- harvest-reveal haptics: CAP bridge first, navigator.vibrate fallback ---- */
function PR_haptic(kind){
  try{ if(typeof CAP_haptic==='function') CAP_haptic(kind); }catch(e){}
  try{
    const native=(typeof CAP_native==='function')?CAP_native():false;
    if(!native&&typeof navigator!=='undefined'&&navigator&&typeof navigator.vibrate==='function')
      navigator.vibrate(kind==='alert'?[70,40,70]:[20]);
  }catch(e){}
}

function phenoReportModal(report){
  const r=report.harvest;
  /* ============ P1.3 STAGED HARVEST REVEAL (presentation-only) ============
     The report object is read, never mutated. Beats reveal one tap at a time
     through a real <button> (#pr-next), so the 400ms CAP double-tap guard
     applies naturally — one tap can never skip a beat. Haptics fire per beat
     via the CAP bridge with a navigator.vibrate fallback. */
  const masterGrow=report.overall>=92;
  const tier=r.quality>=95?['LEGENDARY RUN','ge-badge-legendary']:r.quality>=90?['MASTER GROW','ge-badge-keeper']:r.quality>=85?['TOP SHELF','ge-badge-elite']:r.quality>=75?['PREMIUM','ge-badge']:['STANDARD','ge-badge'];
  const g0=(report.genetics&&typeof report.genetics==='object')?report.genetics:{};
  const traits=Array.isArray(report.traits)?report.traits:[];
  function bdesc(v){ return v>=90?'EXCEPTIONAL':v>=78?'STRONG':v>=62?'SOLID':'MILD'; }
  /* Beat order: DRY YIELD -> QUALITY GRADE -> POTENCY -> TERPENES -> RESIN -> BAG APPEAL -> GROWER BONUS -> PHENO TRAITS */
  const BEATS=[
   {id:'yield',n:'01',title:'DRY YIELD',hk:'harvest',
    body:'<div class="pr-beat-val ge-num" data-count="'+r.yieldOz+'" data-dec="1">0</div><div class="pr-beat-sub">OZ \u00b7 DRY WEIGHT</div><div class="pr-beat-note ge-muted">Yield score <b class="ge-num">'+r.yieldScore+'</b>/100</div>'},
   {id:'quality',n:'02',title:'QUALITY GRADE',hk:'mission',
    body:'<div class="ge-badge '+tier[1]+'">'+icon('trophy','ge-ic-sm')+' '+tier[0]+'</div><div class="pr-beat-val ge-num" data-count="'+r.quality+'" data-dec="0">0</div><div class="pr-beat-sub">QUALITY \u00b7 OVERALL <b class="ge-num" data-count="'+report.overall+'" data-dec="0">0</b></div>'},
   {id:'potency',n:'03',title:'POTENCY',hk:'purchase',
    body:'<div class="pr-beat-val ge-num" data-count="'+r.potency+'" data-dec="0">0</div><div class="pr-beat-sub">'+bdesc(r.potency)+' \u00b7 THC EXPRESSION</div>'},
   {id:'terpenes',n:'04',title:'TERPENES',hk:'purchase',
    body:'<div class="pr-beat-val ge-num" data-count="'+r.terpenes+'" data-dec="0">0</div><div class="pr-beat-sub">'+bdesc(r.terpenes)+' \u00b7 AROMA PROFILE</div>'},
   {id:'resin',n:'05',title:'RESIN',hk:'purchase',
    body:'<div class="pr-beat-val ge-num" data-count="'+r.resin+'" data-dec="0">0</div><div class="pr-beat-sub">'+(r.resin>=93?'TRICHOME BLIZZARD':r.resin>=82?'FROSTY':r.resin>=65?'LIGHT FROST':'SPARSE')+' \u00b7 TRICHOME COVERAGE</div>'},
   {id:'bag',n:'06',title:'BAG APPEAL',hk:'purchase',
    body:'<div class="pr-beat-val ge-num" data-count="'+r.bagAppeal+'" data-dec="0">0</div><div class="pr-beat-sub">'+(r.bagAppeal>=85?'DENSE, TIGHT':r.bagAppeal>=68?'SOLID':r.bagAppeal>=55?'AVERAGE':'AIRY / LOOSE')+' \u00b7 STRUCTURE</div>'},
   {id:'bonus',n:'07',title:'GROWER BONUS',hk:'achievement',
    body:'<div class="pr-beat-val ge-num" data-count="'+r.quality+'" data-dec="0">0</div><div class="pr-beat-sub">HARVEST QUALITY LOGGED</div>'+
     '<div class="pr-beat-note">'+(r.quality>=90?icon('star','ge-ic-sm')+' <b>PERFECT GROW</b> credited <span class="ge-muted">(EX harvest note: quality \u2265 90, min-health \u2265 95)</span>':'<span class="ge-muted">EX harvest note: perfect-grow credit needs quality \u2265 90 with min-health \u2265 95.</span>')+'</div>'+
     '<div class="pr-beat-note ge-muted">Perfect grows on record: <b class="ge-num">'+int(S.ex&&S.ex.records?S.ex.records.perfectGrows:0,0)+'</b> \u00b7 Flawless grows: <b class="ge-num">'+int(S.stats.flawlessGrows,0)+'</b></div>'},
   {id:'traits',n:'08',title:'PHENO TRAITS',hk:'keeper',
    body:(traits.length?'<div class="ge-tags">'+traits.map(t=>'<span class="ge-pill ge-pill-neutral">'+esc(t)+'</span>').join('')+'</div>':'<p class="ge-muted">No traits expressed.</p>')+
     '<p class="ge-caption ge-muted">Lineage: '+esc(report.lineage)+'</p>'}
  ];
  /* ---- special-result banners (computed once, revealed after the beats) ---- */
  const banners=[];
  if(traits.indexOf('KEEPER CANDIDATE')>=0) /* expressionTags: beat strain baseline by 7+ */
    banners.push({cls:'pr-banner-gold',ic:'crown-gold',t:'KEEPER CANDIDATE',s:'Outperformed the strain baseline by 7+ points. Vault-worthy genetics.'});
  if(report.rarity==='elite')
    banners.push({cls:'pr-banner-red',ic:'trophy',t:'ELITE EXPRESSION',s:'An elite phenotype \u2014 a cut above the pack.'});
  /* PERSONAL RECORDS: harvestPlant maxed the stats before this modal, so >= means this run set it */
  const recs=[];
  if(Math.round(r.quality)>=Math.round(num(S.stats.bestQuality,0))&&r.quality>0) recs.push('QUALITY '+Math.round(r.quality));
  if(r.yieldOz>=num(S.stats.biggestHarvest,0)&&r.yieldOz>0) recs.push('YIELD '+r.yieldOz+' OZ');
  let bestPot=0; try{ bestPot=num(typeof NX_bestPotency==='function'?NX_bestPotency():0,0); }catch(e){ bestPot=0; }
  if(r.potency>=bestPot&&r.potency>0) recs.push('POTENCY '+Math.round(r.potency));
  if(recs.length) banners.push({cls:'pr-banner-gold',ic:'star',t:'PERSONAL RECORD',s:recs.join('  \u00b7  ')});
  if(report.legendaryTrait||report.rarity==='legendary') /* existing rare-trait detection */
    banners.push({cls:'pr-banner-legend',ic:'crown-gold',t:'RARE TRAIT',s:report.legendaryTrait?esc(report.legendaryTrait)+' \u2014 a legendary expression. Preserve it.':'Legendary genetics present \u2014 expression unrevealed.'});
  /* P0 CANDIDATE (NEW): elite/legendary expression or exceptional resin+terpene combo flags Project 0 preservation */
  const eliteExpr=report.rarity==='elite'||report.rarity==='legendary'||!!report.legendaryTrait;
  const frostTerp=num(g0.resinPot,0)>=88&&num(g0.terpenePot,0)>=88;
  if(eliteExpr||frostTerp)
    banners.push({cls:'pr-banner-p0',ic:'project0',t:'P0 CANDIDATE',s:(eliteExpr?'Elite/legendary expression':'Exceptional resin + terpene combo')+' \u2014 flagged for Project 0 preservation.'});
  /* P2-4: discovery moments — one-time beats for notable findings (reward-free; W1 owns elite rewards) */
  try{ P24_harvestDiscoveries(report,r); }catch(e){}
  /* ---- persistent header: Shocker OwnZ industrial presentation; petal-fall retired ---- */
  let html='<div class="ge-harvest-report pr-report">'+
   '<div class="pr-smoke" aria-hidden="true"></div><div class="pr-scan" aria-hidden="true"></div>'+
   '<div class="pr-kicker"><span class="pr-kicker-bar"></span>SHOCKER OWNZ // HARVEST REPORT<span class="pr-kicker-bar"></span></div>'+
   '<div class="ge-display pr-glitch" data-text="HARVEST COMPLETE">HARVEST COMPLETE</div>'+
   '<div class="ge-harvest-art">'+plantSVG(9,report.strainId+'#'+report.phenoNum,'harvest-plant',{frost:3,dense:true,purple:report.rarity==='legendary',exceptional:report.rarity==='legendary'})+flowerSVG(report.strainId+'#'+report.phenoNum,'harvest-bud')+'</div>'+
   '<h3 class="ge-h2">'+esc(report.strainName)+' #'+report.phenoNum+(report.isClone?' '+icon('clone','ge-ic-sm'):'')+'</h3>'+
   '<p>'+rarityBadge({rarity:report.rarity})+(report.legendaryTrait?' <span class="ge-badge ge-badge-legendary">'+icon('crown-gold','ge-ic-sm')+esc(report.legendaryTrait)+'</span>':'')+(masterGrow?' <span class="ge-badge ge-badge-keeper">'+icon('crown','ge-ic-sm')+'MASTER GROW</span>':'')+'</p>'+
   '<div class="pr-prog ge-caption ge-muted" id="pr-prog">BEAT 01 / 08</div>'+
   '<div id="pr-stage" class="pr-stage"></div>'+
   '<button type="button" class="ge-btn ge-btn-ghost ge-btn-block pr-next" id="pr-next">TAP TO CONTINUE</button>'+
   '</div>';
  const m=modal(html);
  const stage=m.querySelector('#pr-stage'), prog=m.querySelector('#pr-prog'), nextBtn=m.querySelector('#pr-next');
  /* count-up animation, same easing as the original report */
  function prCountUp(scope){
    scope.querySelectorAll('[data-count]').forEach(el=>{
      const target=num(el.dataset.count,0), dec=int(el.dataset.dec,0), t0=performance.now(), dur=900;
      function tick(t){
        const p=clamp((t-t0)/dur,0,1), e=1-Math.pow(1-p,3);
        el.textContent=(target*e).toFixed(dec);
        if(p<1) requestAnimationFrame(tick);
      }
      try{ requestAnimationFrame(tick); }catch(e){ el.textContent=target.toFixed(dec); }
    });
  }
  function renderBeat(b){
    stage.innerHTML='<div class="pr-beat pr-beat-in"><div class="pr-beat-top"><span class="pr-beat-kicker">BEAT '+b.n+' / 08</span><span class="pr-beat-title">'+b.title+'</span></div>'+b.body+'</div>';
    prog.textContent='BEAT '+b.n+' / 08';
    prCountUp(stage); PR_haptic(b.hk);
  }
  function renderBanners(){
    stage.innerHTML='<div class="pr-banners">'+(banners.length?banners.map((bn,i)=>'<div class="pr-banner '+bn.cls+'" style="animation-delay:'+(i*0.18).toFixed(2)+'s"><span class="pr-banner-ic">'+icon(bn.ic,'ge-ic-md')+'</span><span class="pr-banner-tx"><b>'+bn.t+'</b><i>'+bn.s+'</i></span></div>').join(''):'<p class="ge-muted">No special results this run \u2014 the hunt continues.</p>')+'</div>';
    prog.textContent='RESULTS';
    banners.forEach((bn,i)=>setTimeout(()=>PR_haptic('achievement'),i*200)); /* one buzz per banner */
  }
  function renderActions(){
    nextBtn.style.display='none';
    const row=document.createElement('div');
    row.className='ge-btn-row';
    row.innerHTML='<button type="button" class="ge-btn ge-btn-gold" id="pr-keep">'+icon('crown-gold','ge-ic-md')+'KEEP</button>'+
     '<button type="button" class="ge-btn ge-btn-primary" id="pr-clone">'+icon('clone','ge-ic-md')+'CLONE</button>'+
     '<button type="button" class="ge-btn ge-btn-primary" id="pr-breed">'+icon('dna','ge-ic-md')+'BREED</button>'+
     '<button type="button" class="ge-btn ge-btn-ghost" id="pr-arch">'+icon('preserve','ge-ic-md')+'ARCHIVE</button>'+
     '<button type="button" class="ge-btn ge-btn-danger" id="pr-disc">'+icon('x','ge-ic-md')+'CULL</button>'; /* P1.7 */
    m.querySelector('.modal').appendChild(row);
    /* wiring semantics unchanged; keeper direct-save fallback preserved */
    m.querySelector('#pr-keep').onclick=()=>{ try{ closeModal(m); markKeeper(report); }catch(e){ try{ toast(icon('x','ge-ic-md')+' Keeper error \u2014 preserving directly.'); }catch(e2){} try{ confirmKeeper(report); }catch(e3){} } };
    m.querySelector('#pr-arch').onclick=()=>{ closeModal(m); archivePheno(report); };
    m.querySelector('#pr-disc').onclick=()=>{ closeModal(m); toast('Phenotype culled.'); save(); };
  /* P1.7: CLONE/BREED reuse the existing flows, pre-selected with the harvested pheno */
  m.querySelector('#pr-clone').onclick=()=>{ closeModal(m); TU_cloneFromReport(report); };
  m.querySelector('#pr-breed').onclick=()=>{ closeModal(m); TU_breedFromReport(report); };
  }
  let step=-1, done=false;
  nextBtn.onclick=()=>{
    if(done) return;
    step++;
    if(step<BEATS.length){ renderBeat(BEATS[step]); }
    else{ done=true; renderBanners(); renderActions(); }
  };
  renderBeat(BEATS[0]); step=0; /* beat 1 shows on open; taps advance the rest */
}

/* P1.7: CLONE from a harvest report — entry point for the existing clone flow.
   takeClone() needs a mother plant; if this exact pheno already has one, take
   the clone immediately, otherwise preserve it via the keeper flow first. */
function TU_cloneFromReport(report){
  try{
    const sid=report&&report.strainId, pnum=int(report&&report.phenoNum,0);
    const mo=(S.mothers||[]).find(x=>x.strainId===sid&&int(x.phenoNum,0)===pnum);
    if(mo){ takeClone(mo.id); return; }
    markKeeper(report);
    setTimeout(()=>{ try{ toast(icon('clone','ge-ic-md')+' Keeper preserved \u2014 promote it in the Mother Room, then TAKE CLONE.'); }catch(e){} },450);
  }catch(e){ try{ toast(icon('x','ge-ic-md')+' Clone failed.'); }catch(e2){} }
}
function archivePheno(report){
  /* P2.1: archive keeps the FULL genetics snapshot so compared/archived phenos
     render complete trait tables later (previously only 6 trait names were kept). */
  let genetics=null;
  try{ if(report&&report.genetics&&typeof report.genetics==='object'){ genetics={}; PHENO_KEYS.forEach(k=>{ genetics[k]=clamp(Math.round(num(report.genetics[k],50)),5,100); }); } }catch(e){}
  const tr=Array.isArray(report&&report.traits)?report.traits.slice(0,6):[];
  S.phenoArchive.unshift({strainId:report?report.strainId:null,strainName:report?report.strainName:'?',phenoNum:report?int(report.phenoNum,0):0,rarity:report?report.rarity:'common',
    overall:report?num(report.overall,0):0,day:S.day,traits:tr,genetics:genetics,
    isClone:!!(report&&report.isClone),lineage:report&&report.lineage?String(report.lineage):''});
  if(S.phenoArchive.length>200) S.phenoArchive.length=200;
  save(); toast(icon('box','ge-ic-md')+' Phenotype archived.');
}
/* P2.1: archive a keeper (full genetics carried). */
function archiveKeeper(keeperId){
  try{
    const k=(S.keepers||[]).find(x=>x.id===keeperId); if(!k) return;
    archivePheno({strainId:k.strainId,strainName:k.strainName,phenoNum:k.phenoNum,rarity:k.rarity,
      overall:k.overall,traits:Array.isArray(k.traits)?k.traits:[],genetics:k.genetics,isClone:!!k.isClone,lineage:k.lineage||'Keeper'});
  }catch(e){ try{ toast(icon('x','ge-ic-md')+' Archive failed.'); }catch(e2){} }
}
/* P2.1: per-pheno action set for compare contexts. Entries carry side:'a'|'b' so
   compareModal groups them under the right pheno. MARK AS KEEPER reuses the
   hardened keeper flow (markKeeper -> keeperCine -> confirmKeeper, with the
   direct-save fallback preserved inside the ceremony). */
function phenoSideActions(side,desc){
  const out=[];
  const push=(label,cls,fn)=>out.push({label:label,cls:cls,fn:fn,side:side});
  if(!desc) return out;
  if(desc.kind==='report'){
    const rep=desc.report;
    push(icon('crown-gold','ge-ic-sm')+' MARK AS KEEPER','ge-btn-gold',()=>markKeeper(rep));
    push(icon('clone','ge-ic-sm')+' CLONE','ge-btn-primary',()=>TU_cloneFromReport(rep));
    push(icon('dna','ge-ic-sm')+' BREED','ge-btn-primary',()=>TU_breedFromReport(rep));
    push(icon('preserve','ge-ic-sm')+' ARCHIVE','ge-btn-ghost',()=>archivePheno(rep));
    push(icon('x','ge-ic-sm')+' CULL','ge-btn-danger',()=>{ toast('Phenotype culled.'); save(); });
  }else{
    const kid=desc.keeperId;
    push(icon('grow','ge-ic-sm')+' MOTHER','ge-btn-ghost',()=>promoteMother(kid));
    push(icon('clone','ge-ic-sm')+' CLONE','ge-btn-primary',()=>TU_cloneKeeper(kid));
    push(icon('dna','ge-ic-sm')+' BREED','ge-btn-primary',()=>TU_breedFromKeeper(kid));
    push(icon('preserve','ge-ic-sm')+' ARCHIVE','ge-btn-ghost',()=>archiveKeeper(kid));
    push(icon('x','ge-ic-sm')+' CULL','ge-btn-danger',()=>removeKeeper(kid));
  }
  return out;
}
/* P2.1: clone a keeper — reuses the existing mother/clone flow (takeClone). */
function TU_cloneKeeper(keeperId){
  try{
    const k=(S.keepers||[]).find(x=>x.id===keeperId); if(!k) return;
    const mo=(S.mothers||[]).find(x=>x.keeperId===keeperId);
    if(mo){ takeClone(mo.id); return; }
    promoteMother(keeperId);
    setTimeout(()=>{ try{ toast(icon('clone','ge-ic-md')+' Keeper promoted \u2014 use the Mother Room to TAKE CLONE.'); }catch(e){} },450);
  }catch(e){ try{ toast(icon('x','ge-ic-md')+' Clone failed.'); }catch(e2){} }
}
/* P2.1: BREED reuses the existing breeding flow, pre-selected with the pheno.
   The lab is strain-level; the source pheno is stashed as a session hint and
   displayed on the breeding screen. */
function TU_breedFromReport(report){
  try{ if(!report) return; TU_breedFromStrain(report.strainId,report.strainName,report.phenoNum,report.overall,report.rarity,report.genetics); }catch(e){}
}
function TU_breedFromKeeper(keeperId){
  try{
    const k=(S.keepers||[]).find(x=>x.id===keeperId); if(!k) return;
    TU_breedFromStrain(k.strainId,k.strainName,k.phenoNum,k.overall,k.rarity,k.genetics);
  }catch(e){}
}
/* P3-W1: the session hint now also carries the pheno's full 18-trait genetics record,
   so the breeding lab can inherit from the PHENO's actual traits (not the strain average).
   The 6th arg is optional - older call sites keep working. */
function TU_breedFromStrain(strainId,strainName,phenoNum,overall,rarity,genetics){
  if(!strainId) return;
  try{ breedA=strainId; }catch(e){}
  try{ window.__breedPhenoHint={strainId:strainId,strainName:String(strainName||strainId),phenoNum:int(phenoNum,0),overall:int(overall,0),rarity:rarity||'common',genetics:P3B_sanitizePhenoGenetics(genetics)}; }catch(e){}
  show('breeding');
}


/* ---------------- Random events ---------------- */
function rollEvents(){
  const D=DIFFS[S.difficulty], ev=[];
  S.plants.forEach(p=>{
    const st=getStrain(p.strainId);
    const pestP=0.06*D.pestMult*(S.crew.health?0.6:1);
    const r=Math.random();
    if(r<pestP*0.4) ev.push(miteEvent(p));
    else if(r<pestP*0.7) ev.push(gnatEvent(p));
    else if(r<pestP) ev.push(mildewEvent(p));
    if(p.nutrition<18&&Math.random()<0.5*D.defMult) ev.push(defEvent(p,'deficiency'));
    if(p.nutrition>92&&Math.random()<0.5) ev.push(defEvent(p,'burn'));
    if(S.env.temp>86&&Math.random()<0.4) ev.push(stressEvent(p,'heat'));
    if(S.env.light>100&&Math.random()<0.25) ev.push(stressEvent(p,'light'));
    if(Math.random()<0.03) ev.push(goodEvent(p,pick(['growth','terps','resin'])));
    if(Math.random()<0.012) ev.push(mutationEvent(p));
    /* P2-4 positive moments: vigorous seedling + rare phenotype expression (hook-only, reward-free) */
    if(p.stage===-1&&Math.random()<0.05) ev.push(vigorousSeedlingEvent(p));
    if(Math.random()<0.5&&stageOf(p)>=2&&p.pheno&&(p.pheno.rarity==='elite'||p.pheno.rarity==='legendary')&&!p.eliteSighted) ev.push(eliteSightingEvent(p));
    if(Math.random()<0.02&&stageOf(p)>=2) ev.push(hermEvent(p));
  });
  if(Math.random()<0.04) ev.push(equipFailEvent());
  return ev.filter(Boolean);
}
function evModal(p,title,text,choices){
  return { p:p, title:title, text:text, choices:choices };
}
function miteEvent(p){ const st=getStrain(p.strainId);
  return evModal(p,icon('bug','ge-ic-md')+' Spider Mites!','Spider mites on your '+st.name+'.',
   [['Buy predatory mites ($40)',()=>{ if(S.cash>=40){S.cash-=40; toast(icon('bug','ge-ic-md')+' Mites deployed. Problem solved.');} else {p.health-=10; toast(icon('x','ge-ic-md')+' Could not afford it!');} }],
    ['Neem oil spray ($15, +stress)',()=>{ if(S.cash>=15){S.cash-=15; p.stress=clamp(p.stress+8,0,100); p.problems=p.problems.filter(x=>x!=='Spider mites'); toast(icon('spray','ge-ic-md')+' Sprayed.');} else {p.health-=10; toast(icon('x','ge-ic-md')+' Could not afford it!');} }],
    ['Ignore it',()=>{ p.health=clamp(p.health-16,0,100); p.problems.push('Spider mites'); toast(icon('bug','ge-ic-md')+' Mites spread! Health -16.'); }]]);
}
function gnatEvent(p){ const st=getStrain(p.strainId);
  return evModal(p,icon('bug','ge-ic-md')+' Fungus Gnats','Fungus gnats buzzing around your '+st.name+'.',
   [['Let soil dry out (water -15)',()=>{ p.water=clamp(p.water-15,0,100); p.problems=p.problems.filter(x=>x!=='Fungus gnats'); toast(icon('water','ge-ic-md')+' Soil dried. Gnats gone.'); }],
    ['Sticky traps ($10)',()=>{ if(S.cash>=10){S.cash-=10; p.problems=p.problems.filter(x=>x!=='Fungus gnats'); toast(icon('trap','ge-ic-md')+' Traps set.');} else {p.health-=8; toast(icon('x','ge-ic-md')+' Could not afford it!');} }],
    ['Ignore it',()=>{ p.health=clamp(p.health-10,0,100); p.problems.push('Fungus gnats'); toast(icon('bug','ge-ic-md')+' Larvae munch roots! Health -10.'); }]]);
}
function mildewEvent(p){ const st=getStrain(p.strainId);
  return evModal(p,icon('warn','ge-ic-md')+' Powdery Mildew','White powder on leaves of '+st.name+'. Lower humidity!',
   [['Defoliate (+stress)',()=>{ p.stress=clamp(p.stress+10,0,100); p.problems=p.problems.filter(x=>x!=='Powdery mildew'); toast(icon('train','ge-ic-md')+' Infected leaves removed.'); }],
    ['Fungicide ($25)',()=>{ if(S.cash>=25){S.cash-=25; p.problems=p.problems.filter(x=>x!=='Powdery mildew'); toast(icon('spray','ge-ic-md')+' Treated.');} else {p.health-=12; toast(icon('x','ge-ic-md')+' Could not afford it!');} }],
    ['Ignore it',()=>{ p.health=clamp(p.health-14,0,100); p.problems.push('Powdery mildew'); toast(icon('warn','ge-ic-md')+' Mildew spreads! Health -14.'); }]]);
}
function defEvent(p,kind){ const st=getStrain(p.strainId);
  if(kind==='deficiency') return evModal(p,icon('feed','ge-ic-md')+' Nutrient Deficiency','Your '+st.name+' is hungry — leaves yellowing.',
   [['Feed now',()=>{ p.nutrition=clamp(p.nutrition+30,0,100); toast(icon('flask','ge-ic-md')+' Fed. Crisis averted.'); }],
    ['Ignore it',()=>{ p.health=clamp(p.health-10,0,100); p.problems.push('Deficiency'); toast(icon('warn','ge-ic-md')+' Health -10.'); }]]);
  return evModal(p,icon('flask','ge-ic-md')+' Nutrient Burn','Leaf tips burning on '+st.name+' — too much feed!',
   [['Flush with water',()=>{ p.nutrition=clamp(p.nutrition-35,0,100); p.water=clamp(p.water+20,0,100); toast(icon('water','ge-ic-md')+' Flushed.'); }],
    ['Ignore it',()=>{ p.health=clamp(p.health-12,0,100); p.problems.push('Nutrient burn'); toast(icon('warn','ge-ic-md')+' Health -12.'); }]]);
}
function stressEvent(p,kind){ const st=getStrain(p.strainId);
  const t=kind==='heat'?icon('temp','ge-ic-md')+' Heat Stress':icon('lighting','ge-ic-md')+' Light Stress';
  return evModal(p,t,'Your '+st.name+' is stressed. Adjust the environment!',
   [['I\'ll fix the environment',()=>{ toast(icon('settings','ge-ic-md')+' Adjust sliders in the Grow Room.'); }],
    ['Ride it out (-8 health)',()=>{ p.health=clamp(p.health-8,0,100); p.stress=clamp(p.stress+8,0,100); }]]);
}
function goodEvent(p,kind){ const st=getStrain(p.strainId);
  if(kind==='growth'){ p.growthBoost+=2; return evModal(p,icon('grow','ge-ic-md')+' Exceptional Growth','Your '+st.name+' is exploding with vigor! +2 days growth.',[['Nice!',()=>{}]]); }
  if(kind==='terps'){ p.terpBoost=(p.terpBoost||0)+5; return evModal(p,icon('terp','ge-ic-md')+' Terpene Surge','Terps going wild on '+st.name+'! +quality.',[['Nice!',()=>{}]]); }
  p.resinBoost=(p.resinBoost||0)+5; return evModal(p,icon('drop','ge-ic-md')+' Resin Surge','Frost pouring on '+st.name+'! +quality.',[['Nice!',()=>{}]]);
}
function mutationEvent(p){ const st=getStrain(p.strainId);
  return evModal(p,icon('dna','ge-ic-md')+' Mutation!','A rare mutation on '+st.name+'.',
   [['Stabilize it (+vigor, +resin)',()=>{ p.growthBoost+=1; p.resinBoost=(p.resinBoost||0)+8; addP0('genetics',2); toast(icon('dna','ge-ic-md')+' Mutation stabilized!'); }],
    ['Cull the branch',()=>{ p.health=clamp(p.health-5,0,100); toast(icon('train','ge-ic-md')+' Culled.'); }]]);
}
function hermEvent(p){ const st=getStrain(p.strainId);
  return evModal(p,icon('alert-triangle','ge-ic-md')+' Herm Warning','Bananas spotted on '+st.name+' — it may pollinate the room!',
   [['Isolate & monitor (+stress)',()=>{ p.stress=clamp(p.stress+15,0,100); toast(icon('shield','ge-ic-md')+' Isolated. Crisis managed.'); }],
    ['Cull the plant',()=>{ S.plants=S.plants.filter(x=>x.id!==p.id); toast(icon('trash','ge-ic-md')+' Plant culled to save the room.'); refreshGrowUI(); }]]);
}
function equipFailEvent(){
  return evModal(null,icon('equipment','ge-ic-md')+' Equipment Failure','Your HVAC sputters — environment control degraded for 2 days!',
   [['Repair ($75)',()=>{ if(S.cash>=75){S.cash-=75; toast(icon('equipment','ge-ic-md')+' Repaired.');} else { S.envPenalty=2; toast(icon('x','ge-ic-md')+' Running degraded 2 days!'); } }],
    ['Run degraded',()=>{ S.envPenalty=2; toast(icon('warn','ge-ic-md')+' Environment -15 score for 2 days.'); }]]);
}
function showEventQueue(queue){
  if(!queue.length){ return; }
  const e=queue.shift();
  const m=modal('<h3>'+e.title+'</h3><p>'+e.text+'</p><div id="ev-choices"></div>');
  const box=m.querySelector('#ev-choices');
  e.choices.forEach(c=>{
    const b=document.createElement('button'); b.className='btn btn-small'; b.textContent=c[0];
    b.onclick=()=>{ closeModal(m); try{c[1]();}catch(err){} save(); updateHUD(); refreshGrowUI(); showEventQueue(queue); };
    box.appendChild(b);
  });
}

/* ---------------- Expansion day tick: world events, market, contracts, challenges,
   employees, genetics upkeep — all guarded so base game never breaks ---------------- */
function expansionTick(){
  try{ if(typeof WX_tick==='function') WX_tick(); }catch(e){}
  try{ if(typeof TY_tick==='function') TY_tick(); }catch(e){}
  try{ if(typeof EX_tick==='function') EX_tick(); }catch(e){}
  try{ if(typeof GX_tick==='function') GX_tick(); }catch(e){}
  /* P2-4: genetic unlock clue scan (online only — expansionTick never runs offline) */
  try{ if(typeof P24_unlockClueScan==='function') P24_unlockClueScan(); }catch(e){}
}

/* ---------------- Day advance ---------------- */
function advanceDay(){
  const D=DIFFS[S.difficulty], q=S.equipment, ev=envEval();
  const stageBefore={}; S.plants.forEach(p=>{ stageBefore[p.id]=stageOf(p); });
  const missionsBefore=S.missionsDone.length;
  const envScore=Math.max(0,ev.score-(S.envPenalty>0?15:0)-((typeof WX_envPenalty==='function')?WX_envPenalty():0)-((typeof TY_envMod==='function')?TY_envMod():0));
  if(S.envPenalty>0) S.envPenalty--;
  /* automation runs before the plant drain loop */
  try{ if(typeof AM_dayTick==='function') AM_dayTick(); }catch(e){}
  /* harder-missions streaks/timers */
  try{ if(typeof MN_dayTick==='function') MN_dayTick(); }catch(e){}
  /* dispensary customer traffic */
  try{ if(typeof CT_dayTick==='function') CT_dayTick(); }catch(e){}
  S.plants.forEach(p=>{
    const st=getStrain(p.strainId);
    if(p.pheno) revealForStage(p); /* progressive phenotype revelation */
    /* P1.1 germination pre-stage: moisture-sensitive, 2 game-days, skips normal growth/health */
    if(p.stage===-1){
      const w0=num(p.water,70); /* moisture at day start (pre-drain) drives germination */
      const irrM=(1-0.12*(q.irrigation-1))*(S.crew.irrigation?0.7:1);
      p.water=clamp(p.water-(7+(S.env.temp-70)*0.15)*irrM,0,100);
      p.nutrition=clamp(p.nutrition-4.5*(1-0.12*(q.nutrients-1)),0,100);
      if(w0>95){ /* too wet: the seed rots */
        p.dead=true; p.problems.push('Seed rotted \u2014 too wet');
        toast(icon('warn','ge-ic-md')+' A seed rotted in the tray \u2014 too much water.');
      }else if(w0<18){ /* too dry: germination stalls \u2014 no progress, but does not kill */
        p.problems.push('Germination stalled \u2014 too dry');
      }else{
        p.germ=num(p.germ,0)+1;
        if(p.germ>=2){
          p.stage=0; p.day=0; p.germ=0; p.problems.push('Sprouted!');
          S.stats.sprouted=num(S.stats.sprouted,0)+1;
          toast(icon('grow','ge-ic-md')+' A seed sprouted \u2014 seedling stage.');
        }
      }
      p.problems=p.problems.slice(-4);
      return; /* germinating seeds skip the growth & health loops below */
    }
    const irrMult=(1-0.12*(q.irrigation-1))*(S.crew.irrigation?0.7:1);
    const nutMult=(1-0.12*(q.nutrients-1));
    p.water=clamp(p.water-(7+(S.env.temp-70)*0.15)*irrMult,0,100);
    p.nutrition=clamp(p.nutrition-4.5*nutMult,0,100);
    // growth
    if(p.health>25){
      const rate=(0.75+0.5*envScore/100)*(1+0.04*(q.co2sys-1))*(S.crew.assistant?1.05:1)*(0.7+0.6*st.vigor/100);
      p.day+=rate+(p.growthBoost||0); p.growthBoost=0;
    }
    // health
    let dmg=0;
    if(p.water<18){ dmg+=7; p.problems.push('Underwatered'); }
    if(p.water>95){ dmg+=5; p.problems.push('Overwatered'); }
    if(p.nutrition<15){ dmg+=6; p.problems.push('Hungry'); }
    if(p.nutrition>92){ dmg+=6; p.problems.push('Overfed'); }
    /* P1.2: per-seed env tolerance — ±25% max on the env-damage portion only (50 = unchanged baseline) */
    const envTolMod=clamp(1+(50-num(p.pheno&&p.pheno.envTolerance,50))*0.005,0.75,1.25);
    dmg+=(100-envScore)*0.09*envTolMod;
    dmg*=D.healthLoss*(S.crew.health?0.75:1);
    if(dmg<1&&envScore>80) p.health=clamp(p.health+(S.crew.health?3:2),0,100);
    else p.health=clamp(p.health-dmg,0,100);
    p.stress=clamp(p.stress-5+(dmg>2?4:0),0,100);
    p.minHealth=Math.min(p.minHealth,p.health);
    p.problems=p.problems.slice(-4);
    if(p.health<=0){ p.dead=true; }
  });
  const dead=S.plants.filter(p=>p.dead);
  if(dead.length){ toast(icon('warn','ge-ic-md')+' '+dead.length+' plant(s) died!'); }
  S.plants=S.plants.filter(p=>!p.dead);
  // crew wages
  let wages=0; Object.keys(S.crew).forEach(k=>{ if(S.crew[k]) wages+=CREW_DEFS.find(c=>c.id===k).wage; });
  if(wages>0){
    if(S.cash>=wages){ S.cash-=wages; }
    else{
      const hired=Object.keys(S.crew).filter(k=>S.crew[k]).sort((a,b)=>CREW_DEFS.find(c=>c.id===b).wage-CREW_DEFS.find(c=>c.id===a).wage);
      while(hired.length&&S.cash<wages){ const f=hired.shift(); S.crew[f]=false; wages-=CREW_DEFS.find(c=>c.id===f).wage; toast(icon('cash','ge-ic-md')+' '+CREW_DEFS.find(c=>c.id===f).name+' quit \u2014 could not pay wages!'); }
      S.cash=Math.max(0,S.cash-wages);
    }
  }
  S.day++; S.stats.daysAdvanced++;
  /* QA: Perfect Environment streak advances here (per DAY), not on app boot */
  try{ const sc=(typeof envEval==='function')?envEval().score:0; S.nx.envStreak=(sc>=90)?int(S.nx.envStreak,0)+1:0; }catch(e){}
  /* P1.5 Dial It In: consecutive days with temp/RH inside the ideal bands (70-82F / 40-60%) */
  try{
    const tIn=num(S.env.temp,76)>=70&&num(S.env.temp,76)<=82, hIn=num(S.env.humidity,52)>=40&&num(S.env.humidity,52)<=60;
    S.stats.envInRangeDays=(tIn&&hIn)?int(S.stats.envInRangeDays,0)+1:0;
  }catch(e){}
  /* P2.3: mission-chain day hooks (env bands, comeback detection) */
  try{ if(typeof CHA_dayTick==='function') CHA_dayTick(); }catch(e){}
  gainXP(5);
  save(); updateHUD();
  checkMissions(); checkAchievements();
  try{ if(typeof P0T_sweep==='function') P0T_sweep(); }catch(e){} /* P3-W3: LEGACY day-requirement ticks with time */
  try{ if(typeof MS_sweep==='function') MS_sweep(); }catch(e){} /* P3-W6: milestone backstop (money milestones, save edits) */
  expansionTick();
  const queue=rollEvents();
  refreshGrowUI();
  let grew=0; S.plants.forEach(p=>{ if((stageBefore[p.id]||0)<stageOf(p)) grew++; });
  const newM=S.missionsDone.length-missionsBefore;
  const dlines=[grew+' plant'+(grew===1?'':'s')+' advanced a growth stage',
    queue.length?queue.length+' event'+(queue.length===1?'':'s')+' need'+(queue.length===1?'s':'')+' your attention':'No emergencies in the facility'];
  if(newM>0) dlines.push(newM+' mission'+(newM===1?'':'s')+' completed!');
  dayTransition(S.day,dlines);
  setTimeout(()=>showEventQueue(queue),1500);
  setTimeout(()=>{ try{ if(typeof WX_showPendingEvent==='function') WX_showPendingEvent(); }catch(e){} },1800);
}


/* ---------------- PLAY: Grow Room ---------------- */
/* ---------------- PLAY: Grow Room (interactive) ---------------- */
function envSlider(key,label,val,min,max,unit){
  return '<div class="env-ctl ge-env-ctl"><div class="ge-datarow"><span>'+label+'</span><b class="env-val ge-num">'+val+unit+'</b></div>'+
   '<input type="range" min="'+min+'" max="'+max+'" value="'+val+'" data-env="'+key+'" data-unit="'+unit+'" aria-label="'+label+'"></div>';
}

function growPlantHtml(p){
  const st=getStrain(p.strainId), vs=visStageOf(p), s=stageOf(p);
  const tone=GR_condTone(p);
  const probs=(p.problems||[]).slice(-2);
  const wTone=p.water<18||p.water>92?'bad':p.water<35?'warn':'ok';
  const nTone=p.nutrition<15||p.nutrition>92?'bad':p.nutrition<30?'warn':'ok';
  return '<div class="ge-card ge-plant-card ge-card-tap'+(tone==='bad'?' ge-card-hot':'')+'" data-pid="'+p.id+'" role="button" tabindex="0" aria-label="'+esc(phenoName(p)).replace('\U0001F9EC',' (clone)')+'">'+
   '<div class="ge-plant-art">'+plantIcon(p)+'<span class="ge-slot-ring">'+GR_ring(p.health,tone)+'</span></div>'+
   '<div class="ge-plant-meta">'+
    '<div class="ge-plant-name ge-truncate">'+GR_plantName(p)+'</div>'+
    '<div class="ge-plant-sub"><span class="ge-pill '+(s>=5?'ge-pill-optimal':tone==='ok'?'ge-pill-neutral':tone==='warn'?'ge-pill-watch':'ge-pill-critical')+'">'+VIS_STAGES[vs]+'</span>'+
    '<span class="ge-muted ge-num ge-caption">D'+Math.floor(p.day)+' / ~'+st.ft+'d</span></div>'+
    GR_bar('HEALTH',p.health,tone)+
    GR_bar('WATER',p.water,wTone)+
    GR_bar('NUTRITION',p.nutrition,nTone)+
    (probs.length?'<div class="ge-issue-row">'+probs.map(pr=>'<span class="ge-pill ge-pill-warning">'+icon('warn','ge-ic-sm')+' '+esc(pr)+'</span>').join('')+'</div>':'')+
   '</div></div>';
}

RENDER.grow=function(){
  const r=$('grow-root'), ev=envEval(), slots=FACILITIES[S.facility].slots, tier=facTierIdx();
  const iss=ev.issues.map(i=>i.text).join(' | ');
  const tele=[
    {i:'light',l:'LIGHT',v:S.env.light+'%',sub:'target 70\u2013100%',bad:/Light/.test(iss)},
    {i:'temp',l:'TEMP',v:S.env.temp+'\u00B0F',sub:'target 70\u201382\u00B0F',bad:/cold|hot/i.test(iss)},
    {i:'humid',l:'RH',v:S.env.humidity+'%',sub:'target 40\u201360%',bad:/Humidity/.test(iss)},
    {i:'co2',l:'CO2',v:S.env.co2,sub:'target 800\u20131500',bad:/CO2/.test(iss)}
  ];
  let html=screenHead('grow','GROW ROOM')+
   '<div class="ge-card ge-card-hot ge-facility">'+
    GR_facilityScene(tier)+
    '<div class="ge-facility-meta">'+
     '<span class="ge-label">'+icon('grow','ge-ic-md')+' '+esc(FAC_TIERS[tier].name)+'</span>'+
     '<span class="ge-facility-slots ge-num ge-muted">'+S.plants.length+'/'+slots+' SLOTS</span>'+
     '<span class="ge-facility-env">'+GR_ring(ev.score,ev.score>=80?'ok':ev.score>=55?'warn':'bad')+'<span class="ge-label ge-muted">ENV</span></span>'+
    '</div></div>'+
   '<div class="ge-tiles ge-tiles-4">'+tele.map(t=>GR_tile(t.i,t.l,t.v,t.sub,t.bad?'ge-red':'ge-green')).join('')+'</div>'+
   (ev.issues.length?'<div class="ge-issue-row">'+ev.issues.map(GR_issuePill).join('')+'</div>'
     :'<p class="ge-caption ge-green">'+icon('check','ge-ic-md')+' Environment dialed in.</p>')+
   (typeof TY_envPanel==='function'?TY_envPanel():'');
  if(S.day<=7&&!S.tips.mentorDone){
    const tip=MENTOR_TIPS[Math.min(S.day-1,MENTOR_TIPS.length-1)];
    html+='<div class="ge-card ge-mentor">'+npcPortrait('vic','npc-sm')+
     '<div class="npc-text"><b>Vic Malone</b><span class="npc-role">CULTIVATION MENTOR</span><p>&ldquo;'+esc(tip)+'&rdquo;</p>'+
     '<button class="ge-btn ge-btn-sm" id="mentor-ok">GOT IT</button></div></div>';
  }
  html+='<div class="ge-section-title">'+icon('grows','ge-ic-md')+'CULTIVATION FLOOR<span class="ge-spread ge-muted ge-num">'+S.plants.length+'/'+slots+'</span></div>';
  html+='<div class="ge-growfloor" id="growfloor">';
  S.plants.forEach(p=>{ html+=growPlantHtml(p); });
  const empt=Math.min(6,slots-S.plants.length);
  for(let i=0;i<empt;i++) html+='<div class="ge-empty-slot" data-empty="1" role="button" tabindex="0" aria-label="Plant a seed">'+GR_emptyPlanter()+'<span class="ge-label">PLANT</span></div>';
  html+='</div>';
  if(slots-S.plants.length>6) html+='<p class="ge-caption ge-muted" style="text-align:center">+'+(slots-S.plants.length-6)+' more open slots</p>';
  try{ html+=(typeof WX_envControlHTML==='function'?WX_envControlHTML():''); }catch(e){}
  html+='<button class="ge-btn ge-btn-primary ge-btn-block ge-daybtn" id="btn-day">'+icon('day','ge-ic-md')+' ADVANCE DAY <span class="ge-num">'+S.day+' \u2192 '+(S.day+1)+'</span></button>';
  r.innerHTML=html;
  try{ if(typeof WX_wireEnvControls==='function') WX_wireEnvControls(r); }catch(e){}
  $('btn-day').onclick=advanceDay;
  const mo=$('mentor-ok'); if(mo) mo.onclick=()=>{ S.tips.mentorDone=1; save(); RENDER.grow(); };
  r.querySelectorAll('[data-empty]').forEach(s=>s.onclick=()=>plantSeedModal());
  r.querySelectorAll('[data-pid]').forEach(s=>s.onclick=()=>plantFocus(+s.dataset.pid));
};

/* ---- plant focus view: tap a plant, sheet slides in ---- */
let focusPid=null;
function closeFocus(){
  focusPid=null;
  const sh=$('plant-focus'); if(sh) sh.remove();
  const bd=$('focus-back'); if(bd) bd.remove();
}
function plantFocus(pid){
  const p=S.plants.find(x=>x.id===pid); if(!p){ closeFocus(); return; }
  closeFocus(); focusPid=pid;
  const st=getStrain(p.strainId), s=stageOf(p), vs=visStageOf(p);
  const ready=s>=5;
  const evS=envEval().score;
  const qp=Math.round(clamp(st.pot*0.5+p.health*0.3+evS*0.2-p.stress*0.15,5,100));
  const tone=GR_condTone(p);
  const ph=p.pheno||{}, known=(ph.known||{});
  const canClone=!!(ph.isClone&&ph.motherId&&(S.mothers||[]).some(m=>m.id===ph.motherId));
  const starRows=[
    ['VIGOR',ph.vigor,known.vigor],['STRUCTURE',ph.structure,known.structure],
    ['YIELD',ph.yieldPot,known.yieldPot],['POTENCY',ph.potencyPot,known.potencyPot],
    ['RESIN',ph.resinPot,known.resinPot],['TERPENES',ph.terpenePot,known.terpenePot]
  ];
  const tTone=v=>v>=70?'ge-green':v>=45?'ge-amber':'ge-red';
  const bd=document.createElement('div'); bd.id='focus-back'; bd.className='focus-back';
  bd.onclick=closeFocus;
  const sh=document.createElement('div'); sh.id='plant-focus'; sh.className='focus-sheet ge-focus';
  sh.innerHTML='<div class="focus-handle"></div>'+
   '<div class="ge-focus-grid">'+
   '<div class="ge-focus-art"><div class="focus-stage"><div class="focus-plant" id="focus-plant">'+plantIcon(p)+'</div><div class="focus-fx" id="focus-fx"></div></div>'+
    '<div class="ge-focus-title ge-truncate">'+GR_plantName(p)+'</div>'+
    '<div class="ge-plant-sub"><span class="ge-pill '+(ready?'ge-pill-optimal':'ge-pill-neutral')+'">'+stageName(s)+'</span>'+
    (p.pheno?rarityBadge(p.pheno):'')+
    (ph.isClone?'<span class="ge-badge ge-badge-mother">'+icon('clone','ge-ic-sm')+'CLONE</span>':'')+'</div>'+
    '<div class="ge-caption ge-muted ge-num">'+VIS_STAGES[vs]+' \u2022 DAY '+Math.floor(p.day)+' / ~'+st.ft+'</div></div>'+
   '<div class="ge-focus-data">'+
    '<div class="ge-tiles">'+
     GR_tile('leaf','HEALTH',Math.round(p.health)+'%',null,tTone(p.health))+
     GR_tile('xp','VIGOR',qp+'%',null,tTone(qp))+
     GR_tile('water','WATER',Math.round(p.water)+'%',null,p.water<18||p.water>92?'ge-red':p.water<35?'ge-amber':'ge-green')+
     GR_tile('feed','NUTRITION',Math.round(p.nutrition)+'%',null,p.nutrition<15||p.nutrition>92?'ge-red':p.nutrition<30?'ge-amber':'ge-green')+
     GR_tile('warn','STRESS',Math.round(p.stress)+'%',null,p.stress>=60?'ge-red':p.stress>=30?'ge-amber':'ge-green')+
     GR_tile('temp','ENVIRONMENT',evS,null,tTone(evS))+
    '</div>'+
    '<div class="ge-section-title">'+icon('dna','ge-ic-md')+'GENETIC POTENTIAL</div>'+
    '<div class="ge-stars-list">'+starRows.map(r=>GR_starMeter(r[0],r[1],r[2])).join('')+'</div>'+
    (p.problems.length?'<div class="ge-issue-row">'+p.problems.map(pr=>'<span class="ge-pill ge-pill-warning">'+icon('warn','ge-ic-sm')+' '+esc(pr)+'</span>').join('')+'</div>':'')+
    '<div class="ge-section-title">'+icon('train','ge-ic-md')+'ACTIONS</div>'+
    '<div class="ge-btn-grid">'+
     '<button class="ge-btn ge-btn-ghost" data-fa="water">'+icon('water','ge-ic-md')+'WATER</button>'+
     '<button class="ge-btn ge-btn-ghost" data-fa="feed">'+icon('feed','ge-ic-md')+'FEED</button>'+
     '<button class="ge-btn ge-btn-ghost" data-fa="train">'+icon('train','ge-ic-md')+'TRAIN</button>'+
     '<button class="ge-btn ge-btn-ghost" data-fa="inspect">'+icon('inspect','ge-ic-md')+'INSPECT</button>'+
     (canClone?'<button class="ge-btn ge-btn-ghost" data-fa="clone">'+icon('clone','ge-ic-md')+'CLONE</button>':'')+
     '<button class="ge-btn ge-btn-primary" data-fa="harvest" '+(ready?'':'disabled')+'>'+icon('harvest','ge-ic-md')+'HARVEST</button>'+
     '<button class="ge-btn ge-btn-ghost" data-fa="close">'+icon('x','ge-ic-md')+'CLOSE</button>'+
     '<button class="ge-btn ge-btn-ghost ge-btn-danger" data-fa="remove">'+icon('trash','ge-ic-md')+'REMOVE</button>'+
    '</div></div></div>';
  document.body.appendChild(bd); document.body.appendChild(sh);
  try{ requestAnimationFrame(()=>{ sh.classList.add('open'); }); }catch(e){ sh.classList.add('open'); }
  sh.querySelectorAll('[data-fa]').forEach(b=>b.onclick=()=>focusAction(pid,b.dataset.fa));
}

function focusAction(pid,a){
  if(a==='close'){ closeFocus(); return; }
  if(a==='inspect'){ closeFocus(); inspectPheno(pid); return; }
  if(a==='harvest'){ closeFocus(); doAction(pid,'harvest'); return; }
  /* QA GE-101: manual plant removal — dead/dying plants previously had no UI path */
  if(a==='remove'){
    const pl=S.plants.find(x=>x.id===pid);
    confirmModal('REMOVE PLANT?','This permanently removes '+(pl?esc(GR_plantName(pl)):'this plant')+'. No harvest, no refund.',function(){
      S.plants=S.plants.filter(x=>x.id!==pid);
      closeFocus(); save(); updateHUD(); if(current==='grow') RENDER.grow(); if(current==='grows') RENDER.grows();
      toast(icon('trash','ge-ic-md')+' Plant removed.');
    });
    return;
  }
  if(a==='clone'){ const pl=S.plants.find(x=>x.id===pid); closeFocus(); if(pl&&pl.pheno&&pl.pheno.motherId) takeClone(pl.pheno.motherId); return; }
  const fx=$('focus-fx'), pl=$('focus-plant');
  if(fx){
    if(a==='water') fx.innerHTML='<div class="fx-drops"><i></i><i></i><i></i><i></i><i></i><i></i></div>';
    else if(a==='feed') fx.innerHTML='<div class="fx-feedpulse"></div>';
    else if(a==='train'){ fx.innerHTML='<div class="fx-trainline"></div>'; if(pl) pl.classList.add('fx-trained'); }
  }
  setTimeout(()=>{
    doAction(pid,a);
    const p=S.plants.find(x=>x.id===pid);
    if(p&&current==='grow') plantFocus(pid); else closeFocus();
  }, a==='train'?700:650);
}

/* ---------------- MY GROWS ---------------- */
RENDER.grows=function(){
  const r=$('grows-root');
  let html=screenHead('grows','MY GROWS')+
   '<div class="ge-btn-row"><button class="ge-btn ge-btn-gold" id="btn-vault">'+icon('keepers','ge-ic-md')+' KEEPER VAULT <span class="ge-num">'+S.keepers.length+'/'+S.keeperCapacity+'</span></button>'+
   '<button class="ge-btn ge-btn-primary" id="btn-plant">'+icon('plus','ge-ic-md')+' PLANT NEW SEED</button></div>';
  S.phenoHunts.filter(h=>h.active).forEach(h=>{
    html+='<div class="ge-card ge-card-compact"><div class="ge-card-head"><h3>'+icon('hunt','ge-ic-md')+'PHENO HUNT: '+esc(h.strainName)+'</h3></div>'+
     '<div class="ge-datarow"><span>Planted</span><b class="ge-num">'+h.planted+' / '+h.total+'</b></div>'+
     '<div class="ge-datarow"><span>Harvested</span><b class="ge-num">'+h.harvested+'</b></div>'+
     '<div class="ge-datarow"><span>Keepers found</span><b class="ge-num">'+h.keepersFound+'</b></div>'+
     '<div class="ge-datarow"><span>Best score</span><b class="ge-num">'+(h.bestScore>0?h.bestScore+' (#'+h.bestPheno+')':'\u2014')+'</b></div>'+
     '<div class="ge-progress"><i style="width:'+clamp(h.harvested/Math.max(1,h.total)*100,0,100)+'%"></i></div></div>';
  });
  if(!S.plants.length) html+='<div class="ge-empty">'+icon('grow','ge-ic-xl')+'<h3>NO PLANTS GROWING</h3><p class="ge-muted">Plant your first seed to start the empire.</p></div>';
  S.plants.forEach(p=>{
    const st=getStrain(p.strainId), s=stageOf(p);
    const phn=p.pheno&&p.pheno.num?p.pheno.num:'0';
    const tone=GR_condTone(p);
    html+='<div class="ge-card ge-plant-card'+(tone==='bad'?' ge-card-hot':'')+'">'+
     '<div class="ge-plant-art">'+flowerSVG(p.strainId+'#'+phn,'p-flower')+'<span class="ge-slot-ring">'+GR_ring(p.health,tone)+'</span></div>'+
     '<div class="ge-plant-meta">'+
      '<div class="ge-plant-name ge-truncate">'+GR_plantName(p)+'</div>'+
      '<div class="ge-plant-sub"><span class="ge-pill '+(s>=5?'ge-pill-optimal':'ge-pill-neutral')+'">'+stageName(s)+'</span>'+
      (p.pheno?rarityBadge(p.pheno):'')+
      (p.pheno&&p.pheno.isClone?'<span class="ge-badge ge-badge-mother">'+icon('clone','ge-ic-sm')+'CLONE</span>':'')+'</div>'+
      '<div class="ge-datarow"><span>'+icon('day','ge-ic-sm')+' DAY</span><b class="ge-num">'+Math.floor(p.day)+' / ~'+st.ft+'</b></div>'+
      GR_bar('HEALTH',p.health,tone)+
      GR_bar('WATER',p.water,p.water<18||p.water>92?'bad':p.water<35?'warn':'ok')+
      GR_bar('NUTRITION',p.nutrition,p.nutrition<15||p.nutrition>92?'bad':p.nutrition<30?'warn':'ok')+
      GR_bar('STRESS',p.stress,p.stress>=60?'bad':p.stress>=30?'warn':'ok')+
      (p.problems.length?'<div class="ge-issue-row"><span class="ge-pill ge-pill-warning">'+icon('warn','ge-ic-sm')+' '+p.problems.map(esc).join(', ')+'</span></div>':'')+
      '<div class="ge-btn-grid">'+
       '<button class="ge-btn ge-btn-ghost" data-p="'+p.id+'" data-a="water">'+icon('water','ge-ic-md')+'WATER</button>'+
       '<button class="ge-btn ge-btn-ghost" data-p="'+p.id+'" data-a="feed">'+icon('feed','ge-ic-md')+'FEED</button>'+
       '<button class="ge-btn ge-btn-ghost" data-p="'+p.id+'" data-a="train">'+icon('train','ge-ic-md')+'TRAIN</button>'+
       '<button class="ge-btn ge-btn-ghost" data-p="'+p.id+'" data-a="inspect">'+icon('inspect','ge-ic-md')+'INSPECT</button>'+
       '<button class="ge-btn ge-btn-primary" data-p="'+p.id+'" data-a="harvest" '+(s>=5?'':'disabled')+'>'+icon('harvest','ge-ic-md')+'HARVEST</button>'+
      '</div></div></div>';
  });
  r.innerHTML=html;
  $('btn-vault').onclick=()=>show('keepers');
  $('btn-plant').onclick=plantSeedModal;
  r.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>doAction(+b.dataset.p,b.dataset.a));
};


/* ---------------- Dispensary ---------------- */
let dispTab='flower';
function pricePerOz(it){
  const D=DIFFS[S.difficulty];
  const base=it.quality*2.4+it.potency*0.9;
  const repMult=1+S.reputation/2000;
  const typeMult=it.type==='concentrate'?6:it.type==='edible'?0.20:1; /* GE-329: per-UNIT edible price must be a fraction of per-oz flower price (was 2.5 x 10u/oz = ~25x printer) */
  return Math.max(5,base*repMult*typeMult*D.econMult);
}
RENDER.dispensary=function(){
  const r=$('dispensary-root');
  try{ if(typeof CT_migrate==='function') CT_migrate(); }catch(e){}
  const tabIco={flower:'leaf',concentrate:'drop',edible:'jar'};
  const cst=(S.ct&&S.ct.stats)||{completed:0,abandoned:0,revenue:0,transactions:0,lostSales:0,itemsSold:0};
  const avg=cst.completed?Math.round(cst.revenue/cst.completed):0;
  const sat=DP_avgSat();
  let html=screenHead('storefront','DISPENSARY');
  /* retail command dashboard */
  html+='<div class="ge-dp-metrics">'+
   DP_metricTile('cash',fmt$(DP_todaySales()),"TODAY'S SALES",'all registers')+
   DP_metricTile('customers',int(S.ct?S.ct.servedToday:0,0),'CUSTOMERS','served at counter')+
   DP_metricTile('cart',fmt$(avg),'AVERAGE ORDER',cst.completed+' completed carts')+
   DP_metricTile('star',sat+'%','RATING','customer satisfaction')+
   DP_metricTile('box',fmt$(DP_invValue()),'INVENTORY VALUE','shelf stock')+
  '</div>';
  html+='<div class="ge-tabs" role="tablist">'+
   ['flower','concentrate','edible'].map(t=>'<button class="ge-tab'+(dispTab===t?' is-active':'')+'" data-tab="'+t+'">'+icon(tabIco[t],'ge-ic-md')+t.toUpperCase()+'S</button>').join('')+'</div>';
  try{ if(typeof WX_marketPanel==='function') html+=WX_marketPanel(); }catch(e){}
  try{ if(typeof WX_contractsHTML==='function') html+=WX_contractsHTML(); }catch(e){}
  try{ if(typeof TY_custPanel==='function') html+=TY_custPanel(); }catch(e){}
  try{ if(typeof TY_prodBanner==='function') html+=TY_prodBanner(); }catch(e){}
  try{ if(typeof CT_dispensaryHTML==='function') html+=CT_dispensaryHTML(); }catch(e){}
  /* shelf stock — premium product cards */
  const items=S.inventory.filter(i=>i.type===(dispTab==='flower'?'flower':dispTab));
  html+=DP_sectionTitle(tabIco[dispTab],'SHELF STOCK','<span class="ge-num">'+items.length+'</span> ITEMS');
  if(!items.length) html+='<div class="ge-empty">'+icon('box','ge-ic-xl')+'<h3>SHELVES EMPTY</h3><p>'+(dispTab==='flower'?'Harvest some plants!':'Process flower in the FLOWER tab.')+'</p></div>';
  items.forEach(it=>{
    const ppo=pricePerOz(it), total=ppo*it.amount;
    const unit=it.type==='edible'?'unit':'oz';
    html+='<div class="ge-card ge-card-hot ge-dp-product">'+
     '<div class="ge-plant-art">'+flowerSVG(it.strainId+'#'+it.id,'ge-dp-flower')+'</div>'+
     '<div class="ge-plant-meta">'+
      '<div class="ge-plant-name">'+esc(it.strainName)+' '+DP_gradeBadge(it.quality)+'</div>'+
      '<div class="ge-dp-tags">'+DP_terpTags(it)+'</div>'+
      '<div class="ge-dp-demrow">'+DP_demPill(TY_ptypeOf(it))+'<span class="ge-caption ge-muted">POTENCY '+Math.round(it.potency)+'%</span></div>'+
      '<div class="ge-datarow"><span>'+icon('jar','ge-ic-sm')+' Stock</span><b class="ge-num">'+it.amount+' '+unit+'s</b></div>'+
      '<div class="ge-datarow"><span>'+icon('cash','ge-ic-sm')+' Price</span><b class="ge-num">'+fmt$(ppo)+' / '+unit+'</b></div>'+
      '<div class="ge-datarow"><span>'+icon('sell','ge-ic-sm')+' Total value</span><b class="ge-num ge-green">'+fmt$(total)+'</b></div>'+
      '<div class="ge-btn-row"><button class="ge-btn ge-btn-primary" data-sell="'+it.id+'">'+icon('sell','ge-ic-md')+'SELL ALL</button>'+
      (dispTab==='flower'?'<button class="ge-btn ge-btn-ghost" data-proc="'+it.id+'">'+icon('flask','ge-ic-md')+'PROCESS</button>':'')+'</div>'+
     '</div></div>';
  });
  if(dispTab==='flower'&&items.length){
    html+='<div class="ge-card ge-card-flat"><div class="ge-card-head"><h3>'+icon('flask','ge-ic-md')+'PROCESSING</h3></div>'+
     '<p class="ge-body ge-muted">Turn flower into concentrates (6x price, 18% yield, $20/oz) or edibles (6 units/oz, $25/oz — needs PROCESSING LAB Lv 2). Use PROCESS on an item above.</p></div>';
  }
  r.innerHTML=html;
  r.querySelectorAll('[data-tab]').forEach(t=>t.onclick=()=>{ dispTab=t.dataset.tab; RENDER.dispensary(); });
  r.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>buyerModal(+b.dataset.sell));
  try{ if(typeof CT_wireDispensary==='function') CT_wireDispensary(r); }catch(e){}
  r.querySelectorAll('[data-proc]').forEach(b=>b.onclick=()=>{
    const it=S.inventory.find(x=>x.id===+b.dataset.proc); if(!it) return;
    const m=modal('<h3 class="ge-h2">'+icon('flask','ge-ic-lg')+'PROCESS '+esc(it.strainName)+'</h3>'+
     '<p class="ge-body ge-muted">'+it.amount+' oz available.</p>'+
     '<label class="ge-label" for="proc-amt">Amount (oz)</label><input class="ge-dp-input" type="number" inputmode="numeric" enterkeyhint="done" id="proc-amt" min="1" max="'+it.amount+'" value="1">'+
     '<div class="ge-btn-row"><button class="ge-btn ge-btn-gold" id="proc-conc">CONCENTRATE<br><span class="ge-caption ge-muted">→18%/oz $20</span></button>'+
     '<button class="ge-btn ge-btn-gold" id="proc-ed">EDIBLES<br><span class="ge-caption ge-muted">→6u/oz $25 • LAB LV2+</span></button></div>'+
     '<button class="ge-btn ge-btn-ghost ge-btn-block" id="proc-x">'+icon('x','ge-ic-md')+'CANCEL</button>');
    m.querySelector('#proc-x').onclick=()=>closeModal(m);
    let procDone=false; /* QA GE-313: per-modal idempotency — detached button replays must not re-fire */
    const doProc=kind=>{
      if(procDone) return;
      const amt=clamp(+m.querySelector('#proc-amt').value||0,1,Math.max(0,it.amount));
      if(!(amt>0)||!S.inventory.some(x=>x.id===it.id)){ toast(icon('x','ge-ic-md')+' Nothing left to process.'); return; }
      if(kind==='edible'){ /* GE-329: edibles are the advanced path - Processing Lab Lv 2+; portioned to input potency (no +8) */
        let labLv=1; try{ labLv=(typeof EX_buildingLevel==='function')?EX_buildingLevel('processing'):1; }catch(e){ labLv=1; }
        if(labLv<2){ toast(icon('x','ge-ic-md')+' Edibles need PROCESSING LAB Lv 2 — upgrade in EMPIRE.'); return; }
      }
      const cost=kind==='concentrate'?20*amt:25*amt;
      if(S.cash<cost){ toast(icon('x','ge-ic-md')+' Need '+fmt$(cost)+'.'); return; }
      procDone=true;
      S.cash-=cost; it.amount=Math.round((it.amount-amt)*10)/10;
      const outAmt=kind==='concentrate'?Math.round(amt*0.18*10)/10:Math.round(amt*6);
      INV_add({ strainId:it.strainId, strainName:it.strainName, phenoNum:it.phenoNum, amount:outAmt,
        quality:it.quality, potency:kind==='concentrate'?Math.min(100,it.potency+8):it.potency, terpenes:it.terpenes, /* GE-329: extraction tests stronger; edibles portioned to input potency */ bagAppeal:it.bagAppeal,
        resin:it.resin, type:kind, custom:it.custom });
      if(it.amount<=0) S.inventory=S.inventory.filter(x=>x.id!==it.id);
      S.stats.processedOz+=amt; gainXP(10);
      closeModal(m); toast(icon('flask','ge-ic-md')+' Processed '+amt+' oz → '+outAmt+' '+(kind==='concentrate'?'oz concentrate':'edible units'));
      save(); updateHUD(); checkMissions(); RENDER.dispensary();
    };
    m.querySelector('#proc-conc').onclick=()=>doProc('concentrate');
    m.querySelector('#proc-ed').onclick=()=>doProc('edible');
  });
};


/* ---------------- Market buyers: choose who buys your harvest ---------------- */
function buyerModal(invId){
  const it=S.inventory.find(x=>x.id===invId); if(!it) return;
  const base=pricePerOz(it)*it.amount;
  let html='<h3 class="ge-h2">'+icon('sell','ge-ic-lg')+'CHOOSE YOUR BUYER</h3>'+
   '<p class="ge-body ge-muted">'+esc(it.strainName)+' — Q'+it.quality+' • '+it.amount+' '+(it.type==='edible'?'units':'oz')+' • base '+fmt$(base)+'</p><div class="ge-dp-buyers">';
  BUYERS.forEach(by=>{
    const wxm=(typeof WX_sellMult==='function')?WX_sellMult(it.strainId,it,by.id):1;
    const mult=wxm, offer=base*mult;
    html+='<div class="ge-card ge-card-tap ge-dp-buyer" data-buyer="'+by.id+'" role="button" tabindex="0">'+
     '<div class="ge-dp-buyer-face">'+(by.npc?npcPortrait(by.npc,'npc-sm'):icon('cash','ge-ic-xl'))+'</div>'+
     '<div class="ge-plant-meta"><div class="ge-plant-name">'+esc(by.name)+'</div>'+
     '<div class="ge-plant-sub ge-muted">'+esc(by.title)+'</div>'+
     '<div class="ge-plant-sub ge-muted">'+esc(by.values)+'</div>'+
     '<div class="ge-plant-sub ge-muted">'+esc(by.blurb)+'</div>'+
     '<div class="ge-dp-offer"><span class="ge-label">OFFER</span><b class="ge-num ge-green">'+fmt$(offer)+'</b><span class="ge-caption ge-muted">×'+mult.toFixed(2)+'</span></div></div></div>';
  });
  html+='</div><button class="ge-btn ge-btn-ghost ge-btn-block" id="bm-x">'+icon('x','ge-ic-md')+'CANCEL</button>';
  const m=modal(html);
  m.querySelector('#bm-x').onclick=()=>closeModal(m);
  m.querySelectorAll('[data-buyer]').forEach(c=>c.onclick=()=>{ closeModal(m); sellToBuyer(invId,c.dataset.buyer); });
}

function sellToBuyer(invId,buyerId){
  const it=S.inventory.find(x=>x.id===invId); if(!it) return;
  /* GE-DP-502: commit-time guard — tampered in-memory amounts/fields must never
     reach cash math (negative amounts deducted cash; NaN amounts poisoned it). */
  if(!(it.amount>0)) return;
  const by=BUYERS.find(b=>b.id===buyerId)||BUYERS[0];
  const wxm=(typeof WX_sellMult==='function')?WX_sellMult(it.strainId,it,by.id):1;
  const total=pricePerOz(it)*it.amount*wxm;
  if(!Number.isFinite(total)||total<0) return;
  const ntPreSale=(typeof NT_affordSig==='function')?NT_affordSig():'';
  S.cash+=total; S.stats.lifetimeRevenue+=total; S.stats.sales++;
  try{ NT_onSale(total,ntPreSale); }catch(e){} /* P1.6: big sale -> upgrade nudge (read-only) */
  S.stats.buyerSales[by.id]=int(S.stats.buyerSales[by.id],0)+1;
  gainXP(15); gainRep(by.id==='dscout'?4:2);
  if(S.stats.quickTurnReady){ S.stats.quickTurnarounds++; S.stats.quickTurnReady=false; }
  S.inventory=S.inventory.filter(x=>x.id!==it.id);
  toast(icon('cash','ge-ic-md')+' Sold to '+esc(by.name)+' for '+fmt$(total));
  save(); updateHUD(); checkMissions(); checkAchievements(); RENDER.dispensary();
}



/* ---------------- Empire ---------------- */
let empireTab='facilities';
function empireHubHTML(){
  const openN=HUB_AREAS.filter(a=>a.un()).length, ct=facTierIdx();
  return '<div class="ge-card ge-hub"><div class="ge-card-head"><h3>'+icon('empire','ge-ic-lg')+'SHOCKER OWNZ COMPOUND</h3></div>'+
   '<p class="ge-caption ge-muted">'+openN+'/'+HUB_AREAS.length+' sectors online. Tap a sector to enter.</p>'+empireHubSVG()+
   '<div class="ge-tierladder" aria-label="Facility tier ladder">'+FAC_TIERS.map((t,i)=>'<span class="ge-tierchip'+(i===ct?' cur':i<ct?' owned':'')+'">'+esc(t.name)+'</span>').join('')+'</div>'+
   '<div class="ge-datarow"><span>Current tier</span><b>'+esc(FAC_TIERS[ct].name)+'</b></div></div>';
}

function equipCost(def,lvl){
  const disc=S.crew.manager?0.9:1;
  const sdisc=(typeof WX_discount==='function')?WX_discount('equip'):1;
  return Math.round(def.base*Math.pow(2.2,lvl-1)*disc*sdisc);
}
RENDER.empire=function(){
  const r=$('empire-root');
  let html='<div class="ge-screen">'+screenHead('empire','EMPIRE')+empireHubHTML()+
   '<div class="tabs ge-tabs" role="tablist">'+
   [['facilities','FACILITIES'],['equipment','EQUIPMENT'],['crew','CREW'],['compete','COMPETE']].map(t=>'<button class="tab ge-tab'+(empireTab===t[0]?' active is-active':'')+'" data-etab="'+t[0]+'" role="tab">'+t[1]+'</button>').join('')+'</div>';
  if(empireTab==='facilities'){
    html+=EM_facilitiesHTML();
  }else if(empireTab==='equipment'){
    html+=EM_equipmentHTML();
  }else if(empireTab==='crew'){
    html+=EM_crewHTML();
  }else if(empireTab==='compete'){
    html+=npcBlurb('marisol')+competeHtml();
  }
  /* buildings / staff: EX_wireEmpire appends their content below the tabs */
  html+='</div>';
  r.innerHTML=html;
  r.querySelectorAll('[data-etab]').forEach(t=>t.onclick=()=>{ empireTab=t.dataset.etab; RENDER.empire(); });
  r.querySelectorAll('[data-hub]').forEach(g=>g.onclick=()=>{
    const a=HUB_AREAS.find(x=>x.id===g.dataset.hub); if(!a) return;
    if(!a.un()){ toast(icon('lock','ge-ic-md')+' '+esc(a.label)+' — '+esc(a.hint)); return; }
    if(a.tab==='mothers'){ keeperTab='mothers'; show('keepers'); return; }
    if(a.tab){ empireTab=a.tab; show('empire'); return; }
    show(a.go);
  });
  r.querySelectorAll('[data-buyfac]').forEach(b=>b.onclick=()=>{
    const i=+b.dataset.buyfac, f=FACILITIES[i];
    if(!f||i!==int(S.facility,0)+1){ toast(icon('lock','ge-ic-md')+' Facilities expand in order.'); return; } /* QA GE-400 */
    if(S.cash<f.cost){ toast(icon('x','ge-ic-md')+' Need '+fmt$(f.cost)+'.'); return; }
    const prevT=facTierIdx();
    S.cash-=f.cost; S.facility=i; gainXP(150); gainRep(20);
    try{ if(typeof MS_onFacility==='function') MS_onFacility(i); }catch(e){} /* P3-W6 milestone: FIRST WAREHOUSE */
    const newT=facTierIdx();
    save(); updateHUD(); checkMissions(); RENDER.empire();
    EM_facilityUnlockCine(prevT,newT,f.name);
  });
  r.querySelectorAll('[data-buye]').forEach(b=>b.onclick=()=>{
    const d=EQUIP_DEFS.find(x=>x.id===b.dataset.buye), lvl=d?S.equipment[d.id]:0, cost=d?equipCost(d,lvl):0;
    if(!d||lvl>=d.max){ return; } /* QA GE-401: max-level + null guard */
    if(S.cash<cost){ toast(icon('x','ge-ic-md')+' Need '+fmt$(cost)+'.'); return; }
    S.cash-=cost; S.equipment[d.id]++; S.stats.equipmentBought=(S.stats.equipmentBought||0)+1; gainXP(40); /* P1.5 */
    toast('<span class="ge-up">↑</span> '+esc(d.name)+' → Lv '+S.equipment[d.id]);
    save(); updateHUD(); checkMissions(); RENDER.empire();
  });
  r.querySelectorAll('[data-hire]').forEach(b=>b.onclick=()=>{
    const c=CREW_DEFS.find(x=>x.id===b.dataset.hire);
    if(!c||S.crew[c.id]){ toast(icon('check','ge-ic-md')+' Already on payroll.'); return; } /* QA GE-402 */
    if(S.cash<c.hire){ toast(icon('x','ge-ic-md')+' Need '+fmt$(c.hire)+'.'); return; }
    S.cash-=c.hire; S.crew[c.id]=true; gainXP(60);
    toast(icon('users','ge-ic-md')+' Hired '+esc(c.name));
    save(); updateHUD(); checkMissions(); RENDER.empire();
  });
  r.querySelectorAll('[data-fire]').forEach(b=>b.onclick=()=>{ fireCrew(b.dataset.fire); }); /* QA GE-405 */
  r.querySelectorAll('[data-buymother]').forEach(b=>b.onclick=()=>{
    const capMax=(typeof P3W4_motherCapMax==='function')?P3W4_motherCapMax():4; /* P3-W4 */
    if(int(S.motherCapacity,0)>=capMax){ toast(icon('lock','ge-ic-md')+' Mother room maxed. Slots 5–6 need the Breeding Lab facility.'); return; }
    const cost=MOTHER_CAP_COSTS[S.motherCapacity];
    if(S.cash<cost){ toast(icon('x','ge-ic-md')+' Need '+fmt$(cost)+'.'); return; }
    S.cash-=cost; S.motherCapacity++; gainXP(80);
    toast(icon('leaf','ge-ic-md')+' Mother room expanded: '+S.motherCapacity+' slots!');
    save(); updateHUD(); checkMissions(); RENDER.empire();
  });
  r.querySelectorAll('[data-ge-auto]').forEach(b=>b.onclick=()=>show('automation'));
  wireCompete(r);
  try{ if(typeof EX_wireEmpire==='function') EX_wireEmpire(); }catch(e){}
  /* P3-W6: wire endgame cross-link buttons (e.g. max-facility -> records) */
  r.querySelectorAll('[data-ex-go]').forEach(b=>b.onclick=()=>{
    if(b.dataset.exTab) empireTab=b.dataset.exTab;
    show(b.dataset.exGo);
  });
};


/* ---------------- Competitions ---------------- */
function compScore(item,type){
  if(type==='flower') return item.quality;
  if(type==='resin') return item.resin;
  if(type==='terps') return item.terpenes;
  if(type==='yield') return Math.min(100,item.amount*8);
  if(type==='overall') return (item.quality+item.resin+item.terpenes+item.potency)/4;
  if(type==='breeder') return item.custom?(item.quality+item.resin)/2:0;
  return item.quality;
}
function competeHtml(){
  let html='<div class="ge-card ge-card-flat"><p class="ge-caption ge-muted">Enter your best flower against AI growers. Entry fees apply. Breeder Cup requires a CUSTOM cross.</p></div>';
  COMP_TYPES.forEach(t=>{
    const fee=t.id==='breeder'?300:150;
    html+='<div class="ge-card ge-equip"><div class="ge-equip-ico ge-comp-trophy">'+icon('trophy','ge-ic-xl')+'</div><div class="ge-equip-body">';
    html+='<div class="ge-card-head"><h3>'+icon(t.ic,'ge-ic-md')+esc(t.name)+'</h3></div>';
    html+='<p class="ge-caption ge-muted">'+esc(t.desc)+'</p>';
    html+='<div class="ge-datarow"><span>'+icon('cash','ge-ic-md')+'Entry fee</span><b class="ge-num">'+fmt$(fee)+'</b></div>';
    html+='<button class="ge-btn ge-btn-primary ge-btn-block" data-comp="'+t.id+'">'+icon('compete','ge-ic-md')+'ENTER — '+fmt$(fee)+'</button>';
    html+='</div></div>';
  });
  return html;
}

function wireCompete(r){
  r.querySelectorAll('[data-comp]').forEach(b=>b.onclick=()=>{
    const t=COMP_TYPES.find(x=>x.id===b.dataset.comp);
    const fee=t.id==='breeder'?300:150;
    if(S.cash<fee){ toast(icon('x','ge-ic-md')+' Need '+fmt$(fee)+' entry fee.'); return; }
    let pool=S.inventory.filter(i=>i.type==='flower');
    if(t.id==='breeder') pool=pool.filter(i=>i.custom);
    if(!pool.length){ toast(icon('x','ge-ic-md')+' '+(t.id==='breeder'?'You need a harvested CUSTOM cross to enter.':'No flower in inventory. Harvest first!')); return; }
    const m=modal('<div class="ge-cer-head"><h3>'+icon('compete','ge-ic-lg')+esc(t.name)+'</h3><p class="ge-caption ge-muted">Choose your entry:</p><div id="comp-pick"></div><button class="ge-btn ge-btn-ghost" id="comp-x">'+icon('x','ge-ic-md')+'CANCEL</button></div>');
    m.querySelector('#comp-x').onclick=()=>closeModal(m);
    m.querySelector('#comp-pick').innerHTML=pool.map(i=>'<div class="ge-pick" data-entry="'+i.id+'">'+flowerSVG(i.strainId+'#'+i.id,'pick-flower')+'<span><b>'+esc(i.strainName)+'</b> — Q'+i.quality+' • '+i.amount+' oz</span></div>').join('');
    m.querySelectorAll('[data-entry]').forEach(e=>e.onclick=()=>{
      const item=S.inventory.find(x=>x.id===+e.dataset.entry);
      closeModal(m); if(typeof EX_runCompetition==='function') EX_runCompetition(t,item,fee); else runCompetition(t,item,fee);
    });
  });
}

function runCompetition(t,item,fee){
  S.cash-=fee; S.stats.compsEntered++;
  const myScore=compScore(item,t.score)+rnd(-3,3);
  const rivals=[];
  for(let i=0;i<5;i++){
    const base=clamp(45+S.level*2+rnd(-15,20),10,100);
    rivals.push({name:pick(AI_NAMES),score:Math.round(base)});
  }
  rivals.push({name:'YOU ('+item.strainName+')',score:Math.round(myScore),me:true});
  rivals.sort((a,b)=>b.score-a.score);
  const rank=rivals.findIndex(r=>r.me)+1;
  const won=rank===1;
  let html='<div class="ge-cer-head"><h3>'+icon('trophy','ge-ic-lg')+esc(t.name)+' — RESULTS</h3></div>';
  rivals.forEach((rv,i)=>{ html+='<div class="ge-cer-row'+(rv.me?' ge-cer-me':'')+'"><span>'+(i+1)+'. '+esc(rv.name)+'</span><b class="ge-num">'+rv.score+'</b></div>'; });
  if(won){
    const cashR=Math.round(800*DIFFS[S.difficulty].missionReward), repR=60;
    S.cash+=cashR; gainRep(repR); S.stats.compsWon++;
    if(t.id==='breeder') S.stats.breederCupWins++;
    addP0('freedom',3); addP0('cultivation',2); gainXP(200);
    html+='<div class="ge-cer-win"><div class="ge-cer-crown">'+crownSVG(true,'c-ico-svg')+'</div><p class="ge-cer-wintext">YOU WIN! +'+fmt$(cashR)+' +'+repR+' rep</p></div>';
    if(t.id==='breeder'&&Math.random()<0.5){ unlockStrain('crown-jewel',true); html+='<p class="ge-cer-wintext">'+icon('crown-gold','ge-ic-md')+' Rare genetics unlocked: Crown Jewel!</p>'; }
    toast(icon('trophy','ge-ic-md')+' Competition WON!');
  }else{
    gainXP(40);
    html+='<p class="ge-caption ge-muted">Placed #'+rank+'. Better luck next time — the judges want higher '+(t.score==='overall'?'overall excellence':t.score)+'.</p>';
  }
  html+='<button class="ge-btn ge-btn-block" onclick="this.closest(\'.modal-back\').remove()">'+icon('x','ge-ic-md')+'CLOSE</button>';
  modal(html);
  save(); updateHUD(); checkMissions(); checkAchievements();
}


/* ---------------- Project 0 ---------------- */
RENDER.project0=function(){
  const r=$('project0-root');
  let html=screenHead('project0','PROJECT 0 — GENETIC PRESERVATION ARCHIVE')+
   '<div class="ge-screen">'+
   '<div class="ge-card ge-p0-hero ge-anim-rise">'+
    '<div class="ge-p0-sealrow">'+gasmaskSVG('p0-seal')+
     '<div class="p0-crown">'+crownSVG(false,'crown-anim')+'</div></div>'+
    '<div class="ge-p0-eyebrow">'+icon('project0','ge-ic-sm')+'<span>GENETIC PRESERVATION ARCHIVE</span></div>'+
    '<h1 class="ge-display ge-p0-title">PROJECT 0</h1>'+
    '<p class="ge-p0-motto">"IT\'S NEVER ABOUT THE MONEY — ONLY THE GENETICS."</p>'+
    '<div class="ge-p0-herorow">'+P0V_scoreRing()+
     '<div class="ge-p0-score">'+
      '<div class="ge-display ge-gold-text ge-num">'+int(S.project0.points,0)+'</div>'+
      '<div class="ge-label ge-muted">PRESERVATION SCORE</div>'+
      '<div class="ge-p0-pointspill"><span class="ge-pill ge-pill-gold">'+icon('star','ge-ic-sm')+int(S.project0.points,0)+' POINTS</span></div>'+
     '</div></div>'+
    (S.project0.titles.length?
     '<div class="ge-divider"></div>'+
     '<div class="ge-label ge-muted" style="text-align:center">EARNED TITLES</div>'+
     '<div class="ge-p0-titles">'+S.project0.titles.map(t=>P0V_titleTag(t)).join('')+'</div>'
     :'')+
   '</div>'+
   npcBlurb('quinn')+
   '<div class="ge-section-title">'+icon('box','ge-ic-sm')+'ARCHIVE METRICS</div>'+
   '<div class="ge-tiles">'+P0V_metricsHTML()+'</div>'+
   '<div class="ge-section-title">'+icon('scroll','ge-ic-sm')+'PRESERVATION TRACKS<span class="ge-spread ge-muted">'+P0V_trackLevels()+'/40 LEVELS</span></div>'+
   P0V_tracksHTML()+
   '<div class="ge-section-title">'+icon('trophy','ge-ic-sm')+'TRACK REWARDS</div>'+
   '<div class="ge-card ge-card-flat ge-p0-rewards">'+P0V_rewardsHTML()+'</div>'+
   (typeof P0T_pipelineHTML==='function'?P0T_pipelineHTML():'')+
   '<div class="ge-section-title">'+icon('dna','ge-ic-sm')+'HOW TO EARN</div>'+
   '<div class="ge-card ge-card-flat">'+
    '<div class="ge-datarow"><span>'+icon('genetics','ge-ic-md')+'Breeding</span></div>'+
    '<div class="ge-datarow"><span>'+icon('preserve','ge-ic-md')+'Preserving genetics</span></div>'+
    '<div class="ge-datarow"><span>'+icon('harvest','ge-ic-md')+'85+ quality harvests</span></div>'+
    '<div class="ge-datarow"><span>'+icon('star','ge-ic-md')+'90+ keeper phenotypes</span></div>'+
    '<div class="ge-datarow"><span>'+icon('missions','ge-ic-md')+'Missions</span></div>'+
    '<div class="ge-datarow"><span>'+icon('compete','ge-ic-md')+'Competitions</span></div>'+
    '<div class="ge-datarow"><span>'+icon('crown-gold','ge-ic-md')+'Discovering keeper phenotypes</span></div>'+
   '</div>'+
   '</div>';
  r.innerHTML=html;
  try{ if(typeof EX_wireP0==='function') EX_wireP0(); }catch(e){}
  try{ if(typeof P0T_wirePipeline==='function') P0T_wirePipeline(r); }catch(e){} /* P3-W3: SEAL buttons */
};


/* ---------------- Missions screen ---------------- */
let missionTab='active';
function missionProg(m){
  try{ const p=m.prog(S); return {cur:clamp(p[0],0,p[1]),target:p[1]}; }catch(e){ return {cur:0,target:1}; }
}
RENDER.missions=function(){
  const r=$('missions-root');
  if(!r) return;
  const cats={};
  MISSIONS.forEach(m=>{ (cats[m.cat]=cats[m.cat]||[]).push(m); });
  let html=screenHead('missions','MISSIONS');
  /* command header */
  const mDoneN=S.missionsDone.length, mTotN=MISSIONS.length,
        mPct=Math.round(mDoneN/Math.max(1,mTotN)*100), nm=nextMission();
  html+='<div class="ge-screen"><div class="ge-card ge-card-hot ms-command">'+
   '<div class="ge-card-head"><h3>'+icon('missions','ge-ic-lg')+'MISSION COMMAND</h3>'+
   '<span class="ge-pill ge-pill-gold ge-num">'+mDoneN+'/'+mTotN+'</span></div>'+
   '<div class="ge-progress ge-progress-gold"><i style="width:'+mPct+'%"></i></div>'+
   '<div class="ge-progress-meta"><span>CAMPAIGN PROGRESS</span><b class="ge-num">'+mPct+'%</b></div>'+
   (nm?'<div class="ms-nextup"><span class="ge-label">'+icon('missions','ge-ic-sm')+' NEXT UP</span><b>'+esc(nm.name)+'</b><span class="ge-muted"> \u2014 '+esc(nm.desc)+'</span></div>'
      :'<div class="ms-nextup"><span class="ge-label">'+icon('crown-gold','ge-ic-md')+' LEGEND STATUS</span><b>Campaign complete.</b></div>')+
  '</div>';
  /* section tabs */
  html+='<div class="ge-tabs ms-tabs" role="tablist" aria-label="Mission sections">'+
   MS_SECTIONS.map(s=>'<button class="ge-tab'+(missionTab===s.id?' is-active':'')+'" role="tab" aria-selected="'+(missionTab===s.id)+'" data-mtab="'+s.id+'">'+icon(s.icon,'ge-ic-sm')+s.label+'</button>').join('')+
  '</div>';
  /* P2.3: story arcs render as chapters above the flat mission list */
  if(missionTab==='story'){ try{ html+=CHA_storyHTML(); }catch(e){} }
  /* cards */
  let total=0;
  Object.keys(cats).forEach(cat=>{
    const items=[];
    cats[cat].forEach(m=>{
      const done=S.missionsDone.includes(m.id);
      const pr=missionProg(m);
      const started=pr.cur>0;
      if(!MS_inSection(m,missionTab,done,started)) return;
      items.push({m:m,pr:pr,done:done,started:started});
    });
    if(!items.length) return;
    items.sort((a,b)=>{
      const sa=a.done?2:(a.started?0:1), sb=b.done?2:(b.started?0:1);
      return sa-sb;
    });
    total+=items.length;
    html+='<div class="ge-section-title">'+esc(cat.toUpperCase())+'<span class="ge-spread ge-num">'+items.length+'</span></div>';
    items.forEach(it=>{ html+=MS_cardHTML(it.m,cat,it.pr,it.done,it.started); });
  });
  if(!total){
    const em=MS_EMPTY[missionTab]||MS_EMPTY.active;
    html+='<div class="ge-card"><div class="ge-empty">'+icon('missions','ge-ic-xl')+'<h3>'+em.t+'</h3><p>'+em.p+'</p></div></div>';
  }
  html+='</div>';
  r.innerHTML=html;
  r.querySelectorAll('[data-mtab]').forEach(t=>t.onclick=()=>{ missionTab=t.dataset.mtab; RENDER.missions(); });
  try{ if(typeof MN_wireMissions==='function') MN_wireMissions(r); }catch(e){}
};


/* ============================================================
   KEEPER VAULT + MOTHER ROOM + CLONING + PHENO HUNTS
   ============================================================ */
function markKeeper(report){
  if(!report||typeof report!=='object'){ try{ toast(icon('x','ge-ic-md')+' Keeper data invalid.'); }catch(e){} return false; } /* QA GE-203 */
  if(S.keepers.length>=S.keeperCapacity){
    S.stats.vaultFilledOnce++;
    save();
    vaultFullModal(report);
    return;
  }
  keeperCine(report);
}
/* KEEPER DISCOVERY — full-screen cinematic: darken, red glow, silhouette,
   crown reveal, sequential trait count-up, then MARK AS KEEPER. */
function keeperCine(report){
  try{
  const g=report.genetics||{};
  const rows=[['RESIN',g.resinPot],['TERPENES',g.terpenePot],['POTENCY',g.potencyPot],['BAG APPEAL',g.bagAppeal]];
  let plantArt='';
  try{ plantArt=plantSVG(9,report.strainId+'#'+report.phenoNum,'keeper-plant',{frost:3,dense:true,purple:report.rarity==='legendary'}); }catch(e){ plantArt=''; }
  const back=cineOverlay(
   '<div class="ge-kid-stage">'+
   '<div class="ge-kid-glow"></div>'+
   '<div class="ge-kid-plant">'+plantArt+'</div>'+
   '<div class="ge-kid-crown">'+crownSVG(report.rarity==='legendary','crown-anim')+'</div>'+
   '<div class="ge-kid-kicker">SECRET GENETIC ARCHIVE</div>'+
   '<div class="ge-display ge-kid-title">KEEPER IDENTIFIED</div>'+
   '<div class="ge-kid-name">'+esc(report.strainName)+' <span class="ge-kid-pheno">PHENO #'+report.phenoNum+'</span></div>'+
   '<div class="ge-kid-traits">'+rows.map((t,i)=>'<div class="ge-kid-trait" style="animation-delay:'+(0.6+i*0.5).toFixed(1)+'s"><span>'+t[0]+'</span><b data-count="'+num(t[1],0)+'" data-dec="0">0</b></div>').join('')+'</div>'+
   '<button type="button" class="ge-btn ge-btn-gold ge-btn-block" id="kc-ok">'+icon('crown-gold','ge-ic-md')+'ADD TO KEEPER VAULT</button></div>',
   'cine-keeper',0);
  if(!back) throw new Error('keeper overlay failed to open');
  back.querySelectorAll('[data-count]').forEach(el=>{
    const target=num(el.dataset.count,0), t0=performance.now(), dur=900, delay=600;
    function tick(t){
      if(t-t0<delay){ requestAnimationFrame(tick); return; }
      const p=clamp((t-t0-delay)/dur,0,1), e=1-Math.pow(1-p,3);
      el.textContent=Math.round(target*e);
      if(p<1) requestAnimationFrame(tick);
    }
    try{ requestAnimationFrame(tick); }catch(e){ el.textContent=Math.round(target); }
  });
  try{ if(typeof CAP_haptic==='function') CAP_haptic('keeper'); }catch(e){}
  const okBtn=back.querySelector('#kc-ok');
  if(!okBtn) throw new Error('keeper confirm button missing');
  const okFn=(e)=>{ try{ if(e&&e.stopPropagation) e.stopPropagation(); }catch(e2){} back.classList.add('cine-out'); setTimeout(()=>back.remove(),300); confirmKeeper(report); };
  okBtn.addEventListener('click',okFn); /* QA GE-204: single binding (dupe guard remains as backstop) */
  }catch(e){
    /* The cinematic is garnish — the keeper is the payload. Never let a
       ceremony failure silently swallow a keeper: save it directly. */
    try{ toast(icon('warn','ge-ic-md')+' Keeper ceremony skipped — preserving genetics directly.'); }catch(e2){}
    confirmKeeper(report);
  }
}

function confirmKeeper(report){
  try{
    if(!report||typeof report!=='object'){ toast(icon('x','ge-ic-md')+' Keeper data invalid.'); return false; }
    if(!Array.isArray(S.keepers)) S.keepers=[];
    const strainId=report.strainId||'unknown', phenoNum=int(report.phenoNum,0);
    /* duplicate prevention: same strain + pheno number */
    const dupe=S.keepers.find(k=>k.strainId===strainId&&int(k.phenoNum,0)===phenoNum);
    if(dupe){ toast(icon('crown','ge-ic-md')+' Already a keeper: <b>'+esc(String(report.strainName||dupe.strainName))+' #'+phenoNum+'</b>'); return false; }
    /* GE-DP-501: capacity re-checked at COMMIT time. markKeeper only validated
       when the ceremony opened; the vault could fill behind the modal, and the
       confirm then overflowed it. Mirror markKeeper's full-vault path. */
    if(S.keepers.length>=S.keeperCapacity){
      S.stats.vaultFilledOnce=int(S.stats.vaultFilledOnce,0)+1;
      try{ save(); }catch(e){}
      vaultFullModal(report);
      return false;
    }
    const g=report.genetics&&typeof report.genetics==='object'?report.genetics:{};
    const hv=report.harvest&&typeof report.harvest==='object'?report.harvest:{};
    let geneticsCopy={};
    try{ geneticsCopy=JSON.parse(JSON.stringify(g)); }catch(e){ geneticsCopy={}; }
    sanitizePhenoGenetics(geneticsCopy);
    const traits=Array.isArray(report.traits)?report.traits.slice():[];
    const k={
      id:'k'+Date.now()+rndi(100,999),
      strainId:strainId, strainName:String(report.strainName||strainId), phenoNum:phenoNum,
      genetics:geneticsCopy,
      traits:traits, hiddenTraits:Array.isArray(report.hiddenTraits)?report.hiddenTraits.slice():[],
      discoveredTraits:Array.isArray(report.discoveredTraits)?report.discoveredTraits.slice():traits.slice(),
      rarity:report.rarity||'common', legendaryTrait:report.legendaryTrait||null,
      overall:num(report.overall,0),
      bestQuality:num(hv.quality,0), bestYield:num(hv.yieldOz,0),
      avgQuality:num(hv.quality,0), avgYield:num(hv.yieldOz,0),
      /* GE-329 follow-up: persist the full phenotype so keeper/mother production prices off real genetics */
      bestPotency:num(hv.potency,0), avgPotency:num(hv.potency,0),
      bestTerpenes:num(hv.terpenes,0), avgTerpenes:num(hv.terpenes,0),
      bestResin:num(hv.resin,0), avgResin:num(hv.resin,0),
      bestBagAppeal:num(hv.bagAppeal,0), avgBagAppeal:num(hv.bagAppeal,0),
      harvests:1, dayFound:int(S.day,1), generation:int(report.generation,0),
      lineage:String(report.lineage||'Seed'),
      isClone:!!report.isClone, motherId:report.motherId||null,
      awards:[], clonesGrown:0, cloneRuns:0, breedingUses:0
    };
    S.keepers.push(k);
    S.stats.keepersFound=int(S.stats.keepersFound,0)+1;
    try{ ME_first('keeper',{strainId:strainId,strainName:k.strainName,phenoNum:k.phenoNum,rarity:k.rarity,day:int(S.day,1)}); }catch(e){} /* P2.5 player memory */
    try{ if(typeof MS_onKeeper==='function') MS_onKeeper(); }catch(e){} /* P3-W6 milestone: FIRST KEEPER */
    try{ codexOnKeeper(strainId,k); codexNote(strainId,'Keeper selected: '+k.strainName+' #'+k.phenoNum+' ('+(k.rarity||'common')+')'); }catch(e){} /* P2-W2: keeper -> keeper ref */
    try{ const h=phist(strainId); if(h) h.keepers=int(h.keepers,0)+1; }catch(e){}
    try{
      const hunt=report.huntId?S.phenoHunts.find(x=>x.id===report.huntId):(S.phenoHunts||[]).find(x=>x.active&&strainId===x.strainId);
      if(hunt) hunt.keepersFound=int(hunt.keepersFound,0)+1;
    }catch(e){}
    addP0('preservation',4); addP0('genetics',2);
    if(report.rarity==='elite') addP0('nocompromise',3);
    if(report.rarity==='legendary') addP0('genetics',6);
    gainXP(150); gainRep(10);
    toast(icon('crown-gold','ge-ic-md')+' KEEPER SELECTED<br><b>'+esc(k.strainName)+' — PHENO #'+k.phenoNum+'</b><br>ELITE GENETICS PRESERVED');
    try{ if(typeof TY_keeperHook==='function') TY_keeperHook(report); }catch(e){}
    save(); updateHUD(); checkMissions(); checkAchievements();
    try{ if(typeof P0T_sweep==='function') P0T_sweep(); }catch(e){} /* P3-W3: keeper -> preservation pipeline */
    if(current==='keepers') RENDER.keepers();
    try{ NT_onKeeper(k); }catch(e){} /* P1.6: keeper -> clone CTA (read-only) */
    return true;
  }catch(e){
    try{ toast(icon('x','ge-ic-md')+' Keeper failed: '+esc(e.message)); }catch(e2){}
    return false;
  }
}

function vaultFullModal(report){
  const sorted=S.keepers.slice().sort((a,b)=>a.overall-b.overall);
  const weakest=sorted[0];
  let html='<div class="ge-modal-head">'+icon('warn','ge-ic-md')+'<h3>KEEPER VAULT FULL</h3></div><div class="ge-modal-body">'+
   '<p class="ge-muted">'+S.keepers.length+'/'+S.keeperCapacity+' slots used. Compare the new phenotype against your vault.</p>'+
   '<div class="ge-datarow"><span>'+icon('keepers','ge-ic-sm')+'NEW: '+esc(report.strainName)+' #'+report.phenoNum+'</span><b class="ge-num">'+report.overall+'</b></div>';
  if(weakest) html+='<div class="ge-datarow"><span>'+icon('star','ge-ic-sm')+'Weakest keeper: '+esc(weakest.strainName)+' #'+weakest.phenoNum+'</span><b class="ge-num">'+weakest.overall+'</b></div>';
  html+='</div><div class="ge-modal-foot"><div class="ge-btn-row"><button class="ge-btn ge-btn-sm ge-btn-ghost" id="vf-compare">'+icon('scroll','ge-ic-sm')+'COMPARE</button>'+
   '<button class="ge-btn ge-btn-sm ge-btn-gold" id="vf-up">'+icon('plus','ge-ic-sm')+'UPGRADE VAULT</button></div>'+
   '<button class="ge-btn ge-btn-ghost" id="vf-arch">'+icon('box','ge-ic-md')+'ARCHIVE NEW PHENO</button>'+
   '<button class="ge-btn ge-btn-danger" id="vf-x">'+icon('x','ge-ic-md')+'CLOSE</button></div>';
  const m=modal(html);
  m.querySelector('#vf-x').onclick=()=>closeModal(m);
  m.querySelector('#vf-arch').onclick=()=>{ closeModal(m); archivePheno(report); };
  m.querySelector('#vf-up').onclick=()=>{ closeModal(m); keeperTab='vault'; show('keepers'); toast('<span class="ge-label">↑</span> Expand vault capacity below.'); };
  if(weakest) m.querySelector('#vf-compare').onclick=()=>{
    closeModal(m);
    /* P2.1: full per-pheno actions on each side; the replace flow is preserved */
    compareModal(
      {name:report.strainName+' #'+report.phenoNum+' (NEW)',strainId:report.strainId,genetics:report.genetics,overall:report.overall},
      {name:weakest.strainName+' #'+weakest.phenoNum,strainId:weakest.strainId,genetics:weakest.genetics,overall:weakest.overall},
      phenoSideActions('a',{kind:'report',report:report})
      .concat(phenoSideActions('b',{kind:'keeper',keeperId:weakest.id,strainId:weakest.strainId,strainName:weakest.strainName,phenoNum:weakest.phenoNum,rarity:weakest.rarity}))
      .concat([
        {label:icon('crown-gold','ge-ic-sm')+' KEEP NEW (REPLACE)',cls:'ge-btn-gold',side:'a',fn:()=>{ S.keepers=S.keepers.filter(x=>x.id!==weakest.id); toast(icon('x','ge-ic-md')+' Replaced '+esc(weakest.strainName)+' #'+weakest.phenoNum); markKeeper(report); }},
        {label:'CANCEL',cls:'ge-btn-danger',fn:()=>{}}
      ]));
  };
}

/* generic side-by-side comparison — P2.1: full 18-trait table + terpene profile,
   per-row winner highlights (lower-is-better honored), and optional per-side
   action groups (action entries may carry side:'a'|'b'). */
function compareModal(a,b,actions){
  const ga=(a&&a.genetics&&typeof a.genetics==='object')?a.genetics:{};
  const gb=(b&&b.genetics&&typeof b.genetics==='object')?b.genetics:{};
  /* [label, key, lowerIsBetter] */
  /* P2.1: row labels keep their established forms (P1.2-16 pins 'Nutrient Sens.' /
     'Env Tolerance'); new rows use full names. */
  const rows=[['Vigor','vigor'],['Structure','structure'],['Yield','yieldPot'],['Potency','potencyPot'],['Terpene Score','terpenePot'],
    ['Resin','resinPot'],['Bag Appeal','bagAppeal'],['Flower Speed','flowerSpeed'],
    ['Stability','stability'],['Stress Tol.','stressTol'],['Herm Risk','hermRisk',true],
    ['Root Vigor','rootVigor'],['Clone Vigor','cloneVigor'],['Internodal Spacing','internode'],
    ['Disease Resistance','diseaseRes'],
    ['Stretch','stretch'],['Nutrient Sens.','nutrientSensitivity',true],['Env Tolerance','envTolerance']];
  let html='<div class="ge-modal-head">'+icon('scroll','ge-ic-md')+'<h3>PHENOTYPE COMPARE</h3></div><div class="ge-modal-body"><table class="ge-cmp-table"><tr><th></th><th>'+esc(a.name)+'</th><th>'+esc(b.name)+'</th></tr>';
  rows.forEach(r=>{
    const label=r[0], key=r[1], lower=!!r[2];
    const av=Math.round(num(ga[key],0)), bv=Math.round(num(gb[key],0));
    const aw=lower?(av<bv&&bv>0):(av>bv), bw=lower?(bv<av&&av>0):(bv>av);
    html+='<tr><td>'+label+'</td><td class="'+(aw?'win':'')+'">'+av+'</td><td class="'+(bw?'win':'')+'">'+bv+'</td></tr>';
  });
  /* terpene profile — derived from existing strain tags + terpenePot; non-numeric, no winner */
  let pa='\u2014', pb='\u2014';
  try{ pa=phenoTerpeneProfile(ga,a.strainId); }catch(e){}
  try{ pb=phenoTerpeneProfile(gb,b.strainId); }catch(e){}
  html+='<tr><td>Terpene Profile</td><td>'+esc(pa)+'</td><td>'+esc(pb)+'</td></tr>';
  const ao=Math.round(num(a.overall,0)), bo=Math.round(num(b.overall,0));
  html+='<tr class="ge-cmp-overall"><td><b>OVERALL</b></td><td class="'+(ao>bo?'win':'')+'"><b>'+ao+'</b></td><td class="'+(bo>ao?'win':'')+'"><b>'+bo+'</b></td></tr></table></div>';
  const acts=Array.isArray(actions)?actions:[];
  const btnFor=x=>'<button type="button" class="ge-btn ge-btn-sm '+x.ac.cls+'" data-cact="'+x.i+'">'+x.ac.label+'</button>';
  const grp=s=>acts.map((ac,i)=>({ac:ac,i:i})).filter(x=>x.ac&&x.ac.side===s);
  let foot='<div class="ge-modal-foot">';
  [['a',a],['b',b]].forEach(sb=>{
    const list=grp(sb[0]);
    if(list.length) foot+='<div class="ge-cmp-side"><span class="ge-cmp-side-name">'+esc(sb[1].name)+'</span><div class="ge-btn-row">'+list.map(btnFor).join('')+'</div></div>';
  });
  const gen=acts.map((ac,i)=>({ac:ac,i:i})).filter(x=>!x.ac||!x.ac.side);
  if(gen.length) foot+='<div class="ge-btn-row">'+gen.map(btnFor).join('')+'</div>';
  foot+='</div>';
  html+=foot;
  const m=modal(html);
  m.querySelectorAll('[data-cact]').forEach(btn=>btn.onclick=()=>{ const ac=acts[+btn.dataset.cact]; closeModal(m); try{ if(ac&&typeof ac.fn==='function') ac.fn(); }catch(e){} });
  S.stats.comparesDone++;
  save(); checkMissions();
}

function keeperCmpObj(k){ return {name:k.strainName+' #'+k.phenoNum,strainId:k.strainId,genetics:k.genetics,overall:k.overall}; }
/* P2.1: keeper-vs-keeper compare — full per-pheno actions on each side */
function compareKeepers(idA,idB){
  const a=S.keepers.find(x=>x.id===idA), b=S.keepers.find(x=>x.id===idB);
  if(!a||!b) return;
  compareModal(keeperCmpObj(a),keeperCmpObj(b),
    phenoSideActions('a',{kind:'keeper',keeperId:a.id,strainId:a.strainId,strainName:a.strainName,phenoNum:a.phenoNum,rarity:a.rarity})
    .concat(phenoSideActions('b',{kind:'keeper',keeperId:b.id,strainId:b.strainId,strainName:b.strainName,phenoNum:b.phenoNum,rarity:b.rarity}))
    .concat([{label:'CLOSE',cls:'ge-btn-danger',fn:()=>{}}]));
}

function pickComparePartner(idA){
  const others=S.keepers.filter(x=>x.id!==idA);
  if(!others.length){ toast('Need at least 2 keepers to compare.'); return; }
  const m=modal('<div class="ge-modal-head">'+icon('scroll','ge-ic-md')+'<h3>COMPARE WITH...</h3></div><div class="ge-modal-body"><div class="ge-stack">'+
    others.map(k=>'<button class="ge-btn ge-btn-ghost ge-btn-block ge-btn-sm" data-cmpb="'+k.id+'"><b>'+icon('crown','ge-ic-sm')+' '+esc(k.strainName)+' #'+k.phenoNum+'</b> — Overall '+k.overall+'</button>').join('')+'</div></div>'+
    '<div class="ge-modal-foot"><button class="ge-btn ge-btn-ghost" id="cmp-x">CANCEL</button></div>');
  m.querySelector('#cmp-x').onclick=()=>closeModal(m);
  m.querySelectorAll('[data-cmpb]').forEach(el=>el.onclick=()=>{ closeModal(m); compareKeepers(idA,el.dataset.cmpb); });
}

/* ---- mothers & clones ---- */
/* WAVE 0 FIX (b): collision-proof mother IDs — monotonic per-session counter + timestamp.
   No two calls in the same tick can collide, even if Date.now() is frozen/mocked in tests.
   IDs are generated once and persisted on the mother object, so save/load keeps them stable. */
let motherSeq=0;
function nextMotherId(){ return 'm'+Date.now().toString(36)+'-'+(motherSeq++).toString(36); }
function promoteMother(keeperId){
  const k=S.keepers.find(x=>x.id===keeperId); if(!k) return;
  if(S.mothers.length>=S.motherCapacity){ toast(icon('leaf','ge-ic-md')+' Mother room full! Upgrade capacity in EMPIRE.'); return; }
  if(S.mothers.some(mm=>mm.keeperId===keeperId)){ toast('Already a mother plant.'); return; }
  S.mothers.push({id:nextMotherId(),keeperId:k.id,strainId:k.strainId,strainName:k.strainName,
    phenoNum:k.phenoNum,genetics:JSON.parse(JSON.stringify(k.genetics)),traits:k.traits.slice(),
    rarity:k.rarity,legendaryTrait:k.legendaryTrait||null,dayCreated:S.day,clonesTaken:0,
    runs:0,bestQ:0,bestY:0,qualities:[],yields:[],awards:[]});
  S.stats.mothersCreated++;
  addP0('preservation',3); addP0('family',1); gainXP(100);
  toast(icon('leaf','ge-ic-md')+' '+esc(k.strainName)+' #'+k.phenoNum+' is now a MOTHER PLANT');
  save(); updateHUD(); checkMissions(); checkAchievements();
  if(current==='keepers') RENDER.keepers();
}

function takeClone(motherId){
  const mo=S.mothers.find(m=>m.id===motherId); if(!mo) return;
  const slots=FACILITIES[S.facility].slots;
  if(S.plants.length>=slots){ toast(icon('x','ge-ic-md')+' No free grow slots. Expand your facility!'); return; }
  if(S.cash<25){ toast(icon('x','ge-ic-md')+' Cloning supplies cost $25.'); return; }
  S.cash-=25;
  const p={ id:S.nextPlantId++, strainId:mo.strainId, day:0, health:100, water:70, nutrition:60,
    stress:0, trained:false, minHealth:100, problems:[], growthBoost:0 };
  const g=JSON.parse(JSON.stringify(mo.genetics));
  g.isClone=true; g.motherId=mo.id; g.keeperId=mo.keeperId;
  g.cloneGen=mo.clonesTaken+1; g.legendaryHidden=false; g.rarityCounted=true;
  g.huntId=null; g.num=mo.phenoNum;
  if(!g.known||typeof g.known!=='object') g.known={};
  if(!Array.isArray(g.expressed)) g.expressed=[];
  PHENO_KEYS.forEach(k=>{ g.known[k]=true; });
  g.expressed=[]; g.inspectCount=0;
  sanitizePheno(g);
  p.pheno=g;
  S.plants.push(p);
  mo.clonesTaken++; S.stats.clonesTaken++; S.stats.plantsStarted++;
  try{ ME_first('plant',{strainId:p.strainId,name:ME_strainName(p.strainId),day:int(S.day,1)}); }catch(e){} /* P2.5 player memory */
  try{ codexOnGrown(mo.strainId); codexNote(mo.strainId,'Clone taken from mother '+mo.strainName+' #'+mo.phenoNum+' \u2014 identical genetics'); }catch(e){} /* P2-W2 */
  const kk=S.keepers.find(x=>x.id===mo.keeperId); if(kk) kk.clonesGrown++;
  addP0('cultivation',1); gainXP(10);
  toast(icon('dna','ge-ic-md')+' Clone taken: '+esc(mo.strainName)+' #'+mo.phenoNum+' — identical genetics preserved.');
  save(); updateHUD(); checkMissions();
  if(current==='keepers') RENDER.keepers(); else refreshGrowUI();
}

function removeMother(motherId){
  const mo=S.mothers.find(m=>m.id===motherId); if(!mo) return;
  confirmModal('Retire mother?','Retire '+mo.strainName+' #'+mo.phenoNum+'? Existing clones keep growing.',()=>{
    S.mothers=S.mothers.filter(m=>m.id!==motherId);
    save(); toast(icon('leaf','ge-ic-md')+' Mother retired.'); if(current==='keepers') RENDER.keepers();
  });
}

function removeKeeper(keeperId){
  const k=S.keepers.find(x=>x.id===keeperId); if(!k) return;
  confirmModal('Remove keeper?','Remove '+k.strainName+' #'+k.phenoNum+' from the vault?',()=>{
    S.keepers=S.keepers.filter(x=>x.id!==keeperId);
    save(); toast('Keeper removed.'); if(current==='keepers') RENDER.keepers();
  });
}
/* ---- pheno hunts ---- */
function startPhenoHunt(strainId){
  const st=getStrain(strainId); if(!st) return;
  if(!isUnlocked(strainId)){ toast(icon('lock','ge-ic-md')+' Genetics locked.'); return; }
  const m=modal('<div class="ge-modal-head">'+icon('hunt','ge-ic-md')+'<h3>PHENO HUNT</h3></div><div class="ge-modal-body"><p>Strain: <b>'+esc(st.name)+'</b> <span class="ge-muted">('+fmt$(st.seed)+'/seed)</span></p>'+
   '<p class="ge-muted">Each seed grows a unique phenotype. Hunt the keeper!</p>'+
   '<div class="ge-btn-row"><button class="ge-btn ge-btn-sm ge-btn-ghost" data-hc="5">5 SEEDS</button>'+
   '<button class="ge-btn ge-btn-sm ge-btn-ghost" data-hc="10">10 SEEDS</button>'+
   '<button class="ge-btn ge-btn-sm ge-btn-ghost" data-hc="20">20 SEEDS</button></div></div>'+
   '<div class="ge-modal-foot"><button class="ge-btn ge-btn-ghost" id="hunt-x">CANCEL</button></div>');
  m.querySelector('#hunt-x').onclick=()=>closeModal(m);
  m.querySelectorAll('[data-hc]').forEach(b=>b.onclick=()=>{ const c=+b.dataset.hc; closeModal(m); launchHunt(st,c); });
}

function launchHunt(st,count){
  const hunt={id:'h'+Date.now(),strainId:st.id,strainName:st.name,total:count,
    planted:0,harvested:0,keepersFound:0,bestScore:0,bestPheno:0,active:true,dayStarted:S.day};
  S.phenoHunts.push(hunt);
  const slots=FACILITIES[S.facility].slots;
  let ok=0;
  while(ok<count&&S.plants.length<slots){ if(plantSeed(st.id)) ok++; else break; }
  if(ok<count) toast(icon('dna','ge-ic-md')+' Hunt started: '+ok+'/'+count+' planted (slots/cash limited). Plant the rest from MY GROWS.');
  else toast(icon('dna','ge-ic-md')+' PHENO HUNT: '+count+' x '+esc(st.name)+' planted! Find the keeper.');
  save(); updateHUD();
  if(current==='genetics') RENDER.genetics(); if(current==='grows') RENDER.grows();
}

function completeHunt(hunt){
  hunt.active=false;
  S.stats.phenoHuntsDone++;
  if(hunt.total>=10) S.stats.huntsCompleted10++;
  addP0('knowledge',3); addP0('preservation',2); gainXP(200);
  toast(icon('dna','ge-ic-md')+' PHENO HUNT COMPLETE: '+hunt.harvested+'/'+hunt.total+' harvested. Best: #'+hunt.bestPheno+' ('+hunt.bestScore+')');
  save(); checkMissions(); checkAchievements();
}

/* ---- keeper vault screen ---- */
let keeperTab='vault', keeperSort='overall', keeperFilter='all', keeperPage=0;
const KEEPER_SORTS=[['overall','OVERALL'],['resinPot','RESIN'],['terpenePot','TERPENES'],['yieldPot','YIELD'],['potencyPot','POTENCY'],['newest','NEWEST'],['oldest','OLDEST']];
RENDER.keepers=function(){
  const r=$('keepers-root');
  let html='<div class="ge-screen">'+screenHead('keepers','KEEPER VAULT')+'<div class="ge-tabs" role="tablist">'+
   [['vault','KEEPERS ('+S.keepers.length+'/'+S.keeperCapacity+')','keepers'],['mothers','MOTHERS ('+S.mothers.length+'/'+S.motherCapacity+')','mothers'],
    ['seeds','SEED STOCK','grow'],['customs','CUSTOMS ('+(S.customStrains||[]).length+')','dna'],
    ['archive','ARCHIVE ('+(S.phenoArchive||[]).length+')','box'],['project0','PROJECT 0','project0']]
   .map(t=>'<button class="ge-tab'+(keeperTab===t[0]?' is-active':'')+'" data-ktab="'+t[0]+'" role="tab" aria-selected="'+(keeperTab===t[0])+'">'+icon(t[2],'ge-ic-sm')+t[1]+'</button>').join('')+'</div>'+(S.keepers.length?npcBlurb('archive'):'');
  /* P3-W2: keeper-vault screen extended with breeder library tabs (never forked) */
  let shelf;
  if(keeperTab==='vault') shelf=keepersVaultHtml();
  else if(keeperTab==='mothers') shelf=mothersHtml();
  else if(keeperTab==='seeds') shelf=P3W2_seedsHtml();
  else if(keeperTab==='customs') shelf=P3W2_customsHtml();
  else if(keeperTab==='archive') shelf=P3W2_archiveHtml();
  else if(keeperTab==='project0') shelf=P3W2_p0Html();
  else { keeperTab='vault'; shelf=keepersVaultHtml(); }
  html+='<div class="vault-shelf">'+shelf+'</div>';
  html+='</div>';
  r.innerHTML=html;
  r.querySelectorAll('[data-ktab]').forEach(t=>t.onclick=()=>{ keeperTab=t.dataset.ktab; keeperPage=0; RENDER.keepers(); });
  /* P3-W6: wire endgame cross-link buttons (e.g. maxed-vault -> Project 0) */
  r.querySelectorAll('[data-ex-go]').forEach(b=>b.onclick=()=>{
    if(b.dataset.exTab) empireTab=b.dataset.exTab;
    show(b.dataset.exGo);
  });
  wireKeepers(r);
};

function keeperSortVal(k){
  switch(keeperSort){
    case 'resinPot': return k.genetics.resinPot;
    case 'terpenePot': return k.genetics.terpenePot;
    case 'yieldPot': return k.genetics.yieldPot;
    case 'potencyPot': return k.genetics.potencyPot;
    case 'newest': return k.dayFound;
    case 'oldest': return -k.dayFound;
    default: return k.overall;
  }
}
function keepersVaultHtml(){
  let html='<div class="ge-card"><div class="ge-card-head">'+icon('keepers','ge-ic-md')+'<h3>VAULT CAPACITY</h3></div>'+
   '<div class="ge-datarow"><span>'+icon('keepers','ge-ic-sm')+'Slots used</span><b class="ge-num">'+S.keepers.length+' / '+S.keeperCapacity+'</b></div>';
  const lvl=S.keeperCapLevel, next=lvl+1;
  if(next<KEEPER_CAPS.length){
    const cost=KEEPER_CAP_COSTS[next], gate=keeperCapGate(next);
    html+='<div class="ge-datarow"><span>'+icon('plus','ge-ic-sm')+'Next: '+KEEPER_CAPS[next]+' slots</span><b class="ge-num">'+fmt$(cost)+'</b></div>'+
     (gate?'<p class="ge-caption">'+icon('lock','ge-ic-sm')+' '+esc(gate)+'</p>':'<button class="ge-btn ge-btn-gold" id="cap-up">'+icon('plus','ge-ic-sm')+'UPGRADE VAULT</button>');
  } else html+='<p class="ge-caption">'+icon('check','ge-ic-sm')+' Vault maxed at '+S.keeperCapacity+' slots.</p>'+
   /* P3-W6 endgame cross-link: a full vault points at preservation, not at stopping. */
   '<p class="ge-caption ge-muted">Every keeper has a home. The frontier now: push a line through the Project 0 tiers to LEGACY.</p>'+
   '<div class="ge-btn-row"><button class="ge-btn ge-btn-ghost ge-btn-sm" data-ex-go="project0">PROJECT 0</button></div>';
  html+='</div>';
  if(!S.keepers.length){
    return html+'<div class="ge-card ge-empty"><div>'+icon('keepers','ge-ic-xl')+'</div><h3>NO KEEPERS YET</h3><p>Harvest plants, review the phenotype report, and keep the exceptional ones.</p></div>';
  }
  const strains=[...new Set(S.keepers.map(k=>k.strainId))];
  html+='<div class="ge-card ge-card-flat"><div class="ge-filter-row">'+
   '<select id="ksort" class="ge-select" aria-label="Sort keepers">'+KEEPER_SORTS.map(s=>'<option value="'+s[0]+'"'+(keeperSort===s[0]?' selected':'')+'>'+s[1]+'</option>').join('')+'</select>'+
   '<select id="kfilter" class="ge-select" aria-label="Filter keepers"><option value="all">ALL STRAINS</option>'+strains.map(id=>{const st=getStrain(id);return '<option value="'+id+'"'+(keeperFilter===id?' selected':'')+'>'+esc(st?st.name:id)+'</option>';}).join('')+'</select></div></div>';
  let list=S.keepers.filter(k=>keeperFilter==='all'||k.strainId===keeperFilter);
  list=list.slice().sort((a,b)=>keeperSortVal(b)-keeperSortVal(a));
  const perPage=12, pages=Math.max(1,Math.ceil(list.length/perPage));
  keeperPage=clamp(keeperPage,0,pages-1);
  const page=list.slice(keeperPage*perPage,keeperPage*perPage+perPage);
  page.forEach(k=>{
    const bars=[['Resin',k.genetics.resinPot],['Terpenes',k.genetics.terpenePot],['Yield',k.genetics.yieldPot],['Potency',k.genetics.potencyPot]];
    html+='<div class="ge-card ge-spec-card keeper-card r-'+k.rarity+'"><div class="ge-spec-art">'+flowerSVG(k.strainId+'#'+k.phenoNum,'keeper-flower')+'</div>'+
     '<div class="ge-spec-main">'+
     '<div class="ge-spec-top"><h3 class="ge-spec-name">'+(k.rarity==='legendary'?icon('crown-gold','ge-ic-sm'):icon('keepers','ge-ic-sm'))+esc(k.strainName)+' <span class="ge-num">#'+k.phenoNum+'</span></h3></div>'+
     '<div class="ge-spec-badges">'+rarityBadge(k)+(k.legendaryTrait?' <span class="ge-badge ge-badge-legendary">'+icon('crown-gold','ge-ic-sm')+esc(k.legendaryTrait)+'</span>':'')+'</div>'+
     '<div class="ge-datarow"><span>'+icon('star','ge-ic-sm')+'Overall</span><b class="ge-num">'+k.overall+'</b></div>'+
     '<div class="ge-datarow"><span>'+icon('harvest','ge-ic-sm')+'Best harvest</span><b class="ge-num">Q'+k.bestQuality+' • '+k.bestYield+' oz</b></div>'+
     '<div class="ge-datarow"><span>'+icon('clone','ge-ic-sm')+'Clones grown</span><b class="ge-num">'+k.clonesGrown+'</b></div>'+
     bars.map(b=>'<div class="ge-progress-meta"><span>'+b[0]+'</span><b>'+Math.round(num(b[1],0))+'</b></div><div class="ge-progress ge-progress-thin"><i style="width:'+clamp(Math.round(num(b[1],0)),0,100)+'%"></i></div>').join('')+
     (k.traits.length?'<div class="ge-tags">'+k.traits.slice(0,6).map(t=>'<span class="ge-pill ge-pill-neutral">'+esc(t)+'</span>').join('')+'</div>':'')+
     '<div class="btn-row ge-btn-row"><button class="ge-btn ge-btn-sm ge-btn-primary" data-mother="'+k.id+'">'+icon('mothers','ge-ic-sm')+'MOTHER</button>'+
     '<button class="ge-btn ge-btn-sm ge-btn-ghost" data-cmp="'+k.id+'">'+icon('scroll','ge-ic-sm')+'COMPARE</button>'+
     '<button class="ge-btn ge-btn-sm ge-btn-danger ge-iconbtn" data-delk="'+k.id+'" aria-label="Remove keeper">'+icon('x','ge-ic-sm')+'</button></div></div></div>';
  });
  if(pages>1) html+='<div class="ge-btn-row"><button class="ge-btn ge-btn-sm ge-btn-ghost" id="kprev"'+(keeperPage===0?' disabled':'')+'>‹ PREV</button>'+
   '<button class="ge-btn ge-btn-sm ge-btn-ghost" disabled>'+(keeperPage+1)+'/'+pages+'</button>'+
   '<button class="ge-btn ge-btn-sm ge-btn-ghost" id="knext"'+(keeperPage>=pages-1?' disabled':'')+'>NEXT ›</button></div>';
  return html;
}

function mothersHtml(){
  let html='<div class="ge-card"><div class="ge-card-head">'+icon('mothers','ge-ic-md')+'<h3>MOTHER ROOM</h3></div>'+
   '<div class="ge-datarow"><span>'+icon('mothers','ge-ic-sm')+'Mother slots</span><b class="ge-num">'+S.mothers.length+' / '+S.motherCapacity+'</b></div>'+
   '<p class="ge-caption ge-muted">Mothers preserve keeper genetics forever. Clones grow the EXACT same phenotype — seed = new pheno, clone = preserved pheno.</p></div>';
  if(!S.mothers.length) html+='<div class="ge-card ge-empty"><div>'+icon('mothers','ge-ic-xl')+'</div><h3>NO MOTHERS YET</h3><p>Promote a keeper with MOTHER.</p></div>';
  S.mothers.forEach(mo=>{
    const avgQ=mo.qualities.length?Math.round(mo.qualities.reduce((a,b)=>a+b,0)/mo.qualities.length):0;
    const avgY=mo.yields.length?Math.round(mo.yields.reduce((a,b)=>a+b,0)/mo.yields.length*10)/10:0;
    const bars=[['Resin',mo.genetics.resinPot],['Terpenes',mo.genetics.terpenePot],['Yield',mo.genetics.yieldPot]];
    html+='<div class="ge-card ge-spec-card keeper-card mother-card r-'+mo.rarity+'"><div class="ge-spec-art">'+plantSVG(4,mo.strainId+'#'+mo.phenoNum,'mother-plant',{bushy:true,frost:1,dense:true})+'</div>'+
     '<div class="ge-spec-main">'+
     '<div class="ge-spec-top"><h3 class="ge-spec-name">'+icon('mothers','ge-ic-sm')+esc(mo.strainName)+' <span class="ge-num">#'+mo.phenoNum+'</span> <span class="ge-badge ge-badge-mother">MOTHER</span></h3></div>'+
     '<div class="ge-spec-badges">'+rarityBadge({rarity:mo.rarity})+(mo.legendaryTrait?' <span class="ge-badge ge-badge-legendary">'+icon('crown-gold','ge-ic-sm')+esc(mo.legendaryTrait)+'</span>':'')+'</div>'+
     bars.map(b=>'<div class="ge-progress-meta"><span>'+b[0]+'</span><b>'+Math.round(num(b[1],0))+'</b></div><div class="ge-progress ge-progress-thin"><i style="width:'+clamp(Math.round(num(b[1],0)),0,100)+'%"></i></div>').join('')+
     '<div class="ge-datarow"><span>'+icon('clone','ge-ic-sm')+'Clones taken</span><b class="ge-num">'+mo.clonesTaken+'</b></div>'+
     '<div class="ge-datarow"><span>'+icon('grow','ge-ic-sm')+'Clone runs</span><b class="ge-num">'+mo.runs+'</b></div>'+
     '<div class="ge-datarow"><span>'+icon('trophy','ge-ic-sm')+'Best clone harvest</span><b class="ge-num">'+(mo.runs?'Q'+mo.bestQ+' • '+mo.bestY+' oz':'—')+'</b></div>'+
     '<div class="ge-datarow"><span>'+icon('star','ge-ic-sm')+'Avg clone</span><b class="ge-num">'+(mo.runs?'Q'+avgQ+' • '+avgY+' oz':'—')+'</b></div>'+
     (mo.awards.length?'<div class="ge-tags">'+mo.awards.slice(-4).map(a=>'<span class="ge-pill ge-pill-gold">'+esc(a)+'</span>').join('')+'</div>':'')+
     '<div class="btn-row ge-btn-row"><button class="ge-btn ge-btn-sm ge-btn-primary" data-clone="'+mo.id+'">'+icon('clone','ge-ic-sm')+'TAKE CLONE ($25)</button>'+
     '<button class="ge-btn ge-btn-sm ge-btn-danger" data-delm="'+mo.id+'">'+icon('x','ge-ic-sm')+'RETIRE</button></div></div></div>';
  });
  return html;
}

function wireKeepers(r){
  const cu=$('cap-up'); if(cu) cu.onclick=()=>{
    const next=S.keeperCapLevel+1, cost=KEEPER_CAP_COSTS[next], gate=keeperCapGate(next);
    if(gate){ toast(icon('lock','ge-ic-md')+' '+esc(gate)); return; }
    if(S.cash<cost){ toast(icon('x','ge-ic-md')+' Need '+fmt$(cost)+'.'); return; }
    S.cash-=cost; S.keeperCapLevel=next; S.keeperCapacity=KEEPER_CAPS[next];
    S.stats.keeperCapUpgrades++; gainXP(100);
    toast(icon('crown','ge-ic-md')+' Vault expanded to '+S.keeperCapacity+' slots!');
    save(); updateHUD(); checkMissions(); RENDER.keepers();
  };
  const ks=$('ksort'); if(ks) ks.onchange=e=>{ keeperSort=e.target.value; keeperPage=0; RENDER.keepers(); };
  const kf=$('kfilter'); if(kf) kf.onchange=e=>{ keeperFilter=e.target.value; keeperPage=0; RENDER.keepers(); };
  const kp=$('kprev'); if(kp) kp.onclick=()=>{ keeperPage--; RENDER.keepers(); };
  const kn=$('knext'); if(kn) kn.onclick=()=>{ keeperPage++; RENDER.keepers(); };
  r.querySelectorAll('[data-mother]').forEach(b=>b.onclick=()=>promoteMother(b.dataset.mother));
  r.querySelectorAll('[data-cmp]').forEach(b=>b.onclick=()=>pickComparePartner(b.dataset.cmp));
  r.querySelectorAll('[data-delk]').forEach(b=>b.onclick=()=>removeKeeper(b.dataset.delk));
  r.querySelectorAll('[data-clone]').forEach(b=>b.onclick=()=>takeClone(b.dataset.clone));
  r.querySelectorAll('[data-delm]').forEach(b=>b.onclick=()=>removeMother(b.dataset.delm));
  try{ P3W2_wireVault(r); }catch(e){} /* P3-W2: vault tab buttons */
}

/* ============================================================
   SHOCKER OWNZ GROW EMPIRE — EXPANSION A: WORLD & ECONOMY
   Builder A ("World & Economy").
   Concatenated AFTER game.js. No imports/exports. 'use strict' safe.
   ALL top-level identifiers are WX_-prefixed (plus RENDER.challenges).
   Integrator hooks are documented in the Builder A report manifest.
   ============================================================ */
'use strict';

/* ---------------- exclusive state namespace: S.wx ---------------- */
function WX_init(){
  if(typeof S==='undefined'||!S) return;
  if(!S.wx||typeof S.wx!=='object') S.wx={};
  var w=S.wx;
  if(!Array.isArray(w.events)) w.events=[];
  if(!w.cool||typeof w.cool!=='object') w.cool={};
  if(!w.market||typeof w.market!=='object') w.market={};
  w.mday=Math.max(1,int(w.mday,1));
  if(typeof w.mktNext==='undefined') w.mktNext=1; else w.mktNext=Math.max(1,int(w.mktNext,1));
  if(!Array.isArray(w.offers)) w.offers=[];
  if(!Array.isArray(w.contracts)) w.contracts=[];
  w.chDone=Math.max(0,int(w.chDone,0));
  if(!w.chal||typeof w.chal!=='object') w.chal={daily:null,weekly:null,hist:[]};
  if(w.chal.daily!==null&&typeof w.chal.daily!=='object') w.chal.daily=null;
  if(w.chal.weekly!==null&&typeof w.chal.weekly!=='object') w.chal.weekly=null;
  if(!Array.isArray(w.chal.hist)) w.chal.hist=[];
  w.cday=Math.max(1,int(w.cday,1));
  if(!w.stats||typeof w.stats!=='object') w.stats={contractsDone:0};
  w.stats.contractsDone=Math.max(0,int(w.stats.contractsDone,0));
  if(typeof w.seq==='undefined') w.seq=1; else w.seq=Math.max(1,int(w.seq,1));
  Object.keys(w.market).forEach(function(k){
    var e=w.market[k];
    if(!e||typeof e!=='object'){ delete w.market[k]; return; }
    if(['high','normal','low','collector'].indexOf(e.demand)<0) e.demand='normal';
    e.mult=num(e.mult,1); e.days=Math.max(0,int(e.days,0));
    if(e.days<=0||e.demand==='normal') delete w.market[k];
  });
  WX_seedMarket();
  WX_mergeBuyers();
}

/* ---------------- extra buyer classes (merged into BUYERS once) ---------------- */
var WX_buyersMerged=false;
const WX_EXTRA_BUYERS=[
 {id:'wx-budget',npc:null,name:'Bulk Bargain Bob',title:'BUDGET WHOLESALER',
  values:'Pays up to +35% for BULK. Penalizes premium pricing.',blurb:'"Weight over hype. Bring me volume."',
  mult:function(it){ return clamp(1.25-num(it.quality,0)*0.004+num(it.amount,0)*0.01,0.8,1.35); }},
 {id:'wx-premium',npc:'lena',name:'Vivienne Luxe',title:'PREMIUM CONNOISSEUR',
  values:'Pays up to +100% for BAG APPEAL + POTENCY + RESIN.',blurb:'"Only the finest touches my shelf."',
  mult:function(it){ return 1+((num(it.bagAppeal,0)+num(it.potency,0)+num(it.resin,0))/300)*1.0+(num(it.quality,0)>=90?0.2:0); }},
 {id:'wx-curator',npc:'archive',name:'The Curator',title:'GENETICS COLLECTOR',
  values:'+90% for CUSTOM crosses. +30% for 90+ quality.',blurb:'"One-of-one cuts only."',
  mult:function(it){ return (it.custom?1.9:1.0)+(num(it.quality,0)>=90?0.3:0); }}
];
function WX_mergeBuyers(){
  if(WX_buyersMerged) return;
  if(typeof BUYERS==='undefined'||!Array.isArray(BUYERS)) return;
  WX_EXTRA_BUYERS.forEach(function(b){
    if(b&&b.id&&!BUYERS.some(function(x){ return x&&x.id===b.id; })) BUYERS.push(b);
  });
  WX_buyersMerged=true;
}

/* ---------------- guarded cross-builder reads ---------------- */
function WX_exEmp(role){
  try{ if(typeof EX_employeeBonus==='function') return num(EX_employeeBonus(role),0); }catch(e){}
  return 0;
}

/* ============================================================
   1. GLOBAL EVENT ENGINE
   ============================================================ */
function WX_powerCost(){
  var base=120*(int(S.facility,0)+1), gen=0;
  try{ if(typeof EX_buildingLevel==='function') gen=num(EX_buildingLevel('generator'),0); }catch(e){}
  return Math.max(40,Math.round(base*(1-Math.min(0.6,gen*0.25))));
}
function WX_extermCost(){ return Math.min(300,40+15*S.plants.length); }
function WX_heatCost(){ return 100+50*int(S.facility,0); }
function WX_clearPests(addStress){
  S.plants.forEach(function(p){
    if((p.problems||[]).indexOf('Pests')>=0){
      p.problems=p.problems.filter(function(x){ return x!=='Pests'; });
      if(addStress) p.stress=clamp(num(p.stress,0)+6,0,100);
    }
  });
}
function WX_equipFailCost(ev){
  var d=null;
  if(typeof EQUIP_DEFS!=='undefined') d=EQUIP_DEFS.find(function(x){ return x.id===ev.data.equip; });
  var lvl=d?num(S.equipment[d.id],1):1;
  if(d&&typeof equipCost==='function') return Math.max(50,Math.round(equipCost(d,lvl)*0.5));
  return 75;
}
function WX_equipName(id){
  if(typeof EQUIP_DEFS!=='undefined'){ var d=EQUIP_DEFS.find(function(x){ return x.id===id; }); if(d) return d.name; }
  return id;
}
function WX_boomTags(){
  var tags=[];
  S.inventory.forEach(function(it){
    var st=typeof getStrain==='function'?getStrain(it.strainId):null;
    (st&&st.tags||[]).forEach(function(t){ if(tags.indexOf(t)<0) tags.push(t); });
  });
  return tags;
}
function WX_allTags(){
  var tags=[];
  if(typeof STRAINS!=='undefined') STRAINS.forEach(function(st){ (st.tags||[]).forEach(function(t){ if(tags.indexOf(t)<0) tags.push(t); }); });
  return tags.length?tags:['Exotic'];
}
function WX_applyBoom(tag,days){
  if(typeof allStrains!=='function') return;
  allStrains().forEach(function(st){
    if(st.tags&&st.tags.indexOf(tag)>=0) S.wx.market[st.id]={demand:'high',mult:1.35,days:days};
  });
  toast(WX_ic('chart','ge-ic-md')+' MARKET BOOM: '+esc(tag)+' strains in HIGH demand for '+days+' days!');
}


const WX_EVENT_DEFS=[
 /* ---- POWER OUTAGE (COMMON) ---- */
 { id:'wx-powerout', rarity:'COMMON', weight:22, cd:12, dur:[2,3],
   title:'POWER OUTAGE',
   text:function(){ return 'The grid just dropped your block. Backup batteries are draining — environmental controls are running weak (-15 env score) until power returns.'; },
   canRoll:function(){ return true; },
   onStart:function(){},
   choices:[
    {label:'EMERGENCY GENERATOR', sub:function(){ return 'Pay '+fmt$(WX_powerCost())+' — full power restored now'; },
     run:function(){ var c=WX_powerCost(); if(S.cash<c){ toast(WX_ic('x','ge-ic-md')+' Need '+fmt$(c)+'.'); return; } S.cash-=c; toast(WX_ic('lighting','ge-ic-md')+' Emergency power online. Crisis over.'); return 'end'; }},
    {label:'RIDE IT OUT', sub:'Keep the penalty until the grid returns',
     run:function(){ toast('Riding it out… env controls stay weakened.'); }}
   ]},
 /* ---- PEST OUTBREAK (COMMON) ---- */
 { id:'wx-pests', rarity:'COMMON', weight:20, cd:10, dur:[4,5],
   title:'PEST OUTBREAK',
   text:function(){ return 'Scouts found pests spreading across the facility. Several plants are already hit — ignore it and they will spread to the whole room.'; },
   canRoll:function(){ return S.plants.length>0; },
   onStart:function(ev){
     var cands=S.plants.slice(), n=Math.min(cands.length,2+rndi(0,1)), i;
     for(i=0;i<n&&cands.length;i++){
       var p=cands.splice(rndi(0,cands.length-1),1)[0];
       p.problems=p.problems||[];
       if(p.problems.indexOf('Pests')<0) p.problems.push('Pests');
       p.health=clamp(num(p.health,100)-10,0,100);
     }
   },
   choices:[
    {label:'CALL EXTERMINATOR', sub:function(){ return 'Pay '+fmt$(WX_extermCost())+' — clears the whole facility'; },
     run:function(){ var c=WX_extermCost(); if(S.cash<c){ toast(WX_ic('x','ge-ic-md')+' Need '+fmt$(c)+'.'); return; } S.cash-=c; WX_clearPests(false); toast(WX_ic('check','ge-ic-md')+' Exterminator cleared the facility.'); return 'end'; }},
    {label:'NEEM OIL TREATMENT', sub:'Pay $25 — clears pests, +stress to hit plants',
     run:function(){ if(S.cash<25){ toast(WX_ic('x','ge-ic-md')+' Need $25.'); return; } S.cash-=25; WX_clearPests(true); toast(WX_ic('leaf','ge-ic-md')+' Neem applied. Pests gone.'); return 'end'; }},
    {label:'IGNORE IT', sub:'Pests spread to more plants each day',
     run:function(ev){ ev.data.ignored=true; toast(WX_ic('warn','ge-ic-md')+' Ignored… the outbreak will spread.'); }}
   ]},
 /* ---- EQUIPMENT FAILURE (UNCOMMON) ---- */
 { id:'wx-equipfail', rarity:'UNCOMMON', weight:16, cd:12, dur:[3,4],
   title:'EQUIPMENT FAILURE',
   text:function(ev){ return 'Your '+WX_equipName(ev.data.equip)+' just failed. It is offline until repaired or replaced — the room runs degraded while it is down.'; },
   canRoll:function(){ return true; },
   onStart:function(ev){ ev.data.equip=pick(['lights','hvac','co2sys','irrigation','nutrients','drycure']); },
   choices:[
    {label:'REPAIR NOW', sub:function(ev){ return 'Pay '+fmt$(WX_equipFailCost(ev))+' — back online today'; },
     run:function(ev){ var c=WX_equipFailCost(ev); if(S.cash<c){ toast(WX_ic('x','ge-ic-md')+' Need '+fmt$(c)+'.'); return; } S.cash-=c; toast(WX_ic('equipment','ge-ic-md')+' '+esc(WX_equipName(ev.data.equip))+' repaired.'); return 'end'; }},
    {label:'RUN DEGRADED', sub:'Keep growing with it offline until it recovers',
     run:function(ev){ toast(WX_ic('warn','ge-ic-md')+' Running degraded — '+esc(WX_equipName(ev.data.equip))+' offline.'); }}
   ]},
 /* ---- HEAT WAVE (UNCOMMON) ---- */
 { id:'wx-heatwave', rarity:'UNCOMMON', weight:12, cd:14, dur:[3,4],
   title:'HEAT WAVE',
   text:function(){ return 'A brutal heat wave parks over the city. Room temperature climbs every day — dial in cooling or watch the plants cook.'; },
   canRoll:function(){ return true; },
   onStart:function(){},
   choices:[
    {label:'EMERGENCY COOLING', sub:function(){ return 'Pay '+fmt$(WX_heatCost())+' — heat wave neutralized'; },
     run:function(){ var c=WX_heatCost(); if(S.cash<c){ toast(WX_ic('x','ge-ic-md')+' Need '+fmt$(c)+'.'); return; } S.cash-=c; toast(WX_ic('temp','ge-ic-md')+' Portable ACs deployed. Heat beaten.'); return 'end'; }},
    {label:'NIGHT VENTING', sub:'Free — halves the daily temperature climb',
     run:function(ev){ ev.data.vent=true; toast(WX_ic('hvac','ge-ic-md')+' Night venting scheduled.'); }},
    {label:'RIDE IT OUT', sub:'Temperature climbs +4°F every day',
     run:function(){ toast(WX_ic('temp','ge-ic-md')+' Riding it out… watch those thermometers.'); }}
   ]},
 /* ---- SUPPLIER SALE (UNCOMMON) ---- */
 { id:'wx-sale', rarity:'UNCOMMON', weight:14, cd:10, dur:[2,2],
   title:'SUPPLIER SALE',
   text:function(ev){ return 'Big Sal is overstocked and slashing prices: equipment AND genetics are '+Math.round((1-ev.data.disc)*100)+'% OFF for '+ev.daysLeft+' more day(s). His loss, your gain.'; },
   canRoll:function(){ return S.day>=5; },
   onStart:function(ev){ ev.data.disc=pick([0.6,0.65,0.7]); },
   choices:[
    {label:'EQUIPMENT ORDER', sub:function(ev){ return 'Auto-buy your cheapest upgrade at '+Math.round((1-ev.data.disc)*100)+'% off'; },
     run:function(ev){
       if(typeof EQUIP_DEFS==='undefined'||typeof equipCost!=='function'){ toast('No equipment depot available.'); return; }
       var best=null,bestCost=Infinity;
       EQUIP_DEFS.forEach(function(d){
         var lvl=num(S.equipment[d.id],1);
         if(lvl>=d.max) return;
         var c=equipCost(d,lvl);
         if(c<bestCost){ bestCost=c; best=d; }
       });
       if(!best){ toast('All equipment already maxed out.'); return; }
       var cost=Math.max(1,Math.round(bestCost*ev.data.disc));
       if(S.cash<cost){ toast(WX_ic('x','ge-ic-md')+' Need '+fmt$(cost)+'.'); return; }
       S.cash-=cost; S.equipment[best.id]=num(S.equipment[best.id],1)+1;
       if(S.stats) S.stats.equipmentBought=(S.stats.equipmentBought||0)+1; /* P1.5 */
       if(typeof gainXP==='function') gainXP(40);
       toast(WX_ic('arrow-right','ge-ic-md')+' '+esc(best.name)+' → Lv '+S.equipment[best.id]+' (sale: '+fmt$(cost)+')');
     }},
    {label:'GENETICS GRAB', sub:function(ev){ return 'Unlock a cash-locked strain at '+Math.round((1-ev.data.disc)*100)+'% off'; },
     run:function(ev){
       var cands=STRAINS.filter(function(st){ return st.lock&&st.lock.t==='cash'&&S.lockedStrains.indexOf(st.id)>=0; });
       if(!cands.length){ toast('No cash-locked genetics left to grab.'); return; }
       var st=cands[0], cost=Math.max(1,Math.round(st.seed*3*ev.data.disc));
       if(S.cash<cost){ toast(WX_ic('x','ge-ic-md')+' Need '+fmt$(cost)+' for '+esc(st.name)+'.'); return; }
       S.cash-=cost;
       if(typeof unlockStrain==='function') unlockStrain(st.id,true); /* cash purchase = acquisition */
     }},
    {label:'JUST BROWSING', sub:'The sale stays live — shop at your own pace',
     run:function(){ toast(WX_ic('cart','ge-ic-md')+' Sale stays live for now. Check the depot.'); }}
   ]},
 /* ---- MARKET BOOM (RARE) ---- */
 { id:'wx-boom', rarity:'RARE', weight:8, cd:12, dur:[3,3],
   title:'MARKET BOOM',
   text:function(){ return 'Buyers are buzzing about a specific profile and paying TOP DOLLAR. Steer the boom toward what you can actually sell — or speculate on a random wave.'; },
   canRoll:function(){ return S.inventory.length>0; },
   onStart:function(){},
   choices:[
    {label:'SELL INTO THE BOOM', sub:'Boom targets YOUR inventory profiles — 3 days of HIGH demand',
     run:function(){
       var tags=WX_boomTags(); if(!tags.length) tags=WX_allTags();
       WX_applyBoom(pick(tags),3); return 'end';
     }},
    {label:'SPECULATE', sub:'Random profile booms for 4 days — bigger wave, bigger risk',
     run:function(){ WX_applyBoom(pick(WX_allTags()),4); return 'end'; }}
   ]},
 /* ---- RARE GENETICS OPPORTUNITY (RARE) ---- */
 { id:'wx-rare', rarity:'RARE', weight:5, cd:20, dur:[2,2],
   title:'RARE GENETICS OPPORTUNITY',
   text:function(ev){
     var st=ev.data.offerId&&typeof getStrain==='function'?getStrain(ev.data.offerId):null;
     if(!st) return 'A collector pinged you, but the cut fell through.';
     return 'A private collector offers "'+st.name+'" genetics — normally locked behind reputation — for a premium of '+fmt$(st.seed*5)+'. This offer expires soon.';
   },
   canRoll:function(){
     return S.day>=10&&S.lockedStrains.some(function(id){
       var st=typeof getStrain==='function'?getStrain(id):null;
       return st&&st.lock&&st.lock.t!=='cash';
     });
   },
   onStart:function(ev){
     var cands=S.lockedStrains.filter(function(id){
       var st=typeof getStrain==='function'?getStrain(id):null;
       return st&&st.lock&&st.lock.t!=='cash';
     });
     ev.data.offerId=cands.length?pick(cands):null;
   },
   choices:[
    {label:'BUY THE GENETICS', sub:function(ev){ var st=ev.data.offerId?getStrain(ev.data.offerId):null; return st?('Pay '+fmt$(st.seed*5)+' — unlock it now'):'Offer expired'; },
     run:function(ev){
       var st=ev.data.offerId?getStrain(ev.data.offerId):null; if(!st) return 'end';
       var cost=st.seed*5;
       if(S.cash<cost){ toast(WX_ic('x','ge-ic-md')+' Need '+fmt$(cost)+'.'); return; }
       S.cash-=cost;
       if(typeof unlockStrain==='function') unlockStrain(st.id,true); /* cash purchase = acquisition */
       if(typeof gainXP==='function') gainXP(50);
       return 'end';
     }},
    {label:'DECLINE', sub:'Pass on the offer', run:function(){ toast('The collector moves on.'); return 'end'; }}
   ], dismissEnds:true},
 /* ---- COMPETITION INVITATION (RARE) ---- */
 { id:'wx-comp', rarity:'RARE', weight:5, cd:25, dur:[3,3],
   title:'COMPETITION INVITATION',
   text:function(){ return 'Word of your harvests is spreading. The regional circuit invites you to the COMPETITION ARENA — scouts will be watching.'; },
   canRoll:function(){ return int(S.reputation,0)>=100||num(S.stats.bestQuality,0)>=85; },
   onStart:function(){},
   choices:[
    {label:'ACCEPT INVITATION', sub:'+5 rep — head to the arena',
     run:function(){
       if(typeof gainRep==='function') gainRep(5);
       toast(WX_ic('trophy','ge-ic-md')+' Invitation accepted! Make the empire proud.');
       try{ if(typeof empireTab!=='undefined') empireTab='compete'; }catch(e){}
       if(typeof show==='function') show('empire');
       return 'end';
     }},
    {label:'DECLINE', sub:'Maybe next season', run:function(){ toast('You sit this one out.'); return 'end'; }}
   ], dismissEnds:true},
 /* ---- PROJECT 0 PRESERVATION EVENT (LEGENDARY) ---- */
 { id:'wx-p0', rarity:'LEGENDARY', weight:2, cd:30, dur:[4,4],
   title:'PROJECT 0: PRESERVATION CALL',
   text:function(){ return 'Archivist Quinn reaches out personally. Project 0 seeks a proven keeper cut for the permanent vault — a donation echoes through every track.'; },
   canRoll:function(){ return S.day>=30; },
   onStart:function(){},
   choices:[
    {label:'DONATE A KEEPER', sub:function(){ return S.keepers.length?('Give up your weakest keeper — +10 P0, +15 rep'):'No keepers in your vault yet'; },
     run:function(){
       if(!S.keepers.length){ toast('No keepers to donate yet.'); return; }
       var k=S.keepers.slice().sort(function(a,b){ return num(a.overall,0)-num(b.overall,0); })[0];
       S.keepers=S.keepers.filter(function(x){ return x.id!==k.id; });
       if(typeof addP0==='function') addP0('preservation',10);
       if(typeof gainRep==='function') gainRep(15);
       toast(WX_ic('project0','ge-ic-md')+' Keeper "'+esc(k.strainName)+' #'+int(k.phenoNum,0)+'" preserved forever. +10 P0, +15 rep');
       return 'end';
     }},
    {label:'PLEDGE A FUTURE KEEPER', sub:'+3 P0 — the vault remembers promises',
     run:function(){ if(typeof addP0==='function') addP0('preservation',3); toast(WX_ic('project0','ge-ic-md')+' Your pledge is recorded. +3 P0'); return 'end'; }}
   ], dismissEnds:true}
];

function WX_activeEvent(defId){
  if(typeof S==='undefined'||!S||!S.wx) return null;
  for(var i=0;i<S.wx.events.length;i++) if(S.wx.events[i].def===defId) return S.wx.events[i];
  return null;
}
function WX_eventWeight(d){
  var wt=d.weight;
  if(d.id==='wx-powerout') wt*=Math.max(0.45,1-num(S.equipment.hvac,1)*0.1);
  if(d.id==='wx-equipfail'&&typeof avgEquip==='function') wt*=Math.max(0.6,1.15-avgEquip()*0.11);
  if(d.id==='wx-heatwave') wt*=Math.max(0.5,1-num(S.equipment.hvac,1)*0.09);
  if(d.id==='wx-pests'&&S.crew.health) wt*=0.7;
  return Math.max(0.5,wt);
}
function WX_rollEvent(){
  var w=S.wx, elig=[], i, tot=0;
  for(i=0;i<WX_EVENT_DEFS.length;i++){
    var d=WX_EVENT_DEFS[i], ok=false;
    try{ ok=d.canRoll(); }catch(e){ ok=false; }
    if(!ok) continue;
    if(S.day<int(w.cool[d.id]||0,0)) continue;
    var wt=WX_eventWeight(d);
    elig.push({d:d,wt:wt}); tot+=wt;
  }
  if(!elig.length) return null;
  var base=0.15*(S.difficulty==='master'?1.2:S.difficulty==='beginner'?0.85:1.0);
  if(Math.random()>base) return null;
  var r=Math.random()*tot, d=null;
  for(i=0;i<elig.length;i++){ r-=elig[i].wt; if(r<=0){ d=elig[i].d; break; } }
  if(!d) d=elig[elig.length-1].d;
  var ev={uid:'wxev'+(w.seq++), def:d.id, title:d.title, daysLeft:rndi(d.dur[0],d.dur[1]), cd:d.cd, data:{}};
  try{ d.onStart(ev); }catch(e){}
  w.cool[d.id]=S.day+d.cd+rndi(0,8);
  return ev;
}
function WX_eventDayTick(ev){
  if(ev.def==='wx-pests'&&ev.data.ignored&&S.plants.length){
    var cands=S.plants.filter(function(p){ return (p.problems||[]).indexOf('Pests')<0; });
    if(cands.length){
      var p=pick(cands);
      p.problems=p.problems||[]; p.problems.push('Pests');
      p.health=clamp(num(p.health,100)-8,0,100);
    }
  }
  if(ev.def==='wx-heatwave'){
    var rise=ev.data.vent?2:4;
    S.env.temp=clamp(num(S.env.temp,76)+rise,60,95);
  }
  /* P2-4: decision-event day ticks (temporary ventilation heat climb) */
  try{ if(typeof P2EV_dayTick==='function') P2EV_dayTick(ev); }catch(e){}
}
function WX_endEvent(uid,expired){
  var w=S.wx; if(!w) return;
  var ev=null;
  w.events=w.events.filter(function(e){ if(e.uid===uid){ ev=e; return false; } return true; });
  if(w.pending&&w.pending.uid===uid) w.pending=null;
  if(expired&&ev) toast('Event passed: '+esc(ev.title));
}

function WX_tickEvents(){
  var w=S.wx; if(!w) return;
  var keep=[];
  w.events.forEach(function(ev){
    ev.daysLeft=int(ev.daysLeft,1)-1;
    try{ WX_eventDayTick(ev); }catch(e){}
    if(ev.daysLeft>0) keep.push(ev);
    else WX_endEvent(ev.uid,true);
  });
  w.events=keep;
  if(w.events.length>0||w.pending) return;
  if(S.day<3) return;
  var ev=WX_rollEvent();
  if(ev){ w.events.push(ev); w.pending={uid:ev.uid}; }
}
function WX_showPendingEvent(){
  if(typeof S==='undefined'||!S||!S.wx) return;
  var w=S.wx;
  if(!w.pending) return;
  var ev=null, i;
  for(i=0;i<w.events.length;i++) if(w.events[i].uid===w.pending.uid) ev=w.events[i];
  w.pending=null;
  if(!ev) return;
  var def=null;
  for(i=0;i<WX_EVENT_DEFS.length;i++) if(WX_EVENT_DEFS[i].id===ev.def) def=WX_EVENT_DEFS[i];
  if(!def) return;
  var html='<div class="ge-wx-ev"><span class="ge-pill '+WX_rarPill(def.rarity)+'">'+WX_ic('warn','ge-ic-sm')+def.rarity+' EVENT</span>'+
   '<h3 class="ge-h2">'+esc(ev.title)+'</h3><p class="ge-body ge-muted">'+esc(def.text(ev))+'</p>';
  if(ev.daysLeft>0) html+='<p class="ge-caption ge-muted">Active for '+int(ev.daysLeft,0)+' more day(s). Manage it from the event banner.</p>';
  html+='<div class="ge-stack" id="wx-ev-choices"></div>'+
   '<button class="ge-btn ge-btn-ghost ge-btn-block" id="wx-ev-later">'+(def.dismissEnds?'NOT NOW':'DECIDE LATER')+'</button></div>';
  var m=modal(html), box=m.querySelector('#wx-ev-choices');
  def.choices.forEach(function(ch){
    var b=document.createElement('button');
    b.className='ge-btn ge-btn-block ge-wx-choice';
    var sub=typeof ch.sub==='function'?ch.sub(ev):ch.sub;
    b.innerHTML='<b>'+esc(ch.label)+'</b>'+(sub?'<span class="ge-wx-sub">'+esc(sub)+'</span>':'');
    b.onclick=function(){
      var res=null;
      try{ res=ch.run(ev); }catch(err){ res=null; }
      closeModal(m);
      if(res==='end') WX_endEvent(ev.uid,false);
      try{ save(); }catch(e){}
      if(typeof updateHUD==='function') updateHUD();
      if(typeof refreshGrowUI==='function') refreshGrowUI();
      if(typeof checkMissions==='function') checkMissions();
      if(typeof current!=='undefined'&&RENDER[current]){ try{ RENDER[current](); }catch(e){} }
    };
    box.appendChild(b);
  });
  m.querySelector('#wx-ev-later').onclick=function(){
    closeModal(m);
    if(def.dismissEnds) WX_endEvent(ev.uid,false);
    try{ save(); }catch(e){}
    if(typeof refreshGrowUI==='function') refreshGrowUI();
  };
}

function WX_showEvent(uid){
  if(typeof S==='undefined'||!S||!S.wx) return;
  S.wx.pending={uid:uid};
  WX_showPendingEvent();
}
function WX_dismissEvent(uid){
  WX_endEvent(uid,false);
  toast('Event dismissed.');
  try{ save(); }catch(e){}
  if(typeof refreshGrowUI==='function') refreshGrowUI();
}
function WX_bannerHTML(){
  WX_init();
  var w=S.wx;
  if(!w||!w.events.length) return '';
  return w.events.map(function(ev){
    var rar='COMMON';
    for(var i=0;i<WX_EVENT_DEFS.length;i++) if(WX_EVENT_DEFS[i].id===ev.def) rar=WX_EVENT_DEFS[i].rarity;
    return '<div class="ge-card ge-card-flat ge-wx-banner">'+
     '<span class="ge-pill '+WX_rarPill(rar)+'">'+WX_ic('warn','ge-ic-sm')+rar+'</span>'+
     '<div class="ge-wx-banner-t"><b>'+esc(ev.title)+'</b><span class="ge-caption ge-muted">'+int(ev.daysLeft,0)+'d left</span></div>'+
     '<div class="ge-btn-row"><button class="ge-btn ge-btn-sm ge-btn-primary" onclick="WX_showEvent(\''+ev.uid+'\')">VIEW</button>'+
     '<button class="ge-btn ge-btn-sm ge-btn-ghost" onclick="WX_dismissEvent(\''+ev.uid+'\')">DISMISS</button></div></div>';
  }).join('');
}

/* ---- public cross-builder interfaces (events) ---- */
function WX_envPenalty(){ return WX_activeEvent('wx-powerout')?15:0; }
function WX_heatWave(){ return !!WX_activeEvent('wx-heatwave'); }
function WX_equipDisabled(id){ var ev=WX_activeEvent('wx-equipfail'); return !!(ev&&ev.data.equip===id); }

/* ============================================================
   P2-4 RANDOM EVENTS + DISCOVERY MOMENTS
   (a) 10 new decision-based global events, registered into the WX
       engine so cooldowns, day-minimums, preconditions, DECIDE LATER,
       banners, dismissal and expiry are all reused. Total daily event
       cadence is unchanged (same 0.15 roll) — only variety grows.
       Costs are modest; rewards are small and flow through EXISTING
       price logic (pricePerOz / WX_sellMult). No printers.
   (b) Unified discovery-moment beats: industrial-styled toast +
       haptic, one-time per trigger (persisted seen-flags), reward-free
       (the W1 elite systems own all elite rewards).
   Events NEVER fire offline: the offline sim (NX_offlineSim) never
   touches WX_tick / rollEvents / expansionTick. Untouched, sacrosanct.
   ============================================================ */

/* ---------------- P2-4 event defs (WX-engine compatible) ---------------- */
const P2EV_DEFS=[
 /* ---- HVAC MALFUNCTION (UNCOMMON) ---- */
 { id:'p2ev-hvac', rarity:'UNCOMMON', weight:8, cd:16, dur:[3,4],
   title:'HVAC MALFUNCTION',
   text:function(){ return 'The HVAC is short-cycling — temperatures are swinging and the room is drifting out of range. Fix it now, patch it cheap, or move the plants.'; },
   canRoll:function(){ return S.day>=6&&S.plants.length>0; },
   onStart:function(){},
   choices:[
    {label:'EMERGENCY REPAIR', sub:function(){ return 'Pay '+fmt$(120+40*int(S.facility,0))+' — full fix, today'; },
     run:function(){ var c=120+40*int(S.facility,0); if(S.cash<c){ toast(WX_ic('x','ge-ic-md')+' Need '+fmt$(c)+'.'); return; } S.cash-=c; toast(WX_ic('equipment','ge-ic-md')+' HVAC repaired. Climate stable.'); return 'end'; }},
    {label:'TEMPORARY VENTILATION', sub:'Pay $40 — patched airflow, temps climb +2°F/day while active',
     run:function(ev){ if(S.cash<40){ toast(WX_ic('x','ge-ic-md')+' Need $40.'); return; } S.cash-=40; ev.data.ventFix=true; toast(WX_ic('hvac','ge-ic-md')+' Temporary ventilation rigged. Watch the thermometers.'); }},
    {label:'MOVE PLANTS', sub:'Pay $60 labor — plants stressed +12',
     run:function(){ if(S.cash<60){ toast(WX_ic('x','ge-ic-md')+' Need $60.'); return; } S.cash-=60; S.plants.forEach(function(p){ p.stress=clamp(num(p.stress,0)+12,0,100); }); toast(WX_ic('users','ge-ic-md')+' Plants moved. Stress +12 across the room.'); return 'end'; }}
   ]},
 /* ---- HUMIDITY SPIKE (COMMON) ---- */
 { id:'p2ev-humid', rarity:'COMMON', weight:7, cd:14, dur:[2,3],
   title:'HUMIDITY SPIKE',
   text:function(){ return 'Humidity just spiked to '+Math.round(num(S.env.humidity,52))+'%. Wet air invites mildew — act before the leaves tell on you.'; },
   canRoll:function(){ return S.day>=5&&S.plants.length>0; },
   onStart:function(){ S.env.humidity=clamp(num(S.env.humidity,52)+22,0,100); },
   choices:[
    {label:'DEHUMIDIFIER BLAST', sub:function(){ return num(S.equipment.dehumid,1)>=3?'Free — your dehumidifier eats the spike':'Pay $60 — rent a commercial unit'; },
     run:function(){ if(num(S.equipment.dehumid,1)<3){ if(S.cash<60){ toast(WX_ic('x','ge-ic-md')+' Need $60.'); return; } S.cash-=60; } S.env.humidity=clamp(num(S.env.humidity,52)-28,0,100); toast(WX_ic('water','ge-ic-md')+' Humidity back under control.'); return 'end'; }},
    {label:'EMERGENCY VENTING', sub:'Pay $30 — humidity -18, temps -2°F',
     run:function(){ if(S.cash<30){ toast(WX_ic('x','ge-ic-md')+' Need $30.'); return; } S.cash-=30; S.env.humidity=clamp(num(S.env.humidity,52)-18,0,100); S.env.temp=clamp(num(S.env.temp,76)-2,50,100); toast(WX_ic('hvac','ge-ic-md')+' Vented. Air moving again.'); return 'end'; }},
    {label:'RIDE IT OUT', sub:'Free — mildew risk on random plants',
     run:function(){
       if(Math.random()<0.45){
         var cands=S.plants.slice(), n=Math.min(2,cands.length), i;
         for(i=0;i<n;i++){ var p=cands.splice(rndi(0,cands.length-1),1)[0]; p.problems=p.problems||[]; if(p.problems.indexOf('Powdery mildew')<0) p.problems.push('Powdery mildew'); p.health=clamp(num(p.health,100)-8,0,100); }
         toast(WX_ic('warn','ge-ic-md')+' Mildew took hold on '+n+' plant(s).');
       } else toast(WX_ic('check','ge-ic-md')+' Lucky — the spike passed without mildew.');
     }}
   ]},
 /* ---- IRRIGATION LINE BURST (COMMON) ---- */
 { id:'p2ev-irrig', rarity:'COMMON', weight:7, cd:14, dur:[2,2],
   title:'IRRIGATION LINE BURST',
   text:function(){ return 'A main irrigation line burst overnight — the room lost water pressure and every plant is thirstier than it should be.'; },
   canRoll:function(){ return S.day>=4&&S.plants.length>0; },
   onStart:function(){ S.plants.forEach(function(p){ p.water=clamp(num(p.water,70)-25,0,100); }); },
   choices:[
    {label:'REPLACE THE PUMP', sub:'Pay $80 — fully fixed today',
     run:function(){ if(S.cash<80){ toast(WX_ic('x','ge-ic-md')+' Need $80.'); return; } S.cash-=80; toast(WX_ic('water','ge-ic-md')+' New pump installed. Pressure restored.'); return 'end'; }},
    {label:'PATCH THE LINES', sub:'Pay $25 — fixed, plants -10 water',
     run:function(){ if(S.cash<25){ toast(WX_ic('x','ge-ic-md')+' Need $25.'); return; } S.cash-=25; S.plants.forEach(function(p){ p.water=clamp(num(p.water,70)-10,0,100); }); toast(WX_ic('check','ge-ic-md')+' Lines patched.'); return 'end'; }},
    {label:'BUCKET BRIGADE', sub:'Free — water +15 today, +5 stress all plants',
     run:function(){ S.plants.forEach(function(p){ p.water=clamp(num(p.water,70)+15,0,100); p.stress=clamp(num(p.stress,0)+5,0,100); }); toast(WX_ic('users','ge-ic-md')+' Bucket brigade done. Plants watered, crew tired.'); return 'end'; }}
   ]},
 /* ---- NUTRIENT LOCKOUT (UNCOMMON) ---- */
 { id:'p2ev-nutr', rarity:'UNCOMMON', weight:6, cd:18, dur:[3,3],
   title:'NUTRIENT LOCKOUT',
   text:function(){ return 'pH drift locked out nutrients across the room — leaves are paling and every plant is running hungry.'; },
   canRoll:function(){ return S.day>=7&&S.plants.length>0; },
   onStart:function(){ S.plants.forEach(function(p){ p.nutrition=clamp(num(p.nutrition,60)-30,0,100); p.problems=p.problems||[]; if(p.problems.indexOf('Nutrient lockout')<0) p.problems.push('Nutrient lockout'); }); },
   choices:[
    {label:'FLUSH + REFEED', sub:'Pay $45 — nutrition reset to 60, +5 stress',
     run:function(){ if(S.cash<45){ toast(WX_ic('x','ge-ic-md')+' Need $45.'); return; } S.cash-=45; S.plants.forEach(function(p){ p.nutrition=60; p.stress=clamp(num(p.stress,0)+5,0,100); p.problems=(p.problems||[]).filter(function(x){ return x!=='Nutrient lockout'; }); }); toast(WX_ic('flask','ge-ic-md')+' Flushed and refed. Back on schedule.'); return 'end'; }},
    {label:'EMERGENCY FEED', sub:'Pay $20 — nutrition +25',
     run:function(){ if(S.cash<20){ toast(WX_ic('x','ge-ic-md')+' Need $20.'); return; } S.cash-=20; S.plants.forEach(function(p){ p.nutrition=clamp(num(p.nutrition,60)+25,0,100); }); toast(WX_ic('flask','ge-ic-md')+' Emergency feed applied.'); return 'end'; }},
    {label:'ADJUST THE REGIMEN', sub:'Free — nutrition +12, slow recovery',
     run:function(){ S.plants.forEach(function(p){ p.nutrition=clamp(num(p.nutrition,60)+12,0,100); }); toast(WX_ic('check','ge-ic-md')+' Regimen adjusted. Slow recovery ahead.'); return 'end'; }}
   ]},
 /* ---- PEST SCOUT WARNING (COMMON) — early warning, distinct from the outbreak ---- */
 { id:'p2ev-pestwarn', rarity:'COMMON', weight:7, cd:15, dur:[2,3],
   title:'PEST SCOUT WARNING',
   text:function(){ return 'Your scout found early pest pressure on the sticky traps — nothing established yet, but the window to act is now.'; },
   canRoll:function(){ return S.day>=6&&S.plants.length>0; },
   onStart:function(){},
   choices:[
    {label:'PREVENTIVE NEEM', sub:'Pay $30 — threat eliminated',
     run:function(){ if(S.cash<30){ toast(WX_ic('x','ge-ic-md')+' Need $30.'); return; } S.cash-=30; toast(WX_ic('spray','ge-ic-md')+' Preventive spray applied. Threat gone.'); return 'end'; }},
    {label:'BENEFICIAL INSECTS', sub:'Pay $15 — nature handles it (+3 stress)',
     run:function(){ if(S.cash<15){ toast(WX_ic('x','ge-ic-md')+' Need $15.'); return; } S.cash-=15; S.plants.forEach(function(p){ p.stress=clamp(num(p.stress,0)+3,0,100); }); toast(WX_ic('bug','ge-ic-md')+' Beneficials released.'); return 'end'; }},
    {label:'WAIT AND WATCH', sub:'Free — 40% chance pests establish on 2 plants',
     run:function(){
       if(Math.random()<0.4){
         var cands=S.plants.slice(), n=Math.min(2,cands.length), i;
         for(i=0;i<n;i++){ var p=cands.splice(rndi(0,cands.length-1),1)[0]; p.problems=p.problems||[]; if(p.problems.indexOf('Pests')<0) p.problems.push('Pests'); p.health=clamp(num(p.health,100)-10,0,100); }
         toast(WX_ic('warn','ge-ic-md')+' Pests established on '+n+' plant(s)!');
       } else toast(WX_ic('check','ge-ic-md')+' False alarm — traps are clean.');
     }}
   ]},
 /* ---- BREEDER OPPORTUNITY (RARE) — real cost/benefit tradeoff, generous 6-day window ---- */
 { id:'p2ev-breeder', rarity:'RARE', weight:4, cd:22, dur:[6,6],
   title:'BREEDER OPPORTUNITY',
   text:function(ev){ var st=ev.data.offerId?getStrain(ev.data.offerId):null; return st?('A respected breeder offers "'+st.name+'" genetics at a premium of '+fmt$(num(st.seed,0)*5)+' — or book a consulting session to sharpen your own breeding program. Offer stands 6 days.'):('A breeder reached out, but the genetics fell through.'); },
   canRoll:function(){ return S.day>=12&&S.lockedStrains.some(function(id){ var st=getStrain(id); return st&&st.lock&&(st.lock.t==='cash'||st.lock.t==='rep'); }); },
   onStart:function(ev){ var cands=S.lockedStrains.filter(function(id){ var st=getStrain(id); return st&&st.lock&&(st.lock.t==='cash'||st.lock.t==='rep'); }); ev.data.offerId=cands.length?pick(cands):null; },
   choices:[
    {label:'BUY THE GENETICS', sub:function(ev){ var st=ev.data.offerId?getStrain(ev.data.offerId):null; return st?('Pay '+fmt$(num(st.seed,0)*5)+' — unlock it now'):'Offer expired'; },
     run:function(ev){ var st=ev.data.offerId?getStrain(ev.data.offerId):null; if(!st) return 'end'; var cost=num(st.seed,0)*5; if(S.cash<cost){ toast(WX_ic('x','ge-ic-md')+' Need '+fmt$(cost)+'.'); return; } S.cash-=cost; if(typeof unlockStrain==='function') unlockStrain(st.id,true); if(typeof gainXP==='function') gainXP(50); return 'end'; }},
    {label:'CONSULTING SESSION', sub:'Pay $100 — breeding wisdom (+60 XP, +2 P0 genetics)',
     run:function(){ if(S.cash<100){ toast(WX_ic('x','ge-ic-md')+' Need $100.'); return; } S.cash-=100; if(typeof gainXP==='function') gainXP(60); if(typeof addP0==='function') addP0('genetics',2); toast(WX_ic('dna','ge-ic-md')+' Breeding session booked. Knowledge banked.'); return 'end'; }},
    {label:'DECLINE', sub:'Pass on the offer', run:function(){ toast('The breeder moves on.'); return 'end'; }}
   ], dismissEnds:true},
 /* ---- SPECIAL CUSTOMER (UNCOMMON) — premium order, pays via EXISTING price logic ---- */
 { id:'p2ev-customer', rarity:'UNCOMMON', weight:6, cd:20, dur:[5,5],
   title:'SPECIAL CUSTOMER',
   text:function(){ return 'A boutique buyer needs premium flower fast — top-shelf rates for up to 8 oz of your BEST inventory. No rush on your end: the offer stands 5 days.'; },
   canRoll:function(){ return S.day>=8&&S.inventory.length>0; },
   onStart:function(){},
   choices:[
    {label:'FILL THE RUSH ORDER', sub:'Sell up to 8 oz of top-quality stock at premium rates',
     run:function(){ var sold=P2EV_fillLots(8,'wx-premium'); if(sold.oz<=0){ toast(WX_ic('x','ge-ic-md')+' No sellable inventory.'); return; } if(typeof gainRep==='function') gainRep(3); toast(WX_ic('cash','ge-ic-md')+' Rush order filled: '+sold.oz+' oz for '+fmt$(sold.total)+'.'); return 'end'; }},
    {label:'POLITELY DECLINE', sub:'Keep your stock', run:function(){ toast('You pass on the rush order.'); return 'end'; }}
   ], dismissEnds:true},
 /* ---- MARKET SHORTAGE (RARE) — decision hook: hold vs sell ---- */
 { id:'p2ev-shortage', rarity:'RARE', weight:4, cd:24, dur:[4,4],
   title:'MARKET SHORTAGE',
   text:function(ev){ return 'Supply dried up across the city — buyers are desperate for '+(ev.data.tag||'quality flower')+'. Prices spike 1.5x for 4 days. Sell into it now, or hold and sell at your own pace.'; },
   canRoll:function(){ return S.day>=10&&S.inventory.length>0; },
   onStart:function(ev){ var tags=[]; S.inventory.forEach(function(it){ var st=getStrain(it.strainId); (st&&st.tags||[]).forEach(function(t){ if(tags.indexOf(t)<0) tags.push(t); }); }); ev.data.tag=tags.length?pick(tags):'Exotic'; P2EV_applyShortage(ev.data.tag,4); },
   choices:[
    {label:'SELL INTO THE SHORTAGE', sub:'Auto-sell up to 6 oz at shortage prices',
     run:function(){ var sold=P2EV_fillLots(6,null); if(sold.oz<=0){ toast(WX_ic('x','ge-ic-md')+' No sellable inventory.'); return; } toast(WX_ic('chart','ge-ic-md')+' Sold into the shortage: '+sold.oz+' oz for '+fmt$(sold.total)+'.'); return 'end'; }},
    {label:'HOLD FOR LATER', sub:'Keep the 4-day window — sell manually at boosted prices',
     run:function(){ toast(WX_ic('clock','ge-ic-md')+' Holding. The shortage window stays open 4 days.'); }}
   ]},
 /* ---- HIGH-DEMAND PRODUCT REQUEST (UNCOMMON) ---- */
 { id:'p2ev-demand', rarity:'UNCOMMON', weight:6, cd:18, dur:[5,5],
   title:'HIGH-DEMAND REQUEST',
   text:function(ev){ return 'A distributor wants high-terpene flower ('+num(ev.data.minTerp,70)+'+ terpenes) — up to 4 oz at standard rates, plus reputation for delivering. Offer stands 5 days.'; },
   canRoll:function(){ return S.day>=9&&S.inventory.length>0; },
   onStart:function(ev){ ev.data.minTerp=70; },
   choices:[
    {label:'FILL WITH BEST MATCH', sub:function(ev){ var n=S.inventory.filter(function(it){ return num(it.terpenes,0)>=num(ev.data.minTerp,70); }).length; return n?n+' matching lot(s) in stock':'No matching stock — offer an alternative'; },
     run:function(ev){ var mt=S.inventory.filter(function(it){ return num(it.terpenes,0)>=num(ev.data.minTerp,70); }).sort(function(a,b){ return num(b.terpenes,0)-num(a.terpenes,0); }); if(!mt.length){ toast(WX_ic('x','ge-ic-md')+' No matching stock.'); return; } var by=(typeof BUYERS!=='undefined'&&BUYERS[0])?BUYERS[0].id:null; var sold=P2EV_fillMatch(mt[0].id,4,by); if(typeof gainRep==='function') gainRep(3); toast(WX_ic('cash','ge-ic-md')+' Request filled: '+sold.oz+' oz for '+fmt$(sold.total)+'. +3 rep'); return 'end'; }},
    {label:'OFFER AN ALTERNATIVE', sub:'Sell your closest lot instead (+1 rep)',
     run:function(){ var best=S.inventory.slice().sort(function(a,b){ return num(b.terpenes,0)-num(a.terpenes,0); })[0]; if(!best){ toast(WX_ic('x','ge-ic-md')+' No inventory.'); return; } var by=(typeof BUYERS!=='undefined'&&BUYERS[0])?BUYERS[0].id:null; var sold=P2EV_fillMatch(best.id,4,by); if(typeof gainRep==='function') gainRep(1); toast(WX_ic('cash','ge-ic-md')+' Alternative accepted: '+sold.oz+' oz for '+fmt$(sold.total)+'.'); return 'end'; }},
    {label:'DECLINE', sub:'Pass on the request', run:function(){ toast('You pass on the request.'); return 'end'; }}
   ], dismissEnds:true},
 /* ---- EMPLOYEE ISSUE (UNCOMMON) — bonus / retrain / let go with morale effects ---- */
 { id:'p2ev-crew', rarity:'UNCOMMON', weight:5, cd:20, dur:[4,4],
   title:'EMPLOYEE ISSUE',
   text:function(ev){ return (ev.data.empName||'An employee')+' is burning out — missed shifts, short temper. The crew is watching how you handle it.'; },
   canRoll:function(){ try{ return S.day>=14&&typeof EX_ready==='function'&&EX_ready()&&S.ex.employees.length>0; }catch(e){ return false; } },
   onStart:function(ev){ var e=pick(S.ex.employees); ev.data.empId=e.id; ev.data.empName=e.name; },
   choices:[
    {label:'PAY A BONUS', sub:'Pay $150 — morale +25',
     run:function(ev){ if(S.cash<150){ toast(WX_ic('x','ge-ic-md')+' Need $150.'); return; } S.cash-=150; var e=P2EV_emp(ev); if(e) e.morale=clamp(num(e.morale,70)+25,0,100); toast(WX_ic('cash','ge-ic-md')+' Bonus paid. '+esc(e?e.name:'They')+' is back in the fight.'); return 'end'; }},
    {label:'RETRAIN', sub:'Pay $50 — new skills (+40 xp), morale +10',
     run:function(ev){ if(S.cash<50){ toast(WX_ic('x','ge-ic-md')+' Need $50.'); return; } S.cash-=50; var e=P2EV_emp(ev); if(e){ e.xp=num(e.xp,0)+40; try{ if(typeof EX_empLevelCheck==='function') EX_empLevelCheck(e,false); }catch(err){} e.morale=clamp(num(e.morale,70)+10,0,100); } toast(WX_ic('train','ge-ic-md')+' Retrained and re-motivated.'); return 'end'; }},
    {label:'LET GO', sub:'Remove them — crew morale -10',
     run:function(ev){ var e=P2EV_emp(ev); S.ex.employees=S.ex.employees.filter(function(x){ return x.id!==ev.data.empId; }); S.ex.employees.forEach(function(x){ x.morale=clamp(num(x.morale,70)-10,0,100); }); toast(WX_ic('users','ge-ic-md')+' '+esc(e?e.name:'They')+' was let go. The crew is rattled (-10 morale).'); return 'end'; }}
   ]}
];
var P2EV_registered=false;
function P2EV_register(){
  if(P2EV_registered) return; P2EV_registered=true;
  if(typeof WX_EVENT_DEFS==='undefined'||!Array.isArray(WX_EVENT_DEFS)) return;
  P2EV_DEFS.forEach(function(d){
    if(!WX_EVENT_DEFS.some(function(x){ return x&&x.id===d.id; })) WX_EVENT_DEFS.push(d);
  });
}
P2EV_register();

/* ---------------- P2-4 helpers ---------------- */
function P2EV_emp(ev){
  if(!S||!S.ex||!Array.isArray(S.ex.employees)) return null;
  return S.ex.employees.find(function(x){ return x&&x.id===ev.data.empId; })||null;
}
/* sell `take` oz of one lot through EXISTING price logic (pricePerOz × WX_sellMult) */
function P2EV_sellLot(it,take,buyerId){
  var out={oz:0,total:0};
  if(!it||typeof pricePerOz!=='function') return out;
  take=Math.min(num(take,0),num(it.amount,0)); if(take<=0) return out;
  var mult=1; try{ if(typeof WX_sellMult==='function') mult=num(WX_sellMult(it.strainId,it,buyerId),1); }catch(e){}
  out.oz=Math.round(take*10)/10; out.total=Math.round(pricePerOz(it)*take*mult);
  it.amount=num(it.amount,0)-take;
  if(it.amount<=0.001) S.inventory=S.inventory.filter(function(x){ return x.id!==it.id; });
  S.cash=num(S.cash,0)+out.total;
  S.stats.lifetimeRevenue=num(S.stats.lifetimeRevenue,0)+out.total;
  S.stats.sales=num(S.stats.sales,0)+1;
  try{ if(typeof gainXP==='function') gainXP(15); }catch(e){}
  try{ if(typeof checkMissions==='function') checkMissions(); }catch(e){}
  try{ if(typeof checkAchievements==='function') checkAchievements(); }catch(e){}
  return out;
}
function P2EV_fillLots(ozCap,buyerId){
  var out={oz:0,total:0};
  if(!S||!Array.isArray(S.inventory)||!S.inventory.length) return out;
  var left=num(ozCap,0);
  S.inventory.slice().sort(function(a,b){ return num(b.quality,0)-num(a.quality,0); }).forEach(function(it){
    if(left<=0) return;
    var sold=P2EV_sellLot(it,left,buyerId);
    out.oz+=sold.oz; out.total+=sold.total; left-=sold.oz;
  });
  out.oz=Math.round(out.oz*10)/10;
  return out;
}
function P2EV_fillMatch(invId,ozCap,buyerId){
  var it=S.inventory.find(function(x){ return x.id===invId; });
  return P2EV_sellLot(it,ozCap,buyerId);
}
function P2EV_applyShortage(tag,days){
  if(typeof allStrains!=='function'||!S||!S.wx) return;
  allStrains().forEach(function(st){
    if(st.tags&&st.tags.indexOf(tag)>=0) S.wx.market[st.id]={demand:'high',mult:1.5,days:days};
  });
}
/* per-day ticks for P2-4 events (wired into WX_eventDayTick) */
function P2EV_dayTick(ev){
  if(!ev||!ev.def||!S||!S.env) return;
  if(ev.def==='p2ev-hvac'&&ev.data.ventFix) S.env.temp=clamp(num(S.env.temp,76)+2,50,100); /* temporary ventilation: env risk while active */
}

/* ---------------- P2-4 positive per-plant events ---------------- */
function vigorousSeedlingEvent(p){
  var st=getStrain(p.strainId);
  return evModal(p,icon('grow','ge-ic-md')+' Unusually Vigorous Seedling',
   'This '+st.name+' seedling is exploding out of the shell — exceptional early vigor.',
   [['Nurture it (free trait boost)',function(){
     if(p.pheno){ p.pheno.vigor=clamp(num(p.pheno.vigor,50)+8,5,100); p.pheno.rootVigor=clamp(num(p.pheno.rootVigor,50)+8,5,100); p.pheno.envTolerance=clamp(num(p.pheno.envTolerance,50)+6,5,100); }
     p.germ=num(p.germ,0)+1;
     toast(icon('grow','ge-ic-md')+' Vigorous seedling nurtured — +8 vigor, +8 root vigor, +6 env tolerance.');
   }]]);
}
/* rare phenotype expression mid-grow: HOOK ONLY — no rewards (W1 elite systems own all elite rewards) */
function eliteSightingEvent(p){
  var st=getStrain(p.strainId);
  p.eliteSighted=true;
  try{ D_moment('elitesight-'+p.id,'ELITE EXPRESSION DETECTED',
    st.name+' #'+(p.pheno&&p.pheno.num?p.pheno.num:'?')+' is showing elite traits weeks before harvest. Watch it closely.','trophy'); }catch(e){}
  return evModal(p,icon('trophy','ge-ic-md')+' Rare Phenotype Expression',
   'Your '+st.name+' is expressing something special — elite traits are showing weeks before harvest.',
   [['Watch it closely',function(){ toast(icon('trophy','ge-ic-md')+' Noted. The elite hunt continues.'); }]]);
}

/* ---------------- DISCOVERY MOMENTS (unified, one-time, reward-free) ---------------- */
function D_init(){
  if(typeof S==='undefined'||!S) return false;
  if(!S.disc||typeof S.disc!=='object') S.disc={seen:{},terpCombos:{}};
  if(!S.disc.seen||typeof S.disc.seen!=='object') S.disc.seen={};
  if(!S.disc.terpCombos||typeof S.disc.terpCombos!=='object') S.disc.terpCombos={};
  return true;
}
function D_seen(key){ return !!(S&&S.disc&&S.disc.seen&&S.disc.seen[key]); }
/* Fires once per trigger key. Returns true iff the beat fired. Reward-free by design. */
function D_moment(key,title,sub,ic){
  if(!D_init()) return false;
  if(S.disc.seen[key]) return false; /* NEVER repeated for the same trigger */
  S.disc.seen[key]=int(S.day,1);
  D_toast(title,sub,ic);
  try{ save(); }catch(e){}
  return true;
}
/* industrial-styled beat: gold-ruled toast + haptic (native CAP bridge, web vibrate fallback) */
function D_toast(title,sub,ic){
  try{
    var root=(typeof $==='function')?$('toast-root'):document.getElementById('toast-root');
    if(!root) return;
    var t=document.createElement('div'); t.className='ge-toast ge-toast-disc';
    t.innerHTML='<span class="ge-disc-ic">'+icon(ic||'star','ge-ic-md')+'</span><span class="ge-disc-tx"><b>'+esc(title)+'</b>'+(sub?'<i>'+esc(sub)+'</i>':'')+'</span>';
    root.appendChild(t);
    setTimeout(function(){ t.style.opacity='0'; t.style.transition='opacity .4s'; setTimeout(function(){ t.remove(); },400); },4200);
  }catch(e){}
  try{ if(typeof PR_haptic==='function') PR_haptic('discovery'); }catch(e){}
}
function D_terpProfileOf(st){
  try{ if(typeof GT_terpeneProfile==='function'&&st&&typeof st.id==='string'){ var p=GT_terpeneProfile(st); if(p&&p.length) return p; } }catch(e){}
  var tags=(st&&st.tags)||[], prof=[];
  if(tags.indexOf('Gassy')>=0) prof.push('Gas');
  if(tags.indexOf('Fruit')>=0) prof.push('Sweet');
  if(tags.indexOf('Skunky')>=0||tags.indexOf('Old School')>=0) prof.push('Funk');
  if(tags.indexOf('Purple')>=0) prof.push('Berry');
  if(!prof.length) prof.push('Earthy');
  return prof.slice(0,4);
}
/* new terpene combination detector: fires once per unique sorted profile */
function D_checkTerpCombo(st){
  if(!D_init()||!st) return false;
  var prof=D_terpProfileOf(st);
  if(!prof.length) return false;
  var key=prof.slice().sort().join('+');
  if(S.disc.terpCombos[key]) return false;
  S.disc.terpCombos[key]=int(S.day,1);
  return D_moment('terpcombo-'+key,'NEW TERPENE COMBINATION',prof.join(' x ')+' — never seen in your garden before.','flask');
}
/* harvest-time discovery hooks: reuses the report's own detection (rare trait, keeper,
   elite, P0, personal records); adds only the terpene-combo detector. Reward-free. */
function P24_harvestDiscoveries(report,r){
  if(!report||!r||!D_init()) return;
  var uid=String(report.strainId||'?')+'#'+String(report.phenoNum||0);
  var st=null; try{ st=getStrain(report.strainId); }catch(e){}
  if(report.legendaryTrait)
    D_moment('raretrait-'+uid,'RARE TRAIT FOUND',String(report.legendaryTrait)+' — a legendary expression. Preserve it.','dna');
  if(report.rarity==='elite'||report.rarity==='legendary')
    D_moment('eliteharv-'+uid,'ELITE EXPRESSION','An elite phenotype — a cut above the pack.','trophy');
  var traits=Array.isArray(report.traits)?report.traits:[];
  if(traits.indexOf('KEEPER CANDIDATE')>=0)
    D_moment('keeper-'+uid,'KEEPER CANDIDATE','Outperformed the strain baseline by 7+ points. Vault-worthy genetics.','crown-gold');
  var g0=(report.genetics&&typeof report.genetics==='object')?report.genetics:{};
  var eliteExpr=report.rarity==='elite'||report.rarity==='legendary'||!!report.legendaryTrait;
  if(eliteExpr||(num(g0.resinPot,0)>=88&&num(g0.terpenePot,0)>=88))
    D_moment('p0cand-'+uid,'P0 CANDIDATE','Flagged for Project 0 preservation.','project0');
  /* personal records: trigger = metric+value, so a HIGHER record is a new trigger */
  if(Math.round(r.quality)>=Math.round(num(S.stats.bestQuality,0))&&r.quality>0)
    D_moment('pr-quality-'+Math.round(r.quality),'PERSONAL RECORD','Quality '+Math.round(r.quality)+' — your best ever harvest.','trophy');
  if(r.yieldOz>=num(S.stats.biggestHarvest,0)&&r.yieldOz>0)
    D_moment('pr-yield-'+String(r.yieldOz),'PERSONAL RECORD','Yield '+r.yieldOz+' oz — your biggest haul.','trophy');
  var bestPot=0; try{ bestPot=num(typeof NX_bestPotency==='function'?NX_bestPotency():0,0); }catch(e){}
  if(r.potency>=bestPot&&r.potency>0)
    D_moment('pr-potency-'+Math.round(r.potency),'PERSONAL RECORD','Potency '+Math.round(r.potency)+' — your strongest flower.','trophy');
  if(st) D_checkTerpCombo(st);
}
/* breeding discovery: exceptional cross (beats both parents) + novel terp combo */
function P24_breedingDiscovery(cross,A,B){
  if(!cross||!D_init()) return;
  var avg=function(o){ return (num(o.yld,0)+num(o.pot,0)+num(o.terp,0)+num(o.resin,0))/4; };
  var cAvg=avg(cross), pMax=Math.max(A?avg(A):0,B?avg(B):0);
  if(cAvg>=pMax+4)
    D_moment('breed-'+String(cross.id),'BREEDING DISCOVERY','"'+String(cross.name||'Untitled Cross')+'" outclasses both parents (+'+Math.round(cAvg-pMax)+' potential).','dna');
  D_checkTerpCombo(cross);
}
/* genetic unlock clue: a locked strain's cash/rep requirement is >=75% met — one clue per day */
function P24_unlockClueScan(){
  if(!D_init()) return;
  if(typeof STRAINS==='undefined'||!Array.isArray(S.lockedStrains)) return;
  for(var i=0;i<STRAINS.length;i++){
    var st=STRAINS[i]; if(!st.lock) continue;
    if(S.lockedStrains.indexOf(st.id)<0) continue;
    if(S.disc.seen['unlockclue-'+st.id]) continue;
    var prog=0, need='';
    if(st.lock.t==='cash'){ var cost=num(st.seed,0)*3; if(cost<=0) continue; prog=num(S.cash,0)/cost; need=fmt$(cost); }
    else if(st.lock.t==='rep'){ var rv=num(st.lock.v,0); if(rv<=0) continue; prog=num(S.reputation,0)/rv; need=rv+' rep'; }
    else continue;
    if(prog>=0.75&&prog<1){
      if(D_moment('unlockclue-'+st.id,'GENETIC UNLOCK CLUE',st.name+' is almost within reach ('+need+'). Keep pushing.','lock')) return;
    }
  }
}


/* ============================================================
   2. DYNAMIC MARKET
   ============================================================ */
const WX_DEMANDS={
 high:{mult:1.35,label:'HIGH',arrow:'▲',cls:'wx-dem-high'},
 normal:{mult:1.0,label:'STEADY',arrow:'—',cls:'wx-dem-normal'},
 low:{mult:0.75,label:'LOW',arrow:'▼',cls:'wx-dem-low'},
 collector:{mult:1.8,label:'COLLECTOR',arrow:'◆',cls:'wx-dem-collector'}
};
function WX_collectorEligible(st){
  if(!st) return false;
  if(st.custom) return true;
  if(st.tags&&st.tags.indexOf('Keeper')>=0) return true;
  if(typeof isUnlocked==='function'){ try{ if(!isUnlocked(st.id)) return true; }catch(e){} }
  return false;
}
function WX_decayMarket(){
  var w=S.wx; if(!w||!w.market) return;
  Object.keys(w.market).forEach(function(k){
    var e=w.market[k];
    e.days=int(e.days,1)-1;
    if(e.days<=0) delete w.market[k];
  });
}
function WX_seedMarket(){
  var w=S.wx;
  if(!w||Object.keys(w.market).length>0) return;
  if(typeof allStrains!=='function') return;
  var list=allStrains().filter(function(s){ return !s.custom; });
  for(var i=0;i<2&&list.length;i++){
    var st=list.splice(rndi(0,list.length-1),1)[0];
    var dem=i===0?'high':'low';
    w.market[st.id]={demand:dem,mult:WX_DEMANDS[dem].mult,days:rndi(3,5)};
  }
}
function WX_marketTick(){
  var w=S.wx; if(!w) return;
  WX_decayMarket();
  if(S.day<int(w.mktNext,1)) return;
  w.mktNext=S.day+rndi(3,5);
  if(typeof allStrains!=='function') return;
  var changed=0;
  allStrains().forEach(function(st){
    if(Math.random()>0.3) return;
    var r=Math.random(), dem='normal';
    if(r<0.55) dem='normal'; else if(r<0.77) dem='high'; else if(r<0.92) dem='low'; else dem='collector';
    if(dem==='collector'&&!WX_collectorEligible(st)) dem='high';
    if(dem==='normal'){ if(w.market[st.id]){ delete w.market[st.id]; changed++; } }
    else { w.market[st.id]={demand:dem,mult:WX_DEMANDS[dem].mult,days:rndi(3,6)}; changed++; }
  });
  if(changed>0&&S.day>5) toast(WX_ic('chart','ge-ic-md')+' Market shifted: '+changed+' strain(s) repriced.');
}

function WX_marketMult(strainId){
  if(typeof S==='undefined'||!S||!S.wx||!S.wx.market) return 1.0;
  var e=S.wx.market[strainId];
  return e?num(e.mult,1.0):1.0;
}
function WX_marketPanel(){
  WX_init();
  var w=S.wx, rows=[];
  Object.keys(w.market||{}).forEach(function(id){
    var e=w.market[id], st=typeof getStrain==='function'?getStrain(id):null;
    if(!st) return;
    rows.push({name:st.name,demand:e.demand,mult:num(e.mult,1),days:int(e.days,0)});
  });
  var ord={collector:0,high:1,low:2};
  rows.sort(function(a,b){ return (ord[a.demand]-ord[b.demand]); });
  rows=rows.slice(0,8);
  var html='<div class="ge-card"><div class="ge-card-head"><h3>'+WX_ic('cash','ge-ic-md')+'MARKET CONDITIONS</h3></div>';
  if(!rows.length) html+='<div class="ge-empty"><p class="ge-body ge-muted">Markets steady. Prices shift every few days.</p></div>';
  rows.forEach(function(r){
    var d=WX_DEMANDS[r.demand];
    var pill=r.demand==='collector'?'ge-pill-gold':r.demand==='high'?'ge-pill-optimal':r.demand==='low'?'ge-pill-warning':'ge-pill-neutral';
    html+='<div class="ge-datarow"><span>'+esc(r.name)+'</span>'+
     '<span class="ge-pill '+pill+'">'+d.arrow+' '+d.label+'</span>'+
     '<b class="ge-num">×'+r.mult.toFixed(2)+'</b><span class="ge-caption ge-muted">'+r.days+'d</span></div>';
  });
  html+='<p class="ge-caption ge-muted">Sell high, hold low — demand shifts every few days.</p></div>';
  try{ if(typeof P3W5_condsHTML==='function') html+=P3W5_condsHTML(); }catch(e){} /* P3-W5: market conditions panel */
  return html;
}

/* ---- combined sell multiplier: buyer × market × location ---- */
function WX_sellMult(strainId,item,buyerId){
  var m=WX_marketMult(strainId), loc=1, b=1;
  try{ if(typeof TY_priceFactor==='function') m*=TY_priceFactor(strainId,item); }catch(e){}
  try{ if(typeof EX_locMarketMult==='function') loc=num(EX_locMarketMult(),1); }catch(e){}
  if(buyerId&&typeof BUYERS!=='undefined'){
    var by=BUYERS.find(function(x){ return x&&x.id===buyerId; });
    if(by&&typeof by.mult==='function'){ try{ b=num(by.mult(item||{}),1); }catch(e){ b=1; } }
  }
  try{ if(typeof P3W5_marketMult==='function') m*=P3W5_marketMult(strainId,item); }catch(e){} /* P3-W5: market conditions */
  return m*loc*b;
}
/* ---- supplier sale discount: 1.0 normally, 0.6–0.75 during sale ---- */
function WX_discount(kind){
  if(kind!=='equip'&&kind!=='genetics') return 1.0;
  var ev=WX_activeEvent('wx-sale');
  return ev?num(ev.data.disc,0.65):1.0;
}

/* ============================================================
   3. BUYER CONTRACTS
   ============================================================ */
function WX_makeOffer(){
  var w=S.wx;
  var buyers=(typeof BUYERS!=='undefined'&&Array.isArray(BUYERS)?BUYERS:[]).filter(function(b){ return b&&b.name; });
  var by=buyers.length?pick(buyers):{id:'street',name:'Mystery Buyer'};
  var grownKeys=Object.keys((S.stats&&S.stats.strainGrown)||{});
  var strainId='any', strainName='Any strain';
  if(grownKeys.length&&Math.random()<0.7){
    strainId=pick(grownKeys);
    var st=typeof getStrain==='function'?getStrain(strainId):null;
    if(st){ strainName=st.name; } else { strainId='any'; strainName='Any strain'; }
  }
  var minQ=rndi(60,85);
  var qty=rndi(2,6+Math.min(8,int(S.facility,0)*2));
  var minTrait=null;
  if(Math.random()<0.4) minTrait={k:pick(['resin','terpenes','potency','bagAppeal']),v:rndi(65,90)};
  var synth={quality:minQ,potency:minQ,terpenes:minQ,bagAppeal:minQ,resin:minQ,type:'flower',amount:qty};
  var base=(typeof pricePerOz==='function')?pricePerOz(synth):minQ*3;
  return {
    id:w.seq++, buyerId:by.id, buyerName:by.name,
    strainId:strainId, strainName:strainName,
    minQuality:minQ, minTrait:minTrait, qtyOz:qty,
    rewardCash:Math.round(qty*base*1.15),
    rewardRep:rndi(3,9)+Math.round(WX_exEmp('manager')/10),
    expiresDay:S.day+rndi(4,7)
  };
}
function WX_tickContracts(){
  var w=S.wx; if(!w) return;
  var before=w.contracts.length;
  w.offers=w.offers.filter(function(o){ return int(o.expiresDay,0)>=S.day; });
  w.contracts=w.contracts.filter(function(c){ return int(c.expiresDay,0)>=S.day; });
  if(w.contracts.length<before) toast(WX_ic('scroll','ge-ic-md')+' A contract expired unfulfilled.');
  var hasHistory=num(S.stats.sales,0)>0||num(S.stats.lifetimeRevenue,0)>0;
  if(!hasHistory) return;
  if(w.offers.length>=3) return;
  var n=Math.random()<0.55?(Math.random()<0.35?2:1):0, i;
  for(i=0;i<n&&w.offers.length<3;i++){
    try{ w.offers.push(WX_makeOffer()); }catch(e){}
  }
  if(n>0) toast(WX_ic('scroll','ge-ic-md')+' New buyer contract offer'+(n>1?'s':'')+' — check the DISPENSARY.');
}

function WX_offerFill(o){
  var items=S.inventory.filter(function(it){
    if(it.type!=='flower') return false;
    if(o.strainId!=='any'&&it.strainId!==o.strainId) return false;
    if(num(it.quality,0)<o.minQuality) return false;
    if(o.minTrait&&num(it[o.minTrait.k],0)<o.minTrait.v) return false;
    return num(it.amount,0)>0;
  });
  var total=0;
  items.forEach(function(it){ total+=num(it.amount,0); });
  return {items:items,total:Math.round(total*10)/10};
}
function WX_findOffer(id){
  for(var i=0;i<S.wx.offers.length;i++) if(S.wx.offers[i].id===id) return i;
  return -1;
}
function WX_acceptOffer(id){
  WX_init();
  var w=S.wx, i=WX_findOffer(id);
  if(i<0) return;
  if(w.contracts.length>=3){ toast(WX_ic('scroll','ge-ic-md')+' Contract book full (3). Fulfill or wait for one to expire.'); return; }
  var o=w.offers.splice(i,1)[0];
  w.contracts.push(o);
  toast(WX_ic('scroll','ge-ic-md')+' Contract accepted: '+esc(o.buyerName)+' — deliver '+o.qtyOz+' oz by day '+o.expiresDay+'.');
  try{ save(); }catch(e){}
  if(typeof updateHUD==='function') updateHUD();
  if(typeof current!=='undefined'&&current==='dispensary'&&RENDER.dispensary) RENDER.dispensary();
}

function WX_rejectOffer(id){
  WX_init();
  var w=S.wx, i=WX_findOffer(id);
  if(i<0) return;
  w.offers.splice(i,1);
  toast('Offer declined.');
  try{ save(); }catch(e){}
  if(typeof current!=='undefined'&&current==='dispensary'&&RENDER.dispensary) RENDER.dispensary();
}
function WX_fulfillContract(id){
  WX_init();
  var w=S.wx, ci=-1, i;
  for(i=0;i<w.contracts.length;i++) if(w.contracts[i].id===id) ci=i;
  if(ci<0) return;
  var c=w.contracts[ci], fill=WX_offerFill(c);
  if(fill.total<c.qtyOz){ toast(WX_ic('x','ge-ic-md')+' Not enough matching product ('+fill.total.toFixed(1)+'/'+c.qtyOz+' oz).'); return; }
  var need=c.qtyOz;
  fill.items.sort(function(a,b){ return num(a.quality,0)-num(b.quality,0); });
  for(i=0;i<fill.items.length&&need>0.001;i++){
    var it=fill.items[i];
    var take=Math.min(num(it.amount,0),need);
    take=Math.round(take*10)/10; need=Math.round((need-take)*10)/10;
    it.amount=Math.round((num(it.amount,0)-take)*10)/10;
  }
  S.inventory=S.inventory.filter(function(x){ return num(x.amount,0)>0; });
  S.cash=num(S.cash,0)+c.rewardCash;
  S.stats.lifetimeRevenue=num(S.stats.lifetimeRevenue,0)+c.rewardCash;
  S.stats.sales=int(S.stats.sales,0)+1;
  if(typeof gainRep==='function') gainRep(c.rewardRep);
  if(typeof gainXP==='function') gainXP(40);
  w.stats.contractsDone++; w.chDone++;
  w.contracts.splice(ci,1);
  toast(WX_ic('scroll','ge-ic-md')+' Contract fulfilled: +'+fmt$(c.rewardCash)+' +'+c.rewardRep+' rep');
  try{ save(); }catch(e){}
  if(typeof updateHUD==='function') updateHUD();
  if(typeof checkMissions==='function') checkMissions();
  if(typeof current!=='undefined'&&current==='dispensary'&&RENDER.dispensary) RENDER.dispensary();
}

function WX_contractsHTML(){
  WX_init();
  var w=S.wx;
  var html='<div class="ge-card"><div class="ge-card-head"><h3>'+WX_ic('scroll','ge-ic-md')+'BUYER CONTRACTS</h3></div>';
  if(!w.offers.length&&!w.contracts.length)
    html+='<div class="ge-empty">'+WX_ic('scroll','ge-ic-xl')+'<h3>No offers right now</h3><p>Sell product at the dispensary and buyers will come to you with contracts.</p></div>';
  w.offers.forEach(function(o){
    html+='<div class="ge-card ge-card-flat ge-wx-offer"><div class="ge-spread"><b>'+esc(o.buyerName)+'</b><span class="ge-caption ge-muted">expires D'+int(o.expiresDay,0)+'</span></div>'+
     '<div class="ge-datarow"><span>Wants</span><b>'+num(o.qtyOz,0)+' oz'+(o.strainId==='any'?' (any strain)':' — '+esc(o.strainName))+'</b></div>'+
     '<div class="ge-datarow"><span>Min quality</span><b>Q'+int(o.minQuality,0)+'</b></div>'+
     (o.minTrait?'<div class="ge-datarow"><span>Min '+esc(o.minTrait.k)+'</span><b>'+int(o.minTrait.v,0)+'</b></div>':'')+
     '<div class="ge-datarow"><span>Reward</span><b class="ge-green ge-num">'+fmt$(o.rewardCash)+' + '+int(o.rewardRep,0)+' rep</b></div>'+
     '<div class="ge-btn-row"><button class="ge-btn ge-btn-sm ge-btn-primary" onclick="WX_acceptOffer('+o.id+')">ACCEPT</button>'+
     '<button class="ge-btn ge-btn-sm ge-btn-ghost" onclick="WX_rejectOffer('+o.id+')">REJECT</button></div></div>';
  });
  w.contracts.forEach(function(c){
    var fill=WX_offerFill(c), ok=fill.total>=c.qtyOz;
    html+='<div class="ge-card ge-card-flat ge-wx-offer"><div class="ge-spread"><b>'+esc(c.buyerName)+'</b><span class="ge-caption ge-muted">due D'+int(c.expiresDay,0)+'</span></div>'+
     '<div class="ge-datarow"><span>Deliver</span><b class="ge-num">'+fill.total.toFixed(1)+'/'+num(c.qtyOz,0)+' oz'+(c.strainId==='any'?'':' — '+esc(c.strainName))+'</b></div>'+
     '<div class="ge-progress'+(ok?' ge-progress-ok':'')+'"><i style="width:'+clamp(fill.total/Math.max(0.01,c.qtyOz)*100,0,100)+'%"></i></div>'+
     '<div class="ge-btn-row"><button class="ge-btn ge-btn-sm '+(ok?'ge-btn-primary':'')+'" '+(ok?'onclick="WX_fulfillContract('+c.id+')"':'disabled')+'>'+(ok?'FULFILL — '+fmt$(c.rewardCash):'NOT ENOUGH STOCK')+'</button></div></div>';
  });
  html+='</div>';
  return html;
}


/* ============================================================
   4. DAILY + WEEKLY CHALLENGES (game-day timers only)
   ============================================================ */
const WX_CHAL_DEFS=[
 {id:'wxcd-hoz',kind:'daily',name:'Daily Harvest',desc:'Harvest {t} oz of flower',stat:'lifetimeHarvestOz',mode:'delta',target:8,unit:'oz',reward:{cash:150,xp:40}},
 {id:'wxcd-sell',kind:'daily',name:'Daily Revenue',desc:'Sell {t} worth of product',stat:'lifetimeRevenue',mode:'delta',target:800,unit:'$',reward:{cash:120,xp:50,rep:2}},
 {id:'wxcd-pheno',kind:'daily',name:'Pheno Work',desc:'Test {t} phenotypes',stat:'phenoTested',mode:'delta',target:4,unit:'',reward:{cash:120,xp:60,p0:2}},
 {id:'wxcd-sales',kind:'daily',name:'Moving Product',desc:'Complete {t} sales',stat:'sales',mode:'delta',target:3,unit:'',reward:{cash:100,xp:40}},
 {id:'wxcd-days',kind:'daily',name:'Steady Grind',desc:'Advance {t} days',stat:'daysAdvanced',mode:'delta',target:2,unit:'',reward:{cash:60,xp:30}},
 {id:'wxcd-q85',kind:'daily',name:'Top Shelf',desc:'Reach {t} best quality (lifetime)',stat:'bestQuality',mode:'reach',target:85,unit:'',reward:{cash:200,xp:80,rep:3}},
 {id:'wxcd-keeper',kind:'daily',name:'Keeper Hunt',desc:'Discover {t} keeper',stat:'keepersFound',mode:'delta',target:1,unit:'',reward:{cash:250,xp:100,p0:5}},
 {id:'wxcw-hoz',kind:'weekly',name:'Weekly Haul',desc:'Harvest {t} oz of flower',stat:'lifetimeHarvestOz',mode:'delta',target:40,unit:'oz',reward:{cash:800,xp:200,rep:5}},
 {id:'wxcw-rev',kind:'weekly',name:'Empire Revenue',desc:'Earn {t} from sales',stat:'lifetimeRevenue',mode:'delta',target:6000,unit:'$',reward:{cash:500,xp:250,rep:8}},
 {id:'wxcw-cross',kind:'weekly',name:"Breeder's Week",desc:'Create {t} crosses',stat:'crosses',mode:'delta',target:2,unit:'',reward:{cash:400,xp:150,p0:4,strain:'gelato-33'}},
 {id:'wxcw-comp',kind:'weekly',name:'Trophy Case',desc:'Win {t} competition',stat:'compsWon',mode:'delta',target:1,unit:'',reward:{cash:600,xp:200,rep:10}},
 {id:'wxcw-elite',kind:'weekly',name:'Elite Genetics',desc:'Find {t} elite phenotype',stat:'eliteFound',mode:'delta',target:1,unit:'',reward:{cash:700,xp:250,p0:6}}
];
const WX_CHAL_STATS=['lifetimeHarvestOz','lifetimeRevenue','phenoTested','sales','daysAdvanced','bestQuality','keepersFound','crosses','compsWon','eliteFound'];
function WX_snapStats(){
  var s={};
  WX_CHAL_STATS.forEach(function(k){ s[k]=num(S.stats[k],0); });
  return s;
}
function WX_chalDef(id){
  for(var i=0;i<WX_CHAL_DEFS.length;i++) if(WX_CHAL_DEFS[i].id===id) return WX_CHAL_DEFS[i];
  return null;
}
function WX_newChal(kind){
  var w=S.wx;
  var pool=WX_CHAL_DEFS.filter(function(d){ return d.kind===kind; });
  if(!pool.length) return;
  var prev=kind==='daily'?w.chal.daily:w.chal.weekly;
  var prevId=prev?prev.defId:null;
  var cands=pool.filter(function(d){ return d.id!==prevId; });
  var def=pick(cands.length?cands:pool);
  w.chal[kind]={
    defId:def.id, name:def.name,
    desc:def.desc.replace('{t}',def.unit==='$'?'$'+def.target:(def.target+(def.unit?' '+def.unit:''))),
    target:def.target, unit:def.unit, stat:def.stat, mode:def.mode,
    start:WX_snapStats(), reward:def.reward, claimed:false, notified:false, bornDay:S.day
  };
}
function WX_ensureChals(){
  var w=S.wx;
  if(!w.chal.daily) WX_newChal('daily');
  if(!w.chal.weekly) WX_newChal('weekly');
}
function WX_chalProg(ch){
  if(!ch) return {cur:0,target:1};
  var def=WX_chalDef(ch.defId);
  if(!def) return {cur:0,target:ch.target||1};
  var cur=num(S.stats[def.stat],0);
  if(def.mode==='reach') return {cur:cur,target:def.target,unit:def.unit,reach:true};
  return {cur:Math.max(0,cur-num(ch.start&&ch.start[def.stat],0)),target:def.target,unit:def.unit};
}
function WX_fmtProg(p){
  if(p.unit==='$') return '$'+Math.round(p.cur).toLocaleString()+' / $'+p.target.toLocaleString();
  if(p.unit==='oz') return (Math.round(p.cur*10)/10)+' / '+p.target+' oz';
  return Math.floor(p.cur)+' / '+p.target;
}
function WX_grantReward(rw){
  rw=rw||{};
  if(rw.cash) S.cash=num(S.cash,0)+num(rw.cash,0);
  if(rw.xp&&typeof gainXP==='function') gainXP(num(rw.xp,0));
  if(rw.rep&&typeof gainRep==='function') gainRep(Math.round(num(rw.rep,0)*(1+WX_exEmp('manager')/100)));
  if(rw.p0&&typeof addP0==='function') addP0('knowledge',num(rw.p0,0));
  if(rw.strain&&typeof unlockStrain==='function') unlockStrain(rw.strain,true);
}
function WX_tickChallenges(){
  var w=S.wx; if(!w) return;
  WX_ensureChals();
  if(S.day>int(w.cday,1)){ WX_newChal('daily'); w.cday=S.day; }
  var wk=w.chal.weekly;
  if(wk&&S.day>=int(wk.bornDay,1)+7) WX_newChal('weekly');
  ['daily','weekly'].forEach(function(k){
    var ch=w.chal[k];
    if(!ch||ch.claimed||ch.notified) return;
    var p=WX_chalProg(ch);
    if(p.cur>=p.target){
      ch.notified=true;
      setTimeout((function(n){ return function(){ toast(WX_ic('trophy','ge-ic-md')+' Challenge complete: <b>'+esc(n)+'</b> — claim it in CHALLENGES'); }; })(ch.name),50);
    }
  });
}

function WX_claimChal(which){
  WX_init();
  var w=S.wx, ch=w.chal[which];
  if(!ch||ch.claimed) return;
  var p=WX_chalProg(ch);
  if(p.cur<p.target){ toast('Not complete yet.'); return; }
  WX_grantReward(ch.reward||{});
  ch.claimed=true;
  w.chal.hist.unshift({name:ch.name,day:S.day,kind:which,reward:ch.reward||{}});
  if(w.chal.hist.length>30) w.chal.hist.length=30;
  toast(WX_ic('trophy','ge-ic-md')+' Challenge claimed: <b>'+esc(ch.name)+'</b>');
  try{ save(); }catch(e){}
  if(typeof updateHUD==='function') updateHUD();
  if(typeof current!=='undefined'&&current==='challenges'&&RENDER.challenges) RENDER.challenges();
}

function WX_chalBadge(){
  if(typeof S==='undefined'||!S||!S.wx||!S.wx.chal) return 0;
  var n=0;
  ['daily','weekly'].forEach(function(k){
    var ch=S.wx.chal[k];
    if(ch&&!ch.claimed){ try{ var p=WX_chalProg(ch); if(p.cur>=p.target) n++; }catch(e){} }
  });
  return n;
}
function WX_chalCardHTML(which){
  var w=S.wx, ch=w.chal[which];
  if(!ch) return '';
  var p=WX_chalProg(ch), done=p.cur>=p.target;
  var pct=clamp(Math.round(p.cur/Math.max(0.001,p.target)*100),0,100);
  var rw=ch.reward||{};
  var rwTxt=[rw.cash?fmt$(rw.cash):'',rw.xp?'+'+rw.xp+' XP':'',rw.rep?'+'+rw.rep+' rep':'',rw.p0?'+'+rw.p0+' P0':'',rw.strain?WX_ic('dna','ge-ic-sm')+' genetics':''].filter(Boolean).join(' • ');
  var left=which==='daily'?'Resets tomorrow':('Renews in '+Math.max(0,int(ch.bornDay,1)+7-S.day)+'d');
  return '<div class="ge-card ge-card-hot"><div class="ge-spread">'+
   '<span class="ge-pill '+(which==='daily'?'ge-pill-neutral':'ge-pill-gold')+'">'+WX_ic(which==='daily'?'day':'trophy','ge-ic-sm')+(which==='daily'?'DAILY':'WEEKLY')+'</span>'+
   '<span class="ge-caption ge-muted">'+left+'</span></div>'+
   '<h3 class="ge-h2">'+esc(ch.name)+'</h3><p class="ge-body ge-muted">'+esc(ch.desc)+'</p>'+
   '<div class="ge-progress-meta"><span>Progress</span><b class="ge-num">'+esc(WX_fmtProg(p))+'</b></div>'+
   '<div class="ge-progress'+(done?' ge-progress-ok':'')+'"><i style="width:'+pct+'%"></i></div>'+
   (rwTxt?'<p class="ge-caption ge-wx-reward">Reward: '+rwTxt+'</p>':'')+
   '<div class="ge-wx-chal-foot">'+
   (ch.claimed?'<span class="ge-pill ge-pill-optimal">'+WX_ic('check','ge-ic-sm')+'CLAIMED</span>':
     done?'<button class="ge-btn ge-btn-sm ge-btn-gold" data-wx-claim="'+which+'">CLAIM REWARD</button>':
     '<span class="ge-caption ge-muted">In progress…</span>')+
   '</div></div>';
}

RENDER.challenges=function(){
  var r=$('challenges-root');
  if(!r) return;
  WX_init();
  WX_ensureChals();
  var html='<div class="ge-screen">'+
   '<div class="ge-screenhead"><button class="ge-screenhead-back" onclick="show(\'menu\')">'+(typeof icon==='function'?icon('x','ge-ic-md'):'')+'<span>MENU</span></button>'+
   '<h2 class="ge-screenhead-title">'+WX_ic('trophy','ge-ic-lg')+'CHALLENGES</h2></div>';
  html+=WX_chalCardHTML('daily');
  html+=WX_chalCardHTML('weekly');
  var hist=S.wx.chal.hist||[];
  html+='<div class="ge-card"><div class="ge-card-head"><h3>'+WX_ic('scroll','ge-ic-md')+'COMPLETED</h3></div>';
  if(hist.length){
    html+=hist.slice(0,20).map(function(h){
      return '<div class="ge-datarow"><span>'+esc(h.name)+' <span class="ge-caption ge-muted">D'+int(h.day,0)+'</span></span><span class="ge-pill ge-pill-optimal">'+WX_ic('check','ge-ic-sm')+'CLAIMED</span></div>';
    }).join('');
  } else html+='<div class="ge-empty">'+WX_ic('trophy','ge-ic-xl')+'<h3>No challenges claimed yet</h3><p>Complete daily and weekly challenges to earn cash, XP and rep.</p></div>';
  html+='</div></div>';
  r.innerHTML=html;
  r.querySelectorAll('[data-wx-claim]').forEach(function(b){ b.onclick=function(){ WX_claimChal(b.dataset.wxClaim); }; });
};


/* ============================================================
   MASTER DAY TICK — integrator calls WX_tick() once per advanceDay()
   ============================================================ */
function WX_tick(){
  if(typeof S==='undefined'||!S) return;
  try{ WX_init(); }catch(e){ return; }
  try{ WX_tickEvents(); }catch(e){}
  try{ WX_marketTick(); }catch(e){}
  try{ WX_tickContracts(); }catch(e){}
  try{ WX_tickChallenges(); }catch(e){}
  try{ WX_envSnapshotTick(); }catch(e){}
}

/* ============================================================
   SHOCKER OWNZ GROW EMPIRE — EXPANSION B: GENETICS DEPTH
   Builder B. Concatenated AFTER game.js. 'use strict' safe.
   CONTRACT: every new top-level identifier starts with GX_.
   Does not touch or redefine any existing code.
   Integrator hooks (see report manifest):
     1. createCross():      GX_enrichCross(cross, A2, B2) right after S.customStrains.push(cross);
     2. RENDER.breeding():  GX_wireBreeding(r) at the end;
     3. RENDER.genetics():  GX_wireGenetics(r) at the end;
     4. harvestPlant():     grade hook after `const oz=..., qq=...;` + report insert after phenoReportModal(report);
     5. normalizeState():   S.gx scrub block; defaultState(): gx:{...} field.
   ============================================================ */
'use strict';

/* ---------------- constants ---------------- */
const GX_TRAIT_KEYS=['yield','potency','resin','terpenes','flavor','aroma','bagAppeal','growthSpeed','vigor','stability','stretch','flowerTime','stressRes'];
const GX_TRAIT_LABELS={yield:'Yield',potency:'Potency',resin:'Resin',terpenes:'Terpenes',flavor:'Flavor',aroma:'Aroma',bagAppeal:'Bag Appeal',growthSpeed:'Growth Speed',vigor:'Vigor',stability:'Stability',stretch:'Stretch',flowerTime:'Flower Time',stressRes:'Stress Res.'};
const GX_RARITY_ORDER={common:0,promising:1,elite:2,legendary:3};
/* 34 base strains: mostly common/promising, a few elite, 2 legendary */
const GX_STRAIN_RARITY={
 'queens-revenge-s1':'legendary','project-zero-og':'legendary',
 'crown-jewel':'elite','mac-1':'elite','permanent-marker':'elite','gg4-s1':'elite','girl-scout-cookies':'elite','jealousy':'elite',
 'slurricane-7':'promising','wedding-cake':'promising','runtz':'promising','gelato-33':'promising','gmo-cookies':'promising',
 'oreoz':'promising','dosidos':'promising','ice-cream-cake':'promising','chemdawg':'promising','tangerine-tbone':'promising',
 'white-widow':'promising','apple-fritter':'promising','gushers':'promising','sunset-sherbet':'promising',
 'tropicana-cookies':'promising','zkittlez':'promising',
 'northern-lights':'common','blue-dream':'common','og-kush':'common','sour-diesel':'common','granddaddy-purp':'common',
 'pineapple-express':'common','strawberry-cough':'common','ak-47':'common','super-silver-haze':'common','rks-s1':'common'
};
const GX_MUT_COLORS=['Deep Purple','Crimson','Midnight Violet','Blood Orange','Ebony','Rose Gold'];
const GX_MUT_TABLE=[
 {kind:'traitBoost',w:40},{kind:'negative',w:20},{kind:'color',w:12},
 {kind:'growth',w:10},{kind:'resin',w:8},{kind:'terps',w:6},{kind:'vigor',w:4}
];
/* Legendary-expression outcomes for the ~2% of mutations that go legendary */
const GX_LEGENDARYX=[
 {id:'CRIMSON TRICHOMES',boost:{resin:22,terpenes:12},desc:'Trichomes flush crimson under light — extreme frost.'},
 {id:'VOID PURPLE',boost:{terpenes:20,resin:14},desc:'Near-black flowers with a haunting, loud nose.'},
 {id:'GAS GIANT',boost:{potency:20,terpenes:16},desc:'Overwhelming fuel funk. Potency off the charts.'},
 {id:'EVERFROST',boost:{resin:24,potency:14},desc:'Buds look dipped in ice — resin production maxed.'},
 {id:'TITAN ROOTS',boost:{vigor:22,yield:14},desc:'A root monster — explosive growth, heavy sets.'},
 {id:'NEON TERPS',boost:{terpenes:24,potency:12},desc:'Candy-bright terpene profile that fills the room.'}
];
const GX_RARITY_BUY_MULT={common:1.0,promising:1.08,elite:1.2,legendary:1.45};

/* ---------------- state ---------------- */
function GX_init(){
  if(typeof S==='undefined'||!S) return;
  if(S.gx&&S.gx._gxv===1) return;
  var g=(S.gx&&typeof S.gx==='object')?S.gx:{};
  if(!g.strainMeta||typeof g.strainMeta!=='object') g.strainMeta={};
  if(!g.lineage||typeof g.lineage!=='object') g.lineage={};
  if(!Array.isArray(g.mutLog)) g.mutLog=[];
  g.grades=num(g.grades,0);
  g._gxv=1;
  S.gx=g;
}
function GX_tick(){
  GX_init();
  if(!S||!S.gx) return;
  if(S.gx.mutLog.length>100) S.gx.mutLog.length=100;
}

/* ---------------- trait helpers ---------------- */
function GX_traitLabel(k){ return GX_TRAIT_LABELS[k]||String(k); }
function GX_traitValue(st,key){
  if(!st) return 50;
  var yld=num(st.yld,50),pot=num(st.pot,50),terp=num(st.terp,50),resin=num(st.resin,50),
      stab=num(st.stab,50),vigor=num(st.vigor,50),ft=num(st.ft,60);
  switch(key){
    case 'yield': return yld;
    case 'potency': return pot;
    case 'resin': return resin;
    case 'terpenes': return terp;
    case 'flavor': return clamp(terp*0.7+pot*0.3,5,100);
    case 'aroma': return clamp(terp*0.8+resin*0.2,5,100);
    case 'bagAppeal': return clamp(resin*0.5+terp*0.3+stab*0.2,5,100);
    case 'growthSpeed': return clamp(100-(ft-50)*2.5,5,100);
    case 'vigor': return vigor;
    case 'stability': return stab;
    case 'stretch': return clamp(vigor*0.5+(100-stab)*0.3+30,5,100);
    case 'flowerTime': return clamp(ft,5,100);
    case 'stressRes': return clamp(stab*0.6+vigor*0.4,5,100);
  }
  return 50;
}
function GX_rarityLabel(r){
  try{ if(typeof RARITY_META!=='undefined'&&RARITY_META[r]) return RARITY_META[r].label; }catch(e){}
  return String(r||'common').toUpperCase();
}
function GX_rarityBadge(rar){
  var icn='leaf';
  try{ if(typeof RARITY_META!=='undefined'&&RARITY_META[rar]) icn=RARITY_META[rar].ico; }catch(e){}
  return '<span class="gx-rarbadge gx-rar-'+rar+'">'+icon(icn,'b-ico')+esc(GX_rarityLabel(rar))+'</span>';
}
/* read-only rarity for any strain id: custom crosses carry cross.rarity */
function GX_strainRarity(id){
  GX_init();
  var st=null;
  try{ st=getStrain(id); }catch(e){}
  if(st&&st.custom){
    if(st.rarity&&GX_RARITY_ORDER[st.rarity]!==undefined) return st.rarity;
    var m=S&&S.gx?S.gx.strainMeta[id]:null;
    if(m&&m.rarity&&GX_RARITY_ORDER[m.rarity]!==undefined) return m.rarity;
    return 'promising';
  }
  return GX_STRAIN_RARITY[id]||'common';
}
/* buyer/collector multiplier by rarity — read-only for market hooks */
function GX_rarityMult(rarity){ return GX_RARITY_BUY_MULT[rarity]||1.0; }

/* ---------------- cross enrichment ---------------- */
function GX_deriveRarity(A,B){
  var ra=GX_RARITY_ORDER[GX_strainRarity(A.id)]||0;
  var rb=GX_RARITY_ORDER[GX_strainRarity(B.id)]||0;
  var r=Math.max(ra,rb), names=['common','promising','elite','legendary'];
  if(ra>=2&&rb>=2&&Math.random()<0.25) r=3;              /* elite x elite can spark legend */
  else if(r>=1&&r<3&&Math.random()<0.12) r=Math.min(3,r+1); /* lucky bump */
  else if(r===0&&Math.random()<0.06) r=1;                 /* diamond in the rough */
  return names[r];
}
function GX_pickHidden(){
  var pool=['flavor','aroma','bagAppeal','growthSpeed','stretch','flowerTime','stressRes'];
  for(var i=pool.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=pool[i]; pool[i]=pool[j]; pool[j]=t; }
  return pool.slice(0,rndi(3,4));
}
/* Integrator calls this inside createCross() right after S.customStrains.push(cross). */
function GX_enrichCross(cross,A,B){
  GX_init();
  if(!cross) return cross;
  A=A||{}; B=B||{};
  cross.gen=int(Math.max(int(A.gen,0),int(B.gen,0))+1,1);
  cross.traitRanges={};
  GX_TRAIT_KEYS.forEach(function(k){
    var a=GX_traitValue(A,k), b=GX_traitValue(B,k);
    cross.traitRanges[k]=[clamp(Math.round(Math.min(a,b)-10),5,100),clamp(Math.round(Math.max(a,b)+10),5,100)];
  });
  cross.rarity=GX_deriveRarity(A,B);
  cross.mutation=GX_rollMutation();
  if(cross.mutation){
    if(cross.mutation.legendary) cross.rarity='legendary';
    else if((GX_RARITY_ORDER[cross.rarity]||0)<1) cross.rarity='promising'; /* mutations are never common */
    GX_applyMutation(cross,cross.mutation);
  }
  cross.createdDay=int(S.day,1);
  cross.bestPheno=0;
  cross.history=[{day:cross.createdDay,event:'Created',detail:(A.name||'?')+' × '+(B.name||'?')}];
  cross.hiddenTraits=GX_pickHidden();
  cross.colorExpr=(cross.mutation&&cross.mutation.color)?cross.mutation.color:null;
  S.gx.lineage[cross.id]={a:A.id||null,b:B.id||null,day:cross.createdDay};
  S.gx.strainMeta[cross.id]={gen:cross.gen,rarity:cross.rarity,createdDay:cross.createdDay,
    parents:[A.id||null,B.id||null],mutation:cross.mutation?cross.mutation.kind:null};
  try{ if(typeof TY_crossHook==='function') TY_crossHook(cross,A,B); }catch(e){}
  return cross;
}

/* ---------------- mutations ---------------- */
function GX_mutChance(){
  var c=0.05; /* base 5% */
  try{ if(typeof EX_buildingLevel==='function') c+=num(EX_buildingLevel('geneticsLab'),0)*0.005; }catch(e){}
  try{ if(typeof EX_employeeBonus==='function') c+=num(EX_employeeBonus('breeding'),0)*0.005; }catch(e){}
  return clamp(c,0.02,0.25);
}
function GX_weightedPick(table){
  var total=0,i;
  for(i=0;i<table.length;i++) total+=num(table[i].w,0);
  var r=Math.random()*total;
  for(i=0;i<table.length;i++){ r-=num(table[i].w,0); if(r<=0) return table[i]; }
  return table[table.length-1];
}
function GX_buildMutation(t){
  var m={kind:t.kind,rolled:true,legendary:false};
  if(t.kind==='traitBoost'){
    var keys=['yield','potency','resin','terpenes','vigor','stability','bagAppeal'];
    var k1=pick(keys), k2=pick(keys), boost={};
    boost[k1]=rndi(8,18);
    if(k2!==k1&&Math.random()<0.5) boost[k2]=rndi(8,14);
    m.title='BENEFICIAL MUTATION'; m.boost=boost;
    m.desc='Positive shift: '+Object.keys(boost).map(function(k){ return '+'+boost[k]+' '+GX_traitLabel(k); }).join(', ');
  }else if(t.kind==='negative'){
    var nk=pick(['stability','stretch','vigor','growthSpeed']);
    var pen=rndi(4,8);
    m.title='UNSTABLE EXPRESSION'; m.boost={}; m.boost[nk]=-pen;
    m.desc='Undesirable quirk: -'+pen+' '+GX_traitLabel(nk)+'. Not run-killing, but watch it.';
  }else if(t.kind==='color'){
    m.title='RARE COLORATION'; m.color=pick(GX_MUT_COLORS);
    m.desc='Expresses striking '+m.color+' hues in flower.';
  }else if(t.kind==='growth'){
    m.title='UNUSUAL GROWTH'; m.boost={vigor:rndi(-6,14),stretch:rndi(6,16)};
    m.desc='Atypical structure — an outlier in the tray. Vigor shifted.';
  }else if(t.kind==='resin'){
    m.title='EXTREME RESIN'; m.boost={resin:20};
    m.desc='+20 resin — trichome overdrive.';
  }else if(t.kind==='terps'){
    m.title='UNIQUE TERPENE PROFILE'; m.boost={flavor:rndi(10,18),aroma:rndi(10,18)};
    m.desc='A novel aroma signature — flavor and aroma surge.';
  }else{
    m.title='UNEXPECTED VIGOR'; m.boost={vigor:rndi(12,18)};
    m.desc='+'+m.boost.vigor+' vigor — explosive early growth.';
  }
  return m;
}
function GX_rollMutation(){
  GX_init();
  if(Math.random()>=GX_mutChance()) return null;
  var r=Math.random(), mut;
  if(r<0.02){ /* ~2% of mutations: LEGENDARY EXPRESSION */
    var lx=pick(GX_LEGENDARYX);
    mut={kind:'legendary',legendary:true,rolled:true,title:lx.id,desc:lx.desc,boost:lx.boost};
  }else{
    mut=GX_buildMutation(GX_weightedPick(GX_MUT_TABLE));
  }
  mut.day=int(S.day,1);
  S.gx.mutLog.unshift({day:mut.day,kind:mut.kind,title:mut.title,detail:mut.desc});
  if(S.gx.mutLog.length>100) S.gx.mutLog.length=100;
  try{ if(typeof addP0==='function') addP0('genetics',2); }catch(e){}
  return mut;
}
function GX_mutField(k){
  return {yield:'yld',potency:'pot',resin:'resin',terpenes:'terp',vigor:'vigor',stability:'stab',flowerTime:'ft'}[k]||null;
}
function GX_applyMutation(cross,mut){
  if(!cross||!mut) return;
  if(mut.color) cross.colorExpr=mut.color;
  if(!mut.boost) return;
  Object.keys(mut.boost).forEach(function(k){
    var d=Math.round(num(mut.boost[k],0)); if(!d) return;
    var f=GX_mutField(k);
    if(f==='ft'){ cross.ft=clamp(int(cross.ft,60)+(d>0?2:-2),45,80); }
    else if(f){ cross[f]=clamp(int(cross[f],50)+d,10,100); }
    else if(k==='flavor'||k==='aroma'){ cross.terp=clamp(int(cross.terp,50)+Math.round(d/2),10,100); }
    else if(k==='bagAppeal'){ cross.resin=clamp(int(cross.resin,50)+Math.round(d/2),10,100); }
    else if(k==='stressRes'){ cross.stab=clamp(int(cross.stab,50)+Math.round(d/2),10,100); }
    else if(k==='stretch'||k==='growthSpeed'){ cross.vigor=clamp(int(cross.vigor,50)+Math.round(d/2),10,100); }
  });
}
/* cinematic mutation reveal (red/gold, DNA motif), then cb() */
function GX_mutationCine(mut,cb){
  var done=false;
  function fin(){ if(done) return; done=true; if(typeof cb==='function') cb(); }
  var inner='<div class="ge-kid-stage ge-mut-stage"><div class="ge-kid-glow"></div><div class="ge-mut-dna">'+dnaSVG('gx-dna-svg')+'</div>'+
   '<div class="ge-kid-kicker">GENETIC ANOMALY DETECTED</div>'+
   '<h2 class="ge-display ge-kid-title">'+esc((mut&&(mut.title||mut.kind))||'MUTATION')+'</h2>'+
   '<p class="ge-kid-desc">'+esc((mut&&mut.desc)||'')+'</p>'+
   ((mut&&mut.legendary)?'<div class="ge-badge ge-badge-legendary ge-mut-legend">'+icon('star','ge-ic-sm')+' LEGENDARY EXPRESSION</div>':'')+
   '<p class="ge-kid-hint">TAP TO CONTINUE</p></div>';
  var back=cineOverlay(inner,'gx-cineback',3600);
  back.addEventListener('click',fin);
  setTimeout(fin,3850);
}

/* short cross cinematic played before the original createCross runs */
function GX_crossCine(cb){
  var done=false;
  function fin(){ if(done) return; done=true; if(typeof cb==='function') cb(); }
  var inner='<div class="ge-kid-stage"><div class="ge-kid-glow"></div><div class="ge-mut-dna">'+dnaSVG('gx-dna-svg')+'</div>'+
   '<div class="ge-kid-kicker">BREEDING LAB</div>'+
   '<h2 class="ge-display ge-kid-title">FUSING PARENT DNA</h2>'+
   '<p class="ge-kid-desc">Pollen meets pistil — a new lineage begins.</p></div>';
  var back=cineOverlay(inner,'gx-cineback',1500);
  back.addEventListener('click',fin);
  setTimeout(fin,1700);
}


/* ---------------- visual genetics lab: prediction ---------------- */
function GX_predictCross(aId,bId){
  GX_init();
  var out={stars:{yield:0,potency:0,resin:0,terpenes:0,vigor:0,stability:0},mutChance:0,ranges:'',accuracy:0,ok:false};
  var A=null,B=null;
  try{ A=getStrain(aId); B=getStrain(bId); }catch(e){}
  if(!A||!B) return out;
  var lab=0,spec=false;
  try{ if(typeof EX_buildingLevel==='function') lab=num(EX_buildingLevel('geneticsLab'),0); }catch(e){}
  try{
    if(typeof EX_employeeBonus==='function') spec=!!EX_employeeBonus('breeder');
    else if(S&&S.crew) spec=!!S.crew.breeder;
  }catch(e){ if(S&&S.crew) spec=!!S.crew.breeder; }
  var acc=clamp(0.55+lab*0.07+(spec?0.10:0),0.40,0.95);
  var spread=(1-acc)*22;
  var keys=['yield','potency','resin','terpenes','vigor','stability'];
  var ranges=[];
  keys.forEach(function(k){
    var a=GX_traitValue(A,k), b=GX_traitValue(B,k);
    var mid=(a+b)/2+rnd(-spread,spread);               /* prediction: midpoint ± noise */
    out.stars[k]=clamp(Math.round(clamp(mid,0,100)/20*2)/2,0,5);
    ranges.push(Math.round(clamp(Math.max(a,b)+10,0,100))-Math.round(clamp(Math.min(a,b)-10,0,100)));
  });
  var avgR=ranges.reduce(function(s,v){ return s+v; },0)/Math.max(1,ranges.length);
  out.ranges=avgR>55?'VERY WIDE — high variance expected':avgR>38?'MODERATE — some variance':avgR>22?'TIGHT — predictable offspring':'VERY TIGHT — highly predictable';
  out.mutChance=Math.round(GX_mutChance()*1000)/10;
  out.accuracy=Math.round(acc*100);
  out.ok=true;
  return out;
}
function GX_starHTML(v){
  var h='<span class="ge-stars" role="img" aria-label="'+v+' of 5 stars">';
  for(var i=1;i<=5;i++){
    var cls='';
    if(v>=i) cls='on';
    else if(v>=i-0.5) cls='half';
    h+='<i class="'+cls+'">'+icon('star','ge-ic-sm')+'</i>';
  }
  return h+'</span>';
}

function GX_predictionHTML(aId,bId){
  var pr=GX_predictCross(aId,bId);
  var A=null,B=null;
  try{ A=getStrain(aId); B=getStrain(bId); }catch(e){}
  if(!pr.ok||!A||!B) return '';
  var rows=[['yield','YIELD'],['potency','POTENCY'],['resin','RESIN'],['terpenes','TERPENES'],['vigor','VIGOR'],['stability','STABILITY']];
  var h='<div class="ge-card gx-predict"><div class="ge-card-head">'+icon('dna','ge-ic-md')+'<h3>GENETICS LAB — OFFSPRING FORECAST</h3></div>';
  h+='<div class="ge-predict-parents"><div class="ge-predict-par"><b class="ge-label">PARENT A</b><span>'+esc(A.name)+'</span><i class="ge-caption">'+esc(GX_rarityLabel(GX_strainRarity(A.id)))+' · GEN '+int(A.gen,0)+'</i></div>';
  h+='<div class="ge-predict-x">×</div>';
  h+='<div class="ge-predict-par"><b class="ge-label">PARENT B</b><span>'+esc(B.name)+'</span><i class="ge-caption">'+esc(GX_rarityLabel(GX_strainRarity(B.id)))+' · GEN '+int(B.gen,0)+'</i></div></div>';
  h+='<div class="ge-progress-meta"><span>TRAIT</span><b>FORECAST</b></div>';
  rows.forEach(function(r){ h+='<div class="ge-progress-meta"><span>'+r[1]+'</span></div><div class="ge-predict-row">'+GX_starHTML(pr.stars[r[0]])+'</div>'; });
  h+='<div class="ge-datarow"><span>Mutation chance</span><b class="ge-num ge-gold-text">'+pr.mutChance+'%</b></div>';
  h+='<div class="ge-datarow"><span>Range spread</span><b>'+esc(pr.ranges)+'</b></div>';
  h+='<div class="ge-datarow"><span>Lab accuracy</span><b class="ge-num">'+pr.accuracy+'%</b></div>';
  h+='<div class="ge-datarow"><span>Undiscovered traits</span><b class="ge-muted">??? · ??? · ???</b></div>';
  h+='<p class="ge-caption">'+icon('warn','ge-ic-sm')+' PREDICTION — GROW TO DISCOVER. Seeds must be grown to reveal true traits.</p></div>';
  return h;
}

/* Integrator calls this at the END of RENDER.breeding. Injects the prediction
   panel above the name-your-cross card and wraps #btn-cross: cinematic first,
   then the ORIGINAL createCross, then a mutation reveal if one rolled. */
function GX_wireBreeding(root){
  var r=root||((typeof $==='function')?$('breeding-root'):null);
  if(!r) return;
  var aidEl=r.querySelector('#breed-a'), bidEl=r.querySelector('#breed-b');
  var btn=r.querySelector('#btn-cross');
  if(!aidEl||!bidEl||!btn) return;
  if(!r.querySelector('.gx-predict')){
    var pred=GX_predictionHTML(aidEl.value,bidEl.value);
    if(pred){
      var card=btn.closest?btn.closest('.card'):null;
      if(card) card.insertAdjacentHTML('beforebegin',pred);
      else btn.insertAdjacentHTML('beforebegin',pred);
    }
  }
  if(btn.dataset.gxWired) return;
  btn.dataset.gxWired='1';
  var orig=btn.onclick;
  btn.onclick=function(){
    var before=0;
    try{ before=S.customStrains.length; }catch(e){}
    GX_crossCine(function(){
      try{ if(typeof orig==='function') orig(); }catch(e){}
      try{
        if(S&&S.customStrains.length>before){
          var nc=S.customStrains[S.customStrains.length-1];
          if(nc&&nc.mutation) GX_mutationCine(nc.mutation,function(){});
        }
      }catch(e){}
    });
  };
}

/* ---------------- deep harvest quality ---------------- */
function GX_gradeHarvest(h){
  GX_init();
  h=h||{};
  var ph=h.pheno||{};
  var st=null;
  try{ st=getStrain(h.strainId); }catch(e){}
  var ft=st?num(st.ft,60):60;
  var q=num(h.quality,60);
  /* 1. genetics — pheno potential sets the ceiling */
  var genKeys=['yieldPot','potencyPot','resinPot','terpenePot','bagAppeal','stability','vigor'];
  var gen=0; genKeys.forEach(function(k){ gen+=num(ph[k],60); }); gen/=(genKeys.length);
  /* 2. phenotype expression */
  var prar={common:55,promising:65,elite:80,legendary:95}[ph.rarity]||55;
  if(ph.legendaryTrait) prar=Math.min(100,prar+5);
  /* 3. environment */
  var env=clamp(num(h.envScore,70),0,100);
  /* 4. player care — stress, health history, feeding/watering */
  var care=h.care||{};
  var stressC=clamp(100-num(care.stress,20)*1.4,0,100);
  var healthC=clamp(num(care.minHealth,80),0,100);
  var feedC=clamp((num(care.avgWater,70)+num(care.avgNutrition,70))/2,0,100);
  var careS=clamp(stressC*0.4+healthC*0.4+feedC*0.2,0,100);
  /* 5. equipment */
  var equip=clamp((num(h.equipAvg,1)-1)/4*100,0,100);
  /* 6. timing — harvest window vs strain flower time */
  var fd=num(h.flowerDays,ft);
  var timing=fd<=ft+3?100:clamp(100-(fd-ft-3)*6,40,100);
  /* 7. yield */
  var yieldN=clamp(num(h.yieldOz,0)/4.5*100,0,100);
  var score=clamp(gen*0.20+prar*0.15+env*0.20+careS*0.20+equip*0.10+timing*0.10+yieldN*0.05,0,100);
  score=Math.round(score*10)/10;
  var grade=score>=95?'LEGENDARY':score>=88?'MASTER GROW':score>=80?'TOP SHELF':score>=70?'PREMIUM':score>=55?'GOOD':'STANDARD';
  var stats={
    yield:Math.round(clamp(num(h.yieldOz,0),0,999)*10)/10,
    potency:Math.round(clamp(num(h.potency,q),5,100)),
    resin:Math.round(clamp(num(h.resin,q),5,100)),
    terpenes:Math.round(clamp(num(h.terpenes,q),5,100)),
    flavor:Math.round(clamp(num(h.terpenes,q)*0.7+q*0.3,5,100)),
    aroma:Math.round(clamp(num(h.terpenes,q)*0.8+num(h.resin,q)*0.2,5,100)),
    appearance:Math.round(clamp(num(h.bagAppeal,q),5,100)),
    density:Math.round(clamp(num(h.bagAppeal,q)*0.6+num(h.resin,q)*0.4,5,100)),
    growthSpeed:Math.round(clamp(num(ph.flowerSpeed,60),5,100)),
    stability:Math.round(clamp(num(ph.stability,60),5,100)),
    overall:score
  };
  var g={strainId:h.strainId||null,strainName:st?st.name:'Unknown',score:score,grade:grade,stats:stats,
    parts:{genetics:Math.round(gen),phenotype:Math.round(prar),environment:Math.round(env),
      care:Math.round(careS),equipment:Math.round(equip),timing:Math.round(timing),yield:Math.round(yieldN)},
    day:int(S.day,1)};
  S.gx.grades++;
  S.gx.lastGrade=g;
  return g;
}
function GX_gradeReportHTML(g){
  if(!g) return '';
  var cls='gx-grade-'+String(g.grade).toLowerCase().replace(/ /g,'');
  var h='<div class="ge-card gx-grade '+cls+'">';
  h+='<div class="ge-card-head">'+icon('trophy','ge-ic-md')+'<h3>'+esc(g.grade)+'</h3></div>';
  h+='<div class="ge-datarow"><span>GRADE SCORE</span><b class="ge-num">'+g.score+'</b></div>';
  h+='<div class="ge-section-title">WHAT DROVE THE GRADE</div><div class="gx-grade-parts">';
  [['Genetics',g.parts.genetics],['Phenotype',g.parts.phenotype],['Environment',g.parts.environment],
   ['Grower Care',g.parts.care],['Equipment',g.parts.equipment],['Timing',g.parts.timing]].forEach(function(p){
    h+='<div class="ge-progress-meta"><span>'+p[0]+'</span><b>'+p[1]+'</b></div><div class="ge-progress"><i style="width:'+clamp(Math.round(num(p[1],0)),0,100)+'%"></i></div>';
  });
  h+='</div><div class="ge-section-title">FINAL STATS</div><div class="gx-grade-stats">';
  [['Yield (oz)',g.stats.yield],['Potency',g.stats.potency],['Resin',g.stats.resin],['Terpenes',g.stats.terpenes],
   ['Flavor',g.stats.flavor],['Aroma',g.stats.aroma],['Appearance',g.stats.appearance],['Density',g.stats.density],
   ['Growth Speed',g.stats.growthSpeed],['Stability',g.stats.stability]].forEach(function(s){
    h+='<div class="ge-datarow"><span>'+s[0]+'</span><b class="ge-num">'+s[1]+'</b></div>';
  });
  h+='</div><p class="ge-caption">Graded by the Genetics Lab — genetics set the ceiling, your grow set the result.</p></div>';
  return h;
}


/* ---------------- lineage tree ---------------- */
function GX_nodeHTML(id,isCenter,x,y,delay){
  var st=null;
  try{ st=getStrain(id); }catch(e){}
  if(!st) return '';
  var rar=GX_strainRarity(id);
  var gen=(st.gen!==undefined&&st.gen!==null)?('GEN '+int(st.gen,0)):'BASE';
  var nm=esc(st.name); if(nm.length>20) nm=nm.slice(0,19)+'…';
  return '<g transform="translate('+x+','+y+')"><g class="ge-lin-node'+(isCenter?' ge-lin-center':'')+' ge-lin-rar-'+rar+'" data-gx-lin="'+esc(id)+'" tabindex="0" role="button" aria-label="Lineage: '+esc(st.name)+'" style="animation-delay:'+delay+'ms">'+
    '<rect class="ge-lin-box" width="150" height="48" rx="10"></rect>'+
    '<text class="ge-lin-name" x="75" y="21" text-anchor="middle">'+nm+'</text>'+
    '<text class="ge-lin-sub" x="75" y="37" text-anchor="middle">'+esc(GX_rarityLabel(rar))+' · '+gen+'</text>'+
    '</g></g>';
}

function GX_lineageHTML(strainId){
  GX_init();
  var center=null;
  try{ center=getStrain(strainId); }catch(e){}
  if(!center) return '<div class="ge-linwrap"><p class="ge-muted">Unknown strain.</p></div>';
  var gens=[[strainId]];
  for(var d=0;d<4;d++){
    var next=[];
    gens[d].forEach(function(id){
      var L=S.gx.lineage[id];
      if(L){
        if(L.a&&next.indexOf(L.a)<0) next.push(L.a);
        if(L.b&&next.indexOf(L.b)<0) next.push(L.b);
      }
    });
    if(!next.length) break;
    gens.push(next);
  }
  var names=['THIS STRAIN','PARENTS','GRANDPARENTS','GREAT-GRANDPARENTS','FOUNDATION'];
  var NW=150,NH=48,HG=16,VG=64,LBL=26;
  var maxN=1; gens.forEach(function(g){ if(g.length>maxN) maxN=g.length; });
  var W=maxN*(NW+HG)+HG, H=gens.length*(NH+VG)+LBL;
  var pos={}, nodes='', lines='', labels='', di=0;
  var rev=gens.slice().reverse(); /* oldest generation at top */
  rev.forEach(function(ids,ri){
    var y=LBL+ri*(NH+VG);
    var rowW=ids.length*(NW+HG)-HG;
    var x0=(W-rowW)/2;
    ids.forEach(function(id,ci){
      var x=x0+ci*(NW+HG);
      pos[id]={x:x+NW/2,y:y};
      nodes+=GX_nodeHTML(id,id===strainId,x,y,di*90);
      di++;
    });
  });
  gens.forEach(function(ids,gi){
    if(gi>=gens.length-1) return;
    ids.forEach(function(id){
      var L=S.gx.lineage[id]; if(!L) return;
      var c=pos[id]; if(!c) return;
      [L.a,L.b].forEach(function(pid,pi){
        var p=pos[pid]; if(!p) return;
        lines+='<line class="ge-lin-line" x1="'+c.x+'" y1="'+c.y+'" x2="'+p.x+'" y2="'+(p.y+NH)+'" style="animation-delay:'+(di*90+pi*140)+'ms"/>';
      });
    });
  });
  rev.forEach(function(ids,ri){
    var label=names[Math.min(gens.length-1-ri,names.length-1)];
    labels+='<text class="ge-lin-glabel" x="'+HG+'" y="'+(LBL+ri*(NH+VG)-8)+'">'+label+' ('+ids.length+')</text>';
  });
  var h='<div class="ge-linwrap"><div class="ge-card-head">'+icon('dna','ge-ic-md')+'<h3>LINEAGE — '+esc(center.name)+'</h3></div>'+
   '<div class="ge-lin-scroll"><svg class="ge-lin-svg" viewBox="0 0 '+W+' '+H+'" style="width:'+W+'px;height:'+H+'px" role="tree" aria-label="Lineage tree for '+esc(center.name)+'">'+
   lines+labels+nodes+'</svg></div>';
  if(!S.gx.lineage[strainId])
    h+='<p class="ge-caption ge-muted">'+icon('grow','ge-ic-sm')+' Foundation genetics — no recorded parents. Breed it to start a lineage.</p>';
  h+='<p class="ge-caption ge-muted">Tap any ancestor to center the tree on it.</p></div>';
  return h;
}

function GX_wireLineage(box){
  if(!box) return;
  box.querySelectorAll('[data-gx-lin]').forEach(function(nd){
    nd.addEventListener('click',function(){
      box.innerHTML=GX_lineageHTML(nd.getAttribute('data-gx-lin'));
      GX_wireLineage(box);
    });
    nd.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){ e.preventDefault(); nd.dispatchEvent(new Event('click')); }
    });
  });
  /* legacy collapsible generation rows — guarded, kept for compatibility */
  box.querySelectorAll('[data-gx-gen]').forEach(function(hd){
    hd.onclick=function(){
      var nodes=box.querySelector('[data-gx-gennodes="'+hd.getAttribute('data-gx-gen')+'"]');
      if(nodes){ nodes.classList.toggle('gx-collapsed'); hd.classList.toggle('gx-closed'); }
    };
  });
}

function GX_lineageModal(strainId){
  var m=modal('<div class="ge-modal-head">'+icon('dna','ge-ic-md')+'<h3>LINEAGE TREE</h3></div><div class="ge-modal-body"><div id="gx-lin-box">'+GX_lineageHTML(strainId)+'</div></div>'+
    '<div class="ge-modal-foot"><button class="ge-btn ge-btn-ghost" id="gx-lin-close">CLOSE</button></div>');
  GX_wireLineage(m.querySelector('#gx-lin-box'));
  m.querySelector('#gx-lin-close').onclick=function(){ closeModal(m); };
  return m;
}

/* Integrator calls this at the END of RENDER.genetics. Adds a working
   VIEW LINEAGE button + rarity badge to every strain card. */
function GX_wireGenetics(root){
  var r=root||((typeof $==='function')?$('genetics-root'):null);
  if(!r) return;
  r.querySelectorAll('.strain-card').forEach(function(card){
    if(card.querySelector('[data-gx-lineage]')) return;
    var idBtn=card.querySelector('[data-growseed],[data-hunt],[data-vkeepers],[data-buygen],[data-preserve]');
    if(!idBtn) return;
    var ds=idBtn.dataset;
    var sid=ds.growseed||ds.hunt||ds.vkeepers||ds.buygen||ds.preserve;
    if(!sid) return;
    var h3=card.querySelector('h3');
    if(h3&&!h3.querySelector('.gx-rarbadge')) h3.insertAdjacentHTML('beforeend',' '+GX_rarityBadge(GX_strainRarity(sid)));
    /* injected actions share one wrapping design-system row so they can
       never overflow the card on narrow phones */
    var row=card.querySelector('.ge-btn-row.gx-extra-row');
    if(!row){ row=document.createElement('div'); row.className='ge-btn-row gx-extra-row'; card.appendChild(row); }
    var b=document.createElement('button');
    b.className='ge-btn ge-btn-sm ge-btn-ghost gx-linbtn';
    b.setAttribute('data-gx-lineage',sid);
    b.innerHTML=icon('dna','ge-ic-sm')+' VIEW LINEAGE';
    b.onclick=(function(id){ return function(){ GX_lineageModal(id); }; })(sid);
    row.appendChild(b);
  });
}
/* ============================================================
   SHOCKER OWNZ GROW EMPIRE — expC.js (Builder C: "Empire Depth")
   Concatenated AFTER game.js. Never edits existing code.
   ALL top-level identifiers start with EX_ (screens via RENDER.* allowed).
   Requires integrator hooks (see manifest in final report).
   ============================================================ */
'use strict';

/* ================= S.ex state ================= */
function EX_defaultEx(){
  return {
    buildings:{ growRoom:1, dispensary:1, processing:1, storage:1, geneticsLab:1,
      breedingLab:1, motherRoom:1, security:1, research:1, p0vault:1 },
    employees:[], pool:[], pday:1,
    locations:{ current:'home', unlocked:['home'] },
    legacy:{ runs:0, bonus:{ qual:0, yield:0 } },
    records:{}, trophies:[], ach:{}
  };
}
/* Scrub/upgrade S.ex on load: old saves get safe defaults. Idempotent. */
function EX_normalizeEx(){
  if(typeof S==='undefined'||!S) return;
  const d=EX_defaultEx();
  if(!S.ex||typeof S.ex!=='object') S.ex=d;
  const x=S.ex;
  if(!x.buildings||typeof x.buildings!=='object') x.buildings={};
  Object.keys(d.buildings).forEach(k=>{ x.buildings[k]=clamp(int(x.buildings[k],1),1,5); });
  if(!Array.isArray(x.employees)) x.employees=[];
  x.employees=x.employees.filter(e=>e&&typeof e==='object').map(e=>({
    id:String(e.id||('e'+Date.now()+rndi(100,999))), name:String(e.name||'Hand'),
    role:String(e.role||'grower'), rarity:String(e.rarity||'common'),
    lvl:Math.max(1,int(e.lvl,1)), xp:Math.max(0,num(e.xp,0)),
    skill:Math.max(1,num(e.skill,5)), salary:Math.max(1,num(e.salary,10)),
    assigned:e.assigned!==false,
    pers:String(e.pers||''), morale:clamp(num(e.morale,70),0,100), loyalty:clamp(num(e.loyalty,40),0,100),
    mistakes:Math.max(0,int(e.mistakes,0)), raises:Math.max(0,int(e.raises,0)), promo:!!e.promo,
    daysWorked:Math.max(0,int(e.daysWorked,0)) /* P3-W5: experience tenure; backfills 0 */
  }));
  if(!Array.isArray(x.pool)) x.pool=[];
  x.pday=Math.max(1,int(x.pday,int(S.day,1)));
  if(!x.locations||typeof x.locations!=='object') x.locations={current:'home',unlocked:['home']};
  if(!EX_LOCATIONS.some(l=>l.id===x.locations.current)) x.locations.current='home';
  if(!Array.isArray(x.locations.unlocked)||!x.locations.unlocked.length) x.locations.unlocked=['home'];
  if(!x.legacy||typeof x.legacy!=='object') x.legacy={runs:0,bonus:{qual:0,yield:0}};
  x.legacy.runs=Math.max(0,int(x.legacy.runs,0));
  if(!x.legacy.bonus||typeof x.legacy.bonus!=='object') x.legacy.bonus={qual:0,yield:0};
  x.legacy.bonus.qual=Math.max(0,num(x.legacy.bonus.qual,0));
  x.legacy.bonus.yield=Math.max(0,num(x.legacy.bonus.yield,0));
  if(!x.records||typeof x.records!=='object') x.records={};
  if(!Array.isArray(x.trophies)) x.trophies=[];
  if(!x.ach||typeof x.ach!=='object') x.ach={};
  S.ex=x;
}
function EX_ready(){
  return (typeof S!=='undefined'&&S&&S.ex&&S.ex.buildings&&typeof S.ex.buildings==='object');
}
/* Safe HTML append (insertAdjacentHTML with innerHTML fallback). */
function EX_appendHTML(el,html){
  try{
    if(el&&typeof el.insertAdjacentHTML==='function'){ el.insertAdjacentHTML('beforeend',html); return; }
  }catch(e){}
  if(el) el.innerHTML=(el.innerHTML||'')+html;
}
/* Idempotent boot: state scrub + register new screens + build <section>s. */
function EX_init(){
  if(typeof S==='undefined'||!S) return false;
  EX_normalizeEx();
  ['home','achievements','leaderboards','locations'].forEach(id=>{
    if(!SCREENS.includes(id)) SCREENS.push(id);
    if(!$('scr-'+id)){
      const sec=document.createElement('section');
      sec.id='scr-'+id; sec.className='screen hidden';
      sec.innerHTML='<div id="'+id+'-root"></div>';
      const app=$('app'); if(app) app.appendChild(sec);
    }
  });
  if(!S.ex.pool.length) EX_genPool();
  return true;
}

/* ================= UPGRADEABLE BUILDINGS =================
   bonus semantics per building (see bonusText + bfmt):
   growRoom   +yield %            | dispensary +sale price %
   processing +processing output %| storage    inventory cap (oz)
   geneticsLab revealed traits   | breedingLab prediction tighten %
   motherRoom +clone success %    | security   -bad event %
   research   +hidden reveal %    | p0vault    +P0 pts/day        */
const EX_BUILDINGS=[
 {id:'growRoom',name:'GROW ROOM',ico:'grow',desc:'Dialed-in flower rooms. Bigger, frostier harvests.',
  bonusText:'Yield bonus',bfmt:v=>'+'+v+'% yield',
  levels:[{cost:0,bonus:0},{cost:2500,bonus:4},{cost:12000,bonus:8},{cost:60000,bonus:14},{cost:250000,bonus:22}]},
 {id:'dispensary',name:'DISPENSARY',ico:'dispensary',desc:'Flagship retail. Buyers pay more for the brand.',
  bonusText:'Sale price bonus',bfmt:v=>'+'+v+'% sale price',
  levels:[{cost:0,bonus:0},{cost:2000,bonus:3},{cost:10000,bonus:6},{cost:50000,bonus:10},{cost:200000,bonus:15}]},
 {id:'processing',name:'PROCESSING LAB',ico:'feed',desc:'Extraction & edibles line. More output per oz in.',
  bonusText:'Processing efficiency',bfmt:v=>'+'+v+'% output',
  levels:[{cost:0,bonus:0},{cost:1800,bonus:5},{cost:9000,bonus:10},{cost:45000,bonus:18},{cost:180000,bonus:30}]},
 {id:'storage',name:'STORAGE VAULT',ico:'jar',desc:'Climate-controlled vault. Hold more inventory.',
  bonusText:'Inventory cap',bfmt:v=>int(v,0)+' oz cap',
  levels:[{cost:0,bonus:200},{cost:1500,bonus:400},{cost:8000,bonus:800},{cost:40000,bonus:1600},{cost:150000,bonus:5000}]},
 {id:'geneticsLab',name:'GENETICS LAB',ico:'genetics',desc:'Sequence & study. Reveals more pheno traits, more mutations.',
  bonusText:'Revealed traits / mutation luck',bfmt:v=>v+' traits revealed',
  levels:[{cost:0,bonus:0},{cost:3000,bonus:2},{cost:15000,bonus:3},{cost:75000,bonus:4},{cost:300000,bonus:5}]},
 {id:'breedingLab',name:'BREEDING LAB',ico:'breeding',desc:'Precision pollination. Tighter, truer predictions.',
  bonusText:'Prediction accuracy',bfmt:v=>'+'+v+'% tighter',
  levels:[{cost:0,bonus:0},{cost:2500,bonus:15},{cost:12000,bonus:30},{cost:60000,bonus:45},{cost:250000,bonus:60}]},
 {id:'motherRoom',name:'MOTHER ROOM',ico:'mothers',desc:'Elite moms under perfect care. Clones root stronger.',
  bonusText:'Clone success',bfmt:v=>'+'+v+'% clone success',
  levels:[{cost:0,bonus:0},{cost:2200,bonus:5},{cost:11000,bonus:10},{cost:55000,bonus:18},{cost:220000,bonus:28}]},
 {id:'security',name:'SECURITY',ico:'lock',desc:'Cameras, guards, discretion. Fewer bad global events.',
  bonusText:'Bad event reduction',bfmt:v=>'-'+v+'% bad events',
  levels:[{cost:0,bonus:0},{cost:2800,bonus:10},{cost:14000,bonus:20},{cost:70000,bonus:32},{cost:280000,bonus:45}]},
 {id:'research',name:'RESEARCH FACILITY',ico:'scroll',desc:'R&D wing. Hidden traits surface faster.',
  bonusText:'Hidden trait reveal speed',bfmt:v=>'+'+v+'% faster',
  levels:[{cost:0,bonus:0},{cost:3500,bonus:10},{cost:18000,bonus:20},{cost:90000,bonus:35},{cost:350000,bonus:55}]},
 {id:'p0vault',name:'PROJECT 0 VAULT',ico:'project0',desc:'A shrine to the cause. P0 points trickle in daily.',
  bonusText:'P0 trickle',bfmt:v=>'+'+v+' P0/day',
  levels:[{cost:0,bonus:0},{cost:4000,bonus:1},{cost:20000,bonus:2},{cost:100000,bonus:3},{cost:400000,bonus:5}]}
];

/* Cross-builder interface: other builders call EX_buildingLevel(id) guarded. */
function EX_buildingLevel(id){
  if(!EX_ready()) return 1;
  return clamp(int(S.ex.buildings[id],1),1,5);
}
function EX_buildingBonus(id){
  const b=EX_BUILDINGS.find(x=>x.id===id); if(!b) return 0;
  return num(b.levels[clamp(EX_buildingLevel(id)-1,0,4)].bonus,0);
}
/* Cross-builder interface: inventory cap (oz). Integrator wires into sell/process caps. */
function EX_storageCap(){
  return num(EX_BUILDINGS.find(b=>b.id==='storage').levels[clamp(EX_buildingLevel('storage')-1,0,4)].bonus,200);
}
function EX_upgradeBuilding(id){
  if(!EX_init()) return;
  const b=EX_BUILDINGS.find(x=>x.id===id); if(!b) return;
  const lv=EX_buildingLevel(id);
  if(lv>=5){ toast(icon('star','ge-ic-md')+' '+esc(b.name)+' is already maxed out.'); return; }
  const cost=b.levels[lv].cost;
  if(num(S.cash,0)<cost){ toast(icon('x','ge-ic-md')+' Need '+fmt$(cost)+' to upgrade '+esc(b.name)+'.'); return; }
  S.cash-=cost; S.ex.buildings[id]=lv+1;
  gainXP(80); gainRep(5);
  toast(icon('empire','ge-ic-md')+' '+esc(b.name)+' → <b>LEVEL '+(lv+1)+'</b><br><span class="ge-muted">'+esc(b.bonusText)+': '+esc(b.bfmt(b.levels[lv].bonus))+'</span>');
  save(); updateHUD(); EX_checkAch();
  if(current==='empire') RENDER.empire();
}

function EX_buildingsHTML(){
  let html='<div class="ge-card ge-card-flat"><div class="ge-card-head"><h3>'+icon('empire','ge-ic-lg')+'UPGRADEABLE BUILDINGS</h3></div>'+
   '<p class="ge-caption ge-muted">Ten buildings, five levels each. Real bonuses that stack with everything else you own.</p></div>';
  EX_BUILDINGS.forEach(b=>{
    const lv=EX_buildingLevel(b.id), maxed=lv>=5;
    const cur=b.levels[lv-1], nxt=maxed?null:b.levels[lv];
    html+='<div class="ge-card ge-equip"><div class="ge-equip-ico">'+icon(b.ico,'ge-ic-xl')+'</div><div class="ge-equip-body">';
    html+='<div class="ge-card-head"><h3>'+esc(b.name)+'</h3><span class="ge-pill '+(lv>=5?'ge-pill-gold':'ge-pill-neutral')+'">LV '+lv+'/5</span></div>';
    html+='<p class="ge-caption ge-muted">'+esc(b.desc)+'</p>';
    html+='<div class="ge-datarow"><span>'+icon('star','ge-ic-md')+esc(b.bonusText)+'</span><b class="ge-num">'+esc(b.bfmt(cur.bonus))+'</b></div>';
    html+='<div class="ge-progress"><i style="width:'+(lv/5*100)+'%"></i></div>';
    html+=maxed?'<p class="ge-label ge-gold-text">'+icon('star','ge-ic-sm')+' MAXED OUT</p>'
      :'<div class="ge-datarow"><span>'+icon('cash','ge-ic-md')+'Next: '+esc(b.bfmt(nxt.bonus))+'</span><b class="ge-num">'+fmt$(nxt.cost)+'</b></div>'+
       '<button class="ge-btn ge-btn-primary ge-btn-block" data-ex-upg="'+b.id+'">'+icon('plus','ge-ic-md')+'UPGRADE — '+fmt$(nxt.cost)+'</button>';
    html+='</div></div>';
  });
  return html;
}

function EX_empireTabsHTML(){
  const tabs=[['facilities','FACILITIES'],['equipment','EQUIPMENT'],['crew','CREW'],['compete','COMPETE'],['buildings','BUILDINGS'],['staff','STAFF']];
  return '<div class="tabs ge-tabs" role="tablist">'+tabs.map(t=>'<button class="tab ge-tab'+(empireTab===t[0]?' active is-active':'')+'" data-extab="'+t[0]+'" role="tab">'+t[1]+'</button>').join('')+'</div>';
}

/* Integrator calls EX_wireEmpire() at the END of RENDER.empire. */
function EX_wireEmpire(root){
  if(!EX_init()) return;
  const r=root||$('empire-root'); if(!r) return;
  const oldTabs=r.querySelector('.tabs');
  if(oldTabs) oldTabs.outerHTML=EX_empireTabsHTML();
  const tabs=r.querySelector('.tabs');
  if(tabs) tabs.querySelectorAll('[data-extab]').forEach(b=>{
    b.onclick=()=>{ empireTab=b.dataset.extab; RENDER.empire(); };
  });
  if(empireTab==='buildings'||empireTab==='staff'){
    let n=tabs?tabs.nextSibling:null;
    while(n){ const nx=n.nextSibling; n.remove(); n=nx; }
    EX_appendHTML(r, empireTab==='buildings'?EX_buildingsHTML():EX_employeesHTML());
  }
  EX_wireEmpireActions(r);
}
function EX_wireEmpireActions(r){
  r.querySelectorAll('[data-ex-upg]').forEach(b=>b.onclick=()=>EX_upgradeBuilding(b.dataset.exUpg));
  r.querySelectorAll('[data-ex-hirepool]').forEach(b=>b.onclick=()=>EX_hireEmp(b.dataset.exHirepool));
  r.querySelectorAll('[data-ex-fire]').forEach(b=>b.onclick=()=>EX_fireEmp(b.dataset.exFire));
  r.querySelectorAll('[data-ex-train]').forEach(b=>b.onclick=()=>EX_trainEmp(b.dataset.exTrain));
  r.querySelectorAll('[data-ex-assign]').forEach(b=>b.onclick=()=>EX_toggleAssign(b.dataset.exAssign));
}

/* ================= EMPLOYEES (named staff) =================
   Separate from the boolean crew system (untouched). Bonuses via EX_employeeBonus(role):
   grower    % daily stress reduction (cap 40)   | geneticist analysis pts (cap 30)
   budtender % sale price bonus (cap 25)         | processor  % processing output (cap 30)
   manager   % cost reduction (cap 15)           | breeding   % prediction tighten (cap 50)
   tech      % failure reduction (cap 30)                                   */
const EX_ROLES=[
 {id:'grower',name:'GROWER',desc:'Keeps plants calm. Reduces daily plant stress.',salaryBase:30},
 {id:'geneticist',name:'GENETICIST',desc:'Lab coat. Sharper phenotype analysis.',salaryBase:55},
 {id:'budtender',name:'BUDTENDER',desc:'Moves product. Boosts dispensary sale prices.',salaryBase:35},
 {id:'processor',name:'PROCESSOR',desc:'Extraction artist. More output when processing.',salaryBase:40},
 {id:'manager',name:'MANAGER',desc:'Runs the books. Reduces all purchase costs.',salaryBase:70},
 {id:'breeding',name:'BREEDING SPECIALIST',desc:'Pollen whisperer. Tighter cross predictions.',salaryBase:60},
 {id:'tech',name:'FACILITY TECH',desc:'Wrench hand. Fewer equipment failures.',salaryBase:45},
 {id:'assistant',name:'GROW ASSISTANT',desc:'Extra hands. Small boost to plant growth.',salaryBase:25},
 {id:'irritech',name:'IRRIGATION TECH',desc:'Water systems run smoother. Less water waste.',salaryBase:35},
 {id:'trimmer',name:'TRIMMER',desc:'Faster harvests. Better bag appeal.',salaryBase:30},
 {id:'dispmgr',name:'DISPENSARY MANAGER',desc:'Runs the shop floor. Happier customers.',salaryBase:65},
 /* P3-W5: wave-5 crew expansion — Irrigation Technician / Trimmer / Breeder / Manager
    already exist above (irritech / trimmer / breeding / manager); these four are new. */
 {id:'growtech',name:'GROW TECHNICIAN',desc:'Steady hands. Plants recover health and shake stress faster.',salaryBase:40},
 {id:'processtech',name:'PROCESSING TECHNICIAN',desc:'Runs the lab line. More processing capacity and output.',salaryBase:45},
 {id:'dispworker',name:'DISPENSARY WORKER',desc:'Floor staff. More customers served per budtender shift.',salaryBase:35},
 {id:'mastergrower',name:'MASTER GROWER',desc:'A living legend. Lifts final harvest quality.',salaryBase:90}
];
const EX_RARITY={
 common:{name:'COMMON',mult:1,cls:'ex-r-com'},
 skilled:{name:'SKILLED',mult:1.5,cls:'ex-r-ski'},
 elite:{name:'ELITE',mult:2.2,cls:'ex-r-eli'},
 legendary:{name:'LEGENDARY',mult:3.2,cls:'ex-r-leg'}
};
const EX_NAMES=['Rico Vane','Mara Quinn','Dez Carter','Juno Reyes','Silas Crow','Tess Malone','Big O','Frankie D',
 'Lena Cross','Otto Pike','Sal Vega','Nina Frost','Cole Banner','Ivy Sloane','Marcus Reed','Dana Wolfe',
 'Hank Mercer','Rosa Delgado','Eddie Knox','Vic Tanner','Samara Grey','Lou Brass','Pete Ash','Carmen Ruiz',
 'Tommy Flint','Gus Harper','Willa Dane','Rex Dalton','Maya Stone','Joey Crash','Alba Nye','Kenji Sato',
 'Ruth Calloway','Dom Ferris','Pearl Adkins','Leo Marsh','Sable Voss','Hugo Crane','Tara Quinn','Moe Delgado',
 'Iris Vale','Otto Brenner','Cleo Hart','Rafe Cole','Dottie Vane','Slim Pickens','Ada Bloom','Ray Kessler'];
function EX_roleById(id){ return EX_ROLES.find(r=>r.id===id)||EX_ROLES[0]; }
function EX_makeCandidate(){
  const role=pick(EX_ROLES), rr=Math.random();
  const rarity=rr<0.55?'common':rr<0.83?'skilled':rr<0.96?'elite':'legendary';
  const mult=EX_RARITY[rarity].mult;
  const skill=Math.round(rnd(8,14)*mult);
  const salary=Math.max(5,Math.round(role.salaryBase*mult/5)*5);
  return { pid:'pool'+Date.now()+rndi(1000,9999)+Math.floor(Math.random()*1e6),
    name:pick(EX_NAMES), role:role.id, rarity:rarity, skill:skill, salary:salary, sign:salary*10 };
}
/* Refresh 3 candidates every 3 game days. */
function EX_genPool(){
  if(!EX_ready()) return;
  S.ex.pool=[EX_makeCandidate(),EX_makeCandidate(),EX_makeCandidate()];
  S.ex.pday=int(S.day,1);
}
function EX_hireEmp(pid){
  if(!EX_init()) return;
  const c=S.ex.pool.find(x=>x.pid===pid); if(!c) return;
  if(num(S.cash,0)<c.sign){ toast(icon('x','ge-ic-md')+' Signing '+esc(c.name)+' costs '+fmt$(c.sign)+'.'); return; }
  S.cash-=c.sign;
  S.ex.employees.push({ id:'e'+Date.now()+rndi(100,999), name:c.name, role:c.role, rarity:c.rarity,
    lvl:1, xp:0, skill:c.skill, salary:c.salary, assigned:true });
  S.ex.pool=S.ex.pool.filter(x=>x.pid!==pid);
  const r=EX_roleById(c.role);
  toast(icon('users','ge-ic-md')+' Hired <b>'+esc(c.name)+'</b> ('+esc(r.name)+', '+EX_RARITY[c.rarity].name+')');
  gainXP(60); save(); updateHUD();
  if(current==='empire') RENDER.empire();
}

function EX_fireEmp(id){
  if(!EX_init()) return;
  const e=S.ex.employees.find(x=>x.id===id); if(!e) return;
  confirmModal('Fire '+e.name+'?',esc(e.name)+' will leave the empire immediately. No severance, no hard feelings.',()=>{
    S.ex.employees=S.ex.employees.filter(x=>x.id!==id);
    toast(esc(e.name)+' was let go.');
    save(); updateHUD();
    if(current==='empire') RENDER.empire();
  });
}

function EX_trainEmp(id){
  if(!EX_init()) return;
  const e=S.ex.employees.find(x=>x.id===id); if(!e) return;
  const cost=150*int(e.lvl,1);
  if(num(S.cash,0)<cost){ toast(icon('x','ge-ic-md')+' Training costs '+fmt$(cost)+'.'); return; }
  S.cash-=cost; e.xp=num(e.xp,0)+60;
  EX_empLevelCheck(e,true);
  save(); updateHUD();
  if(current==='empire') RENDER.empire();
}

function EX_empLevelCheck(e,announce){
  let need=int(e.lvl,1)*120, ups=0;
  while(num(e.xp,0)>=need){ e.xp-=need; e.lvl++; e.skill=num(e.skill,0)+3; e.salary=Math.round(num(e.salary,0)*1.05); need=int(e.lvl,1)*120; ups++; }
  if(ups&&announce) toast('<span class="ge-up">↑</span> '+esc(e.name)+' → <b>Level '+e.lvl+'</b> (skill '+int(e.skill,0)+')');
  return ups;
}

function EX_toggleAssign(id){
  if(!EX_init()) return;
  const e=S.ex.employees.find(x=>x.id===id); if(!e) return;
  e.assigned=!e.assigned;
  toast((e.assigned?icon('check','ge-ic-md')+' ':'<span class="ge-pill ge-pill-neutral">BENCHED</span> ')+esc(e.name)+(e.assigned?' back on duty.':' — no bonus, still on payroll.'));
  save(); if(current==='empire') RENDER.empire();
}

/* Daily payroll. If cash runs short, lowest-paid quits first. */
function EX_payrollTick(){
  if(!EX_ready()||!S.ex.employees.length) return;
  let total=Math.round(S.ex.employees.reduce((a,e)=>a+num(e.salary,0),0));
  if(num(S.cash,0)>=total){ S.cash-=total; return; }
  const sorted=S.ex.employees.slice().sort((a,b)=>num(a.salary,0)-num(b.salary,0));
  while(sorted.length&&num(S.cash,0)<total){
    const q=sorted.shift();
    S.ex.employees=S.ex.employees.filter(e=>e.id!==q.id);
    total-=Math.round(num(q.salary,0));
    setTimeout(()=>toast(icon('cash','ge-ic-md')+' <b>'+esc(q.name)+'</b> quit — payroll came up short!'),50);
  }
  S.cash=Math.max(0,num(S.cash,0)-total);
}

/* Cross-builder interface: summed, capped bonus for a role (assigned staff only). */
function EX_employeeBonus(role){
  if(!EX_ready()) return 0;
  /* P3-W5: wave-5 crew specialties — appended, never rebalanced. New roles only. */
  const eff={grower:0.4,geneticist:0.3,budtender:0.15,processor:0.2,manager:0.1,breeding:0.5,tech:0.2,
    growtech:0.3,processtech:0.25,dispworker:0.2,mastergrower:0.15,irritech:0.2,trimmer:0.2};
  const cap={grower:40,geneticist:30,budtender:25,processor:30,manager:15,breeding:50,tech:30,
    growtech:30,processtech:30,dispworker:25,mastergrower:20,irritech:25,trimmer:25};
  if(!(role in eff)) return 0;
  let t=0;
  S.ex.employees.forEach(e=>{ if(e.assigned&&e.role===role) t+=num(e.skill,0); });
  return clamp(t*eff[role],0,cap[role]);
}
function EX_payrollTotal(){
  if(!EX_ready()) return 0;
  return Math.round(S.ex.employees.reduce((a,e)=>a+num(e.salary,0),0));
}
function EX_empCard(e){
  const r=EX_roleById(e.role), rar=EX_RARITY[e.rarity]||EX_RARITY.common;
  const need=int(e.lvl,1)*120, pct=clamp(num(e.xp,0)/need*100,0,100);
  const trainCost=150*int(e.lvl,1);
  return '<div class="ge-card ge-ecard'+(e.assigned?'':' ge-benched')+'">'+
   '<div class="ge-card-head"><h3>'+esc(e.name)+'</h3><span class="'+EM_rarCls(e.rarity)+'">'+rar.name+'</span></div>'+
   '<p class="ge-caption ge-muted">'+esc(r.name)+' • Lv '+int(e.lvl,1)+' • Skill '+int(e.skill,0)+'</p>'+
   (typeof P3W5_empSpecHTML==='function'?P3W5_empSpecHTML(e):'')+ /* P3-W5: specialty + tenure */
   '<div class="ge-progress-meta"><span>XP to next level</span><b class="ge-num">'+Math.round(num(e.xp,0))+' / '+need+'</b></div>'+
   '<div class="ge-progress"><i style="width:'+pct+'%"></i></div>'+
   '<div class="ge-datarow"><span>'+icon('cash','ge-ic-md')+'Salary</span><b class="ge-num">'+fmt$(e.salary)+'/day</b></div>'+
   (e.assigned?'':'<p class="ge-locknote">BENCHED — no bonus, still on payroll.</p>')+
   '<div class="ge-btn-row">'+
   '<button class="ge-btn ge-btn-primary" data-ex-train="'+e.id+'">TRAIN '+fmt$(trainCost)+'</button>'+
   '<button class="ge-btn ge-btn-ghost" data-ex-assign="'+e.id+'">'+(e.assigned?'BENCH':'ASSIGN')+'</button>'+
   '<button class="ge-btn ge-btn-danger" data-ex-fire="'+e.id+'">FIRE</button></div>'+
   (typeof TY_staffCardHTML==='function'?TY_staffCardHTML(e):'')+'</div>';
}

function EX_employeesHTML(){
  const daysLeft=Math.max(0,3-(int(S.day,1)-int(S.ex.pday,1)));
  let html='<div class="ge-card ge-card-flat"><div class="ge-card-head"><h3>'+icon('crew','ge-ic-lg')+'STAFF</h3></div>'+
   '<p class="ge-caption ge-muted">Named professionals — separate from your basic crew. Daily salaries, levelling, real bonuses. Only <b>assigned</b> staff grant bonuses.</p>'+
   '<div class="ge-datarow"><span>'+icon('cash','ge-ic-md')+'Daily payroll</span><b class="ge-num">'+fmt$(EX_payrollTotal())+'</b></div></div>';
  html+='<div class="ge-section-title"><span>HIRING POOL</span><span class="ge-spread ge-caption ge-muted">Fresh candidates in '+daysLeft+' day'+(daysLeft===1?'':'s')+'</span></div>';
  if(!S.ex.pool.length) html+='<div class="ge-card"><p class="ge-caption ge-muted">No candidates right now. Check back soon.</p></div>';
  S.ex.pool.forEach(c=>{
    const r=EX_roleById(c.role), rar=EX_RARITY[c.rarity]||EX_RARITY.common;
    html+='<div class="ge-card ge-ecard"><div class="ge-card-head"><h3>'+esc(c.name)+'</h3><span class="'+EM_rarCls(c.rarity)+'">'+rar.name+'</span></div>'+
     '<p class="ge-caption ge-muted">'+esc(r.name)+' — '+esc(r.desc)+'</p>'+
     '<div class="ge-datarow"><span>'+icon('star','ge-ic-md')+'Skill</span><b class="ge-num">'+int(c.skill,0)+'</b></div>'+
     '<div class="ge-datarow"><span>'+icon('cash','ge-ic-md')+'Salary</span><b class="ge-num">'+fmt$(c.salary)+'/day</b></div>'+
     '<div class="ge-datarow"><span>'+icon('plus','ge-ic-md')+'Signing cost</span><b class="ge-num">'+fmt$(c.sign)+'</b></div>'+
     '<button class="ge-btn ge-btn-primary ge-btn-block" data-ex-hirepool="'+c.pid+'">HIRE '+esc(c.name).toUpperCase()+'</button></div>';
  });
  html+='<div class="ge-section-title"><span>YOUR STAFF ('+S.ex.employees.length+')</span></div>';
  if(!S.ex.employees.length) html+='<div class="ge-card"><p class="ge-caption ge-muted">No staff yet. Hire from the pool above.</p></div>';
  S.ex.employees.forEach(e=>{ html+=EX_empCard(e); });
  return html;
}


/* ================= LOCATIONS (territory) ================= */
const EX_LOCATIONS=[
 {id:'home',name:'HOME TURF',desc:'Where it all started. No upkeep, no pressure.',
  gate:{rep:0,cash:0,missions:0},priceMult:1.0,prefs:['Gassy','Old School'],envMod:{temp:0,humidity:0},
  competition:1.0,upkeep:0,special:'Home base. Safe.'},
 {id:'river',name:'RIVER DISTRICT',desc:'Humid riverside blocks. Frost lovers pay up.',
  gate:{rep:50,cash:500,missions:0},priceMult:1.05,prefs:['Frosty'],envMod:{temp:-2,humidity:5},
  competition:1.1,upkeep:25,special:'+5% on Frosty strains.'},
 {id:'metro',name:'METRO MARKET',desc:'Downtown money. Exotic & purple move fast.',
  gate:{rep:150,cash:2000,missions:5},priceMult:1.15,prefs:['Exotic','Purple'],envMod:{temp:2,humidity:0},
  competition:1.25,upkeep:75,special:'+15% on Exotic strains. Tougher rivals.'},
 {id:'industrial',name:'INDUSTRIAL DISTRICT',desc:'Warehouses & labs. Processing runs hot here.',
  gate:{rep:300,cash:8000,missions:12},priceMult:1.1,prefs:['Heavy','Resin Monster'],envMod:{temp:4,humidity:-5},
  competition:1.2,upkeep:150,special:'+10% processing output.'},
 {id:'midwest',name:'MIDWEST CIRCUIT',desc:'Big barns, bigger appetites. Gas & skunk country.',
  gate:{rep:500,cash:20000,missions:20},priceMult:1.25,prefs:['Gassy','Skunky'],envMod:{temp:-3,humidity:3},
  competition:1.4,upkeep:300,special:'Heavy volume, heavy upkeep.'},
 {id:'national',name:'NATIONAL MARKET',desc:'The big leagues. Only keepers need apply.',
  gate:{rep:1000,cash:75000,missions:35},priceMult:1.5,prefs:['Keeper','Exotic'],envMod:{temp:0,humidity:0},
  competition:1.6,upkeep:750,special:'+50% prices. Savages only.'}
];
function EX_locById(id){ return EX_LOCATIONS.find(l=>l.id===id)||EX_LOCATIONS[0]; }
function EX_locGateMet(l){
  const g=l.gate||{};
  return int(S.reputation,0)>=int(g.rep,0)&&num(S.cash,0)>=num(g.cash,0)&&int(S.stats.missionsDone,0)>=int(g.missions,0);
}
/* Cross-builder interfaces for Builder A (guarded use). */
function EX_locMarketMult(){ if(!EX_ready()) return 1; return num(EX_locById(S.ex.locations.current).priceMult,1); }
function EX_locEnvMod(){ if(!EX_ready()) return {temp:0,humidity:0};
  const m=EX_locById(S.ex.locations.current).envMod||{}; return {temp:num(m.temp,0),humidity:num(m.humidity,0)}; }
function EX_locCompetition(){ if(!EX_ready()) return 1; return num(EX_locById(S.ex.locations.current).competition,1); }
function EX_unlockLocation(id){
  if(!EX_init()) return;
  const l=EX_locById(id);
  if(S.ex.locations.unlocked.includes(id)){ toast('Already unlocked.'); return; }
  if(!EX_locGateMet(l)){ toast(icon('lock','ge-ic-md')+' Gate not met for '+esc(l.name)+'.'); return; }
  const cost=num((l.gate||{}).cash,0);
  S.cash=num(S.cash,0)-cost;
  S.ex.locations.unlocked.push(id);
  gainXP(150); gainRep(25);
  toast(icon('pin','ge-ic-md')+' Territory unlocked: <b>'+esc(l.name)+'</b>');
  save(); updateHUD();
  if(current==='locations') RENDER.locations();
}

function EX_travelTo(id){
  if(!EX_init()) return;
  if(!S.ex.locations.unlocked.includes(id)){ toast(icon('lock','ge-ic-md')+' Unlock it first.'); return; }
  if(S.ex.locations.current===id) return;
  const fee=150;
  if(num(S.cash,0)<fee){ toast(icon('x','ge-ic-md')+' Travel costs '+fmt$(fee)+'.'); return; }
  S.cash-=fee; S.ex.locations.current=id;
  toast(icon('truck','ge-ic-md')+' Moved operations to <b>'+esc(EX_locById(id).name)+'</b>');
  save(); updateHUD();
  if(current==='locations') RENDER.locations();
}

function EX_upkeepTick(){
  if(!EX_ready()) return;
  const loc=EX_locById(S.ex.locations.current), up=int(loc.upkeep,0);
  if(up<=0) return;
  if(num(S.cash,0)>=up){ S.cash-=up; return; }
  S.ex.locations.current='home';
  setTimeout(()=>toast(icon('facility','ge-ic-md')+' Could not afford '+esc(loc.name)+' upkeep ('+fmt$(up)+'/day) — fell back to <b>Home Turf</b>.'),50);
}

function EX_locGateText(l){
  const g=l.gate||{}, bits=[];
  if(int(g.rep,0)>0) bits.push(int(g.rep,0)+' rep');
  if(num(g.cash,0)>0) bits.push(fmt$(g.cash));
  if(int(g.missions,0)>0) bits.push(int(g.missions,0)+' missions');
  return bits.length?bits.join(' • '):'Open from the start';
}
RENDER.locations=function(){
  if(!EX_init()) return;
  const r=$('locations-root');
  const cur=EX_locById(S.ex.locations.current);
  let html='<div class="ge-screen">'+screenHead('empire','TERRITORY')+
   '<div class="ge-card"><div class="ge-card-head"><h3>'+icon('empire','ge-ic-lg')+'CURRENT: '+esc(cur.name)+'</h3></div>'+
   '<div class="ge-datarow"><span>'+icon('cash','ge-ic-md')+'Market prices</span><b class="ge-num">×'+cur.priceMult.toFixed(2)+'</b></div>'+
   '<div class="ge-datarow"><span>'+icon('temp','ge-ic-md')+'Environment</span><b class="ge-num">'+(cur.envMod.temp>=0?'+':'')+cur.envMod.temp+'°F / '+(cur.envMod.humidity>=0?'+':'')+cur.envMod.humidity+'% RH</b></div>'+
   '<div class="ge-datarow"><span>'+icon('warn','ge-ic-md')+'Daily upkeep</span><b class="ge-num">'+(cur.upkeep?fmt$(cur.upkeep):'Free')+'</b></div></div>';
  EX_LOCATIONS.forEach(l=>{
    const unlocked=S.ex.locations.unlocked.includes(l.id), isCur=S.ex.locations.current===l.id;
    const met=EX_locGateMet(l);
    const warn=unlocked&&l.upkeep>0&&num(S.cash,0)<l.upkeep*3;
    html+='<div class="ge-card ge-loc'+(isCur?' ge-card-hot':'')+'"><div class="ge-card-head"><h3>'+(isCur?icon('pin','ge-ic-md')+' ':'')+esc(l.name)+'</h3>'+
     (isCur?'<span class="ge-pill ge-pill-optimal">CURRENT</span>':unlocked?'<span class="ge-pill ge-pill-neutral">UNLOCKED</span>':'<span class="ge-pill ge-pill-neutral">'+icon('lock','ge-ic-sm')+'LOCKED</span>')+'</div>'+
     '<p class="ge-caption ge-muted">'+esc(l.desc)+'</p>'+
     '<div class="ge-datarow"><span>'+icon('cash','ge-ic-md')+'Prices</span><b class="ge-num">×'+l.priceMult.toFixed(2)+'</b></div>'+
     '<div class="ge-datarow"><span>'+icon('star','ge-ic-md')+'Buyers value</span><b>'+l.prefs.map(esc).join(', ')+'</b></div>'+
     '<div class="ge-datarow"><span>'+icon('trophy','ge-ic-md')+'Competition</span><b class="ge-num">×'+l.competition.toFixed(2)+'</b></div>'+
     '<div class="ge-datarow"><span>'+icon('warn','ge-ic-md')+'Upkeep</span><b class="ge-num">'+(l.upkeep?fmt$(l.upkeep)+'/day':'Free')+'</b></div>'+
     '<p class="ge-caption">'+icon('scroll','ge-ic-md')+' '+esc(l.special)+'</p>'+
     (warn?'<p class="ge-locknote">'+icon('warn','ge-ic-md')+' Cash is low — miss upkeep and you fall back to Home Turf.</p>':'')+
     (isCur?'<p class="ge-label">CURRENT TERRITORY</p>'
      :unlocked?'<button class="ge-btn ge-btn-primary ge-btn-block" data-ex-travel="'+l.id+'">TRAVEL HERE — '+fmt$(150)+'</button>'
      :met?'<button class="ge-btn ge-btn-gold ge-btn-block" data-ex-unlockloc="'+l.id+'">UNLOCK — '+fmt$(num((l.gate||{}).cash,0))+'</button>'
      :'<div class="ge-lockreq">'+icon('lock','ge-ic-md')+'<div><b>Gate: '+esc(EX_locGateText(l))+'</b></div></div>'+EM_gateProgress(l))+
     '</div>';
  });
  html+='</div>';
  r.innerHTML=html;
  r.querySelectorAll('[data-ex-travel]').forEach(b=>b.onclick=()=>EX_travelTo(b.dataset.exTravel));
  r.querySelectorAll('[data-ex-unlockloc]').forEach(b=>b.onclick=()=>EX_unlockLocation(b.dataset.exUnlockloc));
};


/* ================= ACHIEVEMENTS (Builder C) =================
   Checked in EX_checkAch() (runs inside EX_tick + after big events).
   reward: {cash,xp,rep,p0,p0track,title}                                   */
const EX_ACHIEVEMENTS=[
 {id:'x-firstharvest',name:'First Harvest',desc:'Complete your first harvest.',
  prog:()=>[Math.min(int(S.stats.harvests,0),1),1],reward:{cash:100,xp:50}},
 {id:'x-greenthumb',name:'Green Thumb',desc:'Complete 10 harvests.',
  prog:()=>[Math.min(int(S.stats.harvests,0),10),10],reward:{cash:300,xp:150}},
 {id:'x-geneticfreak',name:'Genetic Freak',desc:'Uncover 3 ELITE phenotypes — true genetic freaks.',
  prog:()=>[Math.min(int(S.stats.eliteFound,0),3),3],reward:{cash:600,xp:250,p0:4}},
 {id:'x-masterbreeder',name:'Master Breeder',desc:'Create 25 custom crosses.',
  prog:()=>[Math.min(int(S.stats.crosses,0),25),25],reward:{cash:1200,xp:500,p0:5}},
 {id:'x-perfectgrow',name:'Perfect Grow',desc:'Harvest 90+ quality with plant health never below 95%.',
  prog:()=>[Math.min(int((S.ex.records||{}).perfectGrows,0),1),1],reward:{cash:800,xp:400,p0:4}},
 {id:'x-millionaire',name:'Millionaire',desc:'Hold $1,000,000 cash.',
  prog:()=>[num(S.cash,0)>=1000000?1:0,1],reward:{xp:1000,rep:50,title:'Millionaire'}},
 {id:'x-strain100',name:'Hundred Strain Club',desc:'Own 100 custom-bred strains.',
  prog:()=>[Math.min(S.customStrains.length,100),100],reward:{cash:2500,xp:1500,p0:6}},
 {id:'x-empirebuilder',name:'Empire Builder',desc:'Max any building to Level 5.',
  prog:()=>[EX_BUILDINGS.some(b=>EX_buildingLevel(b.id)>=5)?1:0,1],reward:{cash:2000,xp:600}},
 {id:'x-p0200',name:'Project Zero Devotee',desc:'Earn 200 Project 0 points.',
  prog:()=>[Math.min(int(S.project0.points,0),200),200],reward:{xp:600,rep:40}},
 {id:'x-p0pillars',name:'Pillars of Zero',desc:'Reach Level 2 in all 8 Project 0 tracks.',
  prog:()=>[P0_TRACKS.filter(tr=>p0Level(tr.id)>=2).length,8],reward:{xp:800,p0:6}}
];

function EX_achRewardText(a){
  const r=a.reward||{}, bits=[];
  if(r.cash) bits.push(fmt$(r.cash));
  if(r.xp) bits.push('+'+int(r.xp,0)+' XP');
  if(r.rep) bits.push('+'+int(r.rep,0)+' rep');
  if(r.p0) bits.push('+'+int(r.p0,0)+' P0');
  if(r.title) bits.push('title: '+MS_stripEmoji(r.title));
  return bits.join(' \u2022 ')||'\u2014';
}

function EX_checkAch(){
  if(!EX_init()) return;
  EX_ACHIEVEMENTS.forEach(a=>{
    if(S.ex.ach[a.id]) return;
    let cur=0,target=1;
    try{ const p=a.prog(); cur=num(p[0],0); target=Math.max(1,num(p[1],1)); }catch(e){ return; }
    if(cur>=target){
      S.ex.ach[a.id]={day:int(S.day,1)};
      const r=a.reward||{};
      if(r.cash) S.cash=num(S.cash,0)+r.cash;
      if(r.xp) gainXP(r.xp);
      if(r.rep) gainRep(r.rep);
      if(r.p0) addP0(r.p0track||'genetics',r.p0);
      if(r.title&&!S.titles.includes(r.title)) S.titles.push(r.title);
      save(); updateHUD();
      setTimeout(()=>toast(icon('trophy','ge-ic-md')+' <b>'+esc((typeof MS_stripEmoji==='function'?MS_stripEmoji(a.name):a.name))+'</b><br><span class="ge-muted">'+esc(a.desc)+'</span><br><span class="ge-cer-wintext">'+esc(EX_achRewardText(a))+'</span>'),60);
    }
  });
}

/* Integrator calls EX_harvestNote(qq, p.minHealth) from harvestPlant (one line). */
function EX_harvestNote(q,minHealth){
  if(!EX_ready()) return;
  if(num(q,0)>=90&&num(minHealth,0)>=95){
    S.ex.records.perfectGrows=int(S.ex.records.perfectGrows,0)+1;
  }
}
RENDER.achievements=function(){
  if(!EX_init()) return;
  const r=$('achievements-root');
  if(!r) return;
  const done=EX_ACHIEVEMENTS.filter(a=>S.ex.ach[a.id]).length;
  let html=screenHead('trophy','TROPHIES & ACHIEVEMENTS')+
   '<div class="ge-screen"><div class="ge-card ge-card-hot ms-achhead">'+
   '<div class="ge-card-head"><h3>'+icon('trophy','ge-ic-lg')+'EMPIRE ACHIEVEMENTS</h3>'+
   '<span class="ge-pill ge-pill-gold ge-num">'+done+'/'+EX_ACHIEVEMENTS.length+'</span></div>'+
   '<div class="ge-progress ge-progress-gold"><i style="width:'+Math.round(done/EX_ACHIEVEMENTS.length*100)+'%"></i></div>'+
   '<div class="ge-progress-meta"><span>UNLOCKED</span><b class="ge-num">'+done+' OF '+EX_ACHIEVEMENTS.length+'</b></div></div>';
  EX_ACHIEVEMENTS.forEach(a=>{
    const claimed=!!S.ex.ach[a.id];
    let cur=0,target=1;
    try{ const p=a.prog(); cur=num(p[0],0); target=Math.max(1,num(p[1],1)); }catch(e){}
    html+='<div class="ge-card ms-ach'+(claimed?' is-done':'')+'">'+
     '<div class="ge-card-head"><h3 class="'+(MS_achGold(a.id)?'ms-gold':'')+'">'+icon(MS_achIcon(a.id),'ge-ic-lg')+esc(MS_stripEmoji(a.name))+'</h3>'+
     (claimed?'<span class="ge-badge ge-badge-legendary">'+icon('star','ge-ic-sm')+'CLAIMED</span>':'')+'</div>'+
     '<p class="ge-muted">'+esc(a.desc)+'</p>'+
     '<div class="ge-progress-meta"><span>PROGRESS</span><b class="ge-num">'+Math.min(cur,target)+'/'+target+'</b></div>'+
     '<div class="ge-progress'+(claimed?' ge-progress-gold':'')+'"><i style="width:'+clamp(cur/target*100,0,100)+'%"></i></div>'+
     '<p class="ms-reward">'+icon('trophy','ge-ic-sm')+'<span>REWARD \u2014 '+esc(EX_achRewardText(a))+'</span></p>'+
     (claimed?'<p class="ge-caption ge-gold-text">'+icon('star','ge-ic-sm')+' CLAIMED \u2014 DAY '+int(S.ex.ach[a.id].day,1)+'</p>':'')+'</div>';
  });
  html+='<div class="ge-card"><div class="ge-card-head"><h3>'+icon('trophy','ge-ic-lg')+'COMPETITION TROPHIES</h3>'+
   '<span class="ge-pill ge-pill-neutral ge-num">'+S.ex.trophies.length+'</span></div>'+
   (S.ex.trophies.length?S.ex.trophies.slice().reverse().slice(0,12).map(t=>
     '<div class="ge-datarow"><span>'+MS_placeBadge(t.place)+' '+esc(t.compName||t.compId)+'</span><b>'+esc(t.strainName||'')+' \u2014 Day '+int(t.day,1)+'</b></div>').join(''):
    '<div class="ge-empty">'+icon('trophy','ge-ic-xl')+'<h3>No trophies yet</h3><p>Enter competitions from the EMPIRE screen.</p></div>')+'</div>';
  html+='</div>';
  r.innerHTML=html;
};


/* ================= COMPETITION CEREMONY =================
   Replacement resolver for runCompetition. Integrator swaps the call in
   wireCompete: runCompetition(t,item,fee) -> EX_runCompetition(t,item,fee).
   Keeps compsEntered/compsWon/breederCupWins stats intact.               */
const EX_COMP_CATS=[
 {id:'flower',name:'BEST FLOWER',key:'quality'},
 {id:'resin',name:'HIGHEST RESIN',key:'resin'},
 {id:'terps',name:'BEST TERPENES',key:'terpenes'},
 {id:'bagappeal',name:'BAG APPEAL',key:'bagAppeal'},
 {id:'potency',name:'POTENCY',key:'potency'},
 {id:'yield',name:'HEAVIEST YIELD',key:'amount'},
 {id:'newgen',name:'NEW GENETICS',key:'custom'},
 {id:'overall',name:'OVERALL CHAMPION',key:'overall'}
];
function EX_compCatScore(item,cat){
  switch(cat.key){
    case 'quality': return num(item.quality,0);
    case 'resin': return num(item.resin,0);
    case 'terpenes': return num(item.terpenes,0);
    case 'bagAppeal': return num(item.bagAppeal,0);
    case 'potency': return num(item.potency,0);
    case 'amount': return num(item.amount,0);
    case 'custom': return item.custom?95:0;
    case 'overall': return (num(item.quality,0)+num(item.resin,0)+num(item.terpenes,0)+num(item.potency,0))/4;
  }
  return 0;
}
/* Strain value boost from trophies: +5% per 1st-place trophy on that strain. */
function EX_trophyBoost(strainId){
  if(!EX_ready()) return 1;
  const n=S.ex.trophies.filter(t=>t.strainId===strainId&&t.place===1).length;
  return 1+0.05*n;
}
function EX_runCompetition(t,item,fee){
  if(!EX_init()) return;
  S.cash=num(S.cash,0)-fee;
  S.stats.compsEntered=int(S.stats.compsEntered,0)+1;
  gainXP(20);
  save(); updateHUD(); checkMissions();
  EX_compCeremony(t,item);
}
function EX_compCeremony(t,item){
  const cats=EX_COMP_CATS.filter(c=>c.id!=='overall');
  const rnames=AI_NAMES.slice(), rivals=[];
  for(let i=0;i<5&&rnames.length;i++) rivals.push(rnames.splice(Math.floor(Math.random()*rnames.length),1)[0]);
  const catRes=cats.map(cat=>{
    const ps=EX_compCatScore(item,cat), isOz=cat.key==='amount';
    const ents=rivals.map(nm=>{
      let s;
      if(isOz) s=Math.max(0.5,num(item.amount,0)*(0.55+Math.random()*0.95));
      else if(cat.key==='custom') s=Math.random()<0.3?rnd(82,97):rnd(8,68);
      else s=clamp(ps+rnd(-20,14),5,100);
      return {name:nm, score:isOz?Math.round(s*10)/10:Math.round(s), me:false};
    });
    ents.push({name:'YOU', sub:item.strainName, score:isOz?Math.round(num(item.amount,0)*10)/10:Math.round(ps), me:true});
    ents.sort((a,b)=>b.score-a.score);
    return {cat:cat, isOz:isOz, unit:isOz?'oz':'pts', ents:ents, myPlace:ents.findIndex(e=>e.me)+1};
  });
  const pts={}; let myPts=0;
  catRes.forEach(r=>r.ents.forEach((e,i)=>{
    const p=i===0?5:i===1?3:i===2?1:0;
    if(e.me) myPts+=p; else pts[e.name]=(pts[e.name]||0)+p;
  }));
  const board=rivals.map(nm=>({name:nm,pts:pts[nm]||0,me:false}));
  board.push({name:'YOU',pts:myPts,me:true});
  board.sort((a,b)=>b.pts-a.pts);
  const myOverall=board.findIndex(b=>b.me)+1;
  const m=modal('<div id="ex-cer"></div>');
  const box=m.querySelector('#ex-cer');
  let stage=0, rewarded=false;
  const medal=p=>p===1?'<span class="ge-medal ge-medal-1">1ST</span>':p===2?'<span class="ge-medal ge-medal-2">2ND</span>':p===3?'<span class="ge-medal ge-medal-3">3RD</span>':(p+'.');
  const rowHtml=(e,i,unit,delay)=>'<div class="ge-cer-row'+(i<3?' ge-cer-top':'')+(e.me?' ge-cer-me':'')+'" style="animation-delay:'+delay+'s">'+
    '<span>'+(i<3?medal(i+1):(i+1)+'.')+' '+esc(e.name)+(e.me&&e.sub?' — '+esc(e.sub):'')+'</span><b class="ge-num">'+e.score+' '+unit+'</b></div>';
  function applyRewards(){
    if(rewarded) return; rewarded=true;
    const D=DIFFS[S.difficulty], mult=D.missionReward;
    catRes.forEach(r=>{
      if(r.myPlace===1){
        S.ex.trophies.push({strainId:item.strainId,strainName:item.strainName,phenoNum:num(item.phenoNum,0),
          compId:t.id,compName:t.name,catId:r.cat.id,catName:r.cat.name,place:1,day:int(S.day,1)});
        gainRep(5);
      }
    });
    if(myOverall===1){
      const cashR=Math.round(800*mult), repR=60;
      S.cash=num(S.cash,0)+cashR; gainRep(repR);
      S.stats.compsWon=int(S.stats.compsWon,0)+1;
      if(t.id==='breeder') S.stats.breederCupWins=int(S.stats.breederCupWins,0)+1;
      addP0('freedom',3); addP0('cultivation',2); gainXP(200);
      S.ex.trophies.push({strainId:item.strainId,strainName:item.strainName,phenoNum:num(item.phenoNum,0),
        compId:t.id,compName:t.name,catId:'overall',catName:'OVERALL CHAMPION',place:1,day:int(S.day,1)});
      EX_record('strainValue',EX_trophyBoost(item.strainId),item.strainName);
      setTimeout(()=>toast(icon('trophy','ge-ic-md')+' Competition WON!'),60);
      if(t.id==='breeder'&&Math.random()<0.5){ unlockStrain('crown-jewel',true); }
    }else if(myOverall===2){ gainRep(20); gainXP(100); S.cash=num(S.cash,0)+Math.round(300*mult); }
    else if(myOverall===3){ gainRep(8); gainXP(60); }
    else { gainXP(40); }
    EX_syncRecords(); save(); updateHUD(); checkMissions(); checkAchievements();
  }
  function draw(){
    if(stage===0){
      box.innerHTML='<div class="ge-cer-head"><h3>'+icon('trophy','ge-ic-lg')+esc(t.name).toUpperCase()+'</h3></div>'+
       '<div class="ge-cer-hero"><div class="ge-display ge-cer-title">JUDGING DAY</div>'+
       '<p>Your entry: <b>'+esc(item.strainName)+'</b> (Q'+int(item.quality,0)+')</p>'+
       '<p class="ge-caption ge-muted">'+cats.length+' categories • '+rivals.length+' rival growers<br>Points: 1st 5 • 2nd 3 • 3rd 1</p></div>'+
       '<button class="ge-btn ge-btn-primary ge-btn-block" id="ex-cer-next">BEGIN JUDGING</button>';
    }else if(stage<=cats.length){
      const r=catRes[stage-1];
      const top=r.ents.slice(0,3).map((e,i)=>rowHtml(e,i,r.unit,0.4+i*0.7)).join('');
      const rest=r.ents.slice(3).map(e=>'<div class="ge-cer-row'+(e.me?' ge-cer-me':'')+'"><span>• '+esc(e.name)+'</span><b class="ge-num">'+e.score+'</b></div>').join('');
      const rp=r.myPlace===1?5:r.myPlace===2?3:r.myPlace===3?1:0;
      box.innerHTML='<div class="ge-cer-head"><h3>'+icon('trophy','ge-ic-lg')+esc(r.cat.name)+'</h3></div><div class="ge-cer-rows">'+top+rest+'</div>'+
       '<p class="ge-caption ge-muted">You placed '+(r.myPlace<=3?medal(r.myPlace):'#'+r.myPlace)+' — +'+rp+' pts'+(r.myPlace===1?' — category trophy!':'')+'</p>'+
       '<button class="ge-btn ge-btn-primary ge-btn-block" id="ex-cer-next">'+(stage===cats.length?'TALLY THE POINTS':'NEXT CATEGORY')+'</button>';
    }else if(stage===cats.length+1){
      const rows=board.map((b,i)=>'<div class="ge-cer-row'+(i<3?' ge-cer-top':'')+(b.me?' ge-cer-me':'')+'"><span>'+(i<3?medal(i+1):(i+1)+'.')+' '+esc(b.name)+'</span><b class="ge-num">'+b.pts+' pts</b></div>').join('');
      box.innerHTML='<div class="ge-cer-head"><h3>'+icon('crown-gold','ge-ic-lg')+'OVERALL STANDINGS</h3></div><div class="ge-cer-rows">'+rows+'</div>'+
       '<button class="ge-btn ge-btn-gold ge-btn-block" id="ex-cer-next">CROWN THE CHAMPION</button>';
    }else{
      applyRewards();
      const top3=board.slice(0,3);
      const rows=top3.map((b,i)=>'<div class="ge-cer-row ge-cer-top'+(b.me?' ge-cer-me':'')+' ge-cer-final" style="animation-delay:'+(0.5+i*0.9)+'s">'+
        '<span>'+medal(i+1)+' '+esc(b.name)+'</span><b class="ge-num">'+b.pts+' pts</b></div>').join('');
      let rw='';
      if(myOverall===1){
        rw='<div class="ge-cer-win"><div class="ge-cer-crown">'+crownSVG(true,'c-ico-svg')+'</div>'+
         '<p class="ge-cer-wintext">'+icon('trophy','ge-ic-md')+' YOU WIN '+esc(t.name).toUpperCase()+'!<br>+'+fmt$(Math.round(800*DIFFS[S.difficulty].missionReward))+' • +60 rep • trophy enshrined</p></div>';
      }else{
        rw='<p class="ge-caption ge-muted">Placed #'+myOverall+'. '+(myOverall<=3?'Podium finish — the crown is close.':'The judges want more. Breed harder, grow louder.')+'</p>';
      }
      box.innerHTML='<div class="ge-cer-hero"><div class="ge-display ge-cer-title">CHAMPION</div></div>'+
       '<div class="ge-cer-rows">'+rows+'</div>'+rw+
       '<button class="ge-btn ge-btn-block" id="ex-cer-close">COLLECT &amp; CLOSE</button>';
    }
    const nx=box.querySelector('#ex-cer-next'); if(nx) nx.onclick=()=>{ stage++; draw(); };
    const cl=box.querySelector('#ex-cer-close'); if(cl) cl.onclick=()=>{ closeModal(m); if(current==='empire') RENDER.empire(); };
  }
  draw();
}


/* ================= PROJECT 0 LEGACY (prestige, optional, never forced) ================= */
function EX_legacyReqs(){
  if(!EX_init()) return {met:false,list:[]};
  const list=[
    {label:'Reach level 25',met:int(S.level,1)>=25},
    {label:'Keep 10 keeper phenotypes',met:S.keepers.length>=10},
    {label:'$100k lifetime revenue',met:num(S.stats.lifetimeRevenue,0)>=100000},
    {label:'200 Project 0 points',met:int(S.project0.points,0)>=200}
  ];
  return {met:list.every(x=>x.met),list:list};
}
/* Cross-builder interface: permanent legacy bonus {qual, yield} in percent. */
function EX_legacyBonus(){
  if(!EX_ready()) return {qual:0,yield:0};
  return {qual:num(S.ex.legacy.bonus.qual,0),yield:num(S.ex.legacy.bonus.yield,0)};
}
function EX_legacyHTML(){
  const req=EX_legacyReqs(), runNum=int(S.ex.legacy.runs,0);
  const reqHtml=req.list.map(x=>
   '<div class="ge-datarow"><span>'+(x.met?icon('check','ge-ic-md'):icon('lock','ge-ic-md'))+esc(x.label)+'</span>'+
   '<b>'+(x.met?'<span class="ge-green">MET</span>':'<span class="ge-faint">—</span>')+'</b></div>').join('');
  return '<div class="ge-card ge-p0-legacy">'+
   '<div class="ge-card-head"><h3>'+icon('project0','ge-ic-lg')+'PROJECT 0: LEGACY REBIRTH</h3></div>'+
   '<p class="ge-body ge-muted">End this empire. Begin a new run with permanent bonuses. <b class="ge-gold-text">Optional — never forced.</b></p>'+
   (runNum>0?
    '<div class="ge-datarow"><span>'+icon('star','ge-ic-md')+'Legacy runs</span><b class="ge-num">'+runNum+'</b></div>'+
    '<div class="ge-datarow"><span>'+icon('check','ge-ic-md')+'Permanent bonus</span><b class="ge-num">+'+num(S.ex.legacy.bonus.qual,0)+'% quality • +'+num(S.ex.legacy.bonus.yield,0)+'% yield</b></div>'
    :'')+
   reqHtml+
   (req.met?
    '<div class="ge-btn-row"><button class="ge-btn ge-btn-danger ge-btn-block" data-ex-legacy="1">BEGIN LEGACY REBIRTH</button></div>'
    :'<p class="ge-p0-locknote">'+icon('lock','ge-ic-md')+' Meet every requirement to unlock rebirth.</p>')+
  '</div>';
}

/* Integrator calls EX_wireP0() at the END of RENDER.project0. */
function EX_wireP0(root){
  if(!EX_init()) return;
  const r=root||$('project0-root'); if(!r) return;
  if(r.querySelector('[data-ex-legacywrap]')) return;
  EX_appendHTML(r,'<div data-ex-legacywrap="1">'+EX_legacyHTML()+'</div>');
  const b=r.querySelector('[data-ex-legacy]');
  if(b) b.onclick=EX_doLegacy;
}
function EX_doLegacy(){
  if(!EX_init()) return;
  const req=EX_legacyReqs();
  if(!req.met){ toast(icon('lock','ge-ic-md')+' Legacy requirements not met yet.'); return; }
  const runNum=int(S.ex.legacy.runs,0)+1;
  confirmModal(icon('warn','ge-ic-md')+' LEGACY REBIRTH — IRREVERSIBLE',
   'Run #'+runNum+'. KEPT: Project 0 points & tracks, all unlocked strains & custom crosses, keepers, achievements, trophies, pheno history, titles, records. '+
   'RESET: cash to '+fmt$(DIFFS[S.difficulty].cash)+' starter, day 1, plants, inventory, buildings to Lv 1, employees released, territory to Home Turf, facility/equipment/crew & missions reset. '+
   'FOREVER: +'+(8*runNum)+'% quality & +'+(5*runNum)+'% yield on every future run.',
   ()=>EX_applyLegacy(runNum));
}

function EX_applyLegacy(runNum){
  const diff=S.difficulty, D=DIFFS[diff];
  const keep={ project0:S.project0, lockedStrains:S.lockedStrains.slice(), strainOwned:S.strainOwned, customStrains:S.customStrains,
    keepers:S.keepers, keeperCapacity:S.keeperCapacity, achievements:S.achievements.slice(),
    titles:S.titles.slice(), phenoHistory:S.phenoHistory, phenoArchive:S.phenoArchive };
  const exKeep={ trophies:S.ex.trophies, ach:S.ex.ach, records:S.ex.records };
  S=defaultState();
  S.difficulty=diff; S.cash=D.cash; S.started=true;
  S.project0=keep.project0; S.lockedStrains=keep.lockedStrains; S.strainOwned=keep.strainOwned; S.customStrains=keep.customStrains;
  S.keepers=keep.keepers; S.keeperCapacity=keep.keeperCapacity; S.achievements=keep.achievements;
  S.titles=keep.titles; S.phenoHistory=keep.phenoHistory; S.phenoArchive=keep.phenoArchive;
  S.ex=EX_defaultEx();
  S.ex.trophies=exKeep.trophies; S.ex.ach=exKeep.ach; S.ex.records=exKeep.records;
  S.ex.legacy={runs:runNum,bonus:{qual:8*runNum,yield:5*runNum}};
  EX_normalizeEx(); save(); updateHUD();
  show('home');
  toast(icon('project0','ge-ic-md')+' <b>LEGACY RUN #'+runNum+' BEGINS</b><br><span class="ge-muted">Permanent +'+(8*runNum)+'% quality • +'+(5*runNum)+'% yield</span>');
}


/* ================= LEADERBOARDS (honest LOCAL) ================= */
const EX_RECORD_DEFS=[
 {cat:'cash',label:'Biggest Bankroll',fmt:v=>fmt$(v)},
 {cat:'rep',label:'Peak Reputation',fmt:v=>String(int(v,0))},
 {cat:'harvestQuality',label:'Best Harvest Quality',fmt:v=>String(Math.round(num(v,0)))},
 {cat:'phenoScore',label:'Best Pheno Score',fmt:v=>String(Math.round(num(v,0)))},
 {cat:'keepers',label:'Most Keepers Held',fmt:v=>String(int(v,0))},
 {cat:'trophies',label:'Most Trophies',fmt:v=>String(int(v,0))},
 {cat:'empireSize',label:'Largest Empire',fmt:v=>String(int(v,0))},
 {cat:'grows',label:'Most Harvests',fmt:v=>String(int(v,0))},
 {cat:'strainValue',label:'Top Strain Value',fmt:v=>'×'+num(v,1).toFixed(2)}
];
function EX_record(cat,val,label){
  if(!EX_ready()) return;
  val=num(val,0);
  const cur=S.ex.records[cat];
  if(!cur||val>num(cur.val,0)) S.ex.records[cat]={val:val,label:String(label||''),day:int(S.day,1)};
}
function EX_syncRecords(){
  if(!EX_ready()) return;
  EX_record('cash',S.cash,'Cash on hand');
  EX_record('rep',S.reputation,'Reputation');
  EX_record('harvestQuality',S.stats.bestQuality,'Best harvest quality');
  EX_record('phenoScore',S.stats.bestPhenoScore,'Best pheno score');
  EX_record('keepers',S.keepers.length,'Keepers in vault');
  EX_record('trophies',S.ex.trophies.length,'Competition trophies');
  EX_record('grows',S.stats.harvests,'Harvests completed');
  const empireSize=int(S.facility,0)+Object.keys(S.ex.buildings).reduce((a,k)=>a+int(S.ex.buildings[k],1),0);
  EX_record('empireSize',empireSize,'Facility + building levels');
  const boosted=S.ex.trophies.filter(t=>t.place===1);
  if(boosted.length){
    const byStrain={};
    boosted.forEach(t=>{ byStrain[t.strainId]=(byStrain[t.strainId]||0)+1; });
    let bestId=null,bestN=0;
    Object.keys(byStrain).forEach(id=>{ if(byStrain[id]>bestN){bestN=byStrain[id];bestId=id;} });
    const bt=boosted.find(t=>t.strainId===bestId);
    EX_record('strainValue',1+0.05*bestN,(bt?bt.strainName:bestId)+' ('+bestN+' wins)');
  }
}

/* Stub for a future backend. Honest: local only for now. */
const EX_LeaderboardAPI={
  submitScore:function(){ return Promise.resolve({ok:false,local:true,note:'Online leaderboards are not connected yet — scores stay on this device.'}); },
  fetchScores:function(){ return Promise.resolve({ok:false,local:true,scores:[],note:'Online leaderboards are not connected yet — showing local records only.'}); }
};
RENDER.leaderboards=function(){
  if(!EX_init()) return;
  const r=$('leaderboards-root');
  if(!r) return;
  let html=screenHead('trophy','HALL OF RECORDS')+
   '<div class="ge-screen"><div class="ge-card ge-card-hot">'+
   '<div class="ge-card-head"><h3>'+icon('trophy','ge-ic-lg')+'PERSONAL RECORDS</h3></div>'+
   '<p class="ge-muted">Your all-time bests. Online leaderboards are coming later \u2014 these live on this device only.</p></div>'+
   '<div class="ge-tiles ms-records">';
  EX_RECORD_DEFS.forEach(d=>{
    const rec=S.ex.records[d.cat];
    html+='<div class="ge-metric-tile"><div class="ge-metric-value ge-num">'+(rec?esc(d.fmt(rec.val)):'\u2014')+'</div>'+
     '<div class="ge-metric-label">'+esc(d.label)+'</div>'+
     '<div class="ge-metric-sub">'+(rec?'Day '+int(rec.day,1):'not set')+'</div></div>';
  });
  html+='</div>';
  html+='<div class="ge-card ge-card-hot"><div class="ge-card-head"><h3>'+icon('crown-gold','ge-ic-lg')+'LOCAL LEGEND</h3></div>'+
   '<p><b>YOU</b> \u2014 the undisputed legend of this device.</p>'+
   '<div class="ge-datarow"><span>'+icon('level','ge-ic-sm')+'Level</span><b class="ge-num">'+int(S.level,1)+'</b></div>'+
   '<div class="ge-datarow"><span>'+icon('day','ge-ic-sm')+'Days survived</span><b class="ge-num">'+int(S.day,1)+'</b></div>'+
   '<div class="ge-datarow"><span>'+icon('trophy','ge-ic-sm')+'Competitions won</span><b class="ge-num">'+int(S.stats.compsWon,0)+'</b></div>'+
   '<div class="ge-datarow"><span>'+icon('genetics','ge-ic-sm')+'Custom strains bred</span><b class="ge-num">'+S.customStrains.length+'</b></div>'+
   (S.titles.length?'<div class="ms-titles">'+S.titles.map(t=>'<span class="ge-badge ge-badge-legendary">'+icon('trophy','ge-ic-sm')+esc(MS_stripEmoji(t))+'</span>').join('')+'</div>':'')+'</div>';
  html+='<div class="ge-card"><div class="ge-card-head"><h3>'+icon('trophy','ge-ic-lg')+'TROPHY CASE</h3>'+
   '<span class="ge-pill ge-pill-neutral ge-num">'+S.ex.trophies.length+'</span></div>'+
   (S.ex.trophies.length?S.ex.trophies.slice().reverse().map(t=>
     '<div class="ge-datarow"><span>'+MS_placeBadge(t.place)+' '+esc(t.compName||t.compId)+(t.catName&&t.catId!=='overall'?' \u2014 '+esc(t.catName):'')+'</span><b>'+esc(t.strainName||'')+'</b></div>').join(''):
    '<div class="ge-empty">'+icon('trophy','ge-ic-xl')+'<h3>No trophies yet</h3><p>Win a competition to start the case.</p></div>')+'</div>';
  html+='</div>';
  r.innerHTML=html;
};


/* ================= HOME DASHBOARD ================= */
function EX_nextUnlock(){
  if(!EX_ready()) return {text:'Keep growing — the empire compounds.',go:'grow',tab:null};
  let best=null;
  STRAINS.forEach(st=>{
    if(!st.lock||!S.lockedStrains.includes(st.id)) return;
    const l=st.lock; let gap=Infinity,txt='';
    if(l.t==='rep'){ gap=Math.max(0,int(l.v,0)-int(S.reputation,0)); txt=st.name+': reach '+int(l.v,0)+' rep'+(gap>0?' ('+gap+' to go)':''); }
    else if(l.t==='cash'){ const c=st.seed*3; gap=Math.max(0,c-num(S.cash,0))/100; txt=st.name+(gap>0?': save '+fmt$(c)+' for the genetics':': ready to buy in the Genetics Lab'); }
    else { gap=50; txt=strainDisplayName(st)+': unlock via Project 0 missions'; }
    if(!best||gap<best.gap) best={gap:gap,text:txt,go:'genetics',tab:null};
  });
  EX_BUILDINGS.forEach(b=>{
    const lv=EX_buildingLevel(b.id); if(lv>=5) return;
    const cost=b.levels[lv].cost, gap=Math.max(0,cost-num(S.cash,0))/200;
    if(!best||gap<best.gap) best={gap:gap,text:b.name+' → Level '+(lv+1)+' ('+fmt$(cost)+')',go:'empire',tab:'buildings'};
  });
  EX_LOCATIONS.forEach(l=>{
    if(S.ex.locations.unlocked.includes(l.id)) return;
    if(EX_locGateMet(l)&&(!best||10<best.gap)) best={gap:10,text:'Unlock territory: '+l.name,go:'locations',tab:null};
  });
  return best||{text:'Campaign nearly complete — chase trophies & legacy.',go:'leaderboards',tab:null};
}
/* ================= P1.4 + P1.6 PROGRESS UI (read-only) =================
   Purely informational: ALMOST THERE nearest-unlock card (P1.4) and "one more
   thing" transition cards (P1.6), computed from REAL state. No stat changes,
   no rewards, no new purchase paths, no countdowns, no expiring nudges. */

/* ---------- P1.6: once-only transition-card queue (persisted in S.tips) ---------- */
function NT_seen(){
  try{
    if(!S.tips||typeof S.tips!=='object') S.tips={};
    if(!S.tips.nextSeen||typeof S.tips.nextSeen!=='object') S.tips.nextSeen={};
    return S.tips.nextSeen;
  }catch(e){ return {}; }
}
function NT_queue(id,card){
  /* card: {ico,title,body(go-safe HTML),go,tab,cta,act} — fires EXACTLY ONCE per id */
  try{
    const seen=NT_seen();
    if(seen[id]) return false;
    seen[id]={ico:card.ico||'star',title:String(card.title||''),body:String(card.body||''),
      go:card.go||null,tab:card.tab||null,cta:String(card.cta||'OPEN'),act:card.act||null,dismissed:false};
    try{ save(); }catch(e){}
    return true;
  }catch(e){ return false; }
}
function NT_dismiss(id){
  try{ const seen=NT_seen(); if(seen[id]&&!seen[id].dismissed){ seen[id].dismissed=true; save(); } }catch(e){}
  try{ if(typeof current!=='undefined'&&current==='home'&&typeof RENDER!=='undefined'&&RENDER.home) RENDER.home(); }catch(e){}
}
function NT_doAct(act){
  try{ if(act==='plantSeed'&&typeof plantSeedModal==='function') plantSeedModal(); }catch(e){}
}
function NT_cards(){
  try{
    const seen=NT_seen(), out=[];
    Object.keys(seen).forEach(id=>{ const c=seen[id]; if(c&&!c.dismissed) out.push({id:id,ico:c.ico,title:c.title,body:c.body,go:c.go,tab:c.tab,cta:c.cta,act:c.act}); });
    return out.slice(-3).reverse(); /* newest first, max 3 on screen */
  }catch(e){ return []; }
}
function NT_cardsHTML(){
  try{
    const cards=NT_cards(); if(!cards.length) return '';
    let html='<div class="ge-section-title">ONE MORE THING</div><div class="ge-home-onemore">';
    cards.forEach(c=>{
      html+='<div class="ge-card ge-onemore-card">'+
        '<button class="ge-onemore-x" data-nt-dismiss="'+esc(c.id)+'" aria-label="Dismiss">'+icon('x','ge-ic-sm')+'</button>'+
        '<div class="ge-onemore-head">'+icon(c.ico||'star','ge-ic-md')+'<b>'+esc(c.title)+'</b></div>'+
        '<p class="ge-body ge-muted">'+c.body+'</p>'+
        (c.act?'<button class="ge-btn ge-btn-ghost ge-btn-sm" data-nt-act="'+esc(c.act)+'">'+esc(c.cta||'OPEN')+'</button>'
         :c.go?'<button class="ge-btn ge-btn-ghost ge-btn-sm" data-ex-go="'+esc(c.go)+'"'+(c.tab?' data-ex-tab="'+esc(c.tab)+'"':'')+'>'+esc(c.cta||'OPEN')+'</button>':'')+
        '</div>';
    });
    return html+'</div>';
  }catch(e){ return ''; }
}

/* ---------- P1.6 trigger handlers (read-only; queue only when conditions met) ---------- */
function NT_onHarvest(){
  try{
    if(typeof EX_buildingLevel!=='function'||EX_buildingLevel('processing')<=1) return; /* lab not owned -> no-op */
    NT_queue('nt-harvest-proc',{ico:'flask',title:'Fresh harvest — process it?',
      body:'You own the <b>PROCESSING LAB</b>. Raw flower sells as-is, but a lab batch multiplies its value.',
      go:'production',cta:'OPEN PRODUCTION'});
  }catch(e){}
}
function NT_onMissionDone(mid){
  try{
    const list=(typeof MISSIONS!=='undefined')?MISSIONS:[];
    const done=list.find(m=>m.id===mid); if(!done) return;
    const nx=list.find(m=>m.id!==mid&&m.cat===done.cat&&!((S.missionsDone||[]).includes(m.id)));
    if(!nx) return; /* no next mission in this category -> no-op */
    NT_queue('nt-mission-'+mid,{ico:'missions',title:'Mission complete — next in '+done.cat,
      body:'<b>'+esc(nx.name)+'</b><br><span class="ge-muted">'+esc(nx.desc)+'</span>',
      go:'missions',cta:'VIEW MISSIONS'});
  }catch(e){}
}
function NT_onRankUp(rankIdx){
  try{
    const g=P14_nearestGenetic(); if(!g) return;
    NT_queue('nt-rank-'+rankIdx,{ico:'crown',title:'Rank up — genetics in reach',
      body:'Nearest unlock: <b>'+esc(g.st.name)+'</b> — '+esc(g.needText)+'.',
      go:'genetics',cta:'VIEW GENETICS'});
  }catch(e){}
}
function NT_onKeeper(k){
  try{
    if(!k) return;
    NT_queue('nt-keeper-clone',{ico:'clone',title:'Keeper vaulted — clone it?',
      body:'<b>'+esc(String(k.strainName||'Keeper'))+(k.phenoNum?' #'+int(k.phenoNum,0):'')+'</b> is preserved. Promote it to a mother to take identical clones.',
      go:'keepers',cta:'OPEN KEEPER VAULT'});
  }catch(e){}
}
function NT_affordBest(){
  /* cheapest currently-affordable building upgrade or territory (EX_nextUnlock-style) */
  try{
    const cash=num(S.cash,0); let best=null;
    (EX_BUILDINGS||[]).forEach(b=>{
      const lv=EX_buildingLevel(b.id); if(lv>=5) return;
      const cost=num(b.levels[lv].cost,0);
      if(cost>0&&cost<=cash&&(!best||cost<best.cost)) best={kind:'b',id:b.id,name:b.name,lv:lv,cost:cost};
    });
    (EX_LOCATIONS||[]).forEach(l=>{
      if((S.ex.locations.unlocked||[]).includes(l.id)) return;
      const cost=num((l.gate||{}).cash,0);
      if(EX_locGateMet(l)&&(!best||cost<best.cost)) best={kind:'l',id:l.id,name:l.name,cost:cost};
    });
    return best;
  }catch(e){ return null; }
}
function NT_affordSig(){ const b=NT_affordBest(); return b?(b.kind+':'+b.id+':'+int(b.lv,0)):''; }
function NT_onSale(total,preSig){
  try{
    total=num(total,0); if(total<=0) return;
    const preRev=Math.max(0,num(S.stats&&S.stats.lifetimeRevenue,0)-total);
    if(total<Math.max(1000,0.25*preRev)) return; /* big-sale threshold: >=25% of prior lifetime revenue (min $1k) */
    const best=NT_affordBest(); if(!best) return;
    if(preSig&&preSig===NT_affordSig()) return; /* nothing newly affordable -> no-op */
    const what=best.kind==='b'
      ?('<b>'+esc(best.name)+' → LV '+(best.lv+1)+'</b> ('+fmt$(best.cost)+')')
      :('territory <b>'+esc(best.name)+'</b> ('+fmt$(best.cost)+')');
    NT_queue('nt-bigsale-'+int(S.stats.sales,0),{ico:'cash',title:'Big sale — upgrade in reach',
      body:'That <b>'+fmt$(total)+'</b> sale puts '+what+' within reach.',
      go:best.kind==='b'?'empire':'locations',tab:best.kind==='b'?'buildings':null,
      cta:best.kind==='b'?'VIEW UPGRADES':'VIEW TERRITORIES'});
  }catch(e){}
}
function NT_onP0Level(track,lvl){
  try{
    const t=((typeof P0_TRACKS!=='undefined')?P0_TRACKS:[]).find(x=>x.id===track);
    const tn=t?t.name:String(track).toUpperCase();
    NT_queue('nt-p0-'+track+'-'+lvl,{ico:'project0',title:tn+' hit LV '+lvl,
      body:(track==='preservation'?'Preservation is the heart of Project 0 — keepers, mothers and lineage keep the fire alive. ':'')+
        'The '+esc(tn)+' track board shows what the next level unlocks.',
      go:'project0',cta:'VIEW PROJECT 0'});
  }catch(e){}
}
function NT_onStrainUnlock(id){
  try{
    const st=(typeof getStrain==='function')?getStrain(id):null; if(!st) return;
    NT_queue('nt-strain-'+id,{ico:'grow',title:'New genetics: '+st.name,
      body:'Unlocked and ready in the library. Plant it now to start the first run.',
      act:'plantSeed',cta:'PLANT IT NOW'});
  }catch(e){}
}

/* ---------- P1.4: nearest-unlock computation (real state, relative gaps) ---------- */
function P14_nearestGenetic(){
  try{
    const cash=num(S.cash,0), rep=int(typeof TY_repOverall==='function'?TY_repOverall():S.reputation,0);
    let best=null;
    STRAINS.forEach(st=>{
      if(!st.lock||!((S.lockedStrains||[]).includes(st.id))) return;
      const l=st.lock; let rel=1, needText='', closeText='';
      if(l.t==='rep'){ const v=int(l.v,0), gap=Math.max(0,v-rep); rel=v>0?gap/v:1; needText=v+' rep'; closeText=gap>0?(gap+' rep to go'):'requirement met'; }
      else if(l.t==='cash'){ const c=num(st.seed,0)*3, gap=Math.max(0,c-cash); rel=c>0?gap/c:1; needText=gap>0?('save '+fmt$(c)):('buy it in the Genetics Lab'); closeText=gap>0?(fmt$(gap)+' to go'):'requirement met'; }
      else { rel=1; needText='unlock via Project 0'; closeText='earn it through Project 0'; }
      if(!best||rel<best.rel) best={st:st,rel:rel,needText:needText,closeText:closeText,pct:Math.round((1-Math.min(1,rel))*100)};
    });
    return best;
  }catch(e){ return null; }
}
function P14_candidates(){
  const out=[];
  try{
    const cash=num(S.cash,0), rep=int(typeof TY_repOverall==='function'?TY_repOverall():S.reputation,0);
    const rev=num(S.stats&&S.stats.lifetimeRevenue,0);
    /* 1. rep -> next rank (TY_RANKS) */
    try{
      let ni=int(typeof TY_rankIdx==='function'?TY_rankIdx():0,0)+1;
      while(ni<TY_RANKS.length-1&&TY_rankReqMet(ni)) ni++;
      if(ni<TY_RANKS.length&&!TY_rankReqMet(ni)){
        const R=TY_RANKS[ni], reqs=[];
        const addR=(have,need,txt,goTxt)=>{ need=num(need,0); if(need>0){ const gap=Math.max(0,need-have); reqs.push({rel:gap/need,txt:txt(need),go:goTxt(gap),gap:gap}); } };
        addR(rep,int(R.req.rep,0),v=>v+' rep',g=>g+' rep to go');
        addR(rev,num(R.req.rev,0),v=>fmt$(v)+' earned',g=>fmt$(g)+' to go');
        addR(int(S.stats.crosses,0),int(R.req.crosses,0),v=>v+' crosses',g=>g+' crosses to go');
        addR(((S.ex||{}).locations||{unlocked:[]}).unlocked.length,int(R.req.locs,0),v=>v+' territories',g=>g+' territories to go');
        addR(int(S.project0.points,0),int(R.req.p0,0),v=>v+' P0 pts',g=>g+' P0 pts to go');
        const unmet=reqs.filter(r=>r.gap>0);
        if(unmet.length){
          unmet.sort((a,b)=>b.rel-a.rel);
          const bind=unmet[0];
          out.push({rel:bind.rel,want:'Rank: '+R.name,need:unmet.map(r=>r.txt).join(' • '),
            close:bind.go,pct:Math.round((1-Math.min(1,bind.rel))*100),go:null,tab:null});
        }
      }
    }catch(e){}
    /* 2. Project 0 -> next track level (P0_LEVEL_PTS) */
    try{
      (P0_TRACKS||[]).forEach(t=>{
        const lvl=p0Level(t.id); if(lvl>=P0_LEVEL_PTS.length-1) return;
        const th=P0_LEVEL_PTS[lvl+1], pts=num(S.project0.tracks[t.id],0), gap=Math.max(0,th-pts), rel=th>0?gap/th:1;
        out.push({rel:rel,want:'Project 0 '+t.name+' → LV '+(lvl+1),need:th+' pts (have '+Math.floor(pts)+')',
          close:gap>0?(gap+' pts to go'):'level up pending',pct:Math.round((1-Math.min(1,rel))*100),go:'project0',tab:null});
      });
    }catch(e){}
    /* 3. nearest genetic unlock */
    try{
      const g=P14_nearestGenetic();
      if(g) out.push({rel:g.rel,want:'Genetics: '+g.st.name,need:g.needText,close:g.closeText,pct:g.pct,go:'genetics',tab:null});
    }catch(e){}
    /* 4. next building affordability */
    try{
      (EX_BUILDINGS||[]).forEach(b=>{
        const lv=EX_buildingLevel(b.id); if(lv>=5) return;
        const cost=num(b.levels[lv].cost,0); if(cost<=0) return;
        const gap=Math.max(0,cost-cash), rel=gap/cost;
        out.push({rel:rel,want:b.name+' → LV '+(lv+1),need:fmt$(cost),
          close:gap>0?(fmt$(gap)+' to go'):'affordable now',pct:Math.round((1-Math.min(1,rel))*100),go:'empire',tab:'buildings'});
      });
    }catch(e){}
    /* 5. next territory affordability */
    try{
      (EX_LOCATIONS||[]).forEach(l=>{
        if(((S.ex||{}).locations||{unlocked:[]}).unlocked.includes(l.id)) return;
        const g=l.gate||{}, parts=[], gaps=[];
        const addG=(have,need,label,fmt)=>{ need=num(need,0); if(need>0){ const gap=Math.max(0,need-have); parts.push(fmt(need)); if(gap>0) gaps.push({rel:gap/need,txt:fmt(gap)+' '+label+' to go'}); } };
        addG(rep,num(g.rep,0),'rep',v=>v+' rep');
        addG(cash,num(g.cash,0),'cash',v=>fmt$(v));
        addG(int(S.stats.missionsDone,0),int(g.missions,0),'missions',v=>v+' missions');
        if(!parts.length) return;
        gaps.sort((a,b)=>b.rel-a.rel);
        const bind=gaps[0];
        out.push({rel:bind?bind.rel:0,want:'Territory: '+l.name,
          need:parts.join(' • ')+(bind?'':' — gate met'),
          close:bind?bind.txt:'gate met — unlock from Locations',
          pct:bind?Math.round((1-Math.min(1,bind.rel))*100):100,go:'locations',tab:null});
      });
    }catch(e){}
  }catch(e){}
  /* 6. P3-W6 big-purchase goals: Wave 4/5 additions with real affordability math.
     Prices are surfaced, never changed. */
  try{ P14_wave6().forEach(c=>out.push(c)); }catch(e){}
  out.sort((a,b)=>a.rel-b.rel);
  return out.slice(0,4);
}
function P14_cardHTML(){
  try{
    const cands=P14_candidates(); if(!cands.length) return '';
    let html='<div class="ge-section-title">ALMOST THERE</div><div class="ge-card ge-almost-card">'+
      '<div class="ge-card-head"><h3>'+icon('star','ge-ic-md')+'NEAREST UNLOCKS</h3></div>';
    cands.forEach(c=>{
      html+='<div class="ge-almost-row">'+
        '<div class="ge-datarow"><span class="ge-almost-lbl">WHAT I WANT</span><b>'+esc(c.want)+'</b></div>'+
        '<div class="ge-datarow"><span class="ge-almost-lbl">WHAT I NEED</span><span class="ge-num">'+esc(c.need)+'</span></div>'+
        '<div class="ge-almost-lbl">HOW CLOSE AM I</div>'+
        '<div class="ge-progress-meta"><span class="ge-caption ge-muted">'+esc(c.close)+'</span><b class="ge-num">'+c.pct+'%</b></div>'+
        '<div class="ge-progress"><i style="width:'+clamp(c.pct,0,100)+'%"></i></div>'+
        (c.go?'<div class="ge-btn-row"><button class="ge-btn ge-btn-ghost ge-btn-sm" data-ex-go="'+c.go+'"'+(c.tab?' data-ex-tab="'+c.tab+'"':'')+'>VIEW</button></div>':'')+
        '</div>';
    });
    return html+'</div>';
  }catch(e){ return ''; }
}

function EX_homeActions(){
  const acts=[];
  const needy=S.plants.filter(p=>p.health<50||p.water<20||p.nutrition<15).length;
  if(needy>0) acts.push({sev:'warn',ico:'warn',t:needy+' plant'+(needy===1?' needs':'s need')+' attention',s:'Health, water or food critical.',go:'grow',tab:null});
  let ready=0;
  S.plants.forEach(p=>{ try{ if(stageOf(p)>=5) ready++; }catch(e){} });
  if(ready>0) acts.push({sev:'good',ico:'harvest',t:ready+' plant'+(ready===1?'':'s')+' ready to harvest',s:'Don\'t let them sit.',go:'grows',tab:null});
  const poolDue=Math.max(0,3-(int(S.day,1)-int(S.ex.pday,1)));
  if(poolDue===0&&S.ex.pool.length) acts.push({sev:'info',ico:'users',t:'Fresh staff candidates waiting',s:'New hiring pool is in.',go:'empire',tab:'staff'});
  let wxNote='';
  try{
    if(typeof WX_activeEventMod==='function'){ const ev=WX_activeEventMod('current'); if(ev) wxNote=String(ev.title||ev.name||ev); }
  }catch(e){}
  if(wxNote) acts.push({sev:'warn',ico:'warn',t:'Active event: '+wxNote,s:'Check the grow room.',go:'grow',tab:null});
  try{
    if(typeof WX_marketMult==='function'){ const mm=num(WX_marketMult('all'),1); if(mm>1.05) acts.push({sev:'good',ico:'chart',t:'Market boom x'+mm.toFixed(2),s:'Sell while prices are hot.',go:'dispensary',tab:null}); }
  }catch(e){}
  const pay=EX_payrollTotal();
  if(pay>0) acts.push({sev:'info',ico:'crew',t:'Payroll: '+fmt$(pay)+'/day ('+S.ex.employees.length+' staff)',s:'Keep cash flowing.',go:'empire',tab:'staff'});
  const nm=nextMission();
  if(nm) acts.push({sev:'info',ico:'missions',t:'Next mission: '+nm.name,s:nm.desc,go:'missions',tab:null});
  const un=EX_nextUnlock();
  acts.push({sev:'info',ico:'check',t:'Next unlock: '+un.text,s:'Your fastest power spike.',go:un.go,tab:un.tab});
  if(!acts.length) acts.push({sev:'good',ico:'grow',t:'Plant a seed',s:'The empire starts in the soil.',go:'grow',tab:null});
  return acts.slice(0,6);
}

RENDER.home=function(){
  if(!EX_init()) return;
  const r=$('home-root');
  const lvl=Math.max(1,int(S.level,1)), xp=num(S.xp,0), xpN=xpNeed(lvl);
  const hunts=S.phenoHunts.filter(h=>h.active).length;
  const recentCrosses=S.customStrains.slice(-3).reverse();
  let html=HM_identityHead();
  html+='<div class="ge-card ge-home-xp"><div class="ge-progress-meta"><span>'+icon('xp','ge-ic-md')+'LEVEL '+lvl+' &mdash; '+Math.max(0,xpN-xp)+' XP TO NEXT</span><b class="ge-num">'+int(xp,0)+'/'+xpN+'</b></div>'+
   '<div class="ge-progress"><i style="width:'+clamp(xp/xpN*100,0,100)+'%"></i></div></div>';
  try{ html+=TY_dashCommand(); }catch(e){}
  html+='<div class="ge-section-title">WHAT SHOULD I DO NEXT?</div><div class="ge-home-actions">';
  EX_homeActions().forEach(a=>{
    html+='<button class="ge-card ge-card-tap ge-home-action ge-anim-rise" data-ex-go="'+a.go+'"'+(a.tab?' data-ex-tab="'+a.tab+'"':'')+'>'+
     '<span class="ge-home-action-ico ge-home-sev-'+a.sev+'">'+icon(a.ico||'star','ge-ic-md')+'</span>'+
     '<span class="ge-home-action-tx"><b>'+esc(a.t)+'</b><span class="ge-muted ge-caption">'+esc(a.s)+'</span></span>'+
     icon('arrow-right','ge-ic-sm')+'</button>';
  });
  html+='</div>';
  try{ html+=P14_cardHTML(); }catch(e){} /* P1.4 ALMOST THERE */
  try{ html+=NT_cardsHTML(); }catch(e){} /* P1.6 one-more-thing stack */
  try{ html+=RH_hooksHTML(); }catch(e){} /* P2.5 ON THE HORIZON - return hooks */
  html+='<div class="ge-section-title">EMPIRE AT A GLANCE</div><div class="ge-home-glance">'+
   '<button class="ge-metric-tile ge-card-tap" data-ex-go="grow"><span class="ge-metric-value ge-num">'+S.plants.length+'</span><span class="ge-metric-label">GROWING</span></button>'+
   '<button class="ge-metric-tile ge-card-tap" data-ex-go="genetics"><span class="ge-metric-value ge-num">'+hunts+'</span><span class="ge-metric-label">PHENO HUNTS</span></button>'+
   '<button class="ge-metric-tile ge-card-tap" data-ex-go="breeding"><span class="ge-metric-value ge-num">'+S.customStrains.length+'</span><span class="ge-metric-label">CUSTOM STRAINS</span></button>'+
   '<button class="ge-metric-tile ge-card-tap" data-ex-go="empire" data-ex-tab="staff"><span class="ge-metric-value ge-num">'+S.ex.employees.length+'</span><span class="ge-metric-label">STAFF</span></button>'+
   '<button class="ge-metric-tile ge-card-tap" data-ex-go="leaderboards"><span class="ge-metric-value ge-num">'+S.ex.trophies.length+'</span><span class="ge-metric-label">TROPHIES</span></button>'+
   '<button class="ge-metric-tile ge-card-tap" data-ex-go="locations"><span class="ge-metric-value ge-truncate">'+esc(EX_locById(S.ex.locations.current).name.split(' ')[0])+'</span><span class="ge-metric-label">TERRITORY</span></button></div>'+
  '<div class="ge-btn-row"><button class="ge-btn ge-btn-gold ge-btn-block ge-card-tap" data-ex-go="dashboard">'+icon('empire','ge-ic-md')+'OPEN EMPIRE DASHBOARD</button></div>';
  try{ html+=TY_dashNewsFeed(); }catch(e){}
  if(recentCrosses.length){
    html+='<div class="ge-card"><div class="ge-card-head"><h3>'+icon('breeding','ge-ic-md')+'RECENT CROSSES</h3></div>'+
     recentCrosses.map(s=>'<div class="ge-datarow"><span>'+esc(s.name)+'</span><span class="ge-badge ge-badge-legendary">R'+Math.round(num(s.resin,0))+'</span></div>').join('')+'</div>';
  }
  html+='<div class="ge-card"><div class="ge-datarow"><span>'+icon('missions','ge-ic-md')+'Missions</span><b class="ge-num">'+int(S.stats.missionsDone,0)+'/'+MISSIONS.length+'</b></div>'+
   '<div class="ge-datarow"><span>'+icon('trophy','ge-ic-md')+'Achievements</span><b class="ge-num">'+EX_ACHIEVEMENTS.filter(a=>S.ex.ach[a.id]).length+'/'+EX_ACHIEVEMENTS.length+'</b></div>'+
   '<div class="ge-btn-row"><button class="ge-btn ge-btn-ghost ge-btn-sm" data-ex-go="achievements">TROPHIES</button>'+
   '<button class="ge-btn ge-btn-ghost ge-btn-sm" data-ex-go="leaderboards">RECORDS</button>'+
   '<button class="ge-btn ge-btn-ghost ge-btn-sm" data-ex-go="locations">TERRITORY</button></div></div>';
  r.innerHTML=html;
  r.querySelectorAll('[data-ex-go]').forEach(b=>b.onclick=()=>{
    if(b.dataset.exTab) empireTab=b.dataset.exTab;
    show(b.dataset.exGo);
  });
  r.querySelectorAll('[data-nt-dismiss]').forEach(b=>b.onclick=()=>NT_dismiss(b.dataset.ntDismiss)); /* P1.6 */
  r.querySelectorAll('[data-nt-act]').forEach(b=>b.onclick=()=>NT_doAct(b.dataset.ntAct)); /* P1.6 */
};


/* ================= DAILY TICK =================
   Integrator calls EX_tick() from advanceDay() (after day++ / missions). */
function EX_tick(){
  if(!EX_init()) return;
  EX_payrollTick();
  try{ if(typeof P3W5_dayTick==='function') P3W5_dayTick(); }catch(e){} /* P3-W5: crew specialties + tenure */
  S.ex.employees.forEach(e=>{ e.xp=num(e.xp,0)+8; EX_empLevelCheck(e,false); });
  if(int(S.day,1)-int(S.ex.pday,1)>=3) EX_genPool();
  EX_upkeepTick();
  const p0l=EX_buildingLevel('p0vault');
  if(p0l>1){ const trs=P0_TRACKS.map(t=>t.id); addP0(trs[int(S.day,0)%trs.length],p0l-1); }
  EX_syncRecords();
  EX_checkAch();
  save();
}
/* ============================================================
   TYCOON EXPANSION (TY_) — Shocker OwnZ Grow Empire
   One interconnected simulation: production → business → economy → reputation → production.
   Builds ON TOP of existing systems. No existing feature removed.
   State lives in S.ty (migrated safely for old saves).
   ============================================================ */

/* ---------------- state ---------------- */
function TY_defaultTy(){
  return {
    version:2,
    rep:{quality:0,reliability:0,service:0,genetics:0,business:0},
    rank:0, rankSeen:0,
    news:[], feed:[],
    elecPrice:1.0, season:0,
    strainPop:{}, typeDem:{},
    comps:[], pShare:62,
    proc:[], nextProcId:1, prod:[], nextProdId:1,
    cust:{regulars:{},dayLog:[],stats:{cust:0,repeat:0,sat:0,satN:0,lost:0,sales:0,rev:0,short:0}},
    fin:{rev:0,exp:0,lastLifeRev:0,hist:[]},
    empX:{}, locFac:{}, locRev:{},
    stab:{}, strainLib:{},
    perks:{}, stats:{products:0,wholesale:0,contractsWH:0,ads:0,perfectQ:0},
    weekendBoost:0, shortagePtype:null,
    topStrain:null, topStrainRev:0,
    lastNewsDay:0, initDone:false
  };
}
function TY_normalizeTy(){
  if(!S.ty||typeof S.ty!=='object') S.ty=TY_defaultTy();
  const t=S.ty, d=TY_defaultTy();
  t.version=2;
  if(!t.rep||typeof t.rep!=='object') t.rep={quality:0,reliability:0,service:0,genetics:0,business:0};
  ['quality','reliability','service','genetics','business'].forEach(k=>{
    t.rep[k]=Math.max(0,num(t.rep[k],0));
    /* migrate: seed categories from overall rep on first run */
    if(!t.initDone) t.rep[k]=Math.max(t.rep[k],int(S.reputation,0));
  });
  t.rank=clamp(int(t.rank,0),0,TY_RANKS.length-1); t.rankSeen=clamp(int(t.rankSeen,0),0,TY_RANKS.length-1);
  if(!Array.isArray(t.news)) t.news=[];
  if(!Array.isArray(t.feed)) t.feed=[];
  t.elecPrice=num(t.elecPrice,1.0)||1.0; t.season=clamp(int(t.season,0),0,3);
  if(!t.strainPop||typeof t.strainPop!=='object') t.strainPop={};
  if(!t.typeDem||typeof t.typeDem!=='object') t.typeDem={};
  if(!Array.isArray(t.comps)) t.comps=[];
  t.pShare=clamp(num(t.pShare,62),5,95);
  if(!Array.isArray(t.proc)) t.proc=[];
  t.nextProcId=Math.max(1,int(t.nextProcId,1));
  if(!Array.isArray(t.prod)) t.prod=[];
  t.nextProdId=Math.max(1,int(t.nextProdId,1));
  if(!t.cust||typeof t.cust!=='object') t.cust={regulars:{},dayLog:[],stats:{cust:0,repeat:0,sat:0,satN:0,lost:0,sales:0,rev:0,short:0}};
  if(!t.cust.regulars||typeof t.cust.regulars!=='object') t.cust.regulars={};
  if(!Array.isArray(t.cust.dayLog)) t.cust.dayLog=[];
  if(!t.cust.stats||typeof t.cust.stats!=='object') t.cust.stats={cust:0,repeat:0,sat:0,satN:0,lost:0,sales:0,rev:0,short:0};
  if(!t.fin||typeof t.fin!=='object') t.fin={rev:0,exp:0,lastLifeRev:0,hist:[]};
  t.fin.rev=num(t.fin.rev,0); t.fin.exp=num(t.fin.exp,0);
  t.fin.lastLifeRev=num(t.fin.lastLifeRev,num(S.stats&&S.stats.lifetimeRevenue,0));
  if(!Array.isArray(t.fin.hist)) t.fin.hist=[];
  if(!t.empX||typeof t.empX!=='object') t.empX={};
  if(!t.locFac||typeof t.locFac!=='object') t.locFac={};
  if(!t.locRev||typeof t.locRev!=='object') t.locRev={};
  if(!t.stab||typeof t.stab!=='object') t.stab={};
  if(!t.strainLib||typeof t.strainLib!=='object') t.strainLib={};
  if(!t.perks||typeof t.perks!=='object') t.perks={};
  if(!t.stats||typeof t.stats!=='object') t.stats={products:0,wholesale:0,contractsWH:0,ads:0,perfectQ:0};
  t.weekendBoost=num(t.weekendBoost,0);
  if(typeof t.shortagePtype!=='string') t.shortagePtype=null;
  t.lastNewsDay=int(t.lastNewsDay,0);
  t.initDone=true;
  S.ty=t;
}

/* ---------------- player feedback: notification feed ---------------- */
function TY_notify(text,cls,quiet){
  try{
    if(!S.ty||!Array.isArray(S.ty.feed)) return;
    S.ty.feed.unshift({day:int(S.day,1),text:String(text),cls:cls||'info'});
    if(S.ty.feed.length>40) S.ty.feed.length=40;
    if(!quiet) toast(text);
  }catch(e){}
}
function TY_feedHTML(n){
  const t=S.ty; if(!t||!t.feed.length) return '<p class="ge-body ge-muted">No alerts yet. Make moves.</p>';
  const tone={good:'ge-dp-dot-good',warn:'ge-dp-dot-warn',bad:'ge-dp-dot-bad',info:''};
  return t.feed.slice(0,n||8).map(f=>'<div class="ge-dp-feedrow"><span class="ge-dp-dot '+(tone[f.cls]||'')+'"></span><span class="ge-muted ge-num ge-caption">D'+f.day+'</span><span>'+f.text+'</span></div>').join('');
}


/* ---------------- deep reputation ---------------- */
const TY_REP_CATS=[
 {id:'quality',name:'QUALITY',ico:'star',desc:'Harvest quality. Connoisseurs watch this.'},
 {id:'reliability',name:'RELIABILITY',ico:'check',desc:'Contracts fulfilled, promises kept.'},
 {id:'service',name:'SERVICE',ico:'crew',desc:'Customer satisfaction at retail.'},
 {id:'genetics',name:'GENETICS',ico:'genetics',desc:'Breeding, keepers, preservation.'},
 {id:'business',name:'BUSINESS',ico:'cash',desc:'Revenue, profit, empire scale.'}
];
function TY_gainRep(cat,n){
  try{
    if(!S.ty) return;
    n=num(n,0); if(!(n>0)) return;
    if(S.ty.rep&&cat in S.ty.rep) S.ty.rep[cat]=Math.max(0,num(S.ty.rep[cat],0)+n);
    gainRep(n); /* overall rep + unlocks preserved */
  }catch(e){}
}
/* mirror unattributed rep gains softly into categories so the profile tracks growth */
function TY_repMirror(n){
  try{
    if(!S.ty||!S.ty.rep) return;
    n=num(n,0); if(!(n>0)) return;
    Object.keys(S.ty.rep).forEach(k=>{ S.ty.rep[k]=num(S.ty.rep[k],0)+n*0.12; });
  }catch(e){}
}
function TY_repOverall(){ try{ return int(S.reputation,0); }catch(e){ return 0; } }
function TY_repCat(id){ try{ return Math.max(0,num(S.ty.rep[id],0)); }catch(e){ return 0; } }
/* reputation effects on the economy */
function TY_repPriceMult(){
  const b=TY_repCat('business'), s=TY_repCat('service');
  return clamp(1+((b+s)/2)*0.0006,1,1.18);
}
function TY_playstyle(){
  let best='quality',bv=-1;
  TY_REP_CATS.forEach(c=>{ const v=TY_repCat(c.id); if(v>bv){ bv=v; best=c.id; } });
  const titles={quality:'PREMIUM CRAFT GROWER',reliability:'TRUSTED SUPPLIER',service:'DISPENSARY MOGUL',genetics:'ELITE BREEDER',business:'COMMERCIAL PRODUCER'};
  return titles[best]||'MASTER GROWER';
}
function TY_repProfileHTML(){
  let h='<div class="ge-card"><div class="ge-card-head"><h3>'+icon('rep','ge-ic-md')+'REPUTATION PROFILE</h3></div>';
  h+='<div class="ge-datarow"><span>Overall</span><b class="ge-num">'+TY_repOverall()+'</b></div>';
  h+='<div class="ge-datarow"><span>Playstyle</span><span class="ge-badge ge-badge-gold">'+TY_playstyle()+'</span></div>';
  TY_REP_CATS.forEach(c=>{
    const v=Math.round(TY_repCat(c.id));
    h+='<div class="ge-progress-meta" title="'+esc(c.desc)+'"><span>'+DP_iconSafe(c.ico,'ge-ic-sm')+' '+c.name+'</span><b class="ge-num">'+v+'</b></div>'+
       '<div class="ge-progress"><i style="width:'+clamp(v/30,0,100)+'%"></i></div>';
  });
  h+='<p class="ge-body ge-muted">Reputation moves customers, prices, applicants, contracts and unlocks.</p></div>';
  try{ if(typeof P3W5_repUnlocksHTML==='function') h+=P3W5_repUnlocksHTML(); }catch(e){} /* P3-W5: category unlocks */
  return h;
}


/* ---------------- permanent perks / unlocks ---------------- */
function TY_hasPerk(id){ try{ return !!S.ty.perks[id]; }catch(e){ return false; } }
function TY_grantPerk(id,label){
  try{
    if(!S.ty.perks) S.ty.perks={};
    if(S.ty.perks[id]) return;
    S.ty.perks[id]=1;
    TY_notify(icon('check','ge-ic-md')+' UNLOCKED: <b>'+esc(label)+'</b>','good');
  }catch(e){}
}

function TY_grantUnlock(id,missionName){
  const U={
    branding:['branding','BRANDING — +6% on all sale prices'],
    wholesale:['wholesale','WHOLESALE CONTRACTS — bulk buyers unlocked'],
    marketing:['marketing','MARKETING — advertising twice as effective'],
    labauto:['labauto','AUTO-CURE — premium flower processes 1 day faster'],
    vaultkey:['vaultkey','VAULT KEY — Project 0 vault pays +1 P0/day']
  };
  const u=U[id]; if(!u) return;
  TY_grantPerk(u[0],u[1]);
}

/* ---------------- rank progression ---------------- */
const TY_RANKS=[
 {name:'STREET ROOKIE',req:{},unlocks:['The grind begins.']},
 {name:'STREET DEALER',req:{rep:25},unlocks:['Street buyers take you seriously.']},
 {name:'RUNNER',req:{rep:60,rev:5000},unlocks:['+5% sale prices.']},
 {name:'PLUG',req:{rep:120,rev:20000},unlocks:['Supplier hookup: seeds & gear 10% off.']},
 {name:'BIG PLUG',req:{rep:200,rev:60000},unlocks:['Wholesale offers appear in contracts.']},
 {name:'LOCAL BOSS',req:{rep:320,rev:150000},unlocks:['Bigger hiring pool (5 candidates).']},
 {name:'BUDTENDER',req:{rep:450,rev:300000},unlocks:['Dispensary service +15% satisfaction.']},
 {name:'DISPENSARY BOSS',req:{rep:650,rev:600000},unlocks:['Marketing unlocked: advertising works.']},
 {name:'BREEDER',req:{rep:900,rev:1000000,crosses:10},unlocks:['Advanced prediction detail in the lab.']},
 {name:'SUPPLIER',req:{rep:1200,rev:2000000},unlocks:['Bulk wholesale contracts (50+ oz).']},
 {name:'INDUSTRY BOSS',req:{rep:1600,rev:4000000},unlocks:['Production capacity doubled.']},
 {name:'MOGUL',req:{rep:2200,rev:8000000,locs:4},unlocks:['Territories 5 & 6 unlocked.']},
 {name:'LEGEND',req:{rep:3000,rev:15000000,p0:150},unlocks:['Elite endgame. Project 0 Legacy enhanced.']}
];
function TY_rankIdx(){ try{ return clamp(int(S.ty.rank,0),0,TY_RANKS.length-1); }catch(e){ return 0; } }
function TY_rankName(){ return TY_RANKS[TY_rankIdx()].name; }
function TY_rankReqMet(i){
  const r=TY_RANKS[i].req, rev=num(S.stats&&S.stats.lifetimeRevenue,0);
  if(r.rep&&TY_repOverall()<r.rep) return false;
  if(r.rev&&rev<r.rev) return false;
  if(r.crosses&&int(S.stats.crosses,0)<r.crosses) return false;
  if(r.locs){ let n=0; try{ n=(S.ex.locations.unlocked||[]).length; }catch(e){} if(n<r.locs) return false; }
  if(r.p0&&int(S.project0.points,0)<r.p0) return false;
  return true;
}
function TY_rankReqText(i){
  const r=TY_RANKS[i].req, b=[];
  if(r.rep) b.push(r.rep+' rep');
  if(r.rev) b.push(fmt$(r.rev)+' earned');
  if(r.crosses) b.push(r.crosses+' crosses');
  if(r.locs) b.push(r.locs+' territories');
  if(r.p0) b.push(r.p0+' P0 pts');
  return b.join(' • ')||'—';
}
function TY_rankBonus(){ /* cumulative sale bonus from ranks */
  const i=TY_rankIdx();
  let b=0;
  if(i>=2) b+=0.05;
  if(i>=8) b+=0.05;
  return b;
}
function TY_checkRank(){
  if(!S.ty) return;
  let cur=TY_rankIdx(), up=false;
  while(cur<TY_RANKS.length-1&&TY_rankReqMet(cur+1)){ cur++; up=true; }
  if(!up||cur===int(S.ty.rankSeen,0)&&cur===int(S.ty.rank,0)) { S.ty.rank=cur; return; }
  S.ty.rank=cur;
  if(cur>int(S.ty.rankSeen,0)){
    S.ty.rankSeen=cur;
    try{ NT_onRankUp(cur); }catch(e){} /* P1.6: rank up -> genetic nudge (read-only) */
    const R=TY_RANKS[cur];
    TY_applyRankUnlock(cur);
    setTimeout(()=>{
      modal('<div class="ge-dp-rankup">'+crownSVG(true,'ge-dp-rankcrown')+
       '<div class="ge-display ge-dp-rankup-title">RANK UP</div>'+
       '<div class="ge-h2 ge-dp-rankup-name">'+esc(R.name)+'</div>'+
       '<div class="ge-card"><div class="ge-card-head"><h3>UNLOCKED</h3></div>'+R.unlocks.map(u=>'<div class="ge-datarow"><span>'+icon('check','ge-ic-sm')+'</span><span>'+esc(u)+'</span></div>').join('')+'</div>'+
       '<button class="ge-btn ge-btn-primary ge-btn-block" onclick="closeModal(this.closest(\'.modal-back\'))">OWN THE SHOW</button></div>');
    },400);
    TY_notify(icon('crown-gold','ge-ic-md')+' <b>RANK UP: '+esc(R.name)+'</b>','good');
    try{ if(typeof WX_addNews==='function'){} }catch(e){}
    TY_addNews('crown','<b>RANK UP:</b> the streets now know you as <b>'+esc(R.name)+'</b>.');
    gainXP(200+cur*60);
  }
}

function TY_applyRankUnlock(i){
  if(i>=3) TY_grantPerk('plugdisc','PLUG DISCOUNT');
  if(i>=4) TY_grantPerk('wholesale','WHOLESALE CONTRACTS');
  if(i>=7) TY_grantPerk('marketing','MARKETING');
}
function TY_rankHTML(){
  const cur=TY_rankIdx(), R=TY_RANKS[cur];
  let h='<div class="ge-card"><div class="ge-card-head"><h3>'+icon('crown-gold','ge-ic-md')+'STREET RANK</h3></div>';
  h+='<div class="ge-dp-rankname ge-display">'+crownSVG(true,'ge-dp-rankcrown')+' '+esc(R.name)+'</div>';
  if(cur<TY_RANKS.length-1){
    h+='<div class="ge-datarow"><span>Next: '+esc(TY_RANKS[cur+1].name)+'</span><b class="ge-muted ge-caption">'+esc(TY_rankReqText(cur+1))+'</b></div>';
  } else h+='<p class="ge-body ge-muted">'+icon('crown-gold','ge-ic-md')+' You are the LEGEND. The empire is yours.</p>';
  h+='<div class="ge-dp-ladder">'+TY_RANKS.map((r,i)=>'<span class="ge-pill '+(i===cur?'ge-pill-gold':i<cur?'ge-pill-optimal':'ge-pill-neutral')+'">'+esc(r.name)+'</span>').join('')+'</div></div>';
  return h;
}

/* ---------------- LIVING MARKET ECONOMY ----------------
   Per-product-type demand + per-strain popularity, driven by real sim factors.
   Multiplies into WX_sellMult via TY_priceFactor. */
const TY_PTYPES=[
 {id:'flower',name:'Flower',ico:'leaf'},
 {id:'premium',name:'Premium Flower',ico:'star'},
 {id:'budget',name:'Budget Flower',ico:'jar'},
 {id:'edible',name:'Edibles',ico:'jar'},
 {id:'conc',name:'Concentrates',ico:'drop'},
 {id:'seedclone',name:'Seeds & Clones',ico:'clone'},
 {id:'wholesale',name:'Wholesale',ico:'empire'}
];
const TY_SEASONS=['SPRING SURGE','SUMMER HEAT','HARVEST SEASON','WINTER DRY'];
function TY_ptypeOf(item){
  const t=item?item.type:'flower';
  if(t==='concentrate') return 'conc';
  if(t==='edible') return 'edible';
  if(item&&item.ptype) return item.ptype; /* finished products */
  const q=num(item?item.quality:70,70);
  if(q>=85) return 'premium';
  if(q<60) return 'budget';
  return 'flower';
}
function TY_typeDem(ptype){
  const t=S.ty&&S.ty.typeDem?S.ty.typeDem[ptype]:null;
  if(t) return t;
  return {demand:'normal',mult:1.0,days:3,why:'Steady trade.'};
}
function TY_strainPop(id){ return clamp(num(S.ty&&S.ty.strainPop?S.ty.strainPop[id]:50,50),0,100); }
/* combined price factor: type demand × strain popularity × season × competitors × rep × events */
function TY_priceFactor(strainId,item){
  try{
    const pt=TY_ptypeOf(item), td=TY_typeDem(pt);
    let m=num(td.mult,1);
    const pop=TY_strainPop(strainId);
    m*=0.85+pop/100*0.45; /* 0.85 – 1.30 */
    const seas=int(S.ty.season,0);
    if(pt==='flower'&&seas===2) m*=1.08;
    if(pt==='edible'&&seas===1) m*=1.10;
    if(pt==='conc'&&seas===3) m*=1.08;
    const compPress=clamp(1-(62-num(S.ty.pShare,62))/400,0.88,1.05);
    m*=compPress;
    m*=TY_repPriceMult();
    if(TY_hasPerk('branding')) m*=1.06;
    if(TY_hasPerk('legendtax')) m*=1.10;
    if(num(S.ty.priceWar,0)>0) m*=0.88;
    m*=1+TY_rankBonus();
    const q=num(item?item.quality:70,70);
    if(q>=95) m*=1.8; else if(q>=90) m*=1.45; else if(q>=80) m*=1.25; else if(q>=70) m*=1.1; else if(q<55) m*=0.75;
    return clamp(m,0.4,4.0);
  }catch(e){ return 1; }
}
function TY_setTypeDem(ptype,demand,why,days){
  const mult={high:1.35,normal:1.0,low:0.75,collector:1.8}[demand]||1.0;
  S.ty.typeDem[ptype]={demand:demand,mult:mult,days:int(days,3),why:String(why||'')};
}
function TY_marketTick(){
  const t=S.ty; if(!t) return;
  t.season=Math.floor(int(S.day,1)/20)%4;
  /* decay type demands */
  Object.keys(t.typeDem).forEach(k=>{
    const e=t.typeDem[k]; e.days=int(e.days,1)-1;
    if(e.days<=0) delete t.typeDem[k];
  });
  /* roll new type demand every few days */
  if(Math.random()<0.4){
    const pt=pick(TY_PTYPES).id, r=Math.random();
    const dem=r<0.5?'normal':r<0.72?'high':r<0.9?'low':'collector';
    const why=TY_demandWhy(pt,dem);
    if(dem==='normal'){ if(t.typeDem[pt]){ delete t.typeDem[pt]; TY_addNews('cash',TY_PTYPES.find(p=>p.id===pt).name+' demand normalized.'); } }
    else { TY_setTypeDem(pt,dem,why,rndi(3,6)); TY_addNews(dem==='low'?'warn':'cash','<b>'+esc(TY_PTYPES.find(p=>p.id===pt).name)+'</b> demand '+dem.toUpperCase()+': '+esc(why)); }
  }
  /* shortage flag */
  if(!t.shortagePtype&&Math.random()<0.06){
    t.shortagePtype=pick(TY_PTYPES).id;
    TY_setTypeDem(t.shortagePtype,'high','Market shortage — shelves are empty.',5);
    TY_addNews('warn','<b>MARKET SHORTAGE:</b> '+esc(TY_PTYPES.find(p=>p.id===t.shortagePtype).name)+' shelves are bare. Prices spiking.');
    TY_notify(icon('chart','ge-ic-md')+' Market shortage: '+esc(TY_PTYPES.find(p=>p.id===t.shortagePtype).name),'warn');
  } else if(t.shortagePtype&&Math.random()<0.25) t.shortagePtype=null;
  /* strain popularity drift */
  try{
    allStrains().forEach(st=>{
      let pop=TY_strainPop(st.id);
      const sg=(S.stats.strainGrown||{})[st.id];
      let target=50;
      if(sg&&sg.best>=90) target=82; else if(sg&&sg.best>=80) target=68; else if(sg&&sg.count>0) target=58;
      if(st.tags&&st.tags.indexOf('Keeper')>=0) target+=8;
      /* trending tags boost */
      if(t.trendTags) t.trendTags.forEach(tag=>{ if(st.tags&&st.tags.indexOf(tag)>=0) target+=14; });
      /* competitor specialty suppresses */
      (t.comps||[]).forEach(c=>{ if(c.active&&c.spec&&st.tags&&st.tags.indexOf(c.spec)>=0) target-=8; });
      target=clamp(target,5,100);
      pop=pop+(target-pop)*0.15+rnd(-2,2);
      t.strainPop[st.id]=clamp(Math.round(pop),0,100);
    });
  }catch(e){}
}

function TY_demandWhy(pt,dem){
  const W={
   high:['Connoisseurs are hunting top-shelf '+pt+'.','A viral review drove buyers to '+pt+'.','Wholesale buyers are stocking '+pt+'.'],
   low:['The market is flooded with '+pt+'.','Buyers shifted to other categories.','Oversupply crushed '+pt+' prices.'],
   collector:['Collectors are paying stupid money for rare '+pt+'.','A private buyer wants the best '+pt+' available.']
  };
  return pick(W[dem]||W.high);
}
function TY_movers(){
  /* top strain popularity movers for the market report */
  const arr=[];
  try{
    allStrains().forEach(st=>{ arr.push({id:st.id,name:st.name,pop:TY_strainPop(st.id),tags:st.tags||[]}); });
  }catch(e){}
  arr.sort((a,b)=>b.pop-a.pop);
  return {hot:arr.slice(0,4),cold:arr.slice(-3).reverse()};
}

/* ---------------- competitors ---------------- */
const TY_COMP_DEFS=[
 {id:'redwood',name:'Redwood Collective',size:'LARGE',spec:'Heavy',quality:72,share:12,loc:'Downtown'},
 {id:'neon',name:'Neon Harvest Co.',size:'MEDIUM',spec:'Exotic',quality:78,share:9,loc:'Metro Market'},
 {id:'ironleaf',name:'Ironleaf Farms',size:'MEDIUM',spec:'Stable',quality:66,share:8,loc:'Industrial District'},
 {id:'velvet',name:'Velvet Canopy',size:'BOUTIQUE',spec:'Frosty',quality:86,share:6,loc:'Luxury District'}
];
function TY_initComps(){
  const t=S.ty; if(!t||t.comps.length) return;
  t.comps=TY_COMP_DEFS.map(c=>({id:c.id,name:c.name,size:c.size,spec:c.spec,quality:c.quality,
    share:c.share,loc:c.loc,active:true,priceAdj:rndi(-5,8)}));
}
function TY_compTick(){
  const t=S.ty; if(!t) return;
  TY_initComps();
  const totalActive=t.comps.filter(c=>c.active).reduce((a,c)=>a+num(c.share,0),0);
  t.pShare=clamp(Math.round(100-totalActive+rnd(-2,2)),5,95);
  /* competitor actions */
  if(Math.random()<0.22){
    const c=pick(t.comps.filter(x=>x.active)); if(!c) return;
    const r=Math.random();
    if(r<0.3){ c.priceAdj=clamp(int(c.priceAdj,0)-rndi(3,8),-15,15);
      TY_addNews('warn','<b>'+esc(c.name)+'</b> slashed prices — pressure on your margins.');
      TY_notify(icon('compete','ge-ic-md')+' '+esc(c.name)+' started a price war','warn',true);
    } else if(r<0.55){ c.share=clamp(num(c.share,0)+rnd(1,3),2,30);
      TY_addNews('warn','<b>'+esc(c.name)+'</b> launched a new '+esc(c.spec.toLowerCase())+' product line.');
    } else if(r<0.7&&t.comps.filter(x=>x.active).length>2){ c.active=false;
      TY_addNews('cash','<b>'+esc(c.name)+'</b> closed a location — market share up for grabs.');
      TY_notify(icon('storefront','ge-ic-md')+' '+esc(c.name)+' closed a store. Move in.','good',true);
    } else { c.quality=clamp(int(c.quality,70)+rndi(-2,3),55,95);
      TY_addNews('warn','<b>'+esc(c.name)+'</b> is pushing quality ('+c.quality+'). Stay sharp.');
    }
  }
  /* closed ones may reopen */
  t.comps.forEach(c=>{ if(!c.active&&Math.random()<0.05){ c.active=true; c.share=rndi(3,8);
    TY_addNews('warn','<b>'+esc(c.name)+'</b> reopened — competition is back.'); } });
}


/* ---------------- daily news ---------------- */
function TY_addNews(ico,text){
  try{
    if(!S.ty) return;
    S.ty.news.unshift({day:int(S.day,1),ico:ico||'news',text:String(text)});
    if(S.ty.news.length>40) S.ty.news.length=40;
  }catch(e){}
}
function TY_newsTick(){
  const t=S.ty; if(!t) return;
  if(int(t.lastNewsDay,0)>=int(S.day,1)) return;
  t.lastNewsDay=int(S.day,1);
  const stories=[];
  /* electricity */
  if(Math.random()<0.25){
    const ch=rndi(-6,10);
    if(ch!==0){
      t.elecPrice=clamp(num(t.elecPrice,1)+ch/100,0.7,1.8);
      stories.push({ico:'warn',text:icon('lighting','ge-ic-md')+' Electricity prices '+(ch>0?'rose':'fell')+' '+Math.abs(ch)+'% — your power bill '+(ch>0?'just got heavier.':'gets a break.')});
    }
  }
  /* trending tags — real demand effect */
  if(Math.random()<0.3){
    const tags=['Frosty','Gassy','Fruit','Purple','Exotic','Skunky','Resin Monster'];
    t.trendTags=[pick(tags),pick(tags)];
    stories.push({ico:'cash',text:icon('grow','ge-ic-md')+' <b>'+esc(t.trendTags[0])+'</b> and <b>'+esc(t.trendTags[1])+'</b> strains are trending — demand rising.'});
  }
  /* wholesale */
  if(Math.random()<0.2){
    const d=pick(['high','low']);
    TY_setTypeDem('wholesale',d,d==='high'?'Distributors are buying heavy.':'Wholesale buyers went quiet.',4);
    stories.push({ico:'cash',text:icon('facility','ge-ic-md')+' Wholesale demand '+d.toUpperCase()+'.'});
  }
  /* weekend */
  const dow=int(S.day,1)%7;
  t.weekendBoost=(dow===5||dow===6)?0.25:0;
  if(t.weekendBoost>0) stories.push({ico:'cash',text:icon('star','ge-ic-md')+' High-demand weekend — retail is buzzing (+25% customer spending).'});
  /* industry */
  if(Math.random()<0.12){
    const b=rndi(4,10);
    TY_gainRep('business',b);
    stories.push({ico:'star',text:icon('trophy','ge-ic-md')+' Industry nod: your operation earned +'+b+' business rep.'});
  }
  stories.slice(0,4).forEach(s=>TY_addNews(s.ico,s.text));
}

function TY_newsHTML(n){
  const t=S.ty;
  if(!t||!t.news.length) return '<div class="ge-empty">'+icon('scroll','ge-ic-xl')+'<h3>QUIET STREETS</h3><p>No news yet. The streets are quiet… for now.</p></div>';
  return t.news.slice(0,n||6).map(x=>'<div class="ge-dp-feedrow"><span class="ge-pill ge-pill-neutral ge-num">D'+x.day+'</span>'+DP_iconSafe(x.ico,'ge-ic-sm')+'<span>'+x.text+'</span></div>').join('');
}


/* ---------------- MARKET REPORT screen ---------------- */
RENDER.market=function(){
  const r=$('market-root'); if(!r) return;
  const mv=TY_movers();
  let html=screenHead('chart','MARKET REPORT');
  html+='<div class="ge-dp-metrics">'+
   DP_metricTile('day',TY_SEASONS[int(S.ty.season,0)],'SEASON','market cycle')+
   DP_metricTile('lighting','×'+num(S.ty.elecPrice,1).toFixed(2),'ELECTRICITY','rate multiplier')+
   DP_metricTile('empire',int(S.ty.pShare,62)+'%','MARKET SHARE','your slice')+
  '</div>';
  html+=DP_sectionTitle('chart','PRODUCT DEMAND');
  html+='<div class="ge-card ge-card-flat ge-dp-demand">';
  TY_PTYPES.forEach(p=>{
    const td=TY_typeDem(p.id);
    html+='<div class="ge-dp-demrow"><span class="ge-dp-demname">'+DP_iconSafe(p.ico,'ge-ic-md')+' '+p.name+'</span>'+
     DP_demPill(p.id)+'<b class="ge-num">×'+num(td.mult,1).toFixed(2)+'</b></div>'+
     (td.why?'<p class="ge-caption ge-muted ge-dp-why">'+esc(td.why)+'</p>':'');
  });
  html+='</div>';
  html+=DP_sectionTitle('temp','STRAIN POPULARITY');
  html+='<div class="ge-card"><div class="ge-card-head"><h3>'+icon('temp','ge-ic-md')+'TRENDING</h3></div>'+
   mv.hot.map(s=>'<div class="ge-progress-meta"><span>'+esc(s.name)+'</span><b class="ge-num">'+s.pop+'/100</b></div><div class="ge-progress ge-progress-thin ge-progress-ok"><i style="width:'+s.pop+'%"></i></div>').join('')+'</div>';
  html+='<div class="ge-card"><div class="ge-card-head"><h3>'+icon('chart','ge-ic-md')+'COOLING OFF</h3></div>'+
   mv.cold.map(s=>'<div class="ge-progress-meta"><span>'+esc(s.name)+'</span><b class="ge-num">'+s.pop+'/100</b></div><div class="ge-progress ge-progress-thin ge-progress-bad"><i style="width:'+s.pop+'%"></i></div>').join('')+'</div>';
  html+=DP_sectionTitle('compete','COMPETITORS');
  (S.ty.comps||[]).forEach(c=>{
    html+='<div class="ge-card ge-card-flat'+(c.active?'':' ge-dp-dim')+'"><div class="ge-card-head"><h3>'+esc(c.name)+'</h3>'+
     (c.active?'<span class="ge-pill ge-pill-optimal">'+int(c.share,0)+'% SHARE</span>':'<span class="ge-pill ge-pill-critical">CLOSED</span>')+'</div>'+
     '<div class="ge-plant-sub ge-muted">'+esc(c.size)+' • '+esc(c.loc)+'</div>'+
     '<div class="ge-plant-sub ge-muted">Specialty: '+esc(c.spec)+' • Quality '+int(c.quality,0)+' • Prices '+(int(c.priceAdj,0)>=0?'+':'')+int(c.priceAdj,0)+'%</div></div>';
  });
  html+=DP_sectionTitle('scroll','LATEST NEWS');
  html+='<div class="ge-card ge-card-flat">'+TY_newsHTML(8)+'</div>';
  r.innerHTML=html;
};

/* ---------------- QUALITY TIERS ----------------
   Budget / Standard / Premium / Top Shelf / Elite / Project 0 Quality */
function TY_tierOf(q){
  q=num(q,0);
  if(q>=95) return {id:'p0',name:'PROJECT 0 QUALITY',cls:'ty-q-p0'};
  if(q>=90) return {id:'elite',name:'ELITE',cls:'ty-q-elite'};
  if(q>=80) return {id:'topshelf',name:'TOP SHELF',cls:'ty-q-top'};
  if(q>=70) return {id:'premium',name:'PREMIUM',cls:'ty-q-prem'};
  if(q>=55) return {id:'standard',name:'STANDARD',cls:'ty-q-std'};
  return {id:'budget',name:'BUDGET',cls:'ty-q-bud'};
}
function TY_tierBadge(q){
  const t=TY_tierOf(q);
  const map={'ty-q-p0':'ge-badge-legendary','ty-q-elite':'ge-badge-legendary','ty-q-top':'ge-badge-elite','ty-q-prem':'ge-badge-gold','ty-q-std':'ge-badge-common','ty-q-bud':'ge-badge-common'};
  return '<span class="ge-badge '+(map[t.cls]||'ge-badge-common')+'">'+t.name+'</span>';
}


/* ---------------- PRODUCTION PIPELINE ----------------
   HARVESTED FLOWER → PROCESSING (days) → FINISHED PRODUCT → PACKAGING → INVENTORY → SALES
   Raw flower always sells directly — the pipeline is optional depth, never a wall. */
const TY_PRODUCTS=[
 {id:'premium',name:'Premium Flower',ico:'star',days:2,inPerOut:1.1,outAmt:1,outUnit:'oz',valMult:1.7,desc:'Slow-cured, hand-trimmed. Connoisseur grade.'},
 {id:'preroll',name:'Pre-Rolls',ico:'leaf',days:1,inPerOut:1,outAmt:12,outUnit:'units',valMult:1.15,desc:'24 pre-rolls. Convenience sells.'},
 {id:'seedpack',name:'Seed Packs',ico:'genetics',days:3,inPerOut:0,outAmt:5,outUnit:'packs',valMult:4.0,from:'keeper',desc:'From keeper genetics. Breeders pay.'},
 {id:'clonepack',name:'Clone Packs',ico:'clone',days:2,inPerOut:0,outAmt:6,outUnit:'packs',valMult:2.6,from:'mother',desc:'Rooted cuts from proven mothers.'}
];
function TY_procCap(){ /* oz-equivalents per day */
  let cap=4+TY_buildingLevelSafe('processing')*3;
  try{ if(typeof EX_employeeBonus==='function') cap+=num(EX_employeeBonus('processor'),0)*0.4; }catch(e){}
  try{ if(typeof P3W5_processBoost==='function') cap+=num(P3W5_processBoost(),0)*0.4; }catch(e){} /* P3-W5: trimmer + processing tech capacity */
  (S.ty.locFac?Object.keys(S.ty.locFac):[]).forEach(l=>{ cap+=int(S.ty.locFac[l].proc,0)*8; });
  if(TY_rankIdx()>=10) cap*=2;
  return Math.max(2,Math.round(cap));
}
function TY_buildingLevelSafe(id){ try{ return (typeof EX_buildingLevel==='function')?EX_buildingLevel(id):1; }catch(e){ return 1; } }
/* GE-329 follow-up: keeper/mother production runs price off the ACTUAL source genetics, not fixed
   88/85 constants. Mothers fall back to their keeper; pre-fix keepers (no potency tracked) fall back
   to the historical 88:85 quality:potency ratio so old saves keep parity. */
function TY_srcStats(src){
  const dflt={q:75,p:75,t:85,r:85,b:85};
  if(!src||typeof src!=='object') return dflt;
  let k=null;
  if(src.keeperId){ try{ k=(S.keepers||[]).find(x=>x.id===src.keeperId)||null; }catch(e){ k=null; } }
  const pick=function(){
    for(let i=0;i<arguments.length;i++){ const v=num(arguments[i],0); if(v>0) return Math.round(v); }
    return 0;
  };
  let q=pick(src.avgQuality,src.bestQuality,src.bestQ);
  if(!q&&src.qualities&&src.qualities.length){
    q=Math.round(src.qualities.reduce(function(a,b){ return a+num(b,0); },0)/src.qualities.length);
  }
  if(!q&&k) q=pick(k.avgQuality,k.bestQuality,k.overall);
  let p=pick(src.avgPotency,src.bestPotency);
  if(!p&&k) p=pick(k.avgPotency,k.bestPotency);
  if(!p&&q) p=Math.round(q*85/88);
  const t=pick(src.avgTerpenes,src.bestTerpenes)||(k?pick(k.avgTerpenes,k.bestTerpenes):0)||85;
  const r=pick(src.avgResin,src.bestResin)||(k?pick(k.avgResin,k.bestResin):0)||85;
  const b=pick(src.avgBagAppeal,src.bestBagAppeal)||(k?pick(k.avgBagAppeal,k.bestBagAppeal):0)||85;
  return {q:q||75,p:p||75,t:t,r:r,b:b};
}
function TY_startProcess(invId,ptypeId){
  const pt=TY_PRODUCTS.find(p=>p.id===ptypeId); if(!pt) return;
  if(pt.from==='keeper'&&!(S.keepers&&S.keepers.length)){ toast(icon('x','ge-ic-md')+' Need a keeper first.'); return; }
  if(pt.from==='mother'&&!(S.mothers&&S.mothers.length)){ toast(icon('x','ge-ic-md')+' Need a mother plant first.'); return; }
  let src=null, ozIn=0, st=null, gsrc=null;
  if(pt.from){
    gsrc=pt.from==='keeper'?S.keepers[0]:S.mothers[0];
    st=getStrain(gsrc.strainId);
    ozIn=0; /* GE-329 follow-up: keeper/mother runs consume no flower — ozIn was a phantom input doubling the output */
  } else {
    const it=S.inventory.find(x=>x.id===invId); if(!it||it.type!=='flower'){ toast(icon('x','ge-ic-md')+' Need flower in inventory.'); return; }
    if(it.amount<2){ toast(icon('x','ge-ic-md')+' Need at least 2 oz.'); return; }
    src=it; ozIn=2; st=getStrain(it.strainId);
  }
  const active=S.ty.proc.length;
  const cap=TY_procCap();
  if(active>=Math.max(1,Math.floor(cap/2))){ toast(icon('x','ge-ic-md')+' Processing queue full — upgrade the lab.'); return; }
  const gs=TY_srcStats(gsrc); /* actual keeper/mother genetics; null-safe defaults on the flower path */
  const fee=pt.from?TY_fromFee(pt,gs.q,gs.p):Math.round(15*ozIn*(pt.days));
  if(S.cash<fee){ toast(icon('x','ge-ic-md')+' Need '+fmt$(fee)+' processing fee.'); return; }
  S.cash-=fee; TY_exp('processing',fee);
  if(src){ src.amount=Math.round((src.amount-ozIn)*10)/10; if(src.amount<=0) S.inventory=S.inventory.filter(x=>x.id!==src.id); }
  let days=pt.days;
  if(TY_hasPerk('labauto')&&pt.id==='premium') days=Math.max(1,days-1);
  try{ if(typeof P3W5_trimDays==='function') days=Math.max(1,days-num(P3W5_trimDays(),0)); }catch(e){} /* P3-W5: trimmer speeds processing */
  const eff=0.85+TY_buildingLevelSafe('processing')*0.04+num((typeof EX_employeeBonus==='function'?EX_employeeBonus('processor'):0),0)*0.004
    +num((typeof P3W5_processBoost==='function'?P3W5_processBoost():0),0)*0.004; /* P3-W5: trimmer + processing tech output */
  const qBonus=TY_buildingLevelSafe('processing')*1.5;
  S.ty.proc.push({id:S.ty.nextProcId++,strainId:st?st.id:'unknown',strainName:st?st.name:'Unknown',
    ptype:pt.id,ozIn:ozIn,daysLeft:days,daysTotal:days,eff:clamp(eff,0.8,1.4),qBonus:qBonus,
    baseQ:src?num(src.quality,70):gs.q,basePot:src?num(src.potency,70):gs.p,baseTerp:src?num(src.terpenes,70):gs.t,
    baseResin:src?num(src.resin,70):gs.r,baseBag:src?num(src.bagAppeal,70):gs.b,custom:st?!!st.custom:false});
  TY_notify(icon('flask','ge-ic-md')+' Processing started: '+esc(pt.name)+' ('+days+'d)','info',true);
  save(); updateHUD(); if(current==='production') RENDER.production();
}

function TY_procTick(){
  const t=S.ty; if(!t||!t.proc.length) return;
  const done=[];
  t.proc.forEach(j=>{
    j.daysLeft=int(j.daysLeft,1)-1;
    if(j.daysLeft<=0) done.push(j);
  });
  t.proc=t.proc.filter(j=>j.daysLeft>0);
  done.forEach(j=>{
    const pt=TY_PRODUCTS.find(p=>p.id===j.ptype);
    /* GE-329 follow-up: from-gated runs consume no flower — output is exactly outAmt packs, never ozIn×outAmt */
    const outAmt=pt.from?num(pt.outAmt,1):Math.round(j.ozIn*pt.outAmt/(pt.inPerOut||1)*10)/10;
    const q=clamp(Math.round(j.baseQ+j.qBonus),5,100);
    t.prod.push({id:t.nextProdId++,strainId:j.strainId,strainName:j.strainName,ptype:pt.id,
      pname:pt.name,amount:outAmt,unit:pt.outUnit,quality:q,
      potency:clamp(Math.round(j.basePot+j.qBonus/2),5,100),terpenes:clamp(Math.round(j.baseTerp+j.qBonus/2),5,100),
      resin:clamp(Math.round(j.baseResin+j.qBonus/2),5,100),bagAppeal:clamp(Math.round(j.baseBag+j.qBonus/2),5,100),
      custom:!!j.custom,valMult:pt.valMult,packaged:false});
    t.stats.products=int(t.stats.products,0)+1;
    TY_gainRep('business',2);
    TY_notify(icon('check','ge-ic-md')+' <b>'+esc(pt.name)+'</b> ready: '+outAmt+' '+pt.outUnit+' of '+esc(j.strainName),'good');
  });
}

function TY_packageProd(pid){
  const p=S.ty.prod.find(x=>x.id===pid); if(!p||p.packaged) return;
  const cost=Math.ceil(p.amount*1.5);
  if(S.cash<cost){ toast(icon('x','ge-ic-md')+' Need '+fmt$(cost)+' packaging.'); return; }
  S.cash-=cost; TY_exp('packaging',cost); p.packaged=true;
  toast(icon('box','ge-ic-md')+' Packaged '+esc(p.pname)+'. Ready to sell.');
  save(); updateHUD(); if(current==='production') RENDER.production();
}

function TY_prodPrice(p){
  const D=typeof DIFFS!=='undefined'?DIFFS[S.difficulty]:{econMult:1};
  const base=p.quality*2.4+p.potency*0.9;
  const perOz=Math.max(3,base*(D.econMult||1));
  /* GE-D: rep multiplier removed here — it already applies once at sale time inside
     TY_priceFactor (via WX_sellMult). Keeping it here squared it (up to 1.39x at max rep). */
  /* GE-329 follow-up: per-UNIT price is the per-oz price divided by units-per-oz (outAmt).
     valMult is then the pure value-add premium. Premium Flower (outAmt 1, unit oz) is unchanged. */
  const pt=typeof TY_PRODUCTS!=='undefined'?TY_PRODUCTS.find(x=>x.id===p.ptype):null;
  const perUnit=perOz/Math.max(1,pt?num(pt.outAmt,1):1);
  return perUnit*num(p.valMult,1)*(p.packaged?1.15:0.8);
}
/* GE-329 follow-up: keeper/mother runs consume no flower, so the batch fee is a fixed share of the
   expected packaged output value — a real marginal cost that scales with genetics and can never
   be a zero-cost printer. */
function TY_fromFee(pt,q,p){
  const fake={quality:q,potency:p,valMult:pt.valMult,ptype:pt.id,packaged:true};
  const gross=num(pt.outAmt,1)*TY_prodPrice(fake);
  return Math.max(60,Math.round(gross*0.35));
}
function TY_prodBuyerModal(pid){
  const p=S.ty.prod.find(x=>x.id===pid); if(!p) return;
  if(!p.packaged){ toast(icon('box','ge-ic-md')+' Package it first.'); return; }
  const base=TY_prodPrice(p)*p.amount;
  let html='<h3 class="ge-h2">'+icon('sell','ge-ic-lg')+'SELL '+esc(p.pname).toUpperCase()+'</h3>'+
   '<p class="ge-body ge-muted">'+esc(p.strainName)+' • Q'+p.quality+' • '+p.amount+' '+p.unit+' • base '+fmt$(base)+'</p><div class="ge-dp-buyers">';
  BUYERS.forEach(by=>{
    const item={quality:p.quality,potency:p.potency,terpenes:p.terpenes,bagAppeal:p.bagAppeal,resin:p.resin,custom:p.custom,type:'flower',ptype:p.ptype};
    const wxm=(typeof WX_sellMult==='function')?WX_sellMult(p.strainId,item,by.id):1;
    const mult=wxm, offer=base*mult;
    html+='<div class="ge-card ge-card-tap ge-dp-buyer" data-buyer="'+by.id+'" role="button" tabindex="0">'+
     '<div class="ge-dp-buyer-face">'+(by.npc?npcPortrait(by.npc,'npc-sm'):icon('cash','ge-ic-xl'))+'</div>'+
     '<div class="ge-plant-meta"><div class="ge-plant-name">'+esc(by.name)+'</div>'+
     '<div class="ge-plant-sub ge-muted">'+esc(by.title)+'</div>'+
     '<div class="ge-dp-offer"><span class="ge-label">OFFER</span><b class="ge-num ge-green">'+fmt$(offer)+'</b><span class="ge-caption ge-muted">×'+mult.toFixed(2)+'</span></div></div></div>';
  });
  html+='</div><button class="ge-btn ge-btn-ghost ge-btn-block" id="pbm-x">'+icon('x','ge-ic-md')+'CANCEL</button>';
  const m=modal(html);
  m.querySelector('#pbm-x').onclick=()=>closeModal(m);
  m.querySelectorAll('[data-buyer]').forEach(c=>c.onclick=()=>{ closeModal(m); TY_sellProduct(pid,c.dataset.buyer); });
}

function TY_sellProduct(pid,buyerId){
  const p=S.ty.prod.find(x=>x.id===pid); if(!p) return;
  if(!(p.amount>0)) return; /* GE-DP-502: tampered product amounts must not reach cash math */
  const by=BUYERS.find(b=>b.id===buyerId)||BUYERS[0];
  const item={quality:p.quality,potency:p.potency,terpenes:p.terpenes,bagAppeal:p.bagAppeal,resin:p.resin,custom:p.custom,type:'flower',ptype:p.ptype};
  const wxm=(typeof WX_sellMult==='function')?WX_sellMult(p.strainId,item,by.id):1;
  const total=TY_prodPrice(p)*p.amount*wxm;
  if(!Number.isFinite(total)||total<0) return; /* GE-DP-502 */
  const ntPreSale=(typeof NT_affordSig==='function')?NT_affordSig():'';
  S.cash+=total; S.stats.lifetimeRevenue+=total; S.stats.sales++;
  try{ NT_onSale(total,ntPreSale); }catch(e){} /* P1.6: big sale -> upgrade nudge (read-only) */
  if(p.ptype==='seedpack'||p.ptype==='clonepack') S.ty.stats.wholesale=int(S.ty.stats.wholesale,0)+1;
  TY_gainRep('business',3); TY_gainRep('service',1);
  S.ty.topStrainRev=Math.max(num(S.ty.topStrainRev,0),0);
  if(total>S.ty.topStrainRev){ S.ty.topStrainRev=total; S.ty.topStrain=p.strainName; }
  S.ty.prod=S.ty.prod.filter(x=>x.id!==pid);
  TY_notify(icon('cash','ge-ic-md')+' Sold <b>'+esc(p.pname)+'</b> to '+esc(by.name)+' for <b>'+fmt$(total)+'</b>','good');
  save(); updateHUD(); checkMissions();
  try{ if(typeof checkAchievements==='function') checkAchievements(); }catch(e){}
  if(current==='production') RENDER.production();
}

function TY_prodBanner(){
  const n=S.ty.proc.length+S.ty.prod.length;
  if(!n) return '';
  return '<div class="ge-card ge-card-hot ge-dp-banner"><div class="ge-spread"><span>'+icon('flask','ge-ic-md')+' <b>PRODUCTION</b> <span class="ge-muted">— '+n+' batch'+(n===1?'':'es')+' active</span></span>'+
   '<button class="ge-btn ge-btn-ghost" onclick="show(\'production\')">OPEN PRODUCTION</button></div></div>';
}

RENDER.production=function(){
  const r=$('production-root'); if(!r) return;
  let html=screenHead('flask','PRODUCTION PIPELINE');
  html+='<div class="ge-card ge-card-flat"><p class="ge-body ge-muted">HARVESTED FLOWER → <b>PROCESSING</b> → FINISHED PRODUCT → <b>PACKAGING</b> → SALES. Capacity: <b>'+TY_procCap()+' oz/day</b>. Raw flower always sells as-is — this is for margins.</p></div>';
  html+='<div class="ge-dp-pipeline">'+['HARVESTED FLOWER','PROCESSING','FINISHED PRODUCT','PACKAGING','SALES'].map((s,i)=>'<span class="ge-pill '+(i%2?'ge-pill-optimal':'ge-pill-neutral')+'">'+s+'</span>').join('<span class="ge-dp-arrow" aria-hidden="true">→</span>')+'</div>';
  html+=DP_sectionTitle('flask','START A BATCH');
  TY_PRODUCTS.forEach(pt=>{
    const need=pt.from==='keeper'?'keeper':pt.from==='mother'?'mother':'2 oz flower';
    html+='<div class="ge-card"><div class="ge-card-head"><h3>'+DP_iconSafe(pt.ico,'ge-ic-md')+' '+esc(pt.name)+'</h3><span class="ge-caption ge-muted ge-num">'+pt.days+'d • '+esc(need)+'</span></div>'+
     '<p class="ge-body ge-muted">'+esc(pt.desc)+' Output ×'+pt.valMult+' value.</p>'+
     '<button class="ge-btn ge-btn-gold" data-ty-proc="'+pt.id+'">START BATCH</button></div>';
  });
  if(S.ty.proc.length){
    html+=DP_sectionTitle('clock','IN PROCESS','<span class="ge-num">'+S.ty.proc.length+'</span>');
    S.ty.proc.forEach(j=>{
      const pt=TY_PRODUCTS.find(p=>p.id===j.ptype);
      const pct=Math.round((1-j.daysLeft/j.daysTotal)*100);
      html+='<div class="ge-card ge-card-flat"><div class="ge-card-head"><h3>'+icon('flask','ge-ic-md')+' '+esc(pt.name)+'<span class="ge-muted"> — '+esc(j.strainName)+'</span></h3><b class="ge-num">'+j.daysLeft+'d left</b></div>'+
       '<div class="ge-progress"><i style="width:'+pct+'%"></i></div></div>';
    });
  }
  if(S.ty.prod.length){
    html+=DP_sectionTitle('box','FINISHED PRODUCT');
    S.ty.prod.forEach(p=>{
      html+='<div class="ge-card ge-card-hot ge-dp-product"><div class="ge-card-head"><h3>'+esc(p.pname)+'</h3>'+DP_gradeBadge(p.quality)+'</div>'+
       '<div class="ge-datarow"><span>'+esc(p.strainName)+'</span><b class="ge-num">'+p.amount+' '+p.unit+'</b></div>'+
       '<div class="ge-datarow"><span>'+icon('cash','ge-ic-sm')+' Est. value</span><b class="ge-num ge-green">'+fmt$(TY_prodPrice(p)*p.amount)+'</b></div>'+
       '<div class="ge-btn-row">'+(p.packaged?'<button class="ge-btn ge-btn-primary" data-ty-sellp="'+p.id+'">'+icon('sell','ge-ic-md')+'SELL</button>':'<button class="ge-btn ge-btn-gold" data-ty-pack="'+p.id+'">'+icon('box','ge-ic-md')+'PACKAGE</button>')+'</div></div>';
    });
  } else if(!S.ty.proc.length){
    html+='<div class="ge-empty">'+icon('flask','ge-ic-xl')+'<h3>NO BATCHES YET</h3><p>Harvest flower, then start a batch above.</p></div>';
  }
  r.innerHTML=html;
  r.querySelectorAll('[data-ty-proc]').forEach(b=>b.onclick=()=>TY_procPick(b.dataset.tyProc));
  r.querySelectorAll('[data-ty-pack]').forEach(b=>b.onclick=()=>TY_packageProd(+b.dataset.tyPack));
  r.querySelectorAll('[data-ty-sellp]').forEach(b=>b.onclick=()=>TY_prodBuyerModal(+b.dataset.tySellp));
};

function TY_procPick(ptypeId){
  const pt=TY_PRODUCTS.find(p=>p.id===ptypeId);
  if(pt.from){ TY_startProcess(null,ptypeId); return; }
  const items=S.inventory.filter(i=>i.type==='flower'&&i.amount>=2);
  if(!items.length){ toast(icon('x','ge-ic-md')+' Need 2+ oz of flower.'); return; }
  let html='<h3 class="ge-h2">'+icon('flask','ge-ic-lg')+'SELECT FLOWER — '+esc(pt.name)+'</h3><div class="ge-dp-buyers">';
  items.forEach(it=>{
    html+='<div class="ge-card ge-card-tap ge-dp-buyer" data-src="'+it.id+'" role="button" tabindex="0"><div class="ge-plant-meta"><div class="ge-plant-name">'+esc(it.strainName)+' '+DP_gradeBadge(it.quality)+'</div>'+
     '<div class="ge-plant-sub ge-muted">'+it.amount+' oz available</div></div></div>';
  });
  html+='</div><button class="ge-btn ge-btn-ghost ge-btn-block" id="pp-x">CANCEL</button>';
  const m=modal(html);
  m.querySelector('#pp-x').onclick=()=>closeModal(m);
  m.querySelectorAll('[data-src]').forEach(c=>c.onclick=()=>{ closeModal(m); TY_startProcess(+c.dataset.src,ptypeId); });
}


/* ---------------- WORKING DISPENSARY: customer sim ---------------- */
const TY_CUST_TYPES=[
 /* P3-W5: pref = taste archetype driving trait-based selection (selection only — never price).
    budget=bargain hunter, potency=THC chaser, terpene=flavor hunter, indica/sativa=effect buyer,
    collector=rare-genetics hunter, medical=relief buyer, connoisseur=terps+quality over raw potency. */
 {id:'casual',name:'Casual',wt:30,budget:[40,120],qualExp:55,priceSens:0.7,loyal:0.2,pref:'sativa'},
 {id:'medical',name:'Medical',wt:15,budget:[60,160],qualExp:65,priceSens:0.4,loyal:0.5,pref:'medical'},
 {id:'conn',name:'Connoisseur',wt:12,budget:[120,320],qualExp:85,priceSens:0.25,loyal:0.4,pref:'connoisseur'},
 {id:'bulk',name:'Bulk Buyer',wt:8,budget:[300,800],qualExp:60,priceSens:0.8,loyal:0.3,pref:'collector'},
 {id:'tourist',name:'Tourist',wt:14,budget:[50,140],qualExp:60,priceSens:0.6,loyal:0.05,pref:'terpene'},
 {id:'regular',name:'Regular',wt:12,budget:[60,180],qualExp:65,priceSens:0.5,loyal:0.8,pref:'indica'},
 {id:'premium',name:'Premium',wt:6,budget:[200,500],qualExp:90,priceSens:0.15,loyal:0.5,pref:'potency'},
 {id:'budget',name:'Budget',wt:13,budget:[25,70],qualExp:50,priceSens:0.95,loyal:0.15,pref:'budget'}
];
function TY_custCount(){
  let n=6+TY_buildingLevelSafe('dispensary')*4;
  try{ n+=Math.round(num((typeof EX_employeeBonus==='function'?EX_employeeBonus('budtender'):0),0)*0.5); }catch(e){}
  try{ if(typeof P3W5_retailDrawBonus==='function') n+=P3W5_retailDrawBonus(); }catch(e){} /* P3-W5: Business Rep unlock */
  if(TY_hasPerk('marketing')) n+=Math.round(n*0.25);
  n+=Math.round(TY_repCat('service')/25)+Math.round(TY_repCat('quality')/40);
  Object.keys(S.ty.locFac||{}).forEach(l=>{ n+=int(S.ty.locFac[l].disp,0)*5; });
  const compCut=clamp((62-num(S.ty.pShare,62))/10,0,6);
  n=Math.max(2,Math.round(n-compCut));
  return n;
}
function TY_makeCustomer(){
  const types=[]; TY_CUST_TYPES.forEach(t=>{ for(let i=0;i<t.wt;i++) types.push(t); });
  const t=pick(types);
  const strains=[]; try{ allStrains().forEach(s=>strains.push(s)); }catch(e){}
  return {
    type:t.id,typeName:t.name,
    budget:Math.round(rnd(t.budget[0],t.budget[1])*(1+TY_rankIdx()*0.06)*(1+num(S.ty.weekendBoost,0))),
    qualExp:t.qualExp+rndi(-8,8), priceSens:t.priceSens, loyal:t.loyal,
    pref:(typeof P3W5_custPref==='function'?P3W5_custPref(t):(t.pref||'balanced')), /* P3-W5: taste archetype */
    prefPtype:pick(['flower','flower','premium','edible','conc','preroll']),
    favStrain:strains.length?pick(strains).id:null,
    regular:Math.random()<t.loyal*0.3
  };
}
function TY_custTick(){
  const t=S.ty; if(!t) return;
  const st=t.cust.stats;
  const n=TY_custCount();
  let budCap=8+TY_buildingLevelSafe('dispensary')*6;
  try{ if(typeof P3W4_budCapBonus==='function') budCap+=P3W4_budCapBonus(); }catch(e){} /* P3-W4: Cultivation Empire dispensary flagship */
  try{ budCap+=Math.round(num((typeof EX_employeeBonus==='function'?EX_employeeBonus('budtender'):0),0)*0.6); }catch(e){}
  try{ budCap+=Math.round(num((typeof EX_employeeBonus==='function'?EX_employeeBonus('dispworker'):0),0)*0.6); }catch(e){} /* P3-W5: dispensary worker */
  const served=Math.min(n,budCap);
  let rev=0,sat=0,satN=0,lost=0,sales=0,short=0,repeat=0;
  const log=[];
  /* sellable stock: finished products + flower inventory */
  const stock=[];
  (t.prod||[]).forEach(p=>{ if(p.packaged) stock.push(P3W5_stockEntry({kind:'prod',ref:p,ptype:p.ptype==='preroll'?'preroll':p.ptype,quality:p.quality,price:TY_prodPrice(p),name:p.pname+' — '+p.strainName,strainId:p.strainId})); });
  (S.inventory||[]).forEach(it=>{ if(it.amount>0) stock.push(P3W5_stockEntry({kind:'inv',ref:it,ptype:TY_ptypeOf(it),quality:it.quality,price:pricePerOz(it),name:it.strainName,strainId:it.strainId})); });
  for(let i=0;i<served;i++){
    const c=TY_makeCustomer();
    /* GE-B: stock entries go stale mid-tick — re-check LIVE amount every customer,
       otherwise depleted products keep selling phantom inventory */
    const afford=stock.filter(s=>s.price<=c.budget&&s.quality>=c.qualExp-15&&num(s.ref.amount,0)>0);
    if(!afford.length){ short++; lost++; continue; }
    afford.sort((a,b)=>{
      const sa=P3W5_custScore(c,a), sb=P3W5_custScore(c,b); /* P3-W5: base score + taste preference */
      return sb-sa;
    });
    const pick1=afford[0];
    const avail=num(pick1.ref.amount,0);
    /* GE-B: clamp qty to what actually remains — never sell phantom stock */
    const qty=pick1.kind==='prod'&&pick1.ref.unit==='units'?Math.min(4,Math.floor(avail)):Math.min(1,avail);
    if(qty<=0){ short++; continue; }
    const total=pick1.price*qty;
    if(total>c.budget){ short++; continue; }
    /* complete sale */
    if(pick1.kind==='prod'){ pick1.ref.amount=Math.round((pick1.ref.amount-qty)*10)/10; if(pick1.ref.amount<=0) t.prod=t.prod.filter(x=>x.id!==pick1.ref.id); }
    else { pick1.ref.amount=Math.round((pick1.ref.amount-qty)*10)/10; if(pick1.ref.amount<=0) S.inventory=S.inventory.filter(x=>x.id!==pick1.ref.id); }
    rev+=total; sales++;
    const sScore=clamp(Math.round((pick1.quality-c.qualExp)*1.5+70),0,100);
    sat+=sScore; satN++;
    if(c.regular||Math.random()<c.loyal*0.4){ repeat++; const rk=pick1.strainId; t.cust.regulars[rk]=int(t.cust.regulars[rk],0)+1; }
    if(sScore<45){ lost++; }
    if(log.length<6) log.push({t:c.typeName+' bought '+pick1.name+' — '+fmt$(total),good:sScore>=60});
    /* popularity: great genetics drive demand */
    if(pick1.quality>=85) t.strainPop[pick1.strainId]=clamp(TY_strainPop(pick1.strainId)+2,0,100);
  }
  st.cust+=served; st.repeat+=repeat; st.sat+=sat; st.satN+=satN; st.lost+=lost; st.sales+=sales; st.rev+=rev; st.short+=short;
  t.dayLog=log;
  if(rev>0){
    S.cash+=rev; S.stats.lifetimeRevenue+=rev; S.stats.sales+=sales;
    TY_gainRep('service',Math.round(sales*0.4));
    try{ if(typeof P3W5_onDispensarySales==='function') P3W5_onDispensarySales(rev,sales); }catch(e){} /* P3-W5: sales build Business Rep */
    if(satN&&sat/satN>=75) TY_gainRep('quality',2);
  }
  if(short>served*0.4) TY_notify(icon('box','ge-ic-md')+' Inventory shortages lost you '+short+' customers today','warn',true);
}

function TY_custPanel(){
  const st=S.ty.cust.stats;
  const avgSat=st.satN?Math.round(st.sat/st.satN):0;
  const avgSale=st.sales?Math.round(st.rev/st.sales):0;
  const regs=Object.keys(S.ty.cust.regulars||{}).length;
  let h=DP_sectionTitle('customers','WALK-IN TRAFFIC','<span class="ge-num">'+st.cust+'</span> ALL-TIME');
  h+='<div class="ge-dp-metrics">'+
   DP_metricTile('users',st.cust,'WALKED IN','foot traffic')+
   DP_metricTile('cart',st.sales,'SALES',fmt$(Math.round(st.rev))+' revenue')+
   DP_metricTile('star',avgSat+'%','SATISFACTION','avg score')+
   DP_metricTile('cash',fmt$(avgSale),'AVG SALE','per transaction')+
   DP_metricTile('users',regs,'REGULARS','strains loved')+
   DP_metricTile('warn',st.lost+' / '+st.short,'LOST / SHORT','missed chances')+
  '</div>';
  if(S.ty.dayLog.length){
    h+='<div class="ge-card ge-card-flat"><div class="ge-card-head"><h3>'+icon('scroll','ge-ic-md')+'RECENT</h3></div>'+
     S.ty.dayLog.map(l=>'<div class="ge-dp-feedrow"><span class="ge-dp-dot '+(l.good?'ge-dp-dot-good':'ge-dp-dot-warn')+'"></span><span>'+esc(l.t)+'</span></div>').join('')+'</div>';
  }
  h+='<p class="ge-body ge-muted">Staff budtenders, stock quality inventory, and keep favorites on shelves to build regulars.</p>';
  return h;
}


/* ---------------- REAL EXPENSES ---------------- */
function TY_exp(cat,amt){
  try{ S.ty.fin.exp=num(S.ty.fin.exp,0)+num(amt,0); }catch(e){}
}
function TY_econTick(){
  const t=S.ty; if(!t) return;
  const f=t.fin;
  /* revenue delta (catches ALL sales paths without touching them) */
  const lifeRev=num(S.stats&&S.stats.lifetimeRevenue,0);
  const revToday=Math.max(0,lifeRev-num(f.lastLifeRev,0));
  f.lastLifeRev=lifeRev; f.rev=num(f.rev,0)+revToday;
  /* daily operating expenses */
  let exp=0; const bd=[];
  const rent=20+int(S.facility,0)*60;
  exp+=rent; bd.push(['Rent',rent]);
  const lights=num(S.equipment.lights,1), hvac=num(S.equipment.hvac,1);
  const elec=Math.round((10+lights*8+hvac*6)*num(t.elecPrice,1));
  exp+=elec; bd.push(['Electricity ×'+num(t.elecPrice,1).toFixed(2),elec]);
  let maint=0; try{ Object.keys(S.equipment).forEach(k=>{ maint+=num(S.equipment[k],1)*3; }); }catch(e){}
  exp+=maint; bd.push(['Equipment maintenance',maint]);
  const lic=25*((S.ex&&S.ex.locations&&S.ex.locations.unlocked?S.ex.locations.unlocked.length:1));
  exp+=lic; bd.push(['Licensing',lic]);
  const research=TY_buildingLevelSafe('research')*12;
  exp+=research; bd.push(['Research',research]);
  const wagesEst=TY_payrollSafe(); if(wagesEst>0){ exp+=wagesEst; bd.push(['Wages (staff)',wagesEst]); }
  let ads=0;
  try{ S.ex.employees.forEach(e=>{ if(e.assigned&&e.role==='manager') ads+=0; }); }catch(e){}
  const mkt=TY_hasPerk('marketing')?20:0;
  if(mkt){ exp+=mkt; bd.push(['Advertising',mkt]); t.stats.ads=int(t.stats.ads,0)+1; }
  const procOh=TY_buildingLevelSafe('processing')*10;
  if(t.proc.length){ exp+=procOh; bd.push(['Processing overhead',procOh]); }
  let locUp=0;
  Object.keys(t.locFac||{}).forEach(l=>{ const lf=t.locFac[l]; locUp+=(int(lf.grow,0)+int(lf.disp,0)+int(lf.proc,0)+int(lf.breed,0))*15; });
  if(locUp){ exp+=locUp; bd.push(['Remote facilities',locUp]); }
  f.exp=num(f.exp,0)+exp;
  /* pay; missed payments hurt morale */
  if(S.cash>=exp){ S.cash-=exp; }
  else {
    S.cash=0;
    try{ S.ex.employees.forEach(e=>{ const x=t.empX[e.id]; if(x) x.morale=clamp(num(x.morale,70)-12,0,100); }); }catch(e){}
    TY_notify(icon('cash','ge-ic-md')+' Missed operating payments — crew morale dropped','bad',true);
  }
  f.hist.push({day:int(S.day,1),rev:Math.round(f.rev),exp:Math.round(f.exp),profit:Math.round(f.rev-f.exp),bd:bd});
  if(f.hist.length>60) f.hist.shift();
  f.rev=0; f.exp=0;
  if(f.hist.length&&f.hist[f.hist.length-1].profit<-500) TY_notify(icon('chart','ge-ic-md')+' Bleeding cash: '+fmt$(f.hist[f.hist.length-1].profit)+' yesterday','bad',true);
}

function TY_finSpark(){
  const h=S.ty.fin.hist.slice(-20);
  if(h.length<2) return '<p class="ge-body ge-muted">Financial history builds as days pass.</p>';
  const vals=h.map(x=>x.profit), mx=Math.max(...vals,1), mn=Math.min(...vals,0);
  const W=260,H=54;
  const pts=vals.map((v,i)=>{
    const x=8+i*(W-16)/Math.max(1,vals.length-1);
    const y=H-8-((v-mn)/Math.max(1,mx-mn))*(H-16);
    return x.toFixed(1)+','+y.toFixed(1);
  });
  const pos=vals[vals.length-1]>=0;
  /* green = profit / red = loss (semantic) */
  return '<svg class="ge-spark" viewBox="0 0 '+W+' '+H+'"><polyline points="'+pts.join(' ')+'" fill="none" style="stroke:'+(pos?'var(--ge-green)':'var(--ge-red)')+'" stroke-width="2.5"/></svg>';
}

function TY_finHTML(){
  const h=S.ty.fin.hist, last=h[h.length-1];
  let s='<div class="ge-card"><div class="ge-card-head"><h3>'+icon('cash','ge-ic-md')+'DAILY LEDGER</h3></div>';
  if(last){
    const p=last.profit;
    s+='<div class="ge-datarow"><span>Revenue</span><b class="ge-num ge-green">+'+fmt$(last.rev)+'</b></div>'+
     '<div class="ge-datarow"><span>Expenses</span><b class="ge-num ge-red">−'+fmt$(last.exp)+'</b></div>'+
     '<div class="ge-datarow"><span>Profit</span><b class="ge-num '+(p>=0?'ge-green':'ge-red')+'">'+(p>=0?'+':'')+fmt$(p)+'</b></div>';
    s+=DP_sectionTitle('scroll','BREAKDOWN')+last.bd.map(b=>'<div class="ge-datarow"><span class="ge-muted">'+esc(b[0])+'</span><b class="ge-num">'+fmt$(b[1])+'</b></div>').join('');
  } else s+='<div class="ge-empty">'+icon('cash','ge-ic-xl')+'<h3>BOOKS CLOSED</h3><p>Advance a day to open the books.</p></div>';
  s+=DP_sectionTitle('chart','PROFIT TREND')+TY_finSpark()+'</div>';
  return s;
}

/* ---------------- DEEP GENETICS: 13-trait profile ---------------- */
const TY_GTRAITS=[
 {id:'potency',name:'Potency'},{id:'yield',name:'Yield'},{id:'growthSpeed',name:'Growth Speed'},
 {id:'terpene',name:'Terpene Strength'},{id:'flavor',name:'Flavor'},{id:'bagAppeal',name:'Bag Appeal'},
 {id:'structure',name:'Structure'},{id:'stretch',name:'Stretch'},{id:'stressTol',name:'Stress Tolerance'},
 {id:'diseaseRes',name:'Disease Resistance'},{id:'resin',name:'Resin Production'},{id:'stability',name:'Stability'},
 {id:'breedingValue',name:'Breeding Value'}
];
function TY_genProfile(st){
  if(!st) return null;
  const g=k=>clamp(Math.round(num(st[k],50)),5,100);
  const h=sHash('gt|'+st.id); const hv=()=>(h%37);
  const p={
    potency:g('pot'), yield:g('yld'), growthSpeed:g('vigor'),
    terpene:g('terp'), flavor:clamp(Math.round(g('terp')*0.85+g('yld')*0.15),5,100),
    bagAppeal:clamp(Math.round(g('resin')*0.6+g('terp')*0.4),5,100),
    structure:clamp(Math.round(g('stab')*0.7+g('vigor')*0.3),5,100),
    stretch:clamp(Math.round(58+((h>>3)%29)-14+(st.tags&&st.tags.indexOf('Heavy')>=0?-12:0)),5,100),
    stressTol:g('vigor'), diseaseRes:g('stab'), resin:g('resin'), stability:g('stab'),
    breedingValue:clamp(Math.round((g('pot')+g('terp')+g('resin')+g('stab'))/4),5,100)
  };
  return p;
}
function TY_genProfileHTML(st){
  const p=TY_genProfile(st); if(!p) return '';
  let h='<div class="ge-card"><div class="ge-card-head"><h3>'+icon('genetics','ge-ic-md')+'GENETIC PROFILE</h3></div>';
  TY_GTRAITS.forEach(t=>{
    const v=p[t.id];
    h+='<div class="ge-progress-meta"><span>'+t.name+'</span><b class="ge-num">'+v+'</b></div><div class="ge-progress"><i style="width:'+v+'%"></i></div>';
  });
  h+='</div>';
  return h;
}


/* ---------------- ADVANCED BREEDING: generations + stabilization + library ---------------- */
function TY_genLabelOf(cross,A,B){
  A=A||{}; B=B||{};
  if(A.id&&A.id===B.id) return {label:'S1',num:1};
  let lin=null;
  try{ lin=S.gx&&S.gx.lineage; }catch(e){}
  const isChild=(c,p)=>lin&&lin[c]&&(lin[c].a===p||lin[c].b===p);
  if((A.id&&isChild(A.id,B.id))||(B.id&&isChild(B.id,A.id))){
    const child=A.id&&isChild(A.id,B.id)?A:B; /* P1.0: BX number counts the child line's own backcrosses */
    const cm=TY_parentGenNum(child.id);
    return {label:'BX'+(cm.bx+1),num:cm.n+1};
  }
  const n=Math.max(TY_parentGenNum(A.id).n,TY_parentGenNum(B.id).n)+1;
  return {label:'F'+Math.min(n,5),num:n};
}
function TY_parentGenNum(id){
  try{
    const m=S.gx&&S.gx.strainMeta?S.gx.strainMeta[id]:null;
    if(m&&m.genLabel){ const mt=m.genLabel.match(/^(F|BX)(\d+)$/); /* P1.0: parse BX10+ */ if(mt) return {n:int(mt[2],1),bx:mt[1]==='BX'?int(mt[2],0):0}; }
    if(m&&m.gen) return {n:int(m.gen,1),bx:0};
  }catch(e){}
  return {n:0,bx:0};
}
function TY_stabOf(id){ try{ return clamp(num(S.ty.stab[id],50),0,100); }catch(e){ return 50; } }
function TY_crossHook(cross,A,B){
  try{
    const gl=TY_genLabelOf(cross,A,B);
    cross.genLabel=gl.label; cross.genNum=gl.num; cross.generation=gl.label; /* P1.0: strain detail reads st.generation */
    const sa=TY_stabOf(A.id), sb=TY_stabOf(B.id);
    let stab=Math.round((sa+sb)/2*0.75+25+rnd(-6,6));
    /* keeper-selected parents stabilize the line */
    let keeperBonus=0;
    try{ if((S.keepers||[]).some(k=>k.strainId===A.id)) keeperBonus+=8; }catch(e){}
    try{ if((S.keepers||[]).some(k=>k.strainId===B.id)) keeperBonus+=8; }catch(e){}
    stab=clamp(stab+keeperBonus,5,100);
    S.ty.stab[cross.id]=stab;
    cross.stabilityScore=stab;
    cross.history.push({day:int(S.day,1),event:'Generation '+gl.label,detail:'Stability '+stab+'%'});
    if(!S.gx.strainMeta[cross.id]) S.gx.strainMeta[cross.id]={};
    S.gx.strainMeta[cross.id].genLabel=gl.label; S.gx.strainMeta[cross.id].stability=stab;
    TY_libNote(cross.id,'cross');
    TY_gainRep('genetics',4);
    if(cross.mutation) TY_rareDiscovery(cross,cross.mutation);
    if(stab>=90){
      TY_notify(icon('dna','ge-ic-md')+' <b>STABILIZED LINE:</b> '+esc(cross.name)+' holds at '+stab+'% stability','good');
      addP0('genetics',10); addP0('preservation',6);
      try{ if(typeof EX_checkAch==='function') EX_checkAch(); }catch(e){}
    }
  }catch(e){}
}

function TY_rareDiscovery(cross,mut){
  const kind=mut.kind||mut.id||'mutation';
  const leg=!!mut.legendary;
  TY_notify((leg?icon('crown-gold','ge-ic-md')+' <b>LEGENDARY EXPRESSION DISCOVERED:</b> ':icon('dna','ge-ic-md')+' <b>Rare mutation:</b> ')+esc(String(kind))+' in '+esc(cross.name),leg?'good':'info');
  TY_addNews('genetics',(leg?icon('crown-gold','ge-ic-md')+' <b>LEGENDARY:</b> ':icon('dna','ge-ic-md')+' ')+'A <b>'+esc(String(kind))+'</b> expression surfaced in '+esc(cross.name)+'.');
  try{ S.gx.mutLog.push({day:int(S.day,1),strain:cross.name,kind:String(kind),legendary:leg}); }catch(e){}
  TY_gainRep('genetics',leg?15:5);
  if(leg){ addP0('genetics',12); }
}

/* strain library: every discovered strain/cross/phenotype, documented */
function TY_libNote(strainId,what){
  try{
    if(!S.ty.strainLib[strainId]) S.ty.strainLib[strainId]={firstDay:int(S.day,1),crosses:0,phenos:0,keepers:0,best:0,awards:0};
    const L=S.ty.strainLib[strainId];
    if(what==='cross') L.crosses++;
    if(what==='pheno') L.phenos++;
    if(what==='keeper'){ L.keepers++; addP0('preservation',2); }
    if(what==='doc'){ addP0('knowledge',1); }
  }catch(e){}
}
function TY_libCount(){ try{ return Object.keys(S.ty.strainLib).length; }catch(e){ return 0; } }
function TY_harvestHook(st,quality,oz,p){
  try{
    TY_libNote(st.id,'doc');
    const L=S.ty.strainLib[st.id];
    if(L&&quality>L.best) L.best=Math.round(quality);
    if(quality>=100){ S.ty.stats.perfectQ=int(S.ty.stats.perfectQ,0)+1; TY_notify(icon('star','ge-ic-md')+' <b>PERFECT QUALITY</b> — '+esc(st.name),'good'); }
    TY_gainRep('quality',Math.round(quality/25));
    /* harvest timing + care feed the reliability rep */
    if(p&&num(p.minHealth,0)>=80) TY_gainRep('reliability',2);
  }catch(e){}
}

function TY_keeperHook(report){
  try{
    TY_libNote(report.strainId,'keeper');
    TY_gainRep('genetics',10);
    TY_notify(icon('crown','ge-ic-md')+' Keeper <b>'+esc(report.strainName)+' #'+report.phenoNum+'</b> preserved for Project 0','good',true);
  }catch(e){}
}

function TY_lineageStabHTML(strainId){
  const s=TY_stabOf(strainId);
  return '<div class="ge-progress-meta"><span>'+icon('genetics','ge-ic-sm')+' Line stability</span><b class="ge-num">'+s+'%</b></div>'+
   '<div class="ge-progress"><i style="width:'+s+'%"></i></div>';
}


/* ---------------- EMPLOYEES AS CHARACTERS ---------------- */
const TY_QUIRKS=[
 {id:'nightowl',name:'Night Owl',blurb:'Does their best work after dark.',mod:{yield:6}},
 {id:'perfectionist',name:'Perfectionist',blurb:'Slow but flawless.',mod:{quality:8,speed:-10}},
 {id:'oldhand',name:'Old Hand',blurb:'Seen it all. Plants stay calm.',mod:{stress:-10}},
 {id:'hustler',name:'Hustler',blurb:'Always closing.',mod:{sale:6}},
 {id:'labrat',name:'Lab Rat',blurb:'Lives for the data.',mod:{mutation:15}},
 {id:'green',name:'Green',blurb:'Eager. Still learning.',mod:{mistake:8,xpgain:25}},
 {id:'steady',name:'Steady',blurb:'Never rattled.',mod:{moraleLoss:-50}},
 {id:'shark',name:'Shark',blurb:'Negotiates hard.',mod:{cost:-8}},
 {id:'fixer',name:'Fixer',blurb:'Jury-rigs everything.',mod:{fail:-15}},
 {id:'botanist',name:'Botanist',blurb:'A botanist at heart.',mod:{health:8}},
 {id:'loner',name:'Loner',blurb:'Hates meetings. Works alone.',mod:{moraleFlat:-6}},
 {id:'mentorq',name:'Mentor',blurb:'Lifts the whole crew.',mod:{crewMorale:8}}
];
function TY_quirk(id){ return TY_QUIRKS.find(q=>q.id===id)||null; }
function TY_empX(e){
  if(!S.ty.empX[e.id]){
    S.ty.empX[e.id]={morale:70,loyalty:40,mistakes:0,raises:0,quirk:pick(TY_QUIRKS).id};
  }
  return S.ty.empX[e.id];
}
/* summed personality modifier */
function TY_empMod(key){
  let t=0;
  try{
    (S.ex.employees||[]).forEach(e=>{
      if(!e.assigned) return;
      const x=TY_empX(e), q=TY_quirk(x.quirk);
      if(q&&q.mod[key]) t+=num(q.mod[key],0)*(0.5+num(e.lvl,1)*0.1);
    });
  }catch(e){}
  return t;
}
function TY_staffTick(){
  if(!S.ex||!S.ex.employees||!S.ex.employees.length) return;
  const t=S.ty;
  S.ex.employees.forEach(e=>{
    const x=TY_empX(e), q=TY_quirk(x.quirk);
    /* morale drift */
    let dm=0;
    if(e.assigned) dm+=2; else dm-=3;
    if(q&&q.mod.crewMorale) dm+=0; /* handled globally */
    if(q&&q.mod.moraleFlat) dm+=q.mod.moraleFlat*0.2;
    const crewM=TY_empMod('crewMorale');
    if(crewM) dm+=crewM*0.05;
    x.morale=clamp(num(x.morale,70)+dm+rnd(-2,2),0,100);
    /* loyalty grows with tenure + good morale */
    if(x.morale>60) x.loyalty=clamp(num(x.loyalty,40)+1.5,0,100);
    else if(x.morale<30) x.loyalty=clamp(num(x.loyalty,40)-1,0,100);
    /* mistakes: green staff slip */
    const mChance=0.02+Math.max(0,TY_empMod('mistake'))/100*0.02;
    if(Math.random()<mChance){
      x.mistakes++;
      TY_notify(icon('warn','ge-ic-md')+' <b>'+esc(e.name)+'</b> made a mistake ('+esc(q?q.name:'')+'). Minor setback.','warn',true);
      if(S.plants.length){ const p=pick(S.plants); p.stress=clamp(num(p.stress,0)+6,0,100); }
    }
    /* raise requests on level-up */
    if(e._tyRaisePending){
      e._tyRaisePending=false;
      const amt=Math.round(num(e.salary,10)*0.15);
      TY_raiseModal(e,amt);
    }
    /* promotion at lvl 5 */
    if(int(e.lvl,1)>=5&&!x.promo){
      x.promo=true; e.salary=Math.round(num(e.salary,10)*1.15);
      x.morale=clamp(x.morale+20,0,100);
      TY_notify(icon('star','ge-ic-md')+' <b>'+esc(e.name)+'</b> earned a promotion — Senior '+esc(e.role),'good');
    }
    /* legendary staff */
    if(int(e.lvl,1)>=8&&num(x.loyalty,0)>=80&&!x.legendary){
      x.legendary=true;
      TY_grantPerk('leg_'+e.id,'LEGENDARY STAFF: '+e.name);
      TY_notify(icon('crown-gold','ge-ic-md')+' <b>'+esc(e.name)+'</b> is now LEGENDARY staff — a lifer.','good');
      TY_addNews('crown',icon('crown-gold','ge-ic-md')+' <b>'+esc(e.name)+'</b> became legendary staff. Nobody poaches them now.');
    }
    /* quit check */
    if(x.morale<20&&x.loyalty<30&&Math.random()<0.12){
      S.ex.employees=S.ex.employees.filter(y=>y.id!==e.id);
      delete t.empX[e.id];
      TY_notify(icon('users','ge-ic-md')+' <b>'+esc(e.name)+'</b> quit. Morale was in the gutter.','bad');
      TY_addNews('warn',icon('users','ge-ic-md')+' <b>'+esc(e.name)+'</b> walked out. The crew is shaken.');
    }
  });
}

function TY_raiseModal(e,amt){
  const x=TY_empX(e);
  const m=modal('<h3 class="ge-h2">'+icon('users','ge-ic-lg')+'RAISE REQUEST</h3>'+
   '<div class="ge-card ge-card-flat"><div class="ge-card-head"><h3>'+esc(e.name)+'</h3><span class="ge-caption ge-muted">LVL '+e.lvl+' '+esc(e.role)+'</span></div>'+
   '<p class="ge-body">“I\'ve been putting in work. How about '+fmt$(amt)+'/day more?”</p>'+
   '<div class="ge-datarow"><span>Morale</span><b class="ge-num">'+Math.round(x.morale)+'%</b></div></div>'+
   '<div class="ge-btn-row"><button class="ge-btn ge-btn-primary" id="rz-y">APPROVE</button>'+
   '<button class="ge-btn ge-btn-ghost" id="rz-n">REFUSE</button></div>');
  m.querySelector('#rz-y').onclick=()=>{ e.salary+=amt; x.raises++; x.morale=clamp(x.morale+18,0,100); x.loyalty=clamp(x.loyalty+10,0,100); closeModal(m); toast(icon('cash','ge-ic-md')+' Raise approved.'); save(); };
  m.querySelector('#rz-n').onclick=()=>{ x.morale=clamp(x.morale-15,0,100); closeModal(m); toast(icon('x','ge-ic-md')+' Refused. They\'ll remember that.'); save(); };
}

/* hook level-ups to flag raise requests (called from EX_empLevelCheck wrapper below) */
function TY_empLeveled(e){
  try{
    const x=TY_empX(e);
    x.morale=clamp(num(x.morale,70)+6,0,100);
    if(Math.random()<0.45) e._tyRaisePending=true;
  }catch(e2){}
}
function TY_staffCardHTML(e){
  const x=TY_empX(e), q=TY_quirk(x.quirk);
  return '<div class="ge-datarow"><span>'+icon('users','ge-ic-sm')+' Personality</span><b>'+esc(q?q.name:'—')+'</b></div>'+
   '<p class="ge-body ge-muted">“'+esc(q?q.blurb:'')+'”</p>'+
   '<div class="ge-progress-meta"><span>Morale</span><b class="ge-num">'+Math.round(x.morale)+'%</b></div>'+
   '<div class="ge-progress '+(x.morale>=60?'ge-progress-ok':x.morale>=35?'ge-progress-warn':'ge-progress-bad')+'"><i style="width:'+clamp(x.morale,0,100)+'%"></i></div>'+
   '<div class="ge-progress-meta"><span>Loyalty</span><b class="ge-num">'+Math.round(x.loyalty)+'%</b></div>'+
   '<div class="ge-progress '+(x.loyalty>=60?'ge-progress-ok':x.loyalty>=35?'ge-progress-warn':'ge-progress-bad')+'"><i style="width:'+clamp(x.loyalty,0,100)+'%"></i></div>'+
   (x.legendary?'<p><span class="ge-badge ge-badge-legendary">'+icon('crown-gold','ge-ic-sm')+' LEGENDARY STAFF</span></p>':'')+
   (x.promo?'<p><span class="ge-badge">SENIOR</span></p>':'');
}


/* ---------------- LOCATIONS: buildable facilities ---------------- */
const TY_LOCFAC=[
 {id:'grow',name:'Grow Facility',ico:'grow',desc:'+3% yield empire-wide per level.',max:3,base:8000},
 {id:'disp',name:'Dispensary',ico:'dispensary',desc:'+5 customers/day here per level.',max:3,base:6000},
 {id:'proc',name:'Processing',ico:'feed',desc:'+8 oz/day processing capacity per level.',max:3,base:7000},
 {id:'breed',name:'Breeding Wing',ico:'breeding',desc:'+4% stabilization per level.',max:3,base:9000}
];
function TY_locFac(lid){ 
  if(!S.ty.locFac[lid]) S.ty.locFac[lid]={grow:0,disp:0,proc:0,breed:0};
  return S.ty.locFac[lid];
}
function TY_buildLocFac(lid,fid){
  const lf=TY_locFac(lid), def=TY_LOCFAC.find(f=>f.id===fid);
  const cur=int(lf[fid],0);
  if(cur>=def.max){ toast('Already maxed.'); return; }
  const cost=Math.round(def.base*Math.pow(3.2,cur));
  if(S.cash<cost){ toast(icon('x','ge-ic-md')+' Need '+fmt$(cost)+'.'); return; }
  S.cash-=cost;
  lf[fid]=cur+1;
  TY_exp('expansion',cost);
  TY_notify(icon('empire','ge-ic-md')+' Built <b>'+esc(def.name)+' Lv'+(cur+1)+'</b> in '+esc(TY_locName(lid)),'good');
  save(); updateHUD(); if(current==='locations') RENDER.locations();
}

function TY_locName(lid){
  try{ const l=(typeof EX_LOCATIONS!=='undefined'?EX_LOCATIONS:[]).find(x=>x.id===lid); return l?l.name:lid; }catch(e){ return lid; }
}
function TY_locFacHTML(){
  let h=DP_sectionTitle('pin','TERRITORY FACILITIES');
  let locs=[];
  try{ locs=(S.ex.locations.unlocked||[]); }catch(e){}
  locs.forEach(lid=>{
    const lf=TY_locFac(lid);
    h+='<div class="ge-card"><div class="ge-card-head"><h3>'+icon('empire','ge-ic-md')+esc(TY_locName(lid)).toUpperCase()+'</h3></div>';
    TY_LOCFAC.forEach(def=>{
      const cur=int(lf[def.id],0);
      const cost=cur>=def.max?'MAX':fmt$(Math.round(def.base*Math.pow(3.2,cur)));
      h+='<div class="ge-datarow"><span>'+DP_iconSafe(def.ico,'ge-ic-sm')+' '+def.name+' <span class="ge-muted">Lv'+cur+'/'+def.max+'</span><br><span class="ge-muted ge-caption">'+esc(def.desc)+'</span></span>'+
       (cur>=def.max?'<span class="ge-badge ge-badge-gold">MAX</span>':'<button class="ge-btn ge-btn-sm ge-btn-gold" data-ty-locfac="'+lid+'|'+def.id+'">'+cost+'</button>')+'</div>';
    });
    h+='</div>';
  });
  return h;
}

function TY_wireLocFac(root){
  root.querySelectorAll('[data-ty-locfac]').forEach(b=>b.onclick=()=>{
    const [lid,fid]=b.dataset.tyLocfac.split('|'); TY_buildLocFac(lid,fid);
  });
}

/* ---------------- CULTIVATION DEPTH: VPD / PPFD / roots / airflow ---------------- */
function TY_envVals(){
  const t=num(S.env.temp,76), rh=num(S.env.humidity,52), light=num(S.env.light,80);
  const ppfd=Math.round(light*12);
  /* simplified air VPD (kPa): S.env.temp is °F — Tetens needs °C */
  const tC=(t-32)*5/9;
  const svp=0.6108*Math.exp((17.27*tC)/(tC+237.3));
  const vpd=Math.max(0,svp*(1-rh/100));
  const airflow=int(S.equipment.hvac,1)*20;
  return {ppfd:ppfd,vpd:Math.round(vpd*100)/100,airflow:airflow};
}
function TY_envMod(){
  /* small modifier folded into env score: rewards dialed-in VPD/PPFD, punishes neglect */
  try{
    const v=TY_envVals();
    let m=0;
    if(v.vpd<0.4||v.vpd>1.6) m-=6; else if(v.vpd>=0.8&&v.vpd<=1.2) m+=3;
    if(v.ppfd>1050) m-=4; else if(v.ppfd>=600) m+=2;
    const rq=num(S.ty.rootQ,80);
    if(rq<40) m-=5; else if(rq>75) m+=2;
    return m;
  }catch(e){ return 0; }
}
function TY_rootTick(){
  /* root zone quality drifts with watering discipline */
  try{
    let q=num(S.ty.rootQ,80);
    if(!S.plants.length){ S.ty.rootQ=q; return; }
    let good=0;
    S.plants.forEach(p=>{ if(p.water>=30&&p.water<=80) good++; });
    const ratio=good/S.plants.length;
    q=q+(ratio*100-q)*0.2;
    S.ty.rootQ=clamp(Math.round(q),0,100);
  }catch(e){}
}
function TY_envPanel(){
  try{
    const v=TY_envVals(), rq=clamp(num(S.ty.rootQ,80),0,100);
    return '<div class="ge-dp-metrics">'+
     DP_metricTile('vpd',v.vpd.toFixed(2),'VPD','sweet spot 0.8–1.2 kPa',(v.vpd<0.4||v.vpd>1.6)?'ge-amber':'ge-green')+
     DP_metricTile('lighting',v.ppfd,'PPFD','target 600–1000',v.ppfd>1050?'ge-amber':'ge-green')+
     DP_metricTile('drop',rq+'%','ROOT ZONE','keep water 30–80%',rq<40?'ge-amber':'ge-green')+
     DP_metricTile('hvac',v.airflow,'AIRFLOW','ventilation','ge-green')+
    '</div>'+
    '<p class="ge-body ge-muted">VPD sweet spot 0.8–1.2 kPa. PPFD 600–1000. Keep water 30–80% for happy roots.</p>';
  }catch(e){ return ''; }
}

/* ---------------- 40+ NEW MISSIONS ---------------- */
const TY_MISSIONS=[
 /* CULTIVATION */
 {id:'tyc-roots',cat:'Cultivation',name:'Root Zone',desc:'Keep root quality above 75% (check the grow room).',prog:s=>[(S.plants.length>0&&num(S.ty.rootQ,0)>=75)?1:0,1],reward:{cash:300,xp:120}},
 {id:'tyc-vpd',cat:'Cultivation',name:'Dialed In',desc:'Hold VPD in the 0.8–1.2 sweet spot for a day.',prog:s=>[(()=>{try{if(!S.plants.length)return 0;const v=TY_envVals();return (v.vpd>=0.8&&v.vpd<=1.2)?1:0;}catch(e){return 0;}})(),1],reward:{cash:400,xp:150}},
 {id:'tyc-ppfd',cat:'Cultivation',name:'Light Science',desc:'Run PPFD between 600–1000.',prog:s=>[(()=>{try{if(!S.plants.length)return 0;const v=TY_envVals();return (v.ppfd>=600&&v.ppfd<=1000)?1:0;}catch(e){return 0;}})(),1],reward:{cash:400,xp:150}},
 {id:'tyc-50plants',cat:'Cultivation',name:'Crop Lord',desc:'Start 50 plants (lifetime).',prog:s=>[Math.min(int(s.stats.plantsStarted,0),50),50],reward:{cash:800,xp:300}},
 {id:'tyc-flawless5',cat:'Cultivation',name:'Untouchable',desc:'5 flawless grows.',prog:s=>[Math.min(int(s.stats.flawlessGrows,0),5),5],reward:{cash:1000,xp:400,p0:3}},
 /* GENETICS */
 {id:'tyg-prof',cat:'Genetics',name:'Gene Reader',desc:'Document 10 strains in the strain library.',prog:s=>[Math.min(TY_libCount(),10),10],reward:{cash:500,xp:200,p0:2}},
 {id:'tyg-25lib',cat:'Genetics',name:'Archivist',desc:'Document 25 strains.',prog:s=>[Math.min(TY_libCount(),25),25],reward:{cash:1200,xp:500,p0:4}},
 {id:'tyg-mut',cat:'Genetics',name:'Beautiful Freak',desc:'Roll a mutation in the lab.',prog:s=>[(()=>{try{return S.gx.mutLog.length>0?1:0;}catch(e){return 0;}})(),1],reward:{cash:700,xp:300,p0:3}},
 {id:'tyg-legend',cat:'Genetics',name:'Unicorn Blood',desc:'Discover a LEGENDARY expression.',prog:s=>[Math.min(int(s.stats.legendaryFound,0),1),1],reward:{cash:3000,xp:1200,p0:10}},
 {id:'tyg-stab',cat:'Genetics',name:'Locked In',desc:'Stabilize any line to 90%+.',prog:s=>[(()=>{try{return Object.values(S.ty.stab).some(v=>v>=90)?1:0;}catch(e){return 0;}})(),1],reward:{cash:2000,xp:800,p0:8}},
 {id:'tyg-f3',cat:'Genetics',name:'Third Generation',desc:'Create an F3 (or deeper) cross.',prog:s=>[(()=>{try{return S.customStrains.some(c=>c.genNum>=3)?1:0;}catch(e){return 0;}})(),1],reward:{cash:1500,xp:600,p0:5}},
 {id:'tyg-bx',cat:'Genetics',name:'Backcross Artist',desc:'Create a BX1 cross.',prog:s=>[(()=>{try{return S.customStrains.some(c=>c.genLabel&&c.genLabel.indexOf('BX')===0)?1:0;}catch(e){return 0;}})(),1],reward:{cash:1500,xp:600,p0:5}},
 /* BUSINESS */
 {id:'tyb-brand',cat:'Business',name:'Build Your First Brand',desc:'Reach 100 rep, make 50 products, document 3 strains, earn $10,000 lifetime.',prog:s=>[((TY_repOverall()>=100?1:0)+(int(S.ty.stats.products,0)>=50?1:0)+(TY_libCount()>=3?1:0)+(num(s.stats.lifetimeRevenue,0)>=10000?1:0)),4],reward:{cash:1500,xp:600,unlock:'branding'}},
 {id:'tyb-regional',cat:'Business',name:'Become a Regional Brand',desc:'3 territories, 500 rep, a legendary strain, $250k earned.',prog:s=>[((((S.ex.locations.unlocked||[]).length>=3)?1:0)+(TY_repOverall()>=500?1:0)+(int(s.stats.legendaryFound,0)>=1?1:0)+(num(s.stats.lifetimeRevenue,0)>=250000?1:0)),4],reward:{cash:5000,xp:2000,rep:50}},
 {id:'tyb-profit',cat:'Business',name:'In The Black',desc:'Post a +$5,000 profit day.',prog:s=>[(()=>{try{return S.ty.fin.hist.some(h=>h.profit>=5000)?1:0;}catch(e){return 0;}})(),1],reward:{cash:1200,xp:500}},
 {id:'tyb-million',cat:'Business',name:'Seven Figures',desc:'Earn $1,000,000 lifetime.',prog:s=>[num(s.stats.lifetimeRevenue,0)>=1000000?1:0,1],reward:{cash:5000,xp:2000,rep:40}},
 /* DISPENSARY */
 {id:'tyd-first100',cat:'Dispensary',name:'Grand Opening Energy',desc:'Serve 100 customers.',prog:s=>[Math.min(int(S.ty.cust.stats.cust,0),100),100],reward:{cash:600,xp:250}},
 {id:'tyd-regulars',cat:'Dispensary',name:'Everybody Knows Your Name',desc:'Build 10 regulars.',prog:s=>[Math.min(Object.keys(S.ty.cust.regulars||{}).length,10),10],reward:{cash:900,xp:350}},
 {id:'tyd-sat90',cat:'Dispensary',name:'Five-Star Service',desc:'Hold 90%+ satisfaction.',prog:s=>[(()=>{const st=S.ty.cust.stats;return (st.satN>20&&st.sat/st.satN>=90)?1:0;})(),1],reward:{cash:1200,xp:500,rep:15}},
 {id:'tyd-premium',cat:'Dispensary',name:'Top Shelf Only',desc:'Sell a finished premium product.',prog:s=>[int(S.ty.stats.products,0)>=1?1:0,1],reward:{cash:700,xp:300}},
 /* ECONOMY */
 {id:'tye-hodl',cat:'Economy',name:'Big Day',desc:'Sell $25,000 of product in a single day.',prog:s=>[(()=>{try{return S.ty.fin.hist.some(h=>h.rev>=25000)?1:0;}catch(e){return 0;}})(),1],reward:{cash:800,xp:300}},
 {id:'tye-expense',cat:'Economy',name:'Tight Ship',desc:'Keep a full week profitable.',prog:s=>[(()=>{try{const h=S.ty.fin.hist.slice(-7);return (h.length>=7&&h.every(x=>x.profit>0))?1:0;}catch(e){return 0;}})(),1],reward:{cash:1500,xp:600}},
 {id:'tye-electric',cat:'Economy',name:'Off The Grid Mindset',desc:'Survive an electricity spike week.',prog:s=>[num(S.ty.elecPrice,1)>=1.2?1:0,1],reward:{cash:400,xp:150}},
 /* EMPLOYEES */
 {id:'tyemp-hire',cat:'Employees',name:'First Hire',desc:'Hire your first employee.',prog:s=>[(()=>{try{return S.ex.employees.length>=1?1:0;}catch(e){return 0;}})(),1],reward:{cash:400,xp:150}},
 {id:'tyemp-crew5',cat:'Employees',name:'Full Crew',desc:'Employ 5 staff at once.',prog:s=>[(()=>{try{return S.ex.employees.length>=5?1:0;}catch(e){return 0;}})(),1],reward:{cash:1200,xp:500}},
 {id:'tyemp-legend',cat:'Employees',name:'Ride Or Die',desc:'Develop a LEGENDARY staff member.',prog:s=>[(()=>{try{return Object.values(S.ty.empX).some(x=>x.legendary)?1:0;}catch(e){return 0;}})(),1],reward:{cash:2500,xp:1000,rep:20}},
 {id:'tyemp-promo',cat:'Employees',name:'Corner Office',desc:'Promote someone to Senior.',prog:s=>[(()=>{try{return Object.values(S.ty.empX).some(x=>x.promo)?1:0;}catch(e){return 0;}})(),1],reward:{cash:800,xp:300}},
 /* EXPANSION */
 {id:'tyx-terr2',cat:'Expansion',name:'New Turf',desc:'Unlock a 2nd territory.',prog:s=>[(()=>{try{return (S.ex.locations.unlocked||[]).length>=2?1:0;}catch(e){return 0;}})(),1],reward:{cash:1000,xp:400}},
 {id:'tyx-terr4',cat:'Expansion',name:'Coast To Coast',desc:'Unlock 4 territories.',prog:s=>[(()=>{try{return (S.ex.locations.unlocked||[]).length>=4?1:0;}catch(e){return 0;}})(),1],reward:{cash:3000,xp:1200,rep:30}},
 {id:'tyx-fac5',cat:'Expansion',name:'Five Boroughs',desc:'Build facilities in 5 territories.',prog:s=>[(()=>{try{return Object.keys(S.ty.locFac).filter(k=>{const f=S.ty.locFac[k];return (f.grow+f.disp+f.proc+f.breed)>0;}).length>=5?1:0;}catch(e){return 0;}})(),1],reward:{cash:4000,xp:1500,rep:40}},
 {id:'tyx-proc',cat:'Expansion',name:'Vertical Integration',desc:'Run the full production pipeline (process → package → sell).',prog:s=>[int(S.ty.stats.products,0)>=3?1:0,1],reward:{cash:1500,xp:600}},
 /* PROJECT 0 */
 {id:'typ-preserve',cat:'Project 0',name:'Seed Saver',desc:'Mark 3 keepers for preservation.',prog:s=>[Math.min(int(s.stats.keepersFound,0),3),3],reward:{cash:900,xp:350,p0:6}},
 {id:'typ-diverse',cat:'Project 0',name:'Genetic Diversity',desc:'Document 15 unique strains.',prog:s=>[Math.min(TY_libCount(),15),15],reward:{cash:1200,xp:500,p0:6}},
 {id:'typ-stabline',cat:'Project 0',name:'Preservation Line',desc:'Stabilize a line to 85%+.',prog:s=>[(()=>{try{return Object.values(S.ty.stab).some(v=>v>=85)?1:0;}catch(e){return 0;}})(),1],reward:{cash:1800,xp:700,p0:8}},
 {id:'typ-legend',cat:'Project 0',name:'The Vault Demands Legends',desc:'Preserve a legendary phenotype as keeper.',prog:s=>[(()=>{try{return (S.keepers||[]).some(k=>k.rarity==='legendary')?1:0;}catch(e){return 0;}})(),1],reward:{cash:5000,xp:2000,p0:15}},
 /* BREEDING */
 {id:'tybr-10x',cat:'Breeding',name:'Pollen Chucker',desc:'Create 10 crosses.',prog:s=>[Math.min(int(s.stats.crosses,0),10),10],reward:{cash:800,xp:300,p0:3}},
 {id:'tybr-s1',cat:'Breeding',name:'Self Made',desc:'Create an S1.',prog:s=>[(()=>{try{return S.customStrains.some(c=>c.genLabel==='S1')?1:0;}catch(e){return 0;}})(),1],reward:{cash:1200,xp:500,p0:4}},
 {id:'tybr-pheno20',cat:'Breeding',name:'Pheno Factory',desc:'Test 20 phenotypes.',prog:s=>[Math.min(int(s.stats.phenoTested,0),20),20],reward:{cash:1000,xp:400}},
 /* REPUTATION */
 {id:'tyr-qrep',cat:'Reputation',name:'Quality Speaks',desc:'Reach 200 quality rep.',prog:s=>[Math.min(Math.round(TY_repCat('quality')),200),200],reward:{cash:800,xp:300,rep:10}},
 {id:'tyr-grep',cat:'Reputation',name:'Gene Famous',desc:'Reach 200 genetics rep.',prog:s=>[Math.min(Math.round(TY_repCat('genetics')),200),200],reward:{cash:1000,xp:400,rep:10,gen:['zkittlez']}},
 {id:'tyr-brep',cat:'Reputation',name:'Boardroom',desc:'Reach 200 business rep.',prog:s=>[Math.min(Math.round(TY_repCat('business')),200),200],reward:{cash:1000,xp:400,rep:10}},
 {id:'tyr-playstyle',cat:'Reputation',name:'Known For Something',desc:'Reach 300 in any rep category.',prog:s=>[Math.min(Math.round(Math.max(TY_repCat('quality'),TY_repCat('genetics'),TY_repCat('business'),TY_repCat('service'),TY_repCat('reliability'))),300),300],reward:{cash:1500,xp:600,rep:15}},
 {id:'tyr-rank5',cat:'Reputation',name:'Name Rings Bells',desc:'Reach rank LOCAL BOSS.',prog:s=>[TY_rankIdx()>=5?1:0,1],reward:{cash:2000,xp:800,rep:20}},
 {id:'tyr-rank12',cat:'Reputation',name:'Immortal',desc:'Reach rank LEGEND.',prog:s=>[TY_rankIdx()>=12?1:0,1],reward:{cash:10000,xp:4000,rep:100,p0:20}}
];
/* fix the accidental extra keys on tyr-grep (kept minimal on purpose) */
TY_MISSIONS.forEach(m=>{ if(m.prep!==undefined) delete m.prep; if(m.desc2!==undefined) delete m.desc2; });

/* ---------------- more achievements ---------------- */
const TY_ACHIEVEMENTS=[
 {id:'ty-geneticist',name:'GENETICIST',desc:'Document 50 unique strains.',prog:()=>[Math.min(TY_libCount(),50),50],reward:{cash:2000,xp:1000,p0:6,perk:['mutluck','MUTATION LUCK +5%']}},
 {id:'ty-millionlife',name:'MILLIONAIRE (Lifetime)',desc:'Earn $1,000,000 total.',prog:()=>[num(S.stats.lifetimeRevenue,0)>=1000000?1:0,1],reward:{xp:1500,rep:50,perk:['vaulted','VAULTED — +$500/day passive']}},
 {id:'ty-perfect',name:'PERFECTIONIST',desc:'Harvest at 100 quality.',prog:()=>[int(S.ty.stats.perfectQ,0)>=1?1:0,1],reward:{cash:3000,xp:1200,p0:8}},
 {id:'ty-empire5',name:'EMPIRE',desc:'Build facilities in 5 territories.',prog:()=>[(()=>{try{return Object.keys(S.ty.locFac).filter(k=>{const f=S.ty.locFac[k];return (f.grow+f.disp+f.proc+f.breed)>0;}).length>=5?1:0;}catch(e){return 0;}})(),1],reward:{cash:4000,xp:1500,rep:40}},
 {id:'ty-legend',name:'LEGEND',desc:'Reach max street rank.',prog:()=>[TY_rankIdx()>=12?1:0,1],reward:{xp:3000,rep:100,p0:15,perk:['legendtax','LEGEND TAX — +10% all sales']}},
 {id:'ty-masterbreeder',name:'MASTER BREEDER',desc:'Stabilize an elite line (90%+).',prog:()=>[(()=>{try{return Object.values(S.ty.stab).some(v=>v>=90)?1:0;}catch(e){return 0;}})(),1],reward:{cash:2500,xp:1200,p0:10}},
 {id:'ty-keeper',name:'KEEPER',desc:'Discover an exceptional phenotype.',prog:()=>[int(S.stats.keepersFound,0)>=1?1:0,1],reward:{cash:600,xp:300,p0:4}},
 {id:'ty-p0vault',name:'PROJECT 0 VAULT',desc:'Earn 500 Project 0 points.',prog:()=>[Math.min(int(S.project0.points,0),500),500],reward:{xp:1500,p0:10,perk:['p0bless','P0 BLESSING — +5% P0 gains']}}
];

/* p0bless + mutluck wrappers: applied at point of use */
function TY_wrapPerks(){
  try{
    if(typeof GX_mutChance==='function'&&!GX_mutChance._tyW){
      const o=GX_mutChance;
      GX_mutChance=function(){ return clamp(o()*TY_perkMult('mutluck'),0.02,0.3); };
      GX_mutChance._tyW=true;
    }
  }catch(e){}
  try{
    if(typeof addP0==='function'&&!addP0._tyW){
      const o=addP0;
      addP0=function(tr,n){ o(tr,Math.round(num(n,0)*TY_perkMult('p0bless'))); };
      addP0._tyW=true;
    }
  }catch(e){}
}

/* ---------------- more random events ---------------- */
const TY_EVENTS=[
 { id:'ty-empquit', rarity:'UNCOMMON', weight:10, cd:20, dur:[1,1],
   title:'WALKOUT', text:function(){ const e=TY_pickEmp(); return e?('<b>'+esc(e.name)+'</b> ('+esc(e.role)+') is threatening to quit — morale is shot.'):'A key staffer is threatening to quit.'; },
   canRoll:function(){ return (S.ex.employees||[]).length>0; },
   onStart:function(ev){ ev.data.eid=(TY_pickEmp()||{}).id||null; },
   choices:[
    {label:'GIVE RAISE', sub:function(ev){ const e=TY_empById(ev.data.eid); const c=e?Math.round(num(e.salary,10)*0.2):50; return 'Pay '+fmt$(c)+' — they stay, morale restored'; },
     run:function(ev){ const e=TY_empById(ev.data.eid); if(!e) return 'end'; const c=Math.round(num(e.salary,10)*0.2); if(S.cash<c){ toast(icon('x','ge-ic-md')+' Need '+fmt$(c)+'.'); return; } S.cash-=c; e.salary+=c; const x=TY_empX(e); x.morale=90; x.loyalty=clamp(x.loyalty+15,0,100); toast(icon('cash','ge-ic-md')+' Crisis averted.'); return 'end'; }},
    {label:'LET THEM WALK', sub:'They quit today', run:function(ev){ const e=TY_empById(ev.data.eid); if(e){ S.ex.employees=S.ex.employees.filter(y=>y.id!==e.id); TY_notify(icon('users','ge-ic-md')+' <b>'+esc(e.name)+'</b> quit.','bad'); } return 'end'; }}
   ]},
 { id:'ty-empstar', rarity:'RARE', weight:8, cd:18, dur:[1,1],
   title:'EAGLE EYE', text:function(){ const e=TY_pickEmp(); return e?('<b>'+esc(e.name)+'</b> caught a problem early — before it cost you.'):'A staffer caught a problem early.'; },
   canRoll:function(){ return (S.ex.employees||[]).length>0&&S.plants.length>0; },
   onStart:function(ev){ ev.data.eid=(TY_pickEmp()||{}).id||null; },
   choices:[
    {label:'REWARD THEM', sub:'$100 bonus — loyalty up', run:function(ev){ if(S.cash<100){ toast(icon('x','ge-ic-md')+' Need $100.'); return; } S.cash-=100; const e=TY_empById(ev.data.eid); if(e){ const x=TY_empX(e); x.loyalty=clamp(x.loyalty+12,0,100); x.morale=clamp(x.morale+10,0,100); } S.plants.forEach(p=>{ p.problems=(p.problems||[]).filter(x=>x!=='Pests'); }); toast(icon('trophy','ge-ic-md')+' Problem cleared before it spread.'); return 'end'; }},
    {label:'NOD AND MOVE ON', sub:'No bonus, small morale dip', run:function(ev){ const e=TY_empById(ev.data.eid); if(e){ TY_empX(e).morale=clamp(TY_empX(e).morale-8,0,100); } return 'end'; }}
   ]},
 { id:'ty-bigorder', rarity:'RARE', weight:9, cd:16, dur:[4,5],
   title:'HUGE CUSTOMER ORDER', text:function(){ return 'A buyer wants <b>20 oz of 80+ quality flower</b> in 5 days. Big money if you deliver.'; },
   canRoll:function(){ return true; },
   onStart:function(ev){ ev.data.qty=20; },
   choices:[
    {label:'TAKE THE ORDER', sub:'Deliver from inventory before it expires', run:function(ev){ ev.data.taken=true; toast(icon('scroll','ge-ic-md')+' Order accepted — deliver 20 oz Q80+.'); }},
    {label:'PASS', sub:'Too much pressure', run:function(){ return 'end'; }}
   ]},
 { id:'ty-viral', rarity:'RARE', weight:7, cd:22, dur:[5,6],
   title:'VIRAL STRAIN', text:function(){ const s=TY_hotStrain(); return 'Social media is losing it over <b>'+esc(s.name)+'</b> — demand is exploding.'; },
   canRoll:function(){ return true; },
   onStart:function(ev){ const s=TY_hotStrain(); ev.data.sid=s.id; S.ty.strainPop[s.id]=100; },
   choices:[ {label:'RIDE THE WAVE', sub:'+hype while it lasts', run:function(){ TY_notify(icon('temp','ge-ic-md')+' Riding the viral wave','good',true); }} ]},
 { id:'ty-pricewar', rarity:'UNCOMMON', weight:11, cd:18, dur:[3,4],
   title:'COMPETITOR PRICE WAR', text:function(){ return 'A competitor is dumping product. Your sale prices dip <b>−12%</b> until it blows over.'; },
   canRoll:function(){ return true; }, onStart:function(){ S.ty.priceWar=3; },
   choices:[ {label:'HOLD THE LINE', sub:'Wait it out', run:function(){ toast(icon('shield','ge-ic-md')+' Holding prices. It will pass.'); }} ]},
 { id:'ty-award', rarity:'RARE', weight:6, cd:25, dur:[1,1],
   title:'INDUSTRY AWARD', text:function(){ return 'Your work got recognized — <b>+12 quality rep, +8 business rep</b>.'; },
   canRoll:function(){ return TY_repOverall()>=200; },
   onStart:function(){ TY_gainRep('quality',12); TY_gainRep('business',8); },
   choices:[ {label:'ACCEPT', sub:'Take the bow', run:function(){ return 'end'; }} ]},
 { id:'ty-badreview', rarity:'COMMON', weight:12, cd:14, dur:[2,3],
   title:'BAD REVIEW', text:function(){ return 'A customer trashed you online. Service rep takes a hit unless you make it right.'; },
   canRoll:function(){ return int(S.ty.cust.stats.cust,0)>20; },
   onStart:function(){},
   choices:[
    {label:'MAKE IT RIGHT', sub:'Pay $150 — review buried', run:function(){ if(S.cash<150){ toast(icon('x','ge-ic-md')+' Need $150.'); return; } S.cash-=150; TY_gainRep('service',6); toast(icon('star','ge-ic-md')+' Review handled.'); return 'end'; }},
    {label:'IGNORE', sub:'−10 service rep', run:function(){ TY_gainRep('service',-0); S.ty.rep.service=Math.max(0,S.ty.rep.service-10); toast(icon('x','ge-ic-md')+' The review sticks.'); }}
   ]},
 { id:'ty-goodreview', rarity:'COMMON', weight:12, cd:14, dur:[1,1],
   title:'GLOWING REVIEW', text:function(){ return '“Best in the city.” A happy customer just put you on blast — in a good way.'; },
   canRoll:function(){ return int(S.ty.cust.stats.cust,0)>20; },
   onStart:function(){ TY_gainRep('service',8); },
   choices:[ {label:'THANK THEM', sub:'+service rep', run:function(){ return 'end'; }} ]},
 { id:'ty-elecsurge', rarity:'UNCOMMON', weight:10, cd:16, dur:[5,6],
   title:'GRID SURGE PRICING', text:function(){ return 'The power company jacked rates <b>+25%</b> for a few days. Electricity will sting.'; },
   canRoll:function(){ return true; }, onStart:function(){ S.ty.elecPrice=clamp(num(S.ty.elecPrice,1)*1.25,0.7,1.8); },
   choices:[ {label:'GRIT TEETH', sub:'Pay the surge', run:function(){ toast(icon('lighting','ge-ic-md')+' Surge pricing active.'); }} ]},
 { id:'ty-coldsnap', rarity:'UNCOMMON', weight:9, cd:16, dur:[3,4],
   title:'COLD SNAP', text:function(){ return 'Bitter cold outside — your HVAC is working overtime. Temp control is harder.'; },
   canRoll:function(){ return true; }, onStart:function(){},
   choices:[ {label:'CRANK THE HEAT', sub:'Pay $120 — no penalty', run:function(){ if(S.cash<120){ toast(icon('x','ge-ic-md')+' Need $120.'); return; } S.cash-=120; TY_exp('electricity',120); toast(icon('temp','ge-ic-md')+' Heat cranked.'); return 'end'; }},
             {label:'TOUGH IT OUT', sub:'−8 env score while it lasts', run:function(ev){ ev.data.tough=true; toast(icon('temp','ge-ic-md')+' Toughing it out…'); }} ]},
 { id:'ty-pheno', rarity:'LEGENDARY', weight:3, cd:40, dur:[1,1],
   title:'EXCEPTIONAL PHENOTYPE', text:function(){ return 'A seed in your stash just showed impossible vigor. A <b>rare phenotype</b> wants to be grown.'; },
   canRoll:function(){ return S.plants.length<50; },
   onStart:function(ev){},
   choices:[ {label:'PLANT IT', sub:'Exceptional seedling', run:function(){ try{ const st=getStrain('queens-revenge-s1')||allStrains()[0]; if(st&&typeof plantSeed==='function'){ plantSeed(st.id); const p=S.plants[S.plants.length-1];
     /* P2.1: elite rarity is EARNED by the grow, never granted — plant a hot seedling
        (boosted base) and let genPheno's genuine rarity roll decide. No forced rarity. */
     if(p&&p.pheno){ const b={}; for(const k in st) b[k]=st[k];
       ['vigor','stab','yld','pot','resin','terp'].forEach(k=>{ b[k]=clamp(num(b[k],50)+14,5,100); });
       const nn=p.pheno.num, hid=p.pheno.huntId; p.pheno=genPheno(b); p.pheno.num=nn; p.pheno.huntId=hid; }
     TY_notify(icon('grow','ge-ic-md')+' Exceptional phenotype planted!','good'); } }catch(e){} return 'end'; }} ]}
];

function TY_pickEmp(){ try{ const l=(S.ex.employees||[]).filter(e=>e.assigned); return l.length?pick(l):null; }catch(e){ return null; } }
function TY_empById(id){ try{ return (S.ex.employees||[]).find(e=>e.id===id)||null; }catch(e){ return null; } }
function TY_hotStrain(){ try{ const l=allStrains(); return l.length?pick(l):{id:'x',name:'Mystery'}; }catch(e){ return {id:'x',name:'Mystery'}; } }

/* ---------------- Project 0 depth ---------------- */
function TY_p0Tick(){
  /* P0 vault key perk */
  if(TY_hasPerk('vaultkey')&&int(S.day,1)%2===0){ try{ addP0('preservation',1); }catch(e){} }
  /* diversity dividend: unique documented strains trickle P0 */
  const n=TY_libCount();
  if(n>=10&&int(S.day,1)%7===0){ try{ addP0('preservation',Math.min(5,Math.floor(n/10))); }catch(e){} }
}

/* ---------------- dashboard upgrades ---------------- */
function TY_dashCommand(){
  const last=S.ty.fin.hist[S.ty.fin.hist.length-1];
  const st=S.ty.cust.stats;
  let h='<div class="ge-section-title">EMPIRE COMMAND</div><div class="ge-card">';
  h+='<div class="ge-datarow"><span>'+icon('crown-gold','ge-ic-md')+'Rank</span><b>'+esc(TY_rankName())+'</b></div>';
  if(last){
    const p=last.profit;
    h+='<div class="ge-datarow"><span>'+icon('cash','ge-ic-md')+'Yesterday</span><b class="ge-num"><span class="ge-green">+'+fmt$(last.rev)+'</span> <span class="ge-red">&minus;'+fmt$(last.exp)+'</span> = <span class="'+(p>=0?'ge-green':'ge-red')+'">'+fmt$(p)+'</span></b></div>';
  }
  h+='<div class="ge-datarow"><span>'+icon('crew','ge-ic-md')+'Customers</span><b class="ge-num">'+st.cust+' today &middot; '+st.sales+' sales</b></div>';
  h+='<div class="ge-datarow"><span>'+icon('empire','ge-ic-md')+'Staff</span><b class="ge-num">'+((S.ex.employees||[]).length)+' &middot; payroll '+fmt$(TY_payrollSafe())+'/day</b></div>';
  h+='<div class="ge-datarow"><span>'+icon('star','ge-ic-md')+'Top product</span><b>'+esc(S.ty.topStrain||'—')+'</b></div>';
  h+='<div class="ge-datarow"><span>'+icon('genetics','ge-ic-md')+'Playstyle</span><span class="ge-badge ge-badge-legendary">'+TY_playstyle()+'</span></div>';
  const nm=nextMission();
  if(nm) h+='<div class="ge-datarow"><span>'+icon('missions','ge-ic-md')+'Mission</span><b>'+esc(nm.name)+'</b></div>';
  h+='<div class="ge-btn-row"><button class="ge-btn ge-btn-ghost ge-btn-sm" onclick="show(\'market\')">MARKET</button>'+
   '<button class="ge-btn ge-btn-ghost ge-btn-sm" onclick="show(\'production\')">PRODUCTION</button></div>';
  h+='</div>';
  return h;
}

function TY_payrollSafe(){ try{ return (typeof EX_payrollTotal==='function')?EX_payrollTotal():0; }catch(e){ return 0; } }
function TY_dashNewsFeed(){
  let h='<div class="ge-section-title">STREET NEWS</div><div class="ge-card">'+TY_newsHTML(3)+
   '<div class="ge-btn-row"><button class="ge-btn ge-btn-ghost ge-btn-sm" onclick="show(\'market\')">FULL REPORT</button></div></div>';
  h+='<div class="ge-section-title">ALERTS</div><div class="ge-card ge-home-alerts">'+TY_feedHTML(6)+'</div>';
  return h;
}


/* ---------------- master tick ---------------- */
function TY_tick(){
  if(!S||!S.ty) return;
  try{ TY_marketTick(); }catch(e){}
  try{ TY_newsTick(); }catch(e){}
  try{ TY_compTick(); }catch(e){}
  try{ TY_procTick(); }catch(e){}
  try{ TY_custTick(); }catch(e){}
  try{ TY_rootTick(); }catch(e){}
  try{ TY_staffTick(); }catch(e){}
  try{ TY_econTick(); }catch(e){}
  try{ TY_p0Tick(); }catch(e){}
  try{ TY_passiveTick(); }catch(e){}
  try{ TY_checkRank(); }catch(e){}
  /* big-order event fulfillment check */
  try{
    const ev=(S.wx.events||[]).find(e=>e.id==='ty-bigorder'&&e.data&&e.data.taken&&!e.data.done);
    if(ev){
      const ok=(S.inventory||[]).some(it=>it.type==='flower'&&it.quality>=80&&it.amount>=20);
      if(ok){
        const it=S.inventory.find(x=>x.type==='flower'&&x.quality>=80&&x.amount>=20);
        it.amount=Math.round((it.amount-20)*10)/10;
        if(it.amount<=0) S.inventory=S.inventory.filter(x=>x.id!==it.id);
        S.cash+=9000; S.stats.lifetimeRevenue+=9000;
        TY_gainRep('reliability',15); TY_gainRep('business',8);
        ev.data.done=true;
        TY_notify(icon('scroll','ge-ic-md')+' <b>Big order delivered:</b> +$9,000, +15 reliability','good');
      }
    }
  }catch(e){}
  /* price war decay */
  try{ if(num(S.ty.priceWar,0)>0){ S.ty.priceWar--; if(S.ty.priceWar<=0) TY_notify(icon('compete','ge-ic-md')+' Price war over — margins restored','info',true); } }catch(e){}
}


/* ---------------- init: screens, menu, content pushes ---------------- */
function TY_init(){
  if(typeof S==='undefined'||!S) return false;
  if(!S.ty||typeof S.ty!=='object') S.ty=TY_defaultTy();
  TY_normalizeTy();
  TY_initComps();
  ['market','production'].forEach(id=>{
    if(!SCREENS.includes(id)) SCREENS.push(id);
    if(!$('scr-'+id)){
      const sec=document.createElement('section');
      sec.id='scr-'+id; sec.className='screen hidden';
      const d=document.createElement('div'); d.id=id+'-root'; sec.appendChild(d);
      const main=$('app')||document.querySelector('main');
      if(main) main.appendChild(sec);
    }
  });
  /* menu entries */
  try{
    if(typeof MENU_ITEMS!=='undefined'){
      if(!MENU_ITEMS.some(m=>m.id==='market')) MENU_ITEMS.push({id:'market',ico:'cash',label:'MARKET'});
      if(!MENU_ITEMS.some(m=>m.id==='production')) MENU_ITEMS.push({id:'production',ico:'feed',label:'PRODUCTION'});
    }
  }catch(e){}
  /* missions */
  try{
    if(typeof MISSIONS!=='undefined'){
      TY_MISSIONS.forEach(m=>{ if(!MISSIONS.some(x=>x.id===m.id)) MISSIONS.push(m); });
    }
  }catch(e){}
  /* achievements */
  try{
    if(typeof EX_ACHIEVEMENTS!=='undefined'){
      TY_ACHIEVEMENTS.forEach(a=>{
        if(!EX_ACHIEVEMENTS.some(x=>x.id===a.id)){
          EX_ACHIEVEMENTS.push({id:a.id,name:a.name,desc:a.desc,prog:a.prog,
            reward:{cash:a.reward.cash,xp:a.reward.xp,rep:a.reward.rep,p0:a.reward.p0,title:a.reward.title}});
        }
      });
    }
  }catch(e){}
  /* achievement perks: wrap EX_checkAch once */
  try{
    if(typeof EX_checkAch==='function'&&!EX_checkAch._tyWrapped){
      const orig=EX_checkAch;
      EX_checkAch=function(){
        const before={};
        try{ TY_ACHIEVEMENTS.forEach(a=>{ before[a.id]=!!(S.ex.ach&&S.ex.ach[a.id]); }); }catch(e){}
        orig();
        try{ TY_ACHIEVEMENTS.forEach(a=>{
          if(!before[a.id]&&S.ex.ach&&S.ex.ach[a.id]&&a.reward.perk){ TY_grantPerk(a.reward.perk[0],a.reward.perk[1]); }
        }); }catch(e){}
      };
      EX_checkAch._tyWrapped=true;
    }
  }catch(e){}
  /* events */
  try{
    if(typeof WX_EVENT_DEFS!=='undefined'){
      TY_EVENTS.forEach(ev=>{ if(!WX_EVENT_DEFS.some(x=>x.id===ev.id)) WX_EVENT_DEFS.push(ev); });
    }
  }catch(e){}
  /* tagline on menu hero is handled by edit; nothing else needed */
  try{ TY_wrapRenders(); }catch(e){}
  try{ TY_wrapEmpLevel(); }catch(e){}
  try{ TY_wrapPerks(); }catch(e){}
  return true;
}
/* achievement perk effects read at point of use:
   mutluck → GX_mutChance wrapper below; vaulted → daily passive; legendtax → sale mult; p0bless → quality */
function TY_perkMult(kind){
  if(kind==='mutluck'&&TY_hasPerk('mutluck')) return 1.05;
  if(kind==='legendtax'&&TY_hasPerk('legendtax')) return 1.10;
  if(kind==='p0bless'&&TY_hasPerk('p0bless')) return 1.05;
  return 1;
}
/* vaulted passive income */
function TY_passiveTick(){
  if(TY_hasPerk('vaulted')){ S.cash+=500; }
}
/* ---------------- genetic profile modal ---------------- */
function TY_profileModal(strainId){
  const st=getStrain(strainId); if(!st) return;
  const L=(S.ty.strainLib||{})[strainId]||{firstDay:int(S.day,1),crosses:0,phenos:0,keepers:0,best:0,awards:0};
  let html='<h3 class="ge-h2">'+icon('genetics','ge-ic-lg')+esc(st.name).toUpperCase()+'</h3>';
  html+=TY_genProfileHTML(st);
  html+='<div class="ge-card"><div class="ge-card-head"><h3>'+icon('scroll','ge-ic-md')+'STRAIN FILE</h3></div>'+
   '<div class="ge-datarow"><span>Documented</span><b class="ge-num">Day '+L.firstDay+'</b></div>'+
   '<div class="ge-datarow"><span>Crosses created</span><b class="ge-num">'+L.crosses+'</b></div>'+
   '<div class="ge-datarow"><span>Phenotypes tested</span><b class="ge-num">'+L.phenos+'</b></div>'+
   '<div class="ge-datarow"><span>Keepers found</span><b class="ge-num">'+L.keepers+'</b></div>'+
   '<div class="ge-datarow"><span>Best score</span><b class="ge-num">'+L.best+'</b></div>'+
   TY_lineageStabHTML(strainId)+
   '<div class="ge-datarow"><span>Popularity</span><b class="ge-num">'+TY_strainPop(strainId)+'/100</b></div>'+
   '<div class="ge-datarow"><span>Market price factor</span><b class="ge-num">×'+TY_priceFactor(strainId,{type:'flower',quality:80}).toFixed(2)+'</b></div></div>';
  html+='<button class="ge-btn ge-btn-ghost ge-btn-block" onclick="closeModal(this.closest(\'.modal-back\'))">CLOSE</button>';
  modal(html);
}


/* ---------------- render wrappers (non-destructive) ---------------- */
function TY_wrapRenders(){
  try{
    if(typeof GX_wireGenetics==='function'&&!GX_wireGenetics._tyW){
      const o=GX_wireGenetics;
      GX_wireGenetics=function(root){
        o(root);
        try{
          const r=root||$('genetics-root'); if(!r) return;
          r.querySelectorAll('.strain-card').forEach(function(card){
            if(card.querySelector('[data-ty-profile]')) return;
            const idBtn=card.querySelector('[data-growseed],[data-hunt],[data-vkeepers],[data-buygen],[data-preserve]');
            if(!idBtn) return;
            const ds=idBtn.dataset;
            const sid=ds.growseed||ds.hunt||ds.vkeepers||ds.buygen||ds.preserve;
            if(!sid) return;
            var row=card.querySelector('.ge-btn-row.gx-extra-row');
            if(!row){ row=document.createElement('div'); row.className='ge-btn-row gx-extra-row'; card.appendChild(row); }
            const b=document.createElement('button');
            b.className='ge-btn ge-btn-sm ge-btn-ghost'; b.setAttribute('data-ty-profile',sid);
            b.textContent='GENETIC PROFILE';
            b.onclick=(function(id){ return function(){ TY_profileModal(id); }; })(sid);
            row.appendChild(b);
          });
        }catch(e){}
      };
      GX_wireGenetics._tyW=true;
    }
  }catch(e){}
  try{
    if(RENDER.locations&&!RENDER.locations._tyW){
      const o=RENDER.locations;
      RENDER.locations=function(){
        o();
        try{
          const r=$('locations-root'); if(!r) return;
          r.insertAdjacentHTML('beforeend',TY_locFacHTML());
          TY_wireLocFac(r);
        }catch(e2){}
      };
      RENDER.locations._tyW=true;
    }
  }catch(e){}
  try{
    if(typeof EX_empLeveled!=='undefined'){/*noop*/}
  }catch(e){}
}
/* hook EX employee level-ups → TY lifecycle (wrapped once) */
function TY_wrapEmpLevel(){
  try{
    if(typeof EX_empLevelCheck==='function'&&!EX_empLevelCheck._tyW){
      const o=EX_empLevelCheck;
      EX_empLevelCheck=function(e,announce){
        const before=int(e.lvl,1);
        o(e,announce);
        if(int(e.lvl,1)>before){ try{ TY_empLeveled(e); }catch(e2){} }
      };
      EX_empLevelCheck._tyW=true;
    }
  }catch(e){}
}
/* ============================================================
   SHOCKER OWNZ GROW EMPIRE — GENETICS VAULT UI (GT_ module)
   Appended module: filters, search, sort, strain detail screen,
   vault stats, empty-state protection. Replaces RENDER.genetics.
   ALL top-level identifiers GT_-prefixed (plus RENDER.genetics,
   RENDER.strain reassignments and genFilter/genSearch/genSort/
   strainDetailId state).
   ============================================================ */
let genFilter='all', genSearch='', genSort='name', strainDetailId=null;

/* breeder/origin for base strains */
const GT_BREEDERS={
 'queens-revenge-s1':'Shocker OwnZ','slurricane-7':'Shocker OwnZ','gg4-s1':'Shocker OwnZ',
 'rks-s1':'Shocker OwnZ','tangerine-tbone':'Shocker OwnZ','northern-lights':'Classic',
 'blue-dream':'Classic','og-kush':'Classic','sour-diesel':'Classic','granddaddy-purp':'Classic',
 'white-widow':'Classic','pineapple-express':'Classic','girl-scout-cookies':'Cookie Fam',
 'zkittlez':'Terp Hogz','gelato-33':'Cookie Fam','wedding-cake':'Seed Junky','runtz':'Runtz Crew',
 'apple-fritter':'Lumpy\u2019s','ice-cream-cake':'Seed Junky','mac-1':'Capulator',
 'gmo-cookies':'Skunk House','tropicana-cookies':'Oni Seed','jealousy':'Seed Junky',
 'permanent-marker':'Doja','oreoz':'3rd Coast','gushers':'Cookie Fam','sunset-sherbet':'Sherbinski',
 'dosidos':'Archive','strawberry-cough':'Kyle Kushman','chemdawg':'Chem Family','ak-47':'Serious Seeds',
 'super-silver-haze':'Green House','project-zero-og':'PROJECT 0','crown-jewel':'Shocker OwnZ'
};
function GT_breeder(st){ return st.custom?'Shocker OwnZ (Your Cross)':(GT_BREEDERS[st.id]||'Shocker OwnZ Vault'); }
function GT_typeLabel(st){ const t=st.type||'hybrid'; return t.charAt(0).toUpperCase()+t.slice(1); }
function GT_rarity(st){
  if(st.id==='project-zero-og'||st.id==='crown-jewel') return 'legendary';
  if(st.seed>=100||(st.tags&&st.tags.includes('Keeper'))) return 'elite';
  if(st.seed>=70) return 'rare';
  return 'common';
}
function GT_difficulty(st){
  const d=Math.round((100-num(st.stab,80))*0.6+(num(st.ft,60)-50)*1.2);
  return d>=55?'Hard':d>=35?'Medium':'Easy';
}
function GT_legendaryCount(){
  let n=0;
  try{
    (S.keepers||[]).forEach(k=>{ if(k.rarity==='legendary') n++; });
    Object.values(S.phenoHistory||{}).forEach(h=>{ n+=int(h.legendary,0); });
  }catch(e){}
  return n;
}
function GT_vaultStats(){
  const all=allStrains();
  const owned=ownedCount(S);
  let phenos=0; try{ Object.values(S.phenoHistory||{}).forEach(h=>{ phenos+=int(h.tested,0); }); }catch(e){}
  const keepers=(S.keepers||[]).length;
  const crosses=int(S.stats.crosses,0)+(S.customStrains||[]).length;
  const legendary=GT_legendaryCount();
  return [
    {l:'GENETICS OWNED',v:owned},
    {l:'PHENOTYPES DISCOVERED',v:phenos},
    {l:'KEEPERS',v:keepers},
    {l:'CROSSES CREATED',v:crosses},
    {l:'LEGENDARY GENETICS',v:legendary}
  ];
}
function GT_filterBar(){
  const all=allStrains();
  const counts={all:all.length,seeds:0,keepers:0,mothers:0,breeding:0,p0:0};
  try{
    counts.seeds=all.filter(s=>!s.custom).length;
    counts.breeding=all.filter(s=>s.custom).length;
    counts.p0=all.filter(s=>s.id==='project-zero-og'||s.id==='crown-jewel'||(s.tags&&s.tags.includes('Keeper'))||(s.custom&&s.p0Submitted)).length; /* P3-W2: submitted customs */
    counts.keepers=all.filter(s=>{ try{return (S.phenoHistory[s.id]&&int(S.phenoHistory[s.id].keepers,0)>0)||(S.keepers||[]).some(k=>k.strainId===s.id);}catch(e){return false;} }).length;
    counts.mothers=all.filter(s=>{ try{return (S.mothers||[]).some(m=>m.strainId===s.id);}catch(e){return false;} }).length;
  }catch(e){}
  const filters=[['all','ALL','dna'],['seeds','SEEDS','grow'],['keepers','KEEPERS','crown'],['mothers','MOTHERS','mothers'],['breeding','BREEDING','breeding'],['p0','PROJECT 0','project0']];
  const sorts=[['name','Name'],['potency','Potency'],['yield','Yield'],['stability','Stability'],['rarity','Rarity'],['popularity','Popularity'],['demand','Market Demand'],['best','Best Score']];
  return '<div class="ge-card ge-card-flat ge-filterbar"><div class="ge-tabs" role="tablist">'+
    filters.map(f=>'<button class="ge-tab'+(genFilter===f[0]?' is-active':'')+'" data-gfilter="'+f[0]+'" role="tab" aria-selected="'+(genFilter===f[0])+'">'+icon(f[2],'ge-ic-sm')+f[1]+'<span class="ge-tab-count">'+counts[f[0]]+'</span></button>').join('')+
    '</div><div class="ge-filter-row"><div class="ge-search-wrap">'+icon('search','ge-ic-md')+'<input type="text" id="gt-search" inputmode="search" enterkeyhint="search" class="ge-search" placeholder="SEARCH THE ARCHIVE" value="'+esc(genSearch)+'" maxlength="40" aria-label="Search genetics"></div>'+
    '<select id="gt-sort" class="ge-select" aria-label="Sort genetics">'+sorts.map(s=>'<option value="'+s[0]+'"'+(genSort===s[0]?' selected':'')+'>'+s[1]+'</option>').join('')+'</select></div></div>';
}

function GT_popularity(st){ try{ return (typeof TY_strainPop==='function')?TY_strainPop(st.id):50; }catch(e){ return 50; } }
function GT_demand(st){
  const pop=GT_popularity(st);
  if(pop>=80) return ['HIGH','dem-high'];
  if(pop>=60) return ['RISING','dem-rise'];
  if(pop>=40) return ['STABLE','dem-stab'];
  return ['LOW','dem-low'];
}
function GT_bestScore(st){
  try{ const ph=S.phenoHistory[st.id]; return ph?num(ph.bestScore,0):0; }catch(e){ return 0; }
}
function GT_filteredStrains(){
  let all=allStrains().slice();
  if(genFilter==='seeds') all=all.filter(s=>!s.custom);
  else if(genFilter==='keepers') all=all.filter(s=>{ try{return (S.phenoHistory[s.id]&&int(S.phenoHistory[s.id].keepers,0)>0)||(S.keepers||[]).some(k=>k.strainId===s.id);}catch(e){return false;} });
  else if(genFilter==='mothers') all=all.filter(s=>{ try{return (S.mothers||[]).some(m=>m.strainId===s.id);}catch(e){return false;} });
  else if(genFilter==='breeding') all=all.filter(s=>s.custom);
  else if(genFilter==='p0') all=all.filter(s=>s.id==='project-zero-og'||s.id==='crown-jewel'||(s.tags&&s.tags.includes('Keeper'))||(s.custom&&s.p0Submitted)); /* P3-W2: submitted customs */
  if(genSearch){ const q=genSearch.toLowerCase(); all=all.filter(s=>(s.name||'').toLowerCase().includes(q)||(s.id||'').toLowerCase().includes(q)); }
  const rW={common:0,rare:1,elite:2,legendary:3};
  all.sort((a,b)=>{
    switch(genSort){
      case 'potency': return num(b.pot,0)-num(a.pot,0);
      case 'yield': return num(b.yld,0)-num(a.yld,0);
      case 'stability': return num(b.stab,0)-num(a.stab,0);
      case 'rarity': return (rW[GT_rarity(b)]||0)-(rW[GT_rarity(a)]||0);
      case 'popularity': case 'demand': return GT_popularity(b)-GT_popularity(a);
      case 'best': return GT_bestScore(b)-GT_bestScore(a);
      default: return String(a.name||'').localeCompare(String(b.name||''));
    }
  });
  return all;
}

function GT_strainCard(st){
  const locked=!isUnlocked(st.id);
  const cx=codexHist(st.id); /* P2-W2 Living Codex */
  const ph=S.phenoHistory[st.id];
  const keepers=(S.keepers||[]).filter(k=>k.strainId===st.id).length;
  const mothers=(S.mothers||[]).filter(m=>m.strainId===st.id).length;
  const rar=GT_rarity(st);
  const bestScore=GT_bestScore(st);
  const phenoNo=bestScore>0&&ph?'#'+int(ph.bestPheno,0):'UNTESTED';
  let lockHtml='';
  if(locked){
    const l=st.lock||{t:'rep',v:999};
    lockHtml='<div class="ge-spec-lock"><p class="ge-caption">'+icon('lock','ge-ic-md')+' '+esc(lockReasonText(l,st.seed*3))+'</p>';
    const clue=codexClue(st); /* P2-W2: mystery hint per unlock route - a hint, never a spoiler */
    if(clue) lockHtml+='<p class="codex-clue">'+icon('inspect','ge-ic-sm')+' <i>'+esc(clue)+'</i></p>';
    if(l.t==='cash') lockHtml+='<button class="ge-btn ge-btn-gold" data-buygen="'+st.id+'">BUY GENETICS — '+fmt$(st.seed*3)+'</button>';
    lockHtml+='</div>';
  }
  const lineage=st.lineage?esc(st.lineage):'Foundation genetics';
  return '<div class="ge-card ge-card-tap ge-spec-card gt-card strain-card'+((cx&&cx.completed)?' codex-complete':'')+'" data-strain="'+st.id+'">'+
    '<div class="ge-spec-art">'+flowerSVG(strainSeed(st),'strain-flower')+'</div>'+
    '<div class="ge-spec-main">'+
    '<div class="ge-spec-top"><h3 class="ge-spec-name">'+esc(strainDisplayName(st))+(st.custom?' <span class="ge-badge">CUSTOM</span>':'')+'</h3></div>'+
    '<div class="ge-spec-badges">'+GT_rarityBadge(rar)+((cx&&cx.completed)?'<span class="ge-badge ge-badge-gold">'+icon('crown-gold','ge-ic-sm')+'CODEX COMPLETE</span>':'')+
      (keepers>0?'<span class="ge-badge ge-badge-keeper">'+icon('crown','ge-ic-sm')+'KEEPER ×'+keepers+'</span>':'')+
      (mothers>0?'<span class="ge-badge ge-badge-mother">'+icon('mothers','ge-ic-sm')+'MOTHER</span>':'')+
      '<span class="ge-badge ge-badge-common">PHENO '+phenoNo+'</span></div>'+
    '<div class="ge-spec-pot"><span class="ge-label">POTENCY</span><span class="ge-data ge-spec-potv">'+Math.round(num(st.pot,0))+'%</span></div>'+
    '<div class="ge-tags">'+GT_terpeneProfile(st).map(t=>'<span class="ge-pill ge-pill-neutral">'+icon('terp','ge-ic-sm')+esc(t)+'</span>').join('')+'</div>'+
    '<div class="ge-spec-meters"><div class="ge-spec-meter"><span class="ge-label">YIELD</span>'+GT_starMeter(st.yld)+'</div>'+
    '<div class="ge-spec-meter"><span class="ge-label">STABILITY</span>'+GT_starMeter(st.stab)+'</div></div>'+
    '<div class="ge-spec-lin">'+icon('dna','ge-ic-sm')+'<span class="ge-truncate">'+lineage+'</span></div>'+
    '<div class="ge-datarow"><span>Market demand</span><b>'+GT_demandPill(st)+'</b></div>'+
    '<div class="ge-datarow"><span>Phenotypes tested</span><b class="ge-num">'+(ph?int(ph.tested,0):0)+'</b></div>'+
    '<div class="ge-datarow"><span>Keepers found</span><b class="ge-num">'+keepers+'</b></div>'+
    (bestScore>0?'<div class="ge-datarow"><span>Best pheno</span><b class="ge-num">#'+int(ph.bestPheno,0)+' ('+Math.round(bestScore)+')</b></div>':'')+
    lockHtml+
    (locked?'':'<div class="ge-btn-row"><button class="ge-btn ge-btn-sm ge-btn-ghost" data-gdetail="'+st.id+'">'+icon('inspect','ge-ic-sm')+'PROFILE</button>'+
    '<button class="ge-btn ge-btn-sm ge-btn-primary" data-growseed="'+st.id+'">'+icon('grow','ge-ic-sm')+'GROW</button>'+
    '<button class="ge-btn ge-btn-sm ge-btn-ghost" data-hunt="'+st.id+'">'+icon('hunt','ge-ic-sm')+'HUNT</button></div>')+
    '</div></div>';
}

/* ---- RENDER.genetics replacement ---- */
RENDER.genetics=function(){
  const r=$('genetics-root'); if(!r) return;
  const stats=GT_vaultStats();
  let html='<div class="ge-screen">'+screenHead('genetics','GENETIC VAULT');
  html+='<div class="ge-card"><div class="ge-card-head">'+icon('dna','ge-ic-md')+'<h3>SECRET GENETIC ARCHIVE</h3></div>'+
    '<div class="ge-tiles ge-tiles-4">'+stats.map(s=>'<div class="ge-metric-tile"><div class="ge-metric-value ge-num">'+s.v+'</div><div class="ge-metric-label">'+s.l+'</div></div>').join('')+'</div></div>';
  html+=GT_filterBar();
  const list=GT_filteredStrains();
  if(!list.length){
    html+='<div class="ge-card ge-empty"><div>'+icon('dna','ge-ic-xl')+'</div><h3>THE ARCHIVE IS EMPTY</h3>'+
      '<p>Acquire genetics to begin building your collection.</p>'+
      '<button class="ge-btn ge-btn-primary" id="gt-gomarket">'+icon('shop','ge-ic-md')+'VISIT GENETICS MARKET</button></div>';
  } else {
    html+='<div class="ge-stack gt-grid">'+list.map(GT_strainCard).join('')+'</div>';
  }
  html+='</div>';
  r.innerHTML=html;
  /* wire filter buttons */
  r.querySelectorAll('[data-gfilter]').forEach(b=>b.onclick=()=>{ genFilter=b.dataset.gfilter; RENDER.genetics(); });
  const si=$('gt-search');
  if(si) si.oninput=e=>{ genSearch=e.target.value; GT_refreshGrid(); };
  const so=$('gt-sort');
  if(so) so.onchange=e=>{ genSort=e.target.value; RENDER.genetics(); };
  const gm=$('gt-gomarket');
  if(gm) gm.onclick=()=>{ genFilter='all'; RENDER.genetics(); toast('Browse locked strains to buy new genetics.'); };
  GT_wireCards(r);
  try{ if(typeof GX_wireGenetics==='function') GX_wireGenetics(r); }catch(e){}
};

function GT_refreshGrid(){
  const r=$('genetics-root'); if(!r) return;
  const grid=r.querySelector('.gt-grid'); const empty=r.querySelector('.ge-empty');
  const list=GT_filteredStrains();
  const html=list.length?list.map(GT_strainCard).join(''):
    '<div class="ge-card ge-empty"><div>'+icon('dna','ge-ic-xl')+'</div><h3>NO MATCHING GENETICS</h3><p>Try a different search or filter.</p></div>';
  if(grid) grid.innerHTML=html;
  else if(empty) empty.outerHTML='<div class="ge-stack gt-grid">'+html+'</div>';
  else r.insertAdjacentHTML('beforeend','<div class="ge-stack gt-grid">'+html+'</div>');
  GT_wireCards(r);
}

function GT_wireCards(r){
  r.querySelectorAll('[data-gdetail]').forEach(b=>b.onclick=(e)=>{ if(e&&e.stopPropagation)e.stopPropagation(); strainDetailId=b.dataset.gdetail; show('strain'); });
  r.querySelectorAll('.gt-card').forEach(c=>c.onclick=(e)=>{
    if(e&&e.target&&(e.target.tagName==='BUTTON'||e.target.closest('button'))) return;
    const id=c.dataset?c.dataset.strain:c.getAttribute('data-strain');
    if(id&&isUnlocked(id)){ strainDetailId=id; show('strain'); }
  });
  r.querySelectorAll('[data-buygen]').forEach(b=>b.onclick=(e)=>{ if(e&&e.stopPropagation)e.stopPropagation();
    const st=getStrain(b.dataset.buygen);
    const gdisc=(typeof WX_discount==='function')?WX_discount('genetics'):1;
    const cost=Math.round(st.seed*3*gdisc);
    if(S.cash<cost){ toast(icon('x','ge-ic-md')+' Not enough cash.'); return; }
    S.cash-=cost; unlockStrain(st.id,true); save(); updateHUD(); RENDER.genetics();
  });
  r.querySelectorAll('[data-growseed]').forEach(b=>b.onclick=(e)=>{ if(e&&e.stopPropagation)e.stopPropagation();
    if(plantSeed(b.dataset.growseed)) toast(icon('grow','ge-ic-md')+' Planted '+esc(getStrain(b.dataset.growseed).name));
    RENDER.genetics();
  });
  r.querySelectorAll('[data-hunt]').forEach(b=>b.onclick=(e)=>{ if(e&&e.stopPropagation)e.stopPropagation(); startPhenoHunt(b.dataset.hunt); });
  r.querySelectorAll('[data-vkeepers]').forEach(b=>b.onclick=()=>{ keeperFilter=b.dataset.vkeepers; keeperPage=0; show('keepers'); });
}

/* ---- strain detail screen ---- */
function GT_terpeneProfile(st){
  const tags=st.tags||[];
  const gas=tags.includes('Gassy'), fruit=tags.includes('Fruit'), funk=tags.includes('Skunky')||tags.includes('Old School'),
        sweet=tags.includes('Fruit')||st.id.includes('cake'), purple=tags.includes('Purple'), frost=tags.includes('Frosty');
  const prof=[];
  if(gas) prof.push('Gas'); if(fruit) prof.push(fruit&&st.terp>=90?'Citrus':'Sweet');
  if(funk) prof.push('Funk'); if(purple) prof.push('Berry'); if(sweet&&!fruit) prof.push('Sweet');
  if(!prof.length) prof.push('Earthy');
  return prof.slice(0,4);
}

/* P2-W2 Living Codex: the player's relationship history with this genetic, rendered
   as its own section on the strain detail screen. Every field is stamped at its own
   lifecycle point (acquire / grow / harvest / keeper / breed) - never conflated
   with strainOwned or the harvest aggregates. */
function GT_codexHistoryHTML(st){
  try{
    const cx=codexHist(st.id);
    const has=cx&&(cx.acquiredDay>0||cx.grown>0||cx.harvested>0||cx.crossesCreated>0||cx.genNotes.length>0);
    const done=cx&&cx.completed;
    const dash='\u2014';
    const row=(l,v)=>'<div class="ge-datarow"><span>'+l+'</span><b class="ge-num">'+v+'</b></div>';
    let inner;
    if(!has){
      inner='<p class="ge-muted">No codex history yet. Acquire this genetic to begin its story.</p>';
    }else{
      inner=
        row('Acquired',(cx.acquiredDay>0?('Day '+cx.acquiredDay):dash))+
        row('Times grown',int(cx.grown,0))+
        row('Times harvested',int(cx.harvested,0))+
        row('Best yield',(num(cx.bestYield,0)>0?fmtW(cx.bestYield):dash))+
        row('Best potency',(num(cx.bestPotency,0)>0?Math.round(cx.bestPotency):dash))+
        row('Best terpenes',(num(cx.bestTerpene,0)>0?Math.round(cx.bestTerpene):dash))+
        row('Best resin',(num(cx.bestResin,0)>0?Math.round(cx.bestResin):dash))+
        row('Phenos evaluated',int(cx.phenosEvaluated,0))+
        row('Keeper pheno',(cx.keeperPheno?esc(cx.keeperPheno):dash))+
        row('Crosses created',int(cx.crossesCreated,0))+
        (cx.genNotes.length?'<div class="codex-notes">'+cx.genNotes.slice(-4).map(n=>'<p class="codex-note">'+icon('scroll','ge-ic-sm')+' '+esc(n)+'</p>').join('')+'</div>':'');
    }
    return '<div class="ge-card'+(done?' codex-complete':'')+'"><div class="ge-card-head">'+icon('dna','ge-ic-md')+'<h3>LIVING CODEX</h3>'+
      (done?'<span class="ge-spread"><span class="ge-badge ge-badge-gold">'+icon('crown-gold','ge-ic-sm')+'CODEX COMPLETE</span></span>':'')+'</div>'+inner+'</div>';
  }catch(e){ return ''; }
}

RENDER.strain=function(){
  const r=$('strain-root'); if(!r) return;
  const st=getStrain(strainDetailId);
  if(!st){ r.innerHTML='<div class="ge-screen">'+screenHead('genetics','STRAIN NOT FOUND')+'<div class="ge-card ge-empty"><div>'+icon('dna','ge-ic-xl')+'</div><h3>STRAIN NOT FOUND</h3><p>Select a strain from the Genetic Vault.</p><button class="ge-btn ge-btn-primary" onclick="show(\'genetics\')">BACK TO VAULT</button></div></div>'; return; }
  const ph=S.phenoHistory[st.id];
  const keepers=(S.keepers||[]).filter(k=>k.strainId===st.id);
  const mothers=(S.mothers||[]).filter(m=>m.strainId===st.id);
  const pop=GT_popularity(st);
  const best=GT_bestScore(st);
  const locked=!isUnlocked(st.id);
  const lin=st.lineage?esc(st.lineage):'Foundation genetics';
  const crosses=GT_crossesOf(st);
  const sg=(S.stats.strainGrown||{})[st.id];
  let html='<div class="ge-screen">'+screenHead('genetics',st.name.toUpperCase());
  /* hero */
  html+='<div class="ge-card ge-strain-hero"><div class="ge-strain-art">'+flowerSVG(strainSeed(st),'strain-flower')+'</div>'+
    '<h2 class="ge-h1">'+esc(st.name)+'</h2>'+
    '<div class="ge-spec-badges"><span class="ge-pill ge-pill-neutral">'+GT_typeLabel(st).toUpperCase()+'</span>'+GT_rarityBadge(GT_rarity(st))+(st.custom?'<span class="ge-badge">CUSTOM</span>':'')+'</div>'+
    '<div class="ge-spec-lin">'+icon('dna','ge-ic-sm')+'<span>'+lin+'</span></div>'+
    '<div class="ge-datarow"><span>Breeder / Origin</span><b>'+esc(GT_breeder(st))+'</b></div>'+
    '<div class="ge-datarow"><span>Generation</span><b>'+esc(st.generation||st.genLabel||(st.custom?'F1':'Stable'))+'</b></div>'+
    '<div class="ge-datarow"><span>Project 0</span><b>'+GT_p0Status(st)+'</b></div></div>';
  /* genetic potential */
  const bars=[['Potency',st.pot],['Yield',st.yld],['Terpenes',st.terp],['Resin',st.resin],['Vigor',st.vigor],['Stability',st.stab],['Bag appeal',num(st.bagAppeal,st.pot)]];
  html+='<div class="ge-card"><div class="ge-card-head">'+icon('dna','ge-ic-md')+'<h3>GENETIC POTENTIAL</h3></div>'+
    bars.map(b=>'<div class="ge-progress-meta"><span>'+b[0]+'</span><b>'+Math.round(num(b[1],0))+'</b></div><div class="ge-progress"><i style="width:'+clamp(Math.round(num(b[1],0)),0,100)+'%"></i></div>').join('')+
    '<div class="ge-divider"></div>'+
    '<div class="ge-datarow"><span>Growth speed</span><b class="ge-num">'+clamp(Math.round(120-num(st.ft,60)),5,99)+'</b></div>'+
    '<div class="ge-datarow"><span>Flower time</span><b class="ge-num">'+st.ft+' days</b></div>'+
    '<div class="ge-datarow"><span>Stress resistance</span><b class="ge-num">'+num(st.stressTol,num(st.stab,80))+'</b></div>'+
    '<div class="ge-datarow"><span>Difficulty</span><b>'+GT_difficulty(st)+'</b></div></div>';
  /* terpene profile */
  html+='<div class="ge-card"><div class="ge-card-head">'+icon('terp','ge-ic-md')+'<h3>TERPENE PROFILE</h3></div><div class="ge-tags">'+
    GT_terpeneProfile(st).map(t=>'<span class="ge-pill ge-pill-neutral">'+icon('terp','ge-ic-sm')+esc(t)+'</span>').join('')+'</div></div>';
  /* phenotype history */
  html+='<div class="ge-card"><div class="ge-card-head">'+icon('hunt','ge-ic-md')+'<h3>PHENOTYPE HISTORY</h3><span class="ge-spread ge-num ge-muted">'+(ph?int(ph.tested,0):0)+' TESTED</span></div>'+
    (ph?'<div class="ge-tiles">'+
      '<div class="ge-metric-tile"><div class="ge-metric-value ge-num">'+int(ph.tested,0)+'</div><div class="ge-metric-label">Tested</div></div>'+
      '<div class="ge-metric-tile"><div class="ge-metric-value ge-num">'+int(ph.harvested,0)+'</div><div class="ge-metric-label">Harvested</div></div>'+
      '<div class="ge-metric-tile"><div class="ge-metric-value ge-num">'+int(ph.keepers,0)+'</div><div class="ge-metric-label">Keepers</div></div>'+
      '<div class="ge-metric-tile"><div class="ge-metric-value ge-num">'+int(ph.legendary,0)+'</div><div class="ge-metric-label">Legendary</div></div></div>'+
      (best>0?'<div class="ge-datarow"><span>Best pheno</span><b class="ge-num">#'+int(ph.bestPheno,0)+' ('+Math.round(best)+')</b></div>':'')+
      '<div class="ge-datarow"><span>Elite expressions</span><b class="ge-num">'+int(ph.elite,0)+'</b></div>'
    :'<p class="ge-muted">No phenotypes tested yet. Grow this strain to discover them.</p>')+'</div>';
  /* harvest history (recorded data only) */
  let bq=0,by=0; keepers.forEach(k=>{ bq=Math.max(bq,num(k.bestQuality,0)); by=Math.max(by,num(k.bestYield,0)); });
  html+='<div class="ge-card"><div class="ge-card-head">'+icon('harvest','ge-ic-md')+'<h3>HARVEST HISTORY</h3></div>'+
    (sg?'<div class="ge-datarow"><span>Times grown</span><b class="ge-num">'+int(sg.count,0)+'</b></div>':'<p class="ge-muted">Never grown yet.</p>')+
    (bq>0?'<div class="ge-datarow"><span>Best keeper quality</span><b class="ge-num">Q'+Math.round(bq)+'</b></div><div class="ge-datarow"><span>Best keeper yield</span><b class="ge-num">'+by+' oz</b></div>':'')+
    '<div class="ge-datarow"><span>Market popularity</span><b>'+GT_demandPill(st)+' <span class="ge-num ge-muted">'+Math.round(pop)+'/100</span></b></div></div>';
  html+=GT_codexHistoryHTML(st); /* P2-W2 Living Codex: YOUR HISTORY section */
  /* clones */
  const clonesTaken=mothers.reduce((s,m)=>s+int(m.clonesTaken,0),0);
  html+='<div class="ge-card"><div class="ge-card-head">'+icon('clone','ge-ic-md')+'<h3>CLONES</h3></div>'+
    (mothers.length?'<div class="ge-datarow"><span>Mother plants</span><b class="ge-num">'+mothers.length+'</b></div><div class="ge-datarow"><span>Clones taken</span><b class="ge-num">'+clonesTaken+'</b></div>'
    :'<p class="ge-muted">No mothers of this strain. Promote a keeper to preserve it forever.</p>')+'</div>';
  /* breeding */
  html+='<div class="ge-card"><div class="ge-card-head">'+icon('breeding','ge-ic-md')+'<h3>BREEDING</h3></div>'+
    (crosses.length?crosses.slice(0,3).map(c=>'<div class="ge-datarow"><span class="ge-truncate">'+esc(c.name)+'</span><b class="ge-num">R'+Math.round(num(c.resin,0))+'</b></div>').join('')+'<p class="ge-caption">'+crosses.length+' cross(es) descend from this strain.</p>':'<p class="ge-muted">No crosses from this strain yet.</p>')+
    (locked?'':'<button class="ge-btn ge-btn-ghost ge-btn-block" id="sd-breed">'+icon('dna','ge-ic-md')+'BREED WITH THIS STRAIN</button>')+'</div>';
  /* lineage */
  html+='<div class="ge-card"><div class="ge-card-head">'+icon('scroll','ge-ic-md')+'<h3>LINEAGE</h3></div>'+
    '<p class="ge-body ge-muted">'+lin+'</p>'+
    '<button class="ge-btn ge-btn-ghost ge-btn-block" id="sd-lineage">'+icon('dna','ge-ic-md')+'VIEW LINEAGE TREE</button></div>';
  /* keepers of this strain */
  html+='<div class="ge-card"><div class="ge-card-head">'+icon('crown','ge-ic-md')+'<h3>KEEPERS</h3><span class="ge-spread ge-num ge-muted">'+keepers.length+'</span></div>'+
    (keepers.length?keepers.slice(0,4).map(k=>'<div class="ge-datarow"><span>'+icon('crown','ge-ic-sm')+' #'+k.phenoNum+' '+GT_rarityBadge(k.rarity||'common')+'</span><b class="ge-num">'+Math.round(num(k.overall,0))+'</b></div>').join(''):'<p class="ge-muted">No keepers of this strain yet.</p>')+
    (locked?'':'<button class="ge-btn ge-btn-gold ge-btn-block" id="sd-keepers">'+icon('keepers','ge-ic-md')+'VIEW KEEPERS ('+keepers.length+')</button>')+'</div>';
  /* actions */
  html+='<div class="ge-card"><div class="ge-card-head">'+icon('star','ge-ic-md')+'<h3>ACTIONS</h3></div><div class="ge-stack">'+
    (locked?'<p class="ge-caption">'+icon('lock','ge-ic-md')+' Locked genetics.</p>':
    '<button class="ge-btn ge-btn-primary" id="sd-grow">'+icon('grow','ge-ic-md')+'GROW THIS</button>'+
    '<button class="ge-btn ge-btn-ghost" id="sd-hunt">'+icon('hunt','ge-ic-md')+'START PHENO HUNT</button>'+
    '<button class="ge-btn ge-btn-ghost" id="sd-phenos">'+icon('hunt','ge-ic-md')+'VIEW PHENOTYPES</button>'+
    (st.custom&&!st.ceremonyFired?'<button class="ge-btn ge-btn-gold" id="sd-stable">'+icon('crown-gold','ge-ic-md')+'DECLARE STABLE</button>':'')+
    (st.custom&&st.ceremonyFired?'<p class="ge-caption">'+icon('crown-gold','ge-ic-sm')+' Honored genetic \u2014 ceremony complete.</p>':''))+
    '<button class="ge-btn ge-btn-ghost" onclick="show(\'genetics\')">BACK TO VAULT</button></div></div>';
  html+='</div>';
  r.innerHTML=html;
  if(locked) return;
  $('sd-grow').onclick=()=>{ if(plantSeed(st.id)){ toast(icon('grow','ge-ic-md')+' Planted '+esc(st.name)); show('grow'); } };
  $('sd-hunt').onclick=()=>startPhenoHunt(st.id);
  $('sd-phenos').onclick=()=>GT_phenoListModal(st);
  $('sd-keepers').onclick=()=>{ keeperFilter=st.id; keeperPage=0; show('keepers'); };
  const sb=$('sd-breed'); if(sb) sb.onclick=()=>{ try{ breedA=st.id; }catch(e){} show('breeding'); };
  const sds=$('sd-stable'); if(sds) sds.onclick=()=>{ if(P3W2_declareStable(st.id)&&current==='strain') RENDER.strain(); };
  const sl=$('sd-lineage'); if(sl) sl.onclick=()=>{
    if(typeof GX_lineageHTML==='function'){
      const m=modal('<div class="ge-modal-head">'+icon('dna','ge-ic-md')+'<h3>LINEAGE TREE</h3></div><div class="ge-modal-body"><div id="gx-lin-box">'+GX_lineageHTML(st.id)+'</div></div><div class="ge-modal-foot"><button class="ge-btn ge-btn-ghost" id="gx-lin-x">CLOSE</button></div>');
      GX_wireLineage(m.querySelector('#gx-lin-box'));
      m.querySelector('#gx-lin-x').onclick=()=>closeModal(m);
    } else toast('Lineage not available for base strains.');
  };
};

function GT_phenoListModal(st){
  const ph=S.phenoHistory[st.id];
  const keepers=(S.keepers||[]).filter(k=>k.strainId===st.id);
  let html='<div class="ge-modal-head">'+icon('hunt','ge-ic-md')+'<h3>PHENOTYPES — '+esc(st.name)+'</h3></div><div class="ge-modal-body">';
  if(ph){
    html+='<div class="ge-datarow"><span>Seeds tested</span><b class="ge-num">'+int(ph.tested,0)+'</b></div>'+
      '<div class="ge-datarow"><span>Harvested</span><b class="ge-num">'+int(ph.harvested,0)+'</b></div>'+
      '<div class="ge-datarow"><span>Keepers</span><b class="ge-num">'+int(ph.keepers,0)+'</b></div>'+
      '<div class="ge-datarow"><span>Elite</span><b class="ge-num">'+int(ph.elite,0)+'</b></div>'+
      '<div class="ge-datarow"><span>Legendary</span><b class="ge-num">'+int(ph.legendary,0)+'</b></div>'+
      (num(ph.bestScore,0)>0?'<div class="ge-datarow"><span>Best</span><b class="ge-num">#'+int(ph.bestPheno,0)+' ('+Math.round(ph.bestScore)+')</b></div>':'');
  } else html+='<p class="ge-muted">No phenotypes tested yet. Grow this strain to discover them.</p>';
  if(keepers.length){
    html+='<div class="ge-section-title">'+icon('crown','ge-ic-md')+'KEEPERS</div>'+keepers.map(k=>
      '<div class="ge-datarow"><span>'+icon('crown','ge-ic-sm')+' #'+k.phenoNum+' '+GT_rarityBadge(k.rarity||'common')+'</span><b class="ge-num">'+Math.round(num(k.overall,0))+'</b></div>').join('');
  }
  html+='</div><div class="ge-modal-foot"><button class="ge-btn ge-btn-ghost" id="gt-pl-x">CLOSE</button></div>';
  const m=modal(html);
  m.querySelector('#gt-pl-x').onclick=()=>closeModal(m);
}

/* register the strain screen */
(function(){
  try{
    if(!SCREENS.includes('strain')) SCREENS.push('strain');
  }catch(e){}
})();
'use strict';
/* ============================================================================
   AM_ RANK-GATED AUTOMATION MODULE — "Shocker Ownz Grow Empire"
   ----------------------------------------------------------------------------
   Self-contained expansion module. Do NOT edit game.js for this module.
   Every top-level identifier is AM_-prefixed.

   HOOK POINTS (wired by parent / integrator):
     1. AM_migrate()        — call on new game + on load (before first render).
     2. AM_dayTick()        — call inside advanceDay(), BEFORE the plant loop
                              that drains p.water / p.nutrition
                              (recommended: right after the envScore line).
     3. RENDER.automation   — assigned by this file; renders the control center.
     4. AM_wireAutomation() — called at the end of RENDER.automation.
     5. AM_init()           — idempotent screen/menu registration; auto-runs
                              on load and is safe to call again after game init.
     6. AM_menuItem()       — returns {id:'automation',...} for MENU_ITEMS.

   Balance: nothing owned at start; rank gates + purchase + daily costs enforced.
   ============================================================================ */

/* ---------------- safe local aliases (never assume game.js helpers exist) --- */
function AM_num(v,d){ const n=Number(v); return (isFinite(n)?n:0)||(d||0); }
function AM_int(v,d){ const n=parseInt(v,10); return isFinite(n)?n:(d||0); }
function AM_clamp(v,a,b){ v=AM_num(v,0); return v<a?a:(v>b?b:v); }
function AM_fmt(n){ try{ if(typeof fmt$==='function') return fmt$(n); }catch(e){}
  return '$'+Math.round(AM_num(n,0)).toLocaleString(); }
function AM_esc(s){ try{ if(typeof esc==='function') return esc(s); }catch(e){}
  return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function AM_icon(n,cls){ try{ if(typeof icon==='function') return icon(n,cls); }catch(e){}
  return '<span class="ic-missing"></span>'; }
function AM_toast(m){ try{ if(typeof toast==='function'){ toast(m); return; } }catch(e){}
  try{ if(typeof console!=='undefined') console.log('[AM]',m); }catch(e2){} }
function AM_save(){ try{ if(typeof save==='function') save(); }catch(e){}
  try{ if(typeof updateHUD==='function') updateHUD(); }catch(e2){} }
function AM_rankIdx(){ try{ if(typeof TY_rankIdx==='function') return AM_clamp(TY_rankIdx(),0,12); }catch(e){} return 0; }
function AM_rankName(i){ try{ if(typeof TY_RANKS!=='undefined'&&TY_RANKS[i]) return TY_RANKS[i].name; }catch(e){}
  return 'RANK '+i; }
function AM_hasS(){ try{ return (typeof S!=='undefined')&&!!S; }catch(e){ return false; } }

/* ---------------- system definitions ---------------------------------------
   rankGate = minimum TY_RANKS index (0 STREET ROOKIE … 5 LOCAL BOSS …
   7 DISPENSARY BOSS, 8 BREEDER, 9 SUPPLIER, 10 INDUSTRY BOSS, 11 MOGUL,
   12 LEGEND).
   P3-W4 TECH TREE: systems are ordered as an earned chain — each tier
   requires the previous tier installed (AM_chainPrev). Beyond the rank
   gate, every tier carries a REAL combination of gates: lvl (player
   level), rep (reputation), fac (facility tier index), mission (mission
   id that must be complete), plus the cash cost. AM_SYSTEMS key order
   matches the chain: BASIC TIMERS is the entry point.                        */
const AM_SYSTEMS={
  timers:{
    name:'Basic Timers', ico:'timer',
    desc:'Scheduled micro-watering on a timer — the first machine. Weaker than a real rig, but it never sleeps.',
    rankGate:2, lvl:1, rep:0, fac:0, mission:null,
    cost:1500, dailyCost:12, power:2, capacity:48,
    efficiency:0.85, reliability:0.98
  },
  water:{
    name:'Auto-Irrigation Rig', ico:'water',
    desc:'Drip lines keep the canopy hydrated around the clock.',
    rankGate:5, lvl:3, rep:25, fac:0, mission:null,
    cost:7500, dailyCost:35, power:8, capacity:24,
    efficiency:0.92, reliability:0.95
  },
  feed:{
    name:'Nutrient Doser', ico:'feed',
    desc:'Precision fertigation keeps every plant fed, never burned.',
    rankGate:7, lvl:6, rep:100, fac:1, mission:null,
    cost:18000, dailyCost:60, power:6, capacity:32,
    efficiency:0.90, reliability:0.94
  },
  envctrl:{
    name:'Environment Controller', ico:'hvac',
    desc:'Holds the room at a fixed 76°F / 55% RH around the clock. No custom targets — that is what the Climate Hub is for.',
    rankGate:8, lvl:8, rep:200, fac:2, mission:null,
    cost:22000, dailyCost:70, power:25, capacity:40,
    efficiency:0.88, reliability:0.94
  },
  irrctrl:{
    name:'Irrigation Controller', ico:'irrigation',
    desc:'High-capacity precision irrigation — deeper watering, more plants, smarter scheduling.',
    rankGate:8, lvl:10, rep:300, fac:3, mission:'em-warehouse',
    cost:35000, dailyCost:95, power:12, capacity:48,
    efficiency:0.94, reliability:0.96
  },
  light:{
    name:'Smart Light Array', ico:'light',
    desc:'Tracks each strain\u2019s sweet spot and rides the dimmer for you.',
    rankGate:8, lvl:11, rep:400, fac:3, mission:null,
    cost:30000, dailyCost:85, power:40, capacity:40,
    efficiency:0.93, reliability:0.96
  },
  climate:{
    name:'Climate Control Hub', ico:'temp',
    desc:'Holds your target temperature and humidity against the weather.',
    rankGate:8, lvl:12, rep:500, fac:4, mission:null,
    cost:45000, dailyCost:120, power:55, capacity:48,
    efficiency:0.91, reliability:0.95
  },
  processing:{
    name:'Processing Line', ico:'jar',
    desc:'A second shift in the lab — jobs cure and finish faster.',
    rankGate:9, lvl:13, rep:650, fac:4, mission:null,
    cost:60000, dailyCost:150, power:25, capacity:12,
    efficiency:0.95, reliability:0.97
  },
  restock:{
    name:'Auto-Restock Runner', ico:'dispensary',
    desc:'Finished product gets packaged and moved to dispensary shelves.',
    rankGate:10, lvl:14, rep:800, fac:5, mission:'p0-vault',
    cost:95000, dailyCost:200, power:4, capacity:20,
    efficiency:0.97, reliability:0.98
  },
  manager:{
    name:'Facility Manager AI', ico:'crew',
    desc:'Assign a hired employee to supervise every system — boosts efficiency.',
    rankGate:11, lvl:16, rep:1000, fac:5, mission:null,
    cost:150000, dailyCost:300, power:10, capacity:64,
    efficiency:1.00, reliability:0.99
  },
  growai:{
    name:'Advanced Grow AI', ico:'aicore',
    desc:'The capstone. Coordinates every installed system (+5% fleet efficiency) and runs daily diagnostics. It advises — it never decides.',
    rankGate:12, lvl:18, rep:1500, fac:7, mission:'em-p0fac',
    cost:250000, dailyCost:450, power:15, capacity:128,
    efficiency:1.00, reliability:0.99
  }
};
/* P3-W4: the tech-tree chain — render, migration, purchase and day-tick order. */
const AM_ORDER=['timers','water','feed','envctrl','irrctrl','light','climate','processing','restock','manager','growai'];
/* P3-W4: no-skip — each tier requires the previous tier installed. */
function AM_chainPrev(id){
  var i=AM_ORDER.indexOf(id);
  return i>0?AM_ORDER[i-1]:null;
}

/* ---------------- state ---------------------------------------------------- */
function AM_defaultAm(){
  return {
    timers:{owned:false,on:false},
    water:{owned:false,on:false},
    feed:{owned:false,on:false},
    envctrl:{owned:false,on:false},
    irrctrl:{owned:false,on:false},
    light:{owned:false,on:false},
    climate:{owned:false,on:false,tempTarget:76,rhTarget:55},
    processing:{owned:false,on:false},
    restock:{owned:false,on:false},
    manager:{owned:false,on:false,empId:null},
    growai:{owned:false,on:false},
    lastCost:0,
    notes:[]
  };
}
/* Idempotent migration: old saves / new games always get a safe S.am. */
function AM_migrate(){
  if(!AM_hasS()) return false;
  var d=AM_defaultAm();
  if(!S.am||typeof S.am!=='object') S.am=d;
  AM_ORDER.forEach(function(k){
    var cur=S.am[k];
    if(!cur||typeof cur!=='object') cur={};
    var fresh=d[k];
    Object.keys(fresh).forEach(function(f){
      if(typeof cur[f]==='undefined') cur[f]=fresh[f];
    });
    S.am[k]=cur;
  });
  if(typeof S.am.lastCost==='undefined') S.am.lastCost=0;
  if(!Array.isArray(S.am.notes)) S.am.notes=[];
  /* clamp climate targets into sane bounds */
  S.am.climate.tempTarget=AM_clamp(S.am.climate.tempTarget,60,90);
  S.am.climate.rhTarget=AM_clamp(S.am.climate.rhTarget,30,80);
  return true;
}
function AM_rankMet(id){
  var sys=AM_SYSTEMS[id]; if(!sys) return false;
  return AM_rankIdx()>=sys.rankGate;
}
/* ---------------- P3-W4: earned-gate inspection ---------------------------
   Every tier's requirements as data: rank, previous tree tier, player
   level, reputation, facility tier, mission completion, cash. Drives
   AM_buy enforcement and the WHAT I WANT / WHAT I NEED / HOW CLOSE UI. */
function AM_gateList(id){
  var sys=AM_SYSTEMS[id]; if(!sys) return [];
  var out=[];
  function pct(have,need){ need=AM_num(need,0); if(need<=0) return 100; return AM_clamp(Math.round(AM_num(have,0)/need*100),0,100); }
  var r=AM_rankIdx();
  out.push({key:'rank',label:'Rank',need:AM_rankName(sys.rankGate),have:AM_rankName(r),met:r>=AM_num(sys.rankGate,0),pct:pct(r,sys.rankGate)});
  var prev=AM_chainPrev(id);
  if(prev){
    var ps=(typeof S!=='undefined'&&S&&S.am&&S.am[prev])||{};
    out.push({key:'prev',label:'Previous tier',need:AM_SYSTEMS[prev]?AM_SYSTEMS[prev].name:prev,have:ps.owned?'Installed':'Not installed',met:!!ps.owned,pct:ps.owned?100:0,prev:prev});
  }
  var lvl=0, rep=0, fac=0;
  try{ lvl=Math.max(1,parseInt(S.level,10)||1); }catch(e){}
  try{ rep=parseInt(S.reputation,10)||0; }catch(e){}
  try{ fac=parseInt(S.facility,10)||0; }catch(e){}
  out.push({key:'level',label:'Player level',need:AM_num(sys.lvl,1),have:lvl,met:lvl>=AM_num(sys.lvl,1),pct:pct(lvl,sys.lvl)});
  out.push({key:'rep',label:'Reputation',need:AM_num(sys.rep,0),have:rep,met:rep>=AM_num(sys.rep,0),pct:pct(rep,sys.rep)});
  var facName='Starter Tent';
  try{ facName=(typeof FACILITIES!=='undefined'&&FACILITIES[AM_num(sys.fac,0)])?FACILITIES[AM_num(sys.fac,0)].name:('Tier '+sys.fac); }catch(e){}
  out.push({key:'facility',label:'Facility',need:facName,have:(function(){ try{ return (typeof FACILITIES!=='undefined'&&FACILITIES[fac])?FACILITIES[fac].name:'Tier '+fac; }catch(e2){ return 'Tier '+fac; } })(),met:fac>=AM_num(sys.fac,0),pct:pct(fac,sys.fac)});
  if(sys.mission){
    var mDone=false, mName=sys.mission;
    try{ mDone=(typeof P3W4_missionDone==='function')?P3W4_missionDone(sys.mission):false; }catch(e){}
    try{ mName=(typeof P3W4_missionName==='function')?P3W4_missionName(sys.mission):sys.mission; }catch(e){}
    out.push({key:'mission',label:'Mission',need:mName,have:mDone?'Complete':'Incomplete',met:!!mDone,pct:mDone?100:0});
  }
  var cash=0; try{ cash=AM_num(S.cash,0); }catch(e){}
  out.push({key:'cash',label:'Cash',need:AM_fmt(sys.cost),have:AM_fmt(cash),met:cash>=AM_num(sys.cost,0),pct:pct(cash,sys.cost)});
  return out;
}
function AM_gatesMet(id){
  var gates=AM_gateList(id);
  var bad=gates.filter(function(g){ return !g.met; });
  return {ok:bad.length===0, missing:bad, gates:gates};
}
/* Nearest locked tier in the tree — for the Almost-There-style panel. */
function AM_nextLocked(){
  if(!AM_migrate()) return null;
  for(var i=0;i<AM_ORDER.length;i++){
    var k=AM_ORDER[i], st=S.am[k];
    if(st&&!st.owned) return k;
  }
  return null;
}
function AM_sysState(id){
  if(!AM_migrate()) return null;
  return S.am[id]||null;
}

/* ---------------- purchase / toggle -------------------------------------- */
function AM_buy(id){
  var sys=AM_SYSTEMS[id]; if(!sys) return false;
  if(!AM_migrate()) return false;
  var st=S.am[id];
  if(st.owned){ AM_toast('Already installed.'); return false; }
  /* P3-W4: no-skip — each tech-tree tier requires the previous tier installed.
     Saves that own later tiers without the earlier ones are grandfathered:
     this only gates NEW purchases. */
  var prev=AM_chainPrev(id);
  if(prev){
    var ps=S.am[prev];
    if(!ps||!ps.owned){
      AM_toast(AM_icon('lock','ge-ic-md')+' Tech tree builds in order — install <b>'+AM_esc(AM_SYSTEMS[prev].name)+'</b> first.');
      return false;
    }
  }
  /* P3-W4: earned gates — rank + level + reputation + facility + mission. */
  var g=AM_gatesMet(id);
  if(!g.ok){
    var m0=g.missing[0];
    AM_toast(AM_icon('lock','ge-ic-md')+' '+AM_esc(sys.name)+' locked: '+AM_esc(m0.label)+' — need <b>'+AM_esc(String(m0.need))+'</b> (have '+AM_esc(String(m0.have))+').');
    return false;
  }
  if(AM_num(S.cash,0)<sys.cost){
    AM_toast(AM_icon('x','ge-ic-md')+' Need '+AM_fmt(sys.cost)+' for '+AM_esc(sys.name)+'.');
    return false;
  }
  S.cash-=sys.cost;
  st.owned=true; st.on=true;
  AM_toast(AM_icon('check','ge-ic-md')+' '+AM_esc(sys.name)+' installed and ONLINE.');
  AM_save();
  return true;
}

function AM_toggle(id){
  var st=AM_sysState(id); if(!st) return false;
  if(!st.owned) return false;
  st.on=!st.on;
  AM_toast((st.on?AM_icon('check','ge-ic-md'):AM_icon('x','ge-ic-md'))+' '+AM_esc(AM_SYSTEMS[id].name)+(st.on?' online.':' offline.'));
  AM_save();
  return true;
}


/* ---------------- manager boost ------------------------------------------ */
function AM_managerBoost(){
  /* returns {pct, empName, ok} — pct is additive efficiency bonus 0..0.25 */
  var none={pct:0,empName:null,ok:false};
  var st=AM_sysState('manager'); if(!st||!st.owned||!st.on||!st.empId) return none;
  var emp=null;
  try{
    var list=(S.ex&&Array.isArray(S.ex.employees))?S.ex.employees:[];
    for(var i=0;i<list.length;i++){ if(String(list[i].id)===String(st.empId)){ emp=list[i]; break; } }
  }catch(e){}
  if(!emp) return none;
  var skill=AM_clamp(AM_num(emp.skill,0),0,100);
  var pct=(skill/100)*0.25;
  /* capacity limit: too many plants, supervision thins out */
  try{
    var plants=Array.isArray(S.plants)?S.plants.length:0;
    var cap=AM_SYSTEMS.manager.capacity;
    if(plants>cap&&plants>0) pct*=cap/plants;
  }catch(e){}
  /* reliability: even a good manager has an off day */
  var ok=Math.random()<AM_SYSTEMS.manager.reliability;
  if(!ok) return {pct:0,empName:emp.name||'Manager',ok:false};
  return {pct:Math.min(0.25,pct),empName:emp.name||'Manager',ok:true};
}

/* ---------------- daily tick ------------------------------------------------
   Parent calls AM_dayTick() from advanceDay() BEFORE the plant-loop drain.  */
function AM_dayTick(){
  if(!AM_migrate()) return;
  S.am.notes=[];
  S.am.lastCost=0;
  var active=AM_ORDER.filter(function(k){ var s=S.am[k]; return s.owned&&s.on; });
  if(!active.length) return;

  /* --- operating cost: must be covered or everything pauses this tick ---
     P3-W4: Cultivation Empire's Automation Nexus cuts operating costs 15%. */
  var total=0;
  active.forEach(function(k){ total+=AM_num(AM_SYSTEMS[k].dailyCost,0); });
  var costMult=1;
  try{ if(typeof P3W4_autoCostMult==='function') costMult=P3W4_autoCostMult(); }catch(e){}
  total=Math.round(total*costMult);
  if(AM_num(S.cash,0)<total){
    S.am.notes.push('\u23F8\uFE0F Automation PAUSED — need '+AM_fmt(total)+' operating cash, systems stay armed.');
    try{ AM_toast('\u23F8\uFE0F Automation paused: insufficient operating cash.'); }catch(e){}
    return;
  }
  S.cash-=total;
  S.am.lastCost=Math.round(total);

  var mgr=AM_managerBoost();
  if(S.am.manager.owned&&S.am.manager.on){
    if(mgr.empName&&mgr.ok) S.am.notes.push('\uD83D\uDCBC '+AM_esc(mgr.empName)+' supervising: +'+Math.round(mgr.pct*100)+'% efficiency.');
    else if(S.am.manager.empId) S.am.notes.push('\u26A0\uFE0F Facility manager dropped the ball today — no supervision bonus.');
  }

  var live=[];
  try{ live=(Array.isArray(S.plants)?S.plants:[]).filter(function(p){return p&&!p.dead;}); }catch(e){}

  function effOf(k){
    var base=AM_num(AM_SYSTEMS[k].efficiency,0.9);
    /* P3-W4: Advanced Grow AI coordinates the fleet — +5% efficiency aura
       on every other active system. It advises; it never decides. */
    var aura=0;
    try{ var gs=S.am.growai; if(gs&&gs.owned&&gs.on&&k!=='growai') aura=0.05; }catch(e){}
    var e=Math.min(0.99,base+mgr.pct+aura);
    /* daily reliability roll — efficiency is the proxy: higher tier = more reliable */
    var ok=Math.random()<e;
    return {e:ok?e:e*0.35, ok:ok};
  }
  function noteFail(k){
    S.am.notes.push('\u26A0\uFE0F '+AM_esc(AM_SYSTEMS[k].name)+' sputtered today — running weak. Schedule maintenance.');
  }

  /* --- timers (P3-W4): scheduled micro-watering — weaker than a real rig,
         but it trims the daily manual grind --- */
  (function(){
    var st=S.am.timers; if(!st.owned||!st.on) return;
    try{
      var r=effOf('timers'); if(!r.ok) noteFail('timers');
      var n=Math.min(AM_SYSTEMS.timers.capacity,live.length);
      for(var i=0;i<n;i++){ var p=live[i]; p.water=AM_clamp(AM_num(p.water,0)+6*r.e,0,92); p.nutrition=AM_clamp(AM_num(p.nutrition,0)+6*r.e,0,90); }
    }catch(e){}
  })();

  /* --- autoWater: maintain hydration --- */
  (function(){
    var st=S.am.water; if(!st.owned||!st.on) return;
    try{
      var r=effOf('water'); if(!r.ok) noteFail('water');
      var n=Math.min(AM_SYSTEMS.water.capacity,live.length);
      for(var i=0;i<n;i++){ var p=live[i]; p.water=AM_clamp(AM_num(p.water,0)+25*r.e,0,92); }
    }catch(e){}
  })();

  /* --- autoFeed: maintain nutrition --- */
  (function(){
    var st=S.am.feed; if(!st.owned||!st.on) return;
    try{
      var r=effOf('feed'); if(!r.ok) noteFail('feed');
      var n=Math.min(AM_SYSTEMS.feed.capacity,live.length);
      for(var i=0;i<n;i++){ var p=live[i]; p.nutrition=AM_clamp(AM_num(p.nutrition,0)+20*r.e,0,90); }
    }catch(e){}
  })();

  /* --- envctrl (P3-W4): fixed-target environment hold — 76°F / 55% RH.
         No custom targets; the Climate Control Hub is the upgrade. --- */
  (function(){
    var st=S.am.envctrl; if(!st.owned||!st.on) return;
    try{
      if(!S.env||typeof S.env!=='object') return;
      var r=effOf('envctrl'); if(!r.ok) noteFail('envctrl');
      var k=(r.ok?0.25:0.08)*r.e;
      S.env.temp=AM_clamp(AM_num(S.env.temp,76)+(76-AM_num(S.env.temp,76))*k,40,110);
      S.env.humidity=AM_clamp(AM_num(S.env.humidity,55)+(55-AM_num(S.env.humidity,55))*k,5,100);
    }catch(e){}
  })();

  /* --- irrctrl (P3-W4): high-capacity precision irrigation --- */
  (function(){
    var st=S.am.irrctrl; if(!st.owned||!st.on) return;
    try{
      var r=effOf('irrctrl'); if(!r.ok) noteFail('irrctrl');
      var n=Math.min(AM_SYSTEMS.irrctrl.capacity,live.length);
      for(var i=0;i<n;i++){ var p=live[i]; p.water=AM_clamp(AM_num(p.water,0)+32*r.e,0,94); }
    }catch(e){}
  })();

  /* --- autoLight: nudge env.light toward strain-appropriate target (75-90) --- */
  (function(){
    var st=S.am.light; if(!st.owned||!st.on) return;
    try{
      if(!S.env||typeof S.env!=='object') return;
      var r=effOf('light'); if(!r.ok) noteFail('light');
      var sum=0,cnt=0;
      live.forEach(function(p){
        var t=82;
        try{
          if(typeof getStrain==='function'){
            var s=getStrain(p.strainId);
            if(s&&s.type==='indica') t=78;
            else if(s&&s.type==='sativa') t=88;
            else if(s&&s.type==='hybrid') t=83;
          }
        }catch(e){}
        sum+=t; cnt++;
      });
      if(cnt>0){
        var target=AM_clamp(sum/cnt,75,90);
        S.env.light=AM_clamp(AM_num(S.env.light,80)+(target-AM_num(S.env.light,80))*0.35*r.e,0,100);
      }
    }catch(e){}
  })();

  /* --- autoClimate: nudge temp/humidity toward configured targets --- */
  (function(){
    var st=S.am.climate; if(!st.owned||!st.on) return;
    try{
      if(!S.env||typeof S.env!=='object') return;
      var r=effOf('climate');
      /* accuracy scales with efficiency; a failed reliability roll weakens the nudge */
      var k=r.ok?0.4*r.e:0.15*r.e;
      if(!r.ok) noteFail('climate');
      var tt=AM_num(st.tempTarget,76), rh=AM_num(st.rhTarget,55);
      S.env.temp=AM_clamp(AM_num(S.env.temp,76)+(tt-AM_num(S.env.temp,76))*k,40,110);
      S.env.humidity=AM_clamp(AM_num(S.env.humidity,55)+(rh-AM_num(S.env.humidity,55))*k,5,100);
    }catch(e){}
  })();

  /* --- autoProcessing: extra shift — capacity-limited daysLeft advance.
         (The game's own TY_procTick, called daily by TY_tick, still converts
         finished jobs into products; we never call it twice.) --- */
  (function(){
    var st=S.am.processing; if(!st.owned||!st.on) return;
    try{
      if(!S.ty||!Array.isArray(S.ty.proc)||!S.ty.proc.length) return;
      var r=effOf('processing'); if(!r.ok) noteFail('processing');
      var cap=Math.round(AM_SYSTEMS.processing.capacity*(r.ok?1:0.5));
      var n=0;
      for(var i=0;i<S.ty.proc.length&&n<cap;i++){
        var j=S.ty.proc[i];
        if(j&&AM_num(j.daysLeft,1)>0){ j.daysLeft=AM_int(j.daysLeft,1)-1; n++; }
      }
      if(n>0) S.am.notes.push('\u2699\uFE0F Processing line ran an extra shift: '+n+' job'+(n===1?'':'s')+' advanced.');
    }catch(e){}
  })();

  /* --- autoRestock: package finished product → dispensary shelves --- */
  (function(){
    var st=S.am.restock; if(!st.owned||!st.on) return;
    try{
      if(!S.ty||!Array.isArray(S.ty.prod)||!S.ty.prod.length) return;
      var r=effOf('restock'); if(!r.ok) noteFail('restock');
      var cap=Math.round(AM_SYSTEMS.restock.capacity*(r.ok?1:0.5));
      var done=0,spent=0;
      for(var i=0;i<S.ty.prod.length&&done<cap;i++){
        var p=S.ty.prod[i];
        if(!p||p.packaged) continue;
        var cost=Math.ceil(AM_num(p.amount,0)*1.5); /* mirrors TY_packageProd */
        if(AM_num(S.cash,0)<cost) break;
        S.cash-=cost; spent+=cost; p.packaged=true; done++;
      }
      if(done>0){
        S.am.notes.push('\uD83D\uDCE6 Auto-restock packaged '+done+' product'+(done===1?'':'s')+' to dispensary shelves ('+AM_fmt(spent)+' packaging).');
      }
    }catch(e){}
  })();

  /* --- growai (P3-W4): daily diagnostics — read-only warnings, never
         decisions. No auto-selling, no keeper picks, no breeding calls. --- */
  (function(){
    var st=S.am.growai; if(!st.owned||!st.on) return;
    try{
      var r=effOf('growai'); if(!r.ok) noteFail('growai');
      var weak=0;
      for(var i=0;i<live.length;i++){ if(AM_num(live[i].health,100)<40) weak++; }
      if(weak>0) S.am.notes.push('Grow AI diagnostics: '+weak+' plant'+(weak===1?'':'s')+' below 40% health — check the grow room.');
      else S.am.notes.push('Grow AI: fleet nominal, all systems coordinated (+5% efficiency aura).');
    }catch(e){}
  })();

  AM_save();
}

/* ---------------- control center screen ---------------------------------- */
function AM_menuItem(){
  return {id:'automation',ico:'equipment',label:'AUTOMATION'};
}

/* Idempotent registration: SCREENS entry, section#scr-automation with
   div#automation-root, MENU_ITEMS entry. Safe to call any time. */
function AM_init(){
  try{
    if(typeof SCREENS!=='undefined'&&Array.isArray(SCREENS)){
      if(SCREENS.indexOf('automation')<0) SCREENS.push('automation');
    }
    if(typeof document!=='undefined'){
      var exists=null;
      try{ exists=document.getElementById('scr-automation'); }catch(e){}
      if(!exists){
        var sec=document.createElement('section');
        sec.id='scr-automation'; sec.className='screen hidden';
        var d=document.createElement('div'); d.id='automation-root'; sec.appendChild(d);
        var main=null;
        try{ main=document.getElementById('app')||document.querySelector('main'); }catch(e){}
        if(main) main.appendChild(sec);
      }
    }
    if(typeof MENU_ITEMS!=='undefined'&&Array.isArray(MENU_ITEMS)){
      var mi=AM_menuItem();
      var found=false;
      for(var i=0;i<MENU_ITEMS.length;i++){ if(MENU_ITEMS[i]&&MENU_ITEMS[i].id===mi.id){ found=true; break; } }
      if(!found) MENU_ITEMS.push(mi);
    }
  }catch(e){}
  return true;
}

function AM_cardHTML(id){
  var sys=AM_SYSTEMS[id];
  var st=AM_sysState(id)||{owned:false,on:false};
  var owned=!!st.owned, on=!!st.on;
  var gateMet=AM_rankMet(id);
  var h='<div class="ge-card ge-am-card" data-am-card="'+id+'">';
  h+='<div class="ge-am-head"><span class="ge-am-ico">'+AM_icon(sys.ico,'ge-ic-lg')+'</span>';
  h+='<div><div class="ge-am-name">'+AM_esc(sys.name)+'</div>';
  h+='<div class="ge-am-status">'+(owned?(on?PF_pill('optimal','check','ONLINE'):PF_pill('neutral','x','OFFLINE')):PF_pill('neutral','lock','LOCKED'))+'</div></div></div>';
  h+='<p class="ge-caption ge-muted ge-am-desc">'+AM_esc(sys.desc)+'</p>';
  h+='<div class="ge-am-stats">';
  h+=PF_kv('Rank required','<b>'+AM_esc(AM_rankName(sys.rankGate))+'</b>');
  h+=PF_kv('Purchase','<b class="ge-num">'+AM_fmt(sys.cost)+'</b>');
  h+=PF_kv('Operating','<b class="ge-num">'+AM_fmt(sys.dailyCost)+'/day</b>');
  h+=PF_kv('Power draw','<b>'+AM_icon('lighting','ge-ic-sm')+' '+sys.power+'</b>');
  h+=PF_kv('Capacity','<b class="ge-num">'+sys.capacity+(id==='processing'?' jobs':id==='restock'?' pkgs':' plants')+'</b>');
  h+=PF_kv('Efficiency','<b class="ge-num">'+Math.round(sys.efficiency*100)+'%</b>');
  h+=PF_kv('Reliability','<b class="ge-num">'+Math.round(sys.reliability*100)+'%</b>');
  h+='</div>';

  /* P3-W4: earned-gate requirements — WHAT I NEED, per gate */
  if(!owned){
    var gates=AM_gateList(id);
    h+='<div class="ge-am-reqs"><div class="ge-almost-lbl">REQUIREMENTS</div>';
    gates.forEach(function(g){
      h+='<div class="ge-datarow'+(g.met?'':' ge-am-req-unmet')+'"><span>'+AM_icon(g.met?'check':'lock','ge-ic-sm')+' '+AM_esc(g.label)+'</span><b class="ge-num">'+AM_esc(String(g.have))+' / '+AM_esc(String(g.need))+'</b></div>';
    });
    h+='</div>';
  }

  if(id==='climate'&&owned){
    h+='<div class="ge-am-controls"><label class="ge-field"><span>Target °F</span><input type="number" class="ge-input" inputmode="numeric" enterkeyhint="done" data-am-temp min="60" max="90" step="1" value="'+AM_int(st.tempTarget,76)+'"></label>';
    h+='<label class="ge-field"><span>Target RH%</span><input type="number" class="ge-input" inputmode="numeric" enterkeyhint="done" data-am-rh min="30" max="80" step="1" value="'+AM_int(st.rhTarget,55)+'"></label></div>';
  }
  if(id==='manager'&&owned){
    var emps=[];
    try{ emps=(S.ex&&Array.isArray(S.ex.employees))?S.ex.employees:[]; }catch(e){}
    h+='<div class="ge-am-controls"><label class="ge-field"><span>Supervisor</span><select class="ge-input" data-am-mgr><option value="">— none —</option>';
    emps.forEach(function(e){
      var sel=String(st.empId)===String(e.id)?' selected':'';
      h+='<option value="'+AM_esc(e.id)+'"'+sel+'>'+AM_esc(e.name||'Employee')+' (skill '+AM_int(e.skill,0)+')</option>';
    });
    h+='</select></label></div>';
  }

  h+='<div class="ge-am-actions">';
  if(!owned){
    /* P3-W4: BUY appears when every earned gate is met (cash is checked at
       purchase with its own toast); otherwise the card shows what's missing. */
    var buyable=false;
    try{
      buyable=AM_gateList(id).filter(function(g){ return g.key!=='cash'; }).every(function(g){ return g.met; });
    }catch(e){ buyable=gateMet; }
    if(buyable){
      h+='<button class="ge-btn ge-btn-gold ge-btn-block" data-am-buy="'+id+'">'+AM_icon('cash','ge-ic-md')+'BUY '+AM_fmt(sys.cost)+'</button>';
    }else{
      var miss=[];
      try{ miss=AM_gateList(id).filter(function(g){ return !g.met&&g.key!=='cash'; }); }catch(e){}
      h+='<button class="ge-btn ge-btn-block" disabled>'+AM_icon('lock','ge-ic-md')+'LOCKED</button>';
      h+='<p class="ge-caption ge-muted">'+AM_icon('lock','ge-ic-sm')+' '+(miss.length?('Next: <b>'+AM_esc(miss[0].label)+'</b> — need '+AM_esc(String(miss[0].need))):'Requires <b>'+AM_esc(AM_rankName(sys.rankGate))+'</b> rank')+'.</p>';
    }
  }else{
    h+='<button class="ge-btn ge-btn-block '+(on?'ge-btn-ghost':'ge-btn-primary')+'" data-am-toggle="'+id+'">'+(on?AM_icon('x','ge-ic-md')+'TURN OFF':AM_icon('check','ge-ic-md')+'TURN ON')+'</button>';
  }
  h+='</div></div>';
  return h;
}


function AM_screenHead(){
  try{ if(typeof screenHead==='function') return screenHead('equipment','AUTOMATION CONTROL CENTER'); }catch(e){}
  return '<div class="screenhead"><h2>AUTOMATION CONTROL CENTER</h2></div>';
}

/* P3-W4: NEXT IN THE TECH TREE — Almost-There-style panel (WHAT I WANT /
   WHAT I NEED / HOW CLOSE) for the nearest locked tier. Read-only. */
function AM_nextTreeHTML(){
  try{
    if(!AM_migrate()) return '';
    var next=AM_nextLocked();
    var h='<div class="ge-card ge-almost-card"><div class="ge-card-head"><h3>'+AM_icon('star','ge-ic-md')+'NEXT IN THE TECH TREE</h3></div>';
    if(!next){
      return h+'<div class="ge-almost-row"><div class="ge-datarow"><span class="ge-almost-lbl">WHAT I WANT</span><b>Everything</b></div>'+
        '<div class="ge-datarow"><span class="ge-almost-lbl">WHAT I NEED</span><span class="ge-num">Nothing — the machine runs itself</span></div>'+
        /* P3-W6 endgame cross-link: maxed automation is a handoff, not a finish line. */
        '<div class="ge-datarow"><span class="ge-almost-lbl">NEXT FRONTIER</span><span class="ge-muted">Breed the genetics it grows.</span></div>'+
        '<div class="ge-btn-row"><button class="ge-btn ge-btn-ghost ge-btn-sm" data-ex-go="breeding">BREEDING LAB</button></div></div></div>';
    }
    var sys=AM_SYSTEMS[next], gates=AM_gateList(next);
    var unmet=gates.filter(function(g){ return !g.met; });
    var prev=AM_chainPrev(next);
    var pos=AM_ORDER.indexOf(next)+1;
    h+='<div class="ge-almost-row">';
    h+='<div class="ge-datarow"><span class="ge-almost-lbl">WHAT I WANT</span><b>'+AM_esc(sys.name)+'</b></div>';
    h+='<div class="ge-caption ge-muted">Tier '+pos+' of '+AM_ORDER.length+' — '+AM_esc(sys.desc)+'</div>';
    h+='<div class="ge-datarow"><span class="ge-almost-lbl">WHAT I NEED</span><span class="ge-num">'+(unmet.length?unmet.map(function(g){ return AM_esc(g.label)+': '+AM_esc(String(g.need)); }).join(' · '):'Ready to install — '+AM_fmt(sys.cost))+'</span></div>';
    if(prev&&!(S.am&&S.am[prev]&&S.am[prev].owned)){
      h+='<div class="ge-caption ge-muted">'+AM_icon('lock','ge-ic-sm')+' The tree builds in order — <b>'+AM_esc(AM_SYSTEMS[prev].name)+'</b> comes first.</div>';
    }
    h+='<div class="ge-almost-lbl">HOW CLOSE AM I</div>';
    gates.forEach(function(g){
      h+='<div class="ge-progress-meta"><span class="ge-caption ge-muted">'+AM_esc(g.label)+': '+AM_esc(String(g.have))+' / '+AM_esc(String(g.need))+'</span><b class="ge-num">'+g.pct+'%</b></div>';
      h+='<div class="ge-progress"><i style="width:'+AM_clamp(g.pct,0,100)+'%"></i></div>';
    });
    var avg=Math.round(gates.reduce(function(a,g){ return a+g.pct; },0)/Math.max(1,gates.length));
    h+='<div class="ge-progress-meta"><span><b>OVERALL</b></span><b class="ge-num">'+avg+'%</b></div>';
    h+='<div class="ge-btn-row"><button class="ge-btn ge-btn-ghost ge-btn-sm" onclick="show(\'techtree\')">VIEW FULL TREE</button></div>';
    h+='</div></div>';
    return h;
  }catch(e){ return ''; }
}

/* RENDER.automation — parent registers 'automation' in SCREENS and adds the
   #automation-root section to index.html; AM_init() also does it guarded. */
try{
  if(typeof RENDER!=='undefined'&&RENDER){
    RENDER.automation=function(){
      var r=null;
      try{ r=document.getElementById('automation-root'); }catch(e){}
      if(!r) return;
      if(!AM_migrate()) return;
      var online=0,total=0;
      AM_ORDER.forEach(function(k){
        var s=S.am[k];
        if(s.owned){ if(s.on){ online++; total+=AM_num(AM_SYSTEMS[k].dailyCost,0); } }
      });
      var h='<div class="ge-screen">'+AM_screenHead();
      h+='<div class="ge-card"><div class="ge-card-head"><h3>'+AM_icon('equipment','ge-ic-lg')+'FLEET STATUS</h3></div>';
      h+=PF_kv(AM_icon('equipment','ge-ic-sm')+' Systems online','<b class="ge-num">'+online+' / '+AM_ORDER.length+'</b>');
      h+=PF_kv(AM_icon('cash','ge-ic-sm')+' Operating cost (active)','<b class="ge-num">'+AM_fmt(total)+'/day</b>');
      h+=PF_kv(AM_icon('day','ge-ic-sm')+' Last day charged','<b class="ge-num">'+AM_fmt(S.am.lastCost)+'</b>');
      h+=PF_kv(AM_icon('star','ge-ic-sm')+' Your rank','<b>'+AM_esc(AM_rankName(AM_rankIdx()))+'</b>')+'</div>';
      h+=AM_nextTreeHTML(); /* P3-W4: nearest locked tier, Almost-There style */
      if(S.am.notes&&S.am.notes.length){
        h+='<div class="ge-card"><div class="ge-card-head"><h3>'+AM_icon('scroll','ge-ic-lg')+'LAST DAY REPORT</h3></div><ul class="ge-notes">';
        S.am.notes.forEach(function(n){ h+='<li>'+n+'</li>'; });
        h+='</ul></div>';
      }
      h+='<div class="ge-am-grid">';
      AM_ORDER.forEach(function(k){ h+=AM_cardHTML(k); });
      h+='</div>';
      h+='<p class="ge-caption ge-muted ge-center">Automation is earned: each system unlocks at a tycoon rank, costs cash to install, and bills operating costs every day it runs. If cash runs short, systems pause — still armed, still yours.</p>';
      h+='</div>';
      r.innerHTML=h;
      AM_wireAutomation(r);
    };
  }
}catch(e){}


function AM_wireAutomation(root){
  if(!root) return;
  try{
    root.querySelectorAll('[data-am-buy]').forEach(function(b){
      b.onclick=function(){
        if(AM_buy(b.getAttribute('data-am-buy'))){
          try{ if(typeof RENDER!=='undefined'&&RENDER.automation) RENDER.automation(); }catch(e){}
        }
      };
    });
    root.querySelectorAll('[data-am-toggle]').forEach(function(b){
      b.onclick=function(){
        AM_toggle(b.getAttribute('data-am-toggle'));
        try{ if(typeof RENDER!=='undefined'&&RENDER.automation) RENDER.automation(); }catch(e){}
      };
    });
    root.querySelectorAll('[data-am-temp]').forEach(function(inp){
      inp.onchange=function(){
        var st=AM_sysState('climate'); if(!st) return;
        st.tempTarget=AM_clamp(AM_int(inp.value,76),60,90);
        inp.value=st.tempTarget; AM_save();
      };
    });
    root.querySelectorAll('[data-am-rh]').forEach(function(inp){
      inp.onchange=function(){
        var st=AM_sysState('climate'); if(!st) return;
        st.rhTarget=AM_clamp(AM_int(inp.value,55),30,80);
        inp.value=st.rhTarget; AM_save();
      };
    });
    root.querySelectorAll('[data-am-mgr]').forEach(function(sel){
      sel.onchange=function(){
        var st=AM_sysState('manager'); if(!st) return;
        st.empId=sel.value||null;
        AM_toast(AM_icon('users','ge-ic-md')+(st.empId?' Supervisor assigned.':' Supervisor removed.'));
        AM_save();
        try{ if(typeof RENDER!=='undefined'&&RENDER.automation) RENDER.automation(); }catch(e){}
      };
    });
    /* P3-W6: wire endgame cross-link buttons (e.g. maxed tree -> breeding) */
    root.querySelectorAll('[data-ex-go]').forEach(function(b){
      b.onclick=function(){
        try{ if(b.getAttribute('data-ex-tab')&&typeof empireTab!=='undefined') empireTab=b.getAttribute('data-ex-tab'); }catch(e){}
        try{ show(b.getAttribute('data-ex-go')); }catch(e){}
      };
    });
  }catch(e){}
}


/* auto-register on load (idempotent; parent may also call AM_init() later) */
try{ AM_init(); }catch(e){}
'use strict';
/* ============================================================================
   MN_ HARDER MISSIONS — self-contained module for "Shocker Ownz Grow Empire"
   ----------------------------------------------------------------------------
   Drop this file AFTER game.js in index.html. Do NOT edit game.js.

   INTEGRATION (parent does these; nothing here self-executes):
     1. Boot:            MN_register()        -> appends MN_MISSIONS to MISSIONS
     2. normalizeState:  MN_migrate()         -> builds / repairs S.mn
     3. advanceDay end:  MN_dayTick()         -> streaks, plant-loss accounting,
                                                timed-mission expiry, unlock grants
     4. RENDER.missions: add MN_timedHTML(m) into each mission card's HTML,
                         then call MN_wireMissions(cardRoot) after innerHTML set
     5. Carts module:    MN_noteCustomer(n)   -> after serving n customers
     6. Other systems:   MN_hasUnlock('envAuto' | 'advDisp')

   State shape (S.mn):
     { active:{id:{startDay,days,snap:{...}}}, failed:{id:{day,retries}},
       streaks:{key:{days,lastDay}}, unlocks:{envAuto,advDisp},
       customersServed, plantDeaths, deathsToday, prevPlants, prevHarvests,
       lastTickDay }

   Design notes:
     - Difficulty comes from structure: multi-part objectives, timed windows,
       consecutive-day streaks, quality / financial / environment / rank /
       facility gates — not just bigger numbers.
     - Timed missions NEVER auto-start: prog returns [0,target] until the
       START MISSION button is pressed. Expiry only ever marks them failed;
       they are retryable and the save is never touched destructively.
     - prog() functions read only existing S fields (plus this module's S.mn).
       Stats that game.js does not track (customers served, plant deaths) are
       tracked in S.mn by this module.
   ============================================================================ */

/* ---------------- tiny utils (all MN_-prefixed) ---------------- */
const MN_num = (v, d) => { const n = Number(v); return Number.isFinite(n) ? n : (d || 0); };
const MN_int = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : (d || 0); };
const MN_clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function MN_S() { try { return (typeof S !== 'undefined' && S && typeof S === 'object') ? S : null; } catch (e) { return null; } }
function MN_stats() { const s = MN_S(); return (s && s.stats && typeof s.stats === 'object') ? s.stats : {}; }
function MN_plants() { const s = MN_S(); return (s && Array.isArray(s.plants)) ? s.plants : []; }
function MN_avgHealth() {
  const ps = MN_plants(); if (!ps.length) return 0;
  let t = 0; ps.forEach(p => { t += MN_num(p && p.health, 0); }); return t / ps.length;
}
/* "Dialed in" environment: temp 68-82F, humidity 40-60%, light>=70, CO2 800-1500 */
function MN_envGood() {
  const s = MN_S(); if (!s || !s.env || typeof s.env !== 'object') return false;
  const e = s.env;
  return MN_num(e.temp, 0) >= 68 && MN_num(e.temp, 0) <= 82 &&
         MN_num(e.humidity, 0) >= 40 && MN_num(e.humidity, 0) <= 60 &&
         MN_num(e.light, 0) >= 70 && MN_num(e.co2, 0) >= 800 && MN_num(e.co2, 0) <= 1500;
}
function MN_ty() { const s = MN_S(); return (s && s.ty && typeof s.ty === 'object') ? s.ty : null; }
function MN_tyCust() { try { const t = MN_ty(); return (t && t.cust && t.cust.stats && typeof t.cust.stats === 'object') ? t.cust.stats : null; } catch (e) { return null; } }
function MN_tyFin() { try { const t = MN_ty(); return (t && t.fin && typeof t.fin === 'object') ? t.fin : null; } catch (e) { return null; } }
function MN_tyStats() { try { const t = MN_ty(); return (t && t.stats && typeof t.stats === 'object') ? t.stats : null; } catch (e) { return null; } }
/* S.ct guard (dispensary/carts namespace if present; absent on this build) */
function MN_ctStats() { try { const s = MN_S(); return (s && s.ct && s.ct.stats && typeof s.ct.stats === 'object') ? s.ct.stats : null; } catch (e) { return null; } }
/* satisfaction is a 0-100 score in ty.cust.stats (sat/satN) */
function MN_satisfaction() {
  const st = MN_tyCust(); if (!st) return 0;
  const n = MN_num(st.satN, 0); return n > 0 ? MN_num(st.sat, 0) / n : 0;
}
function MN_rankIdx() {
  try { if (typeof TY_rankIdx === 'function') return MN_clamp(MN_int(TY_rankIdx(), 0), 0, 99); } catch (e) {}
  try { const t = MN_ty(); return t ? MN_clamp(MN_int(t.rank, 0), 0, 99) : 0; } catch (e) { return 0; }
}
/* rank gate by index; clamps against TY_RANKS length so it never overshoots */
function MN_rankAtLeast(idx) {
  let len = 99;
  try { if (typeof TY_RANKS !== 'undefined' && Array.isArray(TY_RANKS)) len = TY_RANKS.length; } catch (e) {}
  return MN_rankIdx() >= Math.min(MN_int(idx, 0), Math.max(0, len - 1));
}
/* last n tycoon finance days all profitable? hist entries carry {profit,rev} */
function MN_profitDays(n) {
  const f = MN_tyFin(); if (!f || !Array.isArray(f.hist) || f.hist.length < n) return false;
  const h = f.hist.slice(-n);
  for (let i = 0; i < h.length; i++) { if (MN_num(h[i] && h[i].profit, 0) <= 0) return false; }
  return true;
}
function MN_bestProfitDay() {
  const f = MN_tyFin(); if (!f || !Array.isArray(f.hist)) return 0;
  let m = 0; f.hist.forEach(h => { m = Math.max(m, MN_num(h && h.profit, 0)); }); return m;
}
function MN_crewIds() {
  try {
    if (typeof CREW_DEFS !== 'undefined' && Array.isArray(CREW_DEFS)) return CREW_DEFS.map(c => c.id);
  } catch (e) {}
  return [];
}
function MN_crewCount() {
  const s = MN_S(); const c = (s && s.crew && typeof s.crew === 'object') ? s.crew : {};
  const ids = MN_crewIds();
  if (ids.length) return ids.filter(id => !!c[id]).length;
  return Object.keys(c).filter(k => !!c[k]).length;
}
function MN_crewAll() {
  const ids = MN_crewIds(); if (!ids.length) return MN_crewCount() >= 6;
  const s = MN_S(); const c = (s && s.crew && typeof s.crew === 'object') ? s.crew : {};
  return ids.every(id => !!c[id]);
}
function MN_equipMin() {
  const s = MN_S(); const q = (s && s.equipment && typeof s.equipment === 'object') ? s.equipment : {};
  const vs = Object.keys(q).map(k => MN_int(q[k], 0));
  return vs.length ? Math.min.apply(null, vs) : 0;
}
function MN_unlockedGenetics() {
  try { if (typeof unlockedCount === 'function') { const s = MN_S(); return s ? MN_int(unlockedCount(s), 0) : 0; } } catch (e) {}
  return 0;
}
function MN_p0TrackLevel(trackId) {
  try { if (typeof p0Level === 'function') return MN_int(p0Level(trackId), 0); } catch (e) {}
  return 0;
}
function MN_p0TracksAt(level) {
  let ids = [];
  try { if (typeof P0_TRACKS !== 'undefined' && Array.isArray(P0_TRACKS)) ids = P0_TRACKS.map(t => t.id); } catch (e) {}
  return ids.filter(id => MN_p0TrackLevel(id) >= level).length;
}
function MN_customs() { const s = MN_S(); return (s && Array.isArray(s.customStrains)) ? s.customStrains : []; }
function MN_parts(list) { const done = list.filter(Boolean).length; return [done, list.length]; }

/* ---------------- state ---------------- */
function MN_defaultMn() {
  return {
    active: {}, failed: {}, streaks: {},
    unlocks: { envAuto: false, advDisp: false },
    customersServed: 0,
    plantDeaths: 0, deathsToday: 0,
    flowerDaysGood: 0, /* QA GE-501: flowering days with dialed-in environment */
    prevPlants: 0, prevHarvests: 0,
    lastTickDay: 0
  };
}
function MN_migrate() {
  const s = MN_S(); if (!s) return;
  let m = (s.mn && typeof s.mn === 'object') ? s.mn : {};
  const d = MN_defaultMn();
  Object.keys(d).forEach(k => { if (!(k in m)) m[k] = d[k]; });
  ['active', 'failed', 'streaks', 'unlocks'].forEach(k => { if (!m[k] || typeof m[k] !== 'object') m[k] = {}; });
  m.unlocks.envAuto = !!m.unlocks.envAuto;
  m.unlocks.advDisp = !!m.unlocks.advDisp;
  m.customersServed = MN_int(m.customersServed, 0);
  m.plantDeaths = MN_int(m.plantDeaths, 0);
  m.flowerDaysGood = MN_int(m.flowerDaysGood, 0); /* QA GE-501 */
  m.deathsToday = MN_int(m.deathsToday, 0);
  m.prevPlants = MN_int(m.prevPlants, 0);
  m.prevHarvests = MN_int(m.prevHarvests, 0);
  m.lastTickDay = MN_int(m.lastTickDay, 0);
  s.mn = m;
}
function MN_completed(id) { const s = MN_S(); return !!(s && Array.isArray(s.missionsDone) && s.missionsDone.indexOf(id) >= 0); }
function MN_failed(id) { const s = MN_S(); return !!(s && s.mn && s.mn.failed && s.mn.failed[id]); }
function MN_active(id) { const s = MN_S(); return (s && s.mn && s.mn.active && s.mn.active[id]) || null; }
function MN_def(id) { return MN_MISSIONS.find(m => m && m.id === id) || null; }
function MN_dayIn(id) {
  const a = MN_active(id); if (!a) return 0;
  const s = MN_S(); return Math.max(1, MN_int(s && s.day, 1) - MN_int(a.startDay, 1) + 1);
}
/* stat delta inside the mission window: current - snapshot-at-start */
function MN_delta(id, snapKey, current) {
  const a = MN_active(id);
  const snap = (a && a.snap && typeof a.snap === 'object') ? a.snap : {};
  return MN_num(current, 0) - MN_num(snap[snapKey], 0);
}
function MN_streak(key) {
  const s = MN_S(); if (!s || !s.mn || !s.mn.streaks) return 0;
  const st = s.mn.streaks[key]; return st ? MN_int(st.days, 0) : 0;
}
/* call exactly once per game-day; cond=true keeps/increments the streak */
function MN_bumpStreak(key, cond) {
  const s = MN_S(); if (!s || !s.mn || !s.mn.streaks) return 0;
  const day = MN_int(s.day, 1);
  let st = s.mn.streaks[key];
  if (!st || typeof st !== 'object') st = { days: 0, lastDay: -1 };
  if (cond) {
    st.days = (MN_int(st.lastDay, -1) === day - 1) ? MN_int(st.days, 0) + 1 : 1;
    st.lastDay = day;
  } else {
    st.days = 0; st.lastDay = -1;
  }
  s.mn.streaks[key] = st;
  return st.days;
}

/* ---------------- hooks ---------------- */
/* Call once per game-day, ideally at the END of advanceDay(). */
function MN_dayTick() {
  const s = MN_S(); if (!s) return;
  MN_migrate();
  const day = MN_int(s.day, 1);
  if (MN_int(s.mn.lastTickDay, 0) >= day) return; /* already processed this day */

  /* plant-loss accounting: vanished plants not explained by harvests.
     NOTE: plants that disappear via pheno-lab flows (not harvests) may be
     miscounted as losses; keep lab flows harvest-flagged if you add them. */
  const st = MN_stats();
  const currN = MN_plants().length;
  const harvNow = MN_int(st.harvests, 0);
  const deaths = Math.max(0, MN_int(s.mn.prevPlants, 0) - currN - Math.max(0, harvNow - MN_int(s.mn.prevHarvests, 0)));
  s.mn.deathsToday = deaths;
  s.mn.plantDeaths = MN_int(s.mn.plantDeaths, 0) + deaths;
  s.mn.prevPlants = currN;
  s.mn.prevHarvests = harvNow;

  /* consecutive-day conditions */
  const ps = MN_plants(), avg = MN_avgHealth(), envOk = MN_envGood();
  MN_bumpStreak('mn-canopy-env', ps.length >= 1 && avg >= 90 && envOk);
  MN_bumpStreak('mn-noloss', deaths <= 0 && ps.length >= 2);
  MN_bumpStreak('mn-fullhouse', ps.length >= 8 && avg >= 85);
  MN_bumpStreak('mn-crew', MN_crewAll());

  /* QA GE-501: flowering days with a dialed-in environment (for MASTER CULTIVATOR) */
  try{
    const inFlower=MN_plants().some(p=>{ const stg=(typeof stageOf==='function')?stageOf(p):-1; return stg>=2&&stg<=4; });
    if(inFlower&&envOk) s.mn.flowerDaysGood=MN_int(s.mn.flowerDaysGood,0)+1;
  }catch(e){}

  /* timed-mission expiry / cleanup */
  const act = s.mn.active || {};
  Object.keys(act).forEach(id => {
    const a = act[id]; if (!a) return;
    const m = MN_def(id);
    if (MN_completed(id)) { delete act[id]; return; }
    const days = MN_int((m && m.days) || a.days, 0);
    if (days > 0 && day - MN_int(a.startDay, 1) + 1 > days) {
      delete act[id];
      const prev = (s.mn.failed && s.mn.failed[id]) || { retries: 0 };
      s.mn.failed[id] = { day: day, retries: MN_int(prev.retries, 0) + 1 };
      try { if (typeof toast === 'function') toast('⏱️ Timed mission expired: <b>' + ((m && m.name) || id) + '</b> — retry it from MISSIONS whenever ready.'); } catch (e) {}
    }
  });

  MN_grantUnlocks();
  s.mn.lastTickDay = day;
  try { if (typeof save === 'function') save(); } catch (e) {}
}

/* Call from the carts/dispensary module after serving n customers. */
function MN_noteCustomer(n) {
  const s = MN_S(); if (!s) return;
  MN_migrate();
  s.mn.customersServed = MN_int(s.mn.customersServed, 0) + Math.max(0, MN_int(n == null ? 1 : n, 1));
}

/* Timed-mission opt-in. Snapshots S.stats counters so progress counts
   only inside the window. Safe to call any time; no-ops if invalid. */
function MN_startMission(id) {
  const s = MN_S(); if (!s) return false;
  MN_migrate();
  const m = MN_def(id); if (!m || !m.timed) return false;
  if (MN_completed(id) || MN_active(id)) return false;
  const st = MN_stats();
  s.mn.active[id] = {
    startDay: MN_int(s.day, 1),
    days: MN_int(m.days, 0),
    snap: {
      harvests: MN_num(st.harvests, 0),
      q80Harvests: MN_num(st.q80Harvests, 0),
      highHealthHarvests: MN_num(st.highHealthHarvests, 0),
      lifetimeRevenue: MN_num(st.lifetimeRevenue, 0),
      preserved: MN_num(st.preserved, 0),
      huntsCompleted10: MN_num(st.huntsCompleted10, 0),
      quickTurnarounds: MN_num(st.quickTurnarounds, 0),
      sales: MN_num(st.sales, 0),
      plantDeaths: MN_int(s.mn.plantDeaths, 0),
      phenoTested: MN_num(st.phenoTested, 0), /* QA GE-502: snapshot leak → instant completion */
      keepersFound: MN_num(st.keepersFound, 0),
      customersServed: MN_int(s.mn.customersServed, 0), /* QA GE-501 */
      flowerDaysGood: MN_int(s.mn.flowerDaysGood, 0)
    }
  };
  if (s.mn.failed && s.mn.failed[id]) delete s.mn.failed[id];
  try { if (typeof toast === 'function') toast('⏱️ Timed mission started: <b>' + m.name + '</b> — ' + MN_int(m.days, 0) + ' days. Good luck.'); } catch (e) {}
  try { if (typeof save === 'function') save(); } catch (e) {}
  return true;
}

/* ---------------- unlocks ---------------- */
function MN_hasUnlock(name) {
  try {
    const s = MN_S();
    return !!(s && s.mn && s.mn.unlocks && s.mn.unlocks[name]);
  } catch (e) { return false; }
}
/* Grants S.mn.unlocks flags for completed unlock missions. Called from
   MN_dayTick(); parent may also call it right after checkMissions(). */
function MN_grantUnlocks() {
  const s = MN_S(); if (!s) return;
  MN_migrate();
  MN_MISSIONS.forEach(m => {
    const key = m && m.reward && m.reward.mnUnlock;
    if (!key || typeof key !== 'string') return;
    if (MN_completed(m.id) && !s.mn.unlocks[key]) {
      s.mn.unlocks[key] = true;
      try { if (typeof toast === 'function') toast(icon('check','ge-ic-md')+' System unlocked by <b>' + m.name + '</b>'); } catch (e) {}
    }
  });
}

/* ---------------- UI helpers ---------------- */
/* Timer / START / RETRY block for a timed mission card.
   Parent: add `+ MN_timedHTML(m)` inside the RENDER.missions card HTML. */
function MN_timedHTML(m) {
  if (!m || !m.timed) return '';
  try {
    if (MN_completed(m.id)) return '';
    const a = MN_active(m.id);
    const days = MN_int(m.days, 0);
    if (a) {
      const di = MN_dayIn(m.id);
      const diShow = Math.min(di, Math.max(1, days)); /* QA GE-505: clamp display to the window */
      const left = Math.max(0, days - di + 1);
      const urgent = left<=2;
      return '<div class="ms-timer'+(urgent?' ms-urgent':'')+'">'+icon('clock','ge-ic-md')+
        '<b class="ge-data">MISSION DAY '+diShow+'/'+days+'</b>'+
        '<span class="ms-left'+(urgent?' is-hot':'')+'">'+left+' DAY'+(left===1?'':'S')+' REMAINING</span>'+
        '<div class="ge-progress ge-progress-thin'+(urgent?' ge-progress-bad':'')+'"><i style="width:'+Math.min(100,Math.round(di/Math.max(1,days)*100))+'%"></i></div></div>';
    }
    if (MN_failed(m.id)) {
      return '<div class="ms-timer ms-failed">'+icon('x','ge-ic-md')+
        '<span class="ge-muted">Expired \u2014 retry when ready.</span>'+
        '<button class="ge-btn ge-btn-gold ge-btn-block" data-mn-start="'+m.id+'">RETRY MISSION</button></div>';
    }
    return '<div class="ms-timer">'+icon('clock','ge-ic-md')+
      '<button class="ge-btn ge-btn-primary ge-btn-block" data-mn-start="'+m.id+'">START MISSION</button>'+
      '<span class="ge-muted">'+days+'-day timed mission. Progress only counts after you start.</span></div>';
  } catch (e) { return ''; }
}

/* Parent: call MN_wireMissions(cardRoot) after setting innerHTML in
   RENDER.missions so START/RETRY buttons work. */
function MN_wireMissions(root) {
  try {
    const r = root || ((typeof document !== 'undefined') ? document : null);
    if (!r || !r.querySelectorAll) return;
    r.querySelectorAll('[data-mn-start]').forEach(el => {
      el.onclick = function (e) {
        if (e && e.stopPropagation) e.stopPropagation();
        const id = el.getAttribute('data-mn-start');
        if (MN_startMission(id)) {
          try { if (typeof RENDER !== 'undefined' && RENDER && typeof RENDER.missions === 'function') RENDER.missions(); } catch (err) {}
          MN_wireMissions(r);
        }
      };
    });
  } catch (e) {}
}

/* ---------------- registration ---------------- */
/* Call once at boot (after game.js loads). Appends MN_MISSIONS to the
   game's MISSIONS array with dedupe. Returns number added. */
function MN_register() {
  try {
    if (typeof MISSIONS === 'undefined' || !Array.isArray(MISSIONS)) return 0;
    let added = 0;
    MN_MISSIONS.forEach(m => {
      if (m && m.id && !MISSIONS.some(x => x && x.id === m.id)) { MISSIONS.push(m); added++; }
    });
    return added;
  } catch (e) { return 0; }
}

/* ============================================================================
   MN_MISSIONS — 44 harder missions
   prog(s) -> [cur, target]. Multi-part missions return [partsDone, partsTotal].
   Timed missions return [0, target] until MN_startMission() arms them.
   ============================================================================ */
const MN_MISSIONS = [
 /* ================= CULTIVATION (5) ================= */
 {id:'mn-canopy',cat:'Cultivation',name:'MASTER THE CANOPY',timed:true,days:20,
  desc:'4-part trial, 20 days: (1) 10 consecutive days at 90%+ avg health with dialed environment, (2) 2 premium (80+) harvests, (3) zero plant losses, (4) finish at 90%+ avg health. Reward unlocks ENVIRONMENTAL AUTOMATION.',
  prog:s=>{
    if(!MN_active('mn-canopy')) return [0,4];
    const st=MN_stats();
    return MN_parts([
      MN_streak('mn-canopy-env')>=10,
      MN_delta('mn-canopy','q80Harvests',st.q80Harvests)>=2,
      MN_delta('mn-canopy','plantDeaths',(s.mn&&s.mn.plantDeaths)||0)<=0,
      MN_plants().length>=1&&MN_avgHealth()>=90
    ]);
  },
  reward:{cash:2500,xp:1000,rep:40,p0:6,mnUnlock:'envAuto'}},
 {id:'mn-cult-trifecta',cat:'Cultivation',name:'Hat Trick',timed:true,days:30,
  desc:'Complete 3 harvests at 90%+ plant health within 30 days of starting.',
  prog:s=>{
    if(!MN_active('mn-cult-trifecta')) return [0,3];
    const d=MN_delta('mn-cult-trifecta','highHealthHarvests',MN_stats().highHealthHarvests);
    return [Math.min(MN_int(d,0),3),3];
  },
  reward:{cash:1200,xp:500,rep:15,p0:4}},
 {id:'mn-cult-noloss',cat:'Cultivation',name:'Zero Casualties',
  desc:'14 consecutive days with zero plant deaths and at least 2 plants growing.',
  prog:()=>[Math.min(MN_streak('mn-noloss'),14),14],
  reward:{cash:900,xp:350,rep:15,p0:3}},
 {id:'mn-cult-perpetual',cat:'Cultivation',name:'Perpetual Motion II',timed:true,days:45,
  desc:'2-part trial, 45 days: (1) complete 4 harvests, (2) hold $25,000 lifetime revenue.',
  prog:s=>{
    if(!MN_active('mn-cult-perpetual')) return [0,2];
    const st=MN_stats();
    return MN_parts([
      MN_delta('mn-cult-perpetual','harvests',st.harvests)>=4,
      MN_num(st.lifetimeRevenue,0)>=25000
    ]);
  },
  reward:{cash:1800,xp:700,rep:25,p0:4}},
 {id:'mn-cult-fullhouse',cat:'Cultivation',name:'Full House, No Fold',
  desc:'Keep 8+ plants growing at 85%+ average health for 5 consecutive days.',
  prog:()=>[Math.min(MN_streak('mn-fullhouse'),5),5],
  reward:{cash:1000,xp:400,rep:20,p0:3}},

 /* ================= GENETICS (5) ================= */
 {id:'mn-gen-codex',cat:'Genetics',name:'Living Codex',
  desc:'Own 32 unlocked genetics strains.',
  prog:()=>{ try{ return [Math.min(ownedCount(MN_S()),32),32]; }catch(e){ return [0,32]; } },
  reward:{cash:1500,xp:600,rep:25,p0:5}},
 {id:'mn-gen-vault',cat:'Genetics',name:'Seed Vault Curator',
  desc:'Preserve 10 strains in the vault.',
  prog:s=>[Math.min(MN_num(MN_stats().preserved,0),10),10],
  reward:{cash:1200,xp:500,p0:5}},
 {id:'mn-gen-stability',cat:'Genetics',name:'Stability Doctrine',
  desc:'Own a custom cross with 95+ stability.',
  prog:()=>[MN_customs().some(c=>c&&MN_num(c.stab,0)>=95)?1:0,1],
  reward:{cash:1400,xp:550,p0:5}},
 {id:'mn-gen-triple',cat:'Genetics',name:'Triple Threat',
  desc:'3-part trial: own custom crosses hitting 92+ resin, 90+ potency, AND 90+ terpenes (can be different crosses).',
  prog:()=>{ const p=MN_parts([
    MN_customs().some(c=>c&&MN_num(c.resin,0)>=92),
    MN_customs().some(c=>c&&MN_num(c.pot,0)>=90),
    MN_customs().some(c=>c&&MN_num(c.terp,0)>=90)
  ]); return [p[0],3]; },
  reward:{cash:2200,xp:800,p0:7}},
 {id:'mn-gen-bloodline',cat:'Genetics',name:'Bloodline',
  desc:'2-part trial: (1) use your own cross as a breeding parent, (2) own 10 custom crosses.',
  prog:s=>MN_parts([
    MN_num(MN_stats().secondGenCrosses,0)>=1,
    MN_customs().length>=10
  ]),
  reward:{cash:1800,xp:700,p0:7}},

 /* ================= BUSINESS (4) ================= */
 {id:'mn-biz-million',cat:'Business',name:'Seven Figures',
  desc:'Reach $1,000,000 lifetime revenue.',
  prog:s=>[Math.min(Math.floor(MN_num(MN_stats().lifetimeRevenue,0)),1000000),1000000],
  reward:{cash:5000,xp:1800,rep:60,p0:8}},
 {id:'mn-biz-warchest',cat:'Business',name:'War Chest',
  desc:'Hold $50,000 cash on hand at once.',
  prog:s=>[Math.min(Math.floor(MN_num(s.cash,0)),50000),50000],
  reward:{cash:2500,xp:900,rep:30}},
 {id:'mn-biz-ink',cat:'Business',name:'Black Ink',
  desc:'2-part trial: (1) 10 consecutive profitable days, (2) a single $10,000+ profit day on record.',
  prog:()=>MN_parts([MN_profitDays(10),MN_bestProfitDay()>=10000]),
  reward:{cash:2000,xp:800,rep:25,p0:4}},
 {id:'mn-biz-blitz',cat:'Business',name:'Marketing Blitz',
  desc:'2-part trial: (1) run 10 ad campaigns, (2) reach RUNNER rank or higher.',
  prog:()=>MN_parts([
    MN_num(MN_tyStats()&&MN_tyStats().ads,0)>=10,
    MN_rankAtLeast(2)
  ]),
  reward:{cash:1500,xp:600,rep:20}},

 /* ================= DISPENSARY (4) ================= */
 {id:'mn-brand',cat:'Dispensary',name:'BUILD THE BRAND',
  desc:'5-part trial: 250 reputation • 150 customers served • $25,000 lifetime revenue • 7 consecutive profitable days • 85%+ satisfaction. Reward unlocks the ADVANCED DISPENSARY upgrade.',
  prog:s=>{
    const st=MN_stats();
    const cust=MN_tyCust();
    return MN_parts([
      MN_num(s.reputation,0)>=250,
      MN_int(s.mn&&s.mn.customersServed,0)>=150,
      MN_num(st.lifetimeRevenue,0)>=25000,
      MN_profitDays(7),
      cust&&MN_num(cust.satN,0)>=10&&MN_satisfaction()>=85
    ]);
  },
  reward:{cash:5000,xp:1500,rep:60,p0:8,mnUnlock:'advDisp'}},
 {id:'mn-disp-service',cat:'Dispensary',name:'Five-Star Service',
  desc:'Hold 90%+ customer satisfaction across 50+ rated visits.',
  prog:()=>{ const cust=MN_tyCust(); const n=cust?MN_num(cust.satN,0):0;
    return [(n>=50&&MN_satisfaction()>=90)?1:0,1]; },
  reward:{cash:1600,xp:600,rep:25}},
 {id:'mn-disp-regulars',cat:'Dispensary',name:'Regulars',
  desc:'Earn 100 repeat customers.',
  prog:()=>{ const cust=MN_tyCust(); return [Math.min(MN_num(cust&&cust.repeat,0),100),100]; },
  reward:{cash:1400,xp:550,rep:20}},
 {id:'mn-disp-bulk',cat:'Dispensary',name:'Bulk Mover',
  desc:'2-part trial: (1) complete 25 wholesale contracts, (2) reach BIG PLUG rank or higher.',
  prog:()=>MN_parts([
    MN_num(MN_tyStats()&&MN_tyStats().wholesale,0)>=25,
    MN_rankAtLeast(4)
  ]),
  reward:{cash:2200,xp:800,rep:30,p0:4}},

 /* ================= ECONOMY (4) ================= */
 {id:'mn-eco-tight',cat:'Economy',name:'Tight Ship II',
  desc:'Keep 14 consecutive days profitable.',
  prog:()=>[MN_profitDays(14)?1:0,1],
  reward:{cash:2500,xp:900,rep:25,p0:4}},
 {id:'mn-eco-timer',cat:'Economy',name:'Market Timer',timed:true,days:21,
  desc:'Earn $30,000 of revenue within 21 days of starting.',
  prog:s=>{
    if(!MN_active('mn-eco-timer')) return [0,30000];
    const d=MN_delta('mn-eco-timer','lifetimeRevenue',MN_stats().lifetimeRevenue);
    return [Math.min(Math.floor(Math.max(0,d)),30000),30000];
  },
  reward:{cash:2000,xp:750,rep:20}},
 {id:'mn-eco-survivor',cat:'Economy',name:'Bear Market Survivor',
  desc:'2-part trial: (1) hold $25,000 cash on hand, (2) survive to day 200.',
  prog:s=>MN_parts([MN_num(s.cash,0)>=25000,MN_int(s.day,1)>=200]),
  reward:{cash:3000,xp:1100,rep:35,p0:5}},
 {id:'mn-eco-flip',cat:'Economy',name:'Quick Flip II',timed:true,days:14,
  desc:'Complete a full seed-to-sale turnaround within 14 days of starting.',
  prog:s=>{
    if(!MN_active('mn-eco-flip')) return [0,1];
    return [MN_delta('mn-eco-flip','quickTurnarounds',MN_stats().quickTurnarounds)>=1?1:0,1];
  },
  reward:{cash:1800,xp:700,p0:4}},

 /* ================= EMPLOYEES (4) ================= */
 {id:'mn-crew-dream',cat:'Employees',name:'Dream Team',
  desc:'Employ all 6 crew members at once.',
  prog:()=>[MN_crewAll()?1:0,1],
  reward:{cash:1500,xp:600,rep:20}},
 {id:'mn-crew-loyal',cat:'Employees',name:'Loyalty',
  desc:'Keep your full 6-person crew on payroll for 30 consecutive days — no quits, no firings.',
  prog:()=>[Math.min(MN_streak('mn-crew'),30),30],
  reward:{cash:2500,xp:900,rep:30,p0:4}},
 {id:'mn-crew-delegate',cat:'Employees',name:'Delegation',
  desc:'2-part trial: (1) hire a Facility Manager, (2) reach LOCAL BOSS rank or higher.',
  prog:s=>{ const c=(s.crew&&typeof s.crew==='object')?s.crew:{}; return MN_parts([!!c.manager,MN_rankAtLeast(5)]); },
  reward:{cash:1800,xp:700,rep:25}},
 {id:'mn-crew-payroll',cat:'Employees',name:'Payroll Mogul',
  desc:'2-part trial: (1) employ all 6 crew, (2) hold $20,000 cash while fully staffed.',
  prog:s=>MN_parts([MN_crewAll(),MN_num(s.cash,0)>=20000]),
  reward:{cash:2000,xp:750,rep:25}},

 /* ================= EXPANSION (4) ================= */
 {id:'mn-exp-lab',cat:'Expansion',name:'Lab Rat',
  desc:'2-part trial: (1) own the Genetics Laboratory facility or better, (2) every equipment piece at level 3+.',
  prog:s=>MN_parts([MN_int(s.facility,0)>=4,MN_equipMin()>=3]),
  reward:{cash:2500,xp:900,rep:30,p0:5}},
 {id:'mn-exp-maxed',cat:'Expansion',name:'Fully Loaded',
  desc:'Max ALL equipment to level 5.',
  prog:s=>{ const q=(s.equipment&&typeof s.equipment==='object')?s.equipment:{}; const vs=Object.keys(q).map(k=>MN_int(q[k],0));
    return [(vs.length>=9&&vs.every(v=>v>=5))?1:0,1]; },
  reward:{cash:4000,xp:1400,rep:40,p0:6}},
 {id:'mn-exp-terr',cat:'Expansion',name:'Territory Control',
  desc:'Operate 2 or more territories/locations.',
  prog:()=>{ const t=MN_ty(); let n=0; try{ n=t&&t.locFac?Object.keys(t.locFac).length:0; }catch(e){ n=0; }
    return [Math.min(n,2),2]; },
  reward:{cash:2200,xp:800,rep:30}},
 {id:'mn-exp-compound',cat:'Expansion',name:'Compound Maxima',
  desc:'3-part trial: (1) own the Warehouse facility or better, (2) employ all 6 crew, (3) every equipment piece at level 3+.',
  prog:s=>MN_parts([MN_int(s.facility,0)>=3,MN_crewAll(),MN_equipMin()>=3]),
  reward:{cash:3500,xp:1200,rep:40,p0:6}},

 /* ================= PROJECT 0 (4) ================= */
 {id:'mn-p0-devotee',cat:'Project 0',name:'True Devotee',
  desc:'Earn 150 Project 0 points.',
  prog:s=>{ const p0=(s.project0&&typeof s.project0==='object')?s.project0:{};
    return [Math.min(MN_int(p0.points,0),150),150]; },
  reward:{cash:2000,xp:800,p0:8}},
 {id:'mn-p0-dual',cat:'Project 0',name:'Dual Devotion',
  desc:'Reach level 3 in TWO different Project 0 tracks.',
  prog:()=>[Math.min(MN_p0TracksAt(3),2),2],
  reward:{cash:2200,xp:850,p0:10}},
 {id:'mn-p0-purist',cat:'Project 0',name:'No Compromise',
  desc:'2-part trial: (1) 5 flawless grows, (2) 5 keeper-grade harvests (90+ quality).',
  prog:s=>{ const st=MN_stats(); return MN_parts([MN_num(st.flawlessGrows,0)>=5,MN_num(st.keepers,0)>=5]); },
  reward:{cash:2500,xp:1000,p0:10}},
 {id:'mn-p0-archivist',cat:'Project 0',name:'Archivist',timed:true,days:30,
  desc:'Preserve 5 strains within 30 days of starting.',
  prog:s=>{
    if(!MN_active('mn-p0-archivist')) return [0,5];
    const d=MN_delta('mn-p0-archivist','preserved',MN_stats().preserved);
    return [Math.min(MN_int(d,0),5),5];
  },
  reward:{cash:1800,xp:700,p0:8}},

 /* ================= BREEDING (5) ================= */
 {id:'mn-br-ten',cat:'Breeding',name:'Pollen Chucker II',
  desc:'Create 10 crosses.',
  prog:s=>[Math.min(MN_num(MN_stats().crosses,0),10),10],
  reward:{cash:1500,xp:600,p0:6}},
 {id:'mn-br-elite',cat:'Breeding',name:'Elite Breeder',
  desc:'Breed a custom cross with 95+ resin AND 95+ potency in one plant.',
  prog:()=>[MN_customs().some(c=>c&&MN_num(c.resin,0)>=95&&MN_num(c.pot,0)>=95)?1:0,1],
  reward:{cash:2200,xp:850,p0:7}},
 {id:'mn-br-gen3',cat:'Breeding',name:'Third Generation',
  desc:'Use your own second-generation crosses as breeding parents twice.',
  prog:s=>[Math.min(MN_num(MN_stats().secondGenCrosses,0),2),2],
  reward:{cash:2000,xp:800,p0:7}},
 {id:'mn-br-gamble',cat:'Breeding',name:"Pheno Hunter's Gamble",timed:true,days:40,
  desc:'Complete a 10-seed pheno hunt within 40 days of starting.',
  prog:s=>{
    if(!MN_active('mn-br-gamble')) return [0,1];
    return [MN_delta('mn-br-gamble','huntsCompleted10',MN_stats().huntsCompleted10)>=1?1:0,1];
  },
  reward:{cash:2500,xp:1000,p0:8}},
 {id:'mn-br-stable',cat:'Breeding',name:'Stable of Champions',
  desc:'2-part trial: (1) own 10 custom crosses, (2) at least 3 of them at 90+ resin.',
  prog:()=>{ const cs=MN_customs(); return MN_parts([cs.length>=10,cs.filter(c=>c&&MN_num(c.resin,0)>=90).length>=3]); },
  reward:{cash:2800,xp:1100,p0:8}},

 /* ================= REPUTATION (5) ================= */
 {id:'mn-rep-legend',cat:'Reputation',name:'Local Legend II',
  desc:'Reach 750 reputation.',
  prog:s=>[Math.min(MN_num(s.reputation,0),750),750],
  reward:{cash:2500,xp:1000,rep:40,p0:6}},
 {id:'mn-rep-trophy',cat:'Reputation',name:'Trophy Case',
  desc:'Win 5 competitions.',
  prog:s=>[Math.min(MN_num(MN_stats().compsWon,0),5),5],
  reward:{cash:3000,xp:1100,rep:40,p0:6}},
 {id:'mn-rep-dynasty',cat:'Reputation',name:'Cup Dynasty',
  desc:'Win the Breeder Cup twice.',
  prog:s=>[Math.min(MN_num(MN_stats().breederCupWins,0),2),2],
  reward:{cash:4000,xp:1500,rep:50,p0:8}},
 {id:'mn-rep-mogul',cat:'Reputation',name:'Mogul Status',
  desc:'Reach the MOGUL tycoon rank.',
  prog:()=>[MN_rankAtLeast(11)?1:0,1],
  reward:{cash:5000,xp:1800,rep:60,p0:10}},
 {id:'mn-rep-untouchable',cat:'Reputation',name:'Untouchable',
  desc:'3-part trial: (1) 500 reputation, (2) 3 competition wins, (3) survive to day 150.',
  prog:s=>{ const st=MN_stats(); return MN_parts([MN_num(s.reputation,0)>=500,MN_num(st.compsWon,0)>=3,MN_int(s.day,1)>=150]); },
  reward:{cash:3500,xp:1300,rep:50,p0:8}}
];
'use strict';
/* ============================================================
   CT_ DISPENSARY SHOPPING CARTS — "Shocker Ownz Grow Empire"
   Self-contained module. ALL top-level identifiers CT_-prefixed.
   INTEGRATION (parent):
     1. normalizeState: CT_migrate()
     2. advanceDay: CT_dayTick() (after plant loop is fine)
     3. RENDER.dispensary: append CT_dispensaryHTML(), call CT_wireDispensary(r)
     4. boot: nothing (lazy)
   ============================================================ */
function CT_num(v,d){ const n=Number(v); return isFinite(n)?n:(d||0); }
function CT_int(v,d){ const n=parseInt(v,10); return isFinite(n)?n:(d||0); }
function CT_clamp(v,a,b){ v=CT_num(v,0); return v<a?a:(v>b?b:v); }
function CT_rnd(a,b){ return a+Math.random()*(b-a); }
function CT_rndi(a,b){ return Math.floor(CT_rnd(a,b+1)); }
function CT_pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function CT_S(){ try{ return (typeof S!=='undefined'&&S)?S:null; }catch(e){ return null; } }
function CT_esc(s){ try{ if(typeof esc==='function') return esc(s); }catch(e){}
  return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function CT_fmt(n){ try{ if(typeof fmt$==='function') return fmt$(n); }catch(e){} return '$'+Math.round(CT_num(n,0)).toLocaleString(); }
function CT_icon(n,cls){ try{ if(typeof icon==='function') return icon(n,cls); }catch(e){} return ''; }
function CT_toast(m){ try{ if(typeof toast==='function') toast(m); }catch(e){} }
function CT_price(it){ try{ if(typeof pricePerOz==='function') return pricePerOz(it); }catch(e){}
  return Math.max(5, CT_num(it.quality,50)*2.4+CT_num(it.potency,70)*0.9); }

const CT_TYPES=['casual','medical','connoisseur','bulk','tourist','regular','premium','budget'];
const CT_FIRST=['Marcus','Lena','Dana','Vic','Rosa','Theo','Priya','Sam','Nadia','Cole','Iris','Dante','Maya','Rex','Zoe','Kai','Luna','Ash','Rhys','Noor'];
const CT_FLAVORS=['Gassy','Fruity','Sweet','Skunky','Earthy','Citrus'];

function CT_defaultCt(){
  return { customers:[], regulars:[], stats:{completed:0,abandoned:0,revenue:0,transactions:0,lostSales:0,itemsSold:0},
    day:0, servedToday:0 };
}
function CT_migrate(){
  const S=CT_S(); if(!S) return false;
  if(!S.ct||typeof S.ct!=='object') S.ct=CT_defaultCt();
  const d=CT_defaultCt();
  Object.keys(d).forEach(k=>{ if(typeof S.ct[k]==='undefined') S.ct[k]=d[k]; });
  if(!Array.isArray(S.ct.customers)) S.ct.customers=[];
  if(!Array.isArray(S.ct.regulars)) S.ct.regulars=[];
  if(!S.ct.stats||typeof S.ct.stats!=='object') S.ct.stats=d.stats;
  return true;
}
/* ---------- customer generation ---------- */
function CT_genCustomer(){
  const S=CT_S(); if(!S) return null;
  const rep=CT_num(S.reputation,0);
  const type=CT_pick(CT_TYPES);
  const budgetBase={casual:120,medical:150,connoisseur:300,bulk:800,tourist:100,regular:200,premium:500,budget:60}[type]||120;
  const budget=Math.round(budgetBase*(1+rep/3000)*CT_rnd(0.7,1.3));
  let unlocked=[];
  try{ unlocked=allStrains().filter(s=>{ try{return isUnlocked(s.id);}catch(e){return true;} }); }catch(e){}
  const favs=[];
  const nf=CT_rndi(1,3);
  for(let i=0;i<nf&&unlocked.length;i++){ const s=CT_pick(unlocked); if(!favs.includes(s.id)) favs.push(s.id); }
  return {
    id:'c'+Date.now()+CT_rndi(100,9999),
    name:CT_pick(CT_FIRST)+' #'+CT_rndi(100,999),
    type:type, budget:budget,
    favStrains:favs,
    potPref:CT_pick(['low','med','high']),
    flavorPref:CT_pick(CT_FLAVORS),
    minQuality:type==='connoisseur'?80:type==='premium'?75:type==='budget'?40:55,
    priceSens:CT_rndi(20,95),
    loyalty:0, satisfaction:70,
    visits:0, spent:0, history:[]
  };
}
/* ---------- cart building ---------- */
function CT_buildCart(cust){
  const S=CT_S(); if(!S||!cust) return null;
  const items=[];
  let subtotal=0, remaining=cust.budget;
  /* candidate inventory: finished products with amount>0 */
  const inv=(S.inventory||[]).filter(i=>CT_num(i.amount,0)>0);
  if(!inv.length) return {items:[],subtotal:0,abandoned:'empty'};
  /* score each inventory item for this customer */
  const scored=inv.map(it=>{
    let score=50;
    if(cust.favStrains.includes(it.strainId)) score+=30;
    const pot=CT_num(it.potency,70);
    if(cust.potPref==='high'&&pot>=85) score+=15;
    else if(cust.potPref==='low'&&pot<70) score+=15;
    else if(cust.potPref==='med'&&pot>=70&&pot<85) score+=10;
    if(CT_num(it.quality,0)>=cust.minQuality) score+=20; else score-=30;
    try{ const st=getStrain(it.strainId); if(st&&st.tags&&st.tags.some(t=>t.toLowerCase().includes(cust.flavorPref.toLowerCase()))) score+=12; }catch(e){}
    const ppo=CT_price(it);
    const afford=remaining/Math.max(1,ppo);
    if(afford<0.5) score-=40;
    if(cust.priceSens>70&&ppo>120) score-=15;
    return {it:it,score:score,ppo:ppo};
  }).sort((a,b)=>b.score-a.score);
  for(const s of scored){
    if(remaining<10) break;
    if(s.score<30) continue;
    /* quantity in eighth-oz increments (3.5g = 0.125oz) so budgets work */
    const eighths=[0.125,0.25,0.5,1,2,3.5,7];
    let q=0;
    for(const e of eighths){
      if(e<=CT_num(s.it.amount,0)&&e*s.ppo<=remaining) q=e;
    }
    if(q<=0) continue;
    const cost=q*s.ppo;
    items.push({invId:s.it.id,strainId:s.it.strainId,strainName:s.it.strainName,qty:q,price:Math.round(s.ppo),type:s.it.type,
      qtyLabel:q<1?Math.round(q*28.35)+'g':q+' oz'});
    subtotal+=cost; remaining-=cost;
    if(items.length>=4) break;
  }
  if(!items.length) return {items:[],subtotal:0,abandoned:'nomatch'};
  return {items:items,subtotal:Math.round(subtotal),abandoned:null};
}
/* ---------- checkout ---------- */
function CT_checkout(custId){
  const S=CT_S(); if(!S) return false;
  CT_migrate();
  const cust=S.ct.customers.find(c=>c.id===custId);
  if(!cust||!cust.cart||!cust.cart.items.length) return false;
  const cart=cust.cart;
  /* verify stock still available */
  for(const ci of cart.items){
    if(!(CT_num(ci.qty,0)>0)){ CT_abandon(cust,'badline'); return false; } /* QA GE-330: reject non-positive quantities */
    const it=S.inventory.find(i=>i.id===ci.invId);
    if(!it||CT_num(it.amount,0)<ci.qty){
      /* out of stock: try alternative or abandon */
      CT_abandon(cust,'stockout');
      return false;
    }
  }
  /* process sale */
  let total=0;
  cart.items.forEach(ci=>{
    const it=S.inventory.find(i=>i.id===ci.invId);
    it.amount=Math.max(0,CT_num(it.amount,0)-ci.qty);
    total+=ci.qty*CT_num(ci.price,0); /* QA: CT_num guards corrupt/missing price (NaN cash) */
  });
  /* remove emptied items */
  S.inventory=S.inventory.filter(i=>CT_num(i.amount,0)>0.01);
  S.cash=CT_num(S.cash,0)+total;
  S.stats.lifetimeRevenue=CT_num(S.stats.lifetimeRevenue,0)+total;
  const st=S.ct.stats;
  st.completed++; st.transactions++; st.revenue+=total; st.itemsSold+=cart.items.length;
  /* customer updates */
  cust.visits++; cust.spent+=total; cust.satisfaction=CT_clamp(cust.satisfaction+8,0,100);
  cust.loyalty=CT_clamp(cust.loyalty+12,0,100);
  cust.history.push({day:CT_int(S.day,1),total:total,items:cart.items.length});
  if(cust.history.length>10) cust.history.shift();
  S.ct.servedToday++;
  /* regular promotion */
  if(cust.visits>=3&&cust.loyalty>=60&&!S.ct.regulars.find(r=>r.name===cust.name)){
    S.ct.regulars.push({name:cust.name,type:cust.type,favStrains:cust.favStrains.slice(),
      visits:cust.visits,avgSpend:Math.round(cust.spent/cust.visits),loyalty:Math.round(cust.loyalty),sinceDay:CT_int(S.day,1)});
    CT_toast(CT_icon('star','ge-ic-md')+' '+CT_esc(cust.name)+' is now a REGULAR customer!');
  }
  try{ if(typeof gainRep==='function'&&total>200) gainRep(1); }catch(e){}
  try{ if(typeof checkMissions==='function') checkMissions(); }catch(e){}
  try{ if(typeof MN_noteCustomer==='function') MN_noteCustomer(1); }catch(e){}
  try{ if(typeof save==='function') save(); }catch(e){}
  try{ if(typeof updateHUD==='function') updateHUD(); }catch(e){}
  /* remove customer from active list */
  S.ct.customers=S.ct.customers.filter(c=>c.id!==custId);
  CT_toast(CT_icon('cash','ge-ic-md')+' Sale: '+CT_fmt(total)+' ('+cart.items.length+' items)');
  return true;
}

function CT_abandon(cust,reason){
  const S=CT_S(); if(!S) return;
  CT_migrate();
  const st=S.ct.stats;
  st.abandoned++;
  if(cust&&cust.cart) st.lostSales+=CT_num(cust.cart.subtotal,0);
  if(cust){ cust.satisfaction=CT_clamp(cust.satisfaction-10,0,100); }
  S.ct.customers=S.ct.customers.filter(c=>c.id!==(cust&&cust.id));
  try{ if(typeof save==='function') save(); }catch(e){}
}
/* ---------- daily sim ---------- */
function CT_dayTick(){
  const S=CT_S(); if(!S) return;
  if(!CT_migrate()) return;
  const rep=CT_num(S.reputation,0);
  let dispLvl=1;
  try{ if(typeof EX_buildingLevel==='function') dispLvl=Math.max(1,EX_buildingLevel('dispensary')); }catch(e){}
  const n=CT_clamp(Math.round(2+rep/400+dispLvl),2,14);
  S.ct.customers=[];
  S.ct.servedToday=0;
  S.ct.day=CT_int(S.day,1);
  /* regulars visit first */
  const regs=S.ct.regulars.slice(0,4);
  regs.forEach(r=>{
    const c=CT_genCustomer();
    c.name=r.name; c.type=r.type; c.loyalty=r.loyalty; c.budget=Math.round(c.budget*1.3);
    c.cart=CT_buildCart(c);
    if(c.cart&&!c.cart.abandoned) S.ct.customers.push(c);
  });
  for(let i=0;i<n;i++){
    const c=CT_genCustomer();
    c.cart=CT_buildCart(c);
    if(!c.cart||c.cart.abandoned){
      if(c.cart&&c.cart.abandoned==='empty') break; /* no inventory at all */
      continue;
    }
    /* auto-checkout for walk-ins (they buy on the spot); player can also serve manually via UI */
    if(Math.random()<0.75){ S.ct.customers.push(c); CT_checkout(c.id); }
    else S.ct.customers.push(c); /* waiting customer — player checks out manually */
  }
  try{ if(typeof save==='function') save(); }catch(e){}
}
/* ---------- UI ---------- */
function CT_dispensaryHTML(){
  const S=CT_S(); if(!S) return '';
  CT_migrate();
  const st=S.ct.stats;
  const avg=st.completed?Math.round(st.revenue/st.completed):0;
  let html=DP_sectionTitle('customers','CUSTOMER TRAFFIC','<span class="ge-num">'+S.ct.servedToday+'</span> SERVED TODAY');
  html+='<div class="ge-dp-metrics">'+
   DP_metricTile('customers',S.ct.servedToday,'SERVED TODAY','at the counter')+
   DP_metricTile('cart',st.completed,'COMPLETED CARTS','lifetime')+
   DP_metricTile('x',st.abandoned,'ABANDONED','walkouts')+
   DP_metricTile('cash',CT_fmt(avg),'AVG CART VALUE','per order')+
   DP_metricTile('box',CT_fmt(st.lostSales),'LOST SALES','stockouts')+
   DP_metricTile('star',S.ct.regulars.length,'REGULARS','loyal customers')+
  '</div>';
  if(S.ct.customers.length){
    html+=DP_sectionTitle('cart','ORDER QUEUE','<span class="ge-num">'+S.ct.customers.length+'</span> WAITING');
    S.ct.customers.slice(0,6).forEach((c,idx)=>{
      const cart=c.cart||{items:[],subtotal:0};
      html+='<div class="ge-card ge-card-hot ge-dp-cust">'+
       '<div class="ge-card-head"><h3><span class="ge-dp-cnum ge-num">CUSTOMER #'+(idx+1)+'</span> '+CT_esc(c.name)+'</h3>'+
       '<span class="ge-pill ge-pill-neutral">'+CT_esc(String(c.type).toUpperCase())+'</span></div>'+
       '<div class="ge-dp-prefs">'+
        '<span class="ge-pill ge-pill-neutral">'+CT_icon('terp','ge-ic-sm')+' '+CT_esc(String(c.potPref||'med').toUpperCase())+' POTENCY</span>'+
        '<span class="ge-pill ge-pill-neutral">'+CT_esc(String(c.flavorPref||'—').toUpperCase())+' FLAVOR</span>'+
        '<span class="ge-pill ge-pill-neutral">MIN Q'+CT_int(c.minQuality,0)+'</span>'+
        '<span class="ge-pill ge-pill-neutral">'+CT_icon('wallet','ge-ic-sm')+' '+CT_fmt(c.budget)+'</span>'+
       '</div>';
      if(cart.items.length){
        html+='<div class="ge-dp-lines">'+cart.items.map(ci=>'<div class="ge-datarow"><span>'+CT_esc(ci.strainName)+'<br><span class="ge-muted ge-caption">'+(ci.qtyLabel||(ci.qty+' oz'))+'</span></span><b class="ge-num">'+CT_fmt(ci.qty*ci.price)+'</b></div>').join('')+'</div>';
        html+='<div class="ge-spread ge-dp-total"><span class="ge-label">SUBTOTAL</span><b class="ge-num ge-data">'+CT_fmt(cart.subtotal)+'</b></div>';
        html+='<button class="ge-btn ge-btn-primary ge-btn-block" data-ct-checkout="'+c.id+'">'+CT_icon('cart','ge-ic-md')+'CHECKOUT '+CT_fmt(cart.subtotal)+'</button>';
        html+='<div class="ge-dp-trust"><div class="ge-dp-trustrow"><span class="ge-caption ge-muted">SAT '+CT_clamp(c.satisfaction,0,100)+'%</span>'+
         '<div class="ge-progress ge-progress-thin ge-progress-ok"><i style="width:'+CT_clamp(c.satisfaction,0,100)+'%"></i></div></div>'+
         '<div class="ge-dp-trustrow"><span class="ge-caption ge-muted">LOYALTY '+CT_clamp(c.loyalty,0,100)+'%</span>'+
         '<div class="ge-progress ge-progress-thin ge-progress-ok"><i style="width:'+CT_clamp(c.loyalty,0,100)+'%"></i></div></div></div>';
      } else {
        html+='<div class="ge-empty ge-dp-browse">'+CT_icon('search','ge-ic-xl')+'<h3>BROWSING</h3><p>No match for this customer\u2019s preferences.</p></div>'+
         '<button class="ge-btn ge-btn-ghost ge-btn-block" data-ct-dismiss="'+c.id+'">DISMISS</button>';
      }
      html+='</div>';
    });
  }
  if(S.ct.regulars.length){
    html+=DP_sectionTitle('star','REGULARS','<span class="ge-num">'+S.ct.regulars.length+'</span>');
    html+='<div class="ge-card ge-card-flat">'+S.ct.regulars.slice(0,8).map(r=>'<div class="ge-datarow"><span>'+CT_icon('star','ge-ic-sm')+' '+CT_esc(r.name)+'<br><span class="ge-muted ge-caption">'+r.visits+' visits • avg '+CT_fmt(r.avgSpend)+'</span></span><b class="ge-num">'+r.loyalty+'%</b></div>').join('')+'</div>';
  }
  return html;
}

function CT_wireDispensary(r){
  if(!r||!r.querySelectorAll) return;
  r.querySelectorAll('[data-ct-checkout]').forEach(b=>b.onclick=()=>{
    CT_checkout(b.dataset.ctCheckout);
    try{ if(typeof RENDER!=='undefined'&&RENDER.dispensary) RENDER.dispensary(); }catch(e){}
  });
  r.querySelectorAll('[data-ct-dismiss]').forEach(b=>b.onclick=()=>{
    const S=CT_S(); if(S){ CT_migrate(); S.ct.customers=S.ct.customers.filter(c=>c.id!==b.dataset.ctDismiss); }
    try{ if(typeof RENDER!=='undefined'&&RENDER.dispensary) RENDER.dispensary(); }catch(e){}
  });
}
/* ============================================================
   SHOCKER OWNZ GROW EMPIRE — EXPANSION NX: IDENTITY & PERSISTENCE
   Chunk 1: local profiles + auth terminal, per-profile save keys,
   offline empire progression, notification center feed, EMPIRE SAVED.
   ALL top-level identifiers are NX_-prefixed. Appended to game.js.
   ============================================================ */

/* ---------------- per-profile save keys ---------------- */
let NX_KEY=null;
function NX_saveKey(){ return NX_KEY||'soge_save_v1'; }
function NX_setActive(pid){ NX_KEY=(pid&&pid!=='guest')?('soge_save_v1_'+pid):'soge_save_v1'; try{ S.nx.activeProfile=pid||'guest'; }catch(e){} }

/* ---------------- local profiles (THIS DEVICE ONLY) ---------------- */
const NX_PROF_KEY='soge_profiles_v1', NX_SESS_KEY='soge_session_v1';
function NX_profiles(){ try{ const p=JSON.parse(localStorage.getItem(NX_PROF_KEY)); return Array.isArray(p)?p:[]; }catch(e){ return []; } }
function NX_saveProfiles(p){ try{ localStorage.setItem(NX_PROF_KEY,JSON.stringify(p)); }catch(e){} }
function NX_hash(s){ let h=5381; s=String(s); for(let i=0;i<s.length;i++){ h=((h<<5)+h+s.charCodeAt(i))>>>0; } return h.toString(16); }
function NX_session(){ try{ return JSON.parse(localStorage.getItem(NX_SESS_KEY)); }catch(e){ return null; } }
function NX_setSession(pid,remember){ try{ if(remember) localStorage.setItem(NX_SESS_KEY,JSON.stringify({pid:pid,ts:Date.now()})); else localStorage.removeItem(NX_SESS_KEY); }catch(e){} }
function NX_clearSession(){ try{ localStorage.removeItem(NX_SESS_KEY); }catch(e){} }
function NX_profileSaveKey(pid){ return (pid&&pid!=='guest')?('soge_save_v1_'+pid):'soge_save_v1'; }
function NX_saveExists(key){ try{ const r=localStorage.getItem(key); if(!r) return false; const d=JSON.parse(r); return !!(d&&d.started); }catch(e){ return false; } }
function NX_lastSessionInfo(){
  let best=null;
  const profs=NX_profiles();
  profs.forEach(p=>{ if(NX_saveExists(NX_profileSaveKey(p.id))){ const d=NX_profileDay(NX_profileSaveKey(p.id)); if(!best||d.ts>best.ts) best={pid:p.id,name:p.grower,ts:d.ts,day:d.day}; } });
  if(NX_saveExists('soge_save_v1')){ const d=NX_profileDay('soge_save_v1'); if(!best||d.ts>best.ts) best={pid:'guest',name:'GUEST',ts:d.ts,day:d.day}; }
  return best;
}
function NX_profileDay(key){ try{ const d=JSON.parse(localStorage.getItem(key)); return {ts:num(d.lastSeen,0),day:int(d.day,1)}; }catch(e){ return {ts:0,day:1}; } }

/* ---------------- screens ---------------- */
function NX_ensureScreens(){
  ['login','welcome','profile','techtree','notifs'].forEach(s=>{ if(!SCREENS.includes(s)) SCREENS.push(s); });
  if(typeof MENU_ITEMS!=='undefined'){
    if(!MENU_ITEMS.some(m=>m.id==='profile')) MENU_ITEMS.push({id:'profile',ico:'star',label:'PROFILE'});
    if(!MENU_ITEMS.some(m=>m.id==='notifs')) MENU_ITEMS.push({id:'notifs',ico:'warn',label:'ALERTS'});
    if(!MENU_ITEMS.some(m=>m.id==='techtree')) MENU_ITEMS.push({id:'techtree',ico:'equipment',label:'TECH TREE'});
  }
}

/* ---------------- boot routing ---------------- */
function NX_preboot(){
  NX_ensureScreens();
  NX_installToastWrap();
  const sess=NX_session();
  if(sess&&sess.pid!==undefined){
    const ok=(sess.pid==='guest')||NX_profiles().some(p=>p.id===sess.pid);
    if(ok){ NX_setActive(sess.pid); NX_pendingOffline=true; setTimeout(()=>{ NX_booted(); },80); return false; }
  }
  NX_showLogin(); return true;
}
let NX_pendingOffline=false;

/* ---------------- login terminal ---------------- */
let NX_loginMode='main';
function NX_showLogin(){
  NX_loginMode='main';
  show('login'); NX_renderLogin();
}
function NX_loginShell(inner){
  return '<div class="ge-term-bg" aria-hidden="true"><div class="ge-term-smoke s1"></div><div class="ge-term-smoke s2"></div><div class="ge-term-scan"></div></div>'+
  '<div class="ge-term ge-anim-rise"><div class="ge-term-head">'+icon('gasmask','ge-ic-md')+'<span>SECURE TERMINAL // GROW EMPIRE ID</span><span class="ge-term-dot"></span></div>'+
  '<div class="ge-term-brand"><div class="ge-display">GROW EMPIRE</div><div class="ge-label ge-gold-text">GROW LIKE YOU OWN THE SHOW.</div>'+
  '<div class="ge-caption ge-muted">SHOCKER OWNZ // PROJECT 0</div></div>'+inner+
  '<p class="ge-term-local">'+icon('lock','ge-ic-sm')+' LOCAL PROFILES — stored on this device only. No server. No cloud sync.</p></div>';
}

function NX_renderLogin(){
  const r=$('login-root'); if(!r) return;
  const last=NX_lastSessionInfo();
  let inner='';
  if(NX_loginMode==='main'){
    inner='<div class="ge-stack">'+
     '<button class="ge-btn ge-btn-primary ge-btn-block" id="nx-b-login">LOGIN</button>'+
     '<button class="ge-btn ge-btn-ghost ge-btn-block" id="nx-b-create">CREATE ACCOUNT</button>'+
     '<button class="ge-btn ge-btn-ghost ge-btn-block" id="nx-b-guest">PLAY AS GUEST</button>'+
     (last?'<button class="ge-btn ge-btn-gold ge-btn-block" id="nx-b-last">CONTINUE LAST SESSION<br><span class="ge-caption">'+esc(last.name)+' — DAY '+last.day+'</span></button>':'')+
     '</div><label class="ge-check"><input type="checkbox" id="nx-remember" checked> <span>Remember Me</span></label>'+
     '<button class="ge-btn ge-btn-ghost ge-btn-block" id="nx-b-forgot">FORGOT PASSWORD?</button>';
  } else if(NX_loginMode==='login'){
    inner='<h3 class="ge-h2">LOGIN</h3><input class="ge-input" id="nx-f-user" placeholder="Username" autocomplete="username" enterkeyhint="next">'+
     '<input class="ge-input" id="nx-f-pass" type="password" placeholder="Password" autocomplete="current-password" enterkeyhint="done">'+
     '<label class="ge-check"><input type="checkbox" id="nx-remember2" checked> <span>Remember Me</span></label>'+
     '<div class="ge-btn-row"><button class="ge-btn ge-btn-ghost" id="nx-b-back">BACK</button><button class="ge-btn ge-btn-primary" id="nx-do-login">ENTER</button></div>';
  } else if(NX_loginMode==='create'){
    inner='<h3 class="ge-h2">CREATE GROW EMPIRE ID</h3>'+
     '<input class="ge-input" id="nx-c-user" placeholder="Username" autocomplete="username" enterkeyhint="next">'+
     '<input class="ge-input" id="nx-c-grower" placeholder="Grower Name (callsign)" enterkeyhint="next">'+
     '<input class="ge-input" id="nx-c-email" type="email" inputmode="email" placeholder="Email" autocomplete="email" enterkeyhint="next">'+
     '<input class="ge-input" id="nx-c-pass" type="password" placeholder="Password" autocomplete="new-password" enterkeyhint="next">'+
     '<input class="ge-input" id="nx-c-pass2" type="password" placeholder="Confirm Password" autocomplete="new-password" enterkeyhint="done">'+
     '<p class="ge-caption ge-muted">Password is obscured and stored on this device only (demo-grade).</p>'+
     '<div class="ge-btn-row"><button class="ge-btn ge-btn-ghost" id="nx-b-back">BACK</button><button class="ge-btn ge-btn-gold" id="nx-do-create">CREATE ID</button></div>';
  } else if(NX_loginMode==='forgot'){
    inner='<h3 class="ge-h2">RESET LOCAL PASSWORD</h3><p class="ge-caption ge-muted">Local reset — no email is sent. Enter the account email to set a new password on this device.</p>'+
     '<input class="ge-input" id="nx-f-email" type="email" inputmode="email" placeholder="Account Email" autocomplete="email" enterkeyhint="next">'+
     '<input class="ge-input" id="nx-f-new" type="password" placeholder="New Password" autocomplete="new-password" enterkeyhint="next">'+
     '<input class="ge-input" id="nx-f-new2" type="password" placeholder="Confirm New Password" autocomplete="new-password" enterkeyhint="done">'+
     '<div class="ge-btn-row"><button class="ge-btn ge-btn-ghost" id="nx-b-back">BACK</button><button class="ge-btn ge-btn-primary" id="nx-do-reset">RESET</button></div>';
  }
  r.innerHTML=NX_loginShell(inner);
  NX_wireLogin();
}

function NX_wireLogin(){
  const on=(id,fn)=>{ const e=$(id); if(e) e.onclick=fn; };
  on('nx-b-login',()=>{ NX_loginMode='login'; NX_renderLogin(); });
  on('nx-b-create',()=>{ NX_loginMode='create'; NX_renderLogin(); });
  on('nx-b-guest',()=>{ NX_loginMode='main'; NX_renderLogin(); });
  on('nx-b-forgot',()=>{ NX_loginMode='forgot'; NX_renderLogin(); });
  on('nx-b-back',()=>{ NX_loginMode='main'; NX_renderLogin(); });
  on('nx-do-login',()=>{
    const u=($('nx-f-user').value||'').trim().toLowerCase(), pw=$('nx-f-pass').value||'';
    const p=NX_profiles().find(x=>x.username.toLowerCase()===u);
    if(!p||p.pw!==NX_hash(pw)){ toast(icon('x','ge-ic-md')+' Invalid username or password.'); return; }
    p.lastPlayed=Date.now(); NX_saveProfiles(NX_profiles());
    NX_afterAuth(p.id,$('nx-remember2')&&$('nx-remember2').checked);
  });
  on('nx-do-create',()=>{
    const u=($('nx-c-user').value||'').trim(), g=($('nx-c-grower').value||'').trim()||u,
          em=($('nx-c-email').value||'').trim(), p1=$('nx-c-pass').value||'', p2=$('nx-c-pass2').value||'';
    if(u.length<3){ toast(icon('x','ge-ic-md')+' Username needs 3+ characters.'); return; }
    if(p1.length<4){ toast(icon('x','ge-ic-md')+' Password needs 4+ characters.'); return; }
    if(p1!==p2){ toast(icon('x','ge-ic-md')+' Passwords do not match.'); return; }
    const profs=NX_profiles();
    if(profs.some(x=>x.username.toLowerCase()===u.toLowerCase())){ toast(icon('x','ge-ic-md')+' Username taken on this device.'); return; }
    const np={id:'p'+Date.now().toString(36),username:u,grower:g,email:em,pw:NX_hash(p1),created:Date.now(),lastPlayed:Date.now()};
    profs.push(np); NX_saveProfiles(profs);
    toast(icon('star','ge-ic-md')+' Grow Empire ID created: '+esc(u));
    NX_afterAuth(np.id,true);
  });
  on('nx-do-reset',()=>{
    const em=($('nx-f-email').value||'').trim().toLowerCase(), p1=$('nx-f-new').value||'', p2=$('nx-f-new2').value||'';
    const profs=NX_profiles(); const p=profs.find(x=>(x.email||'').toLowerCase()===em);
    if(!p){ toast(icon('x','ge-ic-md')+' No local account with that email.'); return; }
    if(p1.length<4||p1!==p2){ toast(icon('x','ge-ic-md')+' Passwords must match (4+ chars).'); return; }
    p.pw=NX_hash(p1); NX_saveProfiles(profs);
    toast(icon('check','ge-ic-md')+' Password reset on this device.');
    NX_loginMode='login'; NX_renderLogin();
  });
  on('nx-b-last',()=>{
    const last=NX_lastSessionInfo(); if(!last) return;
    NX_afterAuth(last.pid,true);
  });
  on('nx-b-guest',()=>{ NX_afterAuth('guest',($('nx-remember')&&$('nx-remember').checked)); });
}

function NX_afterAuth(pid,remember){
  NX_setActive(pid); NX_setSession(pid,remember!==false);
  try{ if(typeof NX_bootOrig==='function') NX_bootOrig(); }catch(e){}
  setTimeout(()=>{ NX_booted(); },120);
}
function NX_logout(){
  try{ save(); }catch(e){}
  NX_clearSession(); NX_KEY=null;
  try{ S=null; }catch(e){}
  NX_showLogin();
}

/* ---------------- offline empire progression ---------------- */
function NX_offlineCheck(){
  if(!S||!S.started) return;
  const last=num(S.lastSeen,0), now=Date.now();
  if(!last){ return; }
  const elapsed=now-last;
  if(elapsed<45*60*1000) return;
  const days=clamp(Math.round(elapsed/(8*3600*1000)),1,3);
  const sum=NX_offlineSim(days);
  try{ save(); }catch(e){}
  NX_welcome={days:days,elapsed:elapsed,sum:sum};
  show('welcome');
}
let NX_welcome=null;
function NX_offlineSim(days){
  /* P2.5: enrichment counters only - sim behavior (incl. the NEVER-die guarantee) is untouched. */
  const sum={grown:0,irr:0,feed:0,orders:0,rev:0,attn:0,attnNames:[],repPlus:0,missionsMet:0,p0Levels:[],unlockedNow:[]};
  const cash0=num(S.cash,0);
  let served0=0; try{ served0=num(S.ct&&S.ct.servedToday,0); }catch(e){}
  const rep0=int((typeof TY_repOverall==='function')?TY_repOverall():S.reputation,0);
  const mis0=WB_missionsReady().length;
  const p0Before={}; try{ (typeof P0_TRACKS!=='undefined'?P0_TRACKS:[]).forEach(t=>{ p0Before[t.id]=(typeof p0Level==='function')?p0Level(t.id):0; }); }catch(e){}
  let locked0=[]; try{ locked0=(S.lockedStrains||[]).slice(); }catch(e){}
  for(let d=0; d<days; d++){
    try{ if(typeof AM_dayTick==='function') AM_dayTick(); }catch(e){}
    const autoW=S.am&&S.am.water&&S.am.water.owned&&S.am.water.on;
    const autoF=S.am&&S.am.feed&&S.am.feed.owned&&S.am.feed.on;
    const autoT=!autoW&&S.am&&S.am.timers&&S.am.timers.owned&&S.am.timers.on; /* P3-W4: timers halve offline thirst */
    S.plants.forEach(p=>{
      p.day=num(p.day,0)+0.9; sum.grown++;
      if(autoW) sum.irr++; else if(autoT){ sum.irr++; p.water=clamp(num(p.water,80)-7,5,100); } else p.water=clamp(num(p.water,80)-14,5,100);
      if(autoF) sum.feed++; else p.nutrition=clamp(num(p.nutrition,80)-6,5,100);
      /* balanced: plants stall and thirst, they NEVER die while you're away */
      p.health=clamp(num(p.health,90)-4,25,100);
      p.stress=clamp(num(p.stress,20)+6,0,80);
      p.problems=[];
    });
    try{ if(typeof CT_dayTick==='function') CT_dayTick(); }catch(e){}
    try{ if(typeof EX_tick==='function') EX_tick(); }catch(e){}
    S.day=Math.max(1,int(S.day,1)+1); S.stats.daysAdvanced=num(S.stats.daysAdvanced,0)+1;
    /* QA GE-504: timed missions tick offline. Each offline game-day runs the
       missions module's day tick so timed-mission expiry is evaluated per day
       instead of late (late evaluation left expired missions completable).
       Offline game-days come from NX_offlineCheck: 8 real hours = 1 game day,
       min 45 min elapsed, clamped to 1..3 days. MN_dayTick is idempotent per
       game-day via S.mn.lastTickDay, so this call is safe. */
    try{ if(typeof MN_dayTick==='function') MN_dayTick(); }catch(e){}
  }
  try{ sum.orders=Math.max(0,num(S.ct&&S.ct.servedToday,0)-served0); }catch(e){}
  sum.rev=Math.round(num(S.cash,0)-cash0);
  /* P2.5: read-only deltas for the welcome-back summary, computed from the already-applied sim */
  try{ sum.repPlus=Math.max(0,int((typeof TY_repOverall==='function')?TY_repOverall():S.reputation,0)-rep0); }catch(e){}
  try{ sum.missionsMet=Math.max(0,WB_missionsReady().length-mis0); }catch(e){}
  try{ (typeof P0_TRACKS!=='undefined'?P0_TRACKS:[]).forEach(t=>{ const to=(typeof p0Level==='function')?p0Level(t.id):0, from=num(p0Before[t.id],0); if(to>from) sum.p0Levels.push({track:t.id,from:from,to:to}); }); }catch(e){}
  try{ sum.unlockedNow=(S.lockedStrains||[]).length<locked0.length?locked0.filter(id=>(S.lockedStrains||[]).indexOf(id)<0):[]; }catch(e){}
  S.plants.forEach(p=>{
    if(num(p.water,100)<25||num(p.nutrition,100)<20||num(p.health,100)<50){
      sum.attn++;
      if(sum.attnNames.length<3){ const st=getStrain(p.strainId); sum.attnNames.push((st?st.name:'Plant')+' #'+p.id); }
    }
  });
  return sum;
}
function NX_fmtElapsed(ms){
  const h=Math.floor(ms/3600000), m=Math.floor((ms%3600000)/60000);
  return h>0?(h+'h '+m+'m'):(m+'m');
}
RENDER.welcome=function(){
  const r=$('welcome-root'); if(!r) return;
  try{ if(typeof CAP_haptic==='function') CAP_haptic('mission'); }catch(e){} /* P2.5: single tasteful buzz on return */
  const w=NX_welcome||{days:0,elapsed:0,sum:{grown:0,irr:0,feed:0,orders:0,rev:0,attn:0,attnNames:[],repPlus:0,missionsMet:0,p0Levels:[],unlockedNow:[]}};
  const s=w.sum, prof=NX_activeProfile();
  const grower=prof?prof.grower:'GUEST';
  let rank='STREET ROOKIE'; try{ rank=TY_rankName(); }catch(e){}
  /* P2.5: WHILE YOU WERE AWAY - read-only enrichment of the already-applied
     offline sim. This render NEVER grants rewards (idempotent; safe to re-render). */
  const grownH=Math.round(num(s.grown,0)*21.6); /* the sim advances each plant 0.9 day per offline day */
  let flags=''; try{ flags=WB_flagsHTML(s); }catch(e){}
  r.innerHTML='<div class=\"ge-term-bg\" aria-hidden=\"true\"><div class=\"ge-term-smoke s1\"></div><div class=\"ge-term-scan\"></div></div>'+
  '<div class=\"ge-welcome ge-anim-rise\"><div class=\"ge-display ge-w-title\">WELCOME BACK</div>'+
  '<div class=\"ge-w-name\">'+esc(grower)+'</div>'+
  '<div class=\"ge-w-sub\">'+esc(rank)+' — Level '+int(S.level,1)+'</div>'+
  '<div class=\"ge-label ge-muted\">Offline: '+NX_fmtElapsed(w.elapsed)+' ('+w.days+' game day'+(w.days>1?'s':'')+')</div>'+
  '<p class=\"ge-label ge-gold-text\">WHILE YOU WERE AWAY</p>'+
  '<div class=\"ge-card\">'+
   PF_kv(icon('grow','ge-ic-sm')+' Plants grew','<b class=\"ge-num\">'+grownH+'h</b>')+
   PF_kv(icon('water','ge-ic-sm')+' Auto-water cycles','<b class=\"ge-num\">'+int(s.irr,0)+'</b>')+
   PF_kv(icon('grow','ge-ic-sm')+' Auto-feed cycles','<b class=\"ge-num\">'+int(s.feed,0)+'</b>')+
   PF_kv(icon('cart','ge-ic-sm')+' Dispensary orders filled','<b class=\"ge-num\">'+int(s.orders,0)+'</b>')+
   PF_kv(icon('cash','ge-ic-sm')+' Dispensary revenue','<b class=\"ge-num\">'+fmt$(num(s.rev,0))+'</b>')+
   PF_kv(icon('missions','ge-ic-sm')+' Mission progress','<b class=\"ge-num\">+'+int(s.missionsMet,0)+'</b>')+
   PF_kv(icon('star','ge-ic-sm')+' Reputation','<b class=\"ge-num\">+'+int(s.repPlus,0)+'</b>')+
   (num(s.attn,0)?PF_kv(icon('warn','ge-ic-sm')+' Plants need attention','<b class=\"ge-num ge-red\">'+int(s.attn,0)+'</b>')+'<p class=\"ge-caption ge-muted\">'+(s.attnNames||[]).map(esc).join(', ')+(s.attn>3?'\u2026':'')+'</p>'
    :PF_kv(icon('check','ge-ic-sm')+' Everything stable','<b>—</b>'))+
  '</div>'+flags+
  '<p class=\"ge-caption ge-muted ge-center\">Automation protected your automated rooms. Nothing died while you were gone.</p>'+
  '<button class=\"ge-btn ge-btn-primary ge-btn-block\" id=\"nx-enter\">ENTER EMPIRE</button></div>';
  $('nx-enter').onclick=()=>{ NX_welcome=null;
    /* P2.5: settle offline mission progress through the normal idempotent path
       (checkMissions only completes un-completed missions - no double-grant). */
    try{ if(typeof checkMissions==='function') checkMissions(); }catch(e){}
    show('splash');
  };
};

/* ================= P2.5: RETURN-TO-GAME + HOOKS + PLAYER MEMORY =================
   (a) Welcome-back enrichment: WB_missionsReady() is a read-only completable scan;
       WB_flagsHTML() renders meaningful return flags, shown only when true. The
       summary NEVER grants rewards - it reads the already-applied offline sim only.
       Mission grants settle through the normal checkMissions() path when the player
       taps ENTER EMPIRE (idempotent via the missionsDone guard - no double-grant).
   (b) Return hooks: RH_hooks() returns real-state anticipation descriptors
       {ico,t,s,go,tab}; RH_hooksHTML() renders them as ON THE HORIZON on Home.
       Informational only - no urgency, no countdown pressure, no expiring nudges.
       The descriptor array is reusable by nextThing-style cards later.
   (c) Player memory: S.memory = {firsts:{...}, records:{...}} - migration-safe,
       honestly backfilled for legacy saves ({unknown:true} where detail is lost).
       S.stats stays the authoritative numbers (biggestHarvest, bestQuality...);
       S.memory carries the human detail for the future Grower Profile.
       Longest-preserved genetic (ME_longestKept) and most-grown strain (ME_mostGrown)
       are DERIVED live from keepers/strainGrown - never stored, never stale.
   Shape:
     firsts: { plant:{strainId,name,day}, harvest:{strainId,strainName,oz,quality,day},
               keeper:{strainId,strainName,phenoNum,rarity,day},
               elite:{strainId,strainName,phenoNum,rarity,day}, custom:{id,name,day} }
     records:{ largestHarvest:{oz,strainName,day}, potency:{val,strainName,day},
               terpenes:{val,strainName,day}, resin:{val,strainName,day} }
*/
function WB_missionsReady(){
  /* read-only: missions whose goal is met but not yet processed. Never grants. */
  const out=[];
  try{
    (typeof MISSIONS!=='undefined'?MISSIONS:[]).forEach(m=>{
      if((S.missionsDone||[]).indexOf(m.id)>=0) return;
      let cur=0,target=1;
      try{ const p=m.prog(S); cur=p[0]; target=p[1]; }catch(e){ return; }
      if(cur>=target) out.push(m);
    });
  }catch(e){}
  return out;
}
function WB_flagsHTML(s){
  /* meaningful return flags - rendered only when true. Pure read, no grants. */
  const out=[];
  const flag=(ico,title,body)=>{
    out.push('<div class=\"ge-wflag\"><span class=\"ge-wflag-ico\">'+icon(ico,'ge-ic-md')+'</span>'+
      '<span><b>'+title+'</b><span class=\"ge-body ge-muted\">'+body+'</span></span></div>');
  };
  try{ /* HARVEST READY */
    let ready=0; (S.plants||[]).forEach(p=>{ try{ if(stageOf(p)>=5) ready++; }catch(e){} });
    if(ready>0) flag('harvest','HARVEST READY',ready+' plant'+(ready===1?'':'s')+' finished while you were away. Waiting whenever you are.');
  }catch(e){}
  if(num(s.attn,0)>0) /* PLANT NEEDS ATTENTION (from the sim's own attention scan) */
    flag('warn','PLANT NEEDS ATTENTION',int(s.attn,0)+' plant'+(s.attn===1?' needs':'s need')+' water, food or care.'+
      ((s.attnNames||[]).length?' '+s.attnNames.map(esc).join(', ')+(s.attn>3?'\u2026':''):''));
  try{ /* NEW GENETIC AVAILABLE - unlocked while away, or requirement now met */
    const un=(s.unlockedNow||[]).map(id=>{ try{ const st=getStrain(id); return st?st.name:id; }catch(e){ return id; } });
    if(un.length) flag('genetics','NEW GENETIC AVAILABLE',un.slice(0,3).map(esc).join(', ')+(un.length>3?'\u2026':'')+' unlocked while you were away.');
    else{
      const g=(typeof P14_nearestGenetic==='function')?P14_nearestGenetic():null;
      if(g&&num(g.rel,1)===0) flag('genetics','NEW GENETIC AVAILABLE',esc(g.st.name)+' - requirement met. Unlock it in Genetics.');
    }
  }catch(e){}
  try{ /* PROJECT 0 OBJECTIVE COMPLETE - track levels gained during the sim */
    (s.p0Levels||[]).forEach(lv=>{
      const t=((typeof P0_TRACKS!=='undefined')?P0_TRACKS:[]).find(x=>x.id===lv.track);
      flag('project0','PROJECT 0 OBJECTIVE COMPLETE',esc(t?t.name:String(lv.track).toUpperCase())+' reached LV '+int(lv.to,0)+'.');
    });
  }catch(e){}
  try{ /* MARKET OPPORTUNITY - real multiplier, no pressure */
    if(typeof WX_marketMult==='function'){ const mm=num(WX_marketMult('all'),1); if(mm>1.05) flag('chart','MARKET OPPORTUNITY','Prices are running hot - market \u00d7'+mm.toFixed(2)+'. Worth a look before you sell.'); }
  }catch(e){}
  try{ /* UNUSUAL PHENOTYPE TRAIT DETECTED - hidden legendary expression in the grow */
    const weird=(S.plants||[]).filter(p=>{ try{ return p&&p.pheno&&p.pheno.legendaryTrait&&p.pheno.legendaryHidden; }catch(e){ return false; } });
    if(weird.length) flag('dna','UNUSUAL PHENOTYPE TRAIT DETECTED','An unknown expression is forming on '+esc(ME_strainName(weird[0].strainId))+'. Inspect it in the grow room.');
  }catch(e){}
  try{ /* MISSION READY - goals met offline; rewards settle via checkMissions on entry */
    const ready=WB_missionsReady();
    if(ready.length) flag('missions','MISSION READY',ready.length+' mission goal'+(ready.length===1?'':'s')+' met while you were away: '+ready.slice(0,2).map(m=>esc(m.name)).join(', ')+(ready.length>2?'\u2026':'')+'. Rewards land as you enter.');
  }catch(e){}
  if(!out.length) return '';
  return '<div class=\"ge-wflags\"><p class=\"ge-label ge-gold-text\">WORTH A LOOK</p>'+out.join('')+'</div>';
}
function RH_hooks(){
  /* return hooks: natural anticipation from REAL state. Read-only descriptors. */
  const out=[];
  try{
    /* 1. next harvest ETA */
    let best=null, ready=0;
    (S.plants||[]).forEach(p=>{
      try{
        if(stageOf(p)>=5){ ready++; return; }
        const st=getStrain(p.strainId); if(!st) return;
        const left=Math.ceil(num(st.ft,60)-num(p.day,0));
        if(left>0&&(!best||left<best.left)) best={left:left};
      }catch(e){}
    });
    if(best) out.push({ico:'harvest',t:'Next harvest in ~'+best.left+'d',s:'Your crop is finishing up - no rush, just a heads-up.',go:'grow',tab:null});
    else if(ready>0) out.push({ico:'harvest',t:ready+' plant'+(ready===1?'':'s')+' ready to harvest',s:'Waiting whenever you are.',go:'grows',tab:null});
    /* 2. genetic unlock progress (x/y) */
    try{
      const g=(typeof P14_nearestGenetic==='function')?P14_nearestGenetic():null;
      if(g){
        const l=g.st.lock||{}; let prog=g.closeText;
        if(l.t==='rep'){ const v=int(l.v,0), rep=int((typeof TY_repOverall==='function')?TY_repOverall():S.reputation,0); prog=Math.min(rep,v)+'/'+v+' rep'; }
        else if(l.t==='cash'){ const c=num(g.st.seed,0)*3; prog=fmt$(Math.min(num(S.cash,0),c))+' / '+fmt$(c); }
        out.push({ico:'genetics',t:'Next genetics: '+g.st.name,s:prog+(num(g.rel,1)===0?' — requirement met: buy it in the Genetics Lab':' - '+g.closeText),go:'genetics',tab:null});
      }
    }catch(e){}
    /* 3. pending pheno comparison available */
    try{
      if((S.keepers||[]).length>=2) out.push({ico:'scroll',t:'Keeper comparison available',s:S.keepers.length+' keepers in the vault - put two side by side.',go:'keepers',tab:null});
    }catch(e){}
    /* 4. Project 0 objective x/y */
    try{
      const ths=(typeof P0_LEVEL_PTS!=='undefined')?P0_LEVEL_PTS:[];
      let b=null;
      ((typeof P0_TRACKS!=='undefined')?P0_TRACKS:[]).forEach(t=>{
        const lvl=(typeof p0Level==='function')?p0Level(t.id):0;
        if(lvl>=ths.length-1) return;
        const th=num(ths[lvl+1],0), pts=num(S.project0.tracks[t.id],0), gap=Math.max(0,th-pts), rel=th>0?gap/th:1;
        if(!b||rel<b.rel) b={t:t,lvl:lvl,th:th,pts:pts,gap:gap,rel:rel};
      });
      if(b) out.push({ico:'project0',t:'Project 0: '+b.t.name+' \u2192 LV '+(b.lvl+1),s:Math.floor(b.pts)+'/'+b.th+' pts'+(b.gap>0?' - '+b.gap+' to go':' - level up pending'),go:'project0',tab:null});
    }catch(e){}
    /* 5. processing batch ETA */
    try{
      const procs=(((S.ty||{}).proc)||[]);
      if(procs.length){
        const m=Math.min.apply(null,procs.map(j=>num(j.daysLeft,0)));
        let pn='Processing batch'; try{ const pt=(typeof TY_PRODUCTS!=='undefined')?TY_PRODUCTS.find(x=>x.id===procs[0].ptype):null; if(pt) pn=pt.name; }catch(e){}
        out.push({ico:'flask',t:'Batch finishing in ~'+Math.max(0,Math.ceil(m))+'d',s:pn+' - the pipeline keeps moving.',go:'production',tab:null});
      }
    }catch(e){}
    /* 6. production chain: next stage remaining */
    try{
      const prods=(((S.ty||{}).prod)||[]).filter(p=>!p.packaged);
      const nproc=(((S.ty||{}).proc)||[]).length;
      if(prods.length) out.push({ico:'box',t:prods.length+' finished product'+(prods.length===1?'':'s')+' to package',s:'Packaging is the next stage of the chain.',go:'production',tab:null});
      else if(nproc>0) out.push({ico:'flask',t:'Chain stage: processing \u2192 packaging',s:'Finished batches will need packaging before sale.',go:'production',tab:null});
    }catch(e){}
    /* 7. P3-W6: milestone anticipation - "you're close to X" from real progress.
       Informational only; never urgent. */
    try{
      if(typeof MS_next==='function'){
        const nx=MS_next(1)[0];
        if(nx&&!nx.done){
          const p=nx.prog();
          if(p&&num(p.target,0)>0&&num(p.cur,0)>=num(p.target,0)*0.5){
            out.push({ico:'trophy',t:'Close to milestone: '+nx.name,
              s:MS_progText(nx)+' — the full list lives on the Empire Dashboard.',go:'dashboard',tab:null});
          }
        }
      }
    }catch(e){}
  }catch(e){}
  return out;
}
function RH_hooksHTML(){
  /* ON THE HORIZON - calm anticipation, tappable cards reusing home wiring. */
  try{
    const hooks=RH_hooks(); if(!hooks.length) return '';
    let html='<div class=\"ge-section-title\">ON THE HORIZON</div><div class=\"ge-home-onemore ge-horizon\">';
    hooks.forEach(h=>{
      html+='<button class=\"ge-card ge-card-tap ge-onemore-card ge-anim-rise\" data-ex-go=\"'+esc(h.go)+'\"'+(h.tab?' data-ex-tab=\"'+esc(h.tab)+'\"':'')+'>'+
        '<div class=\"ge-onemore-head\">'+icon(h.ico||'star','ge-ic-md')+'<b>'+esc(h.t)+'</b></div>'+
        '<p class=\"ge-body ge-muted\">'+h.s+'</p></button>';
    });
    return html+'</div>';
  }catch(e){ return ''; }
}
/* ---------- P2.5 player memory ---------- */
function ME_ensure(){
  try{
    if(!S||typeof S!=='object') return;
    if(!S.memory||typeof S.memory!=='object') S.memory={};
    if(!S.memory.firsts||typeof S.memory.firsts!=='object') S.memory.firsts={};
    if(!S.memory.records||typeof S.memory.records!=='object') S.memory.records={};
  }catch(e){}
}
function ME_migrate(){
  /* migration-safe: create the namespace; backfill HONESTLY for legacy saves */
  try{
    ME_ensure();
    const m=S.memory, st=(S.stats&&typeof S.stats==='object')?S.stats:{};
    const unk=()=>({unknown:true,day:1});
    if(!m.firsts.plant&&num(st.plantsStarted,0)>0) m.firsts.plant=unk();
    if(!m.firsts.harvest&&num(st.harvests,0)>0) m.firsts.harvest=unk();
    if(!m.firsts.keeper&&(num(st.keepersFound,0)>0||(S.keepers||[]).length>0)) m.firsts.keeper=unk();
    if(!m.firsts.elite&&(num(st.eliteFound,0)>0||num(st.legendaryFound,0)>0)) m.firsts.elite=unk();
    if(!m.firsts.custom&&(S.customStrains||[]).length>0) m.firsts.custom=unk();
    if(!m.records.largestHarvest&&num(st.biggestHarvest,0)>0) m.records.largestHarvest={oz:num(st.biggestHarvest,0),strainName:'',day:1,unknown:true};
  }catch(e){}
}
function ME_strainName(id){ try{ const st=getStrain(id); return st?st.name:String(id); }catch(e){ return String(id); } }
function ME_first(key,detail){
  /* record-once: returns true only when this is genuinely the first */
  try{
    ME_ensure();
    if(!S.memory.firsts[key]){ S.memory.firsts[key]=detail; try{ save(); }catch(e){} return true; }
  }catch(e){}
  return false;
}
function ME_eliteDetail(strainId,ph,rarity){
  try{ ME_first('elite',{strainId:strainId,strainName:ME_strainName(strainId),phenoNum:int(ph&&ph.num,0),rarity:rarity,day:int(S.day,1)}); }catch(e){}
  try{ if(typeof MS_onElite==='function') MS_onElite(); }catch(e){} /* P3-W6 milestone: FIRST ELITE EXPRESSION */
}
function ME_recordHarvest(st,oz,potency,terpenes,resin){
  /* records only ever move UP - ties keep the earlier harvest */
  try{
    ME_ensure();
    const rec=S.memory.records, day=int(S.day,1), nm=st?st.name:'';
    if(!rec.largestHarvest||num(oz,0)>num(rec.largestHarvest.oz,0)) rec.largestHarvest={oz:num(oz,0),strainName:nm,day:day};
    [['potency',potency],['terpenes',terpenes],['resin',resin]].forEach(kv=>{
      const v=num(kv[1],0);
      if(v>num(rec[kv[0]]&&rec[kv[0]].val,0)) rec[kv[0]]={val:Math.round(v),strainName:nm,day:day};
    });
    try{ save(); }catch(e){}
  }catch(e){}
}
function ME_longestKept(){
  /* derived live from the vault - the oldest keeper still preserved */
  try{
    const ks=S.keepers||[]; if(!ks.length) return null;
    const day=int(S.day,1); let b=null;
    ks.forEach(k=>{ const kept=Math.max(0,day-int(k.dayFound,day));
      if(!b||kept>b.daysKept) b={strainName:String(k.strainName||''),phenoNum:int(k.phenoNum,0),dayFound:int(k.dayFound,day),daysKept:kept}; });
    return b;
  }catch(e){ return null; }
}
function ME_mostGrown(){
  /* derived live from S.stats.strainGrown - most-run strain */
  try{
    const sg=(S.stats&&S.stats.strainGrown)||{}; let b=null;
    Object.keys(sg).forEach(id=>{ const c=num(sg[id]&&sg[id].count,0);
      if(c>0&&(!b||c>b.count)) b={strainId:id,strainName:ME_strainName(id),count:c,best:Math.round(num(sg[id].best,0))}; });
    return b;
  }catch(e){ return null; }
}

function NX_activeProfile(){
  if(!NX_KEY||NX_KEY==='soge_save_v1') return null;
  const pid=NX_KEY.replace('soge_save_v1_','');
  return NX_profiles().find(p=>p.id===pid)||null;
}

/* ---------------- notification center (toast feed) ---------------- */
let NX_toastWrapped=false, NX_toastOrig=null;
function NX_installToastWrap(){
  if(NX_toastWrapped) return; NX_toastWrapped=true;
  try{ NX_toastOrig=toast; }catch(e){ return; }
  toast=function(msg,ms){
    try{ NX_notify(msg); }catch(e){}
    return NX_toastOrig(msg,ms);
  };
}
function NX_catFor(msg){
  const m=String(msg);
  if(/💧|irrigat|water/i.test(m)) return {c:'water',s:'grow'};
  if(/⚠️|warn|alert|VPD|malfunction/i.test(m)) return {c:'alert',s:'home'};
  if(/🌱|clone|rooted/i.test(m)) return {c:'grow',s:'grow'};
  if(/🧬|pheno|keeper|breed|mutation/i.test(m)) return {c:'genetics',s:'genetics'};
  if(/🏆|achievement|trophy|mission/i.test(m)) return {c:'trophy',s:'missions'};
  if(/🛒|order|customer|dispensary/i.test(m)) return {c:'shop',s:'dispensary'};
  if(/💰|\$|revenue|sale/i.test(m)) return {c:'cash',s:'dispensary'};
  if(/⚡|equipment|power/i.test(m)) return {c:'equip',s:'empire'};
  if(/👑|rank|level/i.test(m)) return {c:'crown',s:'profile'};
  return {c:'info',s:'home'};
}
function NX_notify(msg,cat,screen){
  NX_ensureNx();
  const meta=cat?{c:cat,s:screen||'home'}:NX_catFor(msg);
  S.nx.notifs.unshift({t:Date.now(),day:int(S.day,1),msg:String(msg).slice(0,220),cat:meta.c,screen:meta.s,read:false});
  if(S.nx.notifs.length>120) S.nx.notifs.length=120;
  S.nx.unread=int(S.nx.unread,0)+1;
}
const NX_CAT_ICO={water:'water',alert:'warn',grow:'grow',genetics:'genetics',trophy:'trophy',shop:'dispensary',cash:'cash',equip:'equipment',crown:'crown-gold',info:'star'};
RENDER.notifs=function(){
  const r=$('notifs-root'); if(!r) return;
  NX_ensureNx();
  const list=S.nx.notifs;
  let html='<div class="ge-screen">'+
   '<div class="ge-screenhead"><button class="ge-screenhead-back" onclick="show(\'menu\')">'+
    icon('x','ge-ic-md')+'<span>MENU</span></button>'+
   '<h2 class="ge-screenhead-title">'+icon('warn','ge-ic-lg')+'NOTIFICATION CENTER</h2></div>'+
   '<div class="ge-btn-row"><button class="ge-btn ge-btn-ghost" id="nx-nr">'+icon('check','ge-ic-md')+'MARK ALL READ</button><button class="ge-btn ge-btn-danger" id="nx-nc">'+icon('x','ge-ic-md')+'CLEAR</button></div>';
  if(!list.length) html+='<div class="ge-empty">'+icon('warn','ge-ic-xl')+'<h3>ALL QUIET</h3><p>No notifications yet. Your empire will report here.</p></div>';
  list.forEach((n,i)=>{
    html+='<button class="ge-notif'+(n.read?' is-read':'')+'" data-ni="'+i+'"><span class="ge-notif-ico">'+icon(NX_CAT_ICO[n.cat]||'star','ge-ic-md')+'</span>'+
     '<span class="ge-notif-body"><span class="ge-notif-msg">'+n.msg+'</span><span class="ge-notif-meta ge-caption ge-muted">Day '+n.day+' • TAP TO VIEW</span></span>'+
     (n.read?'':'<span class="ge-unread"></span>')+'</button>';
  });
  html+='</div>';
  r.innerHTML=html;
  $('nx-nr').onclick=()=>{ list.forEach(n=>n.read=true); S.nx.unread=0; save(); RENDER.notifs(); };
  $('nx-nc').onclick=()=>{ S.nx.notifs=[]; S.nx.unread=0; save(); RENDER.notifs(); };
  r.querySelectorAll('[data-ni]').forEach(b=>b.onclick=()=>{ const n=list[int(b.dataset.ni,0)]; if(n){ n.read=true; S.nx.unread=Math.max(0,int(S.nx.unread,0)-1); save(); if(n.screen&&SCREENS.includes(n.screen)) show(n.screen); } });
};


/* ---------------- EMPIRE SAVED (subtle, throttled) ---------------- */
let NX_lastSavedToast=0;
function NX_saved(){
  const now=Date.now();
  if(now-NX_lastSavedToast<90000) return;
  NX_lastSavedToast=now;
  try{ toast(icon('check','ge-ic-md')+' EMPIRE SAVED'); }catch(e){}
}


/* ---------------- nx state ---------------- */
function NX_ensureNx(){
  if(!S) return;
  if(!S.nx||typeof S.nx!=='object') S.nx={};
  const n=S.nx;
  if(!Array.isArray(n.notifs)) n.notifs=[];
  n.unread=int(n.unread,0);
  if(!Array.isArray(n.titles)) n.titles=[];
  if(typeof n.displayTitle!=='string') n.displayTitle='';
  if(!Array.isArray(n.reviews)) n.reviews=[];
  if(typeof n.breedGoal!=='string') n.breedGoal='';
  n.lastSeen=num(n.lastSeen,0);
}
function NX_migrate(){
  NX_ensureNx();
  /* stamp inventory freshness for pre-existing items */
  if(Array.isArray(S.inventory)) S.inventory.forEach(it=>{ if(!it.packedDay) it.packedDay=int(S.day,1); });
  if(Array.isArray(S.keepers)) S.keepers.forEach(k=>{ if(!Array.isArray(k.records)) k.records=[]; });
  return true;
}
/* ============================================================
   EXPANSION NX — Chunk 2: grower profile + titles, automation
   tech tree, keeper extras (rename/history/rerun/chime),
   breeding goals, phenotype trait display additions.
   ============================================================ */

/* ---------------- grower titles ---------------- */
const NX_TITLES=[
 {id:'rookie',name:'Rookie Grower',desc:'Every empire starts with one seed.',test:()=>true},
 {id:'cultivator',name:'Cultivator',desc:'Complete 10 harvests.',test:()=>num(S.stats.harvests,0)>=10},
 {id:'phenohunter',name:'Phenohunter',desc:'Test 25 phenotypes.',test:()=>num(S.stats.phenoTested,0)>=25},
 {id:'mastergrower',name:'Master Grower',desc:'Reach level 15.',test:()=>int(S.level,1)>=15},
 {id:'masterbreeder',name:'Master Breeder',desc:'Create 25 crosses.',test:()=>num(S.stats.crosses,0)>=25},
 {id:'commercial',name:'Commercial Cultivator',desc:'Reach facility tier 6+.',test:()=>{ try{return facTierIdx()>=5;}catch(e){return false;} }},
 {id:'hashmaker',name:'Hash Maker',desc:'Process 100 oz.',test:()=>num(S.stats.processedOz,0)>=100},
 {id:'collector',name:'Genetics Collector',desc:'Unlock 20 genetics.',test:()=>{ try{return unlockedCount(S)>=20;}catch(e){return false;} }},
 {id:'p0',name:'Project 0 Preservationist',desc:'Earn 100 Project 0 points.',test:()=>num(S.project0.points,0)>=100},
 {id:'owner',name:'Empire Owner',desc:'Build a $1,000,000 empire.',test:()=>NX_empireValue()>=1000000}
];
function NX_earnedTitles(){ return NX_TITLES.filter(t=>{ try{return t.test();}catch(e){return false;} }); }
function NX_empireValue(){
  let v=num(S.cash,0);
  try{ (S.inventory||[]).forEach(it=>{ v+=num(it.amount,0)*num(it.pricePerOz||it.price||20,20)/16*0+num(it.amount,0)*25; }); }catch(e){}
  try{ v+=S.keepers.length*2500+S.mothers.length*5000; }catch(e){}
  try{ v+=int(S.facility,0)*15000; }catch(e){}
  return Math.round(v);
}
function NX_bestPotency(){
  let b=0;
  try{ (S.keepers||[]).forEach(k=>{ b=Math.max(b,num(k.genetics&&k.genetics.potencyPot,0)); }); }catch(e){}
  try{ (S.inventory||[]).forEach(it=>{ b=Math.max(b,num(it.potency,0)); }); }catch(e){}
  return Math.round(b);
}
function NX_repStars(){ const r=int(S.reputation,0); return clamp(1+Math.floor(r/600),1,5); }
RENDER.profile=function(){
  const r=$('profile-root'); if(!r) return;
  NX_ensureNx();
  const prof=NX_activeProfile();
  const grower=prof?prof.grower:'GUEST';
  let rank='STREET ROOKIE'; try{ rank=TY_rankName(); }catch(e){}
  const earned=NX_earnedTitles();
  const disp=S.nx.displayTitle||rank;
  const nStars=NX_repStars();
  let stars=''; for(let i=0;i<5;i++) stars+='<span class="ge-star'+(i<nStars?' on':'')+'">'+icon('star','ge-ic-sm')+'</span>';
  const ach=S.achievements||[];
  let html='<div class="ge-screen">'+
   '<div class="ge-screenhead"><button class="ge-screenhead-back" onclick="show(\'menu\')">'+
    icon('x','ge-ic-md')+'<span>MENU</span></button>'+
   '<h2 class="ge-screenhead-title">'+icon('star','ge-ic-lg')+'GROWER PROFILE</h2></div>'+
  '<div class="ge-card ge-card-hot ge-dossier ge-anim-rise"><div class="ge-dossier-mask">'+icon('gasmask','ge-ic-xl')+'</div>'+
   '<div class="ge-dossier-name ge-display">'+esc(grower)+'</div>'+
   '<div class="ge-badge ge-badge-legendary">'+esc(disp)+'</div>'+
   '<div class="ge-dossier-sub">'+esc(rank)+' — Level '+int(S.level,1)+'</div>'+
   '<div class="ge-stars ge-dossier-stars">'+stars+'</div>'+
   '<div class="ge-dossier-id"><div><span class="ge-label ge-muted">REP</span><b class="ge-num">'+int(S.reputation,0)+'</b></div>'+
   '<div><span class="ge-label ge-muted">EMPIRE VALUE</span><b class="ge-num ge-gold-text">'+fmt$(NX_empireValue())+'</b></div></div></div>'+
  '<div class="ge-section-title">EMPIRE RECORD</div><div class="ge-tiles ge-tiles-4">'+
   PF_tile(icon('harvest','ge-ic-md'),'PLANTS HARVESTED',num(S.stats.harvests,0))+
   PF_tile(icon('harvest','ge-ic-md'),'LIFETIME YIELD',(num(S.stats.lifetimeHarvestOz,0)/16).toFixed(1)+' lbs')+
   PF_tile(icon('star','ge-ic-md'),'HIGHEST POTENCY',NX_bestPotency()+'%')+
   PF_tile(icon('harvest','ge-ic-md'),'BEST YIELD',num(S.stats.biggestHarvest,0).toFixed(1)+' oz')+
   PF_tile(icon('keepers','ge-ic-md'),'KEEPERS',S.keepers.length)+
   PF_tile(icon('genetics','ge-ic-md'),'STRAINS CREATED',(S.customStrains||[]).length)+
   PF_tile(icon('dispensary','ge-ic-md'),'DISPENSARY REVENUE',fmt$(S.stats.lifetimeRevenue))+
   PF_tile(icon('trophy','ge-ic-md'),'ACHIEVEMENTS',S.achievements.length+'/'+ACHIEVEMENTS.length)+
   PF_tile(icon('project0','ge-ic-md'),'PROJECT 0 SCORE',num(S.project0.points,0))+
  '</div>'+
  '<div class="ge-section-title">TITLES<span class="ge-spread ge-num">'+earned.length+'/'+NX_TITLES.length+'</span></div>'+
  (typeof P0T_legacyHTML==='function'?P0T_legacyHTML():'')+ /* P3-W3: LEGACY place of honor */
  '<p class="ge-caption ge-muted">Tap an earned title to display it.</p><div class="ge-title-grid">';
  NX_TITLES.forEach(t=>{
    const has=earned.some(e=>e.id===t.id), sel=S.nx.displayTitle===t.name;
    html+='<button class="ge-title'+(has?' has':'')+(sel?' sel':'')+'" data-title="'+t.id+'"'+(has?'':' disabled')+'>'+
     '<b>'+esc(t.name)+'</b><span class="ge-caption">'+esc(t.desc)+'</span>'+(has?icon('check','ge-ic-sm'):icon('lock','ge-ic-sm'))+'</button>';
  });
  html+='</div>'+
  '<div class="ge-section-title">ACHIEVEMENT SHOWCASE</div><div class="ge-card ge-card-flat">';
  html+=ach.length?'<div class="ge-ach-tags">'+ach.slice(-12).map(id=>{
    const ad=ACHIEVEMENTS.find(x=>x.id===id); /* P1.0: render names + icons, not raw ids */
    const anm=ad?(typeof MS_stripEmoji==='function'?MS_stripEmoji(ad.name):ad.name):String(id);
    return '<span class="ge-badge ge-badge-legendary">'+icon((typeof MS_achIcon==='function'?MS_achIcon(id):'trophy'),'ge-ic-sm')+esc(anm)+'</span>';
  }).join('')+'</div>':'<p class="ge-caption ge-muted">No achievements yet — the grind awaits.</p>';
  html+='</div></div>';
  r.innerHTML=html;
  r.querySelectorAll('[data-title]').forEach(b=>b.onclick=()=>{
    const t=NX_TITLES.find(x=>x.id===b.dataset.title);
    if(t&&earned.some(e=>e.id===t.id)){ S.nx.displayTitle=t.name; save(); toast(icon('crown-gold','ge-ic-md')+' Title set: '+esc(t.name)); RENDER.profile(); }
  });
  /* P3-W6: wire cross-link buttons (e.g. LEGACY place of honor) */
  r.querySelectorAll('[data-ex-go]').forEach(b=>b.onclick=()=>{
    if(b.dataset.exTab) empireTab=b.dataset.exTab;
    show(b.dataset.exGo);
  });
};


/* ---------------- automation tech tree ---------------- */
const NX_TECH_TIERS=[
 {name:'BEGINNER',desc:'Hands-on. Every legend starts here.',nodes:[
   {id:'t-hand-water',name:'Hand Watering',desc:'You, a jug, and attention to detail.',ico:'water'},
   {id:'t-hand-feed',name:'Manual Feeding',desc:'Mix, measure, pour. Feel the grow.',ico:'feed'},
   {id:'t-manual-env',name:'Manual Environment',desc:'Read the gauges. Ride the dials.',ico:'temp'}]},
 {name:'APPRENTICE',desc:'Timers and alerts. The training wheels.',nodes:[
   {id:'t-timers',name:'Irrigation Timers',desc:'Scheduled watering. Requires Level 3.',ico:'water',lvl:3},
   {id:'t-alerts',name:'Environmental Alerts',desc:'Get warned before disaster. Requires Level 4.',ico:'warn',lvl:4},
   {id:'t-reservoir',name:'Basic Reservoir',desc:'Bigger buffer, fewer refills. Requires Level 5.',ico:'drop',lvl:5}]},
 /* P3-W4: the earned tech-tree spine — MANUAL (Beginner tier above) →
    BASIC TIMERS → AUTO-WATER → AUTO-FEED → ENVIRONMENT CONTROLLER →
    IRRIGATION CONTROLLER → NUTRIENT DOSER (feed line) → CLIMATE
    AUTOMATION → ADVANCED GROW AI. Each tier requires the previous tier
    installed, plus its own level / rep / facility / mission gates. */
 {name:'BASIC TIMERS',desc:'Scheduled micro-watering. The first machine.',nodes:[{id:'timers',am:true}],chain:1},
 {name:'AUTO-WATER',desc:'Drip lines take over hydration.',nodes:[{id:'water',am:true}],chain:2},
 {name:'AUTO-FEED',desc:'Precision fertigation, never burned.',nodes:[{id:'feed',am:true}],chain:3},
 {name:'ENVIRONMENT CONTROLLER',desc:'Holds the room at 76°F / 55% RH.',nodes:[{id:'envctrl',am:true}],chain:4},
 {name:'IRRIGATION CONTROLLER',desc:'High-capacity precision irrigation.',nodes:[{id:'irrctrl',am:true}],chain:5},
 {name:'SMART LIGHTING',desc:'Rides the dimmer for every strain.',nodes:[{id:'light',am:true}],chain:6},
 {name:'CLIMATE AUTOMATION',desc:'Your targets, held against the weather.',nodes:[{id:'climate',am:true}],chain:7},
 {name:'PROCESSING',desc:'A second shift in the lab.',nodes:[{id:'processing',am:true}],chain:8},
 {name:'LOGISTICS',desc:'Product moves itself to shelves.',nodes:[{id:'restock',am:true}],chain:9},
 {name:'MANAGEMENT',desc:'Supervised automation.',nodes:[{id:'manager',am:true}],chain:10},
 {name:'ADVANCED GROW AI',desc:'The machine coordinates itself. It advises — never decides.',nodes:[{id:'growai',am:true}],chain:11}
];
function NX_techNodeState(nd){
  if(nd.am){
    const sys=AM_SYSTEMS[nd.id], st=(S.am&&S.am[nd.id])||{};
    if(st.owned) return 'owned';
    /* P3-W4: full earned-gate inspection — rank, previous tier, level, rep,
       facility, mission (cash is checked at purchase). */
    let gates=[];
    try{ gates=(typeof AM_gateList==='function')?AM_gateList(nd.id):[]; }catch(e){}
    const unmet=gates.filter(g=>!g.met&&g.key!=='cash');
    const prev=(typeof AM_chainPrev==='function')?AM_chainPrev(nd.id):null;
    return {state:unmet.length?'locked':'available',sys:sys,gates:gates,unmet:unmet,prev:prev};
  }
  const lvl=int(S.level,1);
  if(!nd.lvl) return {state:'owned'};
  return {state:lvl>=nd.lvl?'owned':'locked'};
}
/* P3-W4: requirement text + previous-tier name for tech-tree nodes. */
function NX_techReqText(nd,info,sys){
  try{
    if(info&&typeof info==='object'&&info.unmet){
      const parts=info.unmet.map(g=>g.label+': '+g.need);
      return 'Requires: '+parts.join(' • ')+' • '+fmt$(sys.cost);
    }
    if(info&&typeof info==='object'&&info.rankName) return 'Requires: '+info.rankName+' • '+fmt$(sys.cost);
  }catch(e){}
  return '';
}
function NX_techPrevName(info){
  try{
    if(info&&typeof info==='object'&&info.prev&&typeof AM_SYSTEMS!=='undefined'&&AM_SYSTEMS[info.prev]) return AM_SYSTEMS[info.prev].name;
  }catch(e){}
  return null;
}
RENDER.techtree=function(){
  const r=$('techtree-root'); if(!r) return;
  let html='<div class="ge-screen">'+
   '<div class="ge-screenhead"><button class="ge-screenhead-back" onclick="show(\'menu\')">'+
    icon('x','ge-ic-md')+'<span>MENU</span></button>'+
   '<h2 class="ge-screenhead-title">'+icon('equipment','ge-ic-lg')+'AUTOMATION TECH TREE</h2></div>'+
   '<p class="ge-caption ge-muted">Automation is earned, never given. Climb the tiers.</p><div class="ge-tree">';
  NX_TECH_TIERS.forEach((tier,ti)=>{
    html+='<div class="ge-tier"><div class="ge-tier-head"><span class="ge-tier-num">'+(ti+1)+'</span><div><b>'+tier.name+'</b><p class="ge-caption ge-muted">'+tier.desc+'</p></div></div><div class="ge-tier-nodes">';
    tier.nodes.forEach(nd=>{
      if(nd.am){
        const sys=AM_SYSTEMS[nd.id], info=NX_techNodeState(nd);
        const state=typeof info==='string'?info:info.state;
        const req=NX_techReqText(nd,info,sys);
        const prevName=NX_techPrevName(info);
        html+='<div class="ge-node '+state+'"><span class="ge-node-ico">'+icon(sys.ico,'ge-ic-lg')+'</span><div class="ge-node-body"><b>'+esc(sys.name)+'</b><p class="ge-caption ge-muted">'+esc(sys.desc)+'</p>'+
         (prevName?'<p class="ge-caption ge-muted">'+icon('lock','ge-ic-sm')+' Builds on: <b>'+esc(prevName)+'</b></p>':'')+
         (state==='owned'?'<span class="ge-badge ge-badge-keeper">'+icon('check','ge-ic-sm')+'INSTALLED</span>':state==='available'?'<span class="ge-badge ge-badge-legendary">AVAILABLE</span>':'<span class="ge-badge">'+icon('lock','ge-ic-sm')+' '+esc(req)+'</span>')+'</div>'+
         (state==='available'?'<button class="ge-btn ge-btn-gold" data-buyam="'+nd.id+'">INSTALL — '+fmt$(sys.cost)+'</button>':'')+'</div>';
      } else {
        const info=NX_techNodeState(nd), state=info.state;
        html+='<div class="ge-node '+state+'"><span class="ge-node-ico">'+icon(nd.ico||'check','ge-ic-lg')+'</span><div class="ge-node-body"><b>'+esc(nd.name)+'</b><p class="ge-caption ge-muted">'+esc(nd.desc)+'</p>'+
         (state==='owned'?'<span class="ge-badge ge-badge-keeper">'+icon('check','ge-ic-sm')+'MASTERED</span>':'<span class="ge-badge">'+icon('lock','ge-ic-sm')+' LEVEL '+nd.lvl+'</span>')+'</div></div>';
      }
    });
    html+='</div></div>'+(ti<NX_TECH_TIERS.length-1?'<div class="ge-tree-link"></div>':'');
  });
  html+='</div><button class="ge-btn ge-btn-block" onclick="show(\'automation\')">OPEN CONTROL CENTER</button></div>';
  r.innerHTML=html;
  r.querySelectorAll('[data-buyam]').forEach(b=>b.onclick=()=>{ if(AM_buy(b.dataset.buyam)){ NX_saved(); RENDER.techtree(); updateHUD(); } });
};


/* ---------------- keeper extras ---------------- */
function NX_chime(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    const ac=new AC(), t=ac.currentTime;
    [523.25,659.25,783.99,1046.5].forEach((f,i)=>{
      const o=ac.createOscillator(), g=ac.createGain();
      o.type='sine'; o.frequency.value=f;
      g.gain.setValueAtTime(0.0001,t+i*0.12); g.gain.exponentialRampToValueAtTime(0.18,t+i*0.12+0.03);
      g.gain.exponentialRampToValueAtTime(0.0001,t+i*0.12+0.5);
      o.connect(g); g.connect(ac.destination); o.start(t+i*0.12); o.stop(t+i*0.12+0.55);
    });
  }catch(e){}
}
function NX_wrapKeepers(){
  if(typeof RENDER.keepers!=='function'||NX_wrappedKeepers) return; NX_wrappedKeepers=true;
  const orig=RENDER.keepers;
  RENDER.keepers=function(){ orig(); NX_keeperExtras(); };
}
let NX_wrappedKeepers=false;
function NX_keeperExtras(){
  const r=$('keepers-root'); if(!r) return;
  r.querySelectorAll('.keeper-card').forEach(card=>{
    const cmpBtn=card.querySelector('[data-cmp]'); if(!cmpBtn) return;
    const id=cmpBtn.dataset.cmp;
    const row=card.querySelector('.btn-row'); if(!row||row.querySelector('[data-krename]')) return;
    const add=(ds,label,ico)=>{ const b=document.createElement('button'); b.className='btn btn-small'; b.dataset[ds]=id; b.innerHTML=icon(ico,'b-ico')+label; row.appendChild(b); return b; };
    add('krename','RENAME','star').onclick=()=>NX_renameKeeper(id);
    add('khist','HISTORY','scroll').onclick=()=>NX_keeperHistory(id);
    add('krerun','RERUN','grow').onclick=()=>NX_rerunKeeper(id);
  });
}
function NX_getKeeper(id){ return (S.keepers||[]).find(k=>k.id===id); }
function NX_renameKeeper(id){
  const k=NX_getKeeper(id); if(!k) return;
  const m=modal('<h3>'+icon('star','ic')+' RENAME KEEPER</h3><p class="muted">'+esc(k.strainName)+' #'+k.phenoNum+'</p>'+
   '<input class="nx-in" id="nx-kn" enterkeyhint="done" maxlength="40" value="'+esc(k.customName||'')+'" placeholder="Custom keeper name (optional)">'+
   '<div class="btn-row"><button class="btn" id="nx-kn-c">CANCEL</button><button class="btn btn-gold" id="nx-kn-ok">SAVE</button></div>');
  m.querySelector('#nx-kn-c').onclick=()=>m.remove();
  m.querySelector('#nx-kn-ok').onclick=()=>{ k.customName=m.querySelector('#nx-kn').value.trim().slice(0,40); save(); NX_saved(); m.remove(); RENDER.keepers(); toast('👑 Keeper renamed.'); };
}
function NX_keeperHistory(id){
  const k=NX_getKeeper(id); if(!k) return;
  const g=k.genetics||{};
  const recs=(k.records||[]).slice(-5).reverse();
  modal('<h3>'+icon('scroll','ic')+' '+(k.customName?esc(k.customName)+' — ':'')+esc(k.strainName)+' #'+k.phenoNum+'</h3>'+
   '<div class="kv"><span>Discovered</span><b>Day '+k.dayFound+'</b></div>'+
   '<div class="kv"><span>Generation</span><b>'+esc(k.generation||'—')+'</b></div>'+
   '<div class="kv"><span>Lineage</span><b>'+esc(k.lineage||'—')+'</b></div>'+
   '<div class="kv"><span>Rarity</span><b>'+esc(k.rarity||'').toUpperCase()+'</b></div>'+
   '<div class="kv"><span>Harvests</span><b>'+int(k.harvests,0)+'</b></div>'+
   '<div class="kv"><span>Best / Avg quality</span><b>'+Math.round(num(k.bestQuality,0))+' / '+Math.round(num(k.avgQuality,k.bestQuality))+'</b></div>'+
   '<div class="kv"><span>Best / Avg yield</span><b>'+num(k.bestYield,0)+' / '+num(k.avgYield,k.bestYield)+' oz</b></div>'+
   '<div class="kv"><span>Clone runs</span><b>'+int(k.cloneRuns,0)+'</b></div>'+
   '<div class="kv"><span>Breeding uses</span><b>'+int(k.breedingUses,0)+'</b></div>'+
   (k.awards&&k.awards.length?'<div class="kv"><span>Awards</span><b>'+k.awards.map(esc).join(', ')+'</b></div>':'')+
   (recs.length?'<h3 style="margin-top:8px">Recent harvests</h3>'+recs.map(h=>'<div class="kv"><span>Day '+h.day+'</span><b>Q'+Math.round(h.q)+' • '+h.oz+' oz</b></div>').join(''):'')+
   '<button class="btn" onclick="this.closest(\'.modal-back\').remove()">CLOSE</button>');
}
function NX_rerunKeeper(id){
  const k=NX_getKeeper(id); if(!k||!k.genetics) return;
  const st=getStrain(k.strainId);
  if(!st||!isUnlocked(k.strainId)){ toast(icon('x','ge-ic-md')+' Strain not available.'); return; }
  if(S.plants.length>=FACILITIES[clamp(int(S.facility,0),0,FACILITIES.length-1)].slots){ toast(icon('x','ge-ic-md')+' No open plant slots.'); return; }
  const p=NX_makeKeeperPlant(k);
  S.plants.push(p); S.stats.plantsStarted++;
  try{ ME_first('plant',{strainId:p.strainId,name:ME_strainName(p.strainId),day:int(S.day,1)}); }catch(e){} /* P2.5 player memory */
  try{ codexOnGrown(k.strainId); }catch(e){} /* P2-W2: keeper rerun counts as grown */
  save(); updateHUD();
  toast(icon('grow','ge-ic-md')+' Rerunning '+esc(k.strainName)+' #'+k.phenoNum+' — same genetics, new run.');
  show('grow');
}
function NX_makeKeeperPlant(k){
  const g=k.genetics||{};
  const ph={num:nextPhenoNum(k.strainId)};
  PHENO_KEYS.forEach(key=>{ ph[key]=clamp(num(g[key],50),5,100); });
  ph.rarity=k.rarity||'common'; ph.legendaryTrait=k.legendaryTrait||null; ph.legendaryHidden=false;
  ph.known={}; PHENO_KEYS.forEach(key=>{ ph.known[key]=true; }); /* keeper genetics are documented */
  ph.expressed=(k.traits||[]).slice(); ph.inspectCount=99; ph.isClone=false;
  ph.motherId=null; ph.keeperId=k.id; ph.cloneGen=0; ph.huntId=null;
  return {id:S.nextPlantId++,strainId:k.strainId,day:0,health:100,water:80,nutrition:70,stress:0,problems:[],minHealth:100,pheno:ph,growthBoost:0};
}

/* ---------------- breeding goals ---------------- */
const NX_BREED_GOALS=[
 {id:'',name:'No specific goal'},
 {id:'potencyPot',name:'Increase potency'},
 {id:'yieldPot',name:'Increase yield'},
 {id:'flowerSpeed',name:'Shorten flowering time'},
 {id:'terpenePot',name:'Increase terpene intensity'},
 {id:'stability',name:'Improve stability'},
 {id:'stressTol',name:'Improve stress tolerance'},
 {id:'rare',name:'Preserve rare traits'}
];
function NX_wrapBreeding(){
  if(typeof RENDER.breeding!=='function'||NX_wrappedBreeding) return; NX_wrappedBreeding=true;
  const orig=RENDER.breeding;
  RENDER.breeding=function(){ orig(); NX_breedingGoalUI(); };
  if(typeof GX_enrichCross==='function'&&!NX_wrappedCross){
    NX_wrappedCross=true;
    const oc=GX_enrichCross;
    GX_enrichCross=function(cross,A,B){
      const out=oc(cross,A,B);
      try{ NX_applyBreedGoal(out); }catch(e){}
      return out;
    };
  }
}
let NX_wrappedBreeding=false, NX_wrappedCross=false;
function NX_breedingGoalUI(){
  const r=$('breeding-root'); if(!r||r.querySelector('#nx-goal')) return;
  const d=document.createElement('div'); d.className='card';
  d.innerHTML='<h3>'+icon('genetics','ic-lg')+'BREEDING GOAL</h3><p class="muted">Bias offspring trait rolls toward your goal.</p>'+
   '<select id="nx-goal">'+NX_BREED_GOALS.map(g=>'<option value="'+g.id+'"'+(S.nx.breedGoal===g.id?' selected':'')+'>'+esc(g.name)+'</option>').join('')+'</select>';
  r.insertBefore(d,r.firstChild);
  d.querySelector('#nx-goal').onchange=e=>{ S.nx.breedGoal=e.target.value; save(); toast(icon('dna','ge-ic-md')+' Breeding goal: '+esc(NX_BREED_GOALS.find(g=>g.id===S.nx.breedGoal).name)); };
}
function NX_applyBreedGoal(cross){
  const goal=S.nx&&S.nx.breedGoal; if(!cross||!cross.traitRanges) return;
  const boost=(key,amt)=>{ const r=cross.traitRanges[key]; if(r){ r[0]=clamp(r[0]+amt,5,100); r[1]=clamp(r[1]+amt,5,100); } };
  if(goal==='rare'){ cross.rarityBoost=true; return; }
  if(goal&&cross.traitRanges[goal]) boost(goal,8);
}
/* ============================================================
   EXPANSION NX — Chunk 3: dispensary 2.0, inventory decisions,
   property limits, events, missions, achievements, leaderboards,
   challenges, migration to save v3, init + boot wiring.
   ============================================================ */

/* ---------------- dispensary 2.0 ---------------- */
function NX_freshFactor(it){
  if(!it||!it.packedDay) return 1;
  const age=Math.max(0,int(S.day,1)-int(it.packedDay,1));
  return Math.max(0.6, 1-age*0.008);
}
function NX_freshLabel(it){
  if(!it||!it.packedDay) return '';
  const age=Math.max(0,int(S.day,1)-int(it.packedDay,1));
  const f=NX_freshFactor(it);
  const cls=f>=0.95?'green':f>=0.8?'gold':'';
  return ' <span class="badge '+cls+'">FRESH '+Math.round(f*100)+'% • '+age+'d</span>';
}
function NX_wrapDispensary(){
  if(typeof RENDER.dispensary!=='function'||NX_wrappedDisp) return; NX_wrappedDisp=true;
  const orig=RENDER.dispensary;
  RENDER.dispensary=function(){
    orig();
    try{ NX_dispExtras(); }catch(e){}
  };
  /* hash customers join the rotation */
  try{ if(typeof CT_TYPES!=='undefined'&&!CT_TYPES.includes('hash')) CT_TYPES.push('hash'); }catch(e){}
  /* reviews hook into checkout */
  if(typeof CT_checkout==='function'&&!NX_wrappedCheckout){
    NX_wrappedCheckout=true;
    const oc=CT_checkout;
    CT_checkout=function(id){ const r=oc(id); if(r) NX_maybeReview(); return r; };
  }
}
let NX_wrappedDisp=false, NX_wrappedCheckout=false;
const NX_REVIEW_TEXTS={
 5:['Absolute fire. Best in the city.','Terps for days. Instant regular.','Worth every dollar.'],
 4:['Great quality, solid price.','Really good — will be back.'],
 3:['Decent. Nothing crazy.','Mid-tier but fair.'],
 2:['Not impressed. Dry.','Harsh — needs a better cure.'],
 1:['Never again.','Worst purchase this month.']};
function NX_maybeReview(){
  if(Math.random()>0.45) return;
  const stars=Math.random()<0.6?5:Math.random()<0.75?4:Math.random()<0.85?3:2;
  const txt=pick(NX_REVIEW_TEXTS[stars]);
  S.nx.reviews.unshift({day:int(S.day,1),stars:stars,text:txt});
  if(S.nx.reviews.length>30) S.nx.reviews.length=30;
  if(stars>=4){ gainRep(2); try{ if(typeof TY_repMirror==='function') TY_repMirror(2); }catch(e){} }
  else if(stars<=2){ gainRep(-1); }
  NX_notify('Customer review: '+stars+'/5 — "'+txt+'"', stars>=4?'trophy':'alert','dispensary');
  save();
}
function NX_dispExtras(){
  const r=$('dispensary-root'); if(!r) return;
  /* freshness badges + decision buttons on product cards */
  const cards=r.querySelectorAll('.product-card');
  cards.forEach(card=>{
    const sellBtn=card.querySelector('[data-sell]'); if(!sellBtn) return;
    const it=S.inventory.find(x=>x.id===+sellBtn.dataset.sell); if(!it) return;
    const h3=card.querySelector('h3'); if(h3&&!h3.querySelector('.nx-fresh')){ const sp=document.createElement('span'); sp.className='nx-fresh'; sp.innerHTML=NX_freshLabel(it); h3.appendChild(sp); }
    const row=card.querySelector('.btn-row'); if(!row||row.querySelector('[data-nxhold]')) return;
    const mk=(ds,label,ico,on)=>{ const b=document.createElement('button'); b.className='btn btn-small'; b.dataset[ds]=it.id; b.innerHTML=icon(ico,'b-ico')+label; if(on) b.classList.add('btn-gold'); b.onclick=()=>NX_invDecision(it.id,ds); row.appendChild(b); };
    mk('nxhold',it.held?'UNHOLD':'HOLD','lock',it.held);
    mk('nxreserve',it.reserved?'UNRESERVE':'RESERVE','dispensary',it.reserved);
    mk('nxbreed',it.breedTag?'UNTAG':'SEED STOCK','genetics',it.breedTag);
    const cmp=document.createElement('button'); cmp.className='btn btn-small'; cmp.innerHTML=icon('inspect','b-ico')+'COMPARE';
    cmp.onclick=()=>NX_compareProduct(it.id); row.appendChild(cmp);
  });
  /* reviews panel */
  if(!r.querySelector('#nx-reviews')&&S.nx.reviews.length){
    const d=document.createElement('div'); d.className='card'; d.id='nx-reviews';
    const avg=(S.nx.reviews.reduce((a,x)=>a+x.stars,0)/S.nx.reviews.length).toFixed(1);
    d.innerHTML='<h3>'+icon('star','ic-lg')+'CUSTOMER REVIEWS ('+avg+'/5)</h3>'+
     S.nx.reviews.slice(0,5).map(x=>'<div class="kv"><span>'+'★'.repeat(x.stars)+'☆'.repeat(5-x.stars)+' <span class="muted">"'+esc(x.text)+'"</span></span><b>Day '+x.day+'</b></div>').join('');
    r.appendChild(d);
  }
}
function NX_invDecision(id,action){
  const it=S.inventory.find(x=>x.id===id); if(!it) return;
  if(action==='nxhold'){ it.held=!it.held; toast(it.held?icon('lock','ge-ic-md')+' Held — excluded from quick sale.':icon('check','ge-ic-md')+' Released.'); }
  if(action==='nxreserve'){ it.reserved=!it.reserved; toast(it.reserved?icon('storefront','ge-ic-md')+' Reserved for dispensary shelves.':'Reservation cleared.'); }
  if(action==='nxbreed'){ it.breedTag=!it.breedTag; toast(it.breedTag?icon('dna','ge-ic-md')+' Tagged as breeding seed stock.':'Breeding tag removed.'); }
  save(); RENDER.dispensary(); updateHUD();
}
function NX_compareProduct(id){
  const a=S.inventory.find(x=>x.id===id); if(!a) return;
  const others=S.inventory.filter(x=>x.id!==id).slice(0,8);
  if(!others.length){ toast('Nothing to compare against.'); return; }
  const m=modal('<h3>'+icon('inspect','ic-lg')+'COMPARE PRODUCTS</h3><p class="muted">Select a product to compare with <b>'+esc(a.strainName)+'</b>:</p>'+
   '<select id="nx-cmp-sel" class="nx-in">'+others.map(o=>'<option value="'+o.id+'">'+esc(o.strainName)+' Q'+o.potency+' — '+o.amount+'oz</option>').join('')+'</select>'+
   '<div id="nx-cmp-out"></div><button class="btn" id="nx-cmp-x">CLOSE</button>');
  const render=()=>{
    const b=S.inventory.find(x=>x.id===+m.querySelector('#nx-cmp-sel').value); if(!b) return;
    const row=(l,va,vb,hi)=>{ const w=hi?(va>=vb):(va<=vb); return '<div class="kv"><span>'+l+'</span><b>'+(w?'→ ':'')+va+' vs '+vb+'</b></div>'; };
    m.querySelector('#nx-cmp-out').innerHTML='<div class="card">'+row('Quality',a.quality,b.quality,true)+row('Potency %',a.potency,b.potency,true)+
     row('Terpenes',a.terpenes,b.terpenes,true)+row('Freshness',Math.round(NX_freshFactor(a)*100)+'%',Math.round(NX_freshFactor(b)*100)+'%',true)+
     row('Amount oz',a.amount,b.amount,true)+'</div>';
  };
  m.querySelector('#nx-cmp-sel').onchange=render; render();
  m.querySelector('#nx-cmp-x').onclick=()=>m.remove();
}

/* ---------------- property limits panel ---------------- */
const NX_PROP_LADDER=['CLOSET','2×2 TENT','4×4 TENT','BEDROOM','BASEMENT','GARAGE','GROW HOUSE','WAREHOUSE','COMMERCIAL FACILITY','CANNABIS EMPIRE'];
function NX_wrapEmpire(){
  if(typeof RENDER.empire!=='function'||NX_wrappedEmpire) return; NX_wrappedEmpire=true;
  const orig=RENDER.empire;
  RENDER.empire=function(){ orig(); try{ NX_propertyPanel(); }catch(e){} };
}
let NX_wrappedEmpire=false;
function NX_propertyPanel(){
  const r=$('empire-root'); if(!r||r.querySelector('#nx-prop')) return;
  const fi=clamp(int(S.facility,0),0,FACILITIES.length-1);
  const slots=FACILITIES[fi].slots, used=S.plants.length;
  const empCount=(S.ex&&S.ex.employees?S.ex.employees.filter(e=>e.hired).length:0);
  const autoN=AM_ORDER.filter(k=>S.am&&S.am[k]&&S.am[k].owned).length;
  const d=document.createElement('div'); d.className='card'; d.id='nx-prop';
  d.innerHTML='<h3>'+icon('empire','ic-lg')+'PROPERTY: '+esc(NX_PROP_LADDER[Math.min(fi,NX_PROP_LADDER.length-1)])+'</h3>'+
   '<div class="kv"><span>'+icon('grow','kv-ico')+'Plant capacity</span><b>'+used+' / '+slots+(used>=slots?' ⚠️ FULL':'')+'</b></div>'+
   '<div class="kv"><span>'+icon('crew','kv-ico')+'Staff on site</span><b>'+empCount+' / '+(3+fi)+'</b></div>'+
   '<div class="kv"><span>'+icon('equipment','kv-ico')+'Automation installed</span><b>'+autoN+' / 7</b></div>'+
   '<div class="kv"><span>'+icon('jar','kv-ico')+'Storage used</span><b>'+S.inventory.length+' lots</b></div>'+
   '<div class="kv"><span>'+icon('dispensary','kv-ico')+'Dispensary access</span><b>'+(fi>=3?'OPEN':'<span class="muted">Upgrade facility</span>')+'</b></div>'+
   '<p class="muted">Bigger property = more capacity, more staff, more automation — and higher upkeep.</p>';
  r.insertBefore(d,r.firstChild);
}

/* ---------------- new random events ---------------- */
const NX_NEW_EVENTS=[
 { id:'wx-irrigleak', rarity:'UNCOMMON', weight:14, cd:14, dur:[2,3],
   title:'IRRIGATION LEAK',
   text:function(){ return 'A fitting burst in the irrigation loop — water is pooling under the trays and plants are drying out faster.'; },
   canRoll:function(){ return S.plants.length>0; },
   onStart:function(){ S.plants.forEach(p=>{ p.water=clamp(num(p.water,80)-25,0,100); }); },
   choices:[
    {label:'CALL THE TECH', sub:function(){ return 'Pay '+fmt$(120)+' — sealed today'; },
     run:function(){ if(S.cash<120){ toast(icon('x','ge-ic-md')+' Need $120.'); return; } S.cash-=120; S.plants.forEach(p=>{p.water=clamp(num(p.water,0)+30,0,100);}); toast(icon('equipment','ge-ic-md')+' Leak sealed, trays re-watered.'); return 'end'; }},
    {label:'PATCH IT YOURSELF', sub:'Free — but plants stay stressed today',
     run:function(){ S.plants.forEach(p=>{p.stress=clamp(num(p.stress,0)+10,0,100);}); toast(icon('check','ge-ic-md')+' Patched with tape. It holds… mostly.'); }} ]},
 { id:'wx-rescontam', rarity:'RARE', weight:8, cd:20, dur:[3,4],
   title:'RESERVOIR CONTAMINATION',
   text:function(){ return 'The reservoir smells wrong — biofilm. Nutrient uptake is crashing until it is flushed.'; },
   canRoll:function(){ return S.plants.length>1; },
   onStart:function(){ S.plants.forEach(p=>{ p.nutrition=clamp(num(p.nutrition,70)-30,0,100); }); },
   choices:[
    {label:'FLUSH & STERILIZE', sub:function(){ return 'Pay '+fmt$(200)+' — full reset'; },
     run:function(){ if(S.cash<200){ toast(icon('x','ge-ic-md')+' Need $200.'); return; } S.cash-=200; S.plants.forEach(p=>{p.nutrition=clamp(num(p.nutrition,0)+40,0,100);}); toast(icon('flask','ge-ic-md')+' Reservoir sterilized. Uptake restored.'); return 'end'; }},
    {label:'DILUTE AND WAIT', sub:'Free — slow recovery over the event',
     run:function(){ toast(icon('water','ge-ic-md')+' Diluting… recovery will be slow.'); }} ]},
 { id:'wx-nutlock', rarity:'UNCOMMON', weight:12, cd:14, dur:[3,4],
   title:'NUTRIENT LOCKOUT',
   text:function(){ return 'pH drifted hard — plants show lockout: pale growth despite full feed strength.'; },
   canRoll:function(){ return S.plants.length>0; },
   onStart:function(){ S.plants.forEach(p=>{ p.health=clamp(num(p.health,100)-8,0,100); }); },
   choices:[
    {label:'PH CORRECTION KIT', sub:function(){ return 'Pay '+fmt$(90)+' — instant fix'; },
     run:function(){ if(S.cash<90){ toast(icon('x','ge-ic-md')+' Need $90.'); return; } S.cash-=90; S.plants.forEach(p=>{p.health=clamp(num(p.health,0)+10,0,100);}); toast(icon('flask','ge-ic-md')+' pH corrected. Lockout clearing.'); return 'end'; }},
    {label:'FLUSH WITH WATER', sub:'Free — loses a day of feeding',
     run:function(){ S.plants.forEach(p=>{ p.nutrition=clamp(num(p.nutrition,0)-20,0,100); p.health=clamp(num(p.health,0)+4,0,100); }); toast(icon('water','ge-ic-md')+' Flushed. Slowly recovering.'); }} ]},
 { id:'wx-herm', rarity:'RARE', weight:7, cd:22, dur:[2,3],
   title:'HERMAPHRODITE DISCOVERED',
   text:function(){ return 'Bananas! A plant in flower is throwing male parts — it can seed your whole room if ignored.'; },
   canRoll:function(){ return S.plants.some(p=>stageOf(p)>=3); },
   onStart:function(){},
   choices:[
    {label:'CULL IT NOW', sub:'Lose the plant — save the room',
     run:function(){ const c=S.plants.filter(p=>stageOf(p)>=3); if(c.length){ const v=c[rndi(0,c.length-1)]; S.plants=S.plants.filter(p=>p.id!==v.id); toast(icon('train','ge-ic-md')+' Culled to protect the room.'); } return 'end'; }},
    {label:'ISOLATE & WATCH', sub:'Risky — 50% it seeds neighbors',
     run:function(){ if(Math.random()<0.5){ S.plants.forEach(p=>{ if(stageOf(p)>=3) p.stress=clamp(num(p.stress,0)+25,0,100); }); toast(icon('grow','ge-ic-md')+' It seeded! Flowering plants stressed.'); } else toast('👀 Isolated in time. Crisis dodged.'); return 'end'; }} ]},
 { id:'wx-empcalloff', rarity:'COMMON', weight:12, cd:12, dur:[2,2],
   title:'EMPLOYEE CALLS OFF',
   text:function(){ return 'No-show on the schedule — the room runs short-handed today.'; },
   canRoll:function(){ try{ return S.ex.employees.some(e=>e.hired); }catch(e){ return false; } },
   onStart:function(){ S.plants.forEach(p=>{ p.stress=clamp(num(p.stress,0)+8,0,100); }); },
   choices:[
    {label:'COVER THE SHIFT', sub:'You work it — lose the day\'s edge, room stays calm',
     run:function(){ S.plants.forEach(p=>{ p.stress=clamp(num(p.stress,0)-8,0,100); }); gainXP(20); toast(icon('crew','ge-ic-md')+' Shift covered. Respect earned.'); return 'end'; }},
    {label:'RUN SHORT', sub:'Free — stress lingers',
     run:function(){ toast('Running short-handed…'); }} ]},
 { id:'wx-bigorder', rarity:'UNCOMMON', weight:10, cd:16, dur:[3,3],
   title:'HUGE DISPENSARY ORDER',
   text:function(){ return 'A buyer wants 20 oz of your best flower, today. Premium price — if you have the stock.'; },
   canRoll:function(){ return S.inventory.some(i=>num(i.amount,0)>=20&&i.type==='flower'); },
   onStart:function(){},
   choices:[
    {label:'FILL THE ORDER', sub:'Sell 20 oz at +25% price',
     run:function(){ const it=S.inventory.find(i=>num(i.amount,0)>=20&&i.type==='flower'); if(!it){ toast(icon('x','ge-ic-md')+' Stock gone.'); return; }
       const pay=Math.round(pricePerOz(it)*20*1.25); it.amount=Math.round((it.amount-20)*10)/10;
       if(it.amount<=0) S.inventory=S.inventory.filter(x=>x.id!==it.id);
       S.cash+=pay; S.stats.lifetimeRevenue+=pay; gainRep(8); gainXP(120);
       toast(icon('cash','ge-ic-md')+' Big order filled: +'+fmt$(pay)); save(); updateHUD(); return 'end'; }},
    {label:'PASS', sub:'Keep your stock',
     run:function(){ toast(icon('x','ge-ic-md')+' Order declined.'); return 'end'; }} ]},
 { id:'wx-raremut', rarity:'LEGENDARY', weight:3, cd:40, dur:[1,1],
   title:'RARE MUTATION EVENT',
   text:function(){ return 'Something impossible is happening in the trays — a seedling is expressing genetics you have never seen.'; },
   canRoll:function(){ return S.plants.length>0; },
   onStart:function(){},
   choices:[
    {label:'PRESERVE IT', sub:'Costs $500 — becomes a tracked project',
     run:function(){ if(S.cash<500){ toast(icon('x','ge-ic-md')+' Need $500.'); return; } S.cash-=500;
       const st=getStrain(S.plants[0].strainId);
       S.customStrains.push({id:'nxmut'+Date.now(),name:'MUTATION X',custom:true,strainId:st?st.id:'qr',tags:['HYBRID'],seed:0,ft:60,yld:70,pot:85,terp:80,stab:40,resin:90,vigor:85,lineage:'Wild mutation event'});
       gainXP(300); addP0('genetics',8);
       toast(icon('dna','ge-ic-md')+' Rare mutation preserved as a new genetic line!'); save(); return 'end'; }},
    {label:'LET IT RIDE', sub:'Free — 50% it stabilizes on its own',
     run:function(){ if(Math.random()<0.5){ gainXP(150); toast(icon('check','ge-ic-md')+' It stabilized! +150 XP.'); } else toast(icon('warn','ge-ic-md')+' It reverted. Gone.'); return 'end'; }} ]}
];
function NX_registerEvents(){
  try{ if(typeof WX_EVENT_DEFS!=='undefined') NX_NEW_EVENTS.forEach(e=>{ if(!WX_EVENT_DEFS.some(x=>x.id===e.id)) WX_EVENT_DEFS.push(e); }); }catch(e){}
}

/* ---------------- new missions ---------------- */
function NX_registerMissions(){
  try{
    if(typeof MN_MISSIONS==='undefined') return;
    const add=m=>{ if(!MN_MISSIONS.some(x=>x.id===m.id)) MN_MISSIONS.push(m); };
    add({id:'mn-pheno72',cat:'Genetics',name:'PHENO HUNT: 72 HOURS',timed:true,days:3,
     desc:'Grow 10 seeds of one strain, identify the best phenotype, mark one keeper — within 3 days. BONUS: zero environmental stress events.',
     prog:s=>{ if(!MN_active('mn-pheno72')) return [0,3];
       return MN_parts([MN_delta('mn-pheno72','phenoTested',MN_stats().phenoTested)>=10,MN_delta('mn-pheno72','keepersFound',MN_stats().keepersFound)>=1,MN_delta('mn-pheno72','plantDeaths',(s.mn&&s.mn.plantDeaths)||0)<=0]); },
     reward:{cash:2000,xp:900,rep:30,p0:8}});
    add({id:'mn-disprush',cat:'Business',name:'DISPENSARY RUSH',timed:true,days:1,
     desc:'Fill 50 customer orders at 4.5★+ average rating within 24 game hours.',
     prog:s=>{ if(!MN_active('mn-disprush')) return [0,2];
       const o=MN_delta('mn-disprush','customersServed',MN_int(s.mn&&s.mn.customersServed,0)); /* QA GE-501: ordersFilled was never written; customersServed is live */
       return MN_parts([o>=50,NX_avgStars()>=4.5]); },
     reward:{cash:3500,xp:1200,rep:50}});
    add({id:'mn-mastercult',cat:'Cultivation',name:'MASTER CULTIVATOR',timed:true,days:30,
     desc:'One full flowering cycle: hold VPD in range, pH/EC stable, irrigation on schedule. Difficulty scales with rank.',
     prog:s=>{ if(!MN_active('mn-mastercult')) return [0,4];
       const sc=MN_delta('mn-mastercult','flowerDaysGood',MN_int(s.mn&&s.mn.flowerDaysGood,0)); /* QA GE-501: live-tracked below */
       return MN_parts([sc>=21,MN_delta('mn-mastercult','plantDeaths',(s.mn&&s.mn.plantDeaths)||0)<=0,MN_avgHealth()>=85,true]); },
     reward:{cash:5000,xp:2000,rep:60,p0:10}});
    /* QA GE-500: land the new defs in MISSIONS immediately (MN_register dedupes, safe) */
    try{ if(typeof MN_register==='function') MN_register(); }catch(e2){}
  }catch(e){}
}
function NX_stat(k){ try{ return num(S.stats[k],0); }catch(e){ return 0; } }
function NX_avgStars(){ try{ const r=S.nx.reviews; if(!r.length) return 5; return r.reduce((a,x)=>a+x.stars,0)/r.length; }catch(e){ return 5; } }

/* ---------------- new achievements ---------------- */
function NX_registerAchievements(){
  try{
    const add=(list,a)=>{ if(!list.some(x=>x.id===a.id)) list.push(a); };
    if(typeof EX_ACHIEVEMENTS!=='undefined'){
      add(EX_ACHIEVEMENTS,{id:'x-firstpound',name:'⚖️ First Pound',desc:'Harvest 16 oz in a single harvest.',prog:()=>[Math.min(int(S.stats.biggestHarvest,0)>=16?1:0,1),1],reward:{cash:400,xp:200}});
      add(EX_ACHIEVEMENTS,{id:'x-100plants',name:'🌱 Century Club',desc:'Grow 100 plants.',prog:()=>[Math.min(int(S.stats.plantsStarted,0),100),100],reward:{cash:800,xp:400}});
      add(EX_ACHIEVEMENTS,{id:'x-1000plants',name:'🌿 Thousand Plant Army',desc:'Grow 1,000 plants.',prog:()=>[Math.min(int(S.stats.plantsStarted,0),1000),1000],reward:{cash:3000,xp:1500,rep:40}});
      add(EX_ACHIEVEMENTS,{id:'x-30club',name:'🔥 30% Club',desc:'Hit 90+ potency on a harvest.',prog:()=>[Math.min(int(NX_bestPotency()>=90?1:0,0),1),1],reward:{cash:1000,xp:500,p0:5}});
      add(EX_ACHIEVEMENTS,{id:'x-perfectenv',name:'🌡️ Perfect Environment',desc:'Keep env score 90+ for 7 consecutive days.',prog:()=>[Math.min(int(NX_envStreak(),0),7),7],reward:{cash:900,xp:450}});
      add(EX_ACHIEVEMENTS,{id:'x-10m',name:'💰 Ten Million Dollar Empire',desc:'Build a $10,000,000 empire.',prog:()=>[NX_empireValue()>=10000000?1:0,1],reward:{xp:3000,rep:100,title:'👑 Empire Legend'}});
      add(EX_ACHIEVEMENTS,{id:'x-geneticmaster',name:'🧬 Genetic Master',desc:'Discover 5 legendary phenotypes.',prog:()=>[Math.min(int(S.stats.legendaryFound,0),5),5],reward:{cash:5000,xp:2500,p0:15}});
    }
  }catch(e){}
}
function NX_envStreak(){ try{ return int(S.nx.envStreak,0); }catch(e){ return 0; } }

/* ---------------- leaderboard categories ---------------- */
function NX_registerLeaderboards(){
  try{
    if(typeof EX_RECORD_DEFS==='undefined') return;
    const add=d=>{ if(!EX_RECORD_DEFS.some(x=>x.cat===d.cat)) EX_RECORD_DEFS.push(d); };
    add({cat:'empireValue',label:'Empire Value',fmt:v=>fmt$(v)});
    add({cat:'lifetimeHarvest',label:'Lifetime Harvest (oz)',fmt:v=>num(v,0).toFixed(0)});
    add({cat:'bestPotency',label:'Highest Potency',fmt:v=>Math.round(num(v,0))+'%'});
    add({cat:'bestYield',label:'Best Single Yield',fmt:v=>num(v,0).toFixed(1)+' oz'});
    add({cat:'strainsCreated',label:'Genetics Created',fmt:v=>String(int(v,0))});
    add({cat:'breedingRep',label:'Breeding Reputation',fmt:v=>String(int(v,0))});
    add({cat:'p0score',label:'Project 0 Score',fmt:v=>String(int(v,0))});
  }catch(e){}
  /* record current values */
  try{
    if(typeof EX_record==='function'){
      EX_record('empireValue',NX_empireValue());
      EX_record('lifetimeHarvest',num(S.stats.lifetimeHarvestOz,0));
      EX_record('bestPotency',NX_bestPotency());
      EX_record('bestYield',num(S.stats.biggestHarvest,0));
      EX_record('strainsCreated',(S.customStrains||[]).length);
      EX_record('p0score',num(S.project0.points,0));
    }
  }catch(e){}
}

/* ---------------- P0 challenge ---------------- */
function NX_registerChallenges(){
  try{
    if(typeof WX_newChallenge!=='function') return;
    /* inject a Project 0 weekly into the rotation occasionally */
    if(!S.wx.chalP0week||S.wx.chalP0week!==S.wx.cday){
      if(Math.random()<0.3){
        S.wx.chal.weekly={id:'p0-'+Date.now(),kind:'weekly',name:'PROJECT 0 CHALLENGE',days:2,
          desc:'Complete a crop cycle while maintaining excellent environmental control (90+ env score).',
          prog:'env',target:2,
          reward:{cash:20000,xp:2500,p0:12,genetics:'p0pack'}};
        S.wx.chalP0week=S.wx.cday;
      }
    }
  }catch(e){}
}

/* ---------------- settings: profile switcher ---------------- */
function NX_wrapSettings(){
  if(typeof RENDER.settings!=='function'||NX_wrappedSettings) return; NX_wrappedSettings=true;
  const orig=RENDER.settings;
  RENDER.settings=function(){ orig(); try{ NX_settingsProfiles(); }catch(e){} };
}
let NX_wrappedSettings=false;
function NX_settingsProfiles(){
  const r=$('settings-root'); if(!r||r.querySelector('#nx-profcard')) return;
  const profs=NX_profiles(), cur=NX_activeProfile();
  const d=document.createElement('div'); d.className='ge-card'; d.id='nx-profcard';
  d.innerHTML='<div class="ge-card-head"><h3>'+icon('star','ge-ic-lg')+'GROW EMPIRE ID '+(cur?'<span class="ge-badge ge-badge-legendary">'+esc(cur.username)+'</span>':'<span class="ge-badge">GUEST</span>')+'</h3></div>'+
   '<p class="ge-caption ge-muted">Local profiles on this device. Cloud sync: <b>NOT CONNECTED</b> — saves stay on this device.</p>'+
   profs.map(p=>'<div class="ge-datarow"><span>'+icon('star','ge-ic-sm')+esc(p.username)+' <span class="ge-muted">('+esc(p.grower)+')</span></span><span class="ge-inline-btns"><button class="ge-btn ge-btn-sm" data-sw="'+p.id+'">SWITCH</button> <button class="ge-btn ge-btn-sm ge-btn-danger" data-delp="'+p.id+'">DELETE</button></span></div>').join('')+
   '<div class="ge-btn-row"><button class="ge-btn ge-btn-ghost" id="nx-newprof">NEW PROFILE</button><button class="ge-btn ge-btn-ghost" id="nx-logoutb">LOG OUT</button></div>';
  r.insertBefore(d,r.firstChild);
  d.querySelectorAll('[data-sw]').forEach(b=>b.onclick=()=>{
    if(!confirm('Switch profile? Current game saves first.')) return;
    try{ save(); }catch(e){}
    NX_afterAuth(b.dataset.sw,true);
  });
  d.querySelectorAll('[data-delp]').forEach(b=>b.onclick=()=>{
    if(!confirm('Delete this profile and its save? This cannot be undone.')) return;
    const ps=NX_profiles().filter(p=>p.id!==b.dataset.delp); NX_saveProfiles(ps);
    try{ localStorage.removeItem(NX_profileSaveKey(b.dataset.delp)); }catch(e){}
    toast('Profile deleted.'); RENDER.settings();
  });
  d.querySelector('#nx-newprof').onclick=()=>{ try{save();}catch(e){} NX_logout(); };
  d.querySelector('#nx-logoutb').onclick=()=>{ if(confirm('Log out? Progress is saved locally.')) NX_logout(); };
}


/* ---------------- EMPIRE SAVED hooks on key actions ---------------- */
function NX_wrapKeyActions(){
  if(typeof confirmKeeper==='function'&&!NX_wrappedKeeper){
    NX_wrappedKeeper=true;
    const oc=confirmKeeper;
    confirmKeeper=function(rep){ const r=oc(rep); try{ NX_chime(); NX_saved(); }catch(e){} return r; };
  }
  if(typeof AM_buy==='function'&&!NX_wrappedAMBuy){
    NX_wrappedAMBuy=true;
    const ob=AM_buy;
    AM_buy=function(id){ const r=ob(id); if(r){ try{NX_saved();}catch(e){} } return r; };
  }
}
let NX_wrappedKeeper=false, NX_wrappedAMBuy=false;

/* ---------------- save version 3 migration ---------------- */
function NX_migrateAll(){
  NX_ensureNx(); NX_migrate();
  try{ NX_registerEvents(); }catch(e){}
  try{ NX_registerMissions(); }catch(e){}
  try{ NX_registerAchievements(); }catch(e){}
  try{ NX_registerLeaderboards(); }catch(e){}
  try{ NX_wrapKeepers(); NX_wrapBreeding(); NX_wrapDispensary(); NX_wrapEmpire(); NX_wrapSettings(); NX_wrapKeyActions(); }catch(e){}
  if(int(S.version,0)<3) S.version=3;
  /* QA: env streak must advance on DAY ADVANCE, not app boot — see advanceDay() */
}

/* ---------------- init ---------------- */
function NX_init(){
  try{ NX_ensureScreens(); }catch(e){}
  try{ NX_installToastWrap(); }catch(e){}
  try{ NX_migrateAll(); }catch(e){}
}
/* boot hook: preboot routes to login before normal boot */
const NX_bootOrig=boot;
boot=function(){ if(typeof NX_preboot==='function'&&NX_preboot()) return; NX_bootOrig(); };
/* post-load init: called via expansionTick hook below */
function NX_postLoad(){ try{ NX_init(); }catch(e){} }
/* ============================================================
   EXPANSION NX — Chunk 4: unified post-boot sequencing.
   ============================================================ */
function NX_booted(){ try{ NX_init(); }catch(e){} try{ NX_offlineCheck(); }catch(e){} }
/* NX: stamp harvest freshness on save */
function NX_stampInv(){ try{ if(typeof S!=='undefined'&&S&&Array.isArray(S.inventory)){ const d=Math.max(1,int(S.day,1)); S.inventory.forEach(function(it){ if(!it.packedDay) it.packedDay=d; }); } }catch(e){} }

/* ============================================================
   CAP — Capacitor / Android bridge for SHOCKER OWNZ GROW EMPIRE
   ------------------------------------------------------------
   * Runs INSIDE the existing web game. Zero changes to existing
     systems: everything here WRAPS originals or adds new code.
   * Every native call is guarded: when window.Capacitor is absent
     (plain web / GitHub Pages) every CAP function no-ops safely.
   * Provides: Android back-button routing, haptics (+ Settings
     toggle), dark system chrome, keyboard helpers, offline banner,
     branded error overlay, external-link trap, double-tap guard,
     boot loading sequence with REAL init steps, and the Android
     Settings additions (graphics, animation, text size, legal).
   ============================================================ */

/* ---------- native detection ---------- */
function CAP_plugins(){
  try{ return (window.Capacitor&&window.Capacitor.Plugins)?window.Capacitor.Plugins:null; }
  catch(e){ return null; }
}
function CAP_native(){
  try{
    if(!window.Capacitor) return false;
    if(window.Capacitor.isNative===true) return true;
    if(typeof window.Capacitor.getPlatform==='function'&&window.Capacitor.getPlatform()!=='web') return true;
    return !!CAP_plugins();
  }catch(e){ return false; }
}

/* ---------- preferences (persisted in save) ---------- */
const CAP_PREF_DEFAULTS={haptics:true,sound:true,gfx:'high',anim:'full',textSize:'m'};
function CAP_prefs(){
  try{
    if(!S||typeof S!=='object') return Object.assign({},CAP_PREF_DEFAULTS);
    if(!S.prefs||typeof S.prefs!=='object') S.prefs={};
    const p=S.prefs;
    Object.keys(CAP_PREF_DEFAULTS).forEach(k=>{ if(p[k]===undefined||p[k]===null) p[k]=CAP_PREF_DEFAULTS[k]; });
    if(!['high','low'].includes(p.gfx)) p.gfx='high';
    if(!['full','reduced','off'].includes(p.anim)) p.anim='full';
    if(!['s','m','l'].includes(p.textSize)) p.textSize='m';
    return p;
  }catch(e){ return Object.assign({},CAP_PREF_DEFAULTS); }
}
function CAP_applyPrefs(){
  try{
    const p=CAP_prefs();
    document.body.dataset.gfx=p.gfx;
    document.body.classList.toggle('anim-off',p.anim==='off');
    document.body.classList.toggle('anim-reduced',p.anim==='reduced');
    const z={s:'0.92',m:'1',l:'1.12'}[p.textSize]||'1';
    try{ document.body.style.zoom=z; }catch(e){}
  }catch(e){}
}

/* ---------- haptics (native only; silent on web) ---------- */
const CAP_HAPTIC_STYLE={harvest:'MEDIUM',purchase:'LIGHT',mission:'MEDIUM',achievement:'HEAVY',keeper:'MEDIUM',rankup:'HEAVY',alert:'HEAVY',discovery:'MEDIUM'};
function CAP_haptic(kind){
  try{
    if(!CAP_prefs().haptics) return;
    const P=CAP_plugins(); if(!P||!P.Haptics) return;
    const style=CAP_HAPTIC_STYLE[kind]||'LIGHT';
    if(P.Haptics.impact){
      const r=P.Haptics.impact({style:style});
      if(r&&typeof r.catch==='function') r.catch(()=>{});
    }else if(P.Haptics.vibrate){
      const r=P.Haptics.vibrate({duration:kind==='alert'?60:18});
      if(r&&typeof r.catch==='function') r.catch(()=>{});
    }
  }catch(e){}
}

/* ---------- tiny WebAudio SFX (respects sound toggle) ---------- */
function CAP_sfx(kind){
  try{
    if(!CAP_prefs().sound) return;
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    const ac=new AC(), t=ac.currentTime;
    const seq=kind==='alert'?[[196,0,0.22],[147,0.12,0.3]]:kind==='ok'?[[523.25,0,0.12],[783.99,0.09,0.18]]:[[440,0,0.07]];
    seq.forEach(n=>{
      const o=ac.createOscillator(), g=ac.createGain();
      o.type=kind==='alert'?'sawtooth':'sine'; o.frequency.value=n[0];
      g.gain.setValueAtTime(0.0001,t+n[1]); g.gain.exponentialRampToValueAtTime(0.12,t+n[1]+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001,t+n[1]+n[2]);
      o.connect(g); g.connect(ac.destination); o.start(t+n[1]); o.stop(t+n[1]+n[2]+0.05);
    });
  }catch(e){}
}

/* ---------- global function re-wrapper (safe) ---------- */
function CAP_rewrap(name,maker){
  try{
    const orig=window[name];
    if(typeof orig!=='function'||orig.__cap_wrapped) return false;
    const w=maker(orig); w.__cap_wrapped=true; window[name]=w;
    return true;
  }catch(e){ return false; }
}

/* ---------- haptic + sfx wiring on key game events ---------- */
function CAP_wireHaptics(){
  CAP_rewrap('harvestPlant',orig=>function(p){
    let ready=false;
    try{ ready=!!(p&&typeof stageOf==='function'&&stageOf(p)>=5); }catch(e){}
    const r=orig(p);
    if(ready){ CAP_haptic('harvest'); CAP_sfx('ok'); }
    return r;
  });
  CAP_rewrap('checkAchievements',orig=>function(){
    const before=(typeof S!=='undefined'&&S&&Array.isArray(S.achievements))?S.achievements.length:0;
    const r=orig();
    try{ if(S&&Array.isArray(S.achievements)&&S.achievements.length>before){ CAP_haptic('achievement'); CAP_sfx('ok'); } }catch(e){}
    return r;
  });
  CAP_rewrap('checkMissions',orig=>function(){
    const before=(typeof S!=='undefined'&&S&&Array.isArray(S.missionsDone))?S.missionsDone.length:0;
    const r=orig();
    try{ if(S&&Array.isArray(S.missionsDone)&&S.missionsDone.length>before){ CAP_haptic('mission'); CAP_sfx('ok'); } }catch(e){}
    return r;
  });
  CAP_rewrap('levelUpOverlay',orig=>function(lvl){
    const r=orig(lvl); CAP_haptic('rankup'); CAP_sfx('ok'); return r;
  });
  CAP_rewrap('confirmKeeper',orig=>function(rep){
    const r=orig(rep);
    if(r!==false){ CAP_haptic('keeper'); CAP_sfx('ok'); }
    return r;
  });
  CAP_rewrap('CT_checkout',orig=>function(custId){
    const r=orig(custId);
    if(r!==false){ CAP_haptic('purchase'); CAP_sfx('ok'); }
    return r;
  });
  CAP_rewrap('AM_buy',orig=>function(id){
    const r=orig(id);
    if(r){ CAP_haptic('purchase'); CAP_sfx('click'); }
    return r;
  });
  CAP_rewrap('showEventQueue',orig=>function(queue){
    if(queue&&queue.length){ CAP_haptic('alert'); }
    return orig(queue);
  });
  /* respect the sound toggle for the keeper reveal chime too */
  CAP_rewrap('NX_chime',orig=>function(){ if(CAP_prefs().sound) return orig(); });
}

/* ---------- Android back button ---------- */
function CAP_backHandler(){
  try{
    /* 0a-2. W4: branded error overlay -> dismiss via its HOME path first. It
       appends to body (bypassing the router); without this, back would open
       the exit-confirm modal BEHIND the error overlay and trap the player. */
    try{ const __er=document.getElementById('cap-err');
      if(__er){ const hb=__er.querySelector('#cap-err-home'); if(hb){ hb.click(); } else { __er.remove(); } CAP_sfx('click'); return; } }catch(e){}
    /* 0a. P3-W2 vault lineage sheets -> close the topmost one first */
    try{ if(typeof GE_closeTopSheet==='function'&&GE_closeTopSheet()){ CAP_sfx('click'); return; } }catch(e){}
    /* 0. plant focus sheet -> close it first (P2-W6: it appends to body, bypassing the router) */
    try{ const __sh=document.getElementById('plant-focus'); if(__sh&&typeof closeFocus==='function'){ closeFocus(); CAP_sfx('click'); return; } }catch(e){}
    /* 1. popup open -> close the topmost one */
    const root=document.getElementById('modal-root');
    if(root&&root.lastElementChild){
      const top=root.lastElementChild;
      try{ top.remove(); }catch(e){}
      /* W4: run the overlay's registered dismiss hook AFTER removal. The
         P3-W2 ceremony queue pump guards on "no ceremony open", so firing
         before removal saw the still-attached node and stalled the queue. */
      try{ if(top&&typeof top.__geOnDismiss==='function') top.__geOnDismiss(); }catch(e){}
      CAP_sfx('click'); return;
    }
    const cur=(typeof current!=='undefined')?current:'menu';
    /* 2. entry screens -> do nothing (never kill the app during boot/auth) */
    if(cur==='splash'||cur==='login'||cur==='welcome'||cur==='difficulty') return;
    /* 3. sub-screen -> back to dashboard */
    if(cur!=='menu'&&cur!=='home'){
      try{ show('menu'); }catch(e){}
      CAP_sfx('click'); return;
    }
    /* 4. dashboard -> confirm exit, never instant-kill */
    if(CAP_native()){
      try{
        confirmModal('EXIT GROW EMPIRE?','Your empire is saved. Really exit the game?',function(){
          try{ const P=CAP_plugins(); if(P&&P.App&&P.App.exitApp) P.App.exitApp(); }catch(e){}
        });
      }catch(e){}
    }else{
      try{ toast('You are on the main dashboard.'); }catch(e){}
    }
  }catch(e){}
}
function CAP_installBack(){
  try{
    const P=CAP_plugins();
    if(P&&P.App&&typeof P.App.addListener==='function'){
      const r=P.App.addListener('backButton',CAP_backHandler);
      if(r&&typeof r.catch==='function') r.catch(()=>{});
    }
  }catch(e){}
  try{ document.addEventListener('backbutton',CAP_backHandler,false); }catch(e){}
}

/* ---------- dark system chrome + native splash hide ---------- */
function CAP_chrome(){
  try{
    const P=CAP_plugins(); if(!P) return;
    if(P.StatusBar){
      try{ const r=P.StatusBar.setBackgroundColor({color:'#0a0a0a'}); if(r&&r.catch) r.catch(()=>{}); }catch(e){}
      try{ const r=P.StatusBar.setStyle({style:'DARK'}); if(r&&r.catch) r.catch(()=>{}); }catch(e){}
    }
    if(P.SplashScreen){
      try{ const r=P.SplashScreen.hide(); if(r&&r.catch) r.catch(()=>{}); }catch(e){}
      /* failsafe: never trap the player behind the splash */
      setTimeout(()=>{ try{ const r2=P.SplashScreen.hide(); if(r2&&r2.catch) r2.catch(()=>{}); }catch(e){} },6000);
    }
  }catch(e){}
}

/* ---------- keyboard: keep fields visible, hide on DONE ---------- */
function CAP_installKeyboard(){
  try{
    document.addEventListener('focusin',function(e){
      try{
        const t=e.target;
        if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA')&&!/hidden|checkbox|radio|file/i.test(t.type||'')){
          setTimeout(()=>{ try{ t.scrollIntoView({behavior:'smooth',block:'center'}); }catch(err){} },350);
        }
      }catch(err){}
    },true);
    document.addEventListener('keydown',function(e){
      try{
        if(e.key==='Enter'){
          const t=e.target;
          if(t&&t.tagName==='INPUT'){ try{ t.blur(); }catch(err){} }
        }
      }catch(err){}
    },true);
  }catch(e){}
}

/* ---------- offline banner (bundled assets work offline) ---------- */
function CAP_offlineBanner(showIt){
  try{
    let b=document.getElementById('cap-offline');
    if(showIt){
      if(b) return;
      b=document.createElement('div'); b.id='cap-offline';
      b.textContent='OFFLINE MODE \u2014 your local empire is still available. Some online features may be unavailable.';
      document.body.appendChild(b);
      setTimeout(()=>{ try{ b.classList.add('show'); }catch(e){} },50);
    }else if(b){
      b.classList.remove('show');
      setTimeout(()=>{ try{ b.remove(); }catch(e){} },400);
    }
  }catch(e){}
}
function CAP_installOffline(){
  try{
    const upd=()=>CAP_offlineBanner(!navigator.onLine);
    window.addEventListener('online',upd);
    window.addEventListener('offline',upd);
    upd();
  }catch(e){}
}

/* ---------- branded error overlay (never a blank screen) ---------- */
function CAP_errorOverlay(msg){
  try{
    if(document.getElementById('cap-err')) return;
    const d=document.createElement('div'); d.id='cap-err';
    d.innerHTML='<div class="cap-err-box">'+
      '<div class="logo-text display" style="margin-bottom:6px">GROW EMPIRE</div>'+
      '<h3 style="color:#e02020">GROW EMPIRE ENCOUNTERED A PROBLEM</h3>'+
      '<p class="muted">Something went wrong, but your saved empire is safe on this device.</p>'+
      (msg?'<p class="muted" style="font-size:11px;word-break:break-word">'+String(msg).slice(0,160)+'</p>':'')+
      '<div class="btn-row"><button class="btn btn-primary" id="cap-err-retry">RETRY</button>'+
      '<button class="btn" id="cap-err-home">RETURN TO EMPIRE</button></div></div>';
    document.body.appendChild(d);
    d.querySelector('#cap-err-retry').onclick=()=>{ try{ location.reload(); }catch(e){} };
    d.querySelector('#cap-err-home').onclick=()=>{ try{ d.remove(); }catch(e){} try{ show('menu'); }catch(e2){} };
  }catch(e){}
}
(function CAP_installErrorTrap(){
  try{
    window.addEventListener('error',function(e){
      try{ if(e&&(e.message||e.error)) CAP_errorOverlay(e.message||'Unknown error'); }catch(err){}
    });
    window.addEventListener('unhandledrejection',function(e){
      try{ const m=e&&(e.reason&&(e.reason.message||e.reason)); if(m) CAP_errorOverlay(String(m)); }catch(err){}
    });
  }catch(e){}
})();

/* ---------- external links open in the system browser ---------- */
function CAP_installLinkTrap(){
  try{
    document.addEventListener('click',function(e){
      try{
        const a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
        if(!a) return;
        const href=a.getAttribute('href')||'';
        if(!/^https?:\/\//i.test(href)) return;
        const P=CAP_plugins();
        if(P&&P.Browser&&typeof P.Browser.open==='function'){
          e.preventDefault();
          const r=P.Browser.open({url:href});
          if(r&&typeof r.catch==='function') r.catch(()=>{});
        }
      }catch(err){}
    },true);
  }catch(e){}
}

/* ---------- double-tap / double-activation guard ---------- */
const CAP_tapTimes=(typeof WeakMap!=='undefined')?new WeakMap():null;
function CAP_installTapGuard(){
  if(!CAP_tapTimes) return;
  try{
    document.addEventListener('click',function(e){
      try{
        const b=e.target&&e.target.closest?e.target.closest('.btn,button'):null;
        if(!b||b.disabled) return;
        const now=Date.now(), last=CAP_tapTimes.get(b)||0;
        if(now-last<400){ e.stopImmediatePropagation(); e.preventDefault(); return; }
        CAP_tapTimes.set(b,now);
      }catch(err){}
    },true);
  }catch(e){}
}

/* ---------- boot loading sequence (REAL init steps, no fake delays) ---------- */
function CAP_checkGenetics(){
  let n=0;
  try{
    if(typeof STRAINS!=='undefined'&&Array.isArray(STRAINS)){
      for(const s of STRAINS){ if(s&&s.id&&s.name) n++; }
    }
  }catch(e){}
  return {ok:n>0,detail:n+' strains verified'};
}
function CAP_checkEmpire(){
  let r='none', detail='new empire ready';
  try{ r=load(); }catch(e){ r='err'; }
  try{
    if(r==='ok') detail='Day '+int(S.day,1)+' \u00b7 '+fmt$(Math.round(num(S.cash,0)))+' \u00b7 Lv '+int(S.level,1);
    else if(r==='corrupt') detail='save repaired \u2014 fresh start ready';
  }catch(e){}
  return {ok:true,detail:detail};
}
function CAP_checkData(){
  const m=(typeof MISSIONS!=='undefined'&&Array.isArray(MISSIONS))?MISSIONS.length:0;
  const a=(typeof ACHIEVEMENTS!=='undefined'&&Array.isArray(ACHIEVEMENTS))?ACHIEVEMENTS.length:0;
  return {ok:true,detail:m+' missions \u00b7 '+a+' achievements'};
}
function CAP_checkInventory(){
  let inv=0, pl=0;
  try{
    if(typeof S!=='undefined'&&S){
      if(Array.isArray(S.inventory)) inv=S.inventory.length;
      if(Array.isArray(S.plants)) pl=S.plants.length;
    }
  }catch(e){}
  return {ok:true,detail:inv+' items \u00b7 '+pl+' plants'};
}
function CAP_showBootLoading(done){
  const finish=()=>{ try{ done(); }catch(e){} };
  try{
    if(typeof show==='function'){ try{ show('splash'); }catch(e){} }
    const scr=document.getElementById('scr-splash');
    if(!scr){ finish(); return; }
    let ov=document.getElementById('cap-loading');
    if(!ov){
      ov=document.createElement('div'); ov.id='cap-loading';
      ov.innerHTML='<div class="cap-load-box">'+
        '<div class="logo-text display">GROW EMPIRE</div>'+
        '<p class="tagline dim">SHOCKER OWNZ</p>'+
        '<p class="tagline gold-tag">INITIALIZING GROW EMPIRE</p>'+
        '<div class="cap-load-steps" id="cap-load-steps"></div></div>';
      scr.appendChild(ov);
    }
    const box=ov.querySelector('#cap-load-steps');
    const steps=[
      ['Loading Genetics\u2026',CAP_checkGenetics],
      ['Loading Empire\u2026',CAP_checkEmpire],
      ['Loading Cultivation Data\u2026',CAP_checkData],
      ['Loading Inventory\u2026',CAP_checkInventory]
    ];
    let i=0;
    const runNext=()=>{
      if(i>=steps.length){ finish(); return; }
      const [label,fn]=steps[i];
      const row=document.createElement('div');
      row.className='cap-load-step';
      row.innerHTML='<span class="st-spin"></span><span>'+label+'</span>';
      box.appendChild(row);
      /* let the UI paint, then do the REAL work for this step */
      setTimeout(()=>{
        let res={ok:true,detail:''};
        try{ res=fn()||res; }catch(e){ res={ok:false,detail:'error'}; }
        row.classList.add('done');
        row.innerHTML='<span class="st-ok">'+(res.ok?'\u2713':'!')+'</span><span>'+label.replace('\u2026','')+' <span class="muted">'+res.detail+'</span></span>';
        i++;
        setTimeout(runNext,60);
      },30);
    };
    runNext();
  }catch(e){ finish(); }
}

/* Route the real boot through the (possibly NX-wrapped) boot binding.
   NOTE: the game's original DOMContentLoaded registration captured the
   pre-expansion boot, which bypassed the login terminal entirely. We
   re-route through the CURRENT boot binding so the intended
   login/session flow actually runs. */
(function CAP_initBoot(){
  try{
    if(typeof NX_preboot==='function'&&!NX_preboot.__cap_wrapped){
      const origPre=NX_preboot;
      const wrapped=function(){
        CAP_showBootLoading(function(){
          let r=false;
          try{ r=origPre(); }catch(e){ r=false; }
          /* mirror the boot wrapper: false => continue with normal boot */
          if(!r){ try{ if(typeof NX_bootOrig==='function') NX_bootOrig(); }catch(e){} }
        });
        return true;
      };
      wrapped.__cap_wrapped=true;
      NX_preboot=wrapped;
    }
    if(typeof NX_bootOrig==='function'){
      try{ document.removeEventListener('DOMContentLoaded',NX_bootOrig); }catch(e){}
    }
    let fired=false;
    document.addEventListener('DOMContentLoaded',function(){
      if(fired) return; fired=true;
      try{ CAP_chrome(); }catch(e){}
      try{ CAP_installBack(); }catch(e){}
      try{ CAP_installKeyboard(); }catch(e){}
      try{ CAP_installOffline(); }catch(e){}
      try{ CAP_installLinkTrap(); }catch(e){}
      try{ CAP_installTapGuard(); }catch(e){}
      try{ CAP_wireHaptics(); }catch(e){}
      try{ CAP_applyPrefs(); }catch(e){}
      try{ boot(); }catch(err){ try{ CAP_errorOverlay(String((err&&err.message)||err)); }catch(_){} }
      /* boot finished -> make sure the native splash is gone */
      try{ CAP_chrome(); }catch(e){}
    });
  }catch(e){}
})();

/* ---------- Android Settings additions ---------- */
function CAP_legalText(kind){
  if(kind==='privacy'){
    return '<h3 class="ge-h2">PRIVACY POLICY</h3><div class="ge-legal">'+
    '<p><b>Grow Empire v1.0.0 \u2014 Shocker OwnZ</b></p>'+
    '<p>Grow Empire stores ALL of your game data <b>locally on your device only</b> (save files, profiles, settings). Nothing is uploaded to any server.</p>'+
    '<p><b>Data collected: none.</b> This version includes no analytics, no crash reporting, no advertising, and no account servers. Grow Empire ID profiles are local device profiles, not cloud accounts.</p>'+
    '<p>Permissions used: Internet (reserved for future features; the game runs fully offline from its bundled files).</p>'+
    '<p>If analytics, crash reporting, authentication, or cloud saves are added in a future version, this policy will be updated and disclosed before release.</p>'+
    '<p class="ge-caption ge-muted">Questions: contact the developer via the Google Play listing.</p></div>'+
    '<div class="ge-btn-row"><button class="ge-btn ge-btn-primary" onclick="this.closest(\'.modal-back\').remove()">CLOSE</button></div>';
  }
  return '<h3 class="ge-h2">TERMS OF USE</h3><div class="ge-legal">'+
  '<p><b>Grow Empire v1.0.0 \u2014 Shocker OwnZ</b></p>'+
  '<p>Grow Empire is a <b>fictional simulation game</b> about cannabis cultivation business management. It is entertainment only.</p>'+
  '<p>Nothing in this game is medical, legal, or horticultural advice, and nothing here is instruction for real-world activity. Obey the laws where you live.</p>'+
  '<p>Virtual currency, genetics, and items have no real-world value and cannot be redeemed. Game progress is stored locally; uninstalling or clearing app data will erase it. The developer is not responsible for lost local saves.</p>'+
  '<p>Do not attempt to extract, reverse-engineer, or redistribute the game\u2019s assets or code.</p></div>'+
  '<div class="ge-btn-row"><button class="ge-btn ge-btn-primary" onclick="this.closest(\'.modal-back\').remove()">CLOSE</button></div>';
}

function CAP_cyclePref(key,values){
  try{
    const p=CAP_prefs();
    const i=values.indexOf(p[key]);
    p[key]=values[(i+1)%values.length];
    try{ save(); }catch(e){}
    CAP_applyPrefs();
    try{ RENDER.settings(); }catch(e){}
  }catch(e){}
}
function CAP_togglePref(key){
  try{
    const p=CAP_prefs(); p[key]=!p[key];
    try{ save(); }catch(e){}
    CAP_applyPrefs();
    try{ RENDER.settings(); }catch(e){}
  }catch(e){}
}
function CAP_settingsExtra(){
  try{
    const p=CAP_prefs();
    const onOff=v=>v?'<b class="ge-green">ON</b>':'<b class="ge-faint">OFF</b>';
    let key='soge_save_v1';
    try{ key=(typeof NX_saveKey==='function')?NX_saveKey():'soge_save_v1'; }catch(e){}
    let saveInfo='no save yet', saveKB='';
    try{
      const raw=localStorage.getItem(key);
      if(raw){ saveKB=' · '+(raw.length/1024).toFixed(1)+' KB'; }
      const ls=(typeof S!=='undefined'&&S&&S.lastSeen)?new Date(S.lastSeen):null;
      saveInfo=(ls&&!isNaN(ls.getTime())?ls.toLocaleString():'session start')+saveKB;
    }catch(e){}
    const gfxName={high:'HIGH',low:'LOW'}[p.gfx]||'HIGH';
    const animName={full:'FULL',reduced:'REDUCED',off:'OFF'}[p.anim]||'FULL';
    const txtName={s:'SMALL',m:'MEDIUM',l:'LARGE'}[p.textSize]||'MEDIUM';
    return ''+
    '<div class="ge-card"><div class="ge-card-head"><h3>'+icon('settings','ge-ic-lg')+'APP \u2014 ANDROID</h3></div>'+
     PF_kv('Haptic feedback','<button class="ge-btn ge-btn-sm ge-prefbtn" data-cap-t="haptics">'+onOff(p.haptics)+'</button>')+
     PF_kv('Sound FX','<button class="ge-btn ge-btn-sm ge-prefbtn" data-cap-t="sound">'+onOff(p.sound)+'</button>')+
     PF_kv('Graphics quality','<button class="ge-btn ge-btn-sm ge-prefbtn" data-cap-c="gfx">'+gfxName+'</button>')+
     PF_kv('Animation level','<button class="ge-btn ge-btn-sm ge-prefbtn" data-cap-c="anim">'+animName+'</button>')+
     PF_kv('Text size','<button class="ge-btn ge-btn-sm ge-prefbtn" data-cap-c="textSize">'+txtName+'</button>')+
     PF_kv('Native bridge','<b>'+(CAP_native()?'CONNECTED':'WEB')+'</b>')+
    '</div>'+
    '<div class="ge-card"><div class="ge-card-head"><h3>'+icon('box','ge-ic-lg')+'SAVE STATUS</h3></div>'+
     PF_kv('Last saved','<b>'+saveInfo+'</b>')+
     PF_kv('Storage','<b>Local device only</b>')+
     '<div class="ge-btn-row"><button class="ge-btn ge-btn-ghost" id="cap-set-save2">SAVE NOW</button></div>'+
    '</div>'+
    '<div class="ge-card"><div class="ge-card-head"><h3>'+icon('star','ge-ic-lg')+'ACCOUNT \u2014 GROW EMPIRE ID</h3></div>'+
     '<p class="ge-caption ge-muted">Local profiles on this device. No server. No cloud sync.</p>'+
     '<div class="ge-btn-row"><button class="ge-btn ge-btn-ghost" id="cap-set-profile">MY PROFILE</button>'+
     '<button class="ge-btn ge-btn-ghost" id="cap-set-switch">SWITCH PROFILE</button></div>'+
    '</div>'+
    '<div class="ge-card"><div class="ge-card-head"><h3>'+icon('scroll','ge-ic-lg')+'LEGAL</h3></div>'+
     '<div class="ge-btn-row"><button class="ge-btn ge-btn-ghost" id="cap-set-privacy">PRIVACY POLICY</button>'+
     '<button class="ge-btn ge-btn-ghost" id="cap-set-terms">TERMS</button></div>'+
    '</div>'+
    '<div class="ge-card ge-card-flat"><p class="ge-caption ge-muted ge-center">GROW EMPIRE <b>v1.0.0</b> \u2014 Shocker OwnZ<br>'+
     'GROW LIKE YOU OWN THE SHOW.<br><span class="ge-caption">A fictional cultivation simulation. Entertainment only.</span></p></div>';
  }catch(e){ return ''; }
}

(function CAP_wrapSettings(){
  try{
    if(typeof RENDER!=='undefined'&&typeof RENDER.settings==='function'&&!RENDER.settings.__cap_wrapped){
      const orig=RENDER.settings;
      const w=function(){
        orig();
        try{
          const r=document.getElementById('settings-root'); if(!r) return;
          r.insertAdjacentHTML('beforeend',CAP_settingsExtra());
          r.querySelectorAll('[data-cap-t]').forEach(b=>{ b.onclick=()=>CAP_togglePref(b.dataset.capT); });
          r.querySelectorAll('[data-cap-c]').forEach(b=>{ b.onclick=()=>{
            const k=b.dataset.capC;
            if(k==='gfx') CAP_cyclePref('gfx',['high','low']);
            else if(k==='anim') CAP_cyclePref('anim',['full','reduced','off']);
            else if(k==='textSize') CAP_cyclePref('textSize',['s','m','l']);
          };});
          const sv=r.querySelector('#cap-set-save2'); if(sv) sv.onclick=()=>{ try{ save(); }catch(e){} try{ toast('EMPIRE SAVED'); }catch(e2){} try{ RENDER.settings(); }catch(e3){} };
          const pf=r.querySelector('#cap-set-profile'); if(pf) pf.onclick=()=>{ try{ show('profile'); }catch(e){} };
          const sw=r.querySelector('#cap-set-switch'); if(sw) sw.onclick=()=>{ try{ confirmModal('SWITCH PROFILE?','Your empire is saved on this device. Switch profile now?',function(){ try{ if(typeof NX_logout==='function') NX_logout(); else show('login'); }catch(e){} }); }catch(e){} };
          const pp=r.querySelector('#cap-set-privacy'); if(pp) pp.onclick=()=>{ try{ modal(CAP_legalText('privacy')); }catch(e){} };
          const tm=r.querySelector('#cap-set-terms'); if(tm) tm.onclick=()=>{ try{ modal(CAP_legalText('terms')); }catch(e){} };
        }catch(e){}
      };
      w.__cap_wrapped=true;
      RENDER.settings=w;
    }
  }catch(e){}
})();

/* public surface for future native integrations */
try{ window.SOGE_CAP={haptic:CAP_haptic,sfx:CAP_sfx,native:CAP_native,prefs:CAP_prefs,version:'1.0.0'}; }catch(e){}

/* === UI OVERHAUL: new presentation helpers (appended; no logic changes) === */
function DP_iconSafe(k,cls){
  /* icon() with fallback: never emit an empty ic-missing span */
  try{ const h=icon(k,cls||''); return h.indexOf('ic-missing')>=0?icon('scroll',cls||''):h; }catch(e){ return ''; }
}
function DP_gradeBadge(q){
  /* quality grade badge: gold reserved for 90+ (legendary/premium semantics) */
  q=Math.round(Number(q)||0);
  const cls=q>=90?'ge-badge-legendary':q>=80?'ge-badge-elite':'ge-badge-common';
  return '<span class="ge-badge '+cls+'">Q'+q+'</span>';
}
function DP_demPill(ptype){
  /* live demand indicator for a product type — reads only, no sim change */
  let dem='normal';
  try{ dem=TY_typeDem(ptype).demand||'normal'; }catch(e){}
  const map={high:['ge-pill-optimal','HIGH DEMAND'],low:['ge-pill-critical','LOW DEMAND'],collector:['ge-pill-gold','COLLECTOR']};
  const m=map[dem]||['ge-pill-neutral','STABLE'];
  return '<span class="ge-pill '+m[0]+'">'+m[1]+'</span>';
}
function DP_metricTile(ico,val,label,sub,tone){
  return '<div class="ge-metric-tile"><div class="ge-metric-value ge-num '+(tone||'')+'">'+val+'</div>'+
   '<div class="ge-metric-label">'+DP_iconSafe(ico,'ge-ic-sm')+' '+label+'</div>'+
   (sub?'<div class="ge-metric-sub">'+sub+'</div>':'')+'</div>';
}
function DP_sectionTitle(ico,title,spread){
  return '<div class="ge-section-title">'+DP_iconSafe(ico,'ge-ic-md')+' '+title+
   (spread?'<span class="ge-spread">'+spread+'</span>':'')+'</div>';
}
function DP_terpTags(it){
  /* terpene/flavor tag chips from the strain record + terpene score pill */
  let tags=[];
  try{ const st=getStrain(it.strainId); if(st&&Array.isArray(st.tags)) tags=st.tags.slice(0,4); }catch(e){}
  let h=tags.map(t=>'<span class="ge-pill ge-pill-neutral">'+esc(t)+'</span>').join('');
  const terp=Math.round(Number(it.terpenes)||0);
  h+='<span class="ge-pill '+(terp>=80?'ge-pill-optimal':terp>=60?'ge-pill-watch':'ge-pill-neutral')+'">TERPS '+terp+'%</span>';
  return h;
}
function DP_todaySales(){
  /* today's revenue so far = lifetime revenue minus last closed day's books (read-only) */
  try{
    const life=num(S.stats&&S.stats.lifetimeRevenue,0);
    const base=num(S.ty&&S.ty.fin?S.ty.fin.lastLifeRev:0,0);
    return Math.max(0,Math.round(life-base));
  }catch(e){ return 0; }
}
function DP_avgSat(){
  try{ const st=S.ty.cust.stats; return st.satN?Math.round(st.sat/st.satN):0; }catch(e){ return 0; }
}
function DP_invValue(){
  try{ return Math.round((S.inventory||[]).reduce((a,i)=>a+pricePerOz(i)*num(i.amount,0),0)); }catch(e){ return 0; }
}
const EM_FACILITY_BLURB=[
 'Where every empire begins. Humble, hungry, yours.',
 'Out of the tent and into a real room.',
 'Serious square footage for a serious operation.',
 'Industrial scale. The neighborhood knows your name.',
 'Precision environment for genetic work.',
 'The crown jewel. Project 0 grade preservation.',
 /* P3-W4: new tiers */
 'A dedicated lab wing: mothers, clones, and precision breeding.',
 'Project 0 headquarters: preservation lab plus dry and cure rooms.',
 'The empire at full scale: automation nexus and flagship dispensary.'
];
const EM_EQUIP_TIERS=['','Standard','Professional','Commercial','Industrial','Project 0'];
const EM_EQUIP_ICON={lights:'lighting',hvac:'hvac',humid:'humid',dehumid:'drop',co2sys:'co2',
 irrigation:'irrigation',nutrients:'nutrients',sensors:'sensors',drycure:'drycure'};
function EM_facilityArt(tier){
  const t=clamp(int(tier,0),0,FACILITIES.length-1); /* P3-W4: was 0-5 */
  const w=46+t*12, h=30+t*6, x=Math.round((120-w)/2), y=76-h;
  const gold=t>=5, lab=t>=4;
  let s='<svg class="ge-fac-art" viewBox="0 0 120 80" aria-hidden="true">';
  s+='<rect width="120" height="80" fill="#0b0c0e"/>';
  s+='<ellipse cx="60" cy="72" rx="54" ry="9" fill="#e02020" opacity="0.10"/>';
  s+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="#181b20" stroke="'+(gold?'#d4a017':'#343a42')+'" stroke-width="1.5"/>';
  s+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="5" fill="'+(gold?'#d4a017':'#7a0d0d')+'"/>';
  const nL=2+t;
  for(let i=0;i<nL;i++){
    const lx=Math.round(x+8+i*(w-16)/(nL-1));
    s+='<rect x="'+lx+'" y="'+(y+12)+'" width="5" height="'+Math.max(4,h-24)+'" fill="#ff6b6b" opacity="0.75"/>';
  }
  s+='<rect x="'+Math.round(x+w/2-7)+'" y="'+(y+h-14)+'" width="14" height="14" fill="#0b0c0e" stroke="#4a4a4e"/>';
  if(lab) s+='<circle cx="'+(x+w-14)+'" cy="'+(y+16)+'" r="6" fill="none" stroke="#e02020" stroke-width="1.5"/>';
  if(gold) s+='<path d="M'+(x+8)+' '+(y-9)+' l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="#d4a017"/>';
  return s+'</svg>';
}
function EM_progressStrip(){
  const cur=int(S.facility,0);
  let h='<div class="ge-strip" role="list" aria-label="Facility progression">';
  FACILITIES.forEach((f,i)=>{
    const st=i<cur?'done':i===cur?'cur':'todo';
    h+='<div class="ge-strip-node ge-strip-'+st+'" role="listitem">'+
      '<span class="ge-strip-dot">'+(i<cur?icon('check','ge-ic-sm'):i===cur?icon('empire','ge-ic-sm'):icon('lock','ge-ic-sm'))+'</span>'+
      '<span class="ge-strip-name">'+esc(f.name)+'</span>'+
      '<span class="ge-strip-sub ge-num">'+f.slots+' slots</span>'+
      (i===cur?'<span class="ge-pill ge-pill-optimal">CURRENT</span>':i===cur+1?'<span class="ge-pill ge-pill-neutral">NEXT</span>':'')+
      '</div>';
    if(i<FACILITIES.length-1) h+='<div class="ge-strip-link'+(i<cur?' done':'')+'" aria-hidden="true"></div>';
  });
  return h+'</div>';
}
function EM_facilityCard(f,i){
  const cur=int(S.facility,0);
  const owned=i<cur, isCur=i===cur, next=i===cur+1;
  const cash=num(S.cash,0);
  let h='<div class="ge-card ge-facility'+(isCur?' ge-card-hot':'')+'">';
  h+='<div class="ge-facility-art">'+EM_facilityArt(i)+'</div>';
  h+='<div class="ge-facility-body">';
  h+='<div class="ge-card-head"><h3>'+esc(f.name)+'</h3>'+
    (isCur?'<span class="ge-pill ge-pill-optimal">'+icon('check','ge-ic-sm')+'CURRENT</span>'
     :owned?'<span class="ge-pill ge-pill-neutral">OWNED</span>'
     :next?'<span class="ge-pill ge-pill-neutral">NEXT</span>'
     :'<span class="ge-pill ge-pill-neutral">'+icon('lock','ge-ic-sm')+'LOCKED</span>')+'</div>';
  h+='<div class="ge-datarow"><span>'+icon('grow','ge-ic-md')+'Capacity</span><b class="ge-num">'+f.slots+' grow slots</b></div>';
  h+='<ul class="ge-benefits"><li>'+f.slots+' grow slots</li><li>'+esc(EM_FACILITY_BLURB[i]||'')+'</li>';
  /* P3-W4: new tiers list their real unlocks on the card */
  try{
    if(typeof P3W4_facUnlocks==='function'&&i>=6){
      P3W4_facUnlocks(i).forEach(u=>{ h+='<li>'+icon(u.ico||'check','ge-ic-sm')+' '+esc(u.t)+'</li>'; });
    }
  }catch(e){}
  h+='</ul>';
  if(isCur){
    h+='<p class="ge-label ge-green">Operating at full capacity.</p>';
  }else if(owned){
    h+='<p class="ge-caption ge-muted">Outgrown — expand to move up.</p>';
  }else if(next){
    const pct=clamp(cash/Math.max(1,f.cost)*100,0,100);
    h+='<div class="ge-progress-meta"><span>Expansion fund</span><b class="ge-num">'+fmt$(cash)+' / '+fmt$(f.cost)+'</b></div>';
    h+='<div class="ge-progress"><i style="width:'+pct+'%"></i></div>';
    h+='<button class="ge-btn ge-btn-primary ge-btn-block" data-buyfac="'+i+'">'+icon('empire','ge-ic-md')+'EXPAND — '+fmt$(f.cost)+'</button>';
  }else{
    const prev=FACILITIES[i-1];
    const pct=clamp(cash/Math.max(1,f.cost)*100,0,100);
    h+='<div class="ge-lockreq">'+icon('lock','ge-ic-md')+'<div><b>Requires '+esc(prev?prev.name:'')+'</b><p class="ge-caption ge-muted">Facilities expand in order. Cash progress carries over.</p></div></div>';
    h+='<div class="ge-progress-meta"><span>Unlock progress</span><b class="ge-num">'+Math.round(pct)+'%</b></div>';
    h+='<div class="ge-progress"><i style="width:'+pct+'%"></i></div>';
  }
  return h+'</div></div>';
}
function EM_motherRoomCard(){
  const capMax=(typeof P3W4_motherCapMax==='function')?P3W4_motherCapMax():4; /* P3-W4: 6 with Breeding Lab */
  const maxed=int(S.motherCapacity,0)>=capMax;
  let h='<div class="ge-card ge-facility"><div class="ge-facility-art">'+EM_facilityArt(3)+'</div><div class="ge-facility-body">';
  h+='<div class="ge-card-head"><h3>MOTHER ROOM</h3>'+(maxed?'<span class="ge-pill ge-pill-neutral">MAXED</span>':'')+'</div>';
  h+='<p class="ge-caption ge-muted">House mother plants to take identical clones.'+(capMax>4?'':'')+'</p>';
  if(int(S.facility,0)>=6) h+='<p class="ge-caption ge-muted">'+icon('mothers','ge-ic-sm')+' Breeding Lab wing: expanded mother capacity.</p>';
  else h+='<p class="ge-caption ge-muted">'+icon('lock','ge-ic-sm')+' Slots 5–6 unlock with the Breeding Lab facility.</p>';
  h+='<div class="ge-datarow"><span>'+icon('mothers','ge-ic-md')+'Mother slots</span><b class="ge-num">'+int(S.motherCapacity,0)+' / '+capMax+'</b></div>';
  h+=maxed?'<p class="ge-label">MAXED OUT.</p>'
    :'<button class="ge-btn ge-btn-gold ge-btn-block" data-buymother="1">'+icon('plus','ge-ic-md')+'ADD SLOT — '+fmt$(MOTHER_CAP_COSTS[int(S.motherCapacity,0)])+'</button>';
  return h+'</div></div>';
}
function EM_facilitiesHTML(){
  let h='<div class="ge-section-title">'+icon('empire','ge-ic-md')+'<span>FACILITY PROGRESSION</span></div>';
  h+=EM_progressStrip();
  h+='<div class="ge-section-title">'+icon('facility','ge-ic-md')+'<span>FACILITIES</span></div>';
  FACILITIES.forEach((f,i)=>{ h+=EM_facilityCard(f,i); });
  h+=EM_motherRoomCard();
  /* P3-W6 endgame cross-link: maxed facilities are never a dead end -
     the frontier becomes optimization (records) and the genetics. */
  try{
    if(int(S.facility,0)>=FACILITIES.length-1){
      h+='<div class="ge-card ge-card-flat"><div class="ge-card-head"><h3>'+icon('trophy','ge-ic-md')+'EMPIRE COMPLETE — THE FRONTIER</h3></div>'+
       '<p class="ge-caption ge-muted">Every room built. From here the game is mastery: beat your personal records and push the genetics further than the rooms ever could.</p>'+
       '<div class="ge-btn-row"><button class="ge-btn ge-btn-ghost ge-btn-sm" data-ex-go="leaderboards">HALL OF RECORDS</button>'+
       '<button class="ge-btn ge-btn-ghost ge-btn-sm" data-ex-go="breeding">BREEDING LAB</button></div></div>';
    }
  }catch(e){}
  return h;
}
function EM_equipTierName(lvl){ return EM_EQUIP_TIERS[clamp(int(lvl,0),1,5)]; }
function EM_dotMeter(lvl,max){
  let s='<span class="ge-dots" role="img" aria-label="Level '+int(lvl,0)+' of '+int(max,0)+'">';
  for(let i=1;i<=max;i++) s+='<i class="'+(i<=lvl?'on':'')+'"></i>';
  return s+'</span>';
}
function EM_equipModule(d){
  const lvl=int(num(S.equipment[d.id],1),1), maxed=lvl>=d.max;
  const tier=EM_equipTierName(lvl);
  let h='<div class="ge-card ge-equip">';
  h+='<div class="ge-equip-ico">'+icon(EM_EQUIP_ICON[d.id]||d.ic,'ge-ic-xl')+'</div>';
  h+='<div class="ge-equip-body">';
  h+='<div class="ge-card-head"><h3>'+esc(d.name)+'</h3><span class="ge-pill '+(lvl>=5?'ge-pill-gold':'ge-pill-neutral')+'">'+esc(tier).toUpperCase()+'</span></div>';
  h+=EM_dotMeter(lvl,d.max);
  h+='<p class="ge-caption ge-muted">'+esc(d.desc)+'</p>';
  if(maxed){
    h+='<p class="ge-label">MAXED OUT.</p>';
  }else{
    const cost=equipCost(d,lvl), nt=EM_equipTierName(lvl+1);
    h+='<div class="ge-datarow"><span>Next · '+esc(nt)+'</span><b class="ge-num">'+fmt$(cost)+'</b></div>';
    h+='<button class="ge-btn ge-btn-primary ge-btn-block" data-buye="'+d.id+'">'+icon('equipment','ge-ic-md')+'UPGRADE — '+fmt$(cost)+'</button>';
  }
  return h+'</div></div>';
}
function EM_amSummary(){
  try{
    if(typeof AM_ORDER==='undefined'||!S||!S.am) return '';
    const online=AM_ORDER.filter(k=>{ const s=S.am[k]; return s&&s.owned&&s.on; }).length;
    return '<div class="ge-card ge-equip"><div class="ge-equip-ico">'+icon('settings','ge-ic-xl')+'</div>'+
     '<div class="ge-equip-body"><div class="ge-card-head"><h3>AUTOMATION</h3><span class="ge-pill ge-pill-neutral">SYSTEMS</span></div>'+
     '<p class="ge-caption ge-muted">Hands-free empire systems — watering, feeding, climate and more.</p>'+
     '<div class="ge-datarow"><span>Systems online</span><b class="ge-num">'+online+' / '+AM_ORDER.length+'</b></div>'+
     '<button class="ge-btn ge-btn-ghost ge-btn-block" data-ge-auto="1">OPEN AUTOMATION</button></div></div>';
  }catch(e){ return ''; }
}
function EM_equipmentHTML(){
  let h=npcBlurb('sal');
  h+='<div class="ge-section-title">'+icon('equipment','ge-ic-md')+'<span>EQUIPMENT DEPOT</span></div>';
  EQUIP_DEFS.forEach(d=>{ h+=EM_equipModule(d); });
  h+=EM_amSummary();
  return h;
}
/* QA GE-405: fire a basic-crew member. Confirm-first; NO severance and NO hire-cost
   refund by design (a refund path is exactly what would enable dupe-cash exploits, so
   none exists). Root-cause guards: every crew bonus reads S.crew[id] directly and the
   payroll tick sums only truthy S.crew keys, so setting the flag false clears bonuses
   AND payroll entries atomically — no parallel registries to desync, no ghost charges,
   and the boolean map makes double crew slots impossible. Mirrors the staff EX_fireEmp
   pattern. */
function fireCrew(id){
  const c=CREW_DEFS.find(x=>x.id===id);
  if(!c||!S.crew[c.id]) return false; /* not hired or bad id: no-op, never pays or refunds */
  confirmModal('Fire '+c.name+'?', c.name+' will leave the crew immediately. No severance, no refund of the '+fmt$(c.hire)+' hire cost. Their bonus ends and the '+fmt$(c.wage)+'/day wage stops.', ()=>{
    if(!S.crew[c.id]) return; /* already gone: never fire twice (confirmModal also disarms, QA GE-702) */
    S.crew[c.id]=false;
    toast(icon('x','ge-ic-md')+' Fired '+esc(c.name)+'.');
    save(); updateHUD(); checkMissions(); RENDER.empire();
  });
  return true;
}
function EM_crewHTML(){
  let h='<div class="ge-card ge-card-flat"><div class="ge-card-head"><h3>'+icon('crew','ge-ic-lg')+'CREW</h3></div>'+
   '<p class="ge-caption ge-muted">Crew members charge a daily wage, deducted each day. Named professionals live under the STAFF tab.</p></div>';
  CREW_DEFS.forEach(c=>{
    const hired=!!S.crew[c.id];
    h+='<div class="ge-card ge-equip'+(hired?' ge-hired':'')+'"><div class="ge-equip-ico">'+icon(c.ic,'ge-ic-xl')+'</div><div class="ge-equip-body">';
    h+='<div class="ge-card-head"><h3>'+esc(c.name)+'</h3>'+(hired?'<span class="ge-pill ge-pill-optimal">'+icon('check','ge-ic-sm')+'ON PAYROLL</span>':'')+'</div>';
    h+='<p class="ge-caption ge-muted">'+esc(c.desc)+'</p>';
    h+='<div class="ge-datarow"><span>'+icon('cash','ge-ic-md')+'Hire cost</span><b class="ge-num">'+fmt$(c.hire)+'</b></div>';
    h+='<div class="ge-datarow"><span>'+icon('day','ge-ic-md')+'Daily wage</span><b class="ge-num">'+fmt$(c.wage)+'</b></div>';
    h+=hired?'<button class="ge-btn ge-btn-danger ge-btn-block" data-fire="'+c.id+'">'+icon('x','ge-ic-md')+'FIRE</button>':'<button class="ge-btn ge-btn-primary ge-btn-block" data-hire="'+c.id+'">'+icon('crew','ge-ic-md')+'HIRE</button>';
    h+='</div></div>';
  });
  return h;
}
function EM_gateProgress(l){
  const g=l.gate||{};
  let h='';
  if(int(g.rep,0)>0){ const p=clamp(int(S.reputation,0)/int(g.rep,0)*100,0,100);
    h+='<div class="ge-progress-meta"><span>Reputation</span><b class="ge-num">'+int(S.reputation,0)+' / '+int(g.rep,0)+'</b></div><div class="ge-progress ge-progress-thin"><i style="width:'+p+'%"></i></div>'; }
  if(num(g.cash,0)>0){ const p=clamp(num(S.cash,0)/num(g.cash,0)*100,0,100);
    h+='<div class="ge-progress-meta"><span>Cash</span><b class="ge-num">'+fmt$(num(S.cash,0))+' / '+fmt$(g.cash)+'</b></div><div class="ge-progress ge-progress-thin"><i style="width:'+p+'%"></i></div>'; }
  if(int(g.missions,0)>0){ const p=clamp(int(S.stats.missionsDone,0)/int(g.missions,0)*100,0,100);
    h+='<div class="ge-progress-meta"><span>Missions</span><b class="ge-num">'+int(S.stats.missionsDone,0)+' / '+int(g.missions,0)+'</b></div><div class="ge-progress ge-progress-thin"><i style="width:'+p+'%"></i></div>'; }
  return h;
}
function EM_rarCls(rarity){
  return rarity==='legendary'?'ge-badge ge-badge-legendary'
    :rarity==='elite'?'ge-badge ge-badge-elite'
    :'ge-pill ge-pill-neutral';
}
function EM_facilityUnlockCine(prevT,newT,name){
  const slots=FACILITIES[clamp(int(S.facility,0),0,FACILITIES.length-1)].slots;
  return cineOverlay(
   '<div class="ge-cine-fac"><div class="ge-display ge-cine-title">FACILITY UNLOCKED</div>'+
   '<div class="ge-cine-compare"><div class="ge-cine-side"><span class="ge-label">BEFORE</span>'+facilitySceneSVG(prevT)+'<b>'+esc(FAC_TIERS[prevT].name)+'</b></div>'+
   '<div class="ge-cine-arrow">'+icon('arrow-right','ge-ic-lg')+'</div>'+
   '<div class="ge-cine-side"><span class="ge-label">NOW</span>'+facilitySceneSVG(newT)+'<b>'+esc(name)+'</b></div></div>'+
   '<p class="ge-body">+'+slots+' grow slots</p>'+
   '<p class="ge-caption ge-muted">Tap anywhere to continue</p></div>',
   'ge-cine-facility',2800);
}
function WX_ic(n,cls){ return (typeof icon==='function')?icon(n,cls||'ge-ic-md'):''; }
function WX_rarPill(rar){
  return rar==='LEGENDARY'?'ge-pill-gold':rar==='RARE'?'ge-pill-gold':rar==='UNCOMMON'?'ge-pill-watch':'ge-pill-neutral';
}
function WX_envBandFor(key,v){
  if(v===null||v===undefined||isNaN(+v)) return 'unknown';
  v=+v; var b='unknown';
  if(key==='temp'){ b=v<64||v>86?'critical':v<67||v>84?'warning':v<70||v>82?'watch':'optimal'; }
  else if(key==='rh'){ b=v<30||v>70?'critical':v<35||v>65?'warning':v<40||v>60?'watch':'optimal'; }
  else if(key==='vpd'){ b=v<0.4||v>1.6?'critical':v<0.6||v>1.4?'warning':v<0.8||v>1.2?'watch':'optimal'; }
  else if(key==='ppfd'){ b=v<400||v>1050?'critical':v<500||v>1025?'warning':v<600||v>1000?'watch':'optimal'; }
  else if(key==='co2'){ b=v<600||v>1800?'critical':v<700||v>1650?'warning':v<800||v>1500?'watch':'optimal'; }
  else if(key==='ph'){ b=v<5.5||v>6.8?'critical':v<5.65||v>6.65?'warning':v<5.8||v>6.5?'watch':'optimal'; }
  else if(key==='ec'){ b=v<0.4||v>3.0?'critical':v<0.6||v>2.6?'warning':v<1.0||v>2.2?'watch':'optimal'; }
  return b;
}
function WX_envPill(band){
  var cls={optimal:'ge-pill-optimal',watch:'ge-pill-watch',warning:'ge-pill-warning',critical:'ge-pill-critical',unknown:'ge-pill-neutral'}[band]||'ge-pill-neutral';
  var ic={optimal:'check',watch:'warn',warning:'warn',critical:'warn',unknown:'sensors'}[band]||'sensors';
  var lbl={optimal:'OPTIMAL',watch:'WATCH',warning:'WARNING',critical:'CRITICAL',unknown:'NO DATA'}[band]||'NO DATA';
  return '<span class="ge-pill '+cls+'">'+WX_ic(ic,'ge-ic-sm')+lbl+'</span>';
}
function WX_roomAvg(key){
  try{
    if(typeof S==='undefined'||!S||!Array.isArray(S.plants)||!S.plants.length) return null;
    var sum=0,n=0;
    S.plants.forEach(function(p){ var v=num(p[key],NaN); if(!isNaN(v)){ sum+=v; n++; } });
    return n?sum/n:null;
  }catch(e){ return null; }
}
function WX_reservoirEst(){
  var n=WX_roomAvg('nutrition');
  if(n===null) return {ph:null,ec:null};
  return { ph:Math.round((5.5+n/100*1.5)*10)/10, ec:Math.round((0.3+n/100*2.4)*10)/10 };
}
function WX_envDerived(){
  try{ if(typeof TY_envVals==='function'){ var v=TY_envVals(); return {vpd:num(v.vpd,NaN),ppfd:num(v.ppfd,NaN)}; } }catch(e){}
  return {vpd:NaN,ppfd:NaN};
}
function WX_envReadings(){
  var e=(typeof S!=='undefined'&&S&&S.env)?S.env:{};
  var dv=WX_envDerived(), res=WX_reservoirEst();
  var defs=[
    {key:'temp',label:'TEMP',icon:'temp',val:num(e.temp,76),min:60,max:95,fmt:function(v){return Math.round(v)+'°F';},target:'TARGET 70–82°F'},
    {key:'rh',label:'RH',icon:'humidity',val:num(e.humidity,52),min:0,max:100,fmt:function(v){return Math.round(v)+'%';},target:'TARGET 40–60%'},
    {key:'vpd',label:'VPD',icon:'vpd',val:dv.vpd,min:0,max:2,fmt:function(v){return v.toFixed(2)+' kPa';},target:'TARGET 0.8–1.2 kPa'},
    {key:'ppfd',label:'PPFD',icon:'lighting',val:dv.ppfd,min:0,max:1200,fmt:function(v){return String(Math.round(v));},target:'TARGET 600–1000'},
    {key:'co2',label:'CO2',icon:'co2',val:num(e.co2,900),min:400,max:1600,fmt:function(v){return Math.round(v)+' ppm';},target:'TARGET 800–1500'},
    {key:'ph',label:'pH',icon:'ph',val:res.ph,min:4,max:8,fmt:function(v){return v.toFixed(1);},target:'TARGET 5.8–6.5 · EST'},
    {key:'ec',label:'EC',icon:'ec',val:res.ec,min:0,max:3,fmt:function(v){return v.toFixed(1)+' mS';},target:'TARGET 1.0–2.2 · EST'}
  ];
  defs.forEach(function(g){
    if(g.val===null||g.val===undefined||isNaN(g.val)) g.val=null;
    g.band=g.val===null?'unknown':WX_envBandFor(g.key,g.val);
    g.pct=g.val===null?0:clamp((g.val-g.min)/(g.max-g.min)*100,0,100);
  });
  return defs;
}
function WX_envGaugeHTML(g){
  var tone={optimal:'ge-ring-ok',watch:'ge-ring-warn',warning:'ge-ring-bad',critical:'ge-ring-bad',unknown:''}[g.band];
  var valTxt=g.val===null?'—':g.fmt(g.val);
  return '<div class="ge-env-gauge">'+
   '<div class="ge-ring '+tone+'"><svg viewBox="0 0 36 36" aria-hidden="true">'+
   '<circle class="ge-ring-track" cx="18" cy="18" r="15.9155"></circle>'+
   '<circle class="ge-ring-val" cx="18" cy="18" r="15.9155" stroke-dasharray="'+Math.round(g.pct)+' 100"></circle></svg>'+
   '<div class="ge-ring-label ge-num">'+valTxt+'</div></div>'+
   '<div class="ge-env-gauge-name">'+WX_ic(g.icon,'ge-ic-sm')+g.label+'</div>'+
   WX_envPill(g.band)+
   '<div class="ge-caption ge-muted">'+g.target+'</div></div>';
}
function WX_envScoreRing(){
  var score=null;
  try{ if(typeof envEval==='function') score=envEval().score; }catch(e){}
  if(score===null||isNaN(score)) return '';
  var tone=score>=80?'ge-ring-ok':score>=55?'ge-ring-warn':'ge-ring-bad';
  return '<div class="ge-env-score"><div class="ge-ring '+tone+'"><svg viewBox="0 0 36 36" aria-hidden="true">'+
   '<circle class="ge-ring-track" cx="18" cy="18" r="15.9155"></circle>'+
   '<circle class="ge-ring-val" cx="18" cy="18" r="15.9155" stroke-dasharray="'+clamp(Math.round(score),0,100)+' 100"></circle></svg>'+
   '<div class="ge-ring-label ge-num">'+Math.round(score)+'</div></div>'+
   '<div class="ge-caption ge-muted">ENV SCORE</div></div>';
}
function WX_cleanIssue(txt){
  if(txt&&typeof txt==='object'){ return {icon:txt.icon||'warn',text:String(txt.text||'')}; }
  var t=String(txt||'').replace(/^[^A-Za-z0-9(]+/u,'');
  var ic='warn';
  if(/cold|hot|temp/i.test(t)) ic='temp';
  else if(/humidity/i.test(t)) ic='humidity';
  else if(/light/i.test(t)) ic='lighting';
  else if(/co2/i.test(t)) ic='co2';
  return {icon:ic,text:t};
}
function WX_envSliderHTML(key,label,val,min,max,unit,iconName){
  return '<div class="ge-env-ctl"><div class="ge-datarow"><span>'+WX_ic(iconName,'ge-ic-sm')+label+'</span><b class="ge-num ge-env-val">'+val+unit+'</b></div>'+
   '<input type="range" class="ge-env-slider" min="'+min+'" max="'+max+'" step="1" value="'+val+'" data-env="'+key+'" data-unit="'+unit+'" aria-label="'+label+'">'+
   '<div class="ge-env-scale"><span class="ge-caption ge-muted">'+min+unit+'</span><span class="ge-caption ge-muted">'+max+unit+'</span></div></div>';
}
var WX_EQUIP_ROWS=[
 {id:'lights',label:'LIGHTS',icon:'lighting'},
 {id:'hvac',label:'CLIMATE',icon:'hvac'},
 {id:'co2sys',label:'CO2 SYSTEM',icon:'co2'},
 {id:'irrigation',label:'IRRIGATION',icon:'irrigation'},
 {id:'nutrients',label:'NUTRIENTS',icon:'nutrients'},
 {id:'drycure',label:'DRY / CURE',icon:'drycure'}
];
function WX_envEquipHTML(){
  return WX_EQUIP_ROWS.map(function(r){
    var off=false;
    try{ off=WX_equipDisabled(r.id); }catch(e){}
    return '<div class="ge-datarow"><span>'+WX_ic(r.icon,'ge-ic-sm')+r.label+'</span>'+
     (off?'<span class="ge-pill ge-pill-critical">'+WX_ic('warn','ge-ic-sm')+'OFFLINE</span>'
         :'<span class="ge-pill ge-pill-optimal">'+WX_ic('check','ge-ic-sm')+'ONLINE</span>')+'</div>';
  }).join('');
}
function WX_envControlHTML(){
  WX_init();
  var gauges=WX_envReadings();
  var html='<div class="ge-card ge-card-hot ge-env-panel">'+
   '<div class="ge-card-head"><h3>'+WX_ic('hvac','ge-ic-md')+'ENVIRONMENT CONTROL</h3><span class="ge-spread">'+WX_envScoreRing()+'</span></div>'+
   '<div class="ge-env-gauges">'+gauges.map(WX_envGaugeHTML).join('')+'</div>'+
   '<div class="ge-divider"></div>'+
   '<div class="ge-section-title">HARDWARE CONTROLS</div>'+
   '<div class="ge-env-sliders">'+
    WX_envSliderHTML('light','LIGHT INTENSITY',num(S.env.light,80),40,100,'%','lighting')+
    WX_envSliderHTML('temp','TEMPERATURE',num(S.env.temp,76),60,95,'°F','temp')+
    WX_envSliderHTML('humidity','HUMIDITY',num(S.env.humidity,52),20,90,'%','humidity')+
    WX_envSliderHTML('co2','CO2',num(S.env.co2,900),400,1600,' PPM','co2')+
   '</div>';
  html+='<div class="ge-divider"></div><div class="ge-section-title">EQUIPMENT STATUS</div>'+WX_envEquipHTML();
  var issues=[];
  try{ if(typeof envEval==='function') issues=envEval().issues||[]; }catch(e){}
  if(issues.length){
    html+='<div class="ge-divider"></div><div class="ge-section-title">ATTENTION</div><div class="ge-stack">'+
     issues.map(function(t){ var c=WX_cleanIssue(t); return '<div class="ge-datarow"><span>'+WX_ic(c.icon,'ge-ic-sm')+esc(c.text)+'</span>'+WX_envPill('warning')+'</div>'; }).join('')+'</div>';
  } else {
    html+='<div class="ge-env-ok">'+WX_ic('check','ge-ic-md')+'<span>Environment dialed in.</span></div>';
  }
  html+=WX_envHistoryHTML();
  html+='</div>';
  return html;
}
function WX_wireEnvControls(root){
  if(!root) return;
  root.querySelectorAll('input[type=range][data-env].ge-env-slider').forEach(function(s){
    s.oninput=function(e){
      var t=e.target;
      try{ S.env[t.dataset.env]=+t.value; }catch(err){}
      var lab=t.closest('.ge-env-ctl');
      var out=lab?lab.querySelector('.ge-env-val'):null;
      if(out) out.textContent=t.value+t.dataset.unit;
    };
    s.onchange=function(){
      try{ save(); }catch(e){}
      try{ if(typeof refreshGrowUI==='function') refreshGrowUI(); }catch(e){}
    };
  });
  root.querySelectorAll('[data-wx-histr]').forEach(function(b){
    b.onclick=function(){ WX_setHistRange(b.dataset.wxHistr); };
  });
}
function WX_envSnapshotTick(){
  try{
    if(typeof S==='undefined'||!S) return;
    if(!S.envHist) S.envHist=[];
    if(!Array.isArray(S.envHist)) S.envHist=[];
    var now=Date.now();
    var last=S.envHist[S.envHist.length-1];
    if(last&&now-num(last.t,0)<20*3600*1000) return; /* idempotent: ~1 snapshot/day max */
    var dv=WX_envDerived(), res=WX_reservoirEst();
    S.envHist.push({
      t:now,
      temp:num(S.env.temp,76), rh:num(S.env.humidity,52),
      vpd:isNaN(dv.vpd)?null:Math.round(dv.vpd*100)/100,
      ec:res.ec, ph:res.ph,
      water:WX_roomAvg('water'), health:WX_roomAvg('health')
    });
    while(S.envHist.length>200) S.envHist.shift();
  }catch(e){}
}
var WX_histRange='24H';
function WX_setHistRange(r){
  WX_histRange=r;
  try{ if(typeof current!=='undefined'&&typeof RENDER!=='undefined'&&RENDER[current]) RENDER[current](); }catch(e){}
}
function WX_histFiltered(){
  var out=[];
  try{
    if(typeof S==='undefined'||!S||!Array.isArray(S.envHist)) return out;
    var span={'1H':3600000,'6H':21600000,'24H':86400000,'7D':604800000}[WX_histRange]||86400000;
    var cut=Date.now()-span;
    out=S.envHist.filter(function(e){ return e&&num(e.t,0)>=cut; });
  }catch(e){}
  return out;
}
function WX_sparkSVG(vals){
  var pts=vals.filter(function(v){ return v!==null&&v!==undefined&&!isNaN(v); });
  if(pts.length<2) return '';
  var stride=Math.max(1,Math.ceil(pts.length/60)); /* cap ~60 points */
  var ds=[]; for(var i=0;i<pts.length;i+=stride) ds.push(pts[i]);
  if(ds[ds.length-1]!==pts[pts.length-1]) ds.push(pts[pts.length-1]);
  var mn=Math.min.apply(null,ds), mx=Math.max.apply(null,ds), rg=(mx-mn)||1;
  var p=ds.map(function(v,i){
    var x=(i/(ds.length-1)*100).toFixed(1);
    var y=(34-((v-mn)/rg*30)).toFixed(1);
    return x+','+y;
  }).join(' ');
  return '<svg class="ge-spark" viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true"><polyline points="'+p+'"/></svg>';
}
function WX_envHistoryHTML(){
  var ranges=['1H','6H','24H','7D'];
  var html='<div class="ge-divider"></div><div class="ge-section-title">ENVIRONMENT HISTORY</div>'+
   '<div class="ge-seg" role="tablist">'+ranges.map(function(r){
     return '<button role="tab" aria-selected="'+(WX_histRange===r)+'" class="'+(WX_histRange===r?'is-active':'')+'" data-wx-histr="'+r+'">'+r+'</button>';
   }).join('')+'</div>';
  var rows=WX_histFiltered();
  if(rows.length<2){
    return html+'<div class="ge-empty">'+WX_ic('sensors','ge-ic-xl')+'<h3>Not enough history yet</h3><p>Environment snapshots are recorded once per day. Check back after a few grows.</p></div>';
  }
  var series=[
    {k:'temp',label:'TEMP',fmt:function(v){return Math.round(v)+'°F';}},
    {k:'rh',label:'RH',fmt:function(v){return Math.round(v)+'%';}},
    {k:'vpd',label:'VPD',fmt:function(v){return v.toFixed(2);}},
    {k:'ec',label:'EC',fmt:function(v){return v.toFixed(1);}},
    {k:'ph',label:'pH',fmt:function(v){return v.toFixed(1);}},
    {k:'water',label:'WATER',fmt:function(v){return Math.round(v)+'%';}},
    {k:'health',label:'HEALTH',fmt:function(v){return Math.round(v)+'%';}}
  ];
  html+='<div class="ge-env-hist-grid">'+series.map(function(s){
    var vals=rows.map(function(e){ return (e&&e[s.k]!==null&&e[s.k]!==undefined)?+e[s.k]:null; }).filter(function(v){ return v!==null&&!isNaN(v); });
    if(vals.length<2) return '<div class="ge-env-hist"><div class="ge-spread"><span class="ge-label">'+s.label+'</span><span class="ge-caption ge-muted">—</span></div><p class="ge-caption ge-muted">No data in this range.</p></div>';
    var mn=Math.min.apply(null,vals), mx=Math.max.apply(null,vals);
    return '<div class="ge-env-hist"><div class="ge-spread"><span class="ge-label">'+s.label+'</span><b class="ge-num">'+s.fmt(vals[vals.length-1])+'</b></div>'+
     WX_sparkSVG(vals)+
     '<div class="ge-spread"><span class="ge-caption ge-muted">min '+s.fmt(mn)+'</span><span class="ge-caption ge-muted">max '+s.fmt(mx)+'</span></div></div>';
  }).join('')+'</div>';
  return html;
}
function GT_starMeter(v){
  const val=clamp(Math.round(num(v,0)/20*2)/2,0,5);
  let h='<span class="ge-smeter" role="img" aria-label="'+val+' of 5 stars">';
  for(let i=1;i<=5;i++){
    const c=val>=i?'on':(val>=i-0.5?'half':'');
    h+='<i class="'+c+'">★</i>';
  }
  return h+'</span>';
}
function GT_demandPill(st){
  const d=GT_demand(st)[0];
  const cls=d==='HIGH'?'ge-pill-optimal':d==='RISING'?'ge-pill-watch':'ge-pill-neutral';
  return '<span class="ge-pill '+cls+'">'+d+' DEMAND</span>';
}
function GT_rarityBadge(rar){
  const map={legendary:['ge-badge-legendary','crown-gold'],elite:['ge-badge-elite','star'],rare:['','star'],common:['ge-badge-common','leaf']};
  const m=map[rar]||map.common;
  return '<span class="ge-badge '+m[0]+'">'+icon(m[1],'ge-ic-sm')+String(rar).toUpperCase()+'</span>';
}
function GT_p0Status(st){
  const isP0=st.id==='project-zero-og'||st.id==='crown-jewel';
  if(isP0) return '<span class="ge-badge ge-badge-legendary">'+icon('project0','ge-ic-sm')+'PROJECT 0 ARCHIVE</span>';
  const kp=(S.keepers||[]).filter(k=>k.strainId===st.id).length;
  if(kp>0) return '<span class="ge-badge ge-badge-keeper">'+icon('crown','ge-ic-sm')+'PRESERVED ×'+kp+'</span>';
  return '<span class="ge-badge ge-badge-common">STANDARD ARCHIVE</span>';
}
function GT_crossesOf(st){
  try{
    return (S.customStrains||[]).filter(c=>String(c.lineage||'').indexOf(st.name)>=0);
  }catch(e){ return []; }
}
let GR_uid=0;
function GR_facilityScene(tier){
  GR_uid++;
  const u='grf'+GR_uid, W=400, H=160;
  const T=FAC_TIERS[clamp(int(tier,0),0,8)]||FAC_TIERS[0];
  let h='<svg class="ge-facscene" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid slice" aria-hidden="true">';
  h+='<defs><linearGradient id="'+u+'bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#161013"/><stop offset="1" stop-color="#0a0708"/></linearGradient>'+
     '<radialGradient id="'+u+'gl" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff5a5a" stop-opacity="0.5"/><stop offset="1" stop-color="#ff5a5a" stop-opacity="0"/></radialGradient></defs>';
  h+='<rect width="'+W+'" height="'+H+'" fill="url(#'+u+'bg)"/>';
  /* floor */
  h+='<rect y="'+(H-16)+'" width="'+W+'" height="16" fill="#0d0b0a"/><rect y="'+(H-16)+'" width="'+W+'" height="1.5" fill="#2a2a2e"/>';
  /* ---- tier structure ---- */
  if(tier<=1){
    /* grow tent */
    h+='<path d="M52 '+(H-16)+' L200 30 L348 '+(H-16)+' z" fill="#141114" stroke="#3a2a2e" stroke-width="3"/>';
    h+='<path d="M200 30 L200 '+(H-16)+'" stroke="#2a2024" stroke-width="2"/>';
    h+='<path d="M176 '+(H-16)+' L200 84 L224 '+(H-16)+'" fill="#0c0a0c" stroke="#3a2a2e" stroke-width="2"/>';
    if(tier===1){ h+='<rect x="286" y="52" width="34" height="10" fill="#1c1c1e" stroke="#333"/><rect x="80" y="52" width="34" height="10" fill="#1c1c1e" stroke="#333"/>'; }
  }else if(tier<=3){
    /* home / production room */
    h+='<rect x="36" y="34" width="328" height="'+(H-50)+'" fill="#121013" stroke="#33302f" stroke-width="2"/>';
    for(let wx=56;wx<340;wx+=38) h+='<rect x="'+wx+'" y="44" width="26" height="18" fill="#1e1a1c" stroke="#2e2a2c"/>';
    if(tier===3){ h+='<rect x="36" y="20" width="328" height="9" fill="#1c1c1e" stroke="#333"/>'; for(let dx=70;dx<360;dx+=60) h+='<rect x="'+dx+'" y="20" width="4" height="9" fill="#333"/>'; }
  }else if(tier===4){
    /* commercial facility: sawtooth roof warehouse */
    h+='<rect x="24" y="52" width="352" height="'+(H-68)+'" fill="#111014" stroke="#3a3638" stroke-width="2"/>';
    h+='<path d="M24 52 l44 -26 l44 26 l44 -26 l44 26 l44 -26 l44 26 l44 -26 l44 26" fill="none" stroke="#3a3638" stroke-width="3"/>';
    for(let wx=44;wx<340;wx+=40) h+='<rect x="'+wx+'" y="66" width="24" height="30" fill="#191417" stroke="#2e2a2c"/>';
  }else if(tier===5){
    /* genetics lab: benches + dna helix */
    h+='<rect x="24" y="44" width="352" height="'+(H-60)+'" fill="#0e1518" stroke="#2e4a4e" stroke-width="2"/>';
    h+='<path d="M300 60 C 330 80 330 110 300 128 M340 60 C 310 80 310 110 340 128" fill="none" stroke="#e02020" stroke-width="2.5" opacity="0.85"/>';
    for(let ry=0;ry<4;ry++){ const yy=74+ry*14; h+='<line x1="306" y1="'+yy+'" x2="334" y2="'+yy+'" stroke="#8a8a8e" stroke-width="1.5" opacity="0.7"/>'; }
    h+='<rect x="52" y="96" width="120" height="10" fill="#1c1c1e" stroke="#3a6a6e"/><rect x="66" y="70" width="14" height="26" fill="#233038" stroke="#3a6a6e"/><rect x="92" y="78" width="18" height="18" fill="#233038" stroke="#3a6a6e"/>';
  }else if(tier===6){
    /* breeding facility: crossing lines */
    h+='<rect x="24" y="44" width="352" height="'+(H-60)+'" fill="#121014" stroke="#4a3638" stroke-width="2"/>';
    h+='<path d="M150 122 L250 70 M250 122 L150 70" stroke="#e02020" stroke-width="3" opacity="0.7"/>';
    h+='<circle cx="150" cy="122" r="10" fill="none" stroke="#3ddc5f" stroke-width="2"/><circle cx="250" cy="70" r="10" fill="none" stroke="#3ddc5f" stroke-width="2"/>';
    h+='<circle cx="250" cy="122" r="10" fill="none" stroke="#e02020" stroke-width="2"/><circle cx="150" cy="70" r="10" fill="none" stroke="#e02020" stroke-width="2"/>';
  }else if(tier===7){
    /* preservation vault: gold-trimmed vault door */
    h+='<rect x="0" y="0" width="'+W+'" height="5" fill="#d4a017" opacity="0.55"/><rect x="0" y="'+(H-21)+'" width="'+W+'" height="5" fill="#d4a017" opacity="0.55"/>';
    h+='<circle cx="200" cy="92" r="46" fill="#151517" stroke="#d4a017" stroke-width="3"/>';
    h+='<circle cx="200" cy="92" r="34" fill="none" stroke="#3a3a3e" stroke-width="2"/>';
    for(let sp=0;sp<8;sp++){ const a=sp*Math.PI/4, x1=200+Math.cos(a)*12, y1=92+Math.sin(a)*12, x2=200+Math.cos(a)*34, y2=92+Math.sin(a)*34;
      h+='<line x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'" stroke="#4a4a4e" stroke-width="3"/>'; }
    h+='<circle cx="200" cy="92" r="8" fill="#d4a017" opacity="0.85"/>';
  }else{
    /* shocker ownz empire: tower + crown */
    h+='<rect x="150" y="26" width="100" height="'+(H-42)+'" fill="#141114" stroke="#5a1a1a" stroke-width="2"/>';
    h+='<rect x="165" y="12" width="70" height="16" fill="#141114" stroke="#5a1a1a" stroke-width="2"/>';
    for(let wy=40;wy<H-24;wy+=18) for(let wx=160;wx<240;wx+=20) h+='<rect x="'+wx+'" y="'+wy+'" width="10" height="8" fill="#ff5a5a" opacity="0.28"/>';
    h+='<rect x="60" y="70" width="60" height="'+(H-86)+'" fill="#100e10" stroke="#3a2a2e"/><rect x="280" y="70" width="60" height="'+(H-86)+'" fill="#100e10" stroke="#3a2a2e"/>';
    h+='<path d="M182 8 l6 -10 l6 6 l6 -12 l6 12 l6 -6 l6 10 z" fill="#d4a017"/>';
  }
  /* ---- hanging light bars ---- */
  const nL=T.lights, span=W/(nL+1);
  for(let i=1;i<=nL;i++){
    const x=Math.round(i*span);
    h+='<line x1="'+x+'" y1="26" x2="'+x+'" y2="14" stroke="#3a3a3e" stroke-width="3"/>';
    h+='<rect x="'+(x-28)+'" y="26" width="56" height="7" rx="2" fill="#151517" stroke="#7a0d0d"/>';
    h+='<rect x="'+(x-23)+'" y="27.5" width="46" height="4" fill="#ff6b6b" opacity="0.8"/>';
    h+='<ellipse class="ge-facscene-glow" cx="'+x+'" cy="86" rx="50" ry="44" fill="url(#'+u+'gl)"/>';
  }
  /* ---- plant rows (kept clear of vault door / tower) ---- */
  const rows=T.rows, skipMid=(tier>=7);
  for(let ri=0;ri<rows;ri++){
    const y0=H-26-ri*9, n=5+Math.min(5,rows);
    for(let i=0;i<n;i++){
      const x=Math.round(28+i*(W-56)/Math.max(1,n-1));
      if(skipMid&&x>110&&x<290) continue;
      const hh=13+((i*37+ri*13)%3)*5;
      h+='<g><rect x="'+(x-6)+'" y="'+(y0-6)+'" width="12" height="6" fill="#141414"/>'+
         '<path d="M'+x+' '+(y0-6)+' v-'+hh+'" stroke="#1d3a1a" stroke-width="2"/>'+
         '<path d="M'+x+' '+(y0-10)+' c-6 -2 -9 -6 -8 -11 c4 1 7 5 8 11z M'+x+' '+(y0-10)+' c6 -2 9 -6 8 -11 c-4 1 -7 5 -8 11z" fill="#2e6b34"/></g>';
    }
  }
  return h+'</svg>';
}
function GR_ring(pct,tone){
  const p=clamp(Math.round(pct),0,100);
  return '<span class="ge-ring ge-ring-'+tone+'"><svg viewBox="0 0 36 36" aria-hidden="true">'+
   '<circle class="ge-ring-track" cx="18" cy="18" r="15.9155"/>'+
   '<circle class="ge-ring-val" cx="18" cy="18" r="15.9155" stroke-dasharray="'+p+' 100"/></svg>'+
   '<span class="ge-ring-label">'+p+'<small>%</small></span></span>';
}
function GR_tile(ico,label,val,sub,tone){
  return '<div class="ge-metric-tile"><div class="ge-metric-value ge-num '+(tone||'')+'">'+val+'</div>'+
   '<div class="ge-metric-label">'+icon(ico,'ge-ic-md')+' '+label+'</div>'+
   (sub?'<div class="ge-metric-sub">'+sub+'</div>':'')+'</div>';
}
function GR_bar(label,val,tone){
  const p=clamp(Math.round(val),0,100);
  return '<div class="ge-progress-meta"><span>'+label+'</span><b class="ge-num">'+p+'</b></div>'+
   '<div class="ge-progress ge-progress-'+tone+'"><i style="width:'+p+'%"></i></div>';
}
function GR_starMeter(label,pct,known){
  const p=clamp(Math.round(num(pct,0)),0,100), full=Math.round(p/20);
  let s='';
  for(let i=0;i<5;i++) s+='<span class="'+(known&&i<full?'on':'')+'">'+icon('star','ge-ic-sm')+'</span>';
  return '<div class="ge-stars-row"><span class="ge-label">'+label+'</span><span class="ge-stars">'+s+'</span>'+
   '<span class="ge-num ge-muted">'+(known?p:'???')+'</span></div>';
}
function GR_issuePill(issue){
  const toneCls={watch:'ge-pill-watch',warning:'ge-pill-warning',critical:'ge-pill-critical'}[issue.tone]||'ge-pill-watch';
  return '<span class="ge-pill '+toneCls+'">'+icon(issue.icon,'ge-ic-sm')+' '+esc(issue.text)+'</span>';
}
function GR_emptyPlanter(){
  return '<svg class="ge-empty-pot" viewBox="0 0 64 64" aria-hidden="true">'+
   '<path d="M18 40 h28 l-3 14 a3 3 0 0 1-3 3 H24 a3 3 0 0 1-3-3 z" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5 4" opacity="0.55"/>'+
   '<rect x="15" y="34" width="34" height="7" rx="2" fill="none" stroke="currentColor" stroke-width="2" opacity="0.55"/>'+
   '<path d="M32 34 v-7 M26 27 a6 6 0 0 1 12 0" fill="none" stroke="currentColor" stroke-width="2" opacity="0.35" stroke-linecap="round"/></svg>';
}
function GR_plantName(p){
  return esc(phenoName(p)).replace('🧬',icon('dna','ge-ic-sm'));
}
function GR_condTone(p){
  return p.health>=70?'ok':p.health>=40?'warn':'bad';
}
function HM_identityHead(){
  let grower='GUEST';
  try{ const prof=NX_activeProfile(); if(prof&&prof.grower) grower=prof.grower; }catch(e){}
  let rank='STREET ROOKIE';
  try{ rank=TY_rankName(); }catch(e){}
  let val=0;
  try{ if(typeof NX_empireValue==='function') val=NX_empireValue(); }catch(e){}
  let fac='-';
  try{ fac=FAC_TIERS[facTierIdx()].name; }catch(e){}
  const plants=int((S&&S.plants)?S.plants.length:0,0);
  return '<div class="ge-home-hero ge-anim-rise">'+
   '<div class="ge-home-hero-top"><div class="ge-home-mask">'+icon('gasmask','ge-ic-xl')+'</div>'+
   '<div><div class="ge-label ge-muted">EMPIRE COMMAND CENTER</div>'+
   '<div class="ge-h1 ge-home-name">'+esc(grower)+'</div>'+
   '<div class="ge-home-rank"><span class="ge-badge ge-badge-keeper">'+icon('crown-red','ge-ic-sm')+esc(rank)+'</span></div></div></div>'+
   '<div class="ge-tiles ge-tiles-4 ge-home-stats">'+
   '<div class="ge-metric-tile"><div class="ge-metric-value ge-num">'+fmt$(val)+'</div><div class="ge-metric-label">EMPIRE VALUE</div></div>'+
   '<div class="ge-metric-tile"><div class="ge-metric-value ge-num">'+plants+'</div><div class="ge-metric-label">ACTIVE GROWS</div></div>'+
   '<div class="ge-metric-tile"><div class="ge-metric-value ge-truncate">'+esc(fac)+'</div><div class="ge-metric-label">FACILITY</div></div>'+
   '<div class="ge-metric-tile"><div class="ge-metric-value ge-num">DAY '+int(S.day,1)+'</div><div class="ge-metric-label">DAY</div></div>'+
   '</div></div>';
}
function HM_envPill(){
  let score=100;
  try{ score=envEval().score; }catch(e){}
  let cls='ge-pill-optimal', label='OPTIMAL';
  if(score>=90){ cls='ge-pill-optimal'; label='OPTIMAL'; }
  else if(score>=70){ cls='ge-pill-neutral'; label='STABLE'; }
  else if(score>=50){ cls='ge-pill-watch'; label='UNSTABLE'; }
  else{ cls='ge-pill-critical'; label='CRITICAL'; }
  return '<span class="ge-pill '+cls+'">'+icon('temp','ge-ic-sm')+label+' '+score+'</span>';
}
function HM_menuModules(openMissions){
  const fi=clamp(int(S.facility,0),0,FACILITIES.length-1);
  const slots=FACILITIES[fi].slots, nPlants=S.plants.length;
  let rem=null, needy=0, ready=0;
  S.plants.forEach(p=>{
    try{
      if(num(p.health,100)<50||num(p.water,100)<20||num(p.nutrition,100)<15) needy++;
      const stg=stageOf(p);
      if(stg>=5) ready++;
      const st=getStrain(p.strainId);
      if(st&&stg<5){ const d=Math.max(0,Math.ceil(num(st.ft,0)-num(p.day,0))); if(rem===null||d<rem) rem=d; }
    }catch(e){}
  });
  const nextAct=ready>0?('<span class="ge-green">'+ready+' READY</span>')
    :needy>0?('<span class="ge-amber">'+needy+' NEED HELP</span>')
    :rem!==null?('HARVEST IN '+rem+'D'):'PLANT A SEED';
  let unlocked=0,total=0,keepers=0,hunts=0;
  try{ unlocked=unlockedCount(S); total=allStrains().length; keepers=(S.keepers||[]).length; }catch(e){}
  try{ hunts=(S.phenoHunts||[]).filter(h=>h.active).length; }catch(e){}
  let rev=0,cust=0,rating='-';
  try{ rev=num(S.ty.fin.rev,0); const st=S.ty.cust.stats; cust=int(st.cust,0); if(st.satN>0) rating=Math.round(st.sat/st.satN)+'%'; }catch(e){}
  let expSoon=0;
  try{ const act=(S.mn&&S.mn.active)||{}; Object.keys(act).forEach(id=>{ const a=act[id]; const left=int(a.days,0)-(int(S.day,1)-int(a.startDay,1)); if(left>=0&&left<=2) expSoon++; }); }catch(e){}
  let p0=0;
  try{ p0=int(S.project0.points,0); }catch(e){}
  const mods=[
    {ico:'grow',title:'ACTIVE GROW',go:'grow',cta:'VIEW ROOM',
     metrics:'<span class="ge-num">'+nPlants+'/'+slots+'</span><span>PLANTS'+(nPlants?' &middot; '+nextAct:'')+'</span>'+HM_envPill()},
    {ico:'dispensary',title:'DISPENSARY',go:'dispensary',cta:'OPEN DISPENSARY',
     metrics:'<span class="ge-num">'+fmt$(rev)+'</span><span>TODAY &middot; '+cust+' CUSTOMERS &middot; RATING '+rating+'</span>'},
    {ico:'genetics',title:'GENETICS',go:'genetics',cta:'OPEN VAULT',
     metrics:'<span class="ge-num">'+unlocked+'/'+total+'</span><span>UNLOCKED &middot; '+keepers+' KEEPERS &middot; '+hunts+' HUNTS</span>'},
    {ico:'missions',title:'MISSIONS',go:'missions',cta:'VIEW MISSIONS',
     metrics:'<span class="ge-num">'+openMissions+'</span><span>ACTIVE'+(expSoon>0?' &middot; <span class="ge-pill ge-pill-warning">EXPIRING SOON</span>':'')+'</span>'},
    {ico:'project0',title:'PROJECT 0',go:'project0',cta:'ENTER VAULT',
     metrics:'<span class="ge-num">'+p0+'</span><span>PRESERVATION SCORE</span>'}
  ];
  let h='<div class="ge-menu-modules">';
  mods.forEach(m=>{
    const glock=m.go==='genetics'&&int(S.level,1)<3; /* P1.5: hub-claim gate */
    h+='<button class="ge-card ge-card-tap ge-menu-mod ge-anim-rise'+(glock?' ge-locked':'')+'" data-go="'+m.go+'">'+
     '<span class="ge-menu-mod-head">'+icon(m.ico,'ge-ic-lg')+'<span class="ge-menu-mod-title ge-label">'+m.title+'</span>'+(glock?icon('lock','ge-ic-sm'):'')+'</span>'+
     '<span class="ge-menu-mod-metrics">'+m.metrics+'</span>'+
     '<span class="ge-menu-mod-cta">'+(glock?'LOCKED \u2014 REACH LEVEL 3':m.cta)+'</span></button>';
  });
  return h+'</div>';
}
const MS_SECTIONS=[
 {id:'active',label:'ACTIVE',icon:'missions'},
 {id:'daily',label:'DAILY',icon:'clock'},
 {id:'weekly',label:'WEEKLY',icon:'calendar'},
 {id:'story',label:'STORY',icon:'scroll'},
 {id:'project0',label:'PROJECT 0',icon:'project0'}
];
const MS_STORY_CATS=['Tutorial','Grow Challenges','Strain Trials','Quality Challenges',
 'Yield Challenges','Breeding','Speed Runs','Hard Mode'];
const MS_EMPTY={
 active:{t:'No missions in progress',p:'Start a contract from DAILY, WEEKLY or STORY — or finish what you began.'},
 daily:{t:'No daily contracts',p:'Short-burn timed missions (1\u20132 days) appear here when available.'},
 weekly:{t:'No weekly operations',p:'Longer timed missions (3+ days) appear here when available.'},
 story:{t:'No story missions',p:'The campaign arc lives here.'},
 project0:{t:'No Project 0 missions',p:'Preservation-first trials appear here.'}
};
function MS_days(m){ const d=parseInt(m&&m.days,10); return isFinite(d)?d:0; }
function MS_inSection(m,sec,done,started){
  if(sec==='active') return !done&&started;
  if(sec==='daily') return !!m.timed&&MS_days(m)>=1&&MS_days(m)<=2;
  if(sec==='weekly') return !!m.timed&&MS_days(m)>=3;
  if(sec==='project0') return m.cat==='Project 0';
  return MS_STORY_CATS.indexOf(m.cat)>=0;
}
function MS_diffBadge(m){
  const rw=m.reward||{};
  const cash=num(rw.cash,0);
  let label='EASY', cls='ge-pill-optimal';
  if(m.timed||cash>=1500||num(rw.p0,0)>=6||num(rw.rep,0)>=50){ label='HARD'; cls='ge-pill-critical'; }
  else if(cash>=400||num(rw.p0,0)>=3||num(rw.xp,0)>=200){ label='MEDIUM'; cls='ge-pill-warning'; }
  return '<span class="ge-pill '+cls+' ms-diff">'+label+'</span>';
}
function MS_statePill(done,started){
  if(done) return '<span class="ge-pill ge-pill-optimal">'+icon('check','ge-ic-sm')+'COMPLETE</span>';
  if(started) return '<span class="ge-pill ge-pill-watch">IN PROGRESS</span>';
  return '<span class="ge-pill ge-pill-neutral">AVAILABLE</span>';
}
function MS_rewardHTML(m){
  const rw=m.reward||{};
  const bits=[
    rw.cash?fmt$(Math.round(rw.cash*DIFFS[S.difficulty].missionReward)):'',
    rw.rep?'+'+rw.rep+' rep':'',
    rw.xp?'+'+rw.xp+' XP':'',
    rw.p0?'+'+rw.p0+' P0':'',
    (rw.gen||[]).length?icon('dna','ge-ic-sm')+' genetics':''
  ].filter(Boolean).join(' \u2022 ');
  return bits?'<p class="ms-reward">'+icon('trophy','ge-ic-sm')+'<span>REWARD \u2014 '+bits+'</span></p>':'';
}
function MS_objHTML(m,pr){
  const done=pr.cur>=pr.target;
  const cur=Math.min(pr.cur,pr.target);
  /* One compact objective row carrying the mission's real description plus
     live progress. Never renders one row per unit (a 50k/1M target would
     create tens of thousands of meaningless "Objective N of M" rows). */
  const lis='<li class="ms-obj'+(done?' is-done':'')+'">'+
   '<span class="ms-check">'+icon(done?'check':'clock','ge-ic-sm')+'</span>'+
   '<span class="ms-objt">'+esc(m.desc)+'</span>'+
   '<b class="ge-num">'+cur+'/'+pr.target+'</b></li>';
  return '<ul class="ms-objs">'+lis+'</ul>';
}
function MS_cardHTML(m,cat,pr,done,started){
  return '<div class="ge-card ge-mission'+(done?' is-done':'')+'">'+
   '<div class="ms-top"><span class="ms-cat">'+esc(cat)+'</span>'+MS_statePill(done,started)+MS_diffBadge(m)+'</div>'+
   '<h3 class="ms-title">'+(done?icon('check','ge-ic-sm'):'')+esc(m.name)+'</h3>'+
   MN_timedHTML(m)+
   MS_objHTML(m,pr)+
   '<div class="ge-progress-meta"><span>'+icon('level','ge-ic-sm')+'PROGRESS</span><b class="ge-num">'+Math.min(pr.cur,pr.target)+'/'+pr.target+'</b></div>'+
   '<div class="ge-progress'+(done?' ge-progress-ok':'')+'"><i style="width:'+clamp(pr.cur/pr.target*100,0,100)+'%"></i></div>'+
   MS_rewardHTML(m)+
  '</div>';
}
function MS_stripEmoji(s){
  try{
    return String(s==null?'':s).replace(/^(\p{Extended_Pictographic}|\uFE0F|\u200D|[\u00A9\u00AE\u2600-\u27BF\u2B00-\u2BFF]|\s)+/u,'').trim();
  }catch(e){ return String(s==null?'':s); }
}
const MS_ACH_ICONS={
 'x-firstharvest':'grow','x-greenthumb':'leaf','x-geneticfreak':'dna','x-masterbreeder':'flask',
 'x-perfectgrow':'star','x-millionaire':'cash','x-strain100':'grow','x-empirebuilder':'empire',
 'x-p0200':'project0','x-p0pillars':'project0','x-firstpound':'box','x-100plants':'grow',
 'x-1000plants':'grow','x-30club':'star','x-perfectenv':'temp','x-10m':'cash','x-geneticmaster':'dna'
};
function MS_achIcon(id){ return MS_ACH_ICONS[id]||'trophy'; }
function MS_achGold(id){ return id==='x-perfectgrow'||id==='x-30club'; }
function MS_placeBadge(p){
  const t=p===1?'1ST':p===2?'2ND':'3RD';
  const cls=p===1?'ge-badge-legendary':p===2?'ge-badge':'ge-badge-elite';
  return '<span class="ge-badge '+cls+'">'+t+'</span>';
}
function PF_pill(kind,icoName,text){
  return '<span class="ge-pill ge-pill-'+kind+'">'+icon(icoName,'ge-ic-sm')+text+'</span>';
}
function PF_kv(label,value){
  return '<div class="ge-datarow"><span>'+label+'</span><b>'+value+'</b></div>';
}
function PF_tile(icoHtml,label,value,sub){
  return '<div class="ge-metric-tile"><div class="ge-metric-value ge-num">'+value+'</div>'+
   '<div class="ge-metric-label">'+icoHtml+label+'</div>'+
   (sub?'<div class="ge-metric-sub">'+sub+'</div>':'')+'</div>';
}
function P0V_scoreRing(){
  const lvls=P0V_trackLevels(), pct=clamp(lvls/40*100,0,100);
  return '<div class="ge-ring ge-ring-gold"><svg viewBox="0 0 36 36">'+
   '<circle class="ge-ring-track" cx="18" cy="18" r="15.9155"/>'+
   '<circle class="ge-ring-val" cx="18" cy="18" r="15.9155" stroke-dasharray="'+pct.toFixed(0)+' 100"/>'+
   '</svg><div class="ge-ring-label">'+lvls+'<small>LEVELS</small></div></div>';
}
function P0V_trackLevels(){
  return P0_TRACKS.reduce((a,tr)=>a+int(p0Level(tr.id),0),0);
}
function P0V_metricsHTML(){
  const arch=Array.isArray(S.phenoArchive)?S.phenoArchive:[];
  const rare=arch.filter(a=>a.rarity==='elite'||a.rarity==='legendary').length;
  const historic={};
  arch.forEach(a=>{ if(a.strainName) historic[a.strainName]=1; });
  const legacyRuns=(S.ex&&S.ex.legacy)?int(S.ex.legacy.runs,0):0;
  const metrics=[
    {v:int(S.project0.points,0), l:'PRESERVATION SCORE', ic:'project0', gold:true},
    {v:arch.length, l:'ARCHIVED GENETICS', ic:'box'},
    {v:rare, l:'RARE TRAITS', ic:'star'},
    {v:Object.keys(historic).length, l:'HISTORIC LINES', ic:'scroll'},
    {v:(S.customStrains||[]).length, l:'STABILIZED LINES', ic:'dna'},
    {v:legacyRuns, l:'LEGACY PROJECTS', ic:'crown-gold'}
  ];
  return metrics.map(m=>
   '<div class="ge-metric-tile ge-p0-metric'+(m.gold?' ge-p0-metric-gold':'')+'">'+
    '<div class="ge-p0-metric-ic">'+icon(m.ic,'ge-ic-lg')+'</div>'+
    '<div class="ge-metric-value ge-num">'+m.v+'</div>'+
    '<div class="ge-metric-label">'+m.l+'</div>'+
   '</div>').join('');
}
function P0V_tracksHTML(){
  return P0_TRACKS.map(tr=>{
    const pts=S.project0.tracks[tr.id]||0, lvl=p0Level(tr.id);
    const nextTh=P0_LEVEL_PTS[Math.min(lvl+1,P0_LEVEL_PTS.length-1)];
    const pct=lvl>=5?100:clamp(pts/nextTh*100,0,100);
    const maxed=lvl>=5;
    return '<div class="ge-card ge-card-flat ge-p0-track ge-anim-rise">'+
     '<div class="ge-card-head"><h3>'+icon(tr.ico,'ge-ic-md')+esc(tr.name)+'</h3>'+
      '<span class="ge-pill '+(maxed?'ge-pill-gold':'ge-pill-neutral')+'">LV '+lvl+'</span></div>'+
     '<div class="ge-progress'+(maxed?' ge-progress-gold':'')+'"><i style="width:'+pct+'%"></i></div>'+
     '<div class="ge-progress-meta"><span class="ge-num">'+pts+' pts</span>'+
      '<b>'+(lvl<5?nextTh+' for LV '+(lvl+1):'MAXED')+'</b></div>'+
    '</div>';
  }).join('');
}
function P0V_rewardsHTML(){
  return P0_TRACKS.map(tr=>{
    const lvl=p0Level(tr.id), rw=P0_REWARDS[tr.id]||{};
    return '<div class="ge-p0-rewardrow">'+
     '<div class="ge-p0-reward-track">'+icon(tr.ico,'ge-ic-md')+'<span>'+esc(tr.name)+'</span></div>'+
     '<div class="ge-p0-reward-cells">'+
      P0V_rewardCell(rw[3],lvl>=3,3)+
      P0V_rewardCell(rw[5],lvl>=5,5)+
     '</div></div>';
  }).join('');
}
function P0V_rewardCell(rw,earned,atLvl){
  const desc=rw?P0V_rewardDesc(rw):'—';
  return '<div class="ge-p0-rewardcell'+(earned?' is-earned':'')+'">'+
   '<div class="ge-label ge-muted">LV '+atLvl+'</div>'+
   '<div class="ge-p0-rewarddesc">'+desc+'</div>'+
   '<span class="ge-pill '+(earned?'ge-pill-gold':'ge-pill-neutral')+'">'+
    (earned?icon('check','ge-ic-sm')+'EARNED':icon('lock','ge-ic-sm')+'LOCKED')+'</span>'+
  '</div>';
}
function P0V_rewardDesc(rw){
  if(rw.cash) return '<span class="ge-num ge-green">'+fmt$(rw.cash)+'</span> CASH';
  if(rw.rep)  return '<span class="ge-num">+'+rw.rep+'</span> REP';
  if(rw.xp)   return '<span class="ge-num">+'+rw.xp+'</span> XP';
  if(rw.gen){
    const nm=rw.gen.map(g=>{ try{ const st=getStrain(g); return st?esc(st.name):esc(g); }catch(e){ return esc(g); } }).join(', ');
    return icon('dna','ge-ic-sm')+' UNLOCK: '+nm;
  }
  if(rw.title) return icon('trophy','ge-ic-sm')+' TITLE: '+P0V_titleText(rw.title);
  return '—';
}
function P0V_titleTag(t){
  const m=P0V_titleSplit(t);
  return '<span class="ge-pill ge-p0-title-pill '+(m.gold?'ge-pill-gold':'ge-pill-neutral')+'">'+
   icon(m.ic,'ge-ic-sm')+esc(m.text)+'</span>';
}
function P0V_titleText(t){ return P0V_titleSplit(t).text; }
function P0V_titleSplit(t){
  const s=String(t||'');
  const table=[
    ['🧬','dna',false],['💪','trophy',false],['🏦','keepers',false],
    ['🌱','grow',false],['❤️','users',false],['❤','users',false],
    ['🕊️','project0',true],['🕊','project0',true],
    ['💎','star',true],['📚','scroll',false]
  ];
  for(let i=0;i<table.length;i++){
    if(s.indexOf(table[i][0])===0)
      return {ic:table[i][1],gold:table[i][2],text:s.slice(table[i][0].length).trim()};
  }
  return {ic:'trophy',gold:false,text:s};
}
/* ============================================================================
   P3-W5 — PEOPLE + BUSINESS
   ----------------------------------------------------------------------------
   Wave 5 extends the two existing staff systems and the business sim. Nothing
   is forked, replaced, or redesigned:

   PART A — EMPLOYEES. The 8 wave-5 roles map onto the existing EX_ROLES named-
   staff system (the "11 employee roles" with FIRE/REPLACE + confirm flow):
     Grow Technician      -> NEW role 'growtech'
     Irrigation Technician-> existing 'irritech' (IRRIGATION TECH)
     Trimmer              -> existing 'trimmer' (TRIMMER)
     Processing Technician-> NEW role 'processtech'
     Breeder              -> existing 'breeding' (BREEDING SPECIALIST)
     Dispensary Worker    -> NEW role 'dispworker'
     Manager              -> existing 'manager' (MANAGER)
     Master Grower        -> NEW role 'mastergrower'
   All eight get wave-5 mechanics: experience tenure (daysWorked, grows every
   day on payroll, veteran XP every 10 days -> level-ups via the existing
   EX_empLevelCheck, which also raises salary — better employees cost more),
   an efficiency factor (skill + tenure), and a concrete specialty with real
   day-tick effects. Hiring/firing/payroll are untouched: EX_hireEmp /
   EX_fireEmp (confirm-first, no severance, no refunds) / EX_payrollTick.
   Specialties are passive stat effects only — employees NEVER auto-sell,
   auto-breed, or auto-keep. No parallel payroll, no parallel registries.

   PART B — DISPENSARY TASTE. The 8 existing TY_CUST_TYPES each gain a taste
   archetype (budget / potency / terpene / indica / sativa / collector /
   medical / connoisseur). Customer selection scoring (P3W5_custScore) is the
   exact legacy formula plus a preference bonus, so a 24%-THC jar with
   exceptional terps/quality beats a 32%-THC jar for terpene hunters and
   connoisseurs, while potency hunters still chase THC. SELECTION ONLY — prices
   (pricePerOz / TY_prodPrice / WX_sellMult) are never touched. All products
   (flower, premium, pre-rolls, concentrates, edibles, seed/clone packs) keep
   flowing through the existing sale paths.

   PART C — MARKET CONDITIONS. 7 rotating conditions (FLOWER SURPLUS,
   CONCENTRATE SHORTAGE, INDICA DEMAND, TERPENE CRAZE, RARE GENETICS MARKET,
   PRE-ROLL DEMAND, LOCAL COMPETITION) applied as one combined, hard-banded
   multiplier inside WX_sellMult (the existing sale path): each condition
   0.90-1.25, combined 0.85-1.60. They tick down daily (P3W5_condTick, driven
   by the existing EX_tick day tick), expire, announce via the existing
   TY_addNews feed, and never persist. Informational opportunities only —
   no forced sales, nothing punishing, retention-rule clean.

   PART D — REP CATEGORIES. S.reputation stays the single headline number for
   strain unlocks/missions (backward compatible, untouched). Alongside it,
   S.ty.rep gains three new categories next to the existing five:
     grower  — elite harvests (Q85+ -> +2, Q95+ -> +3)
     breeder — new customs (+1, +2 at 85+ stability)
     p0      — preservation tier-ups (+tier, once per genetic per tier)
   ('business' already exists; dispensary days add +1 per $1500 revenue, cap
   +4/day.) Gains are DIRECT to the category — deliberately not routed through
   TY_gainRep/gainRep, so the headline stays authoritative and each category is
   attributable to exactly the action that earned it. Each category unlocks one
   concrete, modest mechanic at a fixed threshold (see P3W5_UNLOCKS).
   ============================================================================ */

/* ---------------- state ---------------- */
function P3W5_migrate(){
  try{
    if(typeof S==='undefined'||!S) return;
    if(!S.p3w5||typeof S.p3w5!=='object') S.p3w5={};
    if(!Array.isArray(S.p3w5.conds)) S.p3w5.conds=[];
    S.p3w5.conds=S.p3w5.conds.filter(function(c){ return c&&c.id&&P3W5_CONDITIONS.some(function(d){ return d.id===c.id; }); })
      .map(function(c){ return {id:String(c.id), days:Math.max(1,int(c.days,3))}; });
    if(!S.p3w5.unlocks||typeof S.p3w5.unlocks!=='object') S.p3w5.unlocks={};
    /* rep categories: append-only alongside the existing five; legacy saves backfill 0 */
    if(S.ty&&S.ty.rep&&typeof S.ty.rep==='object'){
      ['grower','breeder','p0'].forEach(function(k){
        if(S.ty.rep[k]===undefined||S.ty.rep[k]===null) S.ty.rep[k]=0;
        else S.ty.rep[k]=Math.max(0,num(S.ty.rep[k],0));
      });
    }
  }catch(e){}
}
/* new rep categories join the existing TY_REP_CATS list (rendered by TY_repProfileHTML as-is) */
try{
  if(typeof TY_REP_CATS!=='undefined'&&Array.isArray(TY_REP_CATS)){
    [['grower','GROWER REP','star','Elite harvests. Master growers watch this.'],
     ['breeder','BREEDER REP','genetics','Stable crosses and named genetics.'],
     ['p0','PROJECT 0 REP','preserve','Preservation work. The vault remembers.']
    ].forEach(function(a){
      if(!TY_REP_CATS.some(function(c){ return c&&c.id===a[0]; }))
        TY_REP_CATS.push({id:a[0],name:a[1],ico:a[2],desc:a[3]});
    });
  }
}catch(e){}

/* ---------------- rep categories ----------------
   Direct-to-category gains: the headline S.reputation is never inflated here,
   and categories stay attributable to exactly the action that earned them. */
function P3W5_gainCat(cat,n){
  try{
    if(!S.ty||!S.ty.rep) return;
    n=num(n,0); if(!(n>0)) return;
    if(!(cat in S.ty.rep)) return;
    S.ty.rep[cat]=Math.max(0,num(S.ty.rep[cat],0)+n);
  }catch(e){}
}
function P3W5_repCat(id){ try{ return Math.max(0,num(S.ty&&S.ty.rep?S.ty.rep[id]:0,0)); }catch(e){ return 0; } }
/* Category gain rates — modest by design, documented here:
   grower:   elite harvest Q85+ -> +2, Q95+ -> +3
   breeder:  new custom cross -> +1 (+2 at 85+ stability)
   business: dispensary day -> +1 per $1500 revenue, cap +4/day
   p0:       preservation tier-up -> +tier (1..4), once per genetic per tier, ever */
function P3W5_onHarvestRep(qq){ try{ if(qq>=85) P3W5_gainCat('grower', qq>=95?3:2); }catch(e){} }
function P3W5_onCrossBred(cross){ try{ P3W5_gainCat('breeder', num(cross&&cross.stab,0)>=85?2:1); }catch(e){} }
function P3W5_onDispensarySales(rev,sales){ try{ if(num(rev,0)>0) P3W5_gainCat('business', clamp(Math.round(num(rev,0)/1500),1,4)); }catch(e){} }
function P3W5_onP0Tier(t){ try{ P3W5_gainCat('p0', clamp(int(t,1),1,4)); }catch(e){} }

/* ---------------- category unlocks (concrete, modest) ---------------- */
const P3W5_UNLOCKS=[
 {id:'steady-hands',    cat:'grower',   need:40, name:'STEADY HANDS',     desc:'Plants shed +2 stress every day.'},
 {id:'stable-hands',    cat:'breeder',  need:30, name:'STABLE HANDS',     desc:'+3 stability on all new crosses.'},
 {id:'retail-draw',     cat:'business', need:40, name:'RETAIL DRAW',      desc:'+2 dispensary customers/day.'},
 {id:'archivists-trust',cat:'p0',       need:30, name:"ARCHIVIST'S TRUST",desc:'+10% Project 0 points.'}
];
function P3W5_hasUnlock(id){ try{ return !!(S.p3w5&&S.p3w5.unlocks&&S.p3w5.unlocks[id]); }catch(e){ return false; } }
function P3W5_unlocksCheck(){
  try{
    if(!S.p3w5) return;
    P3W5_UNLOCKS.forEach(function(u){
      if(S.p3w5.unlocks[u.id]) return;
      if(P3W5_repCat(u.cat)>=u.need){
        S.p3w5.unlocks[u.id]=1;
        try{ if(typeof TY_notify==='function') TY_notify(icon('trophy','ge-ic-md')+' REP UNLOCK: <b>'+esc(u.name)+'</b> — '+esc(u.desc),'good',true); }catch(e){}
      }
    });
  }catch(e){}
}
function P3W5_retailDrawBonus(){ try{ return P3W5_hasUnlock('retail-draw')?2:0; }catch(e){ return 0; } }
function P3W5_p0Mult(){ try{ return P3W5_hasUnlock('archivists-trust')?1.1:1; }catch(e){ return 1; } }
function P3W5_repUnlocksHTML(){
  try{
    let h='<div class="ge-card"><div class="ge-card-head"><h3>'+icon('trophy','ge-ic-md')+'CATEGORY UNLOCKS</h3></div>';
    P3W5_UNLOCKS.forEach(function(u){
      const v=Math.round(P3W5_repCat(u.cat)), got=P3W5_hasUnlock(u.id);
      h+='<div class="ge-datarow"><span>'+esc(u.name)+' <span class="ge-caption ge-muted">('+esc(u.cat.toUpperCase())+' '+u.need+')</span><br><span class="ge-caption ge-muted">'+esc(u.desc)+'</span></span>'+
        (got?'<span class="ge-pill ge-pill-gold">'+icon('check','ge-ic-sm')+'UNLOCKED</span>':'<b class="ge-num">'+v+' / '+u.need+'</b>')+'</div>';
    });
    h+='<p class="ge-caption ge-muted">Grower: elite harvests • Breeder: stable crosses • Business: dispensary sales • Project 0: preservation tiers.</p></div>';
    return h;
  }catch(e){ return ''; }
}

/* ---------------- employees: specialties ---------------- */
const P3W5_ROLE_SPEC={
  growtech:'Plants recover +health and shed stress each day.',
  irritech:'Waters the thirstiest plants every morning.',
  trimmer:'Processing batches finish faster.',
  processtech:'More processing capacity and output.',
  breeding:'New crosses hold slightly more stability.',
  dispworker:'Serves more customers per shift.',
  manager:'Trims costs across the empire.',
  mastergrower:'Lifts final harvest quality.'
};
function P3W5_empSpecHTML(e){
  try{
    const spec=P3W5_ROLE_SPEC[e.role];
    if(!spec) return '';
    return '<p class="ge-caption">'+icon('star','ge-ic-sm')+' '+esc(spec)+' <span class="ge-muted">• '+int(e.daysWorked,0)+' days worked</span></p>';
  }catch(err){ return ''; }
}
function P3W5_assigned(role){
  try{ return (S.ex.employees||[]).filter(function(e){ return e&&e.assigned&&e.role===role; }); }catch(e){ return []; }
}
function P3W5_efficiency(e){
  /* skill + tenure -> 0.25..2.0 deterministic specialty multiplier */
  try{ return clamp(0.5+num(e.skill,5)/40+Math.min(0.5,int(e.daysWorked,0)/60),0.25,2); }catch(e){ return 1; }
}
function P3W5_breederStab(){
  /* Breeder specialty: slight stability lift on new crosses. Bonus pool caps at
     50 -> +6 max; STABLE HANDS (Breeder Rep 30) adds +3. Hard clamp +9. */
  try{
    let b=num((typeof EX_employeeBonus==='function'?EX_employeeBonus('breeding'):0),0)*0.12;
    if(P3W5_hasUnlock('stable-hands')) b+=3;
    return clamp(b,0,9);
  }catch(e){ return 0; }
}
function P3W5_masterGrowerBonus(){
  /* Master Grower specialty: slight final-quality lift. Pool caps at 20 -> +3 max. */
  try{ return num((typeof EX_employeeBonus==='function'?EX_employeeBonus('mastergrower'):0),0)*0.15; }catch(e){ return 0; }
}
function P3W5_processBoost(){
  /* Trimmer + Processing Technician feed the existing processor bonus pool. */
  try{
    const eb=typeof EX_employeeBonus==='function'?EX_employeeBonus:function(){ return 0; };
    return num(eb('trimmer'),0)+num(eb('processtech'),0);
  }catch(e){ return 0; }
}
function P3W5_trimDays(){
  /* Trimmer specialty: batches finish 1 day sooner once trimmer presence is meaningful. */
  try{ return num((typeof EX_employeeBonus==='function'?EX_employeeBonus('trimmer'):0),0)>=8?1:0; }catch(e){ return 0; }
}
/* Daily crew work. Called from EX_tick (the existing day tick) — passive stat
   effects only. Employees NEVER sell, breed, or keep: no sale calls, no cross
   creation, no keeper writes anywhere in this function or its callees. */
function P3W5_dayTick(){
  try{
    if(!S.ex||!Array.isArray(S.ex.employees)) return;
    S.ex.employees.forEach(function(e){
      e.daysWorked=int(e.daysWorked,0)+1; /* experience grows with days worked */
      if(int(e.daysWorked,0)%10===0){ e.xp=num(e.xp,0)+40; EX_empLevelCheck(e,false); } /* veteran tenure bonus -> level-ups raise salary: better costs more */
    });
    /* Irrigation Technician waters the thirstiest plants (cap 95 — never overwater) */
    const techs=P3W5_assigned('irritech');
    if(techs.length&&Array.isArray(S.plants)&&S.plants.length){
      const thirsty=S.plants.filter(function(p){ return !p.dead&&num(p.water,100)<70; })
        .sort(function(a,b){ return num(a.water,0)-num(b.water,0); });
      techs.forEach(function(t){
        const eff=P3W5_efficiency(t), n=2+Math.floor(eff);
        for(let i=0;i<n&&i<thirsty.length;i++){ const p=thirsty[i]; p.water=clamp(num(p.water,0)+12*eff,0,95); }
      });
    }
    /* Grow Technician: health regen + stress relief */
    const gts=P3W5_assigned('growtech');
    if(gts.length&&Array.isArray(S.plants)){
      gts.forEach(function(t){
        const eff=P3W5_efficiency(t);
        S.plants.forEach(function(p){ if(p.dead) return; p.health=clamp(num(p.health,0)+2*eff,0,100); p.stress=clamp(num(p.stress,0)-3*eff,0,100); });
      });
    }
    /* STEADY HANDS (Grower Rep 40): veteran growers keep the room calm */
    if(P3W5_hasUnlock('steady-hands')&&Array.isArray(S.plants))
      S.plants.forEach(function(p){ if(!p.dead) p.stress=clamp(num(p.stress,0)-2,0,100); });
    /* market conditions tick down daily, expire, rotate */
    P3W5_condTick();
    P3W5_unlocksCheck();
  }catch(e){}
}

/* ---------------- dispensary taste preferences ----------------
   Selection only — prices are never touched here. */
function P3W5_custPref(t){
  try{
    let pref=(t&&t.pref)||'balanced';
    /* TERPENE CRAZE: the market is flavor-mad — a quarter of foot traffic hunts terps */
    if(pref!=='terpene'&&P3W5_condActive('terpene-craze')&&Math.random()<0.25) pref='terpene';
    return pref;
  }catch(e){ return (t&&t.pref)||'balanced'; }
}
function P3W5_stockEntry(s){
  /* Enrich a customer-sim stock row with the traits preference scoring needs. */
  try{
    const ref=s.ref||{};
    let terp=num(ref.terpenes,NaN), pot=num(ref.potency,NaN), bag=num(ref.bagAppeal,NaN);
    let custom=!!ref.custom, stype='hybrid';
    try{
      const st=typeof getStrain==='function'?getStrain(s.strainId):null;
      if(st){ stype=st.type||'hybrid'; if(st.custom) custom=true;
        if(isNaN(terp)) terp=num(st.terp,70); if(isNaN(pot)) pot=num(st.pot,70); if(isNaN(bag)) bag=num(st.bagAppeal,70); }
    }catch(e){}
    s.terpenes=isNaN(terp)?70:terp; s.potency=isNaN(pot)?70:pot; s.bagAppeal=isNaN(bag)?70:bag;
    s.stype=stype; s.custom=custom;
  }catch(e){}
  return s;
}
function P3W5_prefScore(pref,s){
  /* Trait-based valuation: WHO the buyer is changes what they reach for.
     A 24%-THC jar with exceptional terps/quality beats a 32%-THC jar for
     terpene hunters and connoisseurs; potency hunters still chase THC. */
  try{
    const terp=num(s.terpenes,70), pot=num(s.potency,70), q=num(s.quality,70), bag=num(s.bagAppeal,70);
    switch(pref){
      case 'budget':      return clamp((1-num(s.price,0)/1000)*30,0,30);
      case 'potency':     return pot*0.5;
      case 'terpene':     return terp*0.6+q*0.2-pot*0.1;
      case 'indica':      return (s.stype==='indica'?25:0)+q*0.2;
      case 'sativa':      return (s.stype==='sativa'?25:0)+q*0.2;
      case 'collector':   return (s.custom?40:0)+(q>=90?20:0);
      case 'medical':     return (s.stype==='indica'?15:0)+q*0.35;
      case 'connoisseur': return terp*0.45+q*0.35+bag*0.2-pot*0.05;
      default:            return q*0.1;
    }
  }catch(e){ return 0; }
}
function P3W5_custScore(c,s){
  /* Exact legacy score + preference bonus. Prices are never touched here. */
  try{
    const base=(s.strainId===c.favStrain?30:0)+(s.ptype===c.prefPtype?20:0)+s.quality-s.price*c.priceSens*0.05;
    return base+P3W5_prefScore(c.pref,s);
  }catch(e){ return 0; }
}

/* ---------------- dynamic market conditions ---------------- */
const P3W5_CONDITIONS=[
 {id:'flower-surplus', name:'FLOWER SURPLUS', desc:'Flower is flooding the market. Hold it, or process it into something scarce.', days:[3,6],
  mult:function(si,it){ const pt=P3W5_ptype(it); return (pt==='flower'||pt==='premium'||pt==='budget')?0.92:1; }},
 {id:'conc-shortage', name:'CONCENTRATE SHORTAGE', desc:'Extract shelves are bare. Time to run the lab.', days:[3,5],
  mult:function(si,it){ return P3W5_ptype(it)==='conc'?1.22:1; }},
 {id:'indica-demand', name:'INDICA DEMAND', desc:'The city wants heavy indicas. Couch-lock is currency.', days:[3,6],
  mult:function(si,it){ return P3W5_stype(si)==='indica'?1.15:1; }},
 {id:'terpene-craze', name:'TERPENE CRAZE', desc:'Flavor chasers pay for loud terps. Terpene hunters flood the shop.', days:[3,5],
  mult:function(si,it){ return num(it.terpenes,0)>=75?1.15:1; }},
 {id:'rare-genetics', name:'RARE GENETICS MARKET', desc:'Collectors hunt one-of-one genetics. Save your elite flower.', days:[4,6],
  mult:function(si,it){ return (it.custom||num(it.quality,0)>=90)?1.20:1; }},
 {id:'preroll-demand', name:'PRE-ROLL DEMAND', desc:'Convenience is king this week. Roll them while they are hot.', days:[3,5],
  mult:function(si,it){ return P3W5_ptype(it)==='preroll'?1.20:1; }},
 {id:'local-competition', name:'LOCAL COMPETITION', desc:'A rival shop undercut the block. Prices dip — holding is free.', days:[2,4],
  mult:function(){ return 0.93; }}
];
function P3W5_ptype(it){ try{ return (typeof TY_ptypeOf==='function'?TY_ptypeOf(it):'flower'); }catch(e){ return 'flower'; } }
function P3W5_stype(si){ try{ const st=typeof getStrain==='function'?getStrain(si):null; return st?st.type:'hybrid'; }catch(e){ return 'hybrid'; } }
function P3W5_condActive(id){ try{ return !!(S.p3w5&&S.p3w5.conds&&S.p3w5.conds.some(function(c){ return c.id===id; })); }catch(e){ return false; } }
function P3W5_condTick(){
  /* Daily: conditions expire (never permanent), quiet days may roll a new one
     (at most 2 active). Announcements go through the existing news feed.
     Informational opportunities only — no forced sales, nothing punishing. */
  try{
    if(!S.p3w5) return;
    S.p3w5.conds.forEach(function(c){ c.days=int(c.days,1)-1; });
    const expired=S.p3w5.conds.filter(function(c){ return c.days<=0; });
    S.p3w5.conds=S.p3w5.conds.filter(function(c){ return c.days>0; });
    expired.forEach(function(c){
      const d=P3W5_CONDITIONS.find(function(x){ return x.id===c.id; });
      if(d&&typeof TY_addNews==='function') TY_addNews('cash','<b>'+esc(d.name)+'</b> cooled off.');
    });
    if(S.p3w5.conds.length<2&&Math.random()<0.35){
      const avail=P3W5_CONDITIONS.filter(function(d){ return !P3W5_condActive(d.id); });
      if(avail.length){
        const d=pick(avail);
        S.p3w5.conds.push({id:d.id,days:rndi(d.days[0],d.days[1])});
        if(typeof TY_addNews==='function') TY_addNews('chart','<b>MARKET:</b> '+esc(d.name)+' — '+esc(d.desc));
        try{ if(typeof TY_notify==='function') TY_notify(icon('chart','ge-ic-md')+' Market condition: <b>'+esc(d.name)+'</b>','info',true); }catch(e){}
      }
    }
  }catch(e){}
}
function P3W5_marketMult(strainId,item){
  /* Combined condition factor, hard-banded: each condition 0.90-1.25,
     combined 0.85-1.60. Applied inside WX_sellMult (the existing sale path),
     so flower, products, and contracts all share the one controlled band. */
  try{
    if(!S.p3w5||!S.p3w5.conds||!S.p3w5.conds.length) return 1;
    let m=1;
    S.p3w5.conds.forEach(function(c){
      const d=P3W5_CONDITIONS.find(function(x){ return x.id===c.id; });
      if(d&&typeof d.mult==='function'){ const f=num(d.mult(strainId,item||{}),1); m*=clamp(f,0.9,1.25); }
    });
    return clamp(m,0.85,1.6);
  }catch(e){ return 1; }
}
function P3W5_condsHTML(){
  try{
    if(!S.p3w5||!S.p3w5.conds||!S.p3w5.conds.length) return '';
    let h='<div class="ge-card"><div class="ge-card-head"><h3>'+icon('chart','ge-ic-md')+'MARKET CONDITIONS</h3></div>';
    S.p3w5.conds.forEach(function(c){
      const d=P3W5_CONDITIONS.find(function(x){ return x.id===c.id; });
      if(!d) return;
      h+='<div class="ge-datarow"><span>'+esc(d.name)+'<br><span class="ge-caption ge-muted">'+esc(d.desc)+'</span></span>'+
         '<span class="ge-pill ge-pill-watch">'+int(c.days,0)+'d left</span></div>';
    });
    h+='<p class="ge-caption ge-muted">Opportunities, not orders — holding is always free.</p></div>';
    return h;
  }catch(e){ return ''; }
}

/* ============================================================
   P3 WAVE 6 — EMPIRE DASHBOARD + BIG PURCHASE GOALS + MAJOR MILESTONES + ENDGAME COHERENCE
   ----------------------------------------------------------------------------
   PART C — MAJOR MILESTONES. 12 milestones, each fires exactly once.
   Ledger: S.msDone = {id:{day}} (save-safe, in S; backfilled silently for
   legacy saves in normalizeState via MS_backfill). Ceremony: restrained —
   one toast + one PR_haptic('achievement') tick. Industrial, never casino.
   No cash, no XP, no rewards granted — milestones are informational
   (retention rule: no fake urgency).
   Trigger points are thin additive hooks at the natural events
   (harvest finalize, keeper ceremony, elite detail, createCross/selfCross,
   P0T_verifiedCeremony, facility purchase) plus MS_sweep() at day tick as
   the backstop for the monotone money milestones.
   ----------------------------------------------------------------------------
   PART B — BIG PURCHASE GOALS. P14_wave6() extends the Almost There panel
   (WHAT I WANT / WHAT I NEED / HOW CLOSE AM I) with the Wave 4/5 additions:
   next facility tier (6-8 included), next automation tier (8-11 included,
   binding gate drives HOW CLOSE), next keeper-vault expansion (real cost +
   real facility gate), Wave-5 crew roles in the hiring pool (real signing
   costs). Prices are SURFACED, never changed — economy frozen.
   ----------------------------------------------------------------------------
   PART A — EMPIRE DASHBOARD. RENDER.dashboard (JS-injected screen, AM_init
   pattern — no index.html change). Progressive complexity: the snapshot +
   milestones always render; every other section gates on its system being
   in use (no employees -> no crew card; no processing -> no batch card).
   Reuses Almost-There visual language (.ge-almost-row/.ge-almost-lbl,
   .ge-progress) and existing card/datarow/metric classes. Every card links
   back to its system (data-ex-go) — the dashboard IS the visible endgame loop.
   ----------------------------------------------------------------------------
   PART D — ENDGAME COHERENCE. Terminal states get explicit cross-links
   instead of dead ends:
     - LEGACY place of honor -> codex completion / breed the line forward
     - maxed keeper vault -> Project 0 LEGACY push
     - maxed automation tree -> breeding frontier
     - maxed facility (Cultivation Empire) -> Hall of Records (optimization)
     - TY_finHTML (DAILY LEDGER) was defined but never rendered anywhere;
       the dashboard FINANCES section renders it inline when unlocked.
   ============================================================ */

/* ---------------- PART C: milestone engine ---------------- */
function MS_ensure(){
  try{
    if(!S||typeof S!=='object') return;
    if(!S.msDone||typeof S.msDone!=='object') S.msDone={};
  }catch(e){}
}
function MS_p2(cur,target){ return {cur:num(cur,0),target:Math.max(1,num(target,1))}; }
function MS_hasF2(){
  try{
    return (S.customStrains||[]).some(s=>{
      const m=String(s.genLabel||s.generation||'').match(/^(F|BX)(\d+)$/i);
      return !!m&&(m[1].toUpperCase()==='BX'||int(m[2],0)>=2);
    });
  }catch(e){ return false; }
}
function MS_hasStabilized(){
  try{
    const stab=(S.ty&&S.ty.stab)||{};
    return (S.customStrains||[]).some(s=>num(s.stabilityPct,0)>=90||num(stab[s.id],0)>=90);
  }catch(e){ return false; }
}
function MS_verifiedCount(){
  try{
    return Object.keys(S.p0vault||{}).filter(gid=>{ const e=S.p0vault[gid]; return e&&num(e.tier,0)>=2; }).length;
  }catch(e){ return 0; }
}
/* The 12 major milestones, in progression order. prog() reads live state;
   trig is the honest in-game path (used by the "you're close" return hook). */
const MS_DEFS=[
 {id:'first-harvest',name:'FIRST HARVEST',ico:'harvest',sub:'Bring a plant home.',trig:'Harvest any plant',
  prog:function(){ return MS_p2(S.stats&&S.stats.harvests,1); }},
 {id:'first-keeper',name:'FIRST KEEPER',ico:'keepers',sub:'Crown a phenotype.',trig:'Mark a keeper in the vault',
  prog:function(){ return MS_p2(Math.max(num(S.stats&&S.stats.keepersFound,0),(S.keepers||[]).length),1); }},
 {id:'first-10k',name:'FIRST $10,000',ico:'cash',sub:'$10,000 lifetime revenue.',trig:'Sell product at the dispensary',
  prog:function(){ return MS_p2(S.stats&&S.stats.lifetimeRevenue,10000); }},
 {id:'first-elite',name:'FIRST ELITE EXPRESSION',ico:'dna',sub:'Find an elite or legendary phenotype.',trig:'Run pheno hunts',
  prog:function(){ return MS_p2(num(S.stats&&S.stats.eliteFound,0)+num(S.stats&&S.stats.legendaryFound,0),1); }},
 {id:'first-cross',name:'FIRST CROSS',ico:'breeding',sub:'Breed your first custom genetic.',trig:'Breed in the breeding lab',
  prog:function(){ return MS_p2(S.stats&&S.stats.crosses,1); }},
 {id:'first-f2',name:'FIRST F2',ico:'genetics',sub:'Breed a second-generation line.',trig:'Cross two customs (F2) or backcross (BX)',
  prog:function(){ return MS_p2(MS_hasF2()?1:0,1); }},
 {id:'first-stabilized',name:'FIRST STABILIZED LINE',ico:'check',sub:'Hold a line at 90%+ stability.',trig:'Stabilize a custom line through selection',
  prog:function(){ return MS_p2(MS_hasStabilized()?1:0,1); }},
 {id:'first-p0verified',name:'FIRST PROJECT 0 VERIFIED GENETIC',ico:'project0',sub:'Verify a genetic under Project 0.',trig:'Preserve a genetic — 3 harvests to VERIFIED',
  prog:function(){ return MS_p2(MS_verifiedCount(),1); }},
 {id:'first-100k',name:'FIRST $100,000',ico:'cash',sub:'$100,000 lifetime revenue.',trig:'Sell product at the dispensary',
  prog:function(){ return MS_p2(S.stats&&S.stats.lifetimeRevenue,100000); }},
 {id:'first-warehouse',name:'FIRST WAREHOUSE',ico:'empire',sub:'Expand to the Warehouse facility.',trig:'Buy facility tier 3 — Warehouse',
  prog:function(){ return MS_p2(S.facility,3); }},
 {id:'first-1m',name:'FIRST $1,000,000',ico:'cash',sub:'$1,000,000 lifetime revenue.',trig:'Sell product at the dispensary',
  prog:function(){ return MS_p2(S.stats&&S.stats.lifetimeRevenue,1000000); }}
];
function MS_def(id){ return MS_DEFS.find(d=>d.id===id)||null; }
function MS_done(id){ try{ MS_ensure(); return !!(S.msDone&&S.msDone[id]); }catch(e){ return false; } }
function MS_met(def){
  try{
    if(!def||typeof def.prog!=='function') return false;
    const p=def.prog();
    return p&&num(p.target,0)>0&&num(p.cur,0)>=num(p.target,0);
  }catch(e){ return false; }
}
function MS_fire(id){
  try{
    MS_ensure();
    if(!id||(S.msDone&&S.msDone[id])) return false; /* exactly-once */
    const def=MS_def(id); if(!def) return false;
    S.msDone[id]={day:Math.max(1,int(S.day,1))}; /* mark BEFORE any UI can fail */
    try{ toast(icon(def.ico||'trophy','ge-ic-md')+' <b>MILESTONE — '+esc(def.name)+'</b><br><span class="ge-muted">'+esc(def.sub||'')+'</span>'); }catch(e){}
    try{ if(typeof PR_haptic==='function') PR_haptic('achievement'); }catch(e){} /* one restrained tick — never fireworks */
    try{ save(); }catch(e){}
    return true;
  }catch(e){ return false; }
}
function MS_check(id){
  try{
    if(MS_done(id)) return false;
    const def=MS_def(id);
    return (def&&MS_met(def))?MS_fire(id):false;
  }catch(e){ return false; }
}
/* backstop: monotone money milestones + save-edit consistency. Idempotent. */
function MS_sweep(){
  try{ MS_DEFS.forEach(d=>{ try{ MS_check(d.id); }catch(e){} }); }catch(e){}
}
/* legacy saves: conditions already met are marked SILENTLY (no toast, no
   haptic) so nothing fires spuriously on load. Exactly-once preserved. */
function MS_backfill(){
  try{
    MS_ensure();
    let touched=false;
    MS_DEFS.forEach(d=>{
      try{
        if(S.msDone[d.id]) return;
        if(MS_met(d)){ S.msDone[d.id]={day:1,backfilled:true}; touched=true; }
      }catch(e){}
    });
    if(touched){ try{ save(); }catch(e){} }
  }catch(e){}
}
function MS_progText(def){
  try{
    const p=def.prog(), cur=num(p.cur,0), target=num(p.target,1);
    const money=/\$/.test(def.name);
    return money?(fmt$(cur)+' / '+fmt$(target)):(Math.round(cur)+'/'+Math.round(target));
  }catch(e){ return ''; }
}
/* upcoming milestones in progression order, for dashboard + return hooks */
function MS_next(n){
  try{
    MS_ensure();
    return MS_DEFS.filter(d=>!MS_done(d.id)).slice(0,Math.max(1,int(n,3)));
  }catch(e){ return []; }
}
/* thin event wrappers — called from the natural trigger points */
function MS_onHarvest(){ try{ MS_check('first-harvest'); }catch(e){} }
function MS_onKeeper(){ try{ MS_check('first-keeper'); }catch(e){} }
function MS_onElite(){ try{ MS_check('first-elite'); }catch(e){} }
function MS_onCross(cross){
  try{ MS_check('first-cross'); }catch(e){}
  try{ MS_check('first-f2'); }catch(e){}
  try{ MS_check('first-stabilized'); }catch(e){}
}
function MS_onFacility(i){ try{ if(int(i,0)>=3) MS_check('first-warehouse'); }catch(e){} }
function MS_onP0Verified(){ try{ MS_check('first-p0verified'); }catch(e){} }

/* ---------------- PART B: big purchase goals for the Almost There panel ----------------
   Real affordability math on the Wave 4/5 additions. Prices are surfaced,
   never changed (economy frozen). Each entry: {rel,want,need,close,pct,go,tab}. */
function P14_wave6(){
  const out=[];
  try{
    const cash=num(S.cash,0);
    const push=(rel,want,need,close,pct,go,tab)=>{ out.push({rel:rel,want:want,need:need,close:close,pct:pct,go:go,tab:tab}); };
    /* 1. next facility tier (Wave-4 tiers 6-8 included) — pure cash gate */
    try{
      if(typeof FACILITIES!=='undefined'){
        const fi=clamp(int(S.facility,0),0,FACILITIES.length-1);
        if(fi<FACILITIES.length-1){
          const f=FACILITIES[fi+1], cost=num(f.cost,0), gap=Math.max(0,cost-cash), rel=cost>0?gap/cost:0;
          push(rel,'Facility: '+f.name,fmt$(cost),gap>0?(fmt$(gap)+' to go'):'affordable now',
            Math.round((1-Math.min(1,rel))*100),'empire','facilities');
        }
      }
    }catch(e){}
    /* 2. next automation tier (tiers 8-11 included) — binding gate drives HOW CLOSE */
    try{
      if(typeof AM_nextLocked==='function'&&typeof AM_SYSTEMS!=='undefined'){
        const id=AM_nextLocked();
        if(id&&AM_SYSTEMS[id]){
          const sys=AM_SYSTEMS[id], cost=num(sys.cost,0);
          let gates=[]; try{ gates=AM_gateList(id); }catch(e2){}
          const unmet=(gates||[]).filter(g=>g&&!g.met);
          let rel, close, need;
          if(unmet.length){
            unmet.sort((a,b)=>num(a.pct,0)-num(b.pct,0)); /* binding = least complete */
            const b=unmet[0];
            rel=1-num(b.pct,0)/100;
            if(b.key==='cash'){ const gap=Math.max(0,cost-cash); close=fmt$(gap)+' to go'; }
            else close=String(b.label||'Requirement')+': '+String(b.have)+' → '+String(b.need);
            need=fmt$(cost)+' · '+unmet.map(g=>String(g.label)).join(' · ');
          }else{
            const gap=Math.max(0,cost-cash); rel=cost>0?gap/cost:0;
            close=gap>0?(fmt$(gap)+' to go'):'affordable now'; need=fmt$(cost);
          }
          push(rel,'Automation: '+sys.name,need,close,Math.round((1-Math.min(1,rel))*100),'automation',null);
        }
      }
    }catch(e){}
    /* 3. next keeper-vault expansion — real cost + real facility gate */
    try{
      if(typeof KEEPER_CAPS!=='undefined'&&typeof KEEPER_CAP_COSTS!=='undefined'){
        const lvl=clamp(int(S.keeperCapLevel,0),0,KEEPER_CAPS.length-1), next=lvl+1;
        if(next<KEEPER_CAPS.length){
          const cost=num(KEEPER_CAP_COSTS[next],0);
          const gate=(typeof keeperCapGate==='function')?keeperCapGate(next):null;
          const gap=Math.max(0,cost-cash), rel=cost>0?gap/cost:0;
          push(rel,'Keeper Vault: '+KEEPER_CAPS[next]+' slots',fmt$(cost)+(gate?(' · '+gate):''),
            gap>0?(fmt$(gap)+' to go'):(gate?'gate locked':'affordable now'),
            Math.round((1-Math.min(1,rel))*100),'keepers',null);
        }
      }
    }catch(e){}
    /* 4. Wave-5 crew roles in the hiring pool — real signing costs */
    try{
      const w5=['growtech','processtech','dispworker','mastergrower'];
      const pool=((S.ex||{}).pool||[]).filter(c=>c&&w5.indexOf(c.role)>=0);
      if(pool.length){
        pool.sort((a,b)=>num(a.sign,0)-num(b.sign,0));
        const c=pool[0], cost=num(c.sign,0), gap=Math.max(0,cost-cash), rel=cost>0?gap/cost:0;
        let rname=c.role; try{ rname=EX_roleById(c.role).name; }catch(e2){}
        push(rel,'Hire '+String(c.name||'specialist')+' ('+rname+')',fmt$(cost),
          gap>0?(fmt$(gap)+' to go'):'affordable now',
          Math.round((1-Math.min(1,rel))*100),'empire','staff');
      }
    }catch(e){}
  }catch(e){}
  return out;
}

/* ---------------- PART A: EMPIRE DASHBOARD ----------------
   Idempotent screen registration (AM_init pattern): SCREENS entry +
   section#scr-dashboard with div#dashboard-root. No index.html change. */
function DASH_init(){
  try{
    if(typeof SCREENS!=='undefined'&&Array.isArray(SCREENS)&&SCREENS.indexOf('dashboard')<0) SCREENS.push('dashboard');
    if(typeof document!=='undefined'){
      let sec=null; try{ sec=document.getElementById('scr-dashboard'); }catch(e){}
      if(!sec){
        sec=document.createElement('section'); sec.id='scr-dashboard'; sec.className='screen hidden';
        const d=document.createElement('div'); d.id='dashboard-root'; sec.appendChild(d);
        const main=document.getElementById('app')||document.querySelector('main');
        if(main) main.appendChild(sec);
      }
    }
  }catch(e){}
  return true;
}

/* Dashboard data — pure reads of live state (testable, reconciles with direct computation) */
function DASH_plantStats(){
  let active=0, ready=0;
  try{ (S.plants||[]).forEach(p=>{ try{ active++; if(stageOf(p)>=5) ready++; }catch(e){} }); }catch(e){}
  let slots=4, fname='Starter Tent', fi=0;
  try{
    fi=clamp(int(S.facility,0),0,FACILITIES.length-1);
    slots=FACILITIES[fi].slots; fname=FACILITIES[fi].name;
  }catch(e){}
  return {active:active,ready:ready,slots:slots,facility:fname,fi:fi};
}
function DASH_invValue(){
  let oz=0, val=0;
  try{ (S.inventory||[]).forEach(it=>{ try{ const a=num(it.amount,0); oz+=a; val+=pricePerOz(it)*a; }catch(e){} }); }catch(e){}
  return {oz:Math.round(oz*10)/10,val:Math.round(val)};
}
function DASH_fin(){
  let rev=0, exp=0, lifeRev=0, lifeExp=0;
  try{ rev=num(S.ty.fin.rev,0); exp=num(S.ty.fin.exp,0); }catch(e){}
  try{ lifeRev=num(S.stats.lifetimeRevenue,0); }catch(e){}
  try{ (S.ty.fin.hist||[]).forEach(h=>{ lifeExp+=num(h.exp,0); }); }catch(e){}
  return {rev:Math.round(rev),exp:Math.round(exp),profit:Math.round(rev-exp),
          lifeRev:Math.round(lifeRev),lifeExp:Math.round(lifeExp),lifeProfit:Math.round(lifeRev-lifeExp)};
}
function DASH_proc(){
  const jobs=[];
  try{ (S.ty.proc||[]).forEach(j=>{
    let nm='Batch';
    try{ const pt=(typeof TY_PRODUCTS!=='undefined')?TY_PRODUCTS.find(x=>x.id===j.ptype):null; if(pt) nm=pt.name; }catch(e){}
    jobs.push({name:nm,daysLeft:num(j.daysLeft,0)});
  }); }catch(e){}
  let finished=0;
  try{ finished=(S.ty.prod||[]).filter(p=>p&&!p.packaged).length; }catch(e){}
  return {jobs:jobs,finished:finished};
}
function DASH_disp(){
  let sales=0, crev=0, cust=0;
  try{ const st=S.ty.cust.stats; sales=int(st.sales,0); crev=Math.round(num(st.rev,0)); cust=int(st.cust,0); }catch(e){}
  return {sales:sales,rev:crev,cust:cust};
}
function DASH_missions(){
  let done=0;
  try{ done=(S.missionsDone||[]).length; }catch(e){}
  const chains=[];
  try{
    (typeof CHAINS!=='undefined'?CHAINS:[]).forEach(def=>{
      const ch=(typeof CHA_state==='function')?CHA_state(def.id):null; if(!ch) return;
      const total=def.stages.length, doneN=Object.keys(ch.sdone||{}).length;
      chains.push({name:def.name,done:!!ch.done,stage:int(ch.stage,0),total:total,doneN:doneN});
    });
  }catch(e){}
  return {done:done,chains:chains};
}
function DASH_breeding(){
  let customs=[];
  try{ customs=(S.customStrains||[]).filter(s=>s&&typeof s==='object'); }catch(e){}
  let stab=0, f2=0;
  const stabMap=(S.ty&&S.ty.stab)||{};
  customs.forEach(s=>{
    if(num(s.stabilityPct,0)>=90||num(stabMap[s.id],0)>=90) stab++;
    const m=String(s.genLabel||s.generation||'').match(/^(F|BX)(\d+)$/i);
    if(m&&(m[1].toUpperCase()==='BX'||int(m[2],0)>=2)) f2++;
  });
  return {total:customs.length,stabilized:stab,f2:f2,inStab:customs.length-stab};
}
function DASH_p0(){
  const tiers=[0,0,0,0,0];
  try{ Object.keys(S.p0vault||{}).forEach(gid=>{ const e=S.p0vault[gid]; tiers[clamp(int(e&&e.tier,0),0,4)]++; }); }catch(e){}
  return tiers;
}
function DASH_genetics(){
  let owned=0;
  try{ owned=(typeof ownedCount==='function')?ownedCount(S):0; }catch(e){}
  let hist=0;
  try{ Object.keys(S.codexHist||{}).forEach(id=>{ const h=S.codexHist[id];
    if(h&&(int(h.acquiredDay,0)>0||int(h.grown,0)>0||int(h.harvested,0)>0||int(h.crossesCreated,0)>0||(h.genNotes||[]).length>0)) hist++;
  }); }catch(e){}
  let keepers=0;
  try{ keepers=(S.keepers||[]).length; }catch(e){}
  return {owned:owned,hist:hist,keepers:keepers};
}
function DASH_crew(){
  let n=0, pay=0;
  try{ n=(S.ex.employees||[]).length; }catch(e){}
  try{ pay=(typeof EX_payrollTotal==='function')?EX_payrollTotal():0; }catch(e){}
  return {n:n,pay:Math.round(num(pay,0))};
}

/* Dashboard render helpers — reuse existing card/datarow/Almost-There classes */
function DASH_secTitle(ico,title,count){
  return '<div class="ge-section-title">'+icon(ico,'ge-ic-sm')+'<span>'+esc(title)+'</span>'+
    (count!=null?'<span class="ge-spread ge-num">'+count+'</span>':'')+'</div>';
}
function DASH_card(ico,title,rows,go,tab,cta){
  let h='<div class="ge-card"><div class="ge-card-head"><h3>'+icon(ico,'ge-ic-md')+esc(title)+'</h3></div>';
  rows.forEach(r=>{ h+='<div class="ge-datarow"><span>'+r[0]+'</span><b class="ge-num">'+r[1]+'</b></div>'; });
  if(go) h+='<div class="ge-btn-row"><button class="ge-btn ge-btn-ghost ge-btn-sm" data-ex-go="'+go+'"'+
    (tab?' data-ex-tab="'+tab+'"':'')+'>'+esc(cta||'VIEW')+'</button></div>';
  return h+'</div>';
}
function DASH_snapHTML(){
  const ps=DASH_plantStats(), cash=num(S.cash,0);
  let h=DASH_secTitle('star','EMPIRE SNAPSHOT');
  h+='<div class="ge-home-glance">'+
   '<div class="ge-metric-tile"><span class="ge-metric-value ge-num">'+ps.active+'<span class="ge-muted">/'+ps.slots+'</span></span><span class="ge-metric-label">GROWING</span></div>'+
   '<div class="ge-metric-tile"><span class="ge-metric-value ge-num">'+ps.ready+'</span><span class="ge-metric-label">READY</span></div>'+
   '<div class="ge-metric-tile"><span class="ge-metric-value ge-num">'+fmt$(cash)+'</span><span class="ge-metric-label">CASH</span></div>'+
   '<div class="ge-metric-tile"><span class="ge-metric-value ge-num">DAY '+int(S.day,1)+'</span><span class="ge-metric-label">DAY</span></div></div>';
  /* next goal — Almost-There visual language */
  try{
    const cands=(typeof P14_candidates==='function')?P14_candidates():[];
    const c=cands[0];
    if(c){
      h+='<div class="ge-card ge-almost-card"><div class="ge-card-head"><h3>'+icon('star','ge-ic-md')+'NEXT GOAL</h3></div>'+
       '<div class="ge-almost-row">'+
       '<div class="ge-datarow"><span class="ge-almost-lbl">WHAT I WANT</span><b>'+esc(c.want)+'</b></div>'+
       '<div class="ge-datarow"><span class="ge-almost-lbl">WHAT I NEED</span><span class="ge-num">'+esc(c.need)+'</span></div>'+
       '<div class="ge-almost-lbl">HOW CLOSE AM I</div>'+
       '<div class="ge-progress-meta"><span class="ge-caption ge-muted">'+esc(c.close)+'</span><b class="ge-num">'+c.pct+'%</b></div>'+
       '<div class="ge-progress"><i style="width:'+clamp(c.pct,0,100)+'%"></i></div>'+
       (c.go?'<div class="ge-btn-row"><button class="ge-btn ge-btn-ghost ge-btn-sm" data-ex-go="'+c.go+'"'+(c.tab?' data-ex-tab="'+c.tab+'"':'')+'>VIEW</button></div>':'')+
       '</div></div>';
    }
  }catch(e){}
  return h;
}
function DASH_msHTML(){
  const nx=MS_next(3);
  let done=0;
  try{ done=Object.keys(S.msDone||{}).length; }catch(e){}
  let last=null, lastDay=0;
  try{ Object.keys(S.msDone||{}).forEach(id=>{ const d=S.msDone[id]; if(d&&num(d.day,0)>=lastDay){ lastDay=num(d.day,0); last=id; } }); }catch(e){}
  const lastDef=last?MS_def(last):null;
  let h=DASH_secTitle('trophy','MILESTONES',done+' / '+MS_DEFS.length);
  h+='<div class="ge-card"><div class="ge-card-head"><h3>'+icon('trophy','ge-ic-md')+'UPCOMING</h3></div>';
  if(!nx.length) h+='<p class="ge-caption ge-muted">Every milestone complete. The empire is legend — the frontier now is your records.</p>';
  nx.forEach(n=>{
    let pct=0;
    try{ const p=n.prog(); pct=clamp(num(p.cur,0)/Math.max(1,num(p.target,1))*100,0,100); }catch(e){}
    h+='<div class="ge-almost-row">'+
      '<div class="ge-datarow"><span class="ge-almost-lbl">MILESTONE</span><b>'+esc(n.name)+'</b></div>'+
      '<div class="ge-datarow"><span class="ge-almost-lbl">PROGRESS</span><span class="ge-num">'+esc(MS_progText(n))+'</span></div>'+
      '<div class="ge-progress-meta"><span class="ge-caption ge-muted">'+esc(n.trig||'')+'</span><b class="ge-num">'+Math.round(pct)+'%</b></div>'+
      '<div class="ge-progress"><i style="width:'+pct+'%"></i></div></div>';
  });
  if(lastDef) h+='<div class="ge-datarow"><span class="ge-almost-lbl">LAST EARNED</span><b>'+esc(lastDef.name)+' <span class="ge-muted">· Day '+lastDay+'</span></b></div>';
  return h+'</div>';
}
function DASH_roomsHTML(){
  const ps=DASH_plantStats();
  if(!(ps.active>0||ps.fi>0)) return ''; /* progressive: beginners see the snapshot only */
  return DASH_secTitle('grow','GROW ROOMS')+
   DASH_card('grow','ROOMS & CAPACITY',[
     ['Facility',esc(ps.facility)],
     ['Plants',ps.active+' / '+ps.slots],
     ['Ready to harvest',ps.ready]
   ],'empire','facilities');
}
function DASH_crewHTML(){
  const c=DASH_crew();
  if(c.n<=0) return '';
  return DASH_secTitle('crew','CREW')+
   DASH_card('crew','EMPLOYEES',[
     ['Staff',c.n],
     ['Payroll',fmt$(c.pay)+'/day']
   ],'empire','staff');
}
function DASH_invHTML(){
  const iv=DASH_invValue();
  if(!(iv.oz>0)) return '';
  return DASH_secTitle('jar','HARVEST INVENTORY')+
   DASH_card('jar','INVENTORY VALUE',[
     ['On hand',fmtW(iv.oz)],
     ['Est. value',fmt$(iv.val)]
   ],'dispensary',null,'SELL');
}
function DASH_procHTML(){
  const pr=DASH_proc();
  if(!(pr.jobs.length>0||pr.finished>0||num(S.stats&&S.stats.processedOz,0)>0)) return '';
  const rows=[];
  if(pr.jobs.length) rows.push(['Batches in flight',pr.jobs.length]);
  pr.jobs.slice(0,3).forEach(j=>rows.push(['<span class="ge-muted">· '+esc(j.name)+'</span>',Math.max(0,Math.ceil(j.daysLeft))+'d left']));
  if(pr.finished) rows.push(['Awaiting packaging',pr.finished]);
  if(!rows.length) rows.push(['Pipeline','Idle — harvest to feed it']);
  return DASH_secTitle('flask','PROCESSING')+DASH_card('flask','PRODUCTION PIPELINE',rows,'production');
}
function DASH_dispHTML(){
  const d=DASH_disp(), f=DASH_fin();
  if(!((S.ty&&S.ty.initDone)&&(d.sales>0||f.rev>0))) return '';
  return DASH_secTitle('dispensary','DISPENSARY')+
   DASH_card('dispensary','SALES TODAY',[
     ['Revenue today',fmt$(f.rev)],
     ['Customers served',d.cust],
     ['Lifetime sales',d.sales]
   ],'dispensary');
}
function DASH_finHTML(){
  const f=DASH_fin();
  if(!(num(S.stats&&S.stats.lifetimeRevenue,0)>0||((S.ty&&S.ty.fin&&S.ty.fin.hist)||[]).length>0)) return '';
  /* PART D: TY_finHTML (DAILY LEDGER) was defined but never rendered anywhere —
     the dashboard revives it inline when finances unlock. */
  let h=DASH_secTitle('chart','FINANCES')+
   DASH_card('chart','MONEY',[
     ['Revenue today',fmt$(f.rev)],
     ['Expenses today',fmt$(f.exp)],
     ['Profit today',(f.profit>=0?'+':'')+fmt$(f.profit)],
     ['Lifetime revenue',fmt$(f.lifeRev)],
     ['Lifetime profit',(f.lifeProfit>=0?'+':'')+fmt$(f.lifeProfit)]
   ],null);
  try{ if(typeof TY_finHTML==='function') h+=TY_finHTML(); }catch(e){}
  return h;
}
function DASH_misHTML(){
  const m=DASH_missions();
  if(!(m.done>0||m.chains.some(c=>!c.done&&c.doneN>0))) return '';
  const rows=[['Missions complete',m.done]];
  m.chains.forEach(c=>{ if(c.done||c.doneN>0) rows.push(['<span class="ge-muted">· '+esc(c.name)+'</span>',c.done?'COMPLETE':(c.doneN+'/'+c.total)]); });
  return DASH_secTitle('missions','MISSIONS & STORY ARCS')+DASH_card('missions','PROGRESS',rows,'missions');
}
function DASH_breedHTML(){
  const b=DASH_breeding();
  if(b.total<=0) return '';
  return DASH_secTitle('breeding','BREEDING PROJECTS')+
   DASH_card('breeding','CUSTOM GENETICS',[
     ['Active customs',b.total],
     ['Stabilizing',b.inStab],
     ['Stabilized lines',b.stabilized],
     ['F2+ / BX lines',b.f2]
   ],'breeding');
}
function DASH_p0HTML(){
  const t=DASH_p0(), sum=t.reduce((a,b)=>a+b,0);
  if(!(sum>0||num(S.project0&&S.project0.points,0)>0)) return '';
  const names=(typeof P0T_TIERS!=='undefined')?P0T_TIERS:['CANDIDATE','DOCUMENTED','VERIFIED','PRESERVED','LEGACY'];
  const rows=names.map((n,i)=>['<span class="ge-muted">· '+n+'</span>',t[i]]);
  return DASH_secTitle('project0','PROJECT 0 PIPELINE')+DASH_card('project0','PRESERVATION TIERS',rows,'project0');
}
function DASH_genHTML(){
  const g=DASH_genetics();
  if(!(g.owned>0||g.hist>0)) return '';
  let total=34;
  try{ total=allStrains().length; }catch(e){}
  return DASH_secTitle('genetics','GENETICS')+
   DASH_card('genetics','COLLECTION',[
     ['Owned',g.owned+' / '+total],
     ['Codex history',g.hist],
     ['Keepers',g.keepers]
   ],'genetics');
}
RENDER.dashboard=function(){
  try{ DASH_init(); }catch(e){}
  const r=document.getElementById('dashboard-root'); if(!r) return;
  let html='<div class="ge-screen">'+
   '<div class="ge-screenhead"><button class="ge-screenhead-back" onclick="show(\'home\')">'+
    icon('x','ge-ic-md')+'<span>HOME</span></button>'+
   '<h2 class="ge-screenhead-title">'+icon('empire','ge-ic-lg')+'EMPIRE DASHBOARD</h2></div>';
  html+=DASH_snapHTML();
  html+=DASH_msHTML();
  html+=DASH_roomsHTML();
  html+=DASH_crewHTML();
  html+=DASH_invHTML();
  html+=DASH_procHTML();
  html+=DASH_dispHTML();
  html+=DASH_finHTML();
  html+=DASH_misHTML();
  html+=DASH_breedHTML();
  html+=DASH_p0HTML();
  html+=DASH_genHTML();
  html+='</div>';
  r.innerHTML=html;
  r.querySelectorAll('[data-ex-go]').forEach(b=>b.onclick=()=>{
    if(b.dataset.exTab) empireTab=b.dataset.exTab;
    show(b.dataset.exGo);
  });
};
/* auto-register on load (idempotent; mirrors AM_init) */
try{ DASH_init(); }catch(e){}
