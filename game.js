/* ============================================================
   SHOCKER OWNZ GROW EMPIRE — vanilla JS grow-sim tycoon
   index.html + styles.css + game.js | GitHub Pages ready
   ============================================================ */
'use strict';

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
  { name:'Preservation Vault', slots:64, cost:150000 }
];
const EQUIP_DEFS = [
  { id:'lights',    name:'💡 Lights',            max:5, base:400,  desc:'+6% yield potential per level. Wider light tolerance.' },
  { id:'hvac',      name:'❄️ HVAC',              max:5, base:500,  desc:'+8% temperature tolerance per level.' },
  { id:'humid',     name:'💦 Humidification',    max:5, base:300,  desc:'+8% low-humidity tolerance per level.' },
  { id:'dehumid',   name:'🌫️ Dehumidification', max:5, base:300,  desc:'+8% high-humidity tolerance per level.' },
  { id:'co2sys',    name:'🫧 CO2 System',        max:5, base:600,  desc:'+4% growth speed & quality per level.' },
  { id:'irrigation',name:'🚿 Irrigation',        max:5, base:350,  desc:'Water drains 12% slower per level.' },
  { id:'nutrients', name:'🧪 Nutrient System',   max:5, base:350,  desc:'Nutrition drains 12% slower, feeding more effective.' },
  { id:'sensors',   name:'📡 Env Sensors',       max:5, base:450,  desc:'Better problem detection. +2% quality per level.' },
  { id:'drycure',   name:'🏺 Dry/Cure Room',     max:5, base:700,  desc:'+3 harvest quality per level.' }
];
const CREW_DEFS = [
  { id:'assistant', name:'🌱 Grow Assistant',        hire:800,  wage:25, desc:'+5% growth speed.' },
  { id:'irrigation',name:'💧 Irrigation Specialist',hire:1200, wage:30, desc:'Water drains 30% slower.' },
  { id:'health',    name:'🩺 Plant Health Specialist',hire:1500,wage:35, desc:'+health regen, fewer pests.' },
  { id:'breeder',   name:'🧬 Breeder',              hire:2500, wage:50, desc:'Better, more stable crosses.' },
  { id:'harvest',   name:'✂️ Harvest Crew',         hire:1000, wage:40, desc:'+6% harvest yield.' },
  { id:'manager',   name:'📋 Facility Manager',     hire:3000, wage:75, desc:'-10% upgrade costs, +rep gains.' }
];
const COMP_TYPES = [
  { id:'flower',  name:'🌸 Best Flower',   desc:'Highest quality flower wins.', score:'quality' },
  { id:'resin',   name:'💎 Highest Resin', desc:'Frostiest resin score wins.',  score:'resin' },
  { id:'terps',   name:'👃 Best Terpenes', desc:'Loudest terpene score wins.',  score:'terpenes' },
  { id:'yield',   name:'⚖️ Largest Yield', desc:'Heaviest single harvest wins.',score:'yield' },
  { id:'overall', name:'👑 Best Overall',  desc:'Combined excellence wins.',    score:'overall' },
  { id:'breeder', name:'🧬 Breeder Cup',   desc:'Best custom cross wins.',      score:'breeder' }
];
const AI_NAMES = ['DankSinatra','TerpWizard','CannaQueen','GrowMastaFlex','BudProfessor','ResinRebel','ChronicClaus','PistilPete'];
const P0_TRACKS = [
  { id:'genetics',     name:'GENETICS',      ico:'🧬' },
  { id:'nocompromise', name:'NO COMPROMISE', ico:'💪' },
  { id:'preservation', name:'PRESERVATION',  ico:'🏦' },
  { id:'cultivation',  name:'CULTIVATION',   ico:'🌱' },
  { id:'family',       name:'FAMILY',        ico:'❤️' },
  { id:'freedom',      name:'FREEDOM',       ico:'🕊️' },
  { id:'resin',        name:'RESIN',         ico:'💎' },
  { id:'knowledge',    name:'KNOWLEDGE',     ico:'📚' }
];
const P0_LEVEL_PTS = [0, 10, 25, 50, 90, 150]; // points to reach level index

/* ---------------- Strain library (34) ----------------
   stats: yld=yield, pot=potency, terp=terpenes, ft=flower days,
   stab=stability, resin, vigor. lock: {t:'rep'|'cash'|'mission', v} */
const STRAINS = [
 {id:'queens-revenge-s1',name:"Queen's Revenge S1",yld:82,pot:94,terp:90,ft:63,stab:88,resin:96,vigor:80,tags:['Gassy','Frosty','Exotic','Keeper'],seed:120},
 {id:'slurricane-7',name:'Slurricane #7',yld:78,pot:88,terp:92,ft:60,stab:85,resin:90,vigor:82,tags:['Frosty','Fruit','Purple','Keeper'],seed:100},
 {id:'gg4-s1',name:'GG4 S1',yld:85,pot:90,terp:84,ft:62,stab:90,resin:93,vigor:88,tags:['Gassy','Heavy','Resin Monster','Stable'],seed:90},
 {id:'rks-s1',name:'RKS S1',yld:74,pot:86,terp:78,ft:65,stab:82,resin:84,vigor:76,tags:['Skunky','Old School','Heavy'],seed:85},
 {id:'tangerine-tbone',name:'Tangerine T-Bone',yld:80,pot:84,terp:95,ft:58,stab:86,resin:82,vigor:90,tags:['Fruit','Exotic','Fast'],seed:95},
 {id:'northern-lights',name:'Northern Lights',yld:76,pot:78,terp:72,ft:55,stab:95,resin:78,vigor:92,tags:['Stable','Fast','Old School'],seed:40},
 {id:'blue-dream',name:'Blue Dream BX',yld:88,pot:76,terp:80,ft:60,stab:90,resin:74,vigor:95,tags:['Fruit','Heavy','Stable'],seed:45},
 {id:'og-kush',name:'OG Kush IBL',yld:70,pot:89,terp:88,ft:64,stab:87,resin:88,vigor:74,tags:['Gassy','Old School','Keeper'],seed:70},
 {id:'sour-diesel',name:'Sour Diesel',yld:82,pot:85,terp:86,ft:68,stab:84,resin:80,vigor:90,tags:['Gassy','Skunky','Heavy'],seed:60},
 {id:'granddaddy-purp',name:'Granddaddy Purp',yld:75,pot:82,terp:84,ft:58,stab:92,resin:82,vigor:80,tags:['Purple','Fruit','Stable'],seed:50},
 {id:'white-widow',name:'White Widow',yld:78,pot:84,terp:76,ft:56,stab:94,resin:92,vigor:88,tags:['Frosty','Resin Monster','Stable','Fast'],seed:55},
 {id:'pineapple-express',name:'Pineapple Express',yld:84,pot:78,terp:90,ft:57,stab:86,resin:76,vigor:93,tags:['Fruit','Fast','Heavy'],seed:48},
 {id:'girl-scout-cookies',name:'Girl Scout Cookies',yld:72,pot:90,terp:89,ft:62,stab:83,resin:90,vigor:76,tags:['Exotic','Frosty','Keeper'],seed:75},
 {id:'zkittlez',name:'Zkittlez',yld:74,pot:83,terp:96,ft:59,stab:81,resin:84,vigor:82,tags:['Fruit','Exotic','Purple'],seed:80},
 {id:'gelato-33',name:'Gelato #33',yld:76,pot:88,terp:91,ft:60,stab:85,resin:89,vigor:80,tags:['Frosty','Exotic','Keeper'],seed:85},
 {id:'wedding-cake',name:'Wedding Cake',yld:79,pot:87,terp:88,ft:61,stab:87,resin:91,vigor:82,tags:['Frosty','Gassy','Keeper'],seed:88},
 {id:'runtz',name:'Runtz',yld:73,pot:86,terp:94,ft:58,stab:82,resin:87,vigor:84,tags:['Fruit','Exotic','Frosty'],seed:92},
 {id:'apple-fritter',name:'Apple Fritter',yld:81,pot:85,terp:89,ft:60,stab:84,resin:86,vigor:85,tags:['Fruit','Frosty','Heavy'],seed:78},
 {id:'ice-cream-cake',name:'Ice Cream Cake',yld:71,pot:87,terp:90,ft:62,stab:86,resin:90,vigor:75,tags:['Frosty','Exotic','Purple'],seed:82},
 {id:'mac-1',name:'MAC 1',yld:70,pot:89,terp:87,ft:66,stab:88,resin:92,vigor:72,tags:['Exotic','Resin Monster','Keeper'],seed:110,lock:{t:'rep',v:150}},
 {id:'gmo-cookies',name:'GMO Cookies',yld:83,pot:91,terp:82,ft:64,stab:85,resin:89,vigor:80,tags:['Gassy','Skunky','Heavy'],seed:95,lock:{t:'rep',v:100}},
 {id:'tropicana-cookies',name:'Tropicana Cookies',yld:77,pot:84,terp:93,ft:57,stab:83,resin:83,vigor:88,tags:['Fruit','Purple','Fast'],seed:90,lock:{t:'cash',v:500}},
 {id:'jealousy',name:'Jealousy',yld:75,pot:88,terp:92,ft:63,stab:84,resin:88,vigor:79,tags:['Exotic','Frosty','Gassy'],seed:105,lock:{t:'rep',v:200}},
 {id:'permanent-marker',name:'Permanent Marker',yld:72,pot:90,terp:89,ft:64,stab:80,resin:90,vigor:74,tags:['Gassy','Exotic','Resin Monster'],seed:115,lock:{t:'rep',v:250}},
 {id:'oreoz',name:'Oreoz',yld:74,pot:89,terp:85,ft:61,stab:82,resin:93,vigor:77,tags:['Frosty','Exotic','Purple'],seed:100,lock:{t:'cash',v:750}},
 {id:'gushers',name:'Gushers',yld:80,pot:84,terp:92,ft:59,stab:83,resin:85,vigor:86,tags:['Fruit','Exotic','Heavy'],seed:88},
 {id:'sunset-sherbet',name:'Sunset Sherbet',yld:76,pot:85,terp:90,ft:60,stab:86,resin:87,vigor:83,tags:['Fruit','Frosty','Purple'],seed:80},
 {id:'dosidos',name:'Do-Si-Dos',yld:78,pot:88,terp:86,ft:62,stab:87,resin:90,vigor:79,tags:['Gassy','Frosty','Heavy'],seed:85},
 {id:'strawberry-cough',name:'Strawberry Cough',yld:82,pot:79,terp:88,ft:58,stab:89,resin:76,vigor:91,tags:['Fruit','Fast','Stable'],seed:55},
 {id:'chemdawg',name:'Chemdawg 91',yld:77,pot:89,terp:87,ft:66,stab:78,resin:86,vigor:82,tags:['Gassy','Skunky','Old School'],seed:95,lock:{t:'rep',v:120}},
 {id:'ak-47',name:'AK-47',yld:86,pot:80,terp:75,ft:54,stab:93,resin:80,vigor:94,tags:['Fast','Stable','Heavy','Old School'],seed:42},
 {id:'super-silver-haze',name:'Super Silver Haze',yld:84,pot:83,terp:82,ft:70,stab:85,resin:82,vigor:89,tags:['Old School','Heavy','Skunky'],seed:58},
 {id:'project-zero-og',name:'Project Zero OG',yld:88,pot:96,terp:94,ft:65,stab:95,resin:98,vigor:90,tags:['Keeper','Resin Monster','Exotic','Gassy'],seed:500,lock:{t:'mission',v:'p0-2'}},
 {id:'crown-jewel',name:'Crown Jewel',yld:90,pot:95,terp:93,ft:64,stab:92,resin:97,vigor:88,tags:['Keeper','Resin Monster','Exotic','Frosty'],seed:750,lock:{t:'rep',v:500}}
];
function strainById(id){ return STRAINS.find(s=>s.id===id); }

