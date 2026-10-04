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
  { id:'lights',    name:'Lights',            ic:'light',   max:5, base:400,  desc:'+6% yield potential per level. Wider light tolerance.' },
  { id:'hvac',      name:'HVAC',              ic:'temp',    max:5, base:500,  desc:'+8% temperature tolerance per level.' },
  { id:'humid',     name:'Humidification',    ic:'humid',   max:5, base:300,  desc:'+8% low-humidity tolerance per level.' },
  { id:'dehumid',   name:'Dehumidification',  ic:'drop',    max:5, base:300,  desc:'+8% high-humidity tolerance per level.' },
  { id:'co2sys',    name:'CO2 System',        ic:'co2',     max:5, base:600,  desc:'+4% growth speed & quality per level.' },
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
 {id:'a-allstrain',name:'🌿 Living Library',desc:'Unlock every strain.',t:s=>unlockedCount(s)>=STRAINS.length+s.customStrains.length&&STRAINS.every(st=>!s.lockedStrains.includes(st.id))},
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
      missionsDone:0,maxConcurrent:0,strainGrown:{},preserved:0,
      phenoTested:0,phenoHarvested:0,eliteFound:0,legendaryFound:0,clonesTaken:0,cloneHarvests:0,
      phenoHuntsDone:0,huntsCompleted10:0,keepersFound:0,mothersCreated:0,comparesDone:0,
      keeperCapUpgrades:0,vaultFilledOnce:0,provenCut:0,bestPhenoScore:0 },
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
  /* --- Phenotype / keeper fields (legacy saves get safe defaults) --- */
  if(!S.phenoCounters||typeof S.phenoCounters!=='object') S.phenoCounters={};
  Object.keys(S.phenoCounters).forEach(k=>{ S.phenoCounters[k]=Math.max(0,int(S.phenoCounters[k],0)); });
  if(!Array.isArray(S.keepers)) S.keepers=[];
  S.keeperCapacity=Math.max(1,int(S.keeperCapacity,3)); S.keeperCapLevel=clamp(int(S.keeperCapLevel,0),0,4);
  if(!Array.isArray(S.mothers)) S.mothers=[];
  S.motherCapacity=clamp(int(S.motherCapacity,1),1,4);
  if(!Array.isArray(S.phenoHunts)) S.phenoHunts=[];
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
  /* --- Builder C: Empire-depth namespace --- */
  try{ if(typeof EX_normalizeEx==='function') EX_normalizeEx(); }catch(e){}
  try{ if(typeof WX_init==='function') WX_init(); }catch(e){}
  try{ if(typeof GX_init==='function') GX_init(); }catch(e){}
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
gasmask:'<g fill="currentColor" stroke="none"><path d="M32 4C20 4 12 13 12 26c0 8 4 14.5 10 18l3 8h14l3-8c6-3.5 10-10 10-18C52 13 44 4 32 4z"/><circle cx="23" cy="26" r="7.5" fill="#0b0b0b"/><circle cx="41" cy="26" r="7.5" fill="#0b0b0b"/><circle cx="23" cy="26" r="3" fill="#ff3b3b"/><circle cx="41" cy="26" r="3" fill="#ff3b3b"/><rect x="27" y="36" width="10" height="8" rx="3" fill="#0b0b0b"/><path d="M14 12l4 3M50 12l-4 3" stroke="currentColor" stroke-width="3"/></g>',
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
scroll:'<path d="M7 3.5h11a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7z"/><path d="M7 3.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2"/><path d="M10 8.5h6M10 12h6"/>'
};
function icon(n,cls){
  const p=ICONS[n];
  if(!p) return '<span class="ic-missing"></span>';
  const filled=(n==='crown-red'||n==='crown-gold'||n==='gasmask'||n==='project0');
  return '<svg class="ic '+(cls||'')+'" viewBox="0 0 24 24" '+(filled?'':'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"')+' aria-hidden="true">'+p+'</svg>';
}