/* ---------------- Missions (55, all track real variables) ----------------
   prog(s)->[cur,target]; reward {cash,rep,xp,gen:[strainIds],p0} */
const unlockedCount = s => STRAINS.filter(st=>!s.lockedStrains.includes(st.id)).length;
const MISSIONS = [
 // TUTORIAL
 {id:'tut-plant',cat:'Tutorial',name:'First Seed',desc:'Plant your first seed.',prog:s=>[Math.min(s.stats.plantsStarted,1),1],reward:{cash:50,xp:20}},
 {id:'tut-water',cat:'Tutorial',name:'Stay Hydrated',desc:'Water plants 5 times.',prog:s=>[Math.min(s.stats.waterings,5),5],reward:{cash:50,xp:20}},
 {id:'tut-days',cat:'Tutorial',name:'One Week In',desc:'Advance 7 days.',prog:s=>[Math.min(s.stats.daysAdvanced,7),7],reward:{cash:75,xp:30}},
 {id:'tut-harvest',cat:'Tutorial',name:'First Harvest',desc:'Complete your first harvest.',prog:s=>[Math.min(s.stats.harvests,1),1],reward:{cash:100,xp:50,p0:2}},
 {id:'tut-sell',cat:'Tutorial',name:'First Sale',desc:'Sell product at the dispensary.',prog:s=>[Math.min(s.stats.sales,1),1],reward:{cash:100,xp:50}},
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
 {id:'strain-ttb',cat:'Strain Trials',name:'Citrus Press',desc:'Harvest Tangerine T-Bone at 80+ quality.',prog:s=>[((s.stats.strainGrown['tangerine-tbone']||{}).best||0)>=80?1:0,1],reward:{cash:300,xp:120}},
 {id:'strain-20gen',cat:'Strain Trials',name:'Genetic Vault',desc:'Own 28 unlocked genetics.',prog:s=>[Math.min(unlockedCount(s),28),28],reward:{cash:500,xp:200,p0:3}},
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
 {id:'p0-keepers',cat:'Project 0',name:'Keeper Hunter',desc:'Discover 3 keeper phenotypes (90+ quality harvests).',prog:s=>[Math.min(s.stats.keepers,3),3],reward:{cash:900,xp:350,p0:6}}
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
 {id:'a-allstrain',name:'🌿 Living Library',desc:'Unlock every strain.',t:s=>unlockedCount(s)>=STRAINS.length+s.customStrains.length&&STRAINS.every(st=>!s.lockedStrains.includes(st.id))}
];
/* P0 track level rewards */
const P0_REWARDS = {
 genetics:{3:{gen:['project-zero-og']},5:{title:'🧬 Preservationist'}},
 nocompromise:{3:{cash:500},5:{title:'💪 No Compromise'}},
 preservation:{3:{gen:['oreoz']},5:{title:'🏦 Vault Keeper'}},
 cultivation:{3:{cash:750},5:{title:'🌱 Master Cultivator'}},
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
    version:1, cash:0, reputation:0, xp:0, level:1, day:1, difficulty:'beginner',
    started:false,
    env:{ light:80, temp:76, humidity:52, co2:900 },
    plants:[], nextPlantId:1,
    inventory:[], nextInvId:1,
    equipment:{ lights:1,hvac:1,humid:1,dehumid:1,co2sys:1,irrigation:1,nutrients:1,sensors:1,drycure:1 },
    facility:0,
    crew:{ assistant:false,irrigation:false,health:false,breeder:false,harvest:false,manager:false },
    lockedStrains:locked,
    customStrains:[],
    missionsDone:[], missionSeen:[],
    project0:{ points:0, tracks:{genetics:0,nocompromise:0,preservation:0,cultivation:0,family:0,freedom:0,resin:0,knowledge:0}, titles:[] },
    stats:{ plantsStarted:0,waterings:0,feedings:0,trainings:0,inspects:0,daysAdvanced:0,harvests:0,
      lifetimeHarvestOz:0,lifetimeRevenue:0,bestQuality:0,bestBagAppeal:0,biggestHarvest:0,
      q80Harvests:0,highHealthHarvests:0,flawlessGrows:0,keepers:0,fastestGrow:0,quickTurnarounds:0,
      crosses:0,secondGenCrosses:0,compsEntered:0,compsWon:0,breederCupWins:0,sales:0,processedOz:0,
      missionsDone:0,maxConcurrent:0,strainGrown:{},preserved:0 },
    achievements:[],
    titles:[]
  };
}
function allStrains(){ return STRAINS.concat(S.customStrains); }
function getStrain(id){ return allStrains().find(s=>s.id===id); }
function isUnlocked(id){ return !S.lockedStrains.includes(id); }
function unlockStrain(id){
  if(!S.lockedStrains.includes(id)) return false;
  S.lockedStrains = S.lockedStrains.filter(x=>x!==id);
  const st = getStrain(id);
  toast('🧬 Unlocked genetics: '+(st?st.name:id));
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
  ['plantsStarted','waterings','feedings','trainings','inspects','daysAdvanced','harvests',
   'lifetimeHarvestOz','lifetimeRevenue','bestQuality','bestBagAppeal','biggestHarvest',
   'q80Harvests','highHealthHarvests','flawlessGrows','keepers','fastestGrow','quickTurnarounds',
   'crosses','secondGenCrosses','compsEntered','compsWon','breederCupWins','sales','processedOz',
   'missionsDone','maxConcurrent','preserved'].forEach(k=>{ st[k]=num(st[k],0); });
  if(!st.strainGrown||typeof st.strainGrown!=='object') st.strainGrown={};
  S.stats=st;
  const e=(S.env&&typeof S.env==='object')?S.env:{};
  e.light=clamp(num(e.light,80),0,100); e.temp=clamp(num(e.temp,76),50,100);
  e.humidity=clamp(num(e.humidity,52),0,100); e.co2=clamp(num(e.co2,900),300,2000);
  S.env=e;
  if(!Array.isArray(S.plants)) S.plants=[];
  if(!Array.isArray(S.titles)) S.titles=[];
  if(!Array.isArray(S.achievements)) S.achievements=[];
  if(!Array.isArray(S.missionsDone)) S.missionsDone=[];
  if(!Array.isArray(S.missionSeen)) S.missionSeen=[];
  S.plants.forEach(p=>{ p.health=clamp(num(p.health,100),0,100); p.water=clamp(num(p.water,70),0,100);
    p.nutrition=clamp(num(p.nutrition,70),0,100); p.stress=clamp(num(p.stress,0),0,100);
    p.day=int(p.day,1); p.qualityPotential=clamp(num(p.qualityPotential,50),0,100); });
  if(!Array.isArray(S.inventory)) S.inventory=[];
  S.nextPlantId=Math.max(1,int(S.nextPlantId,1)); S.nextInvId=Math.max(1,int(S.nextInvId,1));
}

/* ---------------- Save / load ---------------- */
function save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(S)); }catch(e){} }
function freshStart(){ S = defaultState(); normalizeState(); }
function load(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw){ freshStart(); return 'none'; }
    const d = JSON.parse(raw);
    if(!d || d.version!==1 || typeof d.cash!=='number' || !Array.isArray(d.plants) || !d.env){ freshStart(); return 'corrupt'; }
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
  toast('💾 Save exported.');
}
function importSaveFile(file){
  const r = new FileReader();
  r.onload = ()=>{
    try{
      const d = JSON.parse(r.result);
      if(!d || d.version!==1 || typeof d.cash!=='number' || !Array.isArray(d.plants)) throw new Error('bad');
      const def = defaultState();
      S = Object.assign(def, d);
      S.stats = Object.assign(def.stats, d.stats||{});
      normalizeState();
      save(); updateHUD(); show('menu');
      toast('📥 Save imported.');
    }catch(e){ toast('❌ Invalid save file.'); }
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
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function toast(msg,ms){
  const t=document.createElement('div'); t.className='toast'; t.innerHTML=msg;
  $('toast-root').appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity .4s'; setTimeout(()=>t.remove(),400); }, ms||2600);
}
function modal(html){
  const root=$('modal-root');
  const back=document.createElement('div'); back.className='modal-back';
  back.innerHTML='<div class="modal">'+html+'</div>';
  root.appendChild(back);
  return back;
}
function closeModal(back){ back.remove(); }
function confirmModal(title,text,onYes){
  const m=modal('<h3>'+esc(title)+'</h3><p>'+esc(text)+'</p>'+
    '<div class="btn-row"><button class="btn btn-danger" id="cm-no">CANCEL</button>'+
    '<button class="btn btn-primary" id="cm-yes">CONFIRM</button></div>');
  m.querySelector('#cm-no').onclick=()=>closeModal(m);
  m.querySelector('#cm-yes').onclick=()=>{ closeModal(m); onYes(); };
}
function statBar(label,val,max,color){
  max=max||100;
  const pct=clamp(Math.round(val/max*100),0,100);
  return '<div class="statrow"><span class="slabel">'+label+'</span><div class="bar '+(color||'')+'"><i style="width:'+pct+'%"></i></div><span class="sval">'+Math.round(val)+'</span></div>';
}

/* ---------------- Navigation ---------------- */
const SCREENS=['splash','difficulty','menu','grow','grows','genetics','dispensary','breeding','project0','empire','missions','settings'];
const RENDER={};
let current='splash';
function show(name){
  if(!SCREENS.includes(name)) name='menu';
  SCREENS.forEach(s=>$('scr-'+s).classList.add('hidden'));
  $('scr-'+name).classList.remove('hidden');
  current=name;
  const chrome = (name!=='splash'&&name!=='difficulty');
  $('hud').classList.toggle('hidden',!chrome);
  $('bottomnav').classList.toggle('hidden',!chrome);
  document.querySelectorAll('#bottomnav button').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));
  if(RENDER[name]) RENDER[name]();
  window.scrollTo(0,0);
}
function screenHead(title){
  return '<div class="screenhead"><button class="backbtn" onclick="show(\'menu\')">‹ MENU</button><h2>'+title+'</h2></div>';
}
function updateHUD(){
  if(!S) return;
  $('hud-cash').textContent=fmt$(S.cash);
  $('hud-rep').textContent=int(S.reputation,0);
  $('hud-level').textContent=Math.max(1,int(S.level,1));
  $('hud-day').textContent=Math.max(1,int(S.day,1));
}

/* ---------------- Progression ---------------- */
function xpNeed(lvl){ lvl=Math.max(1,int(lvl,1)); return Math.round(100*Math.pow(1.35,lvl-1)); }
function gainXP(n){
  n=num(n,0); if(!(n>0)) return;
  S.xp=num(S.xp,0)+n; S.level=Math.max(1,int(S.level,1));
  let need=xpNeed(S.level);
  while(S.xp>=need){ S.xp-=need; S.level++; need=xpNeed(S.level); toast('⬆️ LEVEL UP! You are now level '+S.level); }
}
function gainRep(n){
  n=num(n,0); if(!(n>0)) return;
  S.reputation=int(S.reputation,0);
  const mult = S.crew.manager?1.1:1;
  S.reputation+=Math.round(n*mult);
  // auto-unlock rep-gated strains
  STRAINS.forEach(st=>{
    if(st.lock&&st.lock.t==='rep'&&S.reputation>=st.lock.v) unlockStrain(st.id);
  });
}
function addP0(track,n){
  S.project0.tracks[track]=Math.min(200,(S.project0.tracks[track]||0)+n);
  S.project0.points+=n;
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
      if(rw.cash){ S.cash+=rw.cash; toast('🕊️ Project 0: +'+fmt$(rw.cash)); }
      if(rw.rep){ gainRep(rw.rep); toast('🕊️ Project 0: +'+rw.rep+' rep'); }
      if(rw.xp){ gainXP(rw.xp); }
      if(rw.gen){ rw.gen.forEach(g=>unlockStrain(g)); }
      if(rw.title){ S.project0.titles.push(rw.title); S.titles.push(rw.title); toast('🏅 Title earned: '+rw.title); }
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
      S.stats.missionsDone++;
      const r=m.reward||{};
      const rmult=D.missionReward;
      if(r.cash){ const c=Math.round(r.cash*rmult); S.cash+=c; }
      if(r.rep) gainRep(r.rep);
      if(r.xp) gainXP(r.xp);
      if(r.gen) r.gen.forEach(g=>unlockStrain(g));
      if(r.p0) addP0('knowledge',r.p0);
      const nm=m.name;
      setTimeout(()=>toast('🏆 Mission complete: <b>'+esc(nm)+'</b>'),50);
      // mission-locked strain p0-2
      if(m.id==='p0-50') unlockStrain('project-zero-og');
    }
  });
}
function checkAchievements(){
  ACHIEVEMENTS.forEach(a=>{
    if(S.achievements.includes(a.id)) return;
    let ok=false; try{ ok=a.t(S); }catch(e){}
    if(ok){ S.achievements.push(a.id); gainXP(100); setTimeout(()=>toast('🏅 Achievement: <b>'+esc(a.name)+'</b><br><span class="muted">'+esc(a.desc)+'</span>'),50); }
  });
}

/* ---------------- New game ---------------- */
function newGame(diff){
  freshStart();
  const D=DIFFS[diff];
  S.difficulty=diff; S.cash=D.cash; S.started=true;
  show('menu'); updateHUD(); save();
  toast('👑 Welcome to the Empire, '+D.name+'!');
}
RENDER.difficulty=function(){
  $('diff-list').innerHTML=Object.keys(DIFFS).map(k=>{
    const d=DIFFS[k];
    return '<div class="diff-card" data-d="'+k+'"><h3>'+d.name+'</h3><p class="muted">'+d.desc+'</p>'+
      '<div class="kv"><span>Starting cash</span><b>'+fmt$(d.cash)+'</b></div>'+
      '<div class="kv"><span>Mission rewards</span><b>x'+d.missionReward+'</b></div></div>';
  }).join('');
  document.querySelectorAll('#diff-list .diff-card').forEach(c=>{
    c.onclick=()=>{ document.querySelectorAll('#diff-list .diff-card').forEach(x=>x.classList.remove('sel')); c.classList.add('sel'); };
    c.ondblclick=()=>newGame(c.dataset.d);
  });
  if(!$('diff-start')){
    const b=document.createElement('button'); b.id='diff-start'; b.className='btn btn-primary btn-big'; b.textContent='START GROWING';
    b.onclick=()=>{ const sel=document.querySelector('#diff-list .diff-card.sel'); newGame(sel?sel.dataset.d:'grower'); };
    $('scr-difficulty').appendChild(b);
  }
};

/* ---------------- Main menu ---------------- */
const MENU_ITEMS=[
 {id:'grow',ico:'🌱',label:'PLAY'},
 {id:'grows',ico:'🌿',label:'MY GROWS'},
 {id:'genetics',ico:'🧬',label:'GENETICS'},
 {id:'dispensary',ico:'🏪',label:'DISPENSARY'},
 {id:'breeding',ico:'⚗️',label:'BREEDING'},
 {id:'project0',ico:'🕊️',label:'PROJECT 0'},
 {id:'empire',ico:'🏭',label:'EMPIRE'},
 {id:'missions',ico:'🏆',label:'MISSIONS'},
 {id:'settings',ico:'⚙️',label:'SETTINGS'}
];
RENDER.menu=function(){
  const openMissions=MISSIONS.filter(m=>!S.missionsDone.includes(m.id)).length;
  let html='<div class="menu-hero"><div class="crown-big small">👑</div>'+
    '<div class="logo-text">SHOCKER OWNZ</div><div class="logo-sub">GROW EMPIRE</div>'+
    '<div class="tagline">PLANT • GROW • BREED • HARVEST • BUILD</div></div>';
  html+='<div class="menu-grid">';
  MENU_ITEMS.forEach(mi=>{
    let badge='';
    if(mi.id==='missions'&&openMissions>0) badge='<span class="m-badge">'+openMissions+'</span>';
    html+='<button class="menu-btn" data-go="'+mi.id+'"><span class="m-ico">'+mi.ico+'</span><span class="m-label">'+mi.label+'</span>'+badge+'</button>';
  });
  html+='</div>';
  const lvl=Math.max(1,int(S.level,1)), xp=num(S.xp,0), xpN=xpNeed(lvl);
  const fi=clamp(int(S.facility,0),0,FACILITIES.length-1);
  html+='<div class="card"><div class="kv"><span>Level '+lvl+' — '+Math.max(0,xpN-xp)+' XP to next</span><b>'+xp+'/'+xpN+'</b></div>'+
    '<div class="xpbar"><i style="width:'+clamp(xp/xpN*100,0,100)+'%"></i></div>'+
    '<div class="kv"><span>🏭 Facility</span><b>'+esc(FACILITIES[fi].name)+'</b></div>'+
    '<div class="kv"><span>🌱 Plants growing</span><b>'+S.plants.length+'/'+FACILITIES[fi].slots+'</b></div>'+
    '<div class="kv"><span>🧬 Genetics unlocked</span><b>'+unlockedCount(S)+'/'+allStrains().length+'</b></div>'+
    (Array.isArray(S.titles)&&S.titles.length?'<div class="tags">'+S.titles.map(t=>'<span class="tag gold">'+esc(t)+'</span>').join('')+'</div>':'')+'</div>';
  $('menu-buttons').innerHTML=html;
  document.querySelectorAll('#menu-buttons .menu-btn').forEach(b=>b.onclick=()=>show(b.dataset.go));
};