/* ---- deterministic RNG for procedural art ---- */
function sHash(s){ let h=2166136261; s=String(s); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function sRng(seed){ let a=sHash(seed); return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

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
  inner+='<ellipse cx="60" cy="112" rx="26" ry="6" fill="#0c0a08"/>';
  inner+='<path d="M36 108 h48 l-4 24 a4 4 0 0 1-4 4 H44 a4 4 0 0 1-4-4 z" fill="url(#potg'+uid+')" stroke="#000"/>';
  inner+='<rect x="33" y="103" width="54" height="8" rx="3" fill="#3a0d0d" stroke="#7a0d0d" stroke-width="1"/>';
  const baseY=104;
  const leafC=o.defic?['#7a8a3a','#8a9a42','#6e7e32']:['#2e6b34','#35793b','#2a6130'];
  const droop=(o.wilt||o.overwater)?34:0;
  function leaf(x,y,len,ang,c){
    const w=len*0.42, a=ang+(ang<0?-droop:droop*0.4)+(ang>90?droop:-droop*0.3);
    return '<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+a.toFixed(1)+')">'+
      '<path d="M0 0 Q '+(len*0.32).toFixed(1)+' '+(-w).toFixed(1)+' '+len.toFixed(1)+' 0 Q '+(len*0.32).toFixed(1)+' '+w.toFixed(1)+' 0 0" fill="'+c+'"/>'+
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
      inner+=leaf(tx,ty,15,-90,leafC[1])+leaf(tx,ty-2,12,-64,leafC[2])+leaf(tx,ty-2,12,-116,leafC[0]);
    }
    if(s>=9){ for(let i=0;i<10;i++){ inner+='<circle cx="'+(42+R()*36).toFixed(1)+'" cy="'+(ty+R()*(baseY-ty)).toFixed(1)+'" r="'+(0.8+R()).toFixed(1)+'" fill="#fff" opacity="'+(0.4+R()*0.5).toFixed(2)+'"/>'; } }
  }
  if(o.heat) inner+='<rect x="0" y="0" width="120" height="140" fill="#ff7a1a" opacity="0.10"/>';
  inner+='<rect x="0" y="0" width="120" height="140" fill="url(#rimx'+uid+')" opacity="0"/>';
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
 {id:'equipment',label:'EQUIPMENT DEPOT',x:322,y:272,go:'empire',tab:'equipment',un:()=>S.facility>=1,hint:'Expand your facility'}
];
function empireHubSVG(){
  let s='<svg class="hub-map" viewBox="0 0 400 320" role="img" aria-label="Empire compound map">';
  s+='<defs><radialGradient id="hubgl" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff3b3b" stop-opacity="0.28"/><stop offset="1" stop-color="#ff3b3b" stop-opacity="0"/></radialGradient></defs>';
  s+='<rect x="0" y="0" width="400" height="320" fill="#0b090a"/>';
  s+='<path d="M200 56 L200 128 M200 128 L78 128 M200 128 L322 128 M78 128 L78 200 M322 128 L322 200 M78 200 L200 200 L322 200 M78 200 L78 272 M200 200 L200 272 M322 200 L322 272" stroke="#2c2c30" stroke-width="7" fill="none"/>';
  s+='<path d="M200 56 L200 128 M200 128 L78 128 M200 128 L322 128 M78 128 L78 200 M322 128 L322 200 M78 200 L200 200 L322 200 M78 200 L78 272 M200 200 L200 272 M322 200 L322 272" stroke="#e02020" stroke-width="1.2" opacity="0.4" fill="none"/>';
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
const FAC_TIER_MAP=[0,2,4,3,5,7]; /* S.facility index -> visual tier */
function facTierIdx(){ return FAC_TIER_MAP[clamp(int(S.facility,0),0,5)]; }
function avgEquip(){ const q=S.equipment,ks=Object.keys(q); return ks.reduce((a,k)=>a+num(q[k],1),0)/Math.max(1,ks.length); }
/* parameterized facility scene: equipment visibly changes the room */
function facilitySceneSVG(tier){
  if(!S) return '';
  const T=FAC_TIERS[clamp(int(tier,0),0,8)], q=S.equipment;
  const light=clamp(num(S.env.light,80),0,100), glow=(0.18+light/100*0.75).toFixed(2);
  const hot=S.env.temp>86, cold=S.env.temp<64;
  const nL=T.lights, W=400, H=150;
  let h='<svg class="fac-scene" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid slice" aria-hidden="true">';
  h+='<defs><radialGradient id="flg" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff5a5a" stop-opacity="'+glow+'"/><stop offset="1" stop-color="#ff5a5a" stop-opacity="0"/></radialGradient>'+
     '<linearGradient id="fwl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#171114"/><stop offset="1" stop-color="#0a0708"/></linearGradient></defs>';
  h+='<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="url(#fwl)"/>';
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
    h+='<ellipse cx="'+x+'" cy="86" rx="58" ry="52" fill="url(#flg)"/>';
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
  if(cold) h+='<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="#4a7aff" opacity="0.06"/>';
  return h+'</svg>';
}
/* FACILITY UNLOCKED reveal: before/after cinematic */
function facilityUnlockCine(prevT,newT,name){
  const back=cineOverlay(
   '<div class="fac-cine"><div class="display fac-cine-title">FACILITY UNLOCKED</div>'+
   '<div class="fac-before"><span>BEFORE</span>'+facilitySceneSVG(prevT)+'<b>'+esc(FAC_TIERS[prevT].name)+'</b></div>'+
   '<div class="fac-arrow">\u2192</div>'+
   '<div class="fac-after"><span>NOW</span>'+facilitySceneSVG(newT)+'<b>'+esc(name)+'</b></div>'+
   '<p class="muted">+'+FACILITIES[clamp(int(S.facility,0),0,5)].slots+' grow slots</p></div>',
   'cine-facility',3600);
  return back;
}
/* ---------------- 10-stage helpers ---------------- */
const VIS_STAGES=['SEED','SPROUT','SEEDLING','EARLY VEG','VEG','LATE VEG','EARLY FLOWER','MID FLOWER','LATE FLOWER','HARVEST READY'];
function visStageOf(p){
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
function flowerSVG(seedStr,cls){
  const R=sRng('flower|'+seedStr);
  const purp=R()<0.45;
  let inner='<defs><radialGradient id="bg'+sHash(seedStr)%991+'" cx="0.5" cy="0.42" r="0.75"><stop offset="0" stop-color="#2a1215"/><stop offset="1" stop-color="#0b0b0c"/></radialGradient></defs>';
  inner+='<rect x="0" y="0" width="120" height="120" fill="url(#bg'+sHash(seedStr)%991+')"/>';
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
  inner+='<rect x="0" y="86" width="120" height="34" fill="url(#sh'+sHash(seedStr)%991+')" opacity="0"/>';
  return '<svg class="flower-art '+(cls||'')+'" viewBox="0 0 120 120" aria-hidden="true">'+inner+'</svg>';
}
/* ---- grow-room scene banner: lights react to S.env ---- */
function roomSceneSVG(){
  if(!S) return '';
  const light=clamp(num(S.env.light,80),0,100), glow=(0.18+light/100*0.75).toFixed(2);
  const hot=S.env.temp>86, cold=S.env.temp<64;
  let h='<svg class="room-scene" viewBox="0 0 400 130" preserveAspectRatio="xMidYMid slice" aria-hidden="true">';
  h+='<defs><radialGradient id="lg" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff5a5a" stop-opacity="'+glow+'"/><stop offset="1" stop-color="#ff5a5a" stop-opacity="0"/></radialGradient>'+
     '<linearGradient id="hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.05"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>';
  h+='<rect x="0" y="0" width="400" height="130" fill="#0a0708"/>';
  for(let i=0;i<9;i++) h+='<rect x="'+(i*50-10)+'" y="0" width="2" height="130" fill="#ffffff" opacity="0.025"/>';
  h+='<rect x="0" y="14" width="400" height="7" fill="#1c1c1e" stroke="#333"/>'; /* ducting */
  h+='<circle cx="352" cy="60" r="13" fill="none" stroke="#3a3a3e" stroke-width="4"/><path d="M352 47v26M339 60h26M343 51l18 18M361 51l-18 18" stroke="#3a3a3e" stroke-width="2.5"/>'; /* fan */
  [70,200,330].forEach(x=>{
    h+='<rect x="'+(x-46)+'" y="26" width="92" height="9" rx="2" fill="#151517" stroke="#7a0d0d"/>';
    for(let b=0;b<6;b++) h+='<rect x="'+(x-40+b*14)+'" y="28" width="10" height="5" fill="#ff6b6b" opacity="'+(0.35+light/100*0.65).toFixed(2)+'"/>';
    h+='<ellipse cx="'+x+'" cy="78" rx="72" ry="46" fill="url(#lg)"/>';
    h+='<path d="M'+(x-46)+' 35v-8M'+(x+46)+' 35v-8" stroke="#444" stroke-width="3"/>';
  });
  h+='<rect x="0" y="0" width="400" height="130" fill="url(#hz)"/>';
  /* plant row silhouettes */
  for(let i=0;i<8;i++){ const x=18+i*48, hh=26+((i*37)%3)*8;
    h+='<path d="M'+x+' 130 v-'+hh+' m0 0 c-9 -4 -12 -12 -8 -20 c6 2 9 10 8 20z m0 0 c9 -4 12 -12 8 -20 c-6 2 -9 10 -8 20z" fill="#12240f" stroke="#1d3a1a" stroke-width="1"/>';
    h+='<rect x="'+(x-9)+'" y="122" width="18" height="8" fill="#141414"/>'; }
  if(hot) h+='<rect x="0" y="0" width="400" height="130" fill="#ff5a1a" opacity="0.10" class="room-warn-hot"/>';
  if(cold) h+='<rect x="0" y="0" width="400" height="130" fill="#4a7aff" opacity="0.06"/>';
  return h+'</svg>';
}
/* ---- brand marks ---- */
function crownSVG(gold,cls){
  const c=gold?'#d4a017':'#e02020';
  return '<svg class="crown-svg '+(cls||'')+'" viewBox="0 0 48 34" aria-hidden="true">'+
   '<defs><linearGradient id="crw'+(gold?'g':'r')+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+(gold?'#f4d35e':'#ff5a5a')+'"/><stop offset="1" stop-color="'+c+'"/></linearGradient></defs>'+
   '<path d="M4 10l7 5.5L24 6l13 9.5L44 10 40.5 28h-33z" fill="url(#crw'+(gold?'g':'r')+')" stroke="#000" stroke-width="1"/>'+
   '<rect x="7.5" y="29" width="33" height="3" rx="1.5" fill="'+c+'"/>'+
   '<circle cx="4" cy="9" r="2.4" fill="'+c+'"/><circle cx="24" cy="5" r="2.4" fill="'+c+'"/><circle cx="44" cy="9" r="2.4" fill="'+c+'"/>'+
   '<circle cx="24" cy="19" r="2.6" fill="'+(gold?'#7a0d0d':'#ffd7d7')+'"/></svg>';
}
function gasmaskSVG(cls){
  return '<svg class="gasmask-svg '+(cls||'')+'" viewBox="0 0 64 64" aria-hidden="true">'+
   '<defs><radialGradient id="gmz" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff3b3b"/><stop offset="1" stop-color="#7a0d0d"/></radialGradient></defs>'+
   '<path d="M32 5C20.5 5 13 13.5 13 26c0 7.8 3.8 14 9.6 17.4L25.5 51h13l2.9-7.6C47.2 40 51 33.8 51 26 51 13.5 43.5 5 32 5z" fill="#161616" stroke="#e02020" stroke-width="2"/>'+
   '<circle cx="23.5" cy="26" r="7" fill="#050505" stroke="#333" stroke-width="1.5"/><circle cx="40.5" cy="26" r="7" fill="#050505" stroke="#333" stroke-width="1.5"/>'+
   '<circle cx="23.5" cy="26" r="3.4" fill="url(#gmz)"/><circle cx="40.5" cy="26" r="3.4" fill="url(#gmz)"/>'+
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
  const back=document.createElement('div'); back.className='cine-back '+(cls||'');
  back.innerHTML='<div class="cine-stage">'+inner+'</div>';
  root.appendChild(back);
  if(ms!==0) setTimeout(()=>{ back.classList.add('cine-out'); setTimeout(()=>back.remove(),450); }, ms||4200);
  back.addEventListener('click',()=>{ back.classList.add('cine-out'); setTimeout(()=>back.remove(),300); });
  return back;
}
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
const SCREENS=['splash','difficulty','menu','home','grow','grows','genetics','dispensary','breeding','project0','empire','missions','challenges','achievements','leaderboards','locations','keepers','settings'];
const RENDER={};
let current='splash';
function show(name){
  if(!SCREENS.includes(name)) name='menu';
  try{ if(typeof closeFocus==='function') closeFocus(); }catch(e){}
  SCREENS.forEach(s=>$('scr-'+s).classList.add('hidden'));
  $('scr-'+name).classList.remove('hidden');
  current=name;
  const chrome = (name!=='splash'&&name!=='difficulty');
  $('hud').classList.toggle('hidden',!chrome);
  $('bottomnav').classList.toggle('hidden',!chrome);
  document.querySelectorAll('#bottomnav button').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));
  if(RENDER[name]) RENDER[name]();
  /* expansion: active global-event banner on grow + dashboard screens */
  try{
    if((name==='grow'||name==='home')&&typeof WX_bannerHTML==='function'){
      const bn=WX_bannerHTML();
      if(bn){ const sec=$('scr-'+name); const d=document.createElement('div'); d.innerHTML=bn; sec.insertBefore(d,sec.firstChild); }
    }
  }catch(e){}
  try{ document.body.dataset.screen=name; }catch(e){}
  window.scrollTo(0,0);
}
function screenHead(ico,title){
  return '<div class="screenhead"><button class="backbtn" onclick="show(\'menu\')">'+icon('x')+'<span>MENU</span></button><h2>'+icon(ico,'sh-ico')+esc(title)+'</h2></div>';
}
let _hudPrev={cash:0,rep:0,xp:0,level:1,day:1};
function hudFloat(text,cls){
  const hud=$('hud'); if(!hud) return;
  const f=document.createElement('div'); f.className='hud-float '+(cls||''); f.textContent=text;
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
    elC.innerHTML=icon('cash','hud-ico')+'<span>'+fmt$(cash)+'</span>';
  }
  if(elR) elR.innerHTML=icon('rep','hud-ico')+'<span>'+rep+'</span>';
  if(elL) elL.innerHTML=icon('level','hud-ico')+'<span>'+lvl+'</span>';
  if(elD) elD.innerHTML=icon('day','hud-ico')+'<span>'+day+'</span>';
  _hudPrev={cash:cash,rep:rep,xp:num(S.xp,0),level:lvl,day:day};
}
function levelUpOverlay(lvl){
  cineOverlay('<div class="lvlup">'+crownSVG(true,'lvlup-crown')+
   '<div class="display lvlup-title">LEVEL UP</div>'+
   '<div class="lvlup-sub">LEVEL '+lvl+' &mdash; THE EMPIRE GROWS</div></div>','cine-levelup',2600);
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
  show('home'); updateHUD(); save();
  toast('👑 Welcome to the Empire, '+D.name+'!');
}
RENDER.difficulty=function(){
  $('diff-list').innerHTML=Object.keys(DIFFS).map(k=>{
    const d=DIFFS[k];
    return '<div class="diff-card" data-d="'+k+'"><div class="diff-crown">'+crownSVG(false,'c-ico-svg')+'</div><h3>'+d.name+'</h3><p class="muted">'+d.desc+'</p>'+
      '<div class="kv"><span>'+icon('cash','kv-ico')+'Starting cash</span><b>'+fmt$(d.cash)+'</b></div>'+
      '<div class="kv"><span>'+icon('star','kv-ico')+'Mission rewards</span><b>x'+d.missionReward+'</b></div></div>';
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
  const openMissions=MISSIONS.filter(m=>!S.missionsDone.includes(m.id)).length;
  let html='<div class="menu-hero">'+
    '<div class="hero-scene">'+roomSceneSVG()+'<div class="hero-haze"></div></div>'+
    '<div class="hero-brand">'+crownSVG(false,'hero-crown')+
    '<div class="logo-text display">SHOCKER OWNZ</div><div class="logo-sub display">GROW EMPIRE</div>'+
    '<div class="tagline">PLANT &bull; GROW &bull; BREED &bull; HARVEST &bull; BUILD</div></div></div>';
  html+='<div class="menu-grid">';
  MENU_ITEMS.forEach(mi=>{
    let badge='';
    if(mi.id==='missions'&&openMissions>0) badge='<span class="m-badge">'+openMissions+'</span>';
    html+='<button class="menu-btn" data-go="'+mi.id+'"><span class="m-ico">'+icon(mi.ico,'ic-xl')+'</span><span class="m-label">'+mi.label+'</span>'+badge+'</button>';
  });
  html+='</div>'+nextUpCard();
  const lvl=Math.max(1,int(S.level,1)), xp=num(S.xp,0), xpN=xpNeed(lvl);
  const fi=clamp(int(S.facility,0),0,FACILITIES.length-1);
  html+='<div class="card status-card"><div class="kv"><span>Level '+lvl+' &mdash; '+Math.max(0,xpN-xp)+' XP to next</span><b>'+xp+'/'+xpN+'</b></div>'+
    '<div class="xpbar"><i style="width:'+clamp(xp/xpN*100,0,100)+'%"></i></div>'+
    '<div class="kv"><span>'+icon('empire','kv-ico')+' Facility</span><b>'+esc(FAC_TIERS[facTierIdx()].name)+'</b></div>'+
    '<div class="kv"><span>'+icon('grow','kv-ico')+' Plants growing</span><b>'+S.plants.length+'/'+FACILITIES[fi].slots+'</b></div>'+
    '<div class="kv"><span>'+icon('genetics','kv-ico')+' Genetics unlocked</span><b>'+unlockedCount(S)+'/'+allStrains().length+'</b></div>'+
    (Array.isArray(S.titles)&&S.titles.length?'<div class="tags">'+S.titles.map(t=>'<span class="tag gold">'+esc(t)+'</span>').join('')+'</div>':'')+'</div>';
  html+='<p class="motto">&ldquo;IT&rsquo;S NEVER ABOUT THE MONEY.&rdquo; &mdash; PROJECT 0</p>';
  $('menu-buttons').innerHTML=html;
  document.querySelectorAll('#menu-buttons .menu-btn').forEach(b=>b.onclick=()=>show(b.dataset.go));
  const gm=document.querySelector('#menu-buttons [data-go-missions]'); if(gm) gm.onclick=()=>show('missions');
};

/* ---------------- Settings ---------------- */
RENDER.settings=function(){
  const r=$('settings-root');
  r.innerHTML=screenHead('settings','SETTINGS')+
   '<div class="card"><h3>'+icon('preserve','ic-lg')+'SAVE DATA</h3>'+
   '<div class="btn-row"><button class="btn btn-small" id="set-save">'+icon('check','b-ico')+'SAVE NOW</button>'+
   '<button class="btn btn-small" id="set-export">'+icon('scroll','b-ico')+'EXPORT SAVE (JSON)</button>'+
   '<button class="btn btn-small" id="set-import">'+icon('jar','b-ico')+'IMPORT SAVE (JSON)</button>'+
   '<button class="btn btn-small btn-danger" id="set-reset">'+icon('warn','b-ico')+'RESET GAME</button></div></div>'+
   '<div class="card"><h3>'+icon('trophy','ic-lg')+'ACHIEVEMENTS ('+S.achievements.length+'/'+ACHIEVEMENTS.length+')</h3>'+
   ACHIEVEMENTS.map(a=>'<div class="kv"><span class="ach-ico">'+(S.achievements.includes(a.id)?icon('check','kv-ico'):icon('lock','kv-ico'))+'</span><span>'+esc(a.name)+'<br><span class="muted">'+esc(a.desc)+'</span></span></div>').join('')+'</div>'+
   '<div class="card"><h3>'+icon('inspect','ic-lg')+'LIFETIME STATS</h3>'+
   '<div class="kv"><span>Days survived</span><b>'+S.day+'</b></div>'+
   '<div class="kv"><span>Lifetime harvest</span><b>'+num(S.stats.lifetimeHarvestOz,0).toFixed(1)+' oz</b></div>'+
   '<div class="kv"><span>Lifetime revenue</span><b>'+fmt$(S.stats.lifetimeRevenue)+'</b></div>'+
   '<div class="kv"><span>Best quality</span><b>'+Math.round(S.stats.bestQuality)+'</b></div>'+
   '<div class="kv"><span>Crosses created</span><b>'+S.stats.crosses+'</b></div>'+
   '<div class="kv"><span>Competitions won</span><b>'+S.stats.compsWon+'</b></div>'+
   '<div class="kv"><span>Missions completed</span><b>'+int(S.stats.missionsDone,0)+'/'+MISSIONS.length+' ('+Math.round(int(S.stats.missionsDone,0)/MISSIONS.length*100)+'%)</b></div></div>'+
   '<div class="card"><p class="muted display">SHOCKER OWNZ GROW EMPIRE v2.0 &mdash; VISUAL OVERHAUL<br>PLANT &bull; GROW &bull; BREED &bull; HARVEST &bull; BUILD</p></div>';
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
  try{ if(typeof WX_init==='function') WX_init(); }catch(e){}
  try{ if(typeof GX_init==='function') GX_init(); }catch(e){}
  try{ if(typeof EX_init==='function') EX_init(); }catch(e){}
  $('btn-enter').onclick=()=>{ if(S.started) show('home'); else show('difficulty'); };
  setTimeout(()=>{ if(current==='splash'){ if(S.started) show('home'); else show('difficulty'); } },4000);
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
  const gPrice=Math.round(st.seed*3*((typeof WX_discount==='function')?WX_discount('genetics'):1));
  if(locked){
    const l=st.lock;
    lockHtml='<p class="lock-note">'+icon('lock','kv-ico')+' '+(l.t==='rep'?'Unlocks at '+l.v+' reputation':l.t==='cash'?'Buy for '+fmt$(st.seed*3):'Unlock via Project 0 mission')+'</p>';
    if(l.t==='cash') lockHtml+='<button class="btn btn-small btn-gold" data-buygen="'+st.id+'">BUY GENETICS — '+fmt$(gPrice)+'</button>';
  }
  const custom=st.custom?'<span class="badge gold">CUSTOM</span>':'';
  const lin=st.lineage?'<p class="muted">'+icon('dna','kv-ico')+' '+esc(st.lineage)+'</p>':'';
  const ph=S.phenoHistory[st.id];
  const sg=S.stats.strainGrown[st.id];
  const histHtml='<div class="kv"><span>'+icon('grow','kv-ico')+' Times grown</span><b>'+(sg?sg.count:0)+'</b></div>'+
   '<div class="kv"><span>'+icon('harvest','kv-ico')+' Best yield</span><b>'+(sg?fmtW(sg.yield)+' oz':'\u2014')+'</b></div>'+
   '<div class="kv"><span>'+icon('hunt','kv-ico')+' Phenos tested</span><b>'+(ph?int(ph.tested,0):0)+'</b></div>'+
   '<div class="kv"><span>'+icon('keepers','kv-ico')+' Keepers found</span><b>'+(ph?int(ph.keepers,0):0)+'</b></div>'+
   ((ph&&num(ph.bestScore,0)>0)?'<div class="kv"><span>'+icon('star','kv-ico')+' Best pheno</span><b>#'+int(ph.bestPheno,0)+' ('+Math.round(ph.bestScore)+')</b></div>':'');
  const huntBtns=!locked?'<div class="btn-row"><button class="btn btn-small btn-green" data-growseed="'+st.id+'">'+icon('grow','ic')+'GROW</button>'+
   '<button class="btn btn-small" data-hunt="'+st.id+'">'+icon('hunt','ic')+'PHENO HUNT</button>'+
   '<button class="btn btn-small btn-gold" data-vkeepers="'+st.id+'">'+icon('keepers','ic')+'KEEPERS</button></div>':'';
  return '<div class="card strain-card"><div class="strain-hero">'+flowerSVG(strainSeed(st),'strain-flower')+'</div>'+
    '<h3>'+esc(st.name)+' '+custom+'</h3>'+lin+
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
    S.cash-=cost; unlockStrain(st.id); save(); updateHUD(); RENDER.genetics();
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
  let html=screenHead('breeding','BREEDING LAB');
  html+='<div class="card breed-parent"><h3>'+icon('dna','ic')+' PARENT A</h3>'+(A?flowerSVG(strainSeed(A),'breed-flower'):'')+breedPickList('breed-a',breedA)+'</div>';
  html+='<div class="breed-vs display">\u00D7</div>';
  html+='<div class="card breed-parent"><h3>'+icon('dna','ic')+' PARENT B</h3>'+(B?flowerSVG(strainSeed(B),'breed-flower'):'')+breedPickList('breed-b',breedB)+'</div>';
  if(A&&B){
    const traits=predictTraits(A,B);
    html+='<div class="card"><h3>'+icon('inspect','ic')+' PREDICTED OFFSPRING TRAITS</h3>'+
      traits.map(t=>statBar(t.n,t.v)).join('')+'</div>';
    html+='<div class="card"><h3>'+icon('star','ic')+' NAME YOUR CROSS</h3><input type="text" id="cross-name" maxlength="28" placeholder="e.g. Revenge Cake" value="'+esc(A.name.split(' ')[0])+' x '+esc(B.name.split(' ')[0])+'">'+
      '<p class="muted">Breeding fee: $150'+(S.crew.breeder?' (breeder bonus: more stable)':'')+'</p>'+
      '<button class="btn btn-primary" id="btn-cross">'+icon('preserve','ic')+'CREATE CROSS</button></div>';
  }
  html+='<div class="card"><h3>'+icon('dna','ic')+' YOUR CROSSES ('+S.customStrains.length+')</h3>'+
    (S.customStrains.length?S.customStrains.map(s=>'<div class="kv"><span>'+esc(s.name)+'<br><span class="muted">'+esc(s.lineage)+'</span></span><span class="badge gold">R'+Math.round(s.resin)+'</span></div>').join(''):'<p class="muted">No custom crosses yet.</p>')+'</div>';
  r.innerHTML=html;
  $('breed-a').onchange=e=>{ breedA=e.target.value; RENDER.breeding(); };
  $('breed-b').onchange=e=>{ breedB=e.target.value; RENDER.breeding(); };
  const btn=$('btn-cross');
  if(btn) btn.onclick=()=>{ const nm=($('cross-name').value||'Untitled Cross'); createCross(nm); };
  try{ if(typeof GX_wireBreeding==='function') GX_wireBreeding(r); }catch(e){}
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
  try{ if(typeof GX_enrichCross==='function') GX_enrichCross(cross,A2,B2); }catch(e){}
  S.stats.crosses++;
  if(A2.custom||B2.custom) S.stats.secondGenCrosses++;
  addP0('genetics',3); addP0('nocompromise',1); gainXP(80); gainRep(5);
  toast('🧬 New strain created: <b>'+esc(nm)+'</b>');
  save(); updateHUD(); checkMissions(); checkAchievements();
  if(current==='breeding') RENDER.breeding();
  return true;
}

/* ============================================================
   PHENOTYPE HUNTING + KEEPER / MOTHER PLANT SYSTEM
   Extends the base game — no existing system is modified destructively.
   ============================================================ */
const PHENO_KEYS=['vigor','structure','yieldPot','potencyPot','resinPot','terpenePot','bagAppeal','flowerSpeed','stressTol','stability'];
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
const KEEPER_CAPS=[3,5,10,20,50];
const KEEPER_CAP_COSTS=[0,2500,12000,45000,120000];
const MOTHER_CAP_COSTS=[0,5000,15000,40000];

/* per-strain pheno history + mission helpers */
function phist(strainId){
  if(!S.phenoHistory[strainId]||typeof S.phenoHistory[strainId]!=='object')
    S.phenoHistory[strainId]={tested:0,harvested:0,keepers:0,elite:0,legendary:0,bestPheno:0,bestScore:0};
  return S.phenoHistory[strainId];
}
function maxPhenoTested(s){ let m=0; Object.values(s.phenoHistory||{}).forEach(h=>{ m=Math.max(m,num(h.tested,0)); }); return m; }
function keeperStrainCount(s){ return new Set((s.keepers||[]).map(k=>k.strainId)).size; }
function keeperCapGate(lvl){
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
    stability:st.stab
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
  else if(ph.legendaryTrait&&ph.legendaryHidden&&s>=3) out.push('❓ UNKNOWN EXPRESSION');
  return out;
}
function revealForStage(p){
  const ph=p.pheno; if(!ph) return;
  const s=stageOf(p), kn=ph.known;
  if(s>=1){ kn.vigor=true; kn.structure=true; kn.stressTol=true; }
  if(s>=2){ kn.flowerSpeed=true; }
  if(s>=3){ kn.resinPot=true; kn.terpenePot=true; }
  if(s>=4){ kn.yieldPot=true; kn.potencyPot=true; kn.bagAppeal=true; kn.stability=true; }
  expressionTags(p).forEach(t=>{ if(!ph.expressed.includes(t)) ph.expressed.push(t); });
}
function countRarity(ph,strainId){
  if(!ph||ph.rarityCounted) return;
  ph.rarityCounted=true;
  if(ph.rarity==='elite'){ S.stats.eliteFound++; addP0('nocompromise',3); addP0('genetics',2); toast('💎 ELITE phenotype discovered!'); }
  if(ph.rarity==='legendary'){ S.stats.legendaryFound++; addP0('genetics',6); addP0('preservation',3); }
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
  const ug='<span class="unknown-gene">???</span>';
  const tRow=(label,key)=>'<div class="kv"><span>'+label+'</span><b>'+(ph.known[key]?Math.round(ph[key]):ug)+'</b></div>';
  let html='<h3>'+icon('inspect','ic')+' '+esc(phenoName(p))+'</h3>'+
   '<p>'+rarityBadge(ph)+(ph.keeperId?' <span class="badge gold">'+icon('keepers','b-ico')+' KEEPER</span>':'')+(ph.isClone?' <span class="badge green">'+icon('clone','b-ico')+' CLONE</span>':'')+'</p>'+
   '<div class="kv"><span>'+icon('grow','kv-ico')+' Stage</span><b>'+STAGES[s]+'</b></div>'+
   '<div class="kv"><span>'+icon('day','kv-ico')+' Age</span><b>Day '+Math.floor(p.day)+'</b></div>'+
   tRow('Vigor','vigor')+tRow('Structure','structure')+
   '<div class="kv"><span>'+icon('leaf','kv-ico')+' Health</span><b>'+Math.round(p.health)+'%</b></div>'+
   '<div class="kv"><span>'+icon('warn','kv-ico')+' Stress</span><b>'+Math.round(p.stress)+'%</b></div>';
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
  const st=getStrain(p.strainId); if(!st) return 0;
  const pr=p.day/st.ft;
  if(pr<0.15) return 0; if(pr<0.35) return 1; if(pr<0.55) return 2;
  if(pr<0.75) return 3; if(pr<1.0) return 4; return 5;
}
function plantIcon(p){
  const seed=p.strainId+'#'+(p.pheno&&p.pheno.num?p.pheno.num:'0');
  return plantSVG(visStageOf(p),seed,'slot-plant',plantVisOpts(p));
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
  const p={ id:S.nextPlantId++, strainId:strainId, day:0, health:100, water:70, nutrition:60,
    stress:0, trained:false, minHealth:100, problems:[], growthBoost:0 };
  p.pheno=genPheno(st);
  p.pheno.num=nextPhenoNum(strainId);
  return p;
}
function plantSeed(strainId){
  const st=getStrain(strainId);
  const slots=FACILITIES[S.facility].slots;
  if(S.plants.length>=slots){ toast('❌ No free grow slots. Expand your facility!'); return false; }
  if(!isUnlocked(strainId)){ toast('🔒 Genetics locked.'); return false; }
  if(S.cash<st.seed){ toast('❌ Need '+fmt$(st.seed)+' for seeds.'); return false; }
  S.cash-=st.seed;
  const p=newPlant(strainId);
  S.plants.push(p);
  S.stats.plantsStarted++; S.stats.phenoTested++;
  S.stats.maxConcurrent=Math.max(S.stats.maxConcurrent,S.plants.length);
  const h=phist(strainId); h.tested++;
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
    inspectPheno(pid); return;
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
  const yieldOz=Math.max(0.5,(G.yld/100)*3.2*healthF*stressF*trainB*lightB*co2B*crewB*D.econMult);
  let quality=(G.pot*0.25+G.terp*0.15+G.resin*0.15+G.stab*0.1);
  quality=quality*0.5 + (p.health*0.3) + (ev*20);
  quality+=q.drycure*3 + q.sensors*2 - p.stress*0.15;
  if(p.day>st.ft+7) quality-=10; // harvested late
  quality=clamp(quality*D.qualityMult,5,100);
  const potency=clamp(G.pot*0.6+quality*0.4,5,100);
  const terpenes=clamp(G.terp*0.6+quality*0.4,5,100);
  const bagAppeal=clamp(ph.bagAppeal*0.5+quality*0.5,5,100);
  const resin=clamp(G.resin*0.65+quality*0.35,5,100);
  S.inventory.push({ id:S.nextInvId++, strainId:st.id, strainName:st.name, amount:Math.round(yieldOz*10)/10,
    quality:Math.round(quality), potency:Math.round(potency), terpenes:Math.round(terpenes),
    bagAppeal:Math.round(bagAppeal), resin:Math.round(resin), type:'flower', custom:!!st.custom });
  S.plants=S.plants.filter(x=>x.id!==p.id);
  const oz=Math.round(yieldOz*10)/10, qq=Math.round(quality);
  /* ---- expansion: deep harvest grading (Builder B) + perfect-grow note (Builder C) ---- */
  try{ if(typeof EX_harvestNote==='function') EX_harvestNote(qq,p.minHealth); }catch(e){}
  try{
    if(typeof GX_gradeHarvest==='function'){
      const gxG=GX_gradeHarvest({strainId:st.id,pheno:ph,yieldOz:oz,quality:qq,
        potency:Math.round(potency),resin:Math.round(resin),terpenes:Math.round(terpenes),bagAppeal:Math.round(bagAppeal),
        care:{avgWater:p.water,avgNutrition:p.nutrition,stress:p.stress,minHealth:p.minHealth},
        envScore:(typeof envEval==='function'?envEval().score:80),
        equipAvg:(q.lights+q.hvac+q.humid+q.dehumid+q.co2sys+q.irrigation+q.nutrients+q.sensors+q.drycure)/9,
        harvestDay:S.day,flowerDays:p.day});
      const gxInv=S.inventory[S.inventory.length-1];
      if(gxInv) gxInv.gxGrade=gxG.grade;
    }
  }catch(e){}
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
  /* ---- phenotype bookkeeping ---- */
  S.stats.phenoHarvested++;
  const h=phist(p.strainId); h.harvested++;
  countRarity(ph,p.strainId);
  const yieldScore=clamp(Math.round(yieldOz/4.5*100),5,100);
  const overall=Math.round(qq*0.3+potency*0.2+resin*0.15+terpenes*0.15+bagAppeal*0.1+yieldScore*0.1);
  S.stats.bestPhenoScore=Math.max(S.stats.bestPhenoScore,overall);
  if(overall>h.bestScore){ h.bestScore=overall; h.bestPheno=ph.num; }
  /* clone harvest → mother stats */
  if(ph.isClone&&ph.motherId){
    const mo=S.mothers.find(m=>m.id===ph.motherId);
    if(mo){
      mo.runs++; mo.qualities.push(qq); mo.yields.push(oz);
      if(mo.qualities.length>20) mo.qualities.shift();
      if(mo.yields.length>20) mo.yields.shift();
      mo.bestQ=Math.max(mo.bestQ,qq); mo.bestY=Math.max(mo.bestY,oz);
      if(qq>=90) mo.awards.push('💎 90+');
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
  /* ---- permanent phenotype report ---- */
  const report={
    strainId:st.id, strainName:st.name, phenoNum:ph.num,
    rarity:ph.rarity, legendaryTrait:ph.legendaryHidden?null:ph.legendaryTrait,
    traits:ph.expressed.slice(),
    genetics:{vigor:ph.vigor,structure:ph.structure,yieldPot:ph.yieldPot,potencyPot:ph.potencyPot,
      resinPot:ph.resinPot,terpenePot:ph.terpenePot,bagAppeal:ph.bagAppeal,flowerSpeed:ph.flowerSpeed,
      stressTol:ph.stressTol,stability:ph.stability},
    overall:overall,
    harvest:{quality:qq,potency:Math.round(potency),terpenes:Math.round(terpenes),
      bagAppeal:Math.round(bagAppeal),resin:Math.round(resin),yieldOz:oz,yieldScore:yieldScore},
    day:S.day, generation:ph.cloneGen||0,
    lineage:ph.isClone?('Clone of '+st.name+' #'+ph.num):'Seed',
    isClone:ph.isClone, motherId:ph.motherId||null, keeperId:ph.keeperId||null,
    huntId:ph.huntId||null
  };
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
}
function phenoReportModal(report){
  const r=report.harvest;
  const isRecord=Math.round(r.quality)>=Math.round(num(S.stats.bestQuality,0))&&r.quality>0;
  const topShelf=r.quality>=90, masterGrow=report.overall>=92;
  let callout='';
  if(isRecord) callout+='<div class="callout record">'+icon('trophy','c-ico')+'NEW RECORD</div>';
  if(topShelf) callout+='<div class="callout topshelf">TOP SHELF</div>';
  if(masterGrow) callout+='<div class="callout master">'+crownSVG(true,'c-ico-svg')+'MASTER GROW</div>';
  function cnt(label,val,dec,suf){
    return '<div class="count-cell"><span class="cc-label">'+label+'</span>'+
     '<span class="cc-val" data-count="'+val+'" data-dec="'+(dec||0)+'">0'+(suf||'')+'</span></div>';
  }
  const tier=r.quality>=95?['LEGENDARY RUN','legendary']:r.quality>=90?['MASTER GROW','master']:r.quality>=85?['TOP SHELF','topshelf']:r.quality>=75?['PREMIUM','premium']:['STANDARD','standard'];
  let html='<div class="pheno-report harvest-cine">'+
   '<div class="petal-fall"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
   '<div class="display harvest-title">HARVEST COMPLETE</div>'+
   '<div class="harvest-plant">'+plantSVG(9,report.strainId+'#'+report.phenoNum,'harvest-plant',{frost:3,dense:true,purple:report.rarity==='legendary'})+'</div>'+
   '<div class="harvest-flower">'+flowerSVG(report.strainId+'#'+report.phenoNum,'harvest-bud')+'</div>'+
   '<div class="harvest-tier '+tier[1]+'">'+icon('trophy','c-ico')+' '+tier[0]+'</div>'+
   '<h3>'+esc(report.strainName)+' #'+report.phenoNum+(report.isClone?' '+icon('clone','b-ico'):'')+'</h3>'+
   '<p>'+rarityBadge({rarity:report.rarity})+(report.legendaryTrait?' <span class="badge r-legendary">'+icon('crown-gold','b-ico')+esc(report.legendaryTrait)+'</span>':'')+'</p>'+
   callout+
   '<div class="report-overall"><span>OVERALL</span><b data-count="'+report.overall+'" data-dec="0">0</b></div>'+
   '<div class="count-grid">'+
   cnt('DRY YIELD',r.yieldScore,0)+cnt('QUALITY',r.quality,0)+cnt('POTENCY',r.potency,0)+
   cnt('TERPENES',r.terpenes,0)+cnt('RESIN',r.resin,0)+cnt('BAG APPEAL',r.bagAppeal,0)+
   '</div>'+
   '<div class="kv"><span>Actual yield</span><b>'+r.yieldOz+' oz</b></div>'+
   (report.traits.length?'<div class="tags" style="justify-content:center">'+report.traits.map(t=>'<span class="tag">'+esc(t)+'</span>').join('')+'</div>':'')+
   '<p class="muted">Lineage: '+esc(report.lineage)+'</p>'+
   '<div class="btn-row"><button class="btn btn-small btn-gold" id="pr-keep">'+icon('crown-gold','b-ico')+' KEEP</button>'+
   '<button class="btn btn-small" id="pr-arch">'+icon('preserve','b-ico')+' ARCHIVE</button></div>'+
   '<button class="btn btn-small btn-danger" id="pr-disc">DISCARD</button></div>';
  const m=modal(html);
  /* animated count-ups */
  m.querySelectorAll('[data-count]').forEach(el=>{
    const target=num(el.dataset.count,0), dec=int(el.dataset.dec,0), t0=performance.now(), dur=900;
    function tick(t){
      const p=clamp((t-t0)/dur,0,1), e=1-Math.pow(1-p,3);
      el.textContent=(target*e).toFixed(dec);
      if(p<1) requestAnimationFrame(tick);
    }
    try{ requestAnimationFrame(tick); }catch(e){ el.textContent=target.toFixed(dec); }
  });
  m.querySelector('#pr-keep').onclick=()=>{ closeModal(m); markKeeper(report); };
  m.querySelector('#pr-arch').onclick=()=>{ closeModal(m); archivePheno(report); };
  m.querySelector('#pr-disc').onclick=()=>{ closeModal(m); toast('Phenotype discarded.'); save(); };
}
function archivePheno(report){
  S.phenoArchive.unshift({strainName:report.strainName,phenoNum:report.phenoNum,rarity:report.rarity,
    overall:report.overall,day:S.day,traits:report.traits.slice(0,6)});
  if(S.phenoArchive.length>200) S.phenoArchive.length=200;
  save(); toast('📦 Phenotype archived.');
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

/* ---------------- Expansion day tick: world events, market, contracts, challenges,
   employees, genetics upkeep — all guarded so base game never breaks ---------------- */
function expansionTick(){
  try{ if(typeof WX_tick==='function') WX_tick(); }catch(e){}
  try{ if(typeof EX_tick==='function') EX_tick(); }catch(e){}
  try{ if(typeof GX_tick==='function') GX_tick(); }catch(e){}
}

/* ---------------- Day advance ---------------- */
function advanceDay(){
  const D=DIFFS[S.difficulty], q=S.equipment, ev=envEval();
  const stageBefore={}; S.plants.forEach(p=>{ stageBefore[p.id]=stageOf(p); });
  const missionsBefore=S.missionsDone.length;
  const envScore=Math.max(0,ev.score-(S.envPenalty>0?15:0)-((typeof WX_envPenalty==='function')?WX_envPenalty():0));
  if(S.envPenalty>0) S.envPenalty--;
  S.plants.forEach(p=>{
    const st=getStrain(p.strainId);
    if(p.pheno) revealForStage(p); /* progressive phenotype revelation */
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
  return '<div class="env-ctl"><div class="kv"><span>'+label+'</span><span class="env-val">'+val+unit+'</span></div>'+
   '<input type="range" min="'+min+'" max="'+max+'" value="'+val+'" data-env="'+key+'" data-unit="'+unit+'"></div>';
}
function growPlantHtml(p){
  const R=sRng('gpos|'+p.id);
  const jx=((R()-0.5)*12).toFixed(1), jy=((R()-0.5)*8).toFixed(1);
  const st=getStrain(p.strainId), s=stageOf(p);
  const bad=p.health<40||p.water<18||p.nutrition<15||p.nutrition>92;
  const dot=p.health>=70?'good':p.health>=40?'warn':'bad';
  return '<div class="gplant'+(bad?' prob':'')+'" data-pid="'+p.id+'" style="--jx:'+jx+'px;--jy:'+jy+'px" role="button" tabindex="0" aria-label="'+esc(phenoName(p))+'">'+
   '<div class="gp-art">'+plantIcon(p)+'</div>'+
   '<div class="gp-meta"><span class="gp-dot '+dot+'"></span><span class="gp-day">D'+Math.floor(p.day)+'</span>'+
   (s>=5?'<span class="gp-ready">READY</span>':'')+
   (bad?'<span class="gp-warn">'+icon('warn','ic')+'</span>':'')+'</div>'+
   '<div class="gp-name">'+esc((st?st.name.split(' ')[0]:'??')+' #'+(p.pheno&&p.pheno.num?p.pheno.num:''))+'</div></div>';
}
RENDER.grow=function(){
  const r=$('grow-root'), ev=envEval(), slots=FACILITIES[S.facility].slots, tier=facTierIdx();
  const evCls=v=>v>=80?'good':v>=55?'warn':'bad';
  const iss=ev.issues.join(' | ');
  const tele=[
    {i:'light',l:'LIGHT',v:S.env.light+'%',bad:/Light/.test(iss)},
    {i:'temp',l:'TEMP',v:S.env.temp+'\u00B0F',bad:/cold|hot/.test(iss)},
    {i:'humid',l:'RH',v:S.env.humidity+'%',bad:/Humidity/.test(iss)},
    {i:'co2',l:'CO2',v:S.env.co2,bad:/CO2/.test(iss)}
  ];
  let html=screenHead('grow','GROW ROOM')+
   '<div class="tent fac-banner">'+facilitySceneSVG(tier)+
   '<div class="kv"><span>'+icon('grow','kv-ico')+' '+esc(FAC_TIERS[tier].name)+'</span><b>'+S.plants.length+'/'+slots+' slots</b></div></div>'+
   '<div class="tele-grid">'+tele.map(t=>'<div class="tele-cell"><span class="tele-label">'+icon(t.i,'ic')+' '+t.l+'</span><span class="tele-val '+(t.bad?'warn':'good')+'">'+t.v+'</span></div>').join('')+'</div>'+
   '<div class="kv"><span>'+icon('leaf','kv-ico')+' ENV SCORE</span><b class="tele-val '+evCls(ev.score)+'">'+ev.score+'</b></div>'+
   (ev.issues.length?'<p class="prob">'+ev.issues.map(esc).join(' \u2022 ')+'</p>':'<p class="muted">'+icon('check','kv-ico')+' Environment dialed in.</p>');
  if(S.day<=7&&!S.tips.mentorDone){
    const tip=MENTOR_TIPS[Math.min(S.day-1,MENTOR_TIPS.length-1)];
    html+='<div class="mentor-tip">'+npcPortrait('vic','npc-sm')+
     '<div class="npc-text"><b>Vic Malone</b><span class="npc-role">CULTIVATION MENTOR</span><p>&ldquo;'+esc(tip)+'&rdquo;</p>'+
     '<button class="btn btn-small" id="mentor-ok">GOT IT</button></div></div>';
  }
  html+='<div class="growfloor" id="growfloor">';
  S.plants.forEach(p=>{ html+=growPlantHtml(p); });
  const empt=Math.min(6,slots-S.plants.length);
  for(let i=0;i<empt;i++) html+='<div class="gplant empty" data-empty="1" role="button" tabindex="0"><span class="gp-plus">'+icon('plus','ic')+'</span><span class="gp-name">PLANT</span></div>';
  html+='</div>';
  if(slots-S.plants.length>6) html+='<p class="muted" style="text-align:center">+'+(slots-S.plants.length-6)+' more open slots</p>';
  html+='<div class="card"><h3>'+icon('settings','ic')+' ENVIRONMENT CONTROLS</h3>'+
   envSlider('light','Light Intensity',S.env.light,40,100,'%')+
   envSlider('temp','Temperature',S.env.temp,60,95,'\u00B0F')+
   envSlider('humidity','Humidity',S.env.humidity,20,90,'%')+
   envSlider('co2','CO2',S.env.co2,400,1600,' PPM')+'</div>';
  html+='<button class="btn btn-primary btn-big" id="btn-day">'+icon('day','ic')+' ADVANCE DAY ('+S.day+' \u2192 '+(S.day+1)+')</button>';
  r.innerHTML=html;
  r.querySelectorAll('input[type=range][data-env]').forEach(s=>{
    s.oninput=e=>{ S.env[e.target.dataset.env]=+e.target.value; e.target.closest('.env-ctl').querySelector('.env-val').textContent=e.target.value+e.target.dataset.unit; };
    s.onchange=()=>{ save(); RENDER.grow(); };
  });
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
  const qp=Math.round(clamp(st.pot*0.5+p.health*0.3+envEval().score*0.2-p.stress*0.15,5,100));
  const bd=document.createElement('div'); bd.id='focus-back'; bd.className='focus-back';
  bd.onclick=closeFocus;
  const sh=document.createElement('div'); sh.id='plant-focus'; sh.className='focus-sheet';
  sh.innerHTML='<div class="focus-handle"></div>'+
   '<div class="focus-stage"><div class="focus-plant" id="focus-plant">'+plantIcon(p)+'</div><div class="focus-fx" id="focus-fx"></div></div>'+
   '<h3>'+esc(phenoName(p))+'</h3>'+
   '<p><span class="badge">'+STAGES[s]+'</span> <span class="muted">'+VIS_STAGES[vs]+' \u2022 Day '+Math.floor(p.day)+'/~'+st.ft+'</span></p>'+
   (p.pheno?'<p>'+rarityBadge(p.pheno)+(p.pheno.isClone?' <span class="badge green">'+icon('clone','b-ico')+' CLONE</span>':'')+'</p>':'')+
   statBar('Health',p.health,100,'green')+statBar('Water',p.water)+statBar('Nutrition',p.nutrition)+
   statBar('Stress',p.stress)+'<div class="statrow"><span class="slabel">Quality pot.</span><span class="sval" style="width:auto">'+qp+'</span></div>'+
   (p.problems.length?'<p class="prob">'+icon('warn','kv-ico')+' '+p.problems.map(esc).join(', ')+'</p>':'')+
   '<div class="p-actions">'+
   '<button class="btn btn-small" data-fa="water">'+icon('water','ic')+' WATER</button>'+
   '<button class="btn btn-small" data-fa="feed">'+icon('feed','ic')+' FEED</button>'+
   '<button class="btn btn-small" data-fa="train">'+icon('train','ic')+' TRAIN</button>'+
   '<button class="btn btn-small" data-fa="inspect">'+icon('inspect','ic')+' INSPECT</button>'+
   '<button class="btn btn-small btn-green" data-fa="harvest" '+(ready?'':'disabled')+'>'+icon('harvest','ic')+' HARVEST</button>'+
   '<button class="btn btn-small" data-fa="close">'+icon('x','ic')+' CLOSE</button></div>';
  document.body.appendChild(bd); document.body.appendChild(sh);
  try{ requestAnimationFrame(()=>{ sh.classList.add('open'); }); }catch(e){ sh.classList.add('open'); }
  sh.querySelectorAll('[data-fa]').forEach(b=>b.onclick=()=>focusAction(pid,b.dataset.fa));
}
function focusAction(pid,a){
  if(a==='close'){ closeFocus(); return; }
  if(a==='inspect'){ closeFocus(); inspectPheno(pid); return; }
  if(a==='harvest'){ closeFocus(); doAction(pid,'harvest'); return; }
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
   '<div class="btn-row"><button class="btn btn-gold" id="btn-vault">'+icon('keepers','ic')+' KEEPER VAULT ('+S.keepers.length+'/'+S.keeperCapacity+')</button>'+
   '<button class="btn btn-primary" id="btn-plant">'+icon('plus','ic')+' PLANT NEW SEED</button></div>';
  S.phenoHunts.filter(h=>h.active).forEach(h=>{
    html+='<div class="card hunt-card"><h3>'+icon('hunt','ic')+' PHENO HUNT: '+esc(h.strainName)+'</h3>'+
     '<div class="kv"><span>Planted</span><b>'+h.planted+' / '+h.total+'</b></div>'+
     '<div class="kv"><span>Harvested</span><b>'+h.harvested+'</b></div>'+
     '<div class="kv"><span>Keepers found</span><b>'+h.keepersFound+'</b></div>'+
     '<div class="kv"><span>Best score</span><b>'+(h.bestScore>0?h.bestScore+' (#'+h.bestPheno+')':'\u2014')+'</b></div>'+
     '<div class="progress"><i style="width:'+clamp(h.harvested/Math.max(1,h.total)*100,0,100)+'%"></i></div></div>';
  });
  if(!S.plants.length) html+='<div class="card"><p class="muted">'+icon('grow','ic-lg')+'<br>No plants growing. Plant your first seed to start the empire.</p></div>';
  S.plants.forEach(p=>{
    const st=getStrain(p.strainId), s=stageOf(p);
    const phn=p.pheno&&p.pheno.num?p.pheno.num:'0';
    html+='<div class="plant-card"><div class="p-head">'+flowerSVG(p.strainId+'#'+phn,'p-flower')+
     '<span class="p-name">'+esc(phenoName(p))+'</span><span class="p-stage">'+STAGES[s]+'</span></div>'+
     (p.pheno?'<p>'+rarityBadge(p.pheno)+(p.pheno.isClone?' <span class="badge green">'+icon('clone','b-ico')+' CLONE</span>':'')+'</p>':'')+
     '<div class="kv"><span>'+icon('day','kv-ico')+' DAY</span><b>'+Math.floor(p.day)+' / ~'+st.ft+'</b></div>'+
     statBar('Health',p.health,100,'green')+statBar('Water',p.water)+statBar('Nutrition',p.nutrition)+statBar('Stress',p.stress)+
     (p.problems.length?'<p class="prob">'+icon('warn','kv-ico')+' '+p.problems.map(esc).join(', ')+'</p>':'')+
     '<div class="p-actions">'+
     '<button class="btn btn-small" data-p="'+p.id+'" data-a="water">'+icon('water','ic')+' WATER</button>'+
     '<button class="btn btn-small" data-p="'+p.id+'" data-a="feed">'+icon('feed','ic')+' FEED</button>'+
     '<button class="btn btn-small" data-p="'+p.id+'" data-a="train">'+icon('train','ic')+' TRAIN</button>'+
     '<button class="btn btn-small" data-p="'+p.id+'" data-a="inspect">'+icon('inspect','ic')+' INSPECT</button>'+
     '<button class="btn btn-small btn-green" data-p="'+p.id+'" data-a="harvest" '+(s>=5?'':'disabled')+'>'+icon('harvest','ic')+' HARVEST</button>'+
     '</div></div>';
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
  const typeMult=it.type==='concentrate'?6:it.type==='edible'?2.5:1;
  return Math.max(5,base*repMult*typeMult*D.econMult);
}
RENDER.dispensary=function(){
  const r=$('dispensary-root');
  const tabIco={flower:'leaf',concentrate:'drop',edible:'jar'};
  let html=screenHead('dispensary','DISPENSARY')+
   '<div class="tabs">'+
   ['flower','concentrate','edible'].map(t=>'<button class="tab'+(dispTab===t?' active':'')+'" data-tab="'+t+'">'+icon(tabIco[t],'b-ico')+t.toUpperCase()+'S</button>').join('')+'</div>';
  try{ if(typeof WX_marketPanel==='function') html+=WX_marketPanel(); }catch(e){}
  try{ if(typeof WX_contractsHTML==='function') html+=WX_contractsHTML(); }catch(e){}
  const items=S.inventory.filter(i=>i.type===(dispTab==='flower'?'flower':dispTab));
  if(!items.length) html+='<div class="card"><p class="muted">Nothing here yet. '+(dispTab==='flower'?'Harvest some plants!':'Process flower in the FLOWER tab.')+'</p></div>';
  items.forEach(it=>{
    const ppo=pricePerOz(it), total=ppo*it.amount;
    html+='<div class="card product-card"><div class="product-thumb">'+flowerSVG(it.strainId+'#'+it.id,'product-flower')+'</div>'+
     '<h3>'+esc(it.strainName)+' <span class="badge gold">Q'+it.quality+'</span></h3>'+
     '<div class="kv"><span>'+icon('jar','kv-ico')+'Amount</span><b>'+it.amount+' '+(it.type==='edible'?'units':'oz')+'</b></div>'+
     '<div class="kv"><span>'+icon('star','kv-ico')+'Potency</span><b>'+it.potency+'%</b></div>'+
     '<div class="kv"><span>'+icon('cash','kv-ico')+'Price</span><b>'+fmt$(ppo)+' / '+(it.type==='edible'?'unit':'oz')+'</b></div>'+
     '<div class="kv"><span>'+icon('sell','kv-ico')+'Total value</span><b>'+fmt$(total)+'</b></div>'+
     '<div class="btn-row"><button class="btn btn-small btn-green" data-sell="'+it.id+'">'+icon('sell','b-ico')+'SELL ALL</button>'+
     (dispTab==='flower'?'<button class="btn btn-small" data-proc="'+it.id+'">'+icon('feed','b-ico')+'PROCESS</button>':'')+'</div></div>';
  });
  if(dispTab==='flower'&&items.length){
    html+='<div class="card"><h3>'+icon('feed','ic-lg')+'PROCESSING</h3><p class="muted">Turn flower into concentrates (6x price, 18% yield, $30/oz) or edibles (2.5x price, 10 units/oz, $25/oz). Use PROCESS on an item above.</p></div>';
  }
  r.innerHTML=html;
  r.querySelectorAll('[data-tab]').forEach(t=>t.onclick=()=>{ dispTab=t.dataset.tab; RENDER.dispensary(); });
  r.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>buyerModal(+b.dataset.sell));
  r.querySelectorAll('[data-proc]').forEach(b=>b.onclick=()=>{
    const it=S.inventory.find(x=>x.id===+b.dataset.proc); if(!it) return;
    const m=modal('<h3>'+icon('feed','ic-lg')+'PROCESS '+esc(it.strainName)+'</h3><p class="muted">'+it.amount+' oz available.</p>'+
     '<label>Amount (oz)</label><input type="number" id="proc-amt" min="1" max="'+it.amount+'" value="1">'+
     '<div class="btn-row"><button class="btn btn-small btn-gold" id="proc-conc">CONCENTRATE<br><span class="muted">→18%/oz $30</span></button>'+
     '<button class="btn btn-small btn-gold" id="proc-ed">EDIBLES<br><span class="muted">→10u/oz $25</span></button></div>'+
     '<button class="btn btn-small" id="proc-x">'+icon('x','b-ico')+'CANCEL</button>');
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

/* ---------------- Market buyers: choose who buys your harvest ---------------- */
function buyerModal(invId){
  const it=S.inventory.find(x=>x.id===invId); if(!it) return;
  const base=pricePerOz(it)*it.amount;
  let html='<h3>'+icon('sell','ic-lg')+'CHOOSE YOUR BUYER</h3>'+
   '<p class="muted">'+esc(it.strainName)+' \u2014 Q'+it.quality+' \u2022 '+it.amount+' '+(it.type==='edible'?'units':'oz')+' \u2022 base '+fmt$(base)+'</p><div class="buyer-list">';
  BUYERS.forEach(by=>{
    const wxm=(typeof WX_sellMult==='function')?WX_sellMult(it.strainId,it,by.id):1;
    const mult=by.mult(it)*wxm, offer=base*mult;
    html+='<div class="buyer-card" data-buyer="'+by.id+'" role="button" tabindex="0">'+
     '<div class="buyer-face">'+(by.npc?npcPortrait(by.npc,'npc-sm'):icon('cash','ic-xl'))+'</div>'+
     '<div class="buyer-info"><b>'+esc(by.name)+'</b><span class="buyer-title">'+esc(by.title)+'</span>'+
     '<span class="muted">'+esc(by.values)+'</span>'+
     '<span class="buyer-blurb">'+esc(by.blurb)+'</span>'+
     '<span class="buyer-offer">OFFER <b>'+fmt$(offer)+'</b> <span class="muted">\u00D7'+mult.toFixed(2)+'</span></span></div></div>';
  });
  html+='</div><button class="btn btn-small" id="bm-x">'+icon('x','b-ico')+'CANCEL</button>';
  const m=modal(html);
  m.querySelector('#bm-x').onclick=()=>closeModal(m);
  m.querySelectorAll('[data-buyer]').forEach(c=>c.onclick=()=>{ closeModal(m); sellToBuyer(invId,c.dataset.buyer); });
}
function sellToBuyer(invId,buyerId){
  const it=S.inventory.find(x=>x.id===invId); if(!it) return;
  const by=BUYERS.find(b=>b.id===buyerId)||BUYERS[0];
  const wxm=(typeof WX_sellMult==='function')?WX_sellMult(it.strainId,it,by.id):1;
  const total=pricePerOz(it)*it.amount*by.mult(it)*wxm;
  S.cash+=total; S.stats.lifetimeRevenue+=total; S.stats.sales++;
  S.stats.buyerSales[by.id]=int(S.stats.buyerSales[by.id],0)+1;
  gainXP(15); gainRep(by.id==='dscout'?4:2);
  if(S.stats.quickTurnReady){ S.stats.quickTurnarounds++; S.stats.quickTurnReady=false; }
  S.inventory=S.inventory.filter(x=>x.id!==it.id);
  toast('\uD83D\uDCB5 Sold to '+esc(by.name)+' for '+fmt$(total));
  save(); updateHUD(); checkMissions(); checkAchievements(); RENDER.dispensary();
}


/* ---------------- Empire ---------------- */
let empireTab='facilities';
function empireHubHTML(){
  const openN=HUB_AREAS.filter(a=>a.un()).length, ct=facTierIdx();
  return '<div class="card hub-card"><h3>'+icon('empire','ic-lg')+'SHOCKER OWNZ COMPOUND</h3>'+
   '<p class="muted">'+openN+'/'+HUB_AREAS.length+' sectors online. Tap a sector to enter.</p>'+empireHubSVG()+
   '<div class="tier-ladder">'+FAC_TIERS.map((t,i)=>'<div class="tier-chip'+(i===ct?' cur':i<ct?' owned':'')+'"><span>'+esc(t.name)+'</span></div>').join('')+'</div>'+
   '<p class="muted">Current tier: <b>'+esc(FAC_TIERS[ct].name)+'</b></p></div>';
}
function equipCost(def,lvl){
  const disc=S.crew.manager?0.9:1;
  const sdisc=(typeof WX_discount==='function')?WX_discount('equip'):1;
  return Math.round(def.base*Math.pow(2.2,lvl-1)*disc*sdisc);
}
RENDER.empire=function(){
  const r=$('empire-root');
  let html=screenHead('empire','EMPIRE')+empireHubHTML()+'<div class="card mgmt-head"><h3>'+icon('empire','ic-lg')+'FACILITY MANAGEMENT</h3></div><div class="tabs">'+
   [['facilities','FACILITIES'],['equipment','EQUIPMENT'],['crew','CREW'],['compete','COMPETE']].map(t=>'<button class="tab'+(empireTab===t[0]?' active':'')+'" data-etab="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>';
  if(empireTab==='facilities'){
    html+='<div class="card status-card"><div class="kv"><span>'+icon('empire','kv-ico')+'Current facility</span><b>'+FACILITIES[S.facility].name+'</b></div>'+
     '<div class="kv"><span>'+icon('grow','kv-ico')+'Grow slots</span><b>'+FACILITIES[S.facility].slots+'</b></div></div>';
    FACILITIES.forEach((f,i)=>{
      const owned=i<=S.facility, next=i===S.facility+1;
      html+='<div class="card fac-card"><div class="fac-thumb" style="filter:hue-rotate('+(i*45)+'deg)">'+icon('empire','ic-xl')+'</div>'+
       '<h3>'+(owned?icon('check','b-ico'):'')+f.name+'</h3><div class="kv"><span>'+icon('grow','kv-ico')+'Grow slots</span><b>'+f.slots+'</b></div>'+
       (owned?'<p class="muted">Owned.</p>':next?'<button class="btn btn-small btn-gold" data-buyfac="'+i+'">'+icon('empire','b-ico')+'EXPAND — '+fmt$(f.cost)+'</button>':'<p class="lock-note">'+icon('lock','kv-ico')+' Expand in order.</p>')+'</div>';
    });
    html+='<div class="card"><h3>'+icon('mothers','ic-lg')+'MOTHER ROOM</h3><p class="muted">House mother plants to take identical clones.</p>'+
     '<div class="kv"><span>'+icon('mothers','kv-ico')+'Mother slots</span><b>'+S.motherCapacity+' / 4</b></div>'+
     (S.motherCapacity>=4?'<p class="muted">MAXED.</p>':'<button class="btn btn-small btn-gold" data-buymother="1">'+icon('plus','b-ico')+'ADD SLOT — '+fmt$(MOTHER_CAP_COSTS[S.motherCapacity])+'</button>')+'</div>';
  }else if(empireTab==='equipment'){
    html+=npcBlurb('sal');
    EQUIP_DEFS.forEach(d=>{
      const lvl=S.equipment[d.id], maxed=lvl>=d.max;
      html+='<div class="card eq-card"><div class="eq-thumb">'+icon(d.ic,'ic-xl')+'</div>'+
       '<h3>'+d.name+' <span class="badge">Lv '+lvl+'/'+d.max+'</span></h3><p class="muted">'+d.desc+'</p>'+
       (maxed?'<p class="muted">MAXED OUT.</p>':'<button class="btn btn-small btn-gold" data-buye="'+d.id+'">'+icon('equipment','b-ico')+'UPGRADE — '+fmt$(equipCost(d,lvl))+'</button>')+'</div>';
    });
  }else if(empireTab==='crew'){
    html+='<div class="card"><p class="muted">Crew members charge a daily wage, deducted each day.</p></div>';
    CREW_DEFS.forEach(c=>{
      const hired=S.crew[c.id];
      html+='<div class="card crew-card"><div class="crew-thumb">'+icon(c.ic,'ic-xl')+'</div>'+
       '<h3>'+(hired?icon('check','b-ico'):'')+c.name+'</h3><p class="muted">'+c.desc+'</p>'+
       '<div class="kv"><span>'+icon('cash','kv-ico')+'Hire cost</span><b>'+fmt$(c.hire)+'</b></div><div class="kv"><span>'+icon('day','kv-ico')+'Daily wage</span><b>'+fmt$(c.wage)+'</b></div>'+
       (hired?'<p class="muted">On payroll.</p>':'<button class="btn btn-small btn-green" data-hire="'+c.id+'">'+icon('crew','b-ico')+'HIRE</button>')+'</div>';
    });
  }else{
    html+=npcBlurb('marisol')+competeHtml();
  }
  r.innerHTML=html;
  r.querySelectorAll('[data-etab]').forEach(t=>t.onclick=()=>{ empireTab=t.dataset.etab; RENDER.empire(); });
  r.querySelectorAll('[data-hub]').forEach(g=>g.onclick=()=>{
    const a=HUB_AREAS.find(x=>x.id===g.dataset.hub); if(!a) return;
    if(!a.un()){ toast('\uD83D\uDD12 '+a.label+' \u2014 '+a.hint); return; }
    if(a.tab==='mothers'){ keeperTab='mothers'; show('keepers'); return; }
    if(a.tab){ empireTab=a.tab; show('empire'); return; }
    show(a.go);
  });
  r.querySelectorAll('[data-buyfac]').forEach(b=>b.onclick=()=>{
    const i=+b.dataset.buyfac, f=FACILITIES[i];
    if(S.cash<f.cost){ toast('❌ Need '+fmt$(f.cost)+'.'); return; }
    const prevT=facTierIdx();
    S.cash-=f.cost; S.facility=i; gainXP(150); gainRep(20);
    const newT=facTierIdx();
    save(); updateHUD(); checkMissions(); RENDER.empire();
    facilityUnlockCine(prevT,newT,f.name);
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
  r.querySelectorAll('[data-buymother]').forEach(b=>b.onclick=()=>{
    const cost=MOTHER_CAP_COSTS[S.motherCapacity];
    if(S.cash<cost){ toast('❌ Need '+fmt$(cost)+'.'); return; }
    S.cash-=cost; S.motherCapacity++; gainXP(80);
    toast('🌿 Mother room expanded: '+S.motherCapacity+' slots!');
    save(); updateHUD(); checkMissions(); RENDER.empire();
  });
  wireCompete(r);
  try{ if(typeof EX_wireEmpire==='function') EX_wireEmpire(); }catch(e){}
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
    html+='<div class="card comp-poster"><div class="comp-badge">'+icon('trophy','ic-xl')+'</div>'+
     '<h3>'+icon(t.ic,'b-ico')+t.name+'</h3><p class="muted">'+t.desc+'</p>'+
     '<div class="kv"><span>'+icon('cash','kv-ico')+'Entry fee</span><b>'+fmt$(fee)+'</b></div>'+
     '<button class="btn btn-small btn-primary" data-comp="'+t.id+'">'+icon('compete','b-ico')+'ENTER — '+fmt$(fee)+'</button></div>';
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
    const m=modal('<h3>'+icon('compete','ic-lg')+t.name+'</h3><p class="muted">Choose your entry:</p><div id="comp-pick"></div><button class="btn btn-small" id="comp-x">'+icon('x','b-ico')+'CANCEL</button>');
    m.querySelector('#comp-x').onclick=()=>closeModal(m);
    m.querySelector('#comp-pick').innerHTML=pool.map(i=>'<div class="strain-pick" data-entry="'+i.id+'">'+flowerSVG(i.strainId+'#'+i.id,'pick-flower')+'<span><b>'+esc(i.strainName)+'</b> — Q'+i.quality+' • '+i.amount+' oz</span></div>').join('');
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
  let html='<h3>'+icon('trophy','ic-lg')+t.name+' — RESULTS</h3>';
  rivals.forEach((rv,i)=>{ html+='<div class="leader-row'+(rv.me?' me':'')+'"><span>'+(i+1)+'. '+esc(rv.name)+'</span><b>'+rv.score+'</b></div>'; });
  if(won){
    const cashR=Math.round(800*DIFFS[S.difficulty].missionReward), repR=60;
    S.cash+=cashR; gainRep(repR); S.stats.compsWon++;
    if(t.id==='breeder') S.stats.breederCupWins++;
    addP0('freedom',3); addP0('cultivation',2); gainXP(200);
    html+='<div class="callout record"><div class="callout-crown">'+crownSVG(true,'c-ico-svg')+'</div><p class="reward-line">YOU WIN! +'+fmt$(cashR)+' +'+repR+' rep</p></div>';
    if(t.id==='breeder'&&Math.random()<0.5){ unlockStrain('crown-jewel'); html+='<p class="reward-line">'+icon('crown-gold','b-ico')+' Rare genetics unlocked: Crown Jewel!</p>'; }
    toast('🏆 Competition WON!');
  }else{
    gainXP(40);
    html+='<p class="muted">Placed #'+rank+'. Better luck next time — the judges want higher '+(t.score==='overall'?'overall excellence':t.score)+'.</p>';
  }
  html+='<button class="btn" onclick="this.closest(\'.modal-back\').remove()">'+icon('x','b-ico')+'CLOSE</button>';
  modal(html);
  save(); updateHUD(); checkMissions(); checkAchievements();
}

/* ---------------- Project 0 ---------------- */
RENDER.project0=function(){
  const r=$('project0-root');
  let html=screenHead('project0','PROJECT 0')+
   '<div class="card p0-hero">'+gasmaskSVG('p0-seal')+
   '<div class="p0-crown">'+crownSVG(false,'crown-anim')+'</div>'+
   '<p class="motto display">"IT\'S NEVER ABOUT THE MONEY."</p>'+
   '<p><span class="badge gold">'+icon('star','b-ico')+S.project0.points+' POINTS</span></p>'+
   (S.project0.titles.length?'<div class="tags" style="justify-content:center">'+S.project0.titles.map(t=>'<span class="tag gold">'+esc(t)+'</span>').join('')+'</div>':'')+'</div>'+npcBlurb('quinn');
  P0_TRACKS.forEach(tr=>{
    const pts=S.project0.tracks[tr.id]||0, lvl=p0Level(tr.id);
    const nextTh=P0_LEVEL_PTS[Math.min(lvl+1,P0_LEVEL_PTS.length-1)];
    const pct=lvl>=5?100:clamp(pts/nextTh*100,0,100);
    html+='<div class="card p0-track"><h3>'+icon(tr.ico,'ic-lg')+tr.name+' <span class="badge gold">Lv '+lvl+'</span></h3>'+
     '<div class="progress"><i style="width:'+pct+'%"></i></div>'+
     '<p class="muted">'+pts+' pts'+(lvl<5?' — '+nextTh+' for Lv '+(lvl+1):' — MAXED')+'</p></div>';
  });
  html+='<div class="card"><h3>'+icon('scroll','ic-lg')+'HOW TO EARN</h3>'+
   '<div class="kv"><span>'+icon('genetics','kv-ico')+'Breeding</span></div>'+
   '<div class="kv"><span>'+icon('preserve','kv-ico')+'Preserving genetics</span></div>'+
   '<div class="kv"><span>'+icon('harvest','kv-ico')+'85+ quality harvests</span></div>'+
   '<div class="kv"><span>'+icon('star','kv-ico')+'90+ keeper phenotypes</span></div>'+
   '<div class="kv"><span>'+icon('missions','kv-ico')+'Missions</span></div>'+
   '<div class="kv"><span>'+icon('trophy','kv-ico')+'Competitions</span></div>'+
   '<div class="kv"><span>'+icon('crown-gold','kv-ico')+'Discovering keeper phenotypes</span></div></div>';
  r.innerHTML=html;
  try{ if(typeof EX_wireP0==='function') EX_wireP0(); }catch(e){}
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
  let html=screenHead('missions','MISSIONS')+
   '<div class="tabs">'+[['active','ACTIVE'],['available','AVAILABLE'],['completed','COMPLETED']].map(t=>'<button class="tab'+(missionTab===t[0]?' active':'')+'" data-mtab="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>';
  const mDoneN=S.missionsDone.length, mTotN=MISSIONS.length, mPct=Math.round(mDoneN/Math.max(1,mTotN)*100), nm=nextMission();
  html+='<div class="card campaign-head"><h3>'+icon('missions','ic-lg')+'CAMPAIGN: ROADSIDE TO EMPIRE</h3>'+
   '<div class="progress big"><i style="width:'+mPct+'%"></i></div>'+
   '<div class="kv"><span>Missions cleared</span><b>'+mDoneN+'/'+mTotN+'</b></div>'+
   (nm?'<div class="nextup-inline"><span class="nextup-tag">'+icon('missions','b-ico')+'NEXT UP</span><b>'+esc(nm.name)+'</b><span class="muted"> \u2014 '+esc(nm.desc)+'</span></div>':'<p class="muted">'+icon('crown-gold','kv-ico')+' Campaign complete. Legend status.</p>')+'</div>';
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
      list+='<div class="card mission-card"><span class="mission-cat">'+cat+'</span><h3 style="margin-top:4px">'+(done?icon('check','b-ico'):'')+esc(m.name)+'</h3><p class="muted">'+esc(m.desc)+'</p>'+
       '<div class="progress"><i style="width:'+clamp(pr.cur/pr.target*100,0,100)+'%"></i></div>'+
       '<div class="kv"><span>'+icon('level','kv-ico')+'Progress</span><b>'+Math.min(pr.cur,pr.target)+'/'+pr.target+'</b></div>'+
       (rwTxt?'<p class="reward-line">Reward: '+rwTxt+'</p>':'')+'</div>';
    });
    if(list) html+='<h3 class="display" style="color:var(--gold);margin:14px 0 4px">'+cat.toUpperCase()+'</h3>'+list;
  });
  if(missionTab==='completed'&&!S.missionsDone.length) html+='<div class="card"><p class="muted">No missions completed yet. Get growing!</p></div>';
  r.innerHTML=html;
  r.querySelectorAll('[data-mtab]').forEach(t=>t.onclick=()=>{ missionTab=t.dataset.mtab; RENDER.missions(); });
};

/* ============================================================
   KEEPER VAULT + MOTHER ROOM + CLONING + PHENO HUNTS
   ============================================================ */
function markKeeper(report){
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
  const g=report.genetics||{};
  const rows=[['RESIN',g.resinPot],['TERPENES',g.terpenePot],['POTENCY',g.potencyPot],['BAG APPEAL',g.bagAppeal]];
  const back=cineOverlay(
   '<div class="keeper-stage">'+
   '<div class="keeper-glow"></div>'+
   '<div class="keeper-plant-sil">'+plantSVG(9,report.strainId+'#'+report.phenoNum,'keeper-plant',{frost:3,dense:true,purple:report.rarity==='legendary'})+'</div>'+
   '<div class="keeper-crown">'+crownSVG(report.rarity==='legendary','crown-anim')+'</div>'+
   '<div class="display keeper-title">KEEPER CANDIDATE</div>'+
   '<div class="keeper-name">'+esc(report.strainName)+' #'+report.phenoNum+'</div>'+
   '<div class="keeper-traits">'+rows.map((t,i)=>'<div class="kt-row" style="animation-delay:'+(0.6+i*0.5).toFixed(1)+'s"><span>'+t[0]+'</span><b data-count="'+num(t[1],0)+'" data-dec="0">0</b></div>').join('')+'</div>'+
   '<button class="btn btn-gold btn-big" id="kc-ok">'+icon('crown-gold','b-ico')+' MARK AS KEEPER</button></div>',
   'cine-keeper',0);
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
  back.querySelector('#kc-ok').onclick=()=>{ back.classList.add('cine-out'); setTimeout(()=>back.remove(),300); confirmKeeper(report); };
}
function confirmKeeper(report){
  const k={
    id:'k'+Date.now()+rndi(100,999),
    strainId:report.strainId, strainName:report.strainName, phenoNum:report.phenoNum,
    genetics:JSON.parse(JSON.stringify(report.genetics)),
    traits:report.traits.slice(), rarity:report.rarity, legendaryTrait:report.legendaryTrait||null,
    overall:report.overall, bestQuality:report.harvest.quality, bestYield:report.harvest.yieldOz,
    harvests:1, dayFound:S.day, generation:report.generation, lineage:report.lineage,
    awards:[], clonesGrown:0, cloneRuns:0
  };
  S.keepers.push(k);
  S.stats.keepersFound++;
  const h=phist(report.strainId); h.keepers++;
  const hunt=report.huntId?S.phenoHunts.find(x=>x.id===report.huntId):S.phenoHunts.find(x=>x.active&&report.strainId===x.strainId);
  if(hunt) hunt.keepersFound++;
  addP0('preservation',4); addP0('genetics',2);
  if(report.rarity==='elite') addP0('nocompromise',3);
  if(report.rarity==='legendary') addP0('genetics',6);
  gainXP(150); gainRep(10);
  toast('Keeper marked: <b>'+esc(report.strainName)+' #'+report.phenoNum+'</b>');
  save(); updateHUD(); checkMissions(); checkAchievements();
  if(current==='keepers') RENDER.keepers();
}
function vaultFullModal(report){
  const sorted=S.keepers.slice().sort((a,b)=>a.overall-b.overall);
  const weakest=sorted[0];
  let html='<h3>'+icon('warn','ic-lg')+'KEEPER VAULT FULL</h3>'+
   '<p class="muted">'+S.keepers.length+'/'+S.keeperCapacity+' slots used. Compare the new phenotype against your vault.</p>'+
   '<div class="kv"><span>'+icon('keepers','kv-ico')+'NEW: '+esc(report.strainName)+' #'+report.phenoNum+'</span><b>'+report.overall+'</b></div>';
  if(weakest) html+='<div class="kv"><span>'+icon('star','kv-ico')+'Weakest keeper: '+esc(weakest.strainName)+' #'+weakest.phenoNum+'</span><b>'+weakest.overall+'</b></div>';
  html+='<div class="btn-row"><button class="btn btn-small" id="vf-compare">'+icon('scroll','b-ico')+'COMPARE</button>'+
   '<button class="btn btn-small btn-gold" id="vf-up">'+icon('plus','b-ico')+'UPGRADE VAULT</button></div>'+
   '<button class="btn btn-small" id="vf-arch">'+icon('preserve','b-ico')+'ARCHIVE NEW PHENO</button>'+
   '<button class="btn btn-small btn-danger" id="vf-x">'+icon('x','b-ico')+'CLOSE</button>';
  const m=modal(html);
  m.querySelector('#vf-x').onclick=()=>closeModal(m);
  m.querySelector('#vf-arch').onclick=()=>{ closeModal(m); archivePheno(report); };
  m.querySelector('#vf-up').onclick=()=>{ closeModal(m); keeperTab='vault'; show('keepers'); toast('⬆️ Expand vault capacity below.'); };
  if(weakest) m.querySelector('#vf-compare').onclick=()=>{
    closeModal(m);
    compareModal(
      {name:report.strainName+' #'+report.phenoNum+' (NEW)',genetics:report.genetics,overall:report.overall},
      {name:weakest.strainName+' #'+weakest.phenoNum,genetics:weakest.genetics,overall:weakest.overall},
      [
        {label:icon('crown-gold','b-ico')+' KEEP NEW',cls:'btn-gold',fn:()=>{ S.keepers=S.keepers.filter(x=>x.id!==weakest.id); toast('🗑️ Replaced '+esc(weakest.strainName)+' #'+weakest.phenoNum); markKeeper(report); }},
        {label:'KEEP EXISTING',cls:'',fn:()=>{ archivePheno(report); }},
        {label:'CANCEL',cls:'btn-danger',fn:()=>{}}
      ]);
  };
}
/* generic side-by-side comparison */
function compareModal(a,b,actions){
  const rows=[['Vigor','vigor'],['Yield','yieldPot'],['Potency','potencyPot'],['Terpenes','terpenePot'],
    ['Resin','resinPot'],['Bag Appeal','bagAppeal'],['Flower Speed','flowerSpeed'],
    ['Stability','stability'],['Stress Tol.','stressTol']];
  let html='<h3>'+icon('scroll','ic-lg')+'PHENOTYPE COMPARE</h3><table class="cmp-table"><tr><th></th><th>'+esc(a.name)+'</th><th>'+esc(b.name)+'</th></tr>';
  rows.forEach(([label,key])=>{
    const av=Math.round(num(a.genetics[key],0)), bv=Math.round(num(b.genetics[key],0));
    html+='<tr><td>'+label+'</td><td class="'+(av>bv?'win':'')+'">'+av+'</td><td class="'+(bv>av?'win':'')+'">'+bv+'</td></tr>';
  });
  const ao=Math.round(num(a.overall,0)), bo=Math.round(num(b.overall,0));
  html+='<tr><td><b>OVERALL</b></td><td class="'+(ao>bo?'win':'')+'"><b>'+ao+'</b></td><td class="'+(bo>ao?'win':'')+'"><b>'+bo+'</b></td></tr></table>';
  html+='<div class="btn-row">'+actions.map((ac,i)=>'<button class="btn btn-small '+ac.cls+'" data-cact="'+i+'">'+ac.label+'</button>').join('')+'</div>';
  const m=modal(html);
  m.querySelectorAll('[data-cact]').forEach(btn=>btn.onclick=()=>{ const ac=actions[+btn.dataset.cact]; closeModal(m); ac.fn(); });
  S.stats.comparesDone++;
  save(); checkMissions();
}
function keeperCmpObj(k){ return {name:k.strainName+' #'+k.phenoNum,genetics:k.genetics,overall:k.overall}; }
function compareKeepers(idA,idB){
  const a=S.keepers.find(x=>x.id===idA), b=S.keepers.find(x=>x.id===idB);
  if(!a||!b) return;
  compareModal(keeperCmpObj(a),keeperCmpObj(b),[{label:'CLOSE',cls:'',fn:()=>{}}]);
}
function pickComparePartner(idA){
  const others=S.keepers.filter(x=>x.id!==idA);
  if(!others.length){ toast('Need at least 2 keepers to compare.'); return; }
  const m=modal('<h3>'+icon('scroll','sh-ico')+'COMPARE WITH...</h3><div style="max-height:50vh;overflow-y:auto;">'+
    others.map(k=>'<div class="strain-pick" data-cmpb="'+k.id+'"><b>👑 '+esc(k.strainName)+' #'+k.phenoNum+'</b> — Overall '+k.overall+'</div>').join('')+'</div>'+
    '<button class="btn btn-small" id="cmp-x">CANCEL</button>');
  m.querySelector('#cmp-x').onclick=()=>closeModal(m);
  m.querySelectorAll('[data-cmpb]').forEach(el=>el.onclick=()=>{ closeModal(m); compareKeepers(idA,el.dataset.cmpb); });
}
/* ---- mothers & clones ---- */
function promoteMother(keeperId){
  const k=S.keepers.find(x=>x.id===keeperId); if(!k) return;
  if(S.mothers.length>=S.motherCapacity){ toast('🌿 Mother room full! Upgrade capacity in EMPIRE.'); return; }
  if(S.mothers.some(mm=>mm.keeperId===keeperId)){ toast('Already a mother plant.'); return; }
  S.mothers.push({id:'m'+Date.now(),keeperId:k.id,strainId:k.strainId,strainName:k.strainName,
    phenoNum:k.phenoNum,genetics:JSON.parse(JSON.stringify(k.genetics)),traits:k.traits.slice(),
    rarity:k.rarity,legendaryTrait:k.legendaryTrait||null,dayCreated:S.day,clonesTaken:0,
    runs:0,bestQ:0,bestY:0,qualities:[],yields:[],awards:[]});
  S.stats.mothersCreated++;
  addP0('preservation',3); addP0('family',1); gainXP(100);
  toast('🌿 '+esc(k.strainName)+' #'+k.phenoNum+' is now a MOTHER PLANT');
  save(); updateHUD(); checkMissions(); checkAchievements();
  if(current==='keepers') RENDER.keepers();
}
function takeClone(motherId){
  const mo=S.mothers.find(m=>m.id===motherId); if(!mo) return;
  const slots=FACILITIES[S.facility].slots;
  if(S.plants.length>=slots){ toast('❌ No free grow slots. Expand your facility!'); return; }
  if(S.cash<25){ toast('❌ Cloning supplies cost $25.'); return; }
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
  const kk=S.keepers.find(x=>x.id===mo.keeperId); if(kk) kk.clonesGrown++;
  addP0('cultivation',1); gainXP(10);
  toast('🧬 Clone taken: '+esc(mo.strainName)+' #'+mo.phenoNum+' — identical genetics preserved.');
  save(); updateHUD(); checkMissions();
  if(current==='keepers') RENDER.keepers(); else refreshGrowUI();
}
function removeMother(motherId){
  const mo=S.mothers.find(m=>m.id===motherId); if(!mo) return;
  confirmModal('Retire mother?','Retire '+mo.strainName+' #'+mo.phenoNum+'? Existing clones keep growing.',()=>{
    S.mothers=S.mothers.filter(m=>m.id!==motherId);
    save(); toast('🌿 Mother retired.'); if(current==='keepers') RENDER.keepers();
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
  if(!isUnlocked(strainId)){ toast('\uD83D\uDD12 Genetics locked.'); return; }
  const m=modal('<h3>'+icon('hunt','ic-lg')+' PHENO HUNT</h3><p>Strain: <b>'+esc(st.name)+'</b> <span class="muted">('+fmt$(st.seed)+'/seed)</span></p>'+
   '<p class="muted">Each seed grows a unique phenotype. Hunt the keeper!</p>'+
   '<div class="btn-row"><button class="btn btn-small" data-hc="5">5 SEEDS</button>'+
   '<button class="btn btn-small" data-hc="10">10 SEEDS</button>'+
   '<button class="btn btn-small" data-hc="20">20 SEEDS</button></div>'+
   '<button class="btn btn-small" id="hunt-x">CANCEL</button>');
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
  if(ok<count) toast('🧬 Hunt started: '+ok+'/'+count+' planted (slots/cash limited). Plant the rest from MY GROWS.');
  else toast('🧬 PHENO HUNT: '+count+' x '+esc(st.name)+' planted! Find the keeper.');
  save(); updateHUD();
  if(current==='genetics') RENDER.genetics(); if(current==='grows') RENDER.grows();
}
function completeHunt(hunt){
  hunt.active=false;
  S.stats.phenoHuntsDone++;
  if(hunt.total>=10) S.stats.huntsCompleted10++;
  addP0('knowledge',3); addP0('preservation',2); gainXP(200);
  toast('🧬 PHENO HUNT COMPLETE: '+hunt.harvested+'/'+hunt.total+' harvested. Best: #'+hunt.bestPheno+' ('+hunt.bestScore+')');
  save(); checkMissions(); checkAchievements();
}
/* ---- keeper vault screen ---- */
let keeperTab='vault', keeperSort='overall', keeperFilter='all', keeperPage=0;
const KEEPER_SORTS=[['overall','OVERALL'],['resinPot','RESIN'],['terpenePot','TERPENES'],['yieldPot','YIELD'],['potencyPot','POTENCY'],['newest','NEWEST'],['oldest','OLDEST']];
RENDER.keepers=function(){
  const r=$('keepers-root');
  let html=screenHead('keepers','KEEPER VAULT')+'<div class="tabs">'+
   [['vault','KEEPERS ('+S.keepers.length+'/'+S.keeperCapacity+')','keepers'],['mothers','MOTHERS ('+S.mothers.length+'/'+S.motherCapacity+')','mothers']]
   .map(t=>'<button class="tab'+(keeperTab===t[0]?' active':'')+'" data-ktab="'+t[0]+'">'+icon(t[2],'b-ico')+t[1]+'</button>').join('')+'</div>'+(S.keepers.length?npcBlurb('archive'):'');
  html+='<div class="vault-shelf">'+(keeperTab==='vault'?keepersVaultHtml():mothersHtml())+'</div>';
  r.innerHTML=html;
  r.querySelectorAll('[data-ktab]').forEach(t=>t.onclick=()=>{ keeperTab=t.dataset.ktab; keeperPage=0; RENDER.keepers(); });
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
  let html='<div class="card cap-card"><h3>'+icon('keepers','ic-lg')+'VAULT CAPACITY</h3>'+
   '<div class="kv"><span>'+icon('keepers','kv-ico')+'Slots used</span><b>'+S.keepers.length+' / '+S.keeperCapacity+'</b></div>';
  const lvl=S.keeperCapLevel, next=lvl+1;
  if(next<KEEPER_CAPS.length){
    const cost=KEEPER_CAP_COSTS[next], gate=keeperCapGate(next);
    html+='<div class="kv"><span>'+icon('plus','kv-ico')+'Next: '+KEEPER_CAPS[next]+' slots</span><b>'+fmt$(cost)+'</b></div>'+
     (gate?'<p class="lock-note">'+icon('lock','kv-ico')+' '+esc(gate)+'</p>':'<button class="btn btn-small btn-gold" id="cap-up">'+icon('plus','b-ico')+'UPGRADE VAULT</button>');
  } else html+='<p class="muted">'+icon('check','kv-ico')+' Vault maxed at '+S.keeperCapacity+' slots.</p>';
  html+='</div>';
  if(!S.keepers.length){
    return html+'<div class="card"><p class="muted">'+icon('keepers','kv-ico')+' No keepers yet. Harvest plants, review the phenotype report, and KEEP the exceptional ones.</p></div>';
  }
  const strains=[...new Set(S.keepers.map(k=>k.strainId))];
  html+='<div class="card"><div class="btn-row">'+
   '<select id="ksort">'+KEEPER_SORTS.map(s=>'<option value="'+s[0]+'"'+(keeperSort===s[0]?' selected':'')+'>'+s[1]+'</option>').join('')+'</select>'+
   '<select id="kfilter"><option value="all">ALL STRAINS</option>'+strains.map(id=>{const st=getStrain(id);return '<option value="'+id+'"'+(keeperFilter===id?' selected':'')+'>'+esc(st?st.name:id)+'</option>';}).join('')+'</select></div></div>';
  let list=S.keepers.filter(k=>keeperFilter==='all'||k.strainId===keeperFilter);
  list=list.slice().sort((a,b)=>keeperSortVal(b)-keeperSortVal(a));
  const perPage=12, pages=Math.max(1,Math.ceil(list.length/perPage));
  keeperPage=clamp(keeperPage,0,pages-1);
  const page=list.slice(keeperPage*perPage,keeperPage*perPage+perPage);
  page.forEach(k=>{
    html+='<div class="card keeper-card r-'+k.rarity+'"><div class="keeper-hero">'+flowerSVG(k.strainId+'#'+k.phenoNum,'keeper-flower')+'</div>'+
     '<h3>'+(k.rarity==='legendary'?icon('crown-gold','b-ico'):icon('keepers','b-ico'))+esc(k.strainName)+' #'+k.phenoNum+'</h3>'+
     '<p>'+rarityBadge(k)+(k.legendaryTrait?' <span class="badge r-legendary">'+icon('crown-gold','b-ico')+esc(k.legendaryTrait)+'</span>':'')+'</p>'+
     '<div class="kv"><span>'+icon('star','kv-ico')+'Overall</span><b>'+k.overall+'</b></div>'+
     '<div class="kv"><span>'+icon('harvest','kv-ico')+'Best harvest</span><b>Q'+k.bestQuality+' • '+k.bestYield+' oz</b></div>'+
     '<div class="kv"><span>'+icon('clone','kv-ico')+'Clones grown</span><b>'+k.clonesGrown+'</b></div>'+
     statBar('Resin',k.genetics.resinPot)+statBar('Terpenes',k.genetics.terpenePot)+
     statBar('Yield',k.genetics.yieldPot)+statBar('Potency',k.genetics.potencyPot)+
     (k.traits.length?'<div class="tags">'+k.traits.slice(0,6).map(t=>'<span class="tag">'+esc(t)+'</span>').join('')+'</div>':'')+
     '<div class="btn-row"><button class="btn btn-small btn-green" data-mother="'+k.id+'">'+icon('mothers','b-ico')+'MOTHER</button>'+
     '<button class="btn btn-small" data-cmp="'+k.id+'">'+icon('scroll','b-ico')+'COMPARE</button>'+
     '<button class="btn btn-small btn-danger" data-delk="'+k.id+'">'+icon('x','b-ico')+'</button></div></div>';
  });
  if(pages>1) html+='<div class="btn-row"><button class="btn btn-small" id="kprev"'+(keeperPage===0?' disabled':'')+'>‹ PREV</button>'+
   '<button class="btn btn-small" disabled>'+(keeperPage+1)+'/'+pages+'</button>'+
   '<button class="btn btn-small" id="knext"'+(keeperPage>=pages-1?' disabled':'')+'>NEXT ›</button></div>';
  return html;
}
function mothersHtml(){
  let html='<div class="card cap-card"><h3>'+icon('mothers','ic-lg')+'MOTHER ROOM</h3>'+
   '<div class="kv"><span>'+icon('mothers','kv-ico')+'Mother slots</span><b>'+S.mothers.length+' / '+S.motherCapacity+'</b></div>'+
   '<p class="muted">Mothers preserve keeper genetics forever. Clones grow the EXACT same phenotype — seed = new pheno, clone = preserved pheno.</p></div>';
  if(!S.mothers.length) html+='<div class="card"><p class="muted">No mothers yet. Promote a keeper with MOTHER.</p></div>';
  S.mothers.forEach(mo=>{
    const avgQ=mo.qualities.length?Math.round(mo.qualities.reduce((a,b)=>a+b,0)/mo.qualities.length):0;
    const avgY=mo.yields.length?Math.round(mo.yields.reduce((a,b)=>a+b,0)/mo.yields.length*10)/10:0;
    html+='<div class="card keeper-card mother-card r-'+mo.rarity+'"><div class="mother-hero">'+plantSVG(4,mo.strainId+'#'+mo.phenoNum,'mother-plant',{bushy:true,frost:1,dense:true})+'</div>'+
     '<h3>'+icon('mothers','b-ico')+esc(mo.strainName)+' #'+mo.phenoNum+' <span class="badge green">MOTHER</span></h3>'+
     '<p>'+rarityBadge({rarity:mo.rarity})+(mo.legendaryTrait?' <span class="badge r-legendary">'+icon('crown-gold','b-ico')+esc(mo.legendaryTrait)+'</span>':'')+'</p>'+
     statBar('Resin',mo.genetics.resinPot)+statBar('Terpenes',mo.genetics.terpenePot)+statBar('Yield',mo.genetics.yieldPot)+
     '<div class="kv"><span>'+icon('clone','kv-ico')+'Clones taken</span><b>'+mo.clonesTaken+'</b></div>'+
     '<div class="kv"><span>'+icon('grow','kv-ico')+'Clone runs</span><b>'+mo.runs+'</b></div>'+
     '<div class="kv"><span>'+icon('trophy','kv-ico')+'Best clone harvest</span><b>'+(mo.runs?'Q'+mo.bestQ+' • '+mo.bestY+' oz':'—')+'</b></div>'+
     '<div class="kv"><span>'+icon('star','kv-ico')+'Avg clone</span><b>'+(mo.runs?'Q'+avgQ+' • '+avgY+' oz':'—')+'</b></div>'+
     (mo.awards.length?'<div class="tags">'+mo.awards.slice(-4).map(a=>'<span class="tag gold">'+esc(a)+'</span>').join('')+'</div>':'')+
     '<div class="btn-row"><button class="btn btn-small btn-primary" data-clone="'+mo.id+'">'+icon('clone','b-ico')+'TAKE CLONE ($25)</button>'+
     '<button class="btn btn-small btn-danger" data-delm="'+mo.id+'">'+icon('x','b-ico')+'RETIRE</button></div></div>';
  });
  return html;
}
function wireKeepers(r){
  const cu=$('cap-up'); if(cu) cu.onclick=()=>{
    const next=S.keeperCapLevel+1, cost=KEEPER_CAP_COSTS[next], gate=keeperCapGate(next);
    if(gate){ toast('🔒 '+esc(gate)); return; }
    if(S.cash<cost){ toast('❌ Need '+fmt$(cost)+'.'); return; }
    S.cash-=cost; S.keeperCapLevel=next; S.keeperCapacity=KEEPER_CAPS[next];
    S.stats.keeperCapUpgrades++; gainXP(100);
    toast('👑 Vault expanded to '+S.keeperCapacity+' slots!');
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
  toast('📈 MARKET BOOM: '+esc(tag)+' strains in HIGH demand for '+days+' days!');
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
     run:function(){ var c=WX_powerCost(); if(S.cash<c){ toast('❌ Need '+fmt$(c)+'.'); return; } S.cash-=c; toast('⚡ Emergency power online. Crisis over.'); return 'end'; }},
    {label:'RIDE IT OUT', sub:'Keep the penalty until the grid returns',
     run:function(){ toast('🕯️ Riding it out… env controls stay weakened.'); }}
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
     run:function(){ var c=WX_extermCost(); if(S.cash<c){ toast('❌ Need '+fmt$(c)+'.'); return; } S.cash-=c; WX_clearPests(false); toast('🐞 Exterminator cleared the facility.'); return 'end'; }},
    {label:'NEEM OIL TREATMENT', sub:'Pay $25 — clears pests, +stress to hit plants',
     run:function(){ if(S.cash<25){ toast('❌ Need $25.'); return; } S.cash-=25; WX_clearPests(true); toast('🌿 Neem applied. Pests gone.'); return 'end'; }},
    {label:'IGNORE IT', sub:'Pests spread to more plants each day',
     run:function(ev){ ev.data.ignored=true; toast('⚠️ Ignored… the outbreak will spread.'); }}
   ]},
 /* ---- EQUIPMENT FAILURE (UNCOMMON) ---- */
 { id:'wx-equipfail', rarity:'UNCOMMON', weight:16, cd:12, dur:[3,4],
   title:'EQUIPMENT FAILURE',
   text:function(ev){ return 'Your '+WX_equipName(ev.data.equip)+' just failed. It is offline until repaired or replaced — the room runs degraded while it is down.'; },
   canRoll:function(){ return true; },
   onStart:function(ev){ ev.data.equip=pick(['lights','hvac','co2sys','irrigation','nutrients','drycure']); },
   choices:[
    {label:'REPAIR NOW', sub:function(ev){ return 'Pay '+fmt$(WX_equipFailCost(ev))+' — back online today'; },
     run:function(ev){ var c=WX_equipFailCost(ev); if(S.cash<c){ toast('❌ Need '+fmt$(c)+'.'); return; } S.cash-=c; toast('🔧 '+esc(WX_equipName(ev.data.equip))+' repaired.'); return 'end'; }},
    {label:'RUN DEGRADED', sub:'Keep growing with it offline until it recovers',
     run:function(ev){ toast('⚠️ Running degraded — '+esc(WX_equipName(ev.data.equip))+' offline.'); }}
   ]},
 /* ---- HEAT WAVE (UNCOMMON) ---- */
 { id:'wx-heatwave', rarity:'UNCOMMON', weight:12, cd:14, dur:[3,4],
   title:'HEAT WAVE',
   text:function(){ return 'A brutal heat wave parks over the city. Room temperature climbs every day — dial in cooling or watch the plants cook.'; },
   canRoll:function(){ return true; },
   onStart:function(){},
   choices:[
    {label:'EMERGENCY COOLING', sub:function(){ return 'Pay '+fmt$(WX_heatCost())+' — heat wave neutralized'; },
     run:function(){ var c=WX_heatCost(); if(S.cash<c){ toast('❌ Need '+fmt$(c)+'.'); return; } S.cash-=c; toast('❄️ Portable ACs deployed. Heat beaten.'); return 'end'; }},
    {label:'NIGHT VENTING', sub:'Free — halves the daily temperature climb',
     run:function(ev){ ev.data.vent=true; toast('🌬️ Night venting scheduled.'); }},
    {label:'RIDE IT OUT', sub:'Temperature climbs +4°F every day',
     run:function(){ toast('🥵 Riding it out… watch those thermometers.'); }}
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
       if(S.cash<cost){ toast('❌ Need '+fmt$(cost)+'.'); return; }
       S.cash-=cost; S.equipment[best.id]=num(S.equipment[best.id],1)+1;
       if(typeof gainXP==='function') gainXP(40);
       toast('⬆️ '+esc(best.name)+' → Lv '+S.equipment[best.id]+' (sale: '+fmt$(cost)+')');
     }},
    {label:'GENETICS GRAB', sub:function(ev){ return 'Unlock a cash-locked strain at '+Math.round((1-ev.data.disc)*100)+'% off'; },
     run:function(ev){
       var cands=STRAINS.filter(function(st){ return st.lock&&st.lock.t==='cash'&&S.lockedStrains.indexOf(st.id)>=0; });
       if(!cands.length){ toast('No cash-locked genetics left to grab.'); return; }
       var st=cands[0], cost=Math.max(1,Math.round(st.seed*3*ev.data.disc));
       if(S.cash<cost){ toast('❌ Need '+fmt$(cost)+' for '+esc(st.name)+'.'); return; }
       S.cash-=cost;
       if(typeof unlockStrain==='function') unlockStrain(st.id);
     }},
    {label:'JUST BROWSING', sub:'The sale stays live — shop at your own pace',
     run:function(){ toast('🛒 Sale stays live for now. Check the depot.'); }}
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
       if(S.cash<cost){ toast('❌ Need '+fmt$(cost)+'.'); return; }
       S.cash-=cost;
       if(typeof unlockStrain==='function') unlockStrain(st.id);
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
       toast('🏆 Invitation accepted! Make the empire proud.');
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
       toast('🕊️ Keeper "'+esc(k.strainName)+' #'+int(k.phenoNum,0)+'" preserved forever. +10 P0, +15 rep');
       return 'end';
     }},
    {label:'PLEDGE A FUTURE KEEPER', sub:'+3 P0 — the vault remembers promises',
     run:function(){ if(typeof addP0==='function') addP0('preservation',3); toast('🕊️ Your pledge is recorded. +3 P0'); return 'end'; }}
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
}
function WX_endEvent(uid,expired){
  var w=S.wx; if(!w) return;
  var ev=null;
  w.events=w.events.filter(function(e){ if(e.uid===uid){ ev=e; return false; } return true; });
  if(w.pending&&w.pending.uid===uid) w.pending=null;
  if(expired&&ev) toast('📡 Passed: '+esc(ev.title));
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
  var html='<div class="wx-ev-modal"><span class="wx-rar wx-rar-'+def.rarity+'">'+def.rarity+' EVENT</span>'+
   '<h3>'+esc(ev.title)+'</h3><p>'+esc(def.text(ev))+'</p>';
  if(ev.daysLeft>0) html+='<p class="muted">Active for '+int(ev.daysLeft,0)+' more day(s). Manage it from the event banner.</p>';
  html+='<div class="wx-choices" id="wx-ev-choices"></div>'+
   '<button class="btn btn-small" id="wx-ev-later">'+(def.dismissEnds?'NOT NOW':'DECIDE LATER')+'</button></div>';
  var m=modal(html), box=m.querySelector('#wx-ev-choices');
  def.choices.forEach(function(ch){
    var b=document.createElement('button');
    b.className='btn btn-small wx-choice';
    var sub=typeof ch.sub==='function'?ch.sub(ev):ch.sub;
    b.innerHTML='<b>'+esc(ch.label)+'</b>'+(sub?'<span class="wx-sub">'+esc(sub)+'</span>':'');
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
    return '<div class="wx-ev-banner"><span class="wx-rar wx-rar-'+rar+'">'+rar+'</span>'+
     '<span class="wx-ev-t">'+esc(ev.title)+' <span class="wx-ev-d">'+int(ev.daysLeft,0)+'d left</span></span>'+
     '<button class="btn btn-small" onclick="WX_showEvent(\''+ev.uid+'\')">VIEW</button>'+
     '<button class="btn btn-small" onclick="WX_dismissEvent(\''+ev.uid+'\')">DISMISS</button></div>';
  }).join('');
}
/* ---- public cross-builder interfaces (events) ---- */
function WX_envPenalty(){ return WX_activeEvent('wx-powerout')?15:0; }
function WX_heatWave(){ return !!WX_activeEvent('wx-heatwave'); }
function WX_equipDisabled(id){ var ev=WX_activeEvent('wx-equipfail'); return !!(ev&&ev.data.equip===id); }

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
  if(changed>0&&S.day>5) toast('📊 Market shifted: '+changed+' strain(s) repriced.');
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
  var ic=typeof icon==='function'?icon('cash','ic-lg'):'';
  var html='<div class="wx-market-panel"><h3>'+ic+'MARKET CONDITIONS</h3>';
  if(!rows.length) html+='<p class="muted">Markets steady. Prices shift every few days.</p>';
  rows.forEach(function(r){
    var d=WX_DEMANDS[r.demand];
    var trend=(r.demand==='high'||r.demand==='collector')?'wx-up':'wx-down';
    html+='<div class="wx-mkt-row"><span class="wx-mkt-name">'+esc(r.name)+'</span>'+
     '<span class="wx-dem '+d.cls+'">'+d.label+'</span>'+
     '<span class="wx-trend '+trend+'">'+d.arrow+'</span>'+
     '<b>×'+r.mult.toFixed(2)+'</b><span class="muted">'+r.days+'d</span></div>';
  });
  html+='<p class="wx-note">Sell high, hold low — demand shifts every few days.</p></div>';
  return html;
}
/* ---- combined sell multiplier: buyer × market × location ---- */
function WX_sellMult(strainId,item,buyerId){
  var m=WX_marketMult(strainId), loc=1, b=1;
  try{ if(typeof EX_locMarketMult==='function') loc=num(EX_locMarketMult(),1); }catch(e){}
  if(buyerId&&typeof BUYERS!=='undefined'){
    var by=BUYERS.find(function(x){ return x&&x.id===buyerId; });
    if(by&&typeof by.mult==='function'){ try{ b=num(by.mult(item||{}),1); }catch(e){ b=1; } }
  }
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
  if(w.contracts.length<before) toast('📋 A contract expired unfulfilled.');
  var hasHistory=num(S.stats.sales,0)>0||num(S.stats.lifetimeRevenue,0)>0;
  if(!hasHistory) return;
  if(w.offers.length>=3) return;
  var n=Math.random()<0.55?(Math.random()<0.35?2:1):0, i;
  for(i=0;i<n&&w.offers.length<3;i++){
    try{ w.offers.push(WX_makeOffer()); }catch(e){}
  }
  if(n>0) toast('📋 New buyer contract offer'+(n>1?'s':'')+' — check the DISPENSARY.');
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
  if(w.contracts.length>=3){ toast('📋 Contract book full (3). Fulfill or wait for one to expire.'); return; }
  var o=w.offers.splice(i,1)[0];
  w.contracts.push(o);
  toast('📋 Contract accepted: '+esc(o.buyerName)+' — deliver '+o.qtyOz+' oz by day '+o.expiresDay+'.');
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
  if(fill.total<c.qtyOz){ toast('❌ Not enough matching product ('+fill.total.toFixed(1)+'/'+c.qtyOz+' oz).'); return; }
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
  toast('📋 Contract fulfilled: +'+fmt$(c.rewardCash)+' +'+c.rewardRep+' rep');
  try{ save(); }catch(e){}
  if(typeof updateHUD==='function') updateHUD();
  if(typeof checkMissions==='function') checkMissions();
  if(typeof current!=='undefined'&&current==='dispensary'&&RENDER.dispensary) RENDER.dispensary();
}
function WX_contractsHTML(){
  WX_init();
  var w=S.wx;
  var ic=typeof icon==='function'?icon('scroll','ic-lg'):'';
  var html='<div class="wx-contracts"><h3>'+ic+'BUYER CONTRACTS</h3>';
  if(!w.offers.length&&!w.contracts.length)
    html+='<p class="muted">No offers right now. Sell product at the dispensary and buyers will come to you with contracts.</p>';
  w.offers.forEach(function(o){
    html+='<div class="wx-offer"><div class="wx-offer-head"><b>'+esc(o.buyerName)+'</b><span class="muted">expires D'+int(o.expiresDay,0)+'</span></div>'+
     '<div class="kv"><span>Wants</span><b>'+num(o.qtyOz,0)+' oz'+(o.strainId==='any'?' (any strain)':' — '+esc(o.strainName))+'</b></div>'+
     '<div class="kv"><span>Min quality</span><b>Q'+int(o.minQuality,0)+'</b></div>'+
     (o.minTrait?'<div class="kv"><span>Min '+esc(o.minTrait.k)+'</span><b>'+int(o.minTrait.v,0)+'</b></div>':'')+
     '<div class="kv"><span>Reward</span><b class="wx-cash">'+fmt$(o.rewardCash)+' + '+int(o.rewardRep,0)+' rep</b></div>'+
     '<div class="btn-row"><button class="btn btn-small btn-green" onclick="WX_acceptOffer('+o.id+')">ACCEPT</button>'+
     '<button class="btn btn-small" onclick="WX_rejectOffer('+o.id+')">REJECT</button></div></div>';
  });
  w.contracts.forEach(function(c){
    var fill=WX_offerFill(c), ok=fill.total>=c.qtyOz;
    html+='<div class="wx-offer wx-active"><div class="wx-offer-head"><b>'+esc(c.buyerName)+'</b><span class="muted">due D'+int(c.expiresDay,0)+'</span></div>'+
     '<div class="kv"><span>Deliver</span><b>'+fill.total.toFixed(1)+'/'+num(c.qtyOz,0)+' oz'+(c.strainId==='any'?'':' — '+esc(c.strainName))+'</b></div>'+
     '<div class="progress"><i style="width:'+clamp(fill.total/Math.max(0.01,c.qtyOz)*100,0,100)+'%"></i></div>'+
     '<div class="btn-row"><button class="btn btn-small btn-gold" '+(ok?'onclick="WX_fulfillContract('+c.id+')"':'disabled')+'>'+(ok?'FULFILL — '+fmt$(c.rewardCash):'NOT ENOUGH STOCK')+'</button></div></div>';
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
  if(rw.strain&&typeof unlockStrain==='function') unlockStrain(rw.strain);
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
      setTimeout((function(n){ return function(){ toast('🏆 Challenge complete: <b>'+esc(n)+'</b> — claim it in CHALLENGES'); }; })(ch.name),50);
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
  toast('🏆 Challenge claimed: <b>'+esc(ch.name)+'</b>');
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
  var rwTxt=[rw.cash?fmt$(rw.cash):'',rw.xp?'+'+rw.xp+' XP':'',rw.rep?'+'+rw.rep+' rep':'',rw.p0?'+'+rw.p0+' P0':'',rw.strain?'🧬 genetics':''].filter(Boolean).join(' • ');
  var left=which==='daily'?'Resets tomorrow':('Renews in '+Math.max(0,int(ch.bornDay,1)+7-S.day)+'d');
  var ic=typeof icon==='function'?icon(which==='daily'?'day':'trophy','ic-lg'):'';
  return '<div class="card wx-chal-card"><span class="wx-chal-kind">'+(which==='daily'?'DAILY':'WEEKLY')+'</span>'+
   '<h3>'+ic+esc(ch.name)+'</h3><p class="muted">'+esc(ch.desc)+'</p>'+
   '<div class="progress"><i style="width:'+pct+'%"></i></div>'+
   '<div class="kv"><span>Progress</span><b>'+esc(WX_fmtProg(p))+'</b></div>'+
   (rwTxt?'<p class="wx-reward-line">Reward: '+rwTxt+'</p>':'')+
   '<div class="kv"><span class="muted">'+left+'</span>'+
   (ch.claimed?'<b class="wx-claimed">CLAIMED</b>':
     done?'<button class="btn btn-small btn-gold" data-wx-claim="'+which+'">CLAIM</button>':
     '<span class="muted">In progress…</span>')+
   '</div></div>';
}
RENDER.challenges=function(){
  var r=$('challenges-root');
  if(!r) return;
  WX_init();
  WX_ensureChals();
  var ic=typeof icon==='function'?icon('trophy','sh-ico'):'';
  var html='<div class="screenhead"><button class="backbtn" onclick="show(\'menu\')">'+(typeof icon==='function'?icon('x'):'✕')+'<span>MENU</span></button><h2>'+ic+'CHALLENGES</h2></div>';
  html+=WX_chalCardHTML('daily');
  html+=WX_chalCardHTML('weekly');
  var hist=S.wx.chal.hist||[];
  html+='<div class="card"><h3>'+(typeof icon==='function'?icon('scroll','ic-lg'):'')+'COMPLETED</h3>';
  if(hist.length){
    html+=hist.slice(0,20).map(function(h){
      return '<div class="kv"><span>'+esc(h.name)+' <span class="muted">D'+int(h.day,0)+'</span></span><b class="wx-claimed">CLAIMED</b></div>';
    }).join('');
  } else html+='<p class="muted">No challenges claimed yet.</p>';
  html+='</div>';
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
  var inner='<div class="gx-cine gx-mutcine"><div class="gx-dna">'+dnaSVG('gx-dna-svg')+'</div>'+
   '<div class="gx-cine-kicker">GENETIC ANOMALY DETECTED</div>'+
   '<h2 class="gx-cine-title">'+esc((mut&&(mut.title||mut.kind))||'MUTATION')+'</h2>'+
   '<p class="gx-cine-desc">'+esc((mut&&mut.desc)||'')+'</p>'+
   ((mut&&mut.legendary)?'<div class="gx-cine-legend">✦ LEGENDARY EXPRESSION ✦</div>':'')+
   '<p class="gx-cine-hint">TAP TO CONTINUE</p></div>';
  var back=cineOverlay(inner,'gx-cineback',3600);
  back.addEventListener('click',fin);
  setTimeout(fin,3850);
}
/* short cross cinematic played before the original createCross runs */
function GX_crossCine(cb){
  var done=false;
  function fin(){ if(done) return; done=true; if(typeof cb==='function') cb(); }
  var inner='<div class="gx-cine gx-xcine"><div class="gx-dna">'+dnaSVG('gx-dna-svg')+'</div>'+
   '<div class="gx-cine-kicker">BREEDING LAB</div>'+
   '<h2 class="gx-cine-title">FUSING PARENT DNA</h2>'+
   '<p class="gx-cine-desc">Pollen meets pistil — a new lineage begins.</p></div>';
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
  var h='<span class="gx-stars" aria-label="'+v+' of 5 stars">';
  for(var i=1;i<=5;i++){
    if(v>=i) h+='<span class="gx-star on">★</span>';
    else if(v>=i-0.5) h+='<span class="gx-star half">★</span>';
    else h+='<span class="gx-star">★</span>';
  }
  return h+'</span>';
}
function GX_predictionHTML(aId,bId){
  var pr=GX_predictCross(aId,bId);
  var A=null,B=null;
  try{ A=getStrain(aId); B=getStrain(bId); }catch(e){}
  if(!pr.ok||!A||!B) return '';
  var rows=[['yield','YIELD'],['potency','POTENCY'],['resin','RESIN'],['terpenes','TERPENES'],['vigor','VIGOR'],['stability','STABILITY']];
  var h='<div class="card gx-predict"><h3>'+icon('dna','ic')+' GENETICS LAB — OFFSPRING FORECAST</h3>';
  h+='<div class="gx-pparents"><div class="gx-ppar"><b>PARENT A</b><span>'+esc(A.name)+'</span><i>'+esc(GX_rarityLabel(GX_strainRarity(A.id)))+' · GEN '+int(A.gen,0)+'</i></div>';
  h+='<div class="gx-x">×</div>';
  h+='<div class="gx-ppar"><b>PARENT B</b><span>'+esc(B.name)+'</span><i>'+esc(GX_rarityLabel(GX_strainRarity(B.id)))+' · GEN '+int(B.gen,0)+'</i></div></div>';
  h+='<div class="gx-starrow gx-starrow-head"><span>TRAIT</span><span>FORECAST</span></div>';
  rows.forEach(function(r){ h+='<div class="gx-starrow"><span class="gx-slabel">'+r[1]+'</span>'+GX_starHTML(pr.stars[r[0]])+'</div>'; });
  h+='<div class="kv"><span>Mutation chance</span><b class="gx-gold">'+pr.mutChance+'%</b></div>';
  h+='<div class="kv"><span>Range spread</span><b>'+esc(pr.ranges)+'</b></div>';
  h+='<div class="kv"><span>Lab accuracy</span><b>'+pr.accuracy+'%</b></div>';
  h+='<div class="kv"><span>Undiscovered traits</span><b class="gx-dim">??? · ??? · ???</b></div>';
  h+='<p class="gx-disclaimer">⚠ PREDICTION — GROW TO DISCOVER. Seeds must be grown to reveal true traits.</p></div>';
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
  var h='<div class="gx-grade '+cls+'">';
  h+='<div class="gx-grade-banner">'+icon('trophy','ic')+' '+esc(g.grade)+'</div>';
  h+='<div class="gx-grade-score"><span>GRADE SCORE</span><b>'+g.score+'</b></div>';
  h+='<h4 class="gx-grade-sub">WHAT DROVE THE GRADE</h4><div class="gx-grade-parts">';
  [['Genetics',g.parts.genetics],['Phenotype',g.parts.phenotype],['Environment',g.parts.environment],
   ['Grower Care',g.parts.care],['Equipment',g.parts.equipment],['Timing',g.parts.timing]].forEach(function(p){
    h+=statBar(p[0],p[1]);
  });
  h+='</div><h4 class="gx-grade-sub">FINAL STATS</h4><div class="gx-grade-stats">';
  [['Yield (oz)',g.stats.yield],['Potency',g.stats.potency],['Resin',g.stats.resin],['Terpenes',g.stats.terpenes],
   ['Flavor',g.stats.flavor],['Aroma',g.stats.aroma],['Appearance',g.stats.appearance],['Density',g.stats.density],
   ['Growth Speed',g.stats.growthSpeed],['Stability',g.stats.stability]].forEach(function(s){
    h+='<div class="kv"><span>'+s[0]+'</span><b>'+s[1]+'</b></div>';
  });
  h+='</div><p class="gx-disclaimer">Graded by the Genetics Lab — genetics set the ceiling, your grow set the result.</p></div>';
  return h;
}

/* ---------------- lineage tree ---------------- */
function GX_nodeHTML(id,isCenter){
  var st=null;
  try{ st=getStrain(id); }catch(e){}
  if(!st) return '';
  var rar=GX_strainRarity(id);
  var gen=(st.gen!==undefined&&st.gen!==null)?('GEN '+int(st.gen,0)):'BASE';
  return '<button class="gx-node gx-rar-'+rar+(isCenter?' gx-center':'')+'" data-gx-lin="'+esc(id)+'">'+
    '<b>'+esc(st.name)+'</b><span>'+esc(GX_rarityLabel(rar))+' · '+gen+'</span></button>';
}
function GX_lineageHTML(strainId){
  GX_init();
  var center=null;
  try{ center=getStrain(strainId); }catch(e){}
  if(!center) return '<div class="gx-lintree"><p class="muted">Unknown strain.</p></div>';
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
  var h='<div class="gx-lintree"><h3>'+icon('dna','ic')+' LINEAGE — '+esc(center.name)+'</h3>';
  gens.forEach(function(ids,gi){
    var label=names[Math.min(gi,names.length-1)];
    h+='<div class="gx-gen"><button class="gx-genhead" data-gx-gen="'+gi+'">'+esc(label)+' ('+ids.length+') <span class="gx-caret">▾</span></button>'+
      '<div class="gx-gennodes" data-gx-gennodes="'+gi+'">';
    ids.forEach(function(id){ h+=GX_nodeHTML(id,id===strainId); });
    h+='</div></div>';
  });
  if(!S.gx.lineage[strainId])
    h+='<p class="muted gx-foundation">🌱 Foundation genetics — no recorded parents. Breed it to start a lineage.</p>';
  h+='<p class="gx-disclaimer">Tap any ancestor to center the tree on it.</p></div>';
  return h;
}
function GX_wireLineage(box){
  if(!box) return;
  box.querySelectorAll('[data-gx-gen]').forEach(function(hd){
    hd.onclick=function(){
      var nodes=box.querySelector('[data-gx-gennodes="'+hd.getAttribute('data-gx-gen')+'"]');
      if(nodes){ nodes.classList.toggle('gx-collapsed'); hd.classList.toggle('gx-closed'); }
    };
  });
  box.querySelectorAll('[data-gx-lin]').forEach(function(nd){
    nd.onclick=function(){
      box.innerHTML=GX_lineageHTML(nd.getAttribute('data-gx-lin'));
      GX_wireLineage(box);
    };
  });
}
function GX_lineageModal(strainId){
  var m=modal('<div class="gx-linwrap"><div id="gx-lin-box">'+GX_lineageHTML(strainId)+'</div>'+
    '<div class="btn-row"><button class="btn btn-small" id="gx-lin-close">CLOSE</button></div></div>');
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
    var b=document.createElement('button');
    b.className='btn btn-small gx-linbtn';
    b.setAttribute('data-gx-lineage',sid);
    b.innerHTML=icon('dna','b-ico')+' VIEW LINEAGE';
    b.onclick=(function(id){ return function(){ GX_lineageModal(id); }; })(sid);
    card.appendChild(b);
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
    assigned:e.assigned!==false
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
  levels:[{cost:0,bonus:1},{cost:3000,bonus:2},{cost:15000,bonus:3},{cost:75000,bonus:4},{cost:300000,bonus:5}]},
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
  if(lv>=5){ toast('⭐ '+esc(b.name)+' is already maxed out.'); return; }
  const cost=b.levels[lv].cost;
  if(num(S.cash,0)<cost){ toast('❌ Need '+fmt$(cost)+' to upgrade '+esc(b.name)+'.'); return; }
  S.cash-=cost; S.ex.buildings[id]=lv+1;
  gainXP(80); gainRep(5);
  toast('🏢 '+esc(b.name)+' → <b>LEVEL '+(lv+1)+'</b><br><span class="muted">'+esc(b.bonusText)+': '+esc(b.bfmt(b.levels[lv].bonus))+'</span>');
  save(); updateHUD(); EX_checkAch();
  if(current==='empire') RENDER.empire();
}
function EX_buildingsHTML(){
  let html='<div class="card ex-head"><h3>'+icon('empire','ic-lg')+'UPGRADEABLE BUILDINGS</h3>'+
   '<p class="muted">Ten buildings, five levels each. Real bonuses that stack with everything else you own.</p></div>';
  EX_BUILDINGS.forEach(b=>{
    const lv=EX_buildingLevel(b.id), maxed=lv>=5;
    const cur=b.levels[lv-1], nxt=maxed?null:b.levels[lv];
    html+='<div class="card ex-bcard"><div class="ex-bthumb">'+icon(b.ico,'ic-xl')+'</div>'+
     '<h3>'+esc(b.name)+' <span class="badge'+(lv>=5?' gold':'')+'">Lv '+lv+'/5</span></h3>'+
     '<p class="muted">'+esc(b.desc)+'</p>'+
     '<div class="kv"><span>'+icon('star','kv-ico')+esc(b.bonusText)+'</span><b>'+esc(b.bfmt(cur.bonus))+'</b></div>'+
     '<div class="progress"><i style="width:'+(lv/5*100)+'%"></i></div>'+
     (maxed?'<p class="ex-maxed">★ MAXED OUT</p>':
       '<div class="kv"><span>'+icon('cash','kv-ico')+'Next: '+esc(b.bfmt(nxt.bonus))+'</span><b>'+fmt$(nxt.cost)+'</b></div>'+
       '<button class="btn btn-small btn-gold ex-bigbtn" data-ex-upg="'+b.id+'">'+icon('plus','b-ico')+'UPGRADE — '+fmt$(nxt.cost)+'</button>')+
     '</div>';
  });
  return html;
}
function EX_empireTabsHTML(){
  const tabs=[['facilities','FACILITIES'],['equipment','EQUIPMENT'],['crew','CREW'],['compete','COMPETE'],['buildings','BUILDINGS'],['staff','STAFF']];
  return '<div class="tabs">'+tabs.map(t=>'<button class="tab'+(empireTab===t[0]?' active':'')+'" data-extab="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>';
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
 {id:'tech',name:'FACILITY TECH',desc:'Wrench hand. Fewer equipment failures.',salaryBase:45}
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
  if(num(S.cash,0)<c.sign){ toast('❌ Signing '+esc(c.name)+' costs '+fmt$(c.sign)+'.'); return; }
  S.cash-=c.sign;
  S.ex.employees.push({ id:'e'+Date.now()+rndi(100,999), name:c.name, role:c.role, rarity:c.rarity,
    lvl:1, xp:0, skill:c.skill, salary:c.salary, assigned:true });
  S.ex.pool=S.ex.pool.filter(x=>x.pid!==pid);
  const r=EX_roleById(c.role);
  toast('🤝 Hired <b>'+esc(c.name)+'</b> ('+esc(r.name)+', '+EX_RARITY[c.rarity].name+')');
  gainXP(60); save(); updateHUD();
  if(current==='empire') RENDER.empire();
}
function EX_fireEmp(id){
  if(!EX_init()) return;
  const e=S.ex.employees.find(x=>x.id===id); if(!e) return;
  confirmModal('Fire '+e.name+'?',esc(e.name)+' will leave the empire immediately. No severance, no hard feelings.',()=>{
    S.ex.employees=S.ex.employees.filter(x=>x.id!==id);
    toast('👋 '+esc(e.name)+' was let go.');
    save(); updateHUD();
    if(current==='empire') RENDER.empire();
  });
}
function EX_trainEmp(id){
  if(!EX_init()) return;
  const e=S.ex.employees.find(x=>x.id===id); if(!e) return;
  const cost=150*int(e.lvl,1);
  if(num(S.cash,0)<cost){ toast('❌ Training costs '+fmt$(cost)+'.'); return; }
  S.cash-=cost; e.xp=num(e.xp,0)+60;
  EX_empLevelCheck(e,true);
  save(); updateHUD();
  if(current==='empire') RENDER.empire();
}
function EX_empLevelCheck(e,announce){
  let need=int(e.lvl,1)*120, ups=0;
  while(num(e.xp,0)>=need){ e.xp-=need; e.lvl++; e.skill=num(e.skill,0)+3; e.salary=Math.round(num(e.salary,0)*1.05); need=int(e.lvl,1)*120; ups++; }
  if(ups&&announce) toast('⬆️ '+esc(e.name)+' → <b>Level '+e.lvl+'</b> (skill '+int(e.skill,0)+')');
  return ups;
}
function EX_toggleAssign(id){
  if(!EX_init()) return;
  const e=S.ex.employees.find(x=>x.id===id); if(!e) return;
  e.assigned=!e.assigned;
  toast((e.assigned?'✅ ':'⏸️ ')+esc(e.name)+(e.assigned?' back on duty.':' benched — no bonus, still on payroll.'));
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
    setTimeout(()=>toast('💸 <b>'+esc(q.name)+'</b> quit — payroll came up short!'),50);
  }
  S.cash=Math.max(0,num(S.cash,0)-total);
}
/* Cross-builder interface: summed, capped bonus for a role (assigned staff only). */
function EX_employeeBonus(role){
  if(!EX_ready()) return 0;
  const eff={grower:0.4,geneticist:0.3,budtender:0.15,processor:0.2,manager:0.1,breeding:0.5,tech:0.2};
  const cap={grower:40,geneticist:30,budtender:25,processor:30,manager:15,breeding:50,tech:30};
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
  return '<div class="card ex-ecard'+(e.assigned?'':' ex-benched')+'">'+
   '<div class="ex-ename">'+esc(e.name)+' <span class="ex-rarity '+rar.cls+'">'+rar.name+'</span></div>'+
   '<p class="muted">'+esc(r.name)+' • Lv '+int(e.lvl,1)+' • Skill '+int(e.skill,0)+'</p>'+
   '<div class="progress"><i style="width:'+pct+'%"></i></div>'+
   '<div class="kv"><span>'+icon('cash','kv-ico')+'Salary</span><b>'+fmt$(e.salary)+'/day</b></div>'+
   '<div class="btn-row">'+
   '<button class="btn btn-small btn-gold" data-ex-train="'+e.id+'">TRAIN '+fmt$(trainCost)+'</button>'+
   '<button class="btn btn-small" data-ex-assign="'+e.id+'">'+(e.assigned?'BENCH':'ASSIGN')+'</button>'+
   '<button class="btn btn-small btn-danger" data-ex-fire="'+e.id+'">FIRE</button></div></div>';
}
function EX_employeesHTML(){
  const daysLeft=Math.max(0,3-(int(S.day,1)-int(S.ex.pday,1)));
  let html='<div class="card ex-head"><h3>'+icon('crew','ic-lg')+'STAFF</h3>'+
   '<p class="muted">Named professionals — separate from your basic crew. Daily salaries, levelling, real bonuses. Only <b>assigned</b> staff grant bonuses.</p>'+
   '<div class="kv"><span>'+icon('cash','kv-ico')+'Daily payroll</span><b>'+fmt$(EX_payrollTotal())+'</b></div></div>';
  html+='<h3 class="display ex-sect">HIRING POOL</h3><p class="muted">Fresh candidates in '+daysLeft+' day'+(daysLeft===1?'':'s')+'.</p>';
  if(!S.ex.pool.length) html+='<div class="card"><p class="muted">No candidates right now. Check back soon.</p></div>';
  S.ex.pool.forEach(c=>{
    const r=EX_roleById(c.role), rar=EX_RARITY[c.rarity]||EX_RARITY.common;
    html+='<div class="card ex-eccard"><div class="ex-ename">'+esc(c.name)+' <span class="ex-rarity '+rar.cls+'">'+rar.name+'</span></div>'+
     '<p class="muted">'+esc(r.name)+' — '+esc(r.desc)+'</p>'+
     '<div class="kv"><span>'+icon('star','kv-ico')+'Skill</span><b>'+int(c.skill,0)+'</b></div>'+
     '<div class="kv"><span>'+icon('cash','kv-ico')+'Salary</span><b>'+fmt$(c.salary)+'/day</b></div>'+
     '<div class="kv"><span>'+icon('plus','kv-ico')+'Signing cost</span><b>'+fmt$(c.sign)+'</b></div>'+
     '<button class="btn btn-small btn-green ex-bigbtn" data-ex-hirepool="'+c.pid+'">HIRE '+esc(c.name).toUpperCase()+'</button></div>';
  });
  html+='<h3 class="display ex-sect">YOUR STAFF ('+S.ex.employees.length+')</h3>';
  if(!S.ex.employees.length) html+='<div class="card"><p class="muted">No staff yet. Hire from the pool above.</p></div>';
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
  if(!EX_locGateMet(l)){ toast('🔒 Gate not met for '+esc(l.name)+'.'); return; }
  const cost=num((l.gate||{}).cash,0);
  S.cash=num(S.cash,0)-cost;
  S.ex.locations.unlocked.push(id);
  gainXP(150); gainRep(25);
  toast('🗺️ Territory unlocked: <b>'+esc(l.name)+'</b>');
  save(); updateHUD();
  if(current==='locations') RENDER.locations();
}
function EX_travelTo(id){
  if(!EX_init()) return;
  if(!S.ex.locations.unlocked.includes(id)){ toast('🔒 Unlock it first.'); return; }
  if(S.ex.locations.current===id) return;
  const fee=150;
  if(num(S.cash,0)<fee){ toast('❌ Travel costs '+fmt$(fee)+'.'); return; }
  S.cash-=fee; S.ex.locations.current=id;
  toast('🚚 Moved operations to <b>'+esc(EX_locById(id).name)+'</b>');
  save(); updateHUD();
  if(current==='locations') RENDER.locations();
}
function EX_upkeepTick(){
  if(!EX_ready()) return;
  const loc=EX_locById(S.ex.locations.current), up=int(loc.upkeep,0);
  if(up<=0) return;
  if(num(S.cash,0)>=up){ S.cash-=up; return; }
  S.ex.locations.current='home';
  setTimeout(()=>toast('🏚️ Could not afford '+esc(loc.name)+' upkeep ('+fmt$(up)+'/day) — fell back to <b>Home Turf</b>.'),50);
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
  let html=screenHead('empire','TERRITORY')+
   '<div class="card ex-head"><h3>'+icon('empire','ic-lg')+'CURRENT: '+esc(cur.name)+'</h3>'+
   '<div class="kv"><span>'+icon('cash','kv-ico')+'Market prices</span><b>×'+cur.priceMult.toFixed(2)+'</b></div>'+
   '<div class="kv"><span>'+icon('temp','kv-ico')+'Environment</span><b>'+(cur.envMod.temp>=0?'+':'')+cur.envMod.temp+'°F / '+(cur.envMod.humidity>=0?'+':'')+cur.envMod.humidity+'% RH</b></div>'+
   '<div class="kv"><span>'+icon('warn','kv-ico')+'Daily upkeep</span><b>'+(cur.upkeep?fmt$(cur.upkeep):'Free')+'</b></div></div>';
  EX_LOCATIONS.forEach(l=>{
    const unlocked=S.ex.locations.unlocked.includes(l.id), isCur=S.ex.locations.current===l.id;
    const met=EX_locGateMet(l);
    const warn=unlocked&&l.upkeep>0&&num(S.cash,0)<l.upkeep*3;
    html+='<div class="card ex-loc'+(isCur?' ex-cur':'')+'"><h3>'+(isCur?'📍 ':'')+esc(l.name)+'</h3>'+
     '<p class="muted">'+esc(l.desc)+'</p>'+
     '<div class="kv"><span>'+icon('cash','kv-ico')+'Prices</span><b>×'+l.priceMult.toFixed(2)+'</b></div>'+
     '<div class="kv"><span>'+icon('star','kv-ico')+'Buyers value</span><b>'+l.prefs.map(esc).join(', ')+'</b></div>'+
     '<div class="kv"><span>'+icon('trophy','kv-ico')+'Competition</span><b>×'+l.competition.toFixed(2)+'</b></div>'+
     '<div class="kv"><span>'+icon('warn','kv-ico')+'Upkeep</span><b>'+(l.upkeep?fmt$(l.upkeep)+'/day':'Free')+'</b></div>'+
     '<p class="muted">'+icon('scroll','kv-ico')+' '+esc(l.special)+'</p>'+
     (warn?'<p class="ex-warnline">⚠️ Cash is low — miss upkeep and you fall back to Home Turf.</p>':'')+
     (isCur?'<p class="ex-maxed">★ CURRENT TERRITORY</p>':
      unlocked?'<button class="btn btn-small btn-green ex-bigbtn" data-ex-travel="'+l.id+'">TRAVEL HERE — '+fmt$(150)+'</button>':
      met?'<button class="btn btn-small btn-gold ex-bigbtn" data-ex-unlockloc="'+l.id+'">UNLOCK — '+fmt$(num((l.gate||{}).cash,0))+'</button>':
      '<p class="lock-note">'+icon('lock','kv-ico')+' Gate: '+esc(EX_locGateText(l))+'</p>')+
     '</div>';
  });
  r.innerHTML=html;
  r.querySelectorAll('[data-ex-travel]').forEach(b=>b.onclick=()=>EX_travelTo(b.dataset.exTravel));
  r.querySelectorAll('[data-ex-unlockloc]').forEach(b=>b.onclick=()=>EX_unlockLocation(b.dataset.exUnlockloc));
};

/* ================= ACHIEVEMENTS (Builder C) =================
   Checked in EX_checkAch() (runs inside EX_tick + after big events).
   reward: {cash,xp,rep,p0,p0track,title}                                   */
const EX_ACHIEVEMENTS=[
 {id:'x-firstharvest',name:'🌱 First Harvest',desc:'Complete your first harvest.',
  prog:()=>[Math.min(int(S.stats.harvests,0),1),1],reward:{cash:100,xp:50}},
 {id:'x-greenthumb',name:'🌿 Green Thumb',desc:'Complete 10 harvests.',
  prog:()=>[Math.min(int(S.stats.harvests,0),10),10],reward:{cash:300,xp:150}},
 {id:'x-geneticfreak',name:'🧬 Genetic Freak',desc:'Uncover 3 ELITE phenotypes — true genetic freaks.',
  prog:()=>[Math.min(int(S.stats.eliteFound,0),3),3],reward:{cash:600,xp:250,p0:4}},
 {id:'x-masterbreeder',name:'🧪 Master Breeder',desc:'Create 25 custom crosses.',
  prog:()=>[Math.min(int(S.stats.crosses,0),25),25],reward:{cash:1200,xp:500,p0:5}},
 {id:'x-perfectgrow',name:'💎 Perfect Grow',desc:'Harvest 90+ quality with plant health never below 95%.',
  prog:()=>[Math.min(int((S.ex.records||{}).perfectGrows,0),1),1],reward:{cash:800,xp:400,p0:4}},
 {id:'x-millionaire',name:'💰 Millionaire',desc:'Hold $1,000,000 cash.',
  prog:()=>[num(S.cash,0)>=1000000?1:0,1],reward:{xp:1000,rep:50,title:'💰 Millionaire'}},
 {id:'x-strain100',name:'🌱 Hundred Strain Club',desc:'Own 100 custom-bred strains.',
  prog:()=>[Math.min(S.customStrains.length,100),100],reward:{cash:2500,xp:1500,p0:6}},
 {id:'x-empirebuilder',name:'🏢 Empire Builder',desc:'Max any building to Level 5.',
  prog:()=>[EX_BUILDINGS.some(b=>EX_buildingLevel(b.id)>=5)?1:0,1],reward:{cash:2000,xp:600}},
 {id:'x-p0200',name:'🕊️ Project Zero Devotee',desc:'Earn 200 Project 0 points.',
  prog:()=>[Math.min(int(S.project0.points,0),200),200],reward:{xp:600,rep:40}},
 {id:'x-p0pillars',name:'🕊️ Pillars of Zero',desc:'Reach Level 2 in all 8 Project 0 tracks.',
  prog:()=>[P0_TRACKS.filter(tr=>p0Level(tr.id)>=2).length,8],reward:{xp:800,p0:6}}
];
function EX_achRewardText(a){
  const r=a.reward||{}, bits=[];
  if(r.cash) bits.push(fmt$(r.cash));
  if(r.xp) bits.push('+'+int(r.xp,0)+' XP');
  if(r.rep) bits.push('+'+int(r.rep,0)+' rep');
  if(r.p0) bits.push('+'+int(r.p0,0)+' P0');
  if(r.title) bits.push('title: '+r.title);
  return bits.join(' • ')||'—';
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
      setTimeout(()=>toast('🏅 <b>'+esc(a.name)+'</b><br><span class="muted">'+esc(a.desc)+'</span><br><span class="reward-line">'+esc(EX_achRewardText(a))+'</span>'),60);
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
  const done=EX_ACHIEVEMENTS.filter(a=>S.ex.ach[a.id]).length;
  let html=screenHead('trophy','TROPHIES & ACHIEVEMENTS')+
   '<div class="card ex-head"><h3>'+icon('trophy','ic-lg')+'EMPIRE ACHIEVEMENTS</h3>'+
   '<div class="kv"><span>'+icon('check','kv-ico')+'Unlocked</span><b>'+done+'/'+EX_ACHIEVEMENTS.length+'</b></div>'+
   '<div class="progress big"><i style="width:'+Math.round(done/EX_ACHIEVEMENTS.length*100)+'%"></i></div></div>';
  EX_ACHIEVEMENTS.forEach(a=>{
    const claimed=!!S.ex.ach[a.id];
    let cur=0,target=1;
    try{ const p=a.prog(); cur=num(p[0],0); target=Math.max(1,num(p[1],1)); }catch(e){}
    html+='<div class="card ex-ach'+(claimed?' ex-claimed':'')+'">'+
     '<h3>'+(claimed?icon('check','b-ico'):'')+esc(a.name)+'</h3><p class="muted">'+esc(a.desc)+'</p>'+
     '<div class="progress"><i style="width:'+clamp(cur/target*100,0,100)+'%"></i></div>'+
     '<div class="kv"><span>Progress</span><b>'+Math.min(cur,target)+'/'+target+'</b></div>'+
     '<p class="reward-line">Reward: '+esc(EX_achRewardText(a))+'</p>'+
     (claimed?'<p class="ex-maxed">★ CLAIMED — DAY '+int(S.ex.ach[a.id].day,1)+'</p>':'')+'</div>';
  });
  html+='<div class="card"><h3>'+icon('trophy','ic-lg')+'COMPETITION TROPHIES ('+S.ex.trophies.length+')</h3>'+
   (S.ex.trophies.length?S.ex.trophies.slice().reverse().slice(0,12).map(t=>
     '<div class="kv"><span>'+(t.place===1?'🥇':t.place===2?'🥈':'🥉')+' '+esc(t.compName||t.compId)+'</span><b>'+esc(t.strainName||'')+' — Day '+int(t.day,1)+'</b></div>').join(''):
    '<p class="muted">No trophies yet. Enter competitions from the EMPIRE screen.</p>')+'</div>';
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
  const medal=p=>p===1?'🥇':p===2?'🥈':p===3?'🥉':(p+'.');
  const rowHtml=(e,i,unit,delay)=>'<div class="ex-place ex-p'+(i+1<=3?(i+1):'x')+(e.me?' ex-me':'')+'" style="animation-delay:'+delay+'s">'+
    '<span>'+(i<3?medal(i+1):(i+1)+'.')+' '+esc(e.name)+(e.me&&e.sub?' — '+esc(e.sub):'')+'</span><b>'+e.score+' '+unit+'</b></div>';
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
      setTimeout(()=>toast('🏆 Competition WON!'),60);
      if(t.id==='breeder'&&Math.random()<0.5){ unlockStrain('crown-jewel'); }
    }else if(myOverall===2){ gainRep(20); gainXP(100); S.cash=num(S.cash,0)+Math.round(300*mult); }
    else if(myOverall===3){ gainRep(8); gainXP(60); }
    else { gainXP(40); }
    EX_syncRecords(); save(); updateHUD(); checkMissions(); checkAchievements();
  }
  function draw(){
    if(stage===0){
      box.innerHTML='<h3>'+icon('trophy','ic-lg')+esc(t.name).toUpperCase()+'</h3>'+
       '<div class="ex-cer-hero"><div class="display ex-cer-title">JUDGING DAY</div>'+
       '<p>Your entry: <b>'+esc(item.strainName)+'</b> (Q'+int(item.quality,0)+')</p>'+
       '<p class="muted">'+cats.length+' categories • '+rivals.length+' rival growers<br>Points: 🥇 5 • 🥈 3 • 🥉 1</p></div>'+
       '<button class="btn btn-primary btn-big ex-bigbtn" id="ex-cer-next">BEGIN JUDGING</button>';
    }else if(stage<=cats.length){
      const r=catRes[stage-1];
      const top=r.ents.slice(0,3).map((e,i)=>rowHtml(e,i,r.unit,0.4+i*0.7)).join('');
      const rest=r.ents.slice(3).map(e=>'<div class="ex-place ex-rest'+(e.me?' ex-me':'')+'"><span>• '+esc(e.name)+'</span><b>'+e.score+'</b></div>').join('');
      const rp=r.myPlace===1?5:r.myPlace===2?3:r.myPlace===3?1:0;
      box.innerHTML='<h3>'+icon('trophy','ic-lg')+esc(r.cat.name)+'</h3><div class="ex-places">'+top+rest+'</div>'+
       '<p class="muted">You placed '+(r.myPlace<=3?medal(r.myPlace):'#'+r.myPlace)+' — +'+rp+' pts'+(r.myPlace===1?' — 🏆 category trophy!':'')+'</p>'+
       '<button class="btn btn-primary btn-big ex-bigbtn" id="ex-cer-next">'+(stage===cats.length?'TALLY THE POINTS':'NEXT CATEGORY')+'</button>';
    }else if(stage===cats.length+1){
      const rows=board.map((b,i)=>'<div class="ex-place ex-p'+(i+1<=3?(i+1):'x')+(b.me?' ex-me':'')+'"><span>'+(i<3?medal(i+1):(i+1)+'.')+' '+esc(b.name)+'</span><b>'+b.pts+' pts</b></div>').join('');
      box.innerHTML='<h3>'+icon('crown-gold','ic-lg')+'OVERALL STANDINGS</h3><div class="ex-places">'+rows+'</div>'+
       '<button class="btn btn-gold btn-big ex-bigbtn" id="ex-cer-next">CROWN THE CHAMPION</button>';
    }else{
      applyRewards();
      const top3=board.slice(0,3);
      const rows=top3.map((b,i)=>'<div class="ex-place ex-p'+(i+1)+(b.me?' ex-me':'')+' ex-final" style="animation-delay:'+(0.5+i*0.9)+'s">'+
        '<span>'+medal(i+1)+' '+esc(b.name)+'</span><b>'+b.pts+' pts</b></div>').join('');
      let rw='';
      if(myOverall===1){
        rw='<div class="callout record"><div class="callout-crown">'+crownSVG(true,'c-ico-svg')+'</div>'+
         '<p class="reward-line">🏆 YOU WIN '+esc(t.name).toUpperCase()+'!<br>+'+fmt$(Math.round(800*DIFFS[S.difficulty].missionReward))+' • +60 rep • 🏆 trophy enshrined</p></div>';
      }else{
        rw='<p class="muted">Placed #'+myOverall+'. '+(myOverall<=3?'Podium finish — the crown is close.':'The judges want more. Breed harder, grow louder.')+'</p>';
      }
      box.innerHTML='<div class="ex-cer-hero"><div class="display ex-cer-title">CHAMPION</div></div>'+
       '<div class="ex-places">'+rows+'</div>'+rw+
       '<button class="btn btn-big ex-bigbtn" id="ex-cer-close">COLLECT &amp; CLOSE</button>';
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
  const reqHtml=req.list.map(x=>'<div class="kv"><span>'+(x.met?icon('check','kv-ico'):icon('lock','kv-ico'))+esc(x.label)+'</span><b>'+(x.met?'MET':'—')+'</b></div>').join('');
  return '<div class="card ex-legacy"><h3>'+icon('project0','ic-lg')+'PROJECT 0: LEGACY REBIRTH</h3>'+
   '<p class="muted">End this empire. Begin a new run with permanent bonuses. <b>Optional — never forced.</b></p>'+
   (runNum>0?'<div class="kv"><span>'+icon('star','kv-ico')+'Legacy runs</span><b>'+runNum+'</b></div>'+
    '<div class="kv"><span>'+icon('check','kv-ico')+'Permanent bonus</span><b>+'+num(S.ex.legacy.bonus.qual,0)+'% quality • +'+num(S.ex.legacy.bonus.yield,0)+'% yield</b></div>':'')+
   reqHtml+
   (req.met?'<button class="btn btn-danger btn-big ex-bigbtn" data-ex-legacy="1">BEGIN LEGACY REBIRTH</button>'
    :'<p class="lock-note">'+icon('lock','kv-ico')+' Meet every requirement to unlock rebirth.</p>')+'</div>';
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
  if(!req.met){ toast('🔒 Legacy requirements not met yet.'); return; }
  const runNum=int(S.ex.legacy.runs,0)+1;
  confirmModal('⚠ LEGACY REBIRTH — IRREVERSIBLE',
   'Run #'+runNum+'. KEPT: Project 0 points & tracks, all unlocked strains & custom crosses, keepers, achievements, trophies, pheno history, titles, records. '+
   'RESET: cash to '+fmt$(DIFFS[S.difficulty].cash)+' starter, day 1, plants, inventory, buildings to Lv 1, employees released, territory to Home Turf, facility/equipment/crew & missions reset. '+
   'FOREVER: +'+(8*runNum)+'% quality & +'+(5*runNum)+'% yield on every future run.',
   ()=>EX_applyLegacy(runNum));
}
function EX_applyLegacy(runNum){
  const diff=S.difficulty, D=DIFFS[diff];
  const keep={ project0:S.project0, lockedStrains:S.lockedStrains.slice(), customStrains:S.customStrains,
    keepers:S.keepers, keeperCapacity:S.keeperCapacity, achievements:S.achievements.slice(),
    titles:S.titles.slice(), phenoHistory:S.phenoHistory, phenoArchive:S.phenoArchive };
  const exKeep={ trophies:S.ex.trophies, ach:S.ex.ach, records:S.ex.records };
  S=defaultState();
  S.difficulty=diff; S.cash=D.cash; S.started=true;
  S.project0=keep.project0; S.lockedStrains=keep.lockedStrains; S.customStrains=keep.customStrains;
  S.keepers=keep.keepers; S.keeperCapacity=keep.keeperCapacity; S.achievements=keep.achievements;
  S.titles=keep.titles; S.phenoHistory=keep.phenoHistory; S.phenoArchive=keep.phenoArchive;
  S.ex=EX_defaultEx();
  S.ex.trophies=exKeep.trophies; S.ex.ach=exKeep.ach; S.ex.records=exKeep.records;
  S.ex.legacy={runs:runNum,bonus:{qual:8*runNum,yield:5*runNum}};
  EX_normalizeEx(); save(); updateHUD();
  show('home');
  toast('🔥 <b>LEGACY RUN #'+runNum+' BEGINS</b><br><span class="muted">Permanent +'+(8*runNum)+'% quality • +'+(5*runNum)+'% yield</span>');
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
    EX_record('strainValue',1+0.05*bestN,(bt?bt.strainName:bestId)+' ('+bestN+'🏆)');
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
  let html=screenHead('trophy','HALL OF RECORDS')+
   '<div class="card ex-head"><h3>'+icon('star','ic-lg')+'PERSONAL RECORDS</h3>'+
   '<p class="muted">Your all-time bests. Online leaderboards are coming later — these live on this device only.</p></div>'+
   '<div class="ex-recgrid">';
  EX_RECORD_DEFS.forEach(d=>{
    const rec=S.ex.records[d.cat];
    html+='<div class="card ex-rec"><span class="ex-reclabel">'+esc(d.label)+'</span>'+
     '<b class="ex-recval">'+(rec?esc(d.fmt(rec.val)):'—')+'</b>'+
     (rec?'<span class="muted">Day '+int(rec.day,1)+'</span>':'<span class="muted">not set</span>')+'</div>';
  });
  html+='</div>';
  html+='<div class="card ex-legend"><h3>'+icon('crown-gold','ic-lg')+'LOCAL LEGEND</h3>'+
   '<p><b>YOU</b> — the undisputed legend of this device.</p>'+
   '<div class="kv"><span>'+icon('level','kv-ico')+'Level</span><b>'+int(S.level,1)+'</b></div>'+
   '<div class="kv"><span>'+icon('day','kv-ico')+'Days survived</span><b>'+int(S.day,1)+'</b></div>'+
   '<div class="kv"><span>'+icon('trophy','kv-ico')+'Competitions won</span><b>'+int(S.stats.compsWon,0)+'</b></div>'+
   '<div class="kv"><span>'+icon('genetics','kv-ico')+'Custom strains bred</span><b>'+S.customStrains.length+'</b></div>'+
   (S.titles.length?'<div class="tags">'+S.titles.map(t=>'<span class="tag gold">'+esc(t)+'</span>').join('')+'</div>':'')+'</div>';
  html+='<div class="card"><h3>'+icon('trophy','ic-lg')+'TROPHY CASE ('+S.ex.trophies.length+')</h3>'+
   (S.ex.trophies.length?S.ex.trophies.slice().reverse().map(t=>
     '<div class="kv"><span>'+(t.place===1?'🥇':t.place===2?'🥈':'🥉')+' '+esc(t.compName||t.compId)+(t.catName&&t.catId!=='overall'?' — '+esc(t.catName):'')+'</span><b>'+esc(t.strainName||'')+'</b></div>').join(''):
    '<p class="muted">No trophies yet. Win a competition to start the case.</p>')+'</div>';
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
    else if(l.t==='cash'){ const c=st.seed*3; gap=Math.max(0,c-num(S.cash,0))/100; txt=st.name+': save '+fmt$(c)+' for the genetics'; }
    else { gap=50; txt=st.name+': unlock via Project 0 missions'; }
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
function EX_homeActions(){
  const acts=[];
  const needy=S.plants.filter(p=>p.health<50||p.water<20||p.nutrition<15).length;
  if(needy>0) acts.push({sev:'warn',t:'🚨 '+needy+' plant'+(needy===1?' needs':'s need')+' attention',s:'Health, water or food critical.',go:'grow',tab:null});
  let ready=0;
  S.plants.forEach(p=>{ try{ if(stageOf(p)>=5) ready++; }catch(e){} });
  if(ready>0) acts.push({sev:'good',t:'🌾 '+ready+' plant'+(ready===1?'':'s')+' ready to harvest',s:'Don\'t let them sit.',go:'grows',tab:null});
  const poolDue=Math.max(0,3-(int(S.day,1)-int(S.ex.pday,1)));
  if(poolDue===0&&S.ex.pool.length) acts.push({sev:'info',t:'👥 Fresh staff candidates waiting',s:'New hiring pool is in.',go:'empire',tab:'staff'});
  let wxNote='';
  try{
    if(typeof WX_activeEventMod==='function'){ const ev=WX_activeEventMod('current'); if(ev) wxNote=String(ev.title||ev.name||ev); }
  }catch(e){}
  if(wxNote) acts.push({sev:'warn',t:'🌪️ Active event: '+wxNote,s:'Check the grow room.',go:'grow',tab:null});
  try{
    if(typeof WX_marketMult==='function'){ const mm=num(WX_marketMult('all'),1); if(mm>1.05) acts.push({sev:'good',t:'📈 Market boom ×'+mm.toFixed(2),s:'Sell while prices are hot.',go:'dispensary',tab:null}); }
  }catch(e){}
  const pay=EX_payrollTotal();
  if(pay>0) acts.push({sev:'info',t:'💼 Payroll: '+fmt$(pay)+'/day ('+S.ex.employees.length+' staff)',s:'Keep cash flowing.',go:'empire',tab:'staff'});
  const nm=nextMission();
  if(nm) acts.push({sev:'info',t:'🎯 Next mission: '+nm.name,s:nm.desc,go:'missions',tab:null});
  const un=EX_nextUnlock();
  acts.push({sev:'info',t:'🔓 Next unlock: '+un.text,s:'Your fastest power spike.',go:un.go,tab:un.tab});
  if(!acts.length) acts.push({sev:'good',t:'🌱 Plant a seed',s:'The empire starts in the soil.',go:'grow',tab:null});
  return acts.slice(0,6);
}
RENDER.home=function(){
  if(!EX_init()) return;
  const r=$('home-root');
  const lvl=Math.max(1,int(S.level,1)), xp=num(S.xp,0), xpN=xpNeed(lvl);
  const hunts=S.phenoHunts.filter(h=>h.active).length;
  const recentCrosses=S.customStrains.slice(-3).reverse();
  let html='<div class="ex-dashhero"><div class="display ex-dashtitle">SHOCKER OWNZ</div>'+
   '<div class="ex-dassub">EMPIRE DASHBOARD — DAY '+int(S.day,1)+'</div></div>'+
   '<div class="ex-chips">'+
   '<div class="ex-chip"><span>DAY</span><b>'+int(S.day,1)+'</b></div>'+
   '<div class="ex-chip"><span>CASH</span><b>'+fmt$(S.cash)+'</b></div>'+
   '<div class="ex-chip"><span>REP</span><b>'+int(S.reputation,0)+'</b></div>'+
   '<div class="ex-chip"><span>LEVEL</span><b>'+lvl+'</b></div></div>'+
   '<div class="card"><div class="kv"><span>'+icon('xp','kv-ico')+'XP to next level</span><b>'+int(xp,0)+'/'+xpN+'</b></div>'+
   '<div class="progress"><i style="width:'+clamp(xp/xpN*100,0,100)+'%"></i></div></div>';
  html+='<h3 class="display ex-sect">WHAT SHOULD I DO NEXT?</h3>';
  EX_homeActions().forEach(a=>{
    html+='<button class="card ex-action ex-'+a.sev+'" data-ex-go="'+a.go+'"'+(a.tab?' data-ex-tab="'+a.tab+'"':'')+'>'+
     '<b>'+esc(a.t)+'</b><span class="muted">'+esc(a.s)+'</span></button>';
  });
  html+='<h3 class="display ex-sect">EMPIRE AT A GLANCE</h3><div class="ex-glance">'+
   '<button class="card ex-g" data-ex-go="grow"><b>'+S.plants.length+'</b><span>growing</span></button>'+
   '<button class="card ex-g" data-ex-go="genetics"><b>'+hunts+'</b><span>pheno hunts</span></button>'+
   '<button class="card ex-g" data-ex-go="breeding"><b>'+S.customStrains.length+'</b><span>custom strains</span></button>'+
   '<button class="card ex-g" data-ex-go="empire" data-ex-tab="staff"><b>'+S.ex.employees.length+'</b><span>staff</span></button>'+
   '<button class="card ex-g" data-ex-go="leaderboards"><b>'+S.ex.trophies.length+'</b><span>trophies</span></button>'+
   '<button class="card ex-g" data-ex-go="locations"><b>'+esc(EX_locById(S.ex.locations.current).name.split(' ')[0])+'</b><span>territory</span></button></div>';
  if(recentCrosses.length){
    html+='<div class="card"><h3>'+icon('breeding','ic-lg')+'RECENT CROSSES</h3>'+
     recentCrosses.map(s=>'<div class="kv"><span>'+esc(s.name)+'</span><span class="badge gold">R'+Math.round(num(s.resin,0))+'</span></div>').join('')+'</div>';
  }
  html+='<div class="card"><div class="kv"><span>'+icon('missions','kv-ico')+'Missions</span><b>'+int(S.stats.missionsDone,0)+'/'+MISSIONS.length+'</b></div>'+
   '<div class="kv"><span>'+icon('trophy','kv-ico')+'Achievements</span><b>'+EX_ACHIEVEMENTS.filter(a=>S.ex.ach[a.id]).length+'/'+EX_ACHIEVEMENTS.length+'</b></div>'+
   '<div class="btn-row"><button class="btn btn-small" data-ex-go="achievements">TROPHIES</button>'+
   '<button class="btn btn-small" data-ex-go="leaderboards">RECORDS</button>'+
   '<button class="btn btn-small" data-ex-go="locations">TERRITORY</button></div></div>';
  r.innerHTML=html;
  r.querySelectorAll('[data-ex-go]').forEach(b=>b.onclick=()=>{
    if(b.dataset.exTab) empireTab=b.dataset.exTab;
    show(b.dataset.exGo);
  });
};

/* ================= DAILY TICK =================
   Integrator calls EX_tick() from advanceDay() (after day++ / missions). */
function EX_tick(){
  if(!EX_init()) return;
  EX_payrollTick();
  S.ex.employees.forEach(e=>{ e.xp=num(e.xp,0)+8; EX_empLevelCheck(e,false); });
  if(int(S.day,1)-int(S.ex.pday,1)>=3) EX_genPool();
  EX_upkeepTick();
  const p0l=EX_buildingLevel('p0vault');
  if(p0l>1){ const trs=P0_TRACKS.map(t=>t.id); addP0(trs[int(S.day,0)%trs.length],p0l-1); }
  EX_syncRecords();
  EX_checkAch();
  save();
}