/* ---------------- Settings ---------------- */
RENDER.settings=function(){
  const r=$('settings-root');
  r.innerHTML=screenHead('⚙️ SETTINGS')+
   '<div class="card"><h3>💾 SAVE DATA</h3>'+
   '<button class="btn" id="set-save">SAVE NOW</button>'+
   '<button class="btn" id="set-export">EXPORT SAVE (JSON)</button>'+
   '<button class="btn" id="set-import">IMPORT SAVE (JSON)</button>'+
   '<button class="btn btn-danger" id="set-reset">RESET GAME</button></div>'+
   '<div class="card"><h3>🏅 ACHIEVEMENTS ('+S.achievements.length+'/'+ACHIEVEMENTS.length+')</h3>'+
   ACHIEVEMENTS.map(a=>'<div class="kv"><span>'+(S.achievements.includes(a.id)?'✅ ':'🔒 ')+esc(a.name)+'<br><span class="muted">'+esc(a.desc)+'</span></span></div>').join('')+'</div>'+
   '<div class="card"><h3>📊 LIFETIME STATS</h3>'+
   '<div class="kv"><span>Days survived</span><b>'+S.day+'</b></div>'+
   '<div class="kv"><span>Lifetime harvest</span><b>'+num(S.stats.lifetimeHarvestOz,0).toFixed(1)+' oz</b></div>'+
   '<div class="kv"><span>Lifetime revenue</span><b>'+fmt$(S.stats.lifetimeRevenue)+'</b></div>'+
   '<div class="kv"><span>Best quality</span><b>'+Math.round(S.stats.bestQuality)+'</b></div>'+
   '<div class="kv"><span>Crosses created</span><b>'+S.stats.crosses+'</b></div>'+
   '<div class="kv"><span>Competitions won</span><b>'+S.stats.compsWon+'</b></div>'+
   '<div class="kv"><span>Missions completed</span><b>'+int(S.stats.missionsDone,0)+'/'+MISSIONS.length+' ('+Math.round(int(S.stats.missionsDone,0)/MISSIONS.length*100)+'%)</b></div></div>'+
   '<div class="card"><p class="muted">SHOCKER OWNZ GROW EMPIRE v1.0<br>PLANT • GROW • BREED • HARVEST • BUILD</p></div>';
  $('set-save').onclick=()=>{ save(); toast('💾 Saved.'); };
  $('set-export').onclick=exportSave;
  $('set-import').onclick=()=>$('import-file').click();
  $('set-reset').onclick=()=>confirmModal('Reset game?','This erases ALL progress. This cannot be undone.',()=>{
    try{localStorage.removeItem(SAVE_KEY);}catch(e){}
    freshStart(); show('splash');
  });
};

/* ---------------- Boot ---------------- */
function boot(){
  const res=load();
  $('btn-enter').onclick=()=>{ if(S.started) show('menu'); else show('difficulty'); };
  setTimeout(()=>{ if(current==='splash'){ if(S.started) show('menu'); else show('difficulty'); } },4000);
  document.querySelectorAll('#bottomnav button').forEach(b=>b.onclick=()=>show(b.dataset.nav));
  $('import-file').addEventListener('change',e=>{ if(e.target.files[0]) importSaveFile(e.target.files[0]); e.target.value=''; });
  if(res==='corrupt') setTimeout(()=>toast('⚠️ Old save was unreadable — started fresh.'),600);
  updateHUD();
  show('splash');
}
document.addEventListener('DOMContentLoaded',boot);

/* ---------------- Genetics screen ---------------- */
function strainCard(st,opts){
  opts=opts||{};
  const locked=!isUnlocked(st.id);
  let lockHtml='';
  if(locked){
    const l=st.lock;
    lockHtml='<p class="lock-note">🔒 '+(l.t==='rep'?'Unlocks at '+l.v+' reputation':l.t==='cash'?'Buy for '+fmt$(st.seed*3):'Unlock via Project 0 mission')+'</p>';
    if(l.t==='cash') lockHtml+='<button class="btn btn-small btn-gold" data-buygen="'+st.id+'">BUY GENETICS — '+fmt$(st.seed*3)+'</button>';
  }
  const custom=st.custom?'<span class="badge gold">CUSTOM</span>':'';
  const lin=st.lineage?'<p class="muted">🧬 '+esc(st.lineage)+'</p>':'';
  return '<div class="card"><h3>'+esc(st.name)+' '+custom+'</h3>'+lin+
    '<div class="tags">'+st.tags.map(t=>'<span class="tag">'+esc(t)+'</span>').join('')+'</div>'+
    statBar('Yield',st.yld)+statBar('Potency',st.pot)+statBar('Terpenes',st.terp)+
    '<div class="statrow"><span class="slabel">Flower time</span><span class="sval" style="width:auto">'+st.ft+' days</span></div>'+
    statBar('Stability',st.stab)+statBar('Resin',st.resin)+statBar('Vigor',st.vigor)+
    lockHtml+
    (opts.preserve&&!locked?'<button class="btn btn-small" data-preserve="'+st.id+'">🏦 PRESERVE (+P0)</button>':'')+
    '</div>';
}
RENDER.genetics=function(){
  const r=$('genetics-root');
  const all=allStrains();
  let html=screenHead('🧬 GENETICS')+
   '<p class="muted">Unlocked '+unlockedCount(S)+'/'+all.length+' — preserve strains to earn Project 0 points.</p>';
  all.forEach(st=>{ html+=strainCard(st,{preserve:true}); });
  r.innerHTML=html;
  r.querySelectorAll('[data-buygen]').forEach(b=>b.onclick=()=>{
    const st=getStrain(b.dataset.buygen), cost=st.seed*3;
    if(S.cash<cost){ toast('❌ Not enough cash.'); return; }
    S.cash-=cost; unlockStrain(st.id); save(); updateHUD(); RENDER.genetics();
  });
  r.querySelectorAll('[data-preserve]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.preserve;
    if(S.cash<25){ toast('❌ Preservation costs $25.'); return; }
    S.cash-=25; S.stats.preserved++;
    addP0('preservation',2); addP0('genetics',1); gainXP(10);
    toast('🏦 '+esc(getStrain(id).name)+' preserved. +Project 0');
    save(); updateHUD(); checkMissions();
  });
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
  let html=screenHead('⚗️ BREEDING LAB');
  html+='<div class="card"><h3>PARENT A</h3>'+breedPickList('breed-a',breedA)+'</div>';
  html+='<div class="card"><h3>PARENT B</h3>'+breedPickList('breed-b',breedB)+'</div>';
  if(A&&B){
    const traits=predictTraits(A,B);
    html+='<div class="card"><h3>🔮 PREDICTED OFFSPRING TRAITS</h3>'+
      traits.map(t=>statBar(t.n,t.v)).join('')+'</div>';
    html+='<div class="card"><h3>NAME YOUR CROSS</h3><input type="text" id="cross-name" maxlength="28" placeholder="e.g. Revenge Cake" value="'+esc(A.name.split(' ')[0])+' x '+esc(B.name.split(' ')[0])+'">'+
      '<p class="muted">Breeding fee: $150'+(S.crew.breeder?' (breeder bonus: more stable)':'')+'</p>'+
      '<button class="btn btn-primary" id="btn-cross">⚗️ CREATE CROSS</button></div>';
  }
  html+='<div class="card"><h3>🧬 YOUR CROSSES ('+S.customStrains.length+')</h3>'+
    (S.customStrains.length?S.customStrains.map(s=>'<div class="kv"><span>'+esc(s.name)+'<br><span class="muted">'+esc(s.lineage)+'</span></span><span class="badge gold">R'+Math.round(s.resin)+'</span></div>').join(''):'<p class="muted">No custom crosses yet.</p>')+'</div>';
  r.innerHTML=html;
  $('breed-a').onchange=e=>{ breedA=e.target.value; RENDER.breeding(); };
  $('breed-b').onchange=e=>{ breedB=e.target.value; RENDER.breeding(); };
  const btn=$('btn-cross');
  if(btn) btn.onclick=()=>{ const nm=($('cross-name').value||'Untitled Cross'); createCross(nm); };
};
function createCross(name){
  const A2=getStrain(breedA), B2=getStrain(breedB);
  if(!A2||!B2){ toast('❌ Select two parents.'); return false; }
  if(S.cash<150){ toast('❌ Need $150 breeding fee.'); return false; }
  S.cash-=150;
  const breederBonus=S.crew.breeder?6:0;
  const blend=(a,b)=>clamp(Math.round((a+b)/2+rnd(-8-breederBonus/2,8)),10,100);
  const nm=(String(name||'Untitled Cross')).trim().slice(0,28)||'Untitled Cross';
  const cross={ id:'custom-'+Date.now(), name:nm, custom:true,
    yld:blend(A2.yld,B2.yld), pot:blend(A2.pot,B2.pot), terp:blend(A2.terp,B2.terp),
    ft:Math.round((A2.ft+B2.ft)/2+rnd(-3,3)),
    stab:clamp(Math.round((A2.stab+B2.stab)/2-4+breederBonus),10,100),
    resin:blend(A2.resin,B2.resin), vigor:blend(A2.vigor,B2.vigor),
    tags:Array.from(new Set([pick(A2.tags),pick(B2.tags),'Custom'])),
    seed:120, lineage:A2.name+' × '+B2.name };
  S.customStrains.push(cross);
  S.stats.crosses++;
  if(A2.custom||B2.custom) S.stats.secondGenCrosses++;
  addP0('genetics',3); addP0('nocompromise',1); gainXP(80); gainRep(5);
  toast('🧬 New strain created: <b>'+esc(nm)+'</b>');
  save(); updateHUD(); checkMissions(); checkAchievements();
  if(current==='breeding') RENDER.breeding();
  return true;
}

/* ---------------- Grow simulation ---------------- */
function stageOf(p){
  const st=getStrain(p.strainId); if(!st) return 0;
  const pr=p.day/st.ft;
  if(pr<0.15) return 0; if(pr<0.35) return 1; if(pr<0.55) return 2;
  if(pr<0.75) return 3; if(pr<1.0) return 4; return 5;
}
function plantIcon(p){
  const s=stageOf(p);
  return ['🌱','🌿','🌿','🪴','🪴','💐'][s];
}
function envEval(){
  const D=DIFFS[S.difficulty], e=S.env, q=S.equipment;
  const tol=D.envTol;
  const issues=[]; let score=100;
  const tTol=6*(1+0.08*(q.hvac-1))*tol, hTol=8*(1+0.08*(q.humid-1))*tol, hhTol=8*(1+0.08*(q.dehumid-1))*tol;
  if(e.temp<70-tTol){ issues.push('❄️ Too cold'); score-=14; }
  else if(e.temp>82+tTol){ issues.push('🔥 Too hot'); score-=14; }
  if(e.humidity<40-hTol){ issues.push('🏜️ Humidity low'); score-=10; }
  else if(e.humidity>60+hhTol){ issues.push('💦 Humidity high'); score-=10; }
  const lTol=10*tol;
  if(e.light<70-lTol){ issues.push('💡 Light low'); score-=12; }
  if(e.co2<800){ issues.push('🫧 CO2 low'); score-=8; }
  else if(e.co2>1500){ issues.push('🫧 CO2 high'); score-=6; }
  return { score:clamp(Math.round(score),0,100), issues:issues };
}
function newPlant(strainId){
  const st=getStrain(strainId);
  return { id:S.nextPlantId++, strainId:strainId, day:0, health:100, water:70, nutrition:60,
    stress:0, trained:false, minHealth:100, problems:[], growthBoost:0 };
}
function plantSeed(strainId){
  const st=getStrain(strainId);
  const slots=FACILITIES[S.facility].slots;
  if(S.plants.length>=slots){ toast('❌ No free grow slots. Expand your facility!'); return false; }
  if(!isUnlocked(strainId)){ toast('🔒 Genetics locked.'); return false; }
  if(S.cash<st.seed){ toast('❌ Need '+fmt$(st.seed)+' for seeds.'); return false; }
  S.cash-=st.seed;
  S.plants.push(newPlant(strainId));
  S.stats.plantsStarted++;
  S.stats.maxConcurrent=Math.max(S.stats.maxConcurrent,S.plants.length);
  gainXP(10);
  save(); updateHUD(); checkMissions();
  return true;
}
function doAction(pid,action){
  const p=S.plants.find(x=>x.id===pid); if(!p) return;
  const st=getStrain(p.strainId);
  if(action==='water'){
    if(p.water>92){ p.health=clamp(p.health-6,0,100); p.stress=clamp(p.stress+10,0,100); p.problems.push('Overwatered!'); toast('💧 Overwatered! Roots are stressed.'); }
    else { p.water=clamp(p.water+38,0,100); toast('💧 Watered.'); }
    S.stats.waterings++;
  }else if(action==='feed'){
    const eff=1+0.15*(S.equipment.nutrients-1);
    if(p.nutrition>88){ p.health=clamp(p.health-8,0,100); p.stress=clamp(p.stress+12,0,100); p.problems.push('Nutrient burn!'); toast('🧪 Nutrient burn! Too much.'); }
    else { p.nutrition=clamp(p.nutrition+32*eff,0,100); toast('🧪 Fed.'); }
    S.stats.feedings++;
  }else if(action==='train'){
    p.stress=clamp(p.stress+12,0,100); p.trained=true;
    p.health=clamp(p.health-3,0,100); toast('✂️ Trained: +yield potential, +stress.');
    S.stats.trainings++;
  }else if(action==='inspect'){
    S.stats.inspects++;
    const ev=envEval();
    const probs=p.problems.length?p.problems.join(', '):'none';
    const detail=S.equipment.sensors>=3?' Exact status: H'+Math.round(p.health)+' W'+Math.round(p.water)+' N'+Math.round(p.nutrition)+' S'+Math.round(p.stress)+'.':'';
    modal('<h3>🔍 '+esc(st.name)+'</h3><p>Stage: <b>'+STAGES[stageOf(p)]+'</b> (Day '+p.day+'/'+st.ft+')</p>'+
      '<p class="prob">Problems: '+esc(probs)+'</p><p class="muted">Environment: '+(ev.issues.length?esc(ev.issues.join(' • ')):'Ideal')+detail+'</p>'+
      '<button class="btn" onclick="this.closest(\'.modal-back\').remove()">CLOSE</button>');
  }else if(action==='harvest'){
    harvestPlant(p); return;
  }
  p.minHealth=Math.min(p.minHealth,p.health);
  save(); updateHUD(); refreshGrowUI();
}
function refreshGrowUI(){ if(current==='grow') RENDER.grow(); if(current==='grows') RENDER.grows(); }

/* ---------------- Harvest ---------------- */
function harvestPlant(p){
  const st=getStrain(p.strainId);
  if(stageOf(p)<5){ toast('⏳ Not ready yet — '+STAGES[stageOf(p)]+'.'); return; }
  const D=DIFFS[S.difficulty], q=S.equipment;
  const healthF=p.health/100;
  const stressF=1-p.stress/250;
  const ev=envEval().score/100;
  const trainB=p.trained?1.15:1;
  const lightB=1+0.06*(q.lights-1), co2B=1+0.04*(q.co2sys-1), crewB=S.crew.harvest?1.06:1;
  const yieldOz=Math.max(0.5,(st.yld/100)*3.2*healthF*stressF*trainB*lightB*co2B*crewB*D.econMult);
  let quality=(st.pot*0.25+st.terp*0.15+st.resin*0.15+st.stab*0.1);
  quality=quality*0.5 + (p.health*0.3) + (ev*20);
  quality+=q.drycure*3 + q.sensors*2 - p.stress*0.15;
  if(p.day>st.ft+7) quality-=10; // harvested late
  quality=clamp(quality*D.qualityMult,5,100);
  const potency=clamp(st.pot*0.6+quality*0.4,5,100);
  const terpenes=clamp(st.terp*0.6+quality*0.4,5,100);
  const bagAppeal=clamp(quality*0.7+st.resin*0.3,5,100);
  const resin=clamp(st.resin*0.65+quality*0.35,5,100);
  S.inventory.push({ id:S.nextInvId++, strainId:st.id, strainName:st.name, amount:Math.round(yieldOz*10)/10,
    quality:Math.round(quality), potency:Math.round(potency), terpenes:Math.round(terpenes),
    bagAppeal:Math.round(bagAppeal), resin:Math.round(resin), type:'flower', custom:!!st.custom });
  S.plants=S.plants.filter(x=>x.id!==p.id);
  const oz=Math.round(yieldOz*10)/10, qq=Math.round(quality);
  const sg=S.stats.strainGrown[st.id]||{count:0,best:0};
  sg.count++; sg.best=Math.max(sg.best,qq); S.stats.strainGrown[st.id]=sg;
  S.stats.harvests++; S.stats.lifetimeHarvestOz+=oz;
  S.stats.bestQuality=Math.max(S.stats.bestQuality,qq);
  S.stats.bestBagAppeal=Math.max(S.stats.bestBagAppeal,Math.round(bagAppeal));
  S.stats.biggestHarvest=Math.max(S.stats.biggestHarvest,oz);
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
  toast('🌾 Harvested <b>'+esc(st.name)+'</b>: '+oz+' oz @ '+qq+' quality!');
  save(); updateHUD(); checkMissions(); checkAchievements(); refreshGrowUI();
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
    if(Math.random()<0.02&&stageOf(p)>=2) ev.push(hermEvent(p));
  });
  if(Math.random()<0.04) ev.push(equipFailEvent());
  return ev.filter(Boolean);
}
function evModal(p,title,text,choices){
  return { p:p, title:title, text:text, choices:choices };
}
function miteEvent(p){ const st=getStrain(p.strainId);
  return evModal(p,'🕷️ Spider Mites!','Spider mites on your '+st.name+'.',
   [['Buy predatory mites ($40)',()=>{ if(S.cash>=40){S.cash-=40; toast('🐞 Mites deployed. Problem solved.');} else {p.health-=10; toast('❌ Could not afford it!');} }],
    ['Neem oil spray ($15, +stress)',()=>{ if(S.cash>=15){S.cash-=15; p.stress=clamp(p.stress+8,0,100); p.problems=p.problems.filter(x=>x!=='Spider mites'); toast('🌿 Sprayed.');} else {p.health-=10; toast('❌ Could not afford it!');} }],
    ['Ignore it',()=>{ p.health=clamp(p.health-16,0,100); p.problems.push('Spider mites'); toast('🕷️ Mites spread! Health -16.'); }]]);
}
function gnatEvent(p){ const st=getStrain(p.strainId);
  return evModal(p,'🦟 Fungus Gnats','Fungus gnats buzzing around your '+st.name+'.',
   [['Let soil dry out (water -15)',()=>{ p.water=clamp(p.water-15,0,100); p.problems=p.problems.filter(x=>x!=='Fungus gnats'); toast('🏜️ Soil dried. Gnats gone.'); }],
    ['Sticky traps ($10)',()=>{ if(S.cash>=10){S.cash-=10; p.problems=p.problems.filter(x=>x!=='Fungus gnats'); toast('🪤 Traps set.');} else {p.health-=8; toast('❌ Could not afford it!');} }],
    ['Ignore it',()=>{ p.health=clamp(p.health-10,0,100); p.problems.push('Fungus gnats'); toast('🦟 Larvae munch roots! Health -10.'); }]]);
}
function mildewEvent(p){ const st=getStrain(p.strainId);
  return evModal(p,'🤍 Powdery Mildew','White powder on leaves of '+st.name+'. Lower humidity!',
   [['Defoliate (+stress)',()=>{ p.stress=clamp(p.stress+10,0,100); p.problems=p.problems.filter(x=>x!=='Powdery mildew'); toast('✂️ Infected leaves removed.'); }],
    ['Fungicide ($25)',()=>{ if(S.cash>=25){S.cash-=25; p.problems=p.problems.filter(x=>x!=='Powdery mildew'); toast('🧴 Treated.');} else {p.health-=12; toast('❌ Could not afford it!');} }],
    ['Ignore it',()=>{ p.health=clamp(p.health-14,0,100); p.problems.push('Powdery mildew'); toast('🤍 Mildew spreads! Health -14.'); }]]);
}
function defEvent(p,kind){ const st=getStrain(p.strainId);
  if(kind==='deficiency') return evModal(p,'🥀 Nutrient Deficiency','Your '+st.name+' is hungry — leaves yellowing.',
   [['Feed now',()=>{ p.nutrition=clamp(p.nutrition+30,0,100); toast('🧪 Fed. Crisis averted.'); }],
    ['Ignore it',()=>{ p.health=clamp(p.health-10,0,100); p.problems.push('Deficiency'); toast('🥀 Health -10.'); }]]);
  return evModal(p,'🔥 Nutrient Burn','Leaf tips burning on '+st.name+' — too much feed!',
   [['Flush with water',()=>{ p.nutrition=clamp(p.nutrition-35,0,100); p.water=clamp(p.water+20,0,100); toast('💧 Flushed.'); }],
    ['Ignore it',()=>{ p.health=clamp(p.health-12,0,100); p.problems.push('Nutrient burn'); toast('🔥 Health -12.'); }]]);
}
function stressEvent(p,kind){ const st=getStrain(p.strainId);
  const t=kind==='heat'?'🌡️ Heat Stress':'💡 Light Stress';
  return evModal(p,t,'Your '+st.name+' is stressed. Adjust the environment!',
   [['I\'ll fix the environment',()=>{ toast('⚙️ Adjust sliders in the Grow Room.'); }],
    ['Ride it out (-8 health)',()=>{ p.health=clamp(p.health-8,0,100); p.stress=clamp(p.stress+8,0,100); }]]);
}
function goodEvent(p,kind){ const st=getStrain(p.strainId);
  if(kind==='growth'){ p.growthBoost+=2; return evModal(p,'🚀 Exceptional Growth','Your '+st.name+' is exploding with vigor! +2 days growth.',[['Nice!',()=>{}]]); }
  if(kind==='terps'){ p.terpBoost=(p.terpBoost||0)+5; return evModal(p,'👃 Terpene Surge','Terps going wild on '+st.name+'! +quality.',[['Nice!',()=>{}]]); }
  p.resinBoost=(p.resinBoost||0)+5; return evModal(p,'💎 Resin Surge','Frost pouring on '+st.name+'! +quality.',[['Nice!',()=>{}]]);
}
function mutationEvent(p){ const st=getStrain(p.strainId);
  return evModal(p,'🧬 Mutation!','A rare mutation on '+st.name+'.',
   [['Stabilize it (+vigor, +resin)',()=>{ p.growthBoost+=1; p.resinBoost=(p.resinBoost||0)+8; addP0('genetics',2); toast('🧬 Mutation stabilized!'); }],
    ['Cull the branch',()=>{ p.health=clamp(p.health-5,0,100); toast('✂️ Culled.'); }]]);
}
function hermEvent(p){ const st=getStrain(p.strainId);
  return evModal(p,'⚠️ Herm Warning','Bananas spotted on '+st.name+' — it may pollinate the room!',
   [['Isolate & monitor (+stress)',()=>{ p.stress=clamp(p.stress+15,0,100); toast('👀 Isolated. Crisis managed.'); }],
    ['Cull the plant',()=>{ S.plants=S.plants.filter(x=>x.id!==p.id); toast('🗑️ Plant culled to save the room.'); refreshGrowUI(); }]]);
}
function equipFailEvent(){
  return evModal(null,'🔧 Equipment Failure','Your HVAC sputters — environment control degraded for 2 days!',
   [['Repair ($75)',()=>{ if(S.cash>=75){S.cash-=75; toast('🔧 Repaired.');} else { S.envPenalty=2; toast('❌ Running degraded 2 days!'); } }],
    ['Run degraded',()=>{ S.envPenalty=2; toast('⚠️ Environment -15 score for 2 days.'); }]]);
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

/* ---------------- Day advance ---------------- */
function advanceDay(){
  const D=DIFFS[S.difficulty], q=S.equipment, ev=envEval();
  const envScore=Math.max(0,ev.score-(S.envPenalty>0?15:0));
  if(S.envPenalty>0) S.envPenalty--;
  S.plants.forEach(p=>{
    const st=getStrain(p.strainId);
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
    dmg+=(100-envScore)*0.09;
    dmg*=D.healthLoss*(S.crew.health?0.75:1);
    if(dmg<1&&envScore>80) p.health=clamp(p.health+(S.crew.health?3:2),0,100);
    else p.health=clamp(p.health-dmg,0,100);
    p.stress=clamp(p.stress-5+(dmg>2?4:0),0,100);
    p.minHealth=Math.min(p.minHealth,p.health);
    p.problems=p.problems.slice(-4);
    if(p.health<=0){ p.dead=true; }
  });
  const dead=S.plants.filter(p=>p.dead);
  if(dead.length){ toast('💀 '+dead.length+' plant(s) died!'); }
  S.plants=S.plants.filter(p=>!p.dead);
  // crew wages
  let wages=0; Object.keys(S.crew).forEach(k=>{ if(S.crew[k]) wages+=CREW_DEFS.find(c=>c.id===k).wage; });
  if(wages>0){
    if(S.cash>=wages){ S.cash-=wages; }
    else{
      const hired=Object.keys(S.crew).filter(k=>S.crew[k]).sort((a,b)=>CREW_DEFS.find(c=>c.id===b).wage-CREW_DEFS.find(c=>c.id===a).wage);
      while(hired.length&&S.cash<wages){ const f=hired.shift(); S.crew[f]=false; wages-=CREW_DEFS.find(c=>c.id===f).wage; toast('💸 '+CREW_DEFS.find(c=>c.id===f).name+' quit — could not pay wages!'); }
      S.cash=Math.max(0,S.cash-wages);
    }
  }
  S.day++; S.stats.daysAdvanced++;
  gainXP(5);
  save(); updateHUD();
  checkMissions(); checkAchievements();
  const queue=rollEvents();
  refreshGrowUI();
  showEventQueue(queue);
}

/* ---------------- PLAY: Grow Room ---------------- */
RENDER.grow=function(){
  const r=$('grow-root'), ev=envEval(), slots=FACILITIES[S.facility].slots;
  const evCls=v=>v>=80?'good':v>=55?'warn':'bad';
  let html=screenHead('🌱 GROW ROOM')+
   '<div class="tent"><div class="kv"><span>🏭 '+FACILITIES[S.facility].name+'</span><b>'+S.plants.length+'/'+slots+' slots</b></div>'+
   '<div class="gauge-grid">'+
   '<div class="gauge"><div class="glabel">ENV SCORE</div><div class="gval '+evCls(ev.score)+'">'+ev.score+'</div></div>'+
   '<div class="gauge"><div class="glabel">ISSUES</div><div class="gval '+(ev.issues.length?'warn':'good')+'">'+ev.issues.length+'</div></div></div>'+
   (ev.issues.length?'<p class="prob">'+ev.issues.map(esc).join(' • ')+'</p>':'<p class="muted">✅ Environment dialed in.</p>')+
   '<div class="slot-grid">';
  for(let i=0;i<slots;i++){
    const p=S.plants[i];
    if(p){ const st=getStrain(p.strainId);
      html+='<div class="slot filled" data-pid="'+p.id+'"><span>'+plantIcon(p)+'</span><span class="slot-day">D'+Math.floor(p.day)+'</span></div>';
    } else html+='<div class="slot empty" data-empty="1">＋</div>';
  }
  html+='</div></div>';
  html+='<div class="card"><h3>🎛️ ENVIRONMENT CONTROLS</h3>'+
   envSlider('light','💡 Light Intensity',S.env.light,40,100,'%')+
   envSlider('temp','🌡️ Temperature',S.env.temp,60,95,'°F')+
   envSlider('humidity','💧 Humidity',S.env.humidity,20,90,'%')+
   envSlider('co2','🫧 CO2',S.env.co2,400,1600,' PPM')+'</div>';
  html+='<button class="btn btn-primary btn-big" id="btn-day">☀️ ADVANCE DAY ('+S.day+' → '+(S.day+1)+')</button>';
  r.innerHTML=html;
  r.querySelectorAll('input[type=range][data-env]').forEach(s=>{
    s.oninput=e=>{ S.env[e.target.dataset.env]=+e.target.value; e.target.closest('.env-ctl').querySelector('.env-val').textContent=e.target.value+e.target.dataset.unit; };
    s.onchange=()=>{ save(); RENDER.grow(); };
  });
  $('btn-day').onclick=advanceDay;
  r.querySelectorAll('[data-empty]').forEach(s=>s.onclick=()=>plantSeedModal());
  r.querySelectorAll('[data-pid]').forEach(s=>s.onclick=()=>plantModal(+s.dataset.pid));
};
function envSlider(key,label,val,min,max,unit){
  return '<div class="env-ctl"><label><span>'+label+'</span><span class="env-val">'+val+unit+'</span></label>'+
   '<input type="range" min="'+min+'" max="'+max+'" value="'+val+'" data-env="'+key+'" data-unit="'+unit+'"></div>';
}
function plantSeedModal(){
  const avail=allStrains().filter(s=>isUnlocked(s.id));
  const m=modal('<h3>🌱 PLANT A SEED</h3><div id="seed-list" style="max-height:50vh;overflow-y:auto;"></div><button class="btn" id="seed-close">CANCEL</button>');
  m.querySelector('#seed-close').onclick=()=>closeModal(m);
  m.querySelector('#seed-list').innerHTML=avail.map(s=>
    '<div class="strain-pick" data-seed="'+s.id+'"><b>'+esc(s.name)+'</b> <span class="muted">— '+fmt$(s.seed)+'</span><br>'+
    '<span class="muted" style="font-size:12px">'+s.ft+'d flower • '+s.tags.slice(0,3).map(esc).join(', ')+'</span></div>').join('');
  m.querySelectorAll('[data-seed]').forEach(b=>b.onclick=()=>{
    if(plantSeed(b.dataset.seed)){ closeModal(m); refreshGrowUI(); toast('🌱 Planted '+esc(getStrain(b.dataset.seed).name)); }
  });
}
function plantModal(pid){
  const p=S.plants.find(x=>x.id===pid); if(!p) return;
  const st=getStrain(p.strainId), s=stageOf(p);
  const ready=s>=5;
  const qp=Math.round(clamp(st.pot*0.5+p.health*0.3+envEval().score*0.2-p.stress*0.15,5,100));
  const m=modal('<h3>'+plantIcon(p)+' '+esc(st.name)+'</h3>'+
   '<p><span class="badge">'+STAGES[s]+'</span> <span class="muted">Day '+Math.floor(p.day)+'/~'+st.ft+'</span></p>'+
   statBar('Health',p.health,100,'green')+statBar('Water',p.water)+statBar('Nutrition',p.nutrition)+
   statBar('Stress',p.stress)+'<div class="statrow"><span class="slabel">Quality pot.</span><span class="sval" style="width:auto">'+qp+'</span></div>'+
   (p.problems.length?'<p class="prob">⚠️ '+p.problems.map(esc).join(', ')+'</p>':'')+
   '<div class="p-actions" style="grid-template-columns:repeat(3,1fr)">'+
   '<button class="btn btn-small" data-a="water">💧<br>WATER</button>'+
   '<button class="btn btn-small" data-a="feed">🧪<br>FEED</button>'+
   '<button class="btn btn-small" data-a="train">✂️<br>TRAIN</button>'+
   '<button class="btn btn-small" data-a="inspect">🔍<br>INSPECT</button>'+
   '<button class="btn btn-small btn-green" data-a="harvest" '+(ready?'':'disabled')+'>🌾<br>HARVEST</button>'+
   '<button class="btn btn-small" data-a="close">✖️<br>CLOSE</button></div>');
  m.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{
    const a=b.dataset.a; closeModal(m);
    if(a!=='close') doAction(pid,a);
  });
}

/* ---------------- MY GROWS ---------------- */
RENDER.grows=function(){
  const r=$('grows-root');
  let html=screenHead('🌿 MY GROWS')+
   '<button class="btn btn-primary" id="btn-plant">🌱 PLANT NEW SEED</button>';
  if(!S.plants.length) html+='<div class="card"><p class="muted">No plants growing. Plant your first seed to start the empire.</p></div>';
  S.plants.forEach(p=>{
    const st=getStrain(p.strainId), s=stageOf(p);
    html+='<div class="plant-card"><div class="p-head"><span class="p-name">'+plantIcon(p)+' '+esc(st.name)+'</span><span class="p-stage">'+STAGES[s]+'</span></div>'+
     '<div class="kv"><span>Day</span><b>'+Math.floor(p.day)+' / ~'+st.ft+'</b></div>'+
     statBar('Health',p.health,100,'green')+statBar('Water',p.water)+statBar('Nutrition',p.nutrition)+statBar('Stress',p.stress)+
     (p.problems.length?'<p class="prob">⚠️ '+p.problems.map(esc).join(', ')+'</p>':'')+
     '<div class="p-actions">'+
     '<button class="btn btn-small" data-p="'+p.id+'" data-a="water">💧<br>WATER</button>'+
     '<button class="btn btn-small" data-p="'+p.id+'" data-a="feed">🧪<br>FEED</button>'+
     '<button class="btn btn-small" data-p="'+p.id+'" data-a="train">✂️<br>TRAIN</button>'+
     '<button class="btn btn-small" data-p="'+p.id+'" data-a="inspect">🔍<br>INSPECT</button>'+
     '<button class="btn btn-small btn-green" data-p="'+p.id+'" data-a="harvest" '+(s>=5?'':'disabled')+'>🌾<br>HARVEST</button>'+
     '</div></div>';
  });
  r.innerHTML=html;
  $('btn-plant').onclick=plantSeedModal;
  r.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>doAction(+b.dataset.p,b.dataset.a));
};

/* ---------------- Dispensary ---------------- */
let dispTab='flower';
function pricePerOz(it){
  const D=DIFFS[S.difficulty];
  const base=it.quality*2.4+it.potency*0.9;
  const repMult=1+S.reputation/2000;
  const typeMult=it.type==='concentrate'?6:it.type==='edible'?2.5:1;
  return Math.max(5,base*repMult*typeMult*D.econMult);
}
RENDER.dispensary=function(){
  const r=$('dispensary-root');
  let html=screenHead('🏪 DISPENSARY')+
   '<div class="tabs">'+
   ['flower','concentrate','edible'].map(t=>'<button class="tab'+(dispTab===t?' active':'')+'" data-tab="'+t+'">'+t.toUpperCase()+'S</button>').join('')+'</div>';
  const items=S.inventory.filter(i=>i.type===(dispTab==='flower'?'flower':dispTab));
  if(!items.length) html+='<div class="card"><p class="muted">Nothing here yet. '+(dispTab==='flower'?'Harvest some plants!':'Process flower in the FLOWER tab.')+'</p></div>';
  items.forEach(it=>{
    const ppo=pricePerOz(it), total=ppo*it.amount;
    html+='<div class="card"><h3>'+esc(it.strainName)+' <span class="badge gold">Q'+it.quality+'</span></h3>'+
     '<div class="kv"><span>Amount</span><b>'+it.amount+' '+(it.type==='edible'?'units':'oz')+'</b></div>'+
     '<div class="kv"><span>Potency</span><b>'+it.potency+'%</b></div>'+
     '<div class="kv"><span>Price</span><b>'+fmt$(ppo)+' / '+(it.type==='edible'?'unit':'oz')+'</b></div>'+
     '<div class="kv"><span>Total value</span><b>'+fmt$(total)+'</b></div>'+
     '<div class="btn-row"><button class="btn btn-small btn-green" data-sell="'+it.id+'">SELL ALL</button>'+
     (dispTab==='flower'?'<button class="btn btn-small" data-proc="'+it.id+'">⚗️ PROCESS</button>':'')+'</div></div>';
  });
  if(dispTab==='flower'&&items.length){
    html+='<div class="card"><h3>⚗️ PROCESSING</h3><p class="muted">Turn flower into concentrates (6x price, 18% yield, $30/oz) or edibles (2.5x price, 10 units/oz, $25/oz). Use PROCESS on an item above.</p></div>';
  }
  r.innerHTML=html;
  r.querySelectorAll('[data-tab]').forEach(t=>t.onclick=()=>{ dispTab=t.dataset.tab; RENDER.dispensary(); });
  r.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{
    const it=S.inventory.find(x=>x.id===+b.dataset.sell); if(!it) return;
    const total=pricePerOz(it)*it.amount;
    S.cash+=total; S.stats.lifetimeRevenue+=total; S.stats.sales++;
    gainXP(15); gainRep(2);
    if(S.stats.quickTurnReady){ S.stats.quickTurnarounds++; S.stats.quickTurnReady=false; }
    S.inventory=S.inventory.filter(x=>x.id!==it.id);
    toast('💵 Sold for '+fmt$(total));
    save(); updateHUD(); checkMissions(); checkAchievements(); RENDER.dispensary();
  });
  r.querySelectorAll('[data-proc]').forEach(b=>b.onclick=()=>{
    const it=S.inventory.find(x=>x.id===+b.dataset.proc); if(!it) return;
    const m=modal('<h3>⚗️ PROCESS '+esc(it.strainName)+'</h3><p>'+it.amount+' oz available.</p>'+
     '<label>Amount (oz)</label><input type="number" id="proc-amt" min="1" max="'+it.amount+'" value="1">'+
     '<div class="btn-row"><button class="btn btn-small btn-gold" id="proc-conc">CONCENTRATE<br><span class="muted">→18%/oz $30</span></button>'+
     '<button class="btn btn-small btn-gold" id="proc-ed">EDIBLES<br><span class="muted">→10u/oz $25</span></button></div>'+
     '<button class="btn btn-small" id="proc-x">CANCEL</button>');
    m.querySelector('#proc-x').onclick=()=>closeModal(m);
    const doProc=kind=>{
      const amt=clamp(+m.querySelector('#proc-amt').value||0,1,it.amount);
      const cost=kind==='concentrate'?30*amt:25*amt;
      if(S.cash<cost){ toast('❌ Need '+fmt$(cost)+'.'); return; }
      S.cash-=cost; it.amount=Math.round((it.amount-amt)*10)/10;
      const outAmt=kind==='concentrate'?Math.round(amt*0.18*10)/10:Math.round(amt*10);
      S.inventory.push({ id:S.nextInvId++, strainId:it.strainId, strainName:it.strainName, amount:outAmt,
        quality:it.quality, potency:Math.min(100,it.potency+8), terpenes:it.terpenes, bagAppeal:it.bagAppeal,
        resin:it.resin, type:kind, custom:it.custom });
      if(it.amount<=0) S.inventory=S.inventory.filter(x=>x.id!==it.id);
      S.stats.processedOz+=amt; gainXP(10);
      closeModal(m); toast('⚗️ Processed '+amt+' oz → '+outAmt+' '+(kind==='concentrate'?'oz concentrate':'edible units'));
      save(); updateHUD(); checkMissions(); RENDER.dispensary();
    };
    m.querySelector('#proc-conc').onclick=()=>doProc('concentrate');
    m.querySelector('#proc-ed').onclick=()=>doProc('edible');
  });
};

/* ---------------- Empire ---------------- */
let empireTab='facilities';
function equipCost(def,lvl){
  const disc=S.crew.manager?0.9:1;
  return Math.round(def.base*Math.pow(2.2,lvl-1)*disc);
}
RENDER.empire=function(){
  const r=$('empire-root');
  let html=screenHead('🏭 EMPIRE')+'<div class="tabs">'+
   [['facilities','FACILITIES'],['equipment','EQUIPMENT'],['crew','CREW'],['compete','COMPETE']].map(t=>'<button class="tab'+(empireTab===t[0]?' active':'')+'" data-etab="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>';
  if(empireTab==='facilities'){
    html+='<div class="card"><p class="muted">Current: <b>'+FACILITIES[S.facility].name+'</b> ('+FACILITIES[S.facility].slots+' slots)</p></div>';
    FACILITIES.forEach((f,i)=>{
      const owned=i<=S.facility, next=i===S.facility+1;
      html+='<div class="card"><h3>'+(owned?'✅ ':'')+f.name+'</h3><div class="kv"><span>Grow slots</span><b>'+f.slots+'</b></div>'+
       (owned?'<p class="muted">Owned.</p>':next?'<button class="btn btn-small btn-gold" data-buyfac="'+i+'">EXPAND — '+fmt$(f.cost)+'</button>':'<p class="lock-note">🔒 Expand in order.</p>')+'</div>';
    });
  }else if(empireTab==='equipment'){
    EQUIP_DEFS.forEach(d=>{
      const lvl=S.equipment[d.id], maxed=lvl>=d.max;
      html+='<div class="card"><h3>'+d.name+' <span class="badge">Lv '+lvl+'/'+d.max+'</span></h3><p class="muted">'+d.desc+'</p>'+
       (maxed?'<p class="muted">MAXED OUT.</p>':'<button class="btn btn-small btn-gold" data-buye="'+d.id+'">UPGRADE — '+fmt$(equipCost(d,lvl))+'</button>')+'</div>';
    });
  }else if(empireTab==='crew'){
    html+='<p class="muted">Crew members charge a daily wage, deducted each day.</p>';
    CREW_DEFS.forEach(c=>{
      const hired=S.crew[c.id];
      html+='<div class="card"><h3>'+(hired?'✅ ':'')+c.name+'</h3><p class="muted">'+c.desc+'</p>'+
       '<div class="kv"><span>Hire cost</span><b>'+fmt$(c.hire)+'</b></div><div class="kv"><span>Daily wage</span><b>'+fmt$(c.wage)+'</b></div>'+
       (hired?'<p class="muted">On payroll.</p>':'<button class="btn btn-small btn-green" data-hire="'+c.id+'">HIRE</button>')+'</div>';
    });
  }else{
    html+=competeHtml();
  }
  r.innerHTML=html;
  r.querySelectorAll('[data-etab]').forEach(t=>t.onclick=()=>{ empireTab=t.dataset.etab; RENDER.empire(); });
  r.querySelectorAll('[data-buyfac]').forEach(b=>b.onclick=()=>{
    const i=+b.dataset.buyfac, f=FACILITIES[i];
    if(S.cash<f.cost){ toast('❌ Need '+fmt$(f.cost)+'.'); return; }
    S.cash-=f.cost; S.facility=i; gainXP(150); gainRep(20);
    toast('🏭 Expanded to '+f.name+'!');
    save(); updateHUD(); checkMissions(); RENDER.empire();
  });
  r.querySelectorAll('[data-buye]').forEach(b=>b.onclick=()=>{
    const d=EQUIP_DEFS.find(x=>x.id===b.dataset.buye), lvl=S.equipment[d.id], cost=equipCost(d,lvl);
    if(S.cash<cost){ toast('❌ Need '+fmt$(cost)+'.'); return; }
    S.cash-=cost; S.equipment[d.id]++; gainXP(40);
    toast('⬆️ '+d.name+' → Lv '+S.equipment[d.id]);
    save(); updateHUD(); checkMissions(); RENDER.empire();
  });
  r.querySelectorAll('[data-hire]').forEach(b=>b.onclick=()=>{
    const c=CREW_DEFS.find(x=>x.id===b.dataset.hire);
    if(S.cash<c.hire){ toast('❌ Need '+fmt$(c.hire)+'.'); return; }
    S.cash-=c.hire; S.crew[c.id]=true; gainXP(60);
    toast('🤝 Hired '+c.name);
    save(); updateHUD(); checkMissions(); RENDER.empire();
  });
  wireCompete(r);
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
  const flowers=S.inventory.filter(i=>i.type==='flower');
  let html='<div class="card"><p class="muted">Enter your best flower against AI growers. Entry fees apply. Breeder Cup requires a CUSTOM cross.</p></div>';
  COMP_TYPES.forEach(t=>{
    const fee=t.id==='breeder'?300:150;
    html+='<div class="card"><h3>'+t.name+'</h3><p class="muted">'+t.desc+'</p>'+
     '<div class="kv"><span>Entry fee</span><b>'+fmt$(fee)+'</b></div>'+
     '<button class="btn btn-small btn-primary" data-comp="'+t.id+'">ENTER — '+fmt$(fee)+'</button></div>';
  });
  return html;
}
function wireCompete(r){
  r.querySelectorAll('[data-comp]').forEach(b=>b.onclick=()=>{
    const t=COMP_TYPES.find(x=>x.id===b.dataset.comp);
    const fee=t.id==='breeder'?300:150;
    if(S.cash<fee){ toast('❌ Need '+fmt$(fee)+' entry fee.'); return; }
    let pool=S.inventory.filter(i=>i.type==='flower');
    if(t.id==='breeder') pool=pool.filter(i=>i.custom);
    if(!pool.length){ toast(t.id==='breeder'?'❌ You need a harvested CUSTOM cross to enter.':'❌ No flower in inventory. Harvest first!'); return; }
    const m=modal('<h3>'+t.name+'</h3><p>Choose your entry:</p><div id="comp-pick"></div><button class="btn btn-small" id="comp-x">CANCEL</button>');
    m.querySelector('#comp-x').onclick=()=>closeModal(m);
    m.querySelector('#comp-pick').innerHTML=pool.map(i=>'<div class="strain-pick" data-entry="'+i.id+'"><b>'+esc(i.strainName)+'</b> — Q'+i.quality+' • '+i.amount+'oz</div>').join('');
    m.querySelectorAll('[data-entry]').forEach(e=>e.onclick=()=>{
      const item=S.inventory.find(x=>x.id===+e.dataset.entry);
      closeModal(m); runCompetition(t,item,fee);
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
  let html='<h3>'+t.name+' — RESULTS</h3>';
  rivals.forEach((rv,i)=>{ html+='<div class="leader-row'+(rv.me?' me':'')+'"><span>'+(i+1)+'. '+esc(rv.name)+'</span><b>'+rv.score+'</b></div>'; });
  if(won){
    const cashR=Math.round(800*DIFFS[S.difficulty].missionReward), repR=60;
    S.cash+=cashR; gainRep(repR); S.stats.compsWon++;
    if(t.id==='breeder') S.stats.breederCupWins++;
    addP0('freedom',3); addP0('cultivation',2); gainXP(200);
    html+='<p class="reward-line">🏆 YOU WIN! +'+fmt$(cashR)+' +'+repR+' rep</p>';
    if(t.id==='breeder'&&Math.random()<0.5){ unlockStrain('crown-jewel'); html+='<p class="reward-line">👑 Rare genetics unlocked: Crown Jewel!</p>'; }
    toast('🏆 Competition WON!');
  }else{
    gainXP(40);
    html+='<p class="muted">Placed #'+rank+'. Better luck next time — the judges want higher '+(t.score==='overall'?'overall excellence':t.score)+'.</p>';
  }
  html+='<button class="btn" onclick="this.closest(\'.modal-back\').remove()">CLOSE</button>';
  modal(html);
  save(); updateHUD(); checkMissions(); checkAchievements();
}

/* ---------------- Project 0 ---------------- */
RENDER.project0=function(){
  const r=$('project0-root');
  let html=screenHead('🕊️ PROJECT 0')+
   '<div class="card" style="text-align:center"><div class="crown-big small">👑</div>'+
   '<p class="motto" style="font-size:16px">"IT\'S NEVER ABOUT THE MONEY."</p>'+
   '<p><span class="badge gold">'+S.project0.points+' POINTS</span></p>'+
   (S.project0.titles.length?'<div class="tags" style="justify-content:center">'+S.project0.titles.map(t=>'<span class="tag gold">'+esc(t)+'</span>').join('')+'</div>':'')+'</div>';
  P0_TRACKS.forEach(tr=>{
    const pts=S.project0.tracks[tr.id]||0, lvl=p0Level(tr.id);
    const nextTh=P0_LEVEL_PTS[Math.min(lvl+1,P0_LEVEL_PTS.length-1)];
    const pct=lvl>=5?100:clamp(pts/nextTh*100,0,100);
    html+='<div class="card"><h3>'+tr.ico+' '+tr.name+' <span class="badge gold">Lv '+lvl+'</span></h3>'+
     '<div class="progress"><i style="width:'+pct+'%"></i></div>'+
     '<p class="muted">'+pts+' pts'+(lvl<5?' — '+nextTh+' for Lv '+(lvl+1):' — MAXED')+'</p></div>';
  });
  html+='<div class="card"><h3>HOW TO EARN</h3><p class="muted">🧬 Breeding • 🏦 Preserving genetics • 🌾 85+ quality harvests • 💎 90+ keepers • 🏆 Missions & competitions • 👑 Discovering keeper phenotypes</p></div>';
  r.innerHTML=html;
};

/* ---------------- Missions screen ---------------- */
let missionTab='active';
function missionProg(m){
  try{ const p=m.prog(S); return {cur:clamp(p[0],0,p[1]),target:p[1]}; }catch(e){ return {cur:0,target:1}; }
}
RENDER.missions=function(){
  const r=$('missions-root');
  const cats={};
  MISSIONS.forEach(m=>{ (cats[m.cat]=cats[m.cat]||[]).push(m); });
  let html=screenHead('🏆 MISSIONS')+
   '<div class="tabs">'+[['active','ACTIVE'],['available','AVAILABLE'],['completed','COMPLETED']].map(t=>'<button class="tab'+(missionTab===t[0]?' active':'')+'" data-mtab="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>';
  Object.keys(cats).forEach(cat=>{
    let list='';
    cats[cat].forEach(m=>{
      const done=S.missionsDone.includes(m.id);
      const pr=missionProg(m);
      const started=pr.cur>0;
      const showIt=(missionTab==='completed'&&done)||(missionTab==='active'&&!done&&started)||(missionTab==='available'&&!done&&!started);
      if(!showIt) return;
      const rw=m.reward||{};
      const rwTxt=[rw.cash?fmt$(Math.round(rw.cash*DIFFS[S.difficulty].missionReward)):'',rw.rep?'+'+rw.rep+' rep':'',rw.xp?'+'+rw.xp+' XP':'',rw.p0?'+'+rw.p0+' P0':'',(rw.gen||[]).length?'🧬 genetics':''].filter(Boolean).join(' • ');
      list+='<div class="card"><span class="mission-cat">'+cat+'</span><h3 style="margin-top:4px">'+(done?'✅ ':'')+esc(m.name)+'</h3><p class="muted">'+esc(m.desc)+'</p>'+
       '<div class="progress"><i style="width:'+clamp(pr.cur/pr.target*100,0,100)+'%"></i></div>'+
       '<p class="muted">'+Math.min(pr.cur,pr.target)+'/'+pr.target+'</p>'+
       (rwTxt?'<p class="reward-line">Reward: '+rwTxt+'</p>':'')+'</div>';
    });
    if(list) html+='<h3 style="color:var(--gold);margin:14px 0 4px">'+cat.toUpperCase()+'</h3>'+list;
  });
  if(missionTab==='completed'&&!S.missionsDone.length) html+='<div class="card"><p class="muted">No missions completed yet. Get growing!</p></div>';
  r.innerHTML=html;
  r.querySelectorAll('[data-mtab]').forEach(t=>t.onclick=()=>{ missionTab=t.dataset.mtab; RENDER.missions(); });
};
