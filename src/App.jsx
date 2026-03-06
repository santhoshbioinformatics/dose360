import { useState, useMemo, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// UNIT FAMILIES — every clinical unit with bidirectional conversion to base
// ═══════════════════════════════════════════════════════════════════════════════
const UF = {
  mass: {
    label:"Mass / Dose", base:"mg",
    units:[
      { id:"mcg",   label:"mcg (μg)",    toBase:v=>v/1000,         fromBase:v=>v*1000 },
      { id:"mg",    label:"mg",           toBase:v=>v,              fromBase:v=>v },
      { id:"g",     label:"g",            toBase:v=>v*1000,         fromBase:v=>v/1000 },
      { id:"kg",    label:"kg",           toBase:v=>v*1_000_000,    fromBase:v=>v/1_000_000 },
      { id:"gr",    label:"grain (gr)",   toBase:v=>v*64.7989,      fromBase:v=>v/64.7989 },
      { id:"oz_m",  label:"oz (mass)",    toBase:v=>v*28349.5,      fromBase:v=>v/28349.5 },
      { id:"lb_m",  label:"lb (mass)",    toBase:v=>v*453592,       fromBase:v=>v/453592 },
      { id:"units", label:"units",        toBase:v=>v,              fromBase:v=>v },
      { id:"mEq",   label:"mEq",          toBase:v=>v,              fromBase:v=>v },
      { id:"mmol",  label:"mmol",         toBase:v=>v,              fromBase:v=>v },
      { id:"mIU",   label:"mIU",          toBase:v=>v,              fromBase:v=>v },
    ],
  },
  volume: {
    label:"Volume", base:"mL",
    units:[
      { id:"mcL",   label:"mcL (μL)",     toBase:v=>v/1000,         fromBase:v=>v*1000 },
      { id:"mL",    label:"mL",           toBase:v=>v,              fromBase:v=>v },
      { id:"L",     label:"L",            toBase:v=>v*1000,         fromBase:v=>v/1000 },
      { id:"tsp",   label:"tsp (5 mL)",   toBase:v=>v*5,            fromBase:v=>v/5 },
      { id:"tbsp",  label:"tbsp (15 mL)", toBase:v=>v*15,           fromBase:v=>v/15 },
      { id:"fl_oz", label:"fl oz",        toBase:v=>v*29.5735,      fromBase:v=>v/29.5735 },
      { id:"cup",   label:"cup",          toBase:v=>v*236.588,      fromBase:v=>v/236.588 },
      { id:"pt",    label:"pint",         toBase:v=>v*473.176,      fromBase:v=>v/473.176 },
    ],
  },
  weight: {
    label:"Body Weight", base:"kg",
    units:[
      { id:"g_bw",  label:"g",            toBase:v=>v/1000,         fromBase:v=>v*1000 },
      { id:"kg",    label:"kg",           toBase:v=>v,              fromBase:v=>v },
      { id:"lb",    label:"lb",           toBase:v=>v/2.2046,       fromBase:v=>v*2.2046 },
    ],
  },
  time: {
    label:"Time", base:"hr",
    units:[
      { id:"sec",   label:"sec",          toBase:v=>v/3600,         fromBase:v=>v*3600 },
      { id:"min",   label:"min",          toBase:v=>v/60,           fromBase:v=>v*60 },
      { id:"hr",    label:"hr",           toBase:v=>v,              fromBase:v=>v },
      { id:"day",   label:"day",          toBase:v=>v*24,           fromBase:v=>v/24 },
      { id:"wk",    label:"week",         toBase:v=>v*168,          fromBase:v=>v/168 },
    ],
  },
  concentration: {
    label:"Concentration", base:"mg/mL",
    units:[
      { id:"mcg/mL",    label:"mcg/mL",   toBase:v=>v/1000,         fromBase:v=>v*1000 },
      { id:"mg/mL",     label:"mg/mL",    toBase:v=>v,              fromBase:v=>v },
      { id:"g/mL",      label:"g/mL",     toBase:v=>v*1000,         fromBase:v=>v/1000 },
      { id:"mg/dL",     label:"mg/dL",    toBase:v=>v/10,           fromBase:v=>v*10 },
      { id:"g/L",       label:"g/L",      toBase:v=>v,              fromBase:v=>v },
      { id:"mg/L",      label:"mg/L",     toBase:v=>v/1000,         fromBase:v=>v*1000 },
      { id:"mcg/dL",    label:"mcg/dL",   toBase:v=>v/100000,       fromBase:v=>v*100000 },
      { id:"units/mL",  label:"units/mL", toBase:v=>v,              fromBase:v=>v },
      { id:"%",         label:"%",        toBase:v=>v*10,           fromBase:v=>v/10 },
    ],
  },
  doseRate: {
    label:"Dose per Weight", base:"mg/kg",
    units:[
      { id:"mcg/kg",        label:"mcg/kg",       toBase:v=>v/1000,   fromBase:v=>v*1000 },
      { id:"mg/kg",         label:"mg/kg",        toBase:v=>v,        fromBase:v=>v },
      { id:"g/kg",          label:"g/kg",         toBase:v=>v*1000,   fromBase:v=>v/1000 },
      { id:"mcg/kg/min",    label:"mcg/kg/min",   toBase:v=>v/1000,   fromBase:v=>v*1000 },
      { id:"mcg/kg/hr",     label:"mcg/kg/hr",    toBase:v=>v/1000,   fromBase:v=>v*1000 },
      { id:"mg/kg/day",     label:"mg/kg/day",    toBase:v=>v,        fromBase:v=>v },
      { id:"mg/kg/hr",      label:"mg/kg/hr",     toBase:v=>v,        fromBase:v=>v },
      { id:"units/kg",      label:"units/kg",     toBase:v=>v,        fromBase:v=>v },
    ],
  },
  flowRate: {
    label:"Flow Rate", base:"mL/hr",
    units:[
      { id:"mL/hr",   label:"mL/hr",        toBase:v=>v,            fromBase:v=>v },
      { id:"mL/min",  label:"mL/min",       toBase:v=>v*60,         fromBase:v=>v/60 },
      { id:"L/hr",    label:"L/hr",         toBase:v=>v*1000,       fromBase:v=>v/1000 },
      { id:"L/day",   label:"L/day",        toBase:v=>v*1000/24,    fromBase:v=>v*24/1000 },
      { id:"mL/day",  label:"mL/day",       toBase:v=>v/24,         fromBase:v=>v*24 },
    ],
  },
  pressure: {
    label:"Pressure / BP", base:"mmHg",
    units:[
      { id:"mmHg",    label:"mmHg",         toBase:v=>v,            fromBase:v=>v },
      { id:"kPa",     label:"kPa",          toBase:v=>v*7.50062,    fromBase:v=>v/7.50062 },
      { id:"cmH2O",   label:"cmH2O",        toBase:v=>v*0.73556,    fromBase:v=>v/0.73556 },
      { id:"atm",     label:"atm",          toBase:v=>v*760,        fromBase:v=>v/760 },
    ],
  },
  height: {
    label:"Height", base:"cm",
    units:[
      { id:"cm",  label:"cm",               toBase:v=>v,            fromBase:v=>v },
      { id:"m",   label:"m",                toBase:v=>v*100,        fromBase:v=>v/100 },
      { id:"in",  label:"inches",           toBase:v=>v*2.54,       fromBase:v=>v/2.54 },
      { id:"ft",  label:"feet",             toBase:v=>v*30.48,      fromBase:v=>v/30.48 },
    ],
  },
  temperature: {
    label:"Temperature", base:"C",
    units:[
      { id:"C",   label:"°C",               toBase:v=>v,            fromBase:v=>v },
      { id:"F",   label:"°F",               toBase:v=>(v-32)*5/9,   fromBase:v=>v*9/5+32 },
      { id:"K",   label:"K",                toBase:v=>v-273.15,     fromBase:v=>v+273.15 },
    ],
  },
  glucose: {
    label:"Blood Glucose", base:"mg/dL",
    units:[
      { id:"mg/dL",   label:"mg/dL",        toBase:v=>v,            fromBase:v=>v },
      { id:"mmol/L",  label:"mmol/L",       toBase:v=>v*18.0182,    fromBase:v=>v/18.0182 },
    ],
  },
  creatinine: {
    label:"Serum Creatinine", base:"mg/dL",
    units:[
      { id:"mg/dL",   label:"mg/dL",        toBase:v=>v,            fromBase:v=>v },
      { id:"umol/L",  label:"μmol/L",       toBase:v=>v/88.42,      fromBase:v=>v*88.42 },
    ],
  },
  bsa: {
    label:"Body Surface Area", base:"m2",
    units:[
      { id:"m2",      label:"m²",           toBase:v=>v,            fromBase:v=>v },
    ],
  },
  percent: {
    label:"Percent", base:"%",
    units:[
      { id:"%",       label:"%",            toBase:v=>v,            fromBase:v=>v },
      { id:"ratio",   label:"0–1 ratio",    toBase:v=>v*100,        fromBase:v=>v/100 },
    ],
  },
  dripRate: {
    label:"Drip Rate", base:"gtts/min",
    units:[
      { id:"gtts/min",label:"gtts/min",     toBase:v=>v,            fromBase:v=>v },
    ],
  },
  kcal: {
    label:"Energy", base:"kcal",
    units:[
      { id:"kcal",    label:"kcal",         toBase:v=>v,            fromBase:v=>v },
      { id:"kJ",      label:"kJ",           toBase:v=>v/4.184,      fromBase:v=>v*4.184 },
    ],
  },
  ageYears: {
    label:"Age", base:"yr",
    units:[
      { id:"yr",      label:"years",        toBase:v=>v,            fromBase:v=>v },
      { id:"mo",      label:"months",       toBase:v=>v/12,         fromBase:v=>v*12 },
      { id:"wk_age",  label:"weeks",        toBase:v=>v/52.18,      fromBase:v=>v*52.18 },
    ],
  },
  freq: {
    label:"Frequency", base:"x",
    units:[{ id:"x", label:"—", toBase:v=>v, fromBase:v=>v }],
  },
};

function toBase(val, famId, unitId) {
  const fam = UF[famId]; if(!fam) return val;
  const u = fam.units.find(u=>u.id===unitId); return u ? u.toBase(val) : val;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEMES
// ═══════════════════════════════════════════════════════════════════════════════
const THEMES = {
  dark:{
    bg:"#07090F", surface:"#0E1120", card:"#131624",
    border:"#1C2136", text:"#EAEDf8", textMuted:"#6570A0", textFaint:"#303858",
    inputBg:"#0A0D1A", headerBg:"#09091A", shadow:"0 4px 32px rgba(0,0,0,0.6)",
    resultBg:"#0D1020",
  },
  light:{
    bg:"#EEF1FA", surface:"#FFFFFF", card:"#FFFFFF",
    border:"#DDE3F4", text:"#18203A", textMuted:"#6570A0", textFaint:"#B8C3E0",
    inputBg:"#F4F7FF", headerBg:"#FFFFFF", shadow:"0 4px 32px rgba(0,0,0,0.06)",
    resultBg:"#F4F7FF",
  },
};

const ROLES = {
  nurse:      { label:"Nurse",      icon:"🩺",  color:"#00C9A7", grad:"linear-gradient(135deg,#00C9A7,#00A08A)", badge:"RN"     },
  pharmacist: { label:"Pharmacist", icon:"⚗️",  color:"#4F8EF7", grad:"linear-gradient(135deg,#4F8EF7,#2D6FD8)", badge:"PharmD" },
  physician:  { label:"Physician",  icon:"👨‍⚕️", color:"#FF6B6B", grad:"linear-gradient(135deg,#FF6B6B,#E04444)", badge:"MD"     },
};

const REFS = [
  { id:"henke",       name:"Henke's Med-Math",    short:"Henke 8e",      icon:"📖", color:"#F59E0B",
    url:null,
    desc:"Grace Henke & Susan Buchholz — Dosage Calculation & Drug Administration, 8th Ed." },
  { id:"openfda",     name:"openFDA",             short:"openFDA",       icon:"🏛️", color:"#00C9A7",
    url:"https://open.fda.gov",
    desc:"U.S. FDA open data — drug labels, adverse events, recalls, and enforcement actions." },
  { id:"rxnorm",      name:"RxNorm (NLM)",        short:"RxNorm",        icon:"⚗️", color:"#4F8EF7",
    url:"https://www.nlm.nih.gov/research/umls/rxnorm",
    desc:"NIH/NLM normalized drug names & RxCUI codes — the clinical drug standard used in EHR systems." },
  { id:"medlineplus", name:"MedlinePlus",         short:"MedlinePlus",   icon:"🔬", color:"#C678DD",
    url:"https://medlineplus.gov/druginfo",
    desc:"NIH/NLM patient & clinician drug information, dosing, and safety data." },
  { id:"healthdata",  name:"HealthData.gov",      short:"HealthData",    icon:"📊", color:"#E5C07B",
    url:"https://healthdata.gov",
    desc:"U.S. Department of Health & Human Services open health datasets and clinical data." },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATORS
// ═══════════════════════════════════════════════════════════════════════════════
const CALCS = {
  nurse:[
    {
      id:"ibw_adjbw", name:"IBW & Adjusted Body Weight", icon:"⚖️", cat:"Body Weight",
      formula:"IBW(♂)=50+2.3×(Ht−60in) | IBW(♀)=45.5+2.3×(Ht−60in) | AdjBW=IBW+0.4×(ABW−IBW)", ref:"openfda",
      fields:[
        { id:"heightCm", label:"Height",         fam:"height", def:"cm" },
        { id:"weightKg", label:"Actual Body Weight (ABW)", fam:"weight", def:"kg" },
        { id:"sexIBW",   label:"Biological Sex",  fam:"freq",   def:"x",
          type:"select", options:[{v:"male",l:"Male"},{v:"female",l:"Female"}] },
      ],
      run:(b)=>{
        if(!b.heightCm||!b.weightKg||!b.sexIBW) return null;
        const heightIn = b.heightCm/2.54;
        const base = b.sexIBW==="male"?50:45.5;
        const ibw = Math.max(0, base + 2.3*(heightIn-60));
        const adjbw = ibw + 0.4*(b.weightKg-ibw);
        return { val:+ibw.toPrecision(4), val2:+adjbw.toPrecision(4), resFam:"weight", unit:"kg",
          label:"Ideal Body Weight (IBW)",
          extra:`AdjBW = ${adjbw.toPrecision(4)} kg  |  Actual = ${b.weightKg} kg`,
          warn: b.weightKg > ibw*1.3 ? `⚠️ Patient is obese (ABW >130% IBW) — use IBW for aminoglycosides, AdjBW for vancomycin` : null };
      },
    },
    {
      id:"bmi", name:"BMI Calculator", icon:"📏", cat:"Body Weight",
      formula:"BMI = Weight(kg) ÷ Height(m)²", ref:"openfda",
      fields:[
        { id:"weightKg", label:"Body Weight", fam:"weight", def:"kg" },
        { id:"heightCm", label:"Height",      fam:"height", def:"cm" },
      ],
      run:(b)=>{
        if(!b.weightKg||!b.heightCm) return null;
        const hM = b.heightCm/100;
        const bmi = b.weightKg/(hM*hM);
        const cat = bmi<18.5?"Underweight":bmi<25?"Normal weight":bmi<30?"Overweight":bmi<35?"Obese class I":bmi<40?"Obese class II":"Obese class III (severe)";
        return { val:+bmi.toPrecision(4), resFam:"bsa", unit:"kg/m²", label:"Body Mass Index (BMI)",
          warn: bmi>=30 ? `⚠️ ${cat} — consider IBW/AdjBW for weight-based drug dosing` : `✅ ${cat}` };
      },
    },
    {
      id:"oral_basic", name:"Oral / IM Dose", icon:"💊", cat:"Oral / IM",
      formula:"D ÷ H × Q  (Desired ÷ Have × Quantity)", ref:"henke",
      fields:[
        { id:"desired",  label:"Desired Dose",     fam:"mass",   def:"mg" },
        { id:"have",     label:"Have (On Hand)",   fam:"mass",   def:"mg" },
        { id:"quantity", label:"Quantity On Hand", fam:"volume", def:"mL" },
      ],
      run:(b)=>b.desired&&b.have&&b.quantity
        ?{ val:(b.desired/b.have)*b.quantity, resFam:"volume", unit:"mL", label:"Dose to Administer" }:null,
    },
    {
      id:"iv_flow", name:"IV Flow Rate", icon:"💉", cat:"IV Therapy",
      formula:"Volume ÷ Time", ref:"henke",
      fields:[
        { id:"volume", label:"Total Volume",  fam:"volume", def:"mL" },
        { id:"time",   label:"Infusion Time", fam:"time",   def:"hr" },
      ],
      run:(b)=>b.volume&&b.time
        ?{ val:b.volume/b.time, resFam:"flowRate", unit:"mL/hr", label:"IV Flow Rate" }:null,
    },
    {
      id:"iv_drip", name:"IV Drip Rate (gtts/min)", icon:"🩸", cat:"IV Therapy",
      formula:"(Volume × Drop Factor) ÷ Time (min)", ref:"henke",
      fields:[
        { id:"volume",     label:"Volume",        fam:"volume", def:"mL" },
        { id:"time",       label:"Infusion Time", fam:"time",   def:"min" },
        { id:"dropFactor", label:"Drop Factor",   fam:"freq",   def:"x",
          type:"select", options:[
            {v:"10",l:"10 gtts/mL — macrodrip"},{v:"15",l:"15 gtts/mL — macrodrip"},
            {v:"20",l:"20 gtts/mL — macrodrip"},{v:"60",l:"60 gtts/mL — microdrip"},
          ]},
      ],
      run:(b)=>{
        if(!b.volume||!b.time||!b.dropFactor) return null;
        const timeMin = b.time * 60; // base time is hr → convert to min
        return { val:(b.volume * parseFloat(b.dropFactor)) / timeMin, resFam:"dripRate", unit:"gtts/min", label:"Drip Rate" };
      },
    },
    {
      id:"infusion_time", name:"Infusion Time", icon:"⏱️", cat:"IV Therapy",
      formula:"Volume ÷ Flow Rate", ref:"henke",
      fields:[
        { id:"volume", label:"Total Volume", fam:"volume",   def:"mL" },
        { id:"rate",   label:"Flow Rate",    fam:"flowRate", def:"mL/hr" },
      ],
      run:(b)=>b.volume&&b.rate
        ?{ val:b.volume/b.rate, resFam:"time", unit:"hr", label:"Infusion Time" }:null,
    },
    {
      id:"vol_infused", name:"Volume Infused", icon:"🧴", cat:"IV Therapy",
      formula:"Flow Rate × Running Time", ref:"henke",
      fields:[
        { id:"rate", label:"Flow Rate",    fam:"flowRate", def:"mL/hr" },
        { id:"time", label:"Running Time", fam:"time",     def:"hr" },
      ],
      run:(b)=>b.rate&&b.time
        ?{ val:b.rate*b.time, resFam:"volume", unit:"mL", label:"Volume Infused" }:null,
    },
    {
      id:"weight_dose", name:"Weight-Based Dose", icon:"⚖️", cat:"Dosing",
      formula:"Dose per kg × Patient Weight", ref:"henke",
      fields:[
        { id:"dose",   label:"Ordered Dose",   fam:"doseRate", def:"mg/kg" },
        { id:"weight", label:"Patient Weight", fam:"weight",   def:"kg" },
      ],
      run:(b)=>b.dose&&b.weight
        ?{ val:b.dose*b.weight, resFam:"mass", unit:"mg", label:"Total Dose" }:null,
    },
    {
      id:"total_daily", name:"Total Daily Dose", icon:"📅", cat:"Dosing",
      formula:"Single Dose × Frequency/day", ref:"henke",
      fields:[
        { id:"dose", label:"Single Dose", fam:"mass", def:"mg" },
        { id:"freq", label:"Frequency",   fam:"freq", def:"x",
          type:"select", options:[
            {v:"1",l:"QD (once/day)"},{v:"2",l:"BID (2×/day)"},{v:"3",l:"TID (3×/day)"},
            {v:"4",l:"QID (4×/day)"},{v:"6",l:"Q4H (6×/day)"},{v:"4",l:"Q6H (4×/day)"},
            {v:"3",l:"Q8H (3×/day)"},{v:"2",l:"Q12H (2×/day)"},
          ]},
      ],
      run:(b)=>b.dose&&b.freq
        ?{ val:b.dose*parseFloat(b.freq), resFam:"mass", unit:"mg", label:"Total Daily Dose" }:null,
    },
    {
      id:"reconstitution", name:"Reconstitution", icon:"🧪", cat:"Preparation",
      formula:"Powder Strength ÷ Diluent Volume", ref:"henke",
      fields:[
        { id:"strength", label:"Powder Strength", fam:"mass",   def:"mg" },
        { id:"diluent",  label:"Diluent Added",   fam:"volume", def:"mL" },
      ],
      run:(b)=>b.strength&&b.diluent
        ?{ val:b.strength/b.diluent, resFam:"concentration", unit:"mg/mL", label:"Final Concentration" }:null,
    },
    {
      id:"oral_solution", name:"Oral Solution Volume", icon:"🥄", cat:"Preparation",
      formula:"(Desired ÷ Have) × Volume per Dose", ref:"henke",
      fields:[
        { id:"desired", label:"Desired Dose",       fam:"mass",   def:"mg" },
        { id:"have",    label:"Available Strength", fam:"mass",   def:"mg" },
        { id:"volume",  label:"Volume per Dose",    fam:"volume", def:"mL" },
      ],
      run:(b)=>b.desired&&b.have&&b.volume
        ?{ val:(b.desired/b.have)*b.volume, resFam:"volume", unit:"mL", label:"Volume to Give" }:null,
    },
    {
      id:"insulin_corr", name:"Insulin Correction Dose", icon:"🩺", cat:"Endocrine",
      formula:"(Current BG − Target BG) ÷ ISF", ref:"openfda",
      fields:[
        { id:"bg",     label:"Current Blood Glucose",      fam:"glucose", def:"mg/dL" },
        { id:"target", label:"Target Blood Glucose",       fam:"glucose", def:"mg/dL", placeholder:"e.g. 120 mg/dL" },
        { id:"isf",    label:"Insulin Sensitivity Factor", fam:"glucose", def:"mg/dL", placeholder:"mg/dL per unit" },
      ],
      run:(b)=>{
        if(!b.bg||!b.target||!b.isf) return null;
        const val=(b.bg-b.target)/b.isf;
        return { val, resFam:"mass", unit:"units", label:"Correction Dose",
          warn:val<0?"⚠️ BG below target — do NOT give correction":null };
      },
    },
    {
      id:"icu_drip_n", name:"ICU Drip Rate (mcg/kg/min)", icon:"🏥", cat:"ICU",
      formula:"(Dose × Wt × 60) ÷ (Conc(mg/mL) × 1000)", ref:"openfda",
      fields:[
        { id:"dose",   label:"Ordered Dose",      fam:"doseRate",      def:"mcg/kg/min" },
        { id:"weight", label:"Patient Weight",    fam:"weight",        def:"kg" },
        { id:"conc",   label:"Drug Concentration",fam:"concentration", def:"mg/mL" },
      ],
      run:(b)=>b.dose&&b.weight&&b.conc
        ?{ val:(b.dose*b.weight*60)/(b.conc*1000), resFam:"flowRate", unit:"mL/hr", label:"Infusion Rate" }:null,
    },
    {
      id:"map_n", name:"Mean Arterial Pressure", icon:"❤️", cat:"ICU",
      formula:"DBP + (SBP − DBP) ÷ 3", ref:"openfda",
      fields:[
        { id:"sbp", label:"Systolic BP",  fam:"pressure", def:"mmHg" },
        { id:"dbp", label:"Diastolic BP", fam:"pressure", def:"mmHg" },
      ],
      run:(b)=>{
        if(!b.sbp||!b.dbp) return null;
        const val=b.dbp+(b.sbp-b.dbp)/3;
        return { val, resFam:"pressure", unit:"mmHg", label:"Mean Arterial Pressure",
          warn:val<65?"⚠️ MAP < 65 mmHg — consider vasopressor support":null };
      },
    },
    {
      id:"heparin_n", name:"Heparin Infusion Rate", icon:"💉", cat:"Anticoagulation",
      formula:"Ordered Units/hr ÷ Bag Concentration (units/mL)", ref:"openfda",
      fields:[
        { id:"unitsHr", label:"Ordered Rate",       fam:"doseRate",      def:"units/kg", placeholder:"e.g. 1000 units/hr" },
        { id:"conc",    label:"Bag Concentration",  fam:"concentration", def:"units/mL" },
      ],
      run:(b)=>b.unitsHr&&b.conc
        ?{ val:b.unitsHr/b.conc, resFam:"flowRate", unit:"mL/hr", label:"Infusion Rate" }:null,
    },
  ],

  pharmacist:[
    {
      id:"ibw_adjbw", name:"IBW & Adjusted Body Weight", icon:"⚖️", cat:"Body Weight",
      formula:"IBW(♂)=50+2.3×(Ht−60in) | IBW(♀)=45.5+2.3×(Ht−60in) | AdjBW=IBW+0.4×(ABW−IBW)", ref:"openfda",
      fields:[
        { id:"heightCm", label:"Height",         fam:"height", def:"cm" },
        { id:"weightKg", label:"Actual Body Weight (ABW)", fam:"weight", def:"kg" },
        { id:"sexIBW",   label:"Biological Sex",  fam:"freq",   def:"x",
          type:"select", options:[{v:"male",l:"Male"},{v:"female",l:"Female"}] },
      ],
      run:(b)=>{
        if(!b.heightCm||!b.weightKg||!b.sexIBW) return null;
        const heightIn = b.heightCm/2.54;
        const base = b.sexIBW==="male"?50:45.5;
        const ibw = Math.max(0, base + 2.3*(heightIn-60));
        const adjbw = ibw + 0.4*(b.weightKg-ibw);
        return { val:+ibw.toPrecision(4), val2:+adjbw.toPrecision(4), resFam:"weight", unit:"kg",
          label:"Ideal Body Weight (IBW)",
          extra:`AdjBW = ${adjbw.toPrecision(4)} kg  |  Actual = ${b.weightKg} kg`,
          warn: b.weightKg > ibw*1.3 ? `⚠️ Patient is obese (ABW >130% IBW) — use IBW for aminoglycosides, AdjBW for vancomycin` : null };
      },
    },
    {
      id:"bmi", name:"BMI Calculator", icon:"📏", cat:"Body Weight",
      formula:"BMI = Weight(kg) ÷ Height(m)²", ref:"openfda",
      fields:[
        { id:"weightKg", label:"Body Weight", fam:"weight", def:"kg" },
        { id:"heightCm", label:"Height",      fam:"height", def:"cm" },
      ],
      run:(b)=>{
        if(!b.weightKg||!b.heightCm) return null;
        const hM = b.heightCm/100;
        const bmi = b.weightKg/(hM*hM);
        const cat = bmi<18.5?"Underweight":bmi<25?"Normal weight":bmi<30?"Overweight":bmi<35?"Obese class I":bmi<40?"Obese class II":"Obese class III (severe)";
        return { val:+bmi.toPrecision(4), resFam:"bsa", unit:"kg/m²", label:"Body Mass Index (BMI)",
          warn: bmi>=30 ? `⚠️ ${cat} — consider IBW/AdjBW for weight-based drug dosing` : `✅ ${cat}` };
      },
    },
    {
      id:"dimensional", name:"Dimensional Analysis", icon:"🔬", cat:"Core",
      formula:"(Dose × Weight) ÷ Concentration", ref:"henke",
      fields:[
        { id:"dose",   label:"Ordered Dose",      fam:"mass",          def:"mg" },
        { id:"weight", label:"Patient Weight",    fam:"weight",        def:"kg" },
        { id:"conc",   label:"Concentration",     fam:"concentration", def:"mg/mL" },
      ],
      run:(b)=>b.dose&&b.conc
        ?{ val:(b.dose*(b.weight||1))/b.conc, resFam:"volume", unit:"mL", label:"Volume to Administer" }:null,
    },
    {
      id:"crcl", name:"CrCl — Cockcroft-Gault", icon:"🫘", cat:"Renal",
      formula:"[(140−Age)×Wt]÷(72×SCr)  ×0.85 if ♀", ref:"openfda",
      fields:[
        { id:"age",        label:"Patient Age",     fam:"ageYears",   def:"yr" },
        { id:"weight",     label:"Actual Weight",   fam:"weight",     def:"kg" },
        { id:"creatinine", label:"Serum Creatinine",fam:"creatinine", def:"mg/dL" },
        { id:"sex",        label:"Biological Sex",  fam:"freq",       def:"x",
          type:"select", options:[{v:"male",l:"Male"},{v:"female",l:"Female"}] },
      ],
      run:(b)=>{
        if(!b.age||!b.weight||!b.creatinine) return null;
        const base=((140-b.age)*b.weight)/(72*b.creatinine);
        const val=b.sex==="female"?base*0.85:base;
        return { val, resFam:"flowRate", unit:"mL/min", label:"Creatinine Clearance",
          warn:val<15?"⚠️ Stage 5 CKD / ESRD":val<30?"⚠️ Severe renal impairment — dose adjustment required":val<60?"⚠️ Moderate renal impairment":null };
      },
    },
    {
      id:"loading", name:"Loading Dose (PK)", icon:"📈", cat:"Pharmacokinetics",
      formula:"Vd (L/kg) × Weight × Target Plasma Conc", ref:"henke",
      fields:[
        { id:"vd",       label:"Volume of Distribution", fam:"concentration", def:"mg/L", placeholder:"L/kg e.g. 0.7" },
        { id:"weight",   label:"Patient Weight",          fam:"weight",        def:"kg" },
        { id:"targetCp", label:"Target Concentration",   fam:"concentration", def:"mg/L" },
      ],
      run:(b)=>b.vd&&b.weight&&b.targetCp
        ?{ val:b.vd*b.weight*b.targetCp, resFam:"mass", unit:"mg", label:"Loading Dose" }:null,
    },
    {
      id:"maintenance", name:"Maintenance Dose (PK)", icon:"📊", cat:"Pharmacokinetics",
      formula:"CL (L/hr) × Target Css × Interval (τ)", ref:"henke",
      fields:[
        { id:"cl",       label:"Drug Clearance",          fam:"flowRate",      def:"L/hr" },
        { id:"targetCp", label:"Target Steady-State Conc",fam:"concentration", def:"mg/L" },
        { id:"interval", label:"Dosing Interval (τ)",     fam:"time",          def:"hr" },
      ],
      run:(b)=>b.cl&&b.targetCp&&b.interval
        ?{ val:b.cl*b.targetCp*b.interval, resFam:"mass", unit:"mg", label:"Maintenance Dose" }:null,
    },
    {
      id:"bsa_calc", name:"BSA — Mosteller Formula", icon:"📐", cat:"Oncology",
      formula:"√(Weight(kg) × Height(cm) ÷ 3600)", ref:"henke",
      fields:[
        { id:"weight", label:"Body Weight", fam:"weight", def:"kg" },
        { id:"height", label:"Height",      fam:"height", def:"cm" },
      ],
      run:(b)=>b.weight&&b.height
        ?{ val:Math.sqrt((b.weight*b.height)/3600), resFam:"bsa", unit:"m²", label:"Body Surface Area" }:null,
    },
    {
      id:"bsa_dose", name:"BSA-Based Dose (Chemo)", icon:"🧬", cat:"Oncology",
      formula:"Protocol Dose (mg/m²) × Patient BSA (m²)", ref:"openfda",
      fields:[
        { id:"dose", label:"Protocol Dose (mg/m²)", fam:"mass", def:"mg", placeholder:"mg per m²" },
        { id:"bsa",  label:"Patient BSA",            fam:"bsa",  def:"m2" },
      ],
      run:(b)=>b.dose&&b.bsa
        ?{ val:b.dose*b.bsa, resFam:"mass", unit:"mg", label:"Chemotherapy Dose" }:null,
    },
    {
      id:"heparin_ph", name:"Heparin Infusion Rate", icon:"💉", cat:"Anticoagulation",
      formula:"Ordered Units/hr ÷ Bag Concentration (units/mL)", ref:"openfda",
      fields:[
        { id:"unitsHr", label:"Ordered Rate (units/hr)", fam:"doseRate",      def:"units/kg", placeholder:"e.g. 1000" },
        { id:"conc",    label:"Bag Concentration",       fam:"concentration", def:"units/mL" },
      ],
      run:(b)=>b.unitsHr&&b.conc
        ?{ val:b.unitsHr/b.conc, resFam:"flowRate", unit:"mL/hr", label:"Infusion Rate" }:null,
    },
    {
      id:"tpn_dextrose", name:"TPN Dextrose Calories", icon:"🍬", cat:"TPN / Nutrition",
      formula:"(Dextrose% ÷ 100) × Volume(mL) × 3.4 kcal/g", ref:"openfda",
      fields:[
        { id:"dexConc", label:"Dextrose Concentration", fam:"freq", def:"x",
          type:"select", options:[{v:"5",l:"D5W — 5%"},{v:"10",l:"D10W — 10%"},{v:"20",l:"D20W — 20%"},{v:"30",l:"D30W — 30%"},{v:"50",l:"D50W — 50%"},{v:"70",l:"D70W — 70%"}] },
        { id:"volume",  label:"Volume",                 fam:"volume", def:"mL" },
      ],
      run:(b)=>b.dexConc&&b.volume
        ?{ val:(parseFloat(b.dexConc)/100)*b.volume*3.4, resFam:"kcal", unit:"kcal", label:"Dextrose Calories" }:null,
    },
    {
      id:"tpn_aa", name:"TPN Amino Acid Requirement", icon:"🧫", cat:"TPN / Nutrition",
      formula:"Weight(kg) × Protein Goal (g/kg/day)", ref:"openfda",
      fields:[
        { id:"weight", label:"Patient Weight", fam:"weight", def:"kg" },
        { id:"dose",   label:"Protein Goal",   fam:"doseRate",def:"g/kg", placeholder:"g/kg/day — 0.8–2.0" },
      ],
      run:(b)=>b.weight&&b.dose
        ?{ val:b.weight*b.dose, resFam:"mass", unit:"g", label:"Daily Amino Acid Requirement" }:null,
    },
    {
      id:"tpn_lipid", name:"TPN Lipid Emulsion Calories", icon:"🫧", cat:"TPN / Nutrition",
      formula:"Volume × kcal/mL (1.1 / 2.0 / 3.0)", ref:"openfda",
      fields:[
        { id:"volume",  label:"Lipid Volume",        fam:"volume", def:"mL" },
        { id:"lipconc", label:"Lipid Concentration", fam:"freq",   def:"x",
          type:"select", options:[{v:"1.1",l:"10% — 1.1 kcal/mL"},{v:"2.0",l:"20% — 2.0 kcal/mL"},{v:"3.0",l:"30% — 3.0 kcal/mL"}] },
      ],
      run:(b)=>b.volume&&b.lipconc
        ?{ val:b.volume*parseFloat(b.lipconc), resFam:"kcal", unit:"kcal", label:"Lipid Calories" }:null,
    },
    {
      id:"urr", name:"URR — Urea Reduction Ratio", icon:"💧", cat:"Renal Dialysis",
      formula:"(Pre-BUN − Post-BUN) ÷ Pre-BUN × 100", ref:"openfda",
      fields:[
        { id:"preBUN",  label:"Pre-Dialysis BUN",  fam:"concentration", def:"mg/dL" },
        { id:"postBUN", label:"Post-Dialysis BUN", fam:"concentration", def:"mg/dL" },
      ],
      run:(b)=>{
        if(!b.preBUN||!b.postBUN) return null;
        const val=((b.preBUN-b.postBUN)/b.preBUN)*100;
        return { val, resFam:"percent", unit:"%", label:"Urea Reduction Ratio",
          warn:val<65?"⚠️ URR < 65% — below adequacy target (aim ≥ 65%)":null };
      },
    },
    {
      id:"ktv", name:"Kt/V — Dialysis Adequacy", icon:"🫘", cat:"Renal Dialysis",
      formula:"Daugirdas 2nd Generation Formula", ref:"openfda",
      fields:[
        { id:"preBUN",  label:"Pre-Dialysis BUN",       fam:"concentration", def:"mg/dL" },
        { id:"postBUN", label:"Post-Dialysis BUN",      fam:"concentration", def:"mg/dL" },
        { id:"ufVol",   label:"Ultrafiltration Volume", fam:"volume",        def:"L" },
        { id:"weight",  label:"Post-Dialysis Weight",   fam:"weight",        def:"kg" },
      ],
      run:(b)=>{
        if(!b.preBUN||!b.postBUN||!b.weight) return null;
        const r=b.postBUN/b.preBUN, uf=(b.ufVol||0)/b.weight;
        const val=-Math.log(r-0.008*60)+(4-3.5*r)*uf;
        return isNaN(val)||!isFinite(val)?null:{ val, resFam:"bsa", unit:"", label:"Kt/V",
          warn:val<1.2?"⚠️ Kt/V < 1.2 — inadequate (target ≥ 1.2)":null };
      },
    },
  ],

  physician:[
    {
      id:"ibw_adjbw", name:"IBW & Adjusted Body Weight", icon:"⚖️", cat:"Body Weight",
      formula:"IBW(♂)=50+2.3×(Ht−60in) | IBW(♀)=45.5+2.3×(Ht−60in) | AdjBW=IBW+0.4×(ABW−IBW)", ref:"openfda",
      fields:[
        { id:"heightCm", label:"Height",         fam:"height", def:"cm" },
        { id:"weightKg", label:"Actual Body Weight (ABW)", fam:"weight", def:"kg" },
        { id:"sexIBW",   label:"Biological Sex",  fam:"freq",   def:"x",
          type:"select", options:[{v:"male",l:"Male"},{v:"female",l:"Female"}] },
      ],
      run:(b)=>{
        if(!b.heightCm||!b.weightKg||!b.sexIBW) return null;
        const heightIn = b.heightCm/2.54;
        const base = b.sexIBW==="male"?50:45.5;
        const ibw = Math.max(0, base + 2.3*(heightIn-60));
        const adjbw = ibw + 0.4*(b.weightKg-ibw);
        return { val:+ibw.toPrecision(4), val2:+adjbw.toPrecision(4), resFam:"weight", unit:"kg",
          label:"Ideal Body Weight (IBW)",
          extra:`AdjBW = ${adjbw.toPrecision(4)} kg  |  Actual = ${b.weightKg} kg`,
          warn: b.weightKg > ibw*1.3 ? `⚠️ Patient is obese (ABW >130% IBW) — use IBW for aminoglycosides, AdjBW for vancomycin` : null };
      },
    },
    {
      id:"bmi", name:"BMI Calculator", icon:"📏", cat:"Body Weight",
      formula:"BMI = Weight(kg) ÷ Height(m)²", ref:"openfda",
      fields:[
        { id:"weightKg", label:"Body Weight", fam:"weight", def:"kg" },
        { id:"heightCm", label:"Height",      fam:"height", def:"cm" },
      ],
      run:(b)=>{
        if(!b.weightKg||!b.heightCm) return null;
        const hM = b.heightCm/100;
        const bmi = b.weightKg/(hM*hM);
        const cat = bmi<18.5?"Underweight":bmi<25?"Normal weight":bmi<30?"Overweight":bmi<35?"Obese class I":bmi<40?"Obese class II":"Obese class III (severe)";
        return { val:+bmi.toPrecision(4), resFam:"bsa", unit:"kg/m²", label:"Body Mass Index (BMI)",
          warn: bmi>=30 ? `⚠️ ${cat} — consider IBW/AdjBW for weight-based drug dosing` : `✅ ${cat}` };
      },
    },
    {
      id:"youngs", name:"Pediatric — Young's Rule", icon:"👶", cat:"Pediatrics",
      formula:"Age ÷ (Age + 12) × Adult Dose", ref:"henke",
      fields:[
        { id:"age",       label:"Child's Age",  fam:"ageYears", def:"yr" },
        { id:"adultDose", label:"Adult Dose",   fam:"mass",     def:"mg" },
      ],
      run:(b)=>b.age&&b.adultDose
        ?{ val:(b.age/(b.age+12))*b.adultDose, resFam:"mass", unit:"mg", label:"Pediatric Dose" }:null,
    },
    {
      id:"clarks", name:"Pediatric — Clark's Rule", icon:"🧒", cat:"Pediatrics",
      formula:"(Child Weight lbs ÷ 150) × Adult Dose", ref:"henke",
      fields:[
        { id:"weightLbs", label:"Child's Weight", fam:"weight", def:"lb" },
        { id:"adultDose", label:"Adult Dose",     fam:"mass",   def:"mg" },
      ],
      run:(b)=>{
        if(!b.weightLbs||!b.adultDose) return null;
        const lbs=b.weightLbs*2.2046; // base is kg → convert to lb
        return { val:(lbs/150)*b.adultDose, resFam:"mass", unit:"mg", label:"Pediatric Dose" };
      },
    },
    {
      id:"peds_wt", name:"Pediatric Weight-Based", icon:"⚖️", cat:"Pediatrics",
      formula:"Dose (per kg) × Patient Weight", ref:"henke",
      fields:[
        { id:"dose",   label:"Dose per kg",    fam:"doseRate", def:"mg/kg" },
        { id:"weight", label:"Patient Weight", fam:"weight",   def:"kg" },
      ],
      run:(b)=>b.dose&&b.weight
        ?{ val:b.dose*b.weight, resFam:"mass", unit:"mg", label:"Pediatric Dose" }:null,
    },
    {
      id:"total_daily_rx", name:"Total Daily Dose", icon:"📅", cat:"Prescribing",
      formula:"Single Dose × Frequency/day", ref:"henke",
      fields:[
        { id:"dose", label:"Single Dose", fam:"mass", def:"mg" },
        { id:"freq", label:"Frequency",   fam:"freq", def:"x",
          type:"select", options:[
            {v:"1",l:"QD"},{v:"2",l:"BID"},{v:"3",l:"TID"},{v:"4",l:"QID"},
            {v:"6",l:"Q4H"},{v:"4",l:"Q6H"},{v:"3",l:"Q8H"},{v:"2",l:"Q12H"},
          ]},
      ],
      run:(b)=>b.dose&&b.freq
        ?{ val:b.dose*parseFloat(b.freq), resFam:"mass", unit:"mg", label:"Total Daily Dose" }:null,
    },
    {
      id:"wt_based_rx", name:"Weight-Based Prescribing", icon:"💊", cat:"Prescribing",
      formula:"Dose (per kg) × Patient Weight", ref:"henke",
      fields:[
        { id:"dose",   label:"Target Dose",    fam:"doseRate", def:"mg/kg" },
        { id:"weight", label:"Patient Weight", fam:"weight",   def:"kg" },
      ],
      run:(b)=>b.dose&&b.weight
        ?{ val:b.dose*b.weight, resFam:"mass", unit:"mg", label:"Prescribed Dose" }:null,
    },
    {
      id:"bsa_chemo_rx", name:"Chemotherapy Dose (BSA)", icon:"🧬", cat:"Oncology",
      formula:"Protocol Dose (mg/m²) × Patient BSA (m²)", ref:"openfda",
      fields:[
        { id:"dose", label:"Protocol Dose (mg/m²)", fam:"mass", def:"mg" },
        { id:"bsa",  label:"Patient BSA (m²)",      fam:"bsa",  def:"m2" },
      ],
      run:(b)=>b.dose&&b.bsa
        ?{ val:b.dose*b.bsa, resFam:"mass", unit:"mg", label:"Chemotherapy Dose" }:null,
    },
    {
      id:"crcl_rx", name:"Renal Dose Adjustment (CrCl)", icon:"🫘", cat:"Renal",
      formula:"Cockcroft-Gault", ref:"openfda",
      fields:[
        { id:"age",        label:"Patient Age",     fam:"ageYears",   def:"yr" },
        { id:"weight",     label:"Body Weight",     fam:"weight",     def:"kg" },
        { id:"creatinine", label:"Serum Creatinine",fam:"creatinine", def:"mg/dL" },
        { id:"sex",        label:"Biological Sex",  fam:"freq",       def:"x",
          type:"select", options:[{v:"male",l:"Male"},{v:"female",l:"Female"}] },
      ],
      run:(b)=>{
        if(!b.age||!b.weight||!b.creatinine) return null;
        const base=((140-b.age)*b.weight)/(72*b.creatinine);
        const val=b.sex==="female"?base*0.85:base;
        return { val, resFam:"flowRate", unit:"mL/min", label:"Creatinine Clearance",
          warn:val<30?"⚠️ Severe renal impairment — dose adjustment required":val<60?"⚠️ Moderate renal impairment":null };
      },
    },
    {
      id:"neo_dose", name:"Neonatal Drug Dose", icon:"🍼", cat:"Neonatal / NICU",
      formula:"Dose (mg/kg) × Neonatal Weight (kg)", ref:"openfda",
      fields:[
        { id:"dose",   label:"Dose",             fam:"doseRate", def:"mg/kg" },
        { id:"weight", label:"Neonatal Weight",  fam:"weight",   def:"g_bw", placeholder:"e.g. 1500 g" },
      ],
      run:(b)=>b.dose&&b.weight
        ?{ val:b.dose*b.weight, resFam:"mass", unit:"mg", label:"Neonatal Dose" }:null,
    },
    {
      id:"neo_fluid", name:"Neonatal Fluid Requirement", icon:"💧", cat:"Neonatal / NICU",
      formula:"Weight(kg) × Fluid (mL/kg/day)", ref:"openfda",
      fields:[
        { id:"weightKg", label:"Neonatal Weight",    fam:"weight",  def:"kg" },
        { id:"mlKgDay",  label:"Fluid Requirement",  fam:"freq",    def:"x",
          type:"select", options:[
            {v:"60",l:"60 mL/kg/day"},{v:"80",l:"80 mL/kg/day"},{v:"100",l:"100 mL/kg/day"},
            {v:"120",l:"120 mL/kg/day"},{v:"150",l:"150 mL/kg/day"},{v:"180",l:"180 mL/kg/day"},
          ]},
      ],
      run:(b)=>b.weightKg&&b.mlKgDay
        ?{ val:b.weightKg*parseFloat(b.mlKgDay), resFam:"volume", unit:"mL", label:"Daily Fluid Requirement" }:null,
    },
    {
      id:"neo_drip", name:"Neonatal IV Rate", icon:"⏱️", cat:"Neonatal / NICU",
      formula:"Total Daily Volume ÷ Hours", ref:"henke",
      fields:[
        { id:"totalMl", label:"Total Daily Volume",  fam:"volume", def:"mL" },
        { id:"hours",   label:"Over How Many Hours", fam:"time",   def:"hr",
          type:"select", options:[{v:"24",l:"24 hrs"},{v:"12",l:"12 hrs"},{v:"8",l:"8 hrs"},{v:"6",l:"6 hrs"}] },
      ],
      run:(b)=>b.totalMl&&b.hours
        ?{ val:b.totalMl/parseFloat(b.hours), resFam:"flowRate", unit:"mL/hr", label:"IV Rate" }:null,
    },
    {
      id:"vasopressor_rx", name:"Vasopressor Dose Check", icon:"🏥", cat:"ICU / Critical Care",
      formula:"(Rate × Conc × 1000) ÷ (Weight × 60)", ref:"openfda",
      fields:[
        { id:"rate",   label:"Infusion Rate",     fam:"flowRate",      def:"mL/hr" },
        { id:"conc",   label:"Drug Concentration",fam:"concentration", def:"mg/mL" },
        { id:"weight", label:"Patient Weight",    fam:"weight",        def:"kg" },
      ],
      run:(b)=>b.rate&&b.conc&&b.weight
        ?{ val:(b.rate*b.conc*1000)/(b.weight*60), resFam:"doseRate", unit:"mcg/kg/min", label:"Actual Dose Delivered" }:null,
    },
    {
      id:"map_rx", name:"Mean Arterial Pressure", icon:"❤️", cat:"ICU / Critical Care",
      formula:"DBP + (SBP − DBP) ÷ 3", ref:"openfda",
      fields:[
        { id:"sbp", label:"Systolic BP (SBP)",  fam:"pressure", def:"mmHg" },
        { id:"dbp", label:"Diastolic BP (DBP)", fam:"pressure", def:"mmHg" },
      ],
      run:(b)=>{
        if(!b.sbp||!b.dbp) return null;
        const val=b.dbp+(b.sbp-b.dbp)/3;
        return { val, resFam:"pressure", unit:"mmHg", label:"Mean Arterial Pressure",
          warn:val<65?"⚠️ MAP < 65 mmHg — consider vasopressor support":null };
      },
    },
  ],
};

const CONV_GROUPS = [
  {label:"Mass / Dose",       fam:"mass"},
  {label:"Volume",            fam:"volume"},
  {label:"Body Weight",       fam:"weight"},
  {label:"Height",            fam:"height"},
  {label:"Time",              fam:"time"},
  {label:"Concentration",     fam:"concentration"},
  {label:"Flow Rate",         fam:"flowRate"},
  {label:"Dose per Weight",   fam:"doseRate"},
  {label:"Pressure / BP",     fam:"pressure"},
  {label:"Temperature",       fam:"temperature"},
  {label:"Blood Glucose",     fam:"glucose"},
  {label:"Creatinine",        fam:"creatinine"},
  {label:"Energy (kcal/kJ)",  fam:"kcal"},
  {label:"Age",               fam:"ageYears"},
  {label:"Percent",           fam:"percent"},
];

// ═══════════════════════════════════════════════════════════════════════════════
// CLINICAL TIPS — "Did You Know" pearls per calculator
// ═══════════════════════════════════════════════════════════════════════════════
const CLINICAL_TIPS = {
  oral_basic:    ["D/H×Q is the universal oral/IM dose formula — memorise it first.", "Always double-check units: mg ordered vs mg/mL available are different things.", "For pediatric suspensions, confirm the mg/mL concentration on the bottle label."],
  iv_flow:       ["1 mL/hr IV = 24 mL/day. Always sanity-check your rate against the daily volume.", "Gravity infusions (no pump) need drip rate calculation — use the IV Drip calculator.", "Run TPN, lipids, and blood products on a dedicated pump channel."],
  iv_drip:       ["Macrodrip (10–20 gtts/mL) for large volumes; microdrip (60 gtts/mL) for precise pediatric dosing.", "If the drop rate is over 60 gtts/min, consider using a pump instead.", "Always recheck the drop factor printed on the IV tubing package."],
  infusion_time: ["Too fast an infusion rate can cause phlebitis. Check the drug's minimum infusion time.", "Vancomycin must infuse over ≥60 min to prevent 'Red Man Syndrome'.", "Amphotericin B requires 2–6 hours infusion to minimise nephrotoxicity."],
  vol_infused:   ["Document volume infused accurately — critical for fluid balance in ICU patients.", "Include IV piggybacks in total fluid balance calculations.", "Fluid overload is independently associated with worse outcomes in critically ill patients."],
  weight_dose:   ["Use Ideal Body Weight (IBW) for aminoglycosides and vancomycin in obese patients.", "Use Adjusted Body Weight (AdjBW) for obese patients when IBW differs by >30% from actual.", "Lean body weight (LBW) is preferred for propofol dosing induction."],
  total_daily:   ["Q12H = 2×/day (BID). Q8H = 3×/day (TID). Q6H = 4×/day (QID).", "Extended-interval aminoglycoside dosing (once-daily) reduces nephrotoxicity vs. TID dosing.", "For narrow therapeutic index drugs, never adjust frequency without recalculating total daily dose."],
  reconstitution:["Always add diluent to powder (not powder to liquid) to prevent clumping.", "Read the product insert — some powders (e.g., ceftriaxone) specify exact diluent type.", "After reconstitution, label the vial with concentration, date, time, and expiry."],
  oral_solution: ["Shake oral suspensions well before measuring — particles settle quickly.", "Use an oral syringe (not a household teaspoon) for accurate pediatric dosing.", "Amoxicillin suspension is stable for 14 days refrigerated after reconstitution."],
  insulin_corr:  ["Insulin Sensitivity Factor (ISF) = 1700 ÷ Total Daily Dose (TDD) for rapid-acting insulin.", "Correction insulin should only be given if BG > target AND meal coverage is not due.", "Always verify BG with a second reading before giving large correction doses (>10 units)."],
  icu_drip_n:    ["For norepinephrine, always use a central line — peripheral extravasation causes tissue necrosis.", "Dopamine at 2–5 mcg/kg/min is 'renal dose'; at >10 mcg/kg/min it acts as a vasopressor.", "Vasopressin is fixed at 0.03–0.04 units/min in septic shock — not titrated like catecholamines."],
  map_n:         ["Target MAP ≥65 mmHg in septic shock (SCCM guidelines). Higher targets (80–85) in chronic hypertension.", "MAP = DBP + 1/3(Pulse Pressure). The 2/3 DBP + 1/3 SBP shortcut gives the same result.", "MAP <50 mmHg for >10 min is associated with acute kidney injury and myocardial injury."],
  heparin_n:     ["Standard heparin bag: 25,000 units in 250 mL = 100 units/mL.", "Never give heparin IV push in clinical settings (only in cardiac cath lab under physician supervision).", "aPTT therapeutic range for heparin is 60–100 seconds (1.5–2.5× normal)."],
  dimensional:   ["Dimensional analysis eliminates unit errors — the single most common cause of medication errors.", "Always write out all units and cancel them step by step before calculating.", "If the answer unit doesn't match what you expect, the setup is wrong."],
  crcl:          ["Cockcroft-Gault underestimates CrCl in elderly, obese, and malnourished patients.", "CrCl <30 mL/min requires dose adjustment for most renally-cleared drugs.", "Use AUC-based vancomycin dosing (target 400–600) — trough-only monitoring is no longer recommended by ASHP/IDSA."],
  loading:       ["Loading dose = Vd × target concentration. It achieves therapeutic levels immediately.", "Digoxin Vd = 7–9 L/kg — the loading dose is large relative to maintenance.", "Always confirm Vd reference: reported as L/kg (weight-based) or total liters."],
  maintenance:   ["Maintenance dose replaces drug eliminated between doses (CL × Css × τ).", "Doubling the dose does NOT double the effect for drugs with saturable kinetics (phenytoin, aspirin).", "Steady state is reached after ~4–5 half-lives regardless of dose or frequency."],
  bsa_calc:      ["Mosteller formula is the most widely used BSA equation in oncology.", "BSA is less variable between individuals than weight — this is why chemo is dosed per m².", "Adult average BSA ≈ 1.7–1.8 m². Newborn ≈ 0.2 m²."],
  bsa_dose:      ["Chemotherapy doses are capped at a maximum BSA of 2.0 m² in many protocols to prevent toxicity.", "Always verify the protocol dose (mg/m²) against current NCCN or institutional guidelines.", "Pre-medications (antiemetics, steroids, antihistamines) must be given before chemotherapy infusion."],
  heparin_ph:    ["Heparin infusion requires frequent aPTT monitoring — typically 6h after initiation and every dose change.", "Use weight-based heparin nomograms — empirical dosing leads to subtherapeutic anticoagulation.", "Therapeutic heparin aPTT (60–100 sec) reduces VTE recurrence by 75% vs. subtherapeutic levels."],
  tpn_dextrose:  ["D50W (50% dextrose) provides 1.7 kcal/mL. Always dilute before infusion.", "Dextrose provides 3.4 kcal/g — less than lipids (9 kcal/g) or protein (4 kcal/g).", "In TPN, do not exceed dextrose oxidation rate: max ~4–5 mg/kg/min to prevent hyperglycaemia."],
  tpn_aa:        ["Critical care patients need 1.2–2.0 g/kg/day protein; standard patients 0.8–1.2 g/kg/day.", "Amino acid solutions (10–15%) provide ~4 kcal/g protein.", "Glutamine supplementation in TPN is associated with reduced ICU mortality in some studies."],
  tpn_lipid:     ["Lipid emulsions provide essential fatty acids (linoleic, linolenic acid).", "Do not exceed 1 g/kg/day of lipid in critically ill patients — may impair immune function.", "Soybean-based lipids (Intralipid) are being replaced by SMOF lipids (fish oil-based) for ICU patients."],
  urr:           ["URR ≥65% is the minimum adequacy target; Kt/V ≥1.2 is the gold standard.", "URR is simple to calculate but does not account for ultrafiltration — use Kt/V for full assessment.", "Dialysis adequacy directly correlates with mortality in ESRD patients."],
  ktv:           ["Target Kt/V ≥1.4 per KDOQI guidelines (minimum 1.2). Single-pool Kt/V ≥1.2.", "Kt/V >1.7 does not improve mortality and may indicate volume issues.", "Residual renal function should be included in total Kt/V calculation."],
  youngs:        ["Young's Rule is less accurate than weight-based dosing — prefer Clark's Rule when weight is known.", "For children under 2 years, neither Young's nor Clark's Rule is reliable — use specific pediatric doses.", "Rule of thumb: child doses are never simply 'half the adult dose'."],
  clarks:        ["Clark's Rule: child dose = (weight in lbs ÷ 150) × adult dose.", "Clark's is more accurate than Young's because weight correlates better with drug clearance than age.", "For very obese children, Clark's Rule may OVERESTIMATE the dose — consult a pharmacist."],
  peds_wt:       ["Peds weight-based dosing: always confirm the child's actual weight on the same day.", "Maximum doses exist for most pediatric drugs — always check the 'adult dose cap'.", "For neonates, use post-menstrual age (PMA) rather than chronological age for dose adjustments."],
  total_daily_rx:["Prescribers: always write the route (PO/IV/IM) and indication on the prescription.", "Never use trailing zeros (write '5 mg' not '5.0 mg') — causes 10× dosing errors.", "Use 'mg/kg/day' notation to make weight-based prescriptions unambiguous."],
  wt_based_rx:   ["Weight-based max doses are critical — a 120 kg patient doesn't always need 120 kg worth of drug.", "Document actual body weight and IBW for every weight-based prescription in the chart.", "Paediatric weight-based doses must have an adult dose cap to prevent inadvertent overdose."],
  bsa_chemo_rx:  ["Cycle 1 chemotherapy doses are calculated from BSA. Subsequent cycles may be capped or adjusted based on toxicity.", "Always obtain informed consent documenting chemotherapy-specific risks before ordering.", "Verify BSA calculation independently — chemotherapy dosing errors can be fatal."],
  crcl_rx:       ["CrCl should be recalculated on every admission and whenever renal function changes.", "Acute kidney injury (AKI) may cause CrCl to change within hours — check daily in ICU.", "eGFR (from lab reports) ≠ CrCl — Cockcroft-Gault is preferred for drug dosing."],
  neo_dose:      ["Neonatal dosing uses post-menstrual age (PMA): PMA = gestational age at birth + postnatal age.", "Premature neonates have dramatically reduced renal clearance — extended dosing intervals are the norm.", "Gentamicin in neonates: once-daily dosing is now standard (extended-interval).", "All neonatal doses should be double-checked by a pharmacist."],
  neo_fluid:     ["Day 1 of life: start at 60–80 mL/kg/day. Increase by 10–20 mL/kg/day based on weight, electrolytes.", "Phototherapy and radiant warmers increase insensible losses by 10–30 mL/kg/day.", "Very-low-birth-weight (VLBW) neonates may need up to 200 mL/kg/day in the first week."],
  neo_drip:      ["Neonatal IV rates are tiny — always use a syringe pump (not a gravity drip) for precision.", "Flush volumes contribute significantly to fluid balance in neonates — use microbore tubing.", "Dead space of IV tubing can be 0.3–1 mL — significant for a 500 g neonate."],
};

const ALLERGY_CLASSES = {
  Penicillin:   ["amoxicillin","amox_clav","piperacillin_tazo"],
  Cephalosporin:["ceftriaxone","cefazolin","cefepime"],
  Carbapenem:   ["meropenem","imipenem_cil"],
  Sulfonamide:  ["trimethoprim_sulfa"],
  NSAID:        ["ibuprofen","ketorolac","aspirin"],
  Opioid:       ["morphine","fentanyl","hydromorphone","oxycodone"],
  Fluoroquinolone:["ciprofloxacin","levofloxacin"],
};

// CDC Growth Chart — approximate 50th percentile weight (kg) by age
const CDC_WEIGHT = {
  0:3.4,1:4.5,2:5.6,3:6.4,4:7.0,5:7.5,6:7.9,7:8.3,8:8.6,9:9.0,10:9.2,11:9.4,
  12:9.6,18:11.1,24:12.2,30:13.2,36:14.0,42:14.8,48:15.6,54:16.3,60:17.0,
  72:19.5,84:21.8,96:24.3,108:27.0,120:30.1,132:33.4,144:37.0,156:41.0,
  168:45.9,180:52.0,192:58.5,204:62.0,216:65.5
};

// ═══════════════════════════════════════════════════════════════════════════════
// DRUG DATABASE — 120+ Drugs
// Sources: openFDA · RxNorm (NLM) · MedlinePlus · HealthData.gov
// ═══════════════════════════════════════════════════════════════════════════════
const DRUG_DB = [

  // ══════════════════════════════════════════════
  // ANALGESICS & OPIOIDS
  // ══════════════════════════════════════════════
  { id:"morphine", generic:"Morphine", brands:["MS Contin","Kadian","Morphabond","Roxanol","Arymo ER"],
    category:"Analgesic / Opioid", color:"#E06C75", rxcui:"7052",
    routes:["IV","IM","SC","PO","Epidural","Intrathecal"],
    forms:[
      {label:"Injection 1 mg/mL",conc:1,unit:"mg/mL",route:"IV/IM/SC"},
      {label:"Injection 2 mg/mL",conc:2,unit:"mg/mL",route:"IV/IM/SC"},
      {label:"Injection 4 mg/mL",conc:4,unit:"mg/mL",route:"IV/IM/SC"},
      {label:"Injection 8 mg/mL",conc:8,unit:"mg/mL",route:"IV/IM/SC"},
      {label:"Injection 10 mg/mL",conc:10,unit:"mg/mL",route:"IV/IM/SC"},
      {label:"Injection 15 mg/mL",conc:15,unit:"mg/mL",route:"IV/IM/SC"},
      {label:"Injection 25 mg/mL",conc:25,unit:"mg/mL",route:"IV/IM/SC"},
      {label:"Oral solution 2 mg/mL",conc:2,unit:"mg/mL",route:"PO"},
      {label:"Oral solution 4 mg/mL",conc:4,unit:"mg/mL",route:"PO"},
      {label:"Tablet IR 15 mg",conc:15,unit:"mg",route:"PO"},
      {label:"Tablet IR 30 mg",conc:30,unit:"mg",route:"PO"},
      {label:"ER Tablet 15 mg",conc:15,unit:"mg",route:"PO ER"},
      {label:"ER Tablet 30 mg",conc:30,unit:"mg",route:"PO ER"},
      {label:"ER Tablet 60 mg",conc:60,unit:"mg",route:"PO ER"},
      {label:"ER Tablet 100 mg",conc:100,unit:"mg",route:"PO ER"},
      {label:"ER Capsule 10 mg",conc:10,unit:"mg",route:"PO ER"},
      {label:"ER Capsule 20 mg",conc:20,unit:"mg",route:"PO ER"},
      {label:"ER Capsule 30 mg",conc:30,unit:"mg",route:"PO ER"},
      {label:"ER Capsule 50 mg",conc:50,unit:"mg",route:"PO ER"},
    ],
    typDose:"0.05–0.1 mg/kg IV q3–4h; 10–30 mg PO q4h", maxDose:"15 mg/dose IV", renalCaution:true },

  { id:"fentanyl", generic:"Fentanyl", brands:["Sublimaze","Duragesic","Actiq","Fentora","Abstral","Lazanda","Onsolis"],
    category:"Analgesic / Opioid", color:"#E06C75", rxcui:"4337",
    routes:["IV","IM","Transdermal","Intranasal","Buccal","SL"],
    forms:[
      {label:"Injection 50 mcg/mL (2 mL)",conc:0.05,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 50 mcg/mL (5 mL)",conc:0.05,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 50 mcg/mL (10 mL)",conc:0.05,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 50 mcg/mL (20 mL)",conc:0.05,unit:"mg/mL",route:"IV/IM"},
      {label:"Patch 12 mcg/hr",conc:12,unit:"mcg/hr",route:"Transdermal"},
      {label:"Patch 25 mcg/hr",conc:25,unit:"mcg/hr",route:"Transdermal"},
      {label:"Patch 37.5 mcg/hr",conc:37.5,unit:"mcg/hr",route:"Transdermal"},
      {label:"Patch 50 mcg/hr",conc:50,unit:"mcg/hr",route:"Transdermal"},
      {label:"Patch 62.5 mcg/hr",conc:62.5,unit:"mcg/hr",route:"Transdermal"},
      {label:"Patch 75 mcg/hr",conc:75,unit:"mcg/hr",route:"Transdermal"},
      {label:"Patch 87.5 mcg/hr",conc:87.5,unit:"mcg/hr",route:"Transdermal"},
      {label:"Patch 100 mcg/hr",conc:100,unit:"mcg/hr",route:"Transdermal"},
      {label:"Lozenge 200 mcg",conc:200,unit:"mcg",route:"Buccal"},
      {label:"Lozenge 400 mcg",conc:400,unit:"mcg",route:"Buccal"},
      {label:"Lozenge 600 mcg",conc:600,unit:"mcg",route:"Buccal"},
      {label:"Lozenge 800 mcg",conc:800,unit:"mcg",route:"Buccal"},
      {label:"Buccal tablet 100 mcg",conc:100,unit:"mcg",route:"Buccal"},
      {label:"Buccal tablet 200 mcg",conc:200,unit:"mcg",route:"Buccal"},
    ],
    typDose:"Acute pain: 1–2 mcg/kg IV; Procedural: 25–100 mcg IV", maxDose:"varies by indication", renalCaution:false },

  { id:"hydromorphone", generic:"Hydromorphone", brands:["Dilaudid","Exalgo","Palladone"],
    category:"Analgesic / Opioid", color:"#E06C75", rxcui:"3423",
    routes:["IV","IM","SC","PO","Epidural"],
    forms:[
      {label:"Injection 1 mg/mL",conc:1,unit:"mg/mL",route:"IV/IM/SC"},
      {label:"Injection 2 mg/mL",conc:2,unit:"mg/mL",route:"IV/IM/SC"},
      {label:"Injection 4 mg/mL",conc:4,unit:"mg/mL",route:"IV/IM/SC"},
      {label:"Injection 10 mg/mL (HP)",conc:10,unit:"mg/mL",route:"IV/SC"},
      {label:"Tablet 2 mg",conc:2,unit:"mg",route:"PO"},
      {label:"Tablet 4 mg",conc:4,unit:"mg",route:"PO"},
      {label:"Tablet 8 mg",conc:8,unit:"mg",route:"PO"},
      {label:"ER Tablet 8 mg",conc:8,unit:"mg",route:"PO ER"},
      {label:"ER Tablet 12 mg",conc:12,unit:"mg",route:"PO ER"},
      {label:"ER Tablet 16 mg",conc:16,unit:"mg",route:"PO ER"},
      {label:"ER Tablet 32 mg",conc:32,unit:"mg",route:"PO ER"},
      {label:"Oral liquid 1 mg/mL",conc:1,unit:"mg/mL",route:"PO"},
    ],
    typDose:"0.01–0.02 mg/kg IV q3–4h; 2–4 mg PO q4–6h", maxDose:"4 mg/dose IV", renalCaution:true },

  { id:"oxycodone", generic:"Oxycodone", brands:["OxyContin","Roxicodone","Xtampza ER","Oxaydo"],
    category:"Analgesic / Opioid", color:"#E06C75", rxcui:"7804",
    routes:["PO"],
    forms:[
      {label:"IR Tablet 5 mg",conc:5,unit:"mg",route:"PO"},
      {label:"IR Tablet 10 mg",conc:10,unit:"mg",route:"PO"},
      {label:"IR Tablet 15 mg",conc:15,unit:"mg",route:"PO"},
      {label:"IR Tablet 20 mg",conc:20,unit:"mg",route:"PO"},
      {label:"IR Tablet 30 mg",conc:30,unit:"mg",route:"PO"},
      {label:"ER Tablet 10 mg",conc:10,unit:"mg",route:"PO ER"},
      {label:"ER Tablet 15 mg",conc:15,unit:"mg",route:"PO ER"},
      {label:"ER Tablet 20 mg",conc:20,unit:"mg",route:"PO ER"},
      {label:"ER Tablet 30 mg",conc:30,unit:"mg",route:"PO ER"},
      {label:"ER Tablet 40 mg",conc:40,unit:"mg",route:"PO ER"},
      {label:"ER Tablet 60 mg",conc:60,unit:"mg",route:"PO ER"},
      {label:"ER Tablet 80 mg",conc:80,unit:"mg",route:"PO ER"},
      {label:"Oral solution 5 mg/5 mL",conc:1,unit:"mg/mL",route:"PO"},
      {label:"Concentrated oral solution 100 mg/5 mL",conc:20,unit:"mg/mL",route:"PO"},
    ],
    typDose:"IR: 5–15 mg q4–6h; ER: 10 mg q12h (opioid-naive)", maxDose:"titrate per response", renalCaution:true },

  { id:"acetaminophen", generic:"Acetaminophen (Paracetamol)", brands:["Tylenol","Ofirmev","APAP","Panadol"],
    category:"Analgesic / Non-opioid", color:"#E06C75", rxcui:"161",
    routes:["PO","IV","PR","Rectal"],
    forms:[
      {label:"IV infusion 10 mg/mL (100 mL)",conc:10,unit:"mg/mL",route:"IV"},
      {label:"Tablet 325 mg",conc:325,unit:"mg",route:"PO"},
      {label:"Tablet 500 mg",conc:500,unit:"mg",route:"PO"},
      {label:"Tablet 650 mg ER",conc:650,unit:"mg",route:"PO ER"},
      {label:"Chewable 80 mg",conc:80,unit:"mg",route:"PO"},
      {label:"Chewable 160 mg",conc:160,unit:"mg",route:"PO"},
      {label:"Suspension 160 mg/5 mL",conc:32,unit:"mg/mL",route:"PO"},
      {label:"Drops 80 mg/0.8 mL",conc:100,unit:"mg/mL",route:"PO"},
      {label:"Suppository 120 mg",conc:120,unit:"mg",route:"PR"},
      {label:"Suppository 325 mg",conc:325,unit:"mg",route:"PR"},
      {label:"Suppository 650 mg",conc:650,unit:"mg",route:"PR"},
    ],
    typDose:"Adults: 325–1000 mg q4–6h; Peds: 10–15 mg/kg q4–6h", maxDose:"4000 mg/day (adults); 75 mg/kg/day (peds)", renalCaution:false },

  { id:"ibuprofen", generic:"Ibuprofen", brands:["Advil","Motrin","Caldolor","NeoProfen"],
    category:"Analgesic / NSAID", color:"#E06C75", rxcui:"5640",
    routes:["PO","IV"],
    forms:[
      {label:"IV solution 400 mg/4 mL",conc:100,unit:"mg/mL",route:"IV"},
      {label:"IV solution 800 mg/8 mL",conc:100,unit:"mg/mL",route:"IV"},
      {label:"Tablet 200 mg",conc:200,unit:"mg",route:"PO"},
      {label:"Tablet 400 mg",conc:400,unit:"mg",route:"PO"},
      {label:"Tablet 600 mg",conc:600,unit:"mg",route:"PO"},
      {label:"Tablet 800 mg",conc:800,unit:"mg",route:"PO"},
      {label:"Suspension 100 mg/5 mL",conc:20,unit:"mg/mL",route:"PO"},
      {label:"Drops 50 mg/1.25 mL",conc:40,unit:"mg/mL",route:"PO"},
    ],
    typDose:"200–800 mg PO q4–8h; 400–800 mg IV q6h", maxDose:"3200 mg/day", renalCaution:true },

  { id:"ketorolac", generic:"Ketorolac", brands:["Toradol","Sprix","Acular"],
    category:"Analgesic / NSAID", color:"#E06C75", rxcui:"35827",
    routes:["IV","IM","PO","Intranasal"],
    forms:[
      {label:"Injection 15 mg/mL",conc:15,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 30 mg/mL",conc:30,unit:"mg/mL",route:"IV/IM"},
      {label:"Tablet 10 mg",conc:10,unit:"mg",route:"PO"},
      {label:"Nasal spray 15.75 mg/spray",conc:15.75,unit:"mg/dose",route:"IN"},
    ],
    typDose:"15–30 mg IV/IM q6h; 10 mg PO q4–6h (max 5 days)", maxDose:"120 mg/day IV/IM; 40 mg/day PO", renalCaution:true },

  // ══════════════════════════════════════════════
  // ANTIBIOTICS — PENICILLINS & CEPHALOSPORINS
  // ══════════════════════════════════════════════
  { id:"amoxicillin", generic:"Amoxicillin", brands:["Amoxil","Trimox","Moxatag","Dispermox"],
    category:"Antibiotic / Penicillin", color:"#61AFEF", rxcui:"723",
    routes:["PO"],
    forms:[
      {label:"Capsule 250 mg",conc:250,unit:"mg",route:"PO"},
      {label:"Capsule 500 mg",conc:500,unit:"mg",route:"PO"},
      {label:"Tablet 500 mg",conc:500,unit:"mg",route:"PO"},
      {label:"Tablet 875 mg",conc:875,unit:"mg",route:"PO"},
      {label:"ER Tablet 775 mg",conc:775,unit:"mg",route:"PO ER"},
      {label:"Suspension 125 mg/5 mL",conc:25,unit:"mg/mL",route:"PO"},
      {label:"Suspension 200 mg/5 mL",conc:40,unit:"mg/mL",route:"PO"},
      {label:"Suspension 250 mg/5 mL",conc:50,unit:"mg/mL",route:"PO"},
      {label:"Suspension 400 mg/5 mL",conc:80,unit:"mg/mL",route:"PO"},
      {label:"Chewable 125 mg",conc:125,unit:"mg",route:"PO"},
      {label:"Chewable 250 mg",conc:250,unit:"mg",route:"PO"},
    ],
    typDose:"Adults: 500 mg TID or 875 mg BID; Peds: 25–50 mg/kg/day ÷ q8h", maxDose:"3 g/day", renalCaution:true },

  { id:"amox_clav", generic:"Amoxicillin-Clavulanate", brands:["Augmentin","Augmentin XR","Amoclan"],
    category:"Antibiotic / Penicillin+BLI", color:"#61AFEF", rxcui:"19831",
    routes:["PO"],
    forms:[
      {label:"Tablet 250/125 mg",conc:250,unit:"mg",route:"PO"},
      {label:"Tablet 500/125 mg",conc:500,unit:"mg",route:"PO"},
      {label:"Tablet 875/125 mg",conc:875,unit:"mg",route:"PO"},
      {label:"XR Tablet 1000/62.5 mg",conc:1000,unit:"mg",route:"PO XR"},
      {label:"Suspension 125/31.25 mg/5 mL",conc:25,unit:"mg/mL",route:"PO"},
      {label:"Suspension 250/62.5 mg/5 mL",conc:50,unit:"mg/mL",route:"PO"},
      {label:"Suspension 400/57 mg/5 mL",conc:80,unit:"mg/mL",route:"PO"},
    ],
    typDose:"875/125 mg PO BID or 500/125 mg PO TID", maxDose:"2000 mg amoxicillin/day (XR)", renalCaution:true },

  { id:"vancomycin", generic:"Vancomycin", brands:["Vancocin","Firvanq","Lyphocin"],
    category:"Antibiotic / Glycopeptide", color:"#61AFEF", rxcui:"11124",
    routes:["IV","PO","Intraperitoneal"],
    forms:[
      {label:"IV vial 500 mg",conc:500,unit:"mg",route:"IV"},
      {label:"IV vial 750 mg",conc:750,unit:"mg",route:"IV"},
      {label:"IV vial 1000 mg",conc:1000,unit:"mg",route:"IV"},
      {label:"IV vial 1500 mg",conc:1500,unit:"mg",route:"IV"},
      {label:"IV vial 2000 mg",conc:2000,unit:"mg",route:"IV"},
      {label:"IV vial 5000 mg (bulk)",conc:5000,unit:"mg",route:"IV"},
      {label:"Oral capsule 125 mg",conc:125,unit:"mg",route:"PO (C.diff)"},
      {label:"Oral capsule 250 mg",conc:250,unit:"mg",route:"PO (C.diff)"},
      {label:"Oral solution 25 mg/mL",conc:25,unit:"mg/mL",route:"PO"},
      {label:"Oral solution 50 mg/mL",conc:50,unit:"mg/mL",route:"PO"},
    ],
    typDose:"15–20 mg/kg IV q8–12h; target AUC/MIC 400–600", maxDose:"3–4.5 g/day (renal-adjusted)", renalCaution:true },

  { id:"piperacillin_tazo", generic:"Piperacillin-Tazobactam", brands:["Zosyn","Tazocin"],
    category:"Antibiotic / Penicillin+BLI", color:"#61AFEF", rxcui:"203142",
    routes:["IV"],
    forms:[
      {label:"Vial 2.25 g (2 g/0.25 g)",conc:2250,unit:"mg",route:"IV"},
      {label:"Vial 3.375 g (3 g/0.375 g)",conc:3375,unit:"mg",route:"IV"},
      {label:"Vial 4.5 g (4 g/0.5 g)",conc:4500,unit:"mg",route:"IV"},
      {label:"Vial 40.5 g bulk",conc:40500,unit:"mg",route:"IV"},
    ],
    typDose:"3.375–4.5 g IV q6–8h; severe: 4.5 g q6h extended infusion", maxDose:"18 g/day", renalCaution:true },

  { id:"ceftriaxone", generic:"Ceftriaxone", brands:["Rocephin"],
    category:"Antibiotic / Cephalosporin 3G", color:"#61AFEF", rxcui:"25077",
    routes:["IV","IM"],
    forms:[
      {label:"Vial 250 mg",conc:250,unit:"mg",route:"IV/IM"},
      {label:"Vial 500 mg",conc:500,unit:"mg",route:"IV/IM"},
      {label:"Vial 1000 mg",conc:1000,unit:"mg",route:"IV/IM"},
      {label:"Vial 2000 mg",conc:2000,unit:"mg",route:"IV/IM"},
      {label:"Vial 10 g bulk",conc:10000,unit:"mg",route:"IV"},
    ],
    typDose:"1–2 g IV/IM q24h; meningitis: 2 g q12h", maxDose:"4 g/day", renalCaution:false },

  { id:"cefazolin", generic:"Cefazolin", brands:["Ancef","Kefzol"],
    category:"Antibiotic / Cephalosporin 1G", color:"#61AFEF", rxcui:"20489",
    routes:["IV","IM"],
    forms:[
      {label:"Vial 500 mg",conc:500,unit:"mg",route:"IV/IM"},
      {label:"Vial 1000 mg",conc:1000,unit:"mg",route:"IV/IM"},
      {label:"Vial 2000 mg",conc:2000,unit:"mg",route:"IV/IM"},
      {label:"Vial 10 g bulk",conc:10000,unit:"mg",route:"IV"},
      {label:"Premix 1 g/50 mL",conc:20,unit:"mg/mL",route:"IV"},
      {label:"Premix 2 g/50 mL",conc:40,unit:"mg/mL",route:"IV"},
    ],
    typDose:"1–2 g IV q8h; surgical prophylaxis: 2 g IV 30–60 min before incision", maxDose:"6 g/day (12 g for severe)", renalCaution:true },

  { id:"cefepime", generic:"Cefepime", brands:["Maxipime"],
    category:"Antibiotic / Cephalosporin 4G", color:"#61AFEF", rxcui:"87636",
    routes:["IV","IM"],
    forms:[
      {label:"Vial 500 mg",conc:500,unit:"mg",route:"IV/IM"},
      {label:"Vial 1000 mg",conc:1000,unit:"mg",route:"IV/IM"},
      {label:"Vial 2000 mg",conc:2000,unit:"mg",route:"IV/IM"},
    ],
    typDose:"1–2 g IV q8–12h; febrile neutropenia: 2 g q8h", maxDose:"6 g/day", renalCaution:true },

  // ══════════════════════════════════════════════
  // ANTIBIOTICS — CARBAPENEMS, MACROLIDES, etc.
  // ══════════════════════════════════════════════
  { id:"meropenem", generic:"Meropenem", brands:["Merrem","Meronem"],
    category:"Antibiotic / Carbapenem", color:"#61AFEF", rxcui:"29561",
    routes:["IV"],
    forms:[
      {label:"Vial 500 mg",conc:500,unit:"mg",route:"IV"},
      {label:"Vial 1000 mg",conc:1000,unit:"mg",route:"IV"},
    ],
    typDose:"1–2 g IV q8h; meningitis: 2 g q8h; extended infusion 3h", maxDose:"6 g/day", renalCaution:true },

  { id:"imipenem_cil", generic:"Imipenem-Cilastatin", brands:["Primaxin"],
    category:"Antibiotic / Carbapenem", color:"#61AFEF", rxcui:"18631",
    routes:["IV","IM"],
    forms:[
      {label:"Vial 250/250 mg",conc:250,unit:"mg",route:"IV"},
      {label:"Vial 500/500 mg",conc:500,unit:"mg",route:"IV"},
      {label:"IM vial 500/500 mg",conc:500,unit:"mg",route:"IM"},
      {label:"IM vial 750/750 mg",conc:750,unit:"mg",route:"IM"},
    ],
    typDose:"500 mg IV q6h or 1 g q8h", maxDose:"4 g/day", renalCaution:true },

  { id:"azithromycin", generic:"Azithromycin", brands:["Zithromax","Z-Pak","Azasite","Zmax"],
    category:"Antibiotic / Macrolide", color:"#61AFEF", rxcui:"18631",
    routes:["PO","IV"],
    forms:[
      {label:"Tablet 250 mg",conc:250,unit:"mg",route:"PO"},
      {label:"Tablet 500 mg",conc:500,unit:"mg",route:"PO"},
      {label:"Tablet 600 mg",conc:600,unit:"mg",route:"PO"},
      {label:"Suspension 100 mg/5 mL",conc:20,unit:"mg/mL",route:"PO"},
      {label:"Suspension 200 mg/5 mL",conc:40,unit:"mg/mL",route:"PO"},
      {label:"Extended-release suspension 2 g/60 mL",conc:33,unit:"mg/mL",route:"PO"},
      {label:"IV vial 500 mg",conc:500,unit:"mg",route:"IV"},
    ],
    typDose:"500 mg day 1, then 250 mg days 2–5 PO; 500 mg IV daily for pneumonia", maxDose:"500 mg/day IV; 2 g single dose PO", renalCaution:false },

  { id:"clarithromycin", generic:"Clarithromycin", brands:["Biaxin","Biaxin XL"],
    category:"Antibiotic / Macrolide", color:"#61AFEF", rxcui:"21212",
    routes:["PO"],
    forms:[
      {label:"Tablet 250 mg",conc:250,unit:"mg",route:"PO"},
      {label:"Tablet 500 mg",conc:500,unit:"mg",route:"PO"},
      {label:"XL Tablet 500 mg",conc:500,unit:"mg",route:"PO XL"},
      {label:"Suspension 125 mg/5 mL",conc:25,unit:"mg/mL",route:"PO"},
      {label:"Suspension 250 mg/5 mL",conc:50,unit:"mg/mL",route:"PO"},
    ],
    typDose:"250–500 mg BID or 1 g XL once daily", maxDose:"1 g/day", renalCaution:true },

  { id:"doxycycline", generic:"Doxycycline", brands:["Vibramycin","Doryx","Monodox","Oracea","Acticlate"],
    category:"Antibiotic / Tetracycline", color:"#61AFEF", rxcui:"3648",
    routes:["PO","IV"],
    forms:[
      {label:"Capsule 50 mg",conc:50,unit:"mg",route:"PO"},
      {label:"Capsule 75 mg",conc:75,unit:"mg",route:"PO"},
      {label:"Capsule 100 mg",conc:100,unit:"mg",route:"PO"},
      {label:"Tablet 20 mg",conc:20,unit:"mg",route:"PO"},
      {label:"Tablet 50 mg",conc:50,unit:"mg",route:"PO"},
      {label:"Tablet 100 mg",conc:100,unit:"mg",route:"PO"},
      {label:"Delayed-release 75 mg",conc:75,unit:"mg",route:"PO"},
      {label:"Delayed-release 100 mg",conc:100,unit:"mg",route:"PO"},
      {label:"Delayed-release 150 mg",conc:150,unit:"mg",route:"PO"},
      {label:"Suspension 25 mg/5 mL",conc:5,unit:"mg/mL",route:"PO"},
      {label:"IV vial 100 mg",conc:100,unit:"mg",route:"IV"},
      {label:"IV vial 200 mg",conc:200,unit:"mg",route:"IV"},
    ],
    typDose:"100 mg BID PO/IV; Load: 200 mg then 100 mg BID", maxDose:"300 mg/day", renalCaution:false },

  { id:"ciprofloxacin", generic:"Ciprofloxacin", brands:["Cipro","Cipro XR","Proquin XR"],
    category:"Antibiotic / Fluoroquinolone", color:"#61AFEF", rxcui:"2551",
    routes:["PO","IV"],
    forms:[
      {label:"Tablet 100 mg",conc:100,unit:"mg",route:"PO"},
      {label:"Tablet 250 mg",conc:250,unit:"mg",route:"PO"},
      {label:"Tablet 500 mg",conc:500,unit:"mg",route:"PO"},
      {label:"Tablet 750 mg",conc:750,unit:"mg",route:"PO"},
      {label:"XR Tablet 500 mg",conc:500,unit:"mg",route:"PO XR"},
      {label:"XR Tablet 1000 mg",conc:1000,unit:"mg",route:"PO XR"},
      {label:"Suspension 250 mg/5 mL",conc:50,unit:"mg/mL",route:"PO"},
      {label:"Suspension 500 mg/5 mL",conc:100,unit:"mg/mL",route:"PO"},
      {label:"IV 200 mg/100 mL premix",conc:2,unit:"mg/mL",route:"IV"},
      {label:"IV 400 mg/200 mL premix",conc:2,unit:"mg/mL",route:"IV"},
      {label:"IV concentrate 10 mg/mL",conc:10,unit:"mg/mL",route:"IV"},
    ],
    typDose:"500–750 mg PO BID; 400 mg IV q8–12h", maxDose:"1500 mg/day PO; 1200 mg/day IV", renalCaution:true },

  { id:"levofloxacin", generic:"Levofloxacin", brands:["Levaquin","Iquix"],
    category:"Antibiotic / Fluoroquinolone", color:"#61AFEF", rxcui:"82122",
    routes:["PO","IV"],
    forms:[
      {label:"Tablet 250 mg",conc:250,unit:"mg",route:"PO"},
      {label:"Tablet 500 mg",conc:500,unit:"mg",route:"PO"},
      {label:"Tablet 750 mg",conc:750,unit:"mg",route:"PO"},
      {label:"Oral solution 25 mg/mL",conc:25,unit:"mg/mL",route:"PO"},
      {label:"IV premix 250 mg/50 mL",conc:5,unit:"mg/mL",route:"IV"},
      {label:"IV premix 500 mg/100 mL",conc:5,unit:"mg/mL",route:"IV"},
      {label:"IV premix 750 mg/150 mL",conc:5,unit:"mg/mL",route:"IV"},
    ],
    typDose:"500 mg once daily; HAP/CAP: 750 mg once daily", maxDose:"750 mg/day", renalCaution:true },

  { id:"metronidazole", generic:"Metronidazole", brands:["Flagyl","Flagyl ER","Metro"],
    category:"Antibiotic / Nitroimidazole", color:"#61AFEF", rxcui:"6922",
    routes:["PO","IV","Vaginal","Topical"],
    forms:[
      {label:"Tablet 250 mg",conc:250,unit:"mg",route:"PO"},
      {label:"Tablet 500 mg",conc:500,unit:"mg",route:"PO"},
      {label:"ER Tablet 750 mg",conc:750,unit:"mg",route:"PO ER"},
      {label:"Capsule 375 mg",conc:375,unit:"mg",route:"PO"},
      {label:"Oral suspension 200 mg/5 mL",conc:40,unit:"mg/mL",route:"PO"},
      {label:"IV bag 500 mg/100 mL",conc:5,unit:"mg/mL",route:"IV"},
      {label:"IV vial 500 mg/100 mL",conc:5,unit:"mg/mL",route:"IV"},
    ],
    typDose:"500 mg TID or 250 mg QID PO; 500 mg IV q6–8h; C.diff: 500 mg TID ×10–14d", maxDose:"4 g/day", renalCaution:false },

  { id:"trimethoprim_sulfa", generic:"Trimethoprim-Sulfamethoxazole", brands:["Bactrim","Septra","Bactrim DS","Cotrim"],
    category:"Antibiotic / Sulfonamide", color:"#61AFEF", rxcui:"10829",
    routes:["PO","IV"],
    forms:[
      {label:"Tablet SS (80/400 mg)",conc:80,unit:"mg TMP",route:"PO"},
      {label:"Tablet DS (160/800 mg)",conc:160,unit:"mg TMP",route:"PO"},
      {label:"Suspension 40/200 mg/5 mL",conc:8,unit:"mg TMP/mL",route:"PO"},
      {label:"IV concentrate 16/80 mg/mL",conc:16,unit:"mg TMP/mL",route:"IV"},
    ],
    typDose:"UTI: 1 DS tab BID ×3d; PCP prophylaxis: 1 DS tab daily; PCP treatment: 15–20 mg/kg/day TMP IV ÷ q6h", maxDose:"varies by indication", renalCaution:true },

  { id:"clindamycin", generic:"Clindamycin", brands:["Cleocin","Clindagel","Evoclin","ClindaMax"],
    category:"Antibiotic / Lincosamide", color:"#61AFEF", rxcui:"2592",
    routes:["PO","IV","IM","Topical","Vaginal"],
    forms:[
      {label:"Capsule 75 mg",conc:75,unit:"mg",route:"PO"},
      {label:"Capsule 150 mg",conc:150,unit:"mg",route:"PO"},
      {label:"Capsule 300 mg",conc:300,unit:"mg",route:"PO"},
      {label:"Oral solution 75 mg/5 mL",conc:15,unit:"mg/mL",route:"PO"},
      {label:"IV/IM vial 150 mg/mL",conc:150,unit:"mg/mL",route:"IV/IM"},
      {label:"Premix 300 mg/50 mL",conc:6,unit:"mg/mL",route:"IV"},
      {label:"Premix 600 mg/50 mL",conc:12,unit:"mg/mL",route:"IV"},
      {label:"Premix 900 mg/50 mL",conc:18,unit:"mg/mL",route:"IV"},
      {label:"Premix 1200 mg/100 mL",conc:12,unit:"mg/mL",route:"IV"},
    ],
    typDose:"300–600 mg PO q6–8h; 600–900 mg IV q8h", maxDose:"2.7 g/day PO; 4.8 g/day IV", renalCaution:false },

  // ══════════════════════════════════════════════
  // ANTIVIRALS & ANTIFUNGALS
  // ══════════════════════════════════════════════
  { id:"acyclovir", generic:"Acyclovir", brands:["Zovirax","Sitavig"],
    category:"Antiviral / Nucleoside analogue", color:"#56B6C2", rxcui:"2002",
    routes:["IV","PO","Topical"],
    forms:[
      {label:"IV vial 500 mg",conc:500,unit:"mg",route:"IV"},
      {label:"IV vial 1000 mg",conc:1000,unit:"mg",route:"IV"},
      {label:"IV solution 25 mg/mL",conc:25,unit:"mg/mL",route:"IV"},
      {label:"Tablet 400 mg",conc:400,unit:"mg",route:"PO"},
      {label:"Tablet 800 mg",conc:800,unit:"mg",route:"PO"},
      {label:"Capsule 200 mg",conc:200,unit:"mg",route:"PO"},
      {label:"Suspension 200 mg/5 mL",conc:40,unit:"mg/mL",route:"PO"},
    ],
    typDose:"HSV: 5–10 mg/kg IV q8h; 400–800 mg PO TID–5×/day; VZV: 10–12 mg/kg IV q8h", maxDose:"30–35 mg/kg/day IV", renalCaution:true },

  { id:"fluconazole", generic:"Fluconazole", brands:["Diflucan"],
    category:"Antifungal / Azole", color:"#56B6C2", rxcui:"4450",
    routes:["IV","PO"],
    forms:[
      {label:"IV 200 mg/100 mL premix",conc:2,unit:"mg/mL",route:"IV"},
      {label:"IV 400 mg/200 mL premix",conc:2,unit:"mg/mL",route:"IV"},
      {label:"Tablet 50 mg",conc:50,unit:"mg",route:"PO"},
      {label:"Tablet 100 mg",conc:100,unit:"mg",route:"PO"},
      {label:"Tablet 150 mg",conc:150,unit:"mg",route:"PO"},
      {label:"Tablet 200 mg",conc:200,unit:"mg",route:"PO"},
      {label:"Suspension 10 mg/mL",conc:10,unit:"mg/mL",route:"PO"},
      {label:"Suspension 40 mg/mL",conc:40,unit:"mg/mL",route:"PO"},
    ],
    typDose:"Loading 800 mg, then 400 mg daily; vaginal candidiasis: 150 mg single dose", maxDose:"800 mg/day", renalCaution:true },

  // ══════════════════════════════════════════════
  // CARDIOVASCULAR — VASOPRESSORS
  // ══════════════════════════════════════════════
  { id:"norepinephrine", generic:"Norepinephrine", brands:["Levophed"],
    category:"Vasopressor / Catecholamine", color:"#FF6B6B", rxcui:"7512",
    routes:["IV infusion"],
    forms:[
      {label:"Vial 1 mg/mL (4 mL)",conc:1,unit:"mg/mL",route:"IV"},
      {label:"Standard: 4 mg in 250 mL D5W (16 mcg/mL)",conc:0.016,unit:"mg/mL",route:"IV infusion"},
      {label:"Standard: 4 mg in 500 mL D5W (8 mcg/mL)",conc:0.008,unit:"mg/mL",route:"IV infusion"},
      {label:"Double conc: 8 mg in 250 mL (32 mcg/mL)",conc:0.032,unit:"mg/mL",route:"IV infusion"},
      {label:"Quad conc: 16 mg in 250 mL (64 mcg/mL)",conc:0.064,unit:"mg/mL",route:"IV infusion"},
    ],
    typDose:"0.01–3 mcg/kg/min IV; septic shock: typically 0.01–0.5 mcg/kg/min", maxDose:"3 mcg/kg/min (higher in refractory)", renalCaution:false },

  { id:"dopamine", generic:"Dopamine", brands:["Intropin"],
    category:"Vasopressor / Catecholamine", color:"#FF6B6B", rxcui:"3628",
    routes:["IV infusion"],
    forms:[
      {label:"Vial 40 mg/mL",conc:40,unit:"mg/mL",route:"IV"},
      {label:"Vial 80 mg/mL",conc:80,unit:"mg/mL",route:"IV"},
      {label:"Vial 160 mg/mL",conc:160,unit:"mg/mL",route:"IV"},
      {label:"200 mg in 250 mL D5W (800 mcg/mL)",conc:0.8,unit:"mg/mL",route:"IV infusion"},
      {label:"400 mg in 250 mL D5W (1600 mcg/mL)",conc:1.6,unit:"mg/mL",route:"IV infusion"},
      {label:"800 mg in 500 mL D5W (1600 mcg/mL)",conc:1.6,unit:"mg/mL",route:"IV infusion"},
      {label:"Premix 200 mg/250 mL",conc:0.8,unit:"mg/mL",route:"IV"},
      {label:"Premix 400 mg/250 mL",conc:1.6,unit:"mg/mL",route:"IV"},
    ],
    typDose:"2–5 mcg/kg/min (renal); 5–10 mcg/kg/min (cardiac); 10–20 mcg/kg/min (vasopressor)", maxDose:"50 mcg/kg/min", renalCaution:false },

  { id:"epinephrine", generic:"Epinephrine", brands:["EpiPen","Adrenalin","Auvi-Q","Symjepi"],
    category:"Vasopressor / Catecholamine", color:"#FF6B6B", rxcui:"3992",
    routes:["IV","IM","SC","ET","Inhaled","IO"],
    forms:[
      {label:"1:1000 (1 mg/mL) — IM/SC",conc:1,unit:"mg/mL",route:"IM/SC"},
      {label:"1:10000 (0.1 mg/mL) — IV cardiac",conc:0.1,unit:"mg/mL",route:"IV"},
      {label:"Infusion 4 mg in 250 mL (16 mcg/mL)",conc:0.016,unit:"mg/mL",route:"IV infusion"},
      {label:"Infusion 8 mg in 250 mL (32 mcg/mL)",conc:0.032,unit:"mg/mL",route:"IV infusion"},
      {label:"EpiPen 0.3 mg auto-injector",conc:0.3,unit:"mg/dose",route:"IM"},
      {label:"EpiPen Jr 0.15 mg auto-injector",conc:0.15,unit:"mg/dose",route:"IM"},
      {label:"Auvi-Q 0.1 mg (peds <15 kg)",conc:0.1,unit:"mg/dose",route:"IM"},
      {label:"Auvi-Q 0.15 mg",conc:0.15,unit:"mg/dose",route:"IM"},
      {label:"Auvi-Q 0.3 mg",conc:0.3,unit:"mg/dose",route:"IM"},
    ],
    typDose:"Cardiac arrest: 1 mg IV/IO q3–5min; Anaphylaxis: 0.3–0.5 mg IM thigh; Infusion: 0.01–1 mcg/kg/min", maxDose:"1 mg/dose IV (cardiac)", renalCaution:false },

  { id:"vasopressin", generic:"Vasopressin", brands:["Vasostrict","Pitressin"],
    category:"Vasopressor / ADH analogue", color:"#FF6B6B", rxcui:"11149",
    routes:["IV infusion"],
    forms:[
      {label:"Vial 20 units/mL (1 mL)",conc:20,unit:"units/mL",route:"IV"},
      {label:"Vial 20 units/mL (10 mL)",conc:20,unit:"units/mL",route:"IV"},
      {label:"Standard mix: 20 units in 100 mL (0.2 units/mL)",conc:0.2,unit:"units/mL",route:"IV infusion"},
      {label:"Concentrated: 40 units in 100 mL (0.4 units/mL)",conc:0.4,unit:"units/mL",route:"IV infusion"},
    ],
    typDose:"Septic shock: 0.03–0.04 units/min (fixed, not titrated)", maxDose:"0.1 units/min", renalCaution:false },

  { id:"dobutamine", generic:"Dobutamine", brands:["Dobutrex"],
    category:"Inotrope / Catecholamine", color:"#FF6B6B", rxcui:"3616",
    routes:["IV infusion"],
    forms:[
      {label:"Vial 12.5 mg/mL (20 mL)",conc:12.5,unit:"mg/mL",route:"IV"},
      {label:"250 mg in 250 mL D5W (1000 mcg/mL)",conc:1,unit:"mg/mL",route:"IV infusion"},
      {label:"500 mg in 250 mL D5W (2000 mcg/mL)",conc:2,unit:"mg/mL",route:"IV infusion"},
      {label:"Premix 250 mg/250 mL",conc:1,unit:"mg/mL",route:"IV"},
      {label:"Premix 500 mg/250 mL",conc:2,unit:"mg/mL",route:"IV"},
    ],
    typDose:"2–20 mcg/kg/min IV infusion; usual: 5–10 mcg/kg/min", maxDose:"40 mcg/kg/min", renalCaution:false },

  { id:"phenylephrine", generic:"Phenylephrine", brands:["Neo-Synephrine","Biorphen","Vazculep"],
    category:"Vasopressor / Alpha agonist", color:"#FF6B6B", rxcui:"8163",
    routes:["IV","IM","SC","Intranasal"],
    forms:[
      {label:"IV vial 10 mg/mL",conc:10,unit:"mg/mL",route:"IV"},
      {label:"Premix 100 mcg/mL (50 mL)",conc:0.1,unit:"mg/mL",route:"IV infusion"},
      {label:"Standard infusion: 100 mg in 250 mL (400 mcg/mL)",conc:0.4,unit:"mg/mL",route:"IV infusion"},
      {label:"Nasal spray 0.1%",conc:1,unit:"mg/mL",route:"Intranasal"},
    ],
    typDose:"Bolus: 50–200 mcg IV; Infusion: 0.5–6 mcg/kg/min", maxDose:"varies", renalCaution:false },

  // ══════════════════════════════════════════════
  // ANTIHYPERTENSIVES
  // ══════════════════════════════════════════════
  { id:"labetalol", generic:"Labetalol", brands:["Trandate","Normodyne"],
    category:"Antihypertensive / Beta-blocker", color:"#C678DD", rxcui:"6185",
    routes:["IV","PO"],
    forms:[
      {label:"Injection 5 mg/mL (4 mL)",conc:5,unit:"mg/mL",route:"IV"},
      {label:"Injection 5 mg/mL (20 mL)",conc:5,unit:"mg/mL",route:"IV"},
      {label:"Injection 5 mg/mL (40 mL)",conc:5,unit:"mg/mL",route:"IV"},
      {label:"Tablet 100 mg",conc:100,unit:"mg",route:"PO"},
      {label:"Tablet 200 mg",conc:200,unit:"mg",route:"PO"},
      {label:"Tablet 300 mg",conc:300,unit:"mg",route:"PO"},
    ],
    typDose:"Hypertensive urgency: 20 mg IV, then 40–80 mg q10–15min; Infusion: 0.5–2 mg/min; PO: 100–400 mg BID", maxDose:"300 mg cumulative IV bolus; 2400 mg/day PO", renalCaution:false },

  { id:"metoprolol", generic:"Metoprolol", brands:["Lopressor","Toprol-XL"],
    category:"Antihypertensive / Beta-blocker", color:"#C678DD", rxcui:"6918",
    routes:["IV","PO"],
    forms:[
      {label:"Injection 1 mg/mL (5 mL)",conc:1,unit:"mg/mL",route:"IV"},
      {label:"Tartrate tablet 25 mg",conc:25,unit:"mg",route:"PO"},
      {label:"Tartrate tablet 50 mg",conc:50,unit:"mg",route:"PO"},
      {label:"Tartrate tablet 100 mg",conc:100,unit:"mg",route:"PO"},
      {label:"Succinate XL 25 mg",conc:25,unit:"mg",route:"PO XL"},
      {label:"Succinate XL 50 mg",conc:50,unit:"mg",route:"PO XL"},
      {label:"Succinate XL 100 mg",conc:100,unit:"mg",route:"PO XL"},
      {label:"Succinate XL 200 mg",conc:200,unit:"mg",route:"PO XL"},
    ],
    typDose:"IV: 5 mg q5min ×3 doses; PO: 25–200 mg BID (tartrate) or 25–200 mg QD (succinate)", maxDose:"400 mg/day PO", renalCaution:false },

  { id:"amlodipine", generic:"Amlodipine", brands:["Norvasc"],
    category:"Antihypertensive / CCB", color:"#C678DD", rxcui:"17767",
    routes:["PO"],
    forms:[
      {label:"Tablet 2.5 mg",conc:2.5,unit:"mg",route:"PO"},
      {label:"Tablet 5 mg",conc:5,unit:"mg",route:"PO"},
      {label:"Tablet 10 mg",conc:10,unit:"mg",route:"PO"},
    ],
    typDose:"5–10 mg once daily", maxDose:"10 mg/day", renalCaution:false },

  { id:"lisinopril", generic:"Lisinopril", brands:["Prinivil","Zestril","Qbrelis"],
    category:"Antihypertensive / ACE Inhibitor", color:"#C678DD", rxcui:"29046",
    routes:["PO"],
    forms:[
      {label:"Tablet 2.5 mg",conc:2.5,unit:"mg",route:"PO"},
      {label:"Tablet 5 mg",conc:5,unit:"mg",route:"PO"},
      {label:"Tablet 10 mg",conc:10,unit:"mg",route:"PO"},
      {label:"Tablet 20 mg",conc:20,unit:"mg",route:"PO"},
      {label:"Tablet 30 mg",conc:30,unit:"mg",route:"PO"},
      {label:"Tablet 40 mg",conc:40,unit:"mg",route:"PO"},
      {label:"Solution 1 mg/mL",conc:1,unit:"mg/mL",route:"PO"},
    ],
    typDose:"HTN: 10–40 mg once daily; HF: 5–40 mg once daily; post-MI: 5–10 mg once daily", maxDose:"80 mg/day", renalCaution:true },

  { id:"losartan", generic:"Losartan", brands:["Cozaar"],
    category:"Antihypertensive / ARB", color:"#C678DD", rxcui:"203160",
    routes:["PO"],
    forms:[
      {label:"Tablet 25 mg",conc:25,unit:"mg",route:"PO"},
      {label:"Tablet 50 mg",conc:50,unit:"mg",route:"PO"},
      {label:"Tablet 100 mg",conc:100,unit:"mg",route:"PO"},
    ],
    typDose:"50–100 mg once daily or divided BID", maxDose:"100 mg/day", renalCaution:true },

  { id:"hydralazine", generic:"Hydralazine", brands:["Apresoline"],
    category:"Antihypertensive / Vasodilator", color:"#C678DD", rxcui:"5470",
    routes:["IV","IM","PO"],
    forms:[
      {label:"Injection 20 mg/mL",conc:20,unit:"mg/mL",route:"IV/IM"},
      {label:"Tablet 10 mg",conc:10,unit:"mg",route:"PO"},
      {label:"Tablet 25 mg",conc:25,unit:"mg",route:"PO"},
      {label:"Tablet 50 mg",conc:50,unit:"mg",route:"PO"},
      {label:"Tablet 100 mg",conc:100,unit:"mg",route:"PO"},
    ],
    typDose:"Acute: 5–20 mg IV/IM q4–6h; PO: 25–100 mg BID–QID", maxDose:"300 mg/day PO", renalCaution:false },

  { id:"nicardipine", generic:"Nicardipine", brands:["Cardene","Cardene SR"],
    category:"Antihypertensive / CCB", color:"#C678DD", rxcui:"7371",
    routes:["IV","PO"],
    forms:[
      {label:"IV vial 2.5 mg/mL (10 mL)",conc:2.5,unit:"mg/mL",route:"IV"},
      {label:"Premix 20 mg/200 mL (0.1 mg/mL)",conc:0.1,unit:"mg/mL",route:"IV"},
      {label:"Premix 40 mg/200 mL (0.2 mg/mL)",conc:0.2,unit:"mg/mL",route:"IV"},
      {label:"Capsule IR 20 mg",conc:20,unit:"mg",route:"PO"},
      {label:"Capsule IR 30 mg",conc:30,unit:"mg",route:"PO"},
      {label:"SR Capsule 30 mg",conc:30,unit:"mg",route:"PO SR"},
      {label:"SR Capsule 45 mg",conc:45,unit:"mg",route:"PO SR"},
      {label:"SR Capsule 60 mg",conc:60,unit:"mg",route:"PO SR"},
    ],
    typDose:"IV: start 5 mg/hr, titrate 1–2.5 mg/hr q15min, max 15 mg/hr; PO SR: 30–60 mg BID", maxDose:"15 mg/hr IV; 120 mg/day PO SR", renalCaution:false },

  // ══════════════════════════════════════════════
  // ANTICOAGULANTS & ANTIPLATELETS
  // ══════════════════════════════════════════════
  { id:"heparin", generic:"Heparin (Unfractionated)", brands:["Hep-Lock","Hep-Flush"],
    category:"Anticoagulant / UFH", color:"#E5C07B", rxcui:"5224",
    routes:["IV","SC"],
    forms:[
      {label:"Vial 1,000 units/mL (1 mL)",conc:1000,unit:"units/mL",route:"IV/SC"},
      {label:"Vial 1,000 units/mL (30 mL)",conc:1000,unit:"units/mL",route:"IV/SC"},
      {label:"Vial 5,000 units/mL (1 mL)",conc:5000,unit:"units/mL",route:"SC"},
      {label:"Vial 10,000 units/mL",conc:10000,unit:"units/mL",route:"IV"},
      {label:"Vial 20,000 units/mL",conc:20000,unit:"units/mL",route:"IV"},
      {label:"Premix 25,000 units/250 mL D5W (100 u/mL)",conc:100,unit:"units/mL",route:"IV infusion"},
      {label:"Premix 25,000 units/500 mL D5W (50 u/mL)",conc:50,unit:"units/mL",route:"IV infusion"},
      {label:"Lock flush 10 units/mL",conc:10,unit:"units/mL",route:"IV flush"},
      {label:"Lock flush 100 units/mL",conc:100,unit:"units/mL",route:"IV flush"},
    ],
    typDose:"DVT/PE: 80 units/kg bolus, then 18 units/kg/hr; ACS: 60 units/kg bolus (max 4000), then 12 units/kg/hr", maxDose:"titrate to aPTT 60–100 sec", renalCaution:false },

  { id:"enoxaparin", generic:"Enoxaparin", brands:["Lovenox","Clexane"],
    category:"Anticoagulant / LMWH", color:"#E5C07B", rxcui:"67108",
    routes:["SC","IV"],
    forms:[
      {label:"Syringe 20 mg/0.2 mL",conc:100,unit:"mg/mL",route:"SC"},
      {label:"Syringe 30 mg/0.3 mL",conc:100,unit:"mg/mL",route:"SC"},
      {label:"Syringe 40 mg/0.4 mL",conc:100,unit:"mg/mL",route:"SC"},
      {label:"Syringe 60 mg/0.6 mL",conc:100,unit:"mg/mL",route:"SC"},
      {label:"Syringe 80 mg/0.8 mL",conc:100,unit:"mg/mL",route:"SC"},
      {label:"Syringe 100 mg/1 mL",conc:100,unit:"mg/mL",route:"SC"},
      {label:"Syringe 120 mg/0.8 mL (150 mg/mL)",conc:150,unit:"mg/mL",route:"SC"},
      {label:"Syringe 150 mg/1 mL (150 mg/mL)",conc:150,unit:"mg/mL",route:"SC"},
      {label:"Multi-dose vial 300 mg/3 mL",conc:100,unit:"mg/mL",route:"SC/IV"},
    ],
    typDose:"VTE prophylaxis: 40 mg SC QD; VTE treatment: 1 mg/kg SC BID or 1.5 mg/kg SC QD; ACS: 1 mg/kg SC BID", maxDose:"180 mg/dose", renalCaution:true },

  { id:"warfarin", generic:"Warfarin", brands:["Coumadin","Jantoven"],
    category:"Anticoagulant / VKA", color:"#E5C07B", rxcui:"11289",
    routes:["PO","IV"],
    forms:[
      {label:"Tablet 1 mg",conc:1,unit:"mg",route:"PO"},
      {label:"Tablet 2 mg",conc:2,unit:"mg",route:"PO"},
      {label:"Tablet 2.5 mg",conc:2.5,unit:"mg",route:"PO"},
      {label:"Tablet 3 mg",conc:3,unit:"mg",route:"PO"},
      {label:"Tablet 4 mg",conc:4,unit:"mg",route:"PO"},
      {label:"Tablet 5 mg",conc:5,unit:"mg",route:"PO"},
      {label:"Tablet 6 mg",conc:6,unit:"mg",route:"PO"},
      {label:"Tablet 7.5 mg",conc:7.5,unit:"mg",route:"PO"},
      {label:"Tablet 10 mg",conc:10,unit:"mg",route:"PO"},
      {label:"IV vial 5 mg",conc:5,unit:"mg",route:"IV"},
    ],
    typDose:"Initiate 5–10 mg/day; titrate to INR 2–3 (most), 2.5–3.5 (mechanical valves)", maxDose:"individualized to INR", renalCaution:false },

  { id:"apixaban", generic:"Apixaban", brands:["Eliquis"],
    category:"Anticoagulant / Factor Xa inhibitor", color:"#E5C07B", rxcui:"1364430",
    routes:["PO"],
    forms:[
      {label:"Tablet 2.5 mg",conc:2.5,unit:"mg",route:"PO"},
      {label:"Tablet 5 mg",conc:5,unit:"mg",route:"PO"},
    ],
    typDose:"AF: 5 mg BID (2.5 mg BID if ≥2 of: age≥80, wt≤60kg, Cr≥1.5); DVT/PE: 10 mg BID ×7d then 5 mg BID", maxDose:"10 mg/day (AF); 20 mg/day (acute DVT/PE)", renalCaution:true },

  { id:"rivaroxaban", generic:"Rivaroxaban", brands:["Xarelto"],
    category:"Anticoagulant / Factor Xa inhibitor", color:"#E5C07B", rxcui:"1114195",
    routes:["PO"],
    forms:[
      {label:"Tablet 2.5 mg",conc:2.5,unit:"mg",route:"PO"},
      {label:"Tablet 10 mg",conc:10,unit:"mg",route:"PO"},
      {label:"Tablet 15 mg",conc:15,unit:"mg",route:"PO"},
      {label:"Tablet 20 mg",conc:20,unit:"mg",route:"PO"},
      {label:"Oral suspension 1 mg/mL",conc:1,unit:"mg/mL",route:"PO"},
    ],
    typDose:"AF: 20 mg QD with evening meal; DVT/PE treatment: 15 mg BID ×21d, then 20 mg QD", maxDose:"20 mg/day", renalCaution:true },

  { id:"aspirin", generic:"Aspirin (Acetylsalicylic Acid)", brands:["Bayer","Ecotrin","Bufferin","Aspirin 81"],
    category:"Antiplatelet / Salicylate", color:"#E5C07B", rxcui:"1191",
    routes:["PO","IV","Rectal"],
    forms:[
      {label:"Tablet 81 mg (low-dose)",conc:81,unit:"mg",route:"PO"},
      {label:"Tablet 162 mg",conc:162,unit:"mg",route:"PO"},
      {label:"Tablet 325 mg",conc:325,unit:"mg",route:"PO"},
      {label:"EC Tablet 81 mg",conc:81,unit:"mg",route:"PO EC"},
      {label:"EC Tablet 325 mg",conc:325,unit:"mg",route:"PO EC"},
      {label:"Suppository 300 mg",conc:300,unit:"mg",route:"PR"},
      {label:"Suppository 600 mg",conc:600,unit:"mg",route:"PR"},
      {label:"IV 500 mg/vial (Durlaza/Aspirin IV)",conc:500,unit:"mg",route:"IV"},
    ],
    typDose:"ACS/Antiplatelet: 162–325 mg loading, then 81 mg daily; Pain/Fever: 325–650 mg q4–6h", maxDose:"4 g/day (pain/fever)", renalCaution:true },

  { id:"clopidogrel", generic:"Clopidogrel", brands:["Plavix"],
    category:"Antiplatelet / Thienopyridine", color:"#E5C07B", rxcui:"32968",
    routes:["PO"],
    forms:[
      {label:"Tablet 75 mg",conc:75,unit:"mg",route:"PO"},
      {label:"Tablet 300 mg",conc:300,unit:"mg",route:"PO"},
    ],
    typDose:"ACS: 300–600 mg loading, then 75 mg daily; Secondary prevention: 75 mg daily", maxDose:"600 mg loading dose", renalCaution:false },

  // ══════════════════════════════════════════════
  // INSULIN
  // ══════════════════════════════════════════════
  { id:"insulin_regular", generic:"Insulin Regular (Human)", brands:["Humulin R","Novolin R","Myxredlin"],
    category:"Insulin / Short-acting", color:"#00C9A7", rxcui:"86009",
    routes:["IV","SC","IM"],
    forms:[
      {label:"Vial U-100 (100 units/mL) 10 mL",conc:100,unit:"units/mL",route:"IV/SC/IM"},
      {label:"Vial U-500 (500 units/mL) 20 mL",conc:500,unit:"units/mL",route:"SC"},
      {label:"Pen U-100 (KwikPen)",conc:100,unit:"units/mL",route:"SC"},
      {label:"IV premix 100 units/100 mL NS",conc:1,unit:"units/mL",route:"IV infusion"},
    ],
    typDose:"DKA: 0.1 units/kg/hr IV; SC correction: per sliding scale; Meal coverage: 0.05–0.1 units/kg", maxDose:"varies by protocol", renalCaution:true },

  { id:"insulin_nph", generic:"Insulin NPH (Isophane)", brands:["Humulin N","Novolin N","ReliOn N"],
    category:"Insulin / Intermediate-acting", color:"#00C9A7", rxcui:"86006",
    routes:["SC"],
    forms:[
      {label:"Vial U-100 (100 units/mL) 10 mL",conc:100,unit:"units/mL",route:"SC"},
      {label:"Pen U-100 (KwikPen)",conc:100,unit:"units/mL",route:"SC"},
    ],
    typDose:"0.1–0.2 units/kg SC QD–BID", maxDose:"individualized", renalCaution:true },

  { id:"insulin_glargine", generic:"Insulin Glargine", brands:["Lantus","Basaglar","Toujeo","Semglee","Rezvoglar"],
    category:"Insulin / Long-acting", color:"#00C9A7", rxcui:"274783",
    routes:["SC"],
    forms:[
      {label:"Lantus vial U-100 10 mL",conc:100,unit:"units/mL",route:"SC"},
      {label:"Lantus SoloStar pen U-100",conc:100,unit:"units/mL",route:"SC"},
      {label:"Basaglar KwikPen U-100",conc:100,unit:"units/mL",route:"SC"},
      {label:"Toujeo SoloStar U-300",conc:300,unit:"units/mL",route:"SC"},
      {label:"Toujeo Max SoloStar U-300",conc:300,unit:"units/mL",route:"SC"},
    ],
    typDose:"Type 2: 0.2 units/kg SC once daily; titrate by 2 units q3d to FBG target", maxDose:"individualized", renalCaution:true },

  { id:"insulin_detemir", generic:"Insulin Detemir", brands:["Levemir"],
    category:"Insulin / Long-acting", color:"#00C9A7", rxcui:"285018",
    routes:["SC"],
    forms:[
      {label:"Vial U-100 (100 units/mL) 10 mL",conc:100,unit:"units/mL",route:"SC"},
      {label:"FlexPen U-100",conc:100,unit:"units/mL",route:"SC"},
    ],
    typDose:"0.1–0.2 units/kg SC QD–BID", maxDose:"individualized", renalCaution:true },

  { id:"insulin_lispro", generic:"Insulin Lispro", brands:["Humalog","Admelog","Lyumjev"],
    category:"Insulin / Rapid-acting", color:"#00C9A7", rxcui:"86034",
    routes:["SC","IV"],
    forms:[
      {label:"Vial U-100 (100 units/mL) 10 mL",conc:100,unit:"units/mL",route:"SC/IV"},
      {label:"Vial U-200 (200 units/mL) 3.5 mL",conc:200,unit:"units/mL",route:"SC"},
      {label:"KwikPen U-100",conc:100,unit:"units/mL",route:"SC"},
      {label:"Junior KwikPen U-100",conc:100,unit:"units/mL",route:"SC"},
    ],
    typDose:"0.1 units/kg SC with meals; administer 0–15 min before eating", maxDose:"individualized", renalCaution:true },

  { id:"insulin_aspart", generic:"Insulin Aspart", brands:["NovoLog","Fiasp","NovoRapid"],
    category:"Insulin / Rapid-acting", color:"#00C9A7", rxcui:"86028",
    routes:["SC","IV"],
    forms:[
      {label:"Vial U-100 (100 units/mL) 10 mL",conc:100,unit:"units/mL",route:"SC/IV"},
      {label:"FlexPen U-100",conc:100,unit:"units/mL",route:"SC"},
      {label:"PenFill 3 mL U-100",conc:100,unit:"units/mL",route:"SC"},
      {label:"Fiasp Vial U-100",conc:100,unit:"units/mL",route:"SC/IV"},
    ],
    typDose:"0.1 units/kg SC immediately before meals; insulin:carb ratio method", maxDose:"individualized", renalCaution:true },

  // ══════════════════════════════════════════════
  // SEDATIVES, ANESTHETICS & NEUROMUSCULAR
  // ══════════════════════════════════════════════
  { id:"propofol", generic:"Propofol", brands:["Diprivan","Fresofol","Propoven"],
    category:"Sedative / Anesthetic", color:"#98C379", rxcui:"9030",
    routes:["IV"],
    forms:[
      {label:"Emulsion 10 mg/mL (1%) 20 mL",conc:10,unit:"mg/mL",route:"IV"},
      {label:"Emulsion 10 mg/mL (1%) 50 mL",conc:10,unit:"mg/mL",route:"IV"},
      {label:"Emulsion 10 mg/mL (1%) 100 mL",conc:10,unit:"mg/mL",route:"IV"},
      {label:"Emulsion 10 mg/mL (1%) 200 mL",conc:10,unit:"mg/mL",route:"IV"},
      {label:"Emulsion 10 mg/mL (1%) 500 mL",conc:10,unit:"mg/mL",route:"IV"},
    ],
    typDose:"Induction: 1.5–2.5 mg/kg IV; ICU sedation: 5–50 mcg/kg/min (0.3–3 mg/kg/hr)", maxDose:"4 mg/kg/hr (ICU, propofol infusion syndrome risk >5 mg/kg/hr)", renalCaution:false },

  { id:"midazolam", generic:"Midazolam", brands:["Versed","Nayzilam","Seizalam","Buccolam"],
    category:"Sedative / Benzodiazepine", color:"#98C379", rxcui:"41493",
    routes:["IV","IM","IN","PO","Buccal"],
    forms:[
      {label:"Injection 1 mg/mL (2 mL)",conc:1,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 1 mg/mL (5 mL)",conc:1,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 1 mg/mL (10 mL)",conc:1,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 5 mg/mL (1 mL)",conc:5,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 5 mg/mL (2 mL)",conc:5,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 5 mg/mL (5 mL)",conc:5,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 5 mg/mL (10 mL)",conc:5,unit:"mg/mL",route:"IV/IM"},
      {label:"Oral syrup 2 mg/mL",conc:2,unit:"mg/mL",route:"PO"},
      {label:"Nasal spray 5 mg/0.1 mL (50 mg/mL)",conc:50,unit:"mg/mL",route:"IN"},
    ],
    typDose:"Procedural: 1–2 mg IV, titrate; ICU infusion: 0.02–0.1 mg/kg/hr; Status epilepticus: 0.1–0.2 mg/kg IV", maxDose:"10 mg IV (procedural)", renalCaution:false },

  { id:"dexmedetomidine", generic:"Dexmedetomidine", brands:["Precedex","Igalmi"],
    category:"Sedative / Alpha-2 agonist", color:"#98C379", rxcui:"227224",
    routes:["IV infusion"],
    forms:[
      {label:"Vial 200 mcg/2 mL (100 mcg/mL)",conc:0.1,unit:"mg/mL",route:"IV"},
      {label:"Premix 200 mcg/50 mL NS (4 mcg/mL)",conc:0.004,unit:"mg/mL",route:"IV"},
      {label:"Premix 400 mcg/100 mL NS (4 mcg/mL)",conc:0.004,unit:"mg/mL",route:"IV"},
      {label:"Premix 200 mcg/100 mL NS (2 mcg/mL)",conc:0.002,unit:"mg/mL",route:"IV"},
    ],
    typDose:"ICU: 0.2–0.7 mcg/kg/hr (no bolus); procedural: loading 1 mcg/kg over 10 min, then 0.2–1 mcg/kg/hr", maxDose:"1.5 mcg/kg/hr", renalCaution:false },

  { id:"ketamine", generic:"Ketamine", brands:["Ketalar","Spravato (esketamine)"],
    category:"Sedative / Dissociative anesthetic", color:"#98C379", rxcui:"6130",
    routes:["IV","IM","IN","PO","Epidural"],
    forms:[
      {label:"Injection 10 mg/mL (20 mL)",conc:10,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 50 mg/mL (10 mL)",conc:50,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 100 mg/mL (5 mL)",conc:100,unit:"mg/mL",route:"IV/IM"},
      {label:"Intranasal 500 mg/10 mL (50 mg/mL)",conc:50,unit:"mg/mL",route:"IN"},
    ],
    typDose:"Induction: 1–2 mg/kg IV; procedural: 0.5–2 mg/kg IV or 4–8 mg/kg IM; analgesia: 0.1–0.5 mg/kg IV; pain infusion: 0.1–0.5 mg/kg/hr", maxDose:"2 mg/kg IV (induction)", renalCaution:false },

  { id:"lorazepam", generic:"Lorazepam", brands:["Ativan"],
    category:"Sedative / Benzodiazepine", color:"#98C379", rxcui:"6470",
    routes:["IV","IM","PO","SL"],
    forms:[
      {label:"Injection 2 mg/mL (1 mL)",conc:2,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 2 mg/mL (10 mL)",conc:2,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 4 mg/mL (1 mL)",conc:4,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 4 mg/mL (10 mL)",conc:4,unit:"mg/mL",route:"IV/IM"},
      {label:"Tablet 0.5 mg",conc:0.5,unit:"mg",route:"PO/SL"},
      {label:"Tablet 1 mg",conc:1,unit:"mg",route:"PO/SL"},
      {label:"Tablet 2 mg",conc:2,unit:"mg",route:"PO/SL"},
      {label:"Oral solution 2 mg/mL",conc:2,unit:"mg/mL",route:"PO"},
    ],
    typDose:"Anxiety/sedation: 0.5–2 mg IV/PO q4–6h; Status epilepticus: 0.05–0.1 mg/kg IV (max 4 mg/dose); ICU infusion: 0.01–0.1 mg/kg/hr", maxDose:"10 mg/day IV; 10 mg/day PO", renalCaution:false },

  { id:"succinylcholine", generic:"Succinylcholine", brands:["Anectine","Quelicin"],
    category:"Neuromuscular Blocker / Depolarizing", color:"#98C379", rxcui:"9928",
    routes:["IV","IM"],
    forms:[
      {label:"Injection 20 mg/mL (10 mL)",conc:20,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 50 mg/mL (10 mL)",conc:50,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 100 mg/mL (10 mL)",conc:100,unit:"mg/mL",route:"IV/IM"},
    ],
    typDose:"RSI: 1–1.5 mg/kg IV (max 150–200 mg); IM: 3–4 mg/kg (max 150 mg)", maxDose:"1.5 mg/kg IV; 4 mg/kg IM", renalCaution:false },

  { id:"rocuronium", generic:"Rocuronium", brands:["Zemuron","Esmeron"],
    category:"Neuromuscular Blocker / Non-depolarizing", color:"#98C379", rxcui:"68139",
    routes:["IV"],
    forms:[
      {label:"Vial 10 mg/mL (5 mL)",conc:10,unit:"mg/mL",route:"IV"},
      {label:"Vial 10 mg/mL (10 mL)",conc:10,unit:"mg/mL",route:"IV"},
    ],
    typDose:"RSI: 1.2 mg/kg IV; Routine intubation: 0.6 mg/kg; Maintenance: 0.1–0.2 mg/kg", maxDose:"1.2 mg/kg (RSI)", renalCaution:false },

  // ══════════════════════════════════════════════
  // DIURETICS
  // ══════════════════════════════════════════════
  { id:"furosemide", generic:"Furosemide", brands:["Lasix","Furoscix"],
    category:"Diuretic / Loop", color:"#56B6C2", rxcui:"4603",
    routes:["IV","IM","PO"],
    forms:[
      {label:"Injection 10 mg/mL (2 mL)",conc:10,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 10 mg/mL (4 mL)",conc:10,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 10 mg/mL (10 mL)",conc:10,unit:"mg/mL",route:"IV/IM"},
      {label:"Tablet 20 mg",conc:20,unit:"mg",route:"PO"},
      {label:"Tablet 40 mg",conc:40,unit:"mg",route:"PO"},
      {label:"Tablet 80 mg",conc:80,unit:"mg",route:"PO"},
      {label:"Oral solution 8 mg/mL",conc:8,unit:"mg/mL",route:"PO"},
      {label:"Oral solution 10 mg/mL",conc:10,unit:"mg/mL",route:"PO"},
    ],
    typDose:"20–80 mg IV/PO q12–24h; heart failure: 0.5–1 mg/kg IV bolus; continuous infusion: 5–40 mg/hr", maxDose:"600 mg/day", renalCaution:true },

  { id:"bumetanide", generic:"Bumetanide", brands:["Bumex"],
    category:"Diuretic / Loop", color:"#56B6C2", rxcui:"1611",
    routes:["IV","IM","PO"],
    forms:[
      {label:"Injection 0.25 mg/mL (2 mL)",conc:0.25,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 0.25 mg/mL (4 mL)",conc:0.25,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 0.25 mg/mL (10 mL)",conc:0.25,unit:"mg/mL",route:"IV/IM"},
      {label:"Tablet 0.5 mg",conc:0.5,unit:"mg",route:"PO"},
      {label:"Tablet 1 mg",conc:1,unit:"mg",route:"PO"},
      {label:"Tablet 2 mg",conc:2,unit:"mg",route:"PO"},
    ],
    typDose:"0.5–1 mg IV/PO, repeat q2–3h PRN; max 10 mg/day", maxDose:"10 mg/day", renalCaution:true },

  { id:"spironolactone", generic:"Spironolactone", brands:["Aldactone","CaroSpir"],
    category:"Diuretic / Potassium-sparing", color:"#56B6C2", rxcui:"9997",
    routes:["PO"],
    forms:[
      {label:"Tablet 25 mg",conc:25,unit:"mg",route:"PO"},
      {label:"Tablet 50 mg",conc:50,unit:"mg",route:"PO"},
      {label:"Tablet 100 mg",conc:100,unit:"mg",route:"PO"},
      {label:"Oral suspension 25 mg/5 mL",conc:5,unit:"mg/mL",route:"PO"},
    ],
    typDose:"HF: 25–50 mg once daily; hyperaldosteronism: 100–400 mg/day; acne/PCOS: 25–200 mg/day", maxDose:"400 mg/day", renalCaution:true },

  { id:"hydrochlorothiazide", generic:"Hydrochlorothiazide (HCTZ)", brands:["Microzide","Esidrix"],
    category:"Diuretic / Thiazide", color:"#56B6C2", rxcui:"5487",
    routes:["PO"],
    forms:[
      {label:"Tablet 12.5 mg",conc:12.5,unit:"mg",route:"PO"},
      {label:"Tablet 25 mg",conc:25,unit:"mg",route:"PO"},
      {label:"Tablet 50 mg",conc:50,unit:"mg",route:"PO"},
      {label:"Capsule 12.5 mg",conc:12.5,unit:"mg",route:"PO"},
    ],
    typDose:"12.5–50 mg once daily", maxDose:"50 mg/day (HTN); 200 mg/day (edema)", renalCaution:true },

  // ══════════════════════════════════════════════
  // RESPIRATORY
  // ══════════════════════════════════════════════
  { id:"albuterol", generic:"Albuterol (Salbutamol)", brands:["ProAir","Ventolin","Proventil","AccuNeb","ProAir RespiClick"],
    category:"Bronchodilator / SABA", color:"#56B6C2", rxcui:"435",
    routes:["Inhaled","Nebulized","PO","IV"],
    forms:[
      {label:"MDI 90 mcg/actuation (200 doses)",conc:90,unit:"mcg/dose",route:"MDI"},
      {label:"MDI 90 mcg/actuation (60 doses, HFA)",conc:90,unit:"mcg/dose",route:"MDI"},
      {label:"DPI 90 mcg/actuation (RespiClick)",conc:90,unit:"mcg/dose",route:"DPI"},
      {label:"Nebulization solution 0.083% (2.5 mg/3 mL)",conc:0.83,unit:"mg/mL",route:"Neb"},
      {label:"Nebulization concentrate 0.5% (5 mg/mL)",conc:5,unit:"mg/mL",route:"Neb"},
      {label:"Syrup 2 mg/5 mL",conc:0.4,unit:"mg/mL",route:"PO"},
      {label:"Tablet 2 mg",conc:2,unit:"mg",route:"PO"},
      {label:"Tablet 4 mg",conc:4,unit:"mg",route:"PO"},
      {label:"ER Tablet 4 mg",conc:4,unit:"mg",route:"PO ER"},
      {label:"ER Tablet 8 mg",conc:8,unit:"mg",route:"PO ER"},
    ],
    typDose:"Acute: 2.5 mg neb q20min ×3, then q1–4h; MDI: 2–4 puffs q4–6h PRN", maxDose:"10 mg/dose (severe exacerbation)", renalCaution:false },

  { id:"ipratropium", generic:"Ipratropium", brands:["Atrovent","Atrovent HFA"],
    category:"Bronchodilator / Anticholinergic", color:"#56B6C2", rxcui:"7213",
    routes:["Inhaled","Nebulized"],
    forms:[
      {label:"MDI 17 mcg/actuation (200 doses)",conc:17,unit:"mcg/dose",route:"MDI"},
      {label:"Nebulization 0.02% (500 mcg/2.5 mL)",conc:0.2,unit:"mg/mL",route:"Neb"},
    ],
    typDose:"COPD/Asthma: 2–4 puffs MDI q6h; 500 mcg neb q6–8h; acute: 500 mcg q20min ×3 (with albuterol)", maxDose:"12 puffs/day MDI", renalCaution:false },

  { id:"budesonide", generic:"Budesonide", brands:["Pulmicort","Rhinocort","Entocort","Uceris"],
    category:"Corticosteroid / Inhaled", color:"#56B6C2", rxcui:"1649566",
    routes:["Inhaled","Nebulized","Nasal","PO"],
    forms:[
      {label:"Flexhaler 90 mcg/dose",conc:90,unit:"mcg/dose",route:"Inhaled"},
      {label:"Flexhaler 180 mcg/dose",conc:180,unit:"mcg/dose",route:"Inhaled"},
      {label:"Neb suspension 0.25 mg/2 mL",conc:0.125,unit:"mg/mL",route:"Neb"},
      {label:"Neb suspension 0.5 mg/2 mL",conc:0.25,unit:"mg/mL",route:"Neb"},
      {label:"Neb suspension 1 mg/2 mL",conc:0.5,unit:"mg/mL",route:"Neb"},
      {label:"Nasal spray 32 mcg/spray",conc:32,unit:"mcg/dose",route:"Nasal"},
      {label:"Oral capsule 3 mg (Entocort)",conc:3,unit:"mg",route:"PO"},
      {label:"ER Tablet 9 mg (Uceris)",conc:9,unit:"mg",route:"PO ER"},
    ],
    typDose:"Asthma: 180–360 mcg BID inhaled; Croup: 2 mg neb single dose; IBD: 9 mg/day PO ×8wk", maxDose:"720 mcg/day inhaled", renalCaution:false },

  // ══════════════════════════════════════════════
  // ANTIEMETICS
  // ══════════════════════════════════════════════
  { id:"ondansetron", generic:"Ondansetron", brands:["Zofran","Zuplenz","Zofran ODT"],
    category:"Antiemetic / 5-HT3 antagonist", color:"#ABB2BF", rxcui:"103971",
    routes:["IV","IM","PO","ODT"],
    forms:[
      {label:"Injection 2 mg/mL (2 mL)",conc:2,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 2 mg/mL (20 mL)",conc:2,unit:"mg/mL",route:"IV/IM"},
      {label:"Premix 32 mg/50 mL (0.64 mg/mL)",conc:0.64,unit:"mg/mL",route:"IV"},
      {label:"Tablet 4 mg",conc:4,unit:"mg",route:"PO"},
      {label:"Tablet 8 mg",conc:8,unit:"mg",route:"PO"},
      {label:"Tablet 24 mg",conc:24,unit:"mg",route:"PO"},
      {label:"ODT 4 mg",conc:4,unit:"mg",route:"ODT"},
      {label:"ODT 8 mg",conc:8,unit:"mg",route:"ODT"},
      {label:"Oral solution 4 mg/5 mL",conc:0.8,unit:"mg/mL",route:"PO"},
      {label:"Oral film 4 mg",conc:4,unit:"mg",route:"Buccal"},
      {label:"Oral film 8 mg",conc:8,unit:"mg",route:"Buccal"},
    ],
    typDose:"4–8 mg IV/PO q4–8h PRN; chemo N/V: 8 mg IV/PO TID; peds: 0.1–0.15 mg/kg IV (max 4–8 mg)", maxDose:"32 mg/day (8 mg q8h)", renalCaution:false },

  { id:"promethazine", generic:"Promethazine", brands:["Phenergan","Promethegan"],
    category:"Antiemetic / Phenothiazine", color:"#ABB2BF", rxcui:"8745",
    routes:["IM","PO","PR","IV (caution)"],
    forms:[
      {label:"Injection 25 mg/mL (1 mL)",conc:25,unit:"mg/mL",route:"IM (deep)"},
      {label:"Injection 50 mg/mL (1 mL)",conc:50,unit:"mg/mL",route:"IM (deep)"},
      {label:"Tablet 12.5 mg",conc:12.5,unit:"mg",route:"PO"},
      {label:"Tablet 25 mg",conc:25,unit:"mg",route:"PO"},
      {label:"Tablet 50 mg",conc:50,unit:"mg",route:"PO"},
      {label:"Syrup 6.25 mg/5 mL",conc:1.25,unit:"mg/mL",route:"PO"},
      {label:"Suppository 12.5 mg",conc:12.5,unit:"mg",route:"PR"},
      {label:"Suppository 25 mg",conc:25,unit:"mg",route:"PR"},
      {label:"Suppository 50 mg",conc:50,unit:"mg",route:"PR"},
    ],
    typDose:"12.5–25 mg IM/PO/PR q4–6h PRN; ⚠️ BLACK BOX: Do NOT give IV (tissue necrosis risk)", maxDose:"150 mg/day", renalCaution:false },

  { id:"metoclopramide", generic:"Metoclopramide", brands:["Reglan","Metozolv ODT"],
    category:"Antiemetic / Prokinetic", color:"#ABB2BF", rxcui:"6816",
    routes:["IV","IM","PO"],
    forms:[
      {label:"Injection 5 mg/mL (2 mL)",conc:5,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 5 mg/mL (10 mL)",conc:5,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 5 mg/mL (30 mL)",conc:5,unit:"mg/mL",route:"IV/IM"},
      {label:"Tablet 5 mg",conc:5,unit:"mg",route:"PO"},
      {label:"Tablet 10 mg",conc:10,unit:"mg",route:"PO"},
      {label:"ODT 5 mg",conc:5,unit:"mg",route:"ODT"},
      {label:"ODT 10 mg",conc:10,unit:"mg",route:"ODT"},
      {label:"Oral solution 5 mg/5 mL",conc:1,unit:"mg/mL",route:"PO"},
    ],
    typDose:"5–10 mg IV/IM/PO QID AC & HS; GERD: 10–15 mg QID; high-dose chemo: 1–2 mg/kg IV", maxDose:"40 mg/day (routine); 60 mg/day (max)", renalCaution:true },

  // ══════════════════════════════════════════════
  // CORTICOSTEROIDS
  // ══════════════════════════════════════════════
  { id:"dexamethasone", generic:"Dexamethasone", brands:["Decadron","Dexamethasone Intensol","DexPak","Ozurdex"],
    category:"Corticosteroid / Systemic", color:"#E5C07B", rxcui:"3264",
    routes:["IV","IM","PO","Intravitreal","Epidural"],
    forms:[
      {label:"Injection 4 mg/mL (1 mL)",conc:4,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 4 mg/mL (5 mL)",conc:4,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 4 mg/mL (10 mL)",conc:4,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 4 mg/mL (25 mL)",conc:4,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 10 mg/mL",conc:10,unit:"mg/mL",route:"IV/IM"},
      {label:"Tablet 0.5 mg",conc:0.5,unit:"mg",route:"PO"},
      {label:"Tablet 0.75 mg",conc:0.75,unit:"mg",route:"PO"},
      {label:"Tablet 1 mg",conc:1,unit:"mg",route:"PO"},
      {label:"Tablet 1.5 mg",conc:1.5,unit:"mg",route:"PO"},
      {label:"Tablet 2 mg",conc:2,unit:"mg",route:"PO"},
      {label:"Tablet 4 mg",conc:4,unit:"mg",route:"PO"},
      {label:"Tablet 6 mg",conc:6,unit:"mg",route:"PO"},
      {label:"Oral solution 0.5 mg/5 mL",conc:0.1,unit:"mg/mL",route:"PO"},
      {label:"Oral solution 1 mg/mL (Intensol)",conc:1,unit:"mg/mL",route:"PO"},
    ],
    typDose:"COVID-19: 6 mg QD ×10d; Cerebral edema: 10 mg IV load, then 4 mg q6h; PONV: 4–8 mg IV; Anti-emetic (chemo): 8–20 mg IV; Croup: 0.15–0.6 mg/kg PO/IM (max 16 mg)", maxDose:"varies by indication", renalCaution:false },

  { id:"methylprednisolone", generic:"Methylprednisolone", brands:["Solu-Medrol","Depo-Medrol","Medrol"],
    category:"Corticosteroid / Systemic", color:"#E5C07B", rxcui:"6902",
    routes:["IV","IM","PO","Intra-articular"],
    forms:[
      {label:"IV vial 40 mg",conc:40,unit:"mg",route:"IV/IM"},
      {label:"IV vial 125 mg",conc:125,unit:"mg",route:"IV/IM"},
      {label:"IV vial 500 mg",conc:500,unit:"mg",route:"IV/IM"},
      {label:"IV vial 1000 mg",conc:1000,unit:"mg",route:"IV/IM"},
      {label:"Depo-Medrol 20 mg/mL",conc:20,unit:"mg/mL",route:"IM/intra-articular"},
      {label:"Depo-Medrol 40 mg/mL",conc:40,unit:"mg/mL",route:"IM/intra-articular"},
      {label:"Depo-Medrol 80 mg/mL",conc:80,unit:"mg/mL",route:"IM/intra-articular"},
      {label:"Medrol tablet 2 mg",conc:2,unit:"mg",route:"PO"},
      {label:"Medrol tablet 4 mg",conc:4,unit:"mg",route:"PO"},
      {label:"Medrol tablet 8 mg",conc:8,unit:"mg",route:"PO"},
      {label:"Medrol tablet 16 mg",conc:16,unit:"mg",route:"PO"},
      {label:"Medrol tablet 32 mg",conc:32,unit:"mg",route:"PO"},
    ],
    typDose:"MS relapse/Pulse: 1 g IV QD ×3–5d; COPD exacerbation: 40 mg PO/IV QD ×5d; Asthma: 1–2 mg/kg/day IV", maxDose:"1000 mg/day IV (pulse)", renalCaution:false },

  { id:"prednisone", generic:"Prednisone", brands:["Deltasone","Rayos","Prednisone Intensol"],
    category:"Corticosteroid / Systemic", color:"#E5C07B", rxcui:"8638",
    routes:["PO"],
    forms:[
      {label:"Tablet 1 mg",conc:1,unit:"mg",route:"PO"},
      {label:"Tablet 2.5 mg",conc:2.5,unit:"mg",route:"PO"},
      {label:"Tablet 5 mg",conc:5,unit:"mg",route:"PO"},
      {label:"Tablet 10 mg",conc:10,unit:"mg",route:"PO"},
      {label:"Tablet 20 mg",conc:20,unit:"mg",route:"PO"},
      {label:"Tablet 50 mg",conc:50,unit:"mg",route:"PO"},
      {label:"DR Tablet 1 mg (Rayos)",conc:1,unit:"mg",route:"PO DR"},
      {label:"DR Tablet 2 mg (Rayos)",conc:2,unit:"mg",route:"PO DR"},
      {label:"DR Tablet 5 mg (Rayos)",conc:5,unit:"mg",route:"PO DR"},
      {label:"Oral solution 1 mg/mL",conc:1,unit:"mg/mL",route:"PO"},
      {label:"Oral solution 5 mg/mL (Intensol)",conc:5,unit:"mg/mL",route:"PO"},
    ],
    typDose:"IBD: 40–60 mg/day tapering; Asthma: 1–2 mg/kg/day (peds); COPD: 40 mg/day ×5d; Immunosuppression: varies", maxDose:"80 mg/day (burst)", renalCaution:false },

  // ══════════════════════════════════════════════
  // ANTIEPILEPTICS
  // ══════════════════════════════════════════════
  { id:"levetiracetam", generic:"Levetiracetam", brands:["Keppra","Spritam","Roweepra","Elepsia XR"],
    category:"Antiepileptic / SV2A ligand", color:"#C678DD", rxcui:"83367",
    routes:["IV","PO"],
    forms:[
      {label:"IV vial 500 mg/5 mL (100 mg/mL)",conc:100,unit:"mg/mL",route:"IV"},
      {label:"Tablet 250 mg",conc:250,unit:"mg",route:"PO"},
      {label:"Tablet 500 mg",conc:500,unit:"mg",route:"PO"},
      {label:"Tablet 750 mg",conc:750,unit:"mg",route:"PO"},
      {label:"Tablet 1000 mg",conc:1000,unit:"mg",route:"PO"},
      {label:"ER Tablet 500 mg",conc:500,unit:"mg",route:"PO ER"},
      {label:"ER Tablet 750 mg",conc:750,unit:"mg",route:"PO ER"},
      {label:"Oral solution 100 mg/mL",conc:100,unit:"mg/mL",route:"PO"},
    ],
    typDose:"Epilepsy: 500 mg BID, titrate to max 3000 mg/day; Status epilepticus: 60 mg/kg IV (max 4500 mg) over 10 min", maxDose:"3000 mg/day (routine); 4500 mg (status epilepticus)", renalCaution:true },

  { id:"phenytoin", generic:"Phenytoin / Fosphenytoin", brands:["Dilantin","Phenytek","Cerebyx (fosphenytoin)"],
    category:"Antiepileptic / Sodium channel blocker", color:"#C678DD", rxcui:"8093",
    routes:["IV","PO","IM (fosphenytoin only)"],
    forms:[
      {label:"Phenytoin injection 50 mg/mL (2 mL)",conc:50,unit:"mg/mL",route:"IV (max 50 mg/min)"},
      {label:"Phenytoin injection 50 mg/mL (5 mL)",conc:50,unit:"mg/mL",route:"IV"},
      {label:"Fosphenytoin 50 mg PE/mL (2 mL)",conc:50,unit:"mg PE/mL",route:"IV/IM"},
      {label:"Fosphenytoin 50 mg PE/mL (10 mL)",conc:50,unit:"mg PE/mL",route:"IV/IM"},
      {label:"Capsule ER 30 mg (Dilantin)",conc:30,unit:"mg",route:"PO"},
      {label:"Capsule ER 100 mg (Dilantin)",conc:100,unit:"mg",route:"PO"},
      {label:"Capsule ER 200 mg (Phenytek)",conc:200,unit:"mg",route:"PO"},
      {label:"Capsule ER 300 mg (Phenytek)",conc:300,unit:"mg",route:"PO"},
      {label:"Chewable tablet 50 mg",conc:50,unit:"mg",route:"PO"},
      {label:"Suspension 125 mg/5 mL",conc:25,unit:"mg/mL",route:"PO"},
    ],
    typDose:"Loading: 15–20 mg/kg IV (≤50 mg/min); Maintenance: 4–7 mg/kg/day ÷ q8–12h; Fosphenytoin: same in PE units (1 PE = 1 mg phenytoin)", maxDose:"1500 mg loading; 600 mg/day maintenance", renalCaution:false },

  { id:"valproate", generic:"Valproate / Valproic Acid", brands:["Depakene","Depakote","Depacon","Stavzor"],
    category:"Antiepileptic / Multiple mechanisms", color:"#C678DD", rxcui:"11118",
    routes:["IV","PO","ER"],
    forms:[
      {label:"IV vial 100 mg/mL (5 mL)",conc:100,unit:"mg/mL",route:"IV"},
      {label:"Oral solution 250 mg/5 mL",conc:50,unit:"mg/mL",route:"PO"},
      {label:"Capsule 250 mg (valproic acid)",conc:250,unit:"mg",route:"PO"},
      {label:"Tablet DR 125 mg (Depakote)",conc:125,unit:"mg",route:"PO DR"},
      {label:"Tablet DR 250 mg (Depakote)",conc:250,unit:"mg",route:"PO DR"},
      {label:"Tablet DR 500 mg (Depakote)",conc:500,unit:"mg",route:"PO DR"},
      {label:"Tablet ER 250 mg (Depakote ER)",conc:250,unit:"mg",route:"PO ER"},
      {label:"Tablet ER 500 mg (Depakote ER)",conc:500,unit:"mg",route:"PO ER"},
      {label:"Sprinkle capsule 125 mg",conc:125,unit:"mg",route:"PO"},
    ],
    typDose:"Epilepsy: 10–60 mg/kg/day ÷ BID–TID; target level 50–100 mcg/mL; Status epilepticus: 40 mg/kg IV over 10 min (max 3000 mg)", maxDose:"60 mg/kg/day", renalCaution:false },

  // ══════════════════════════════════════════════
  // PROTON PUMP INHIBITORS & GI
  // ══════════════════════════════════════════════
  { id:"pantoprazole", generic:"Pantoprazole", brands:["Protonix","Protonix IV"],
    category:"PPI / GI", color:"#ABB2BF", rxcui:"40790",
    routes:["IV","PO"],
    forms:[
      {label:"IV vial 40 mg",conc:40,unit:"mg",route:"IV"},
      {label:"Tablet DR 20 mg",conc:20,unit:"mg",route:"PO DR"},
      {label:"Tablet DR 40 mg",conc:40,unit:"mg",route:"PO DR"},
      {label:"Oral granules 40 mg/packet",conc:40,unit:"mg",route:"PO"},
    ],
    typDose:"40 mg IV/PO QD–BID; UGIB: 80 mg IV bolus then 8 mg/hr infusion ×72h; H. pylori: as part of triple therapy", maxDose:"80 mg/day routine; 8 mg/hr IV infusion (UGIB)", renalCaution:false },

  { id:"omeprazole", generic:"Omeprazole", brands:["Prilosec","Losec","Prilosec OTC","Zegerid (with bicarb)"],
    category:"PPI / GI", color:"#ABB2BF", rxcui:"7646",
    routes:["PO","IV (as esomeprazole/omeprazole)"],
    forms:[
      {label:"Capsule 10 mg",conc:10,unit:"mg",route:"PO"},
      {label:"Capsule 20 mg",conc:20,unit:"mg",route:"PO"},
      {label:"Capsule 40 mg",conc:40,unit:"mg",route:"PO"},
      {label:"Tablet 20 mg (OTC)",conc:20,unit:"mg",route:"PO"},
      {label:"Powder for suspension 20 mg/packet",conc:20,unit:"mg",route:"PO"},
      {label:"Powder for suspension 40 mg/packet",conc:40,unit:"mg",route:"PO"},
    ],
    typDose:"GERD: 20 mg QD; Erosive esophagitis: 20–40 mg QD; Zollinger-Ellison: 60 mg QD", maxDose:"120 mg/day (ZE syndrome)", renalCaution:false },

  // ══════════════════════════════════════════════
  // PSYCHIATRIC MEDICATIONS
  // ══════════════════════════════════════════════
  { id:"haloperidol", generic:"Haloperidol", brands:["Haldol","Haldol Decanoate"],
    category:"Antipsychotic / Typical", color:"#C678DD", rxcui:"5093",
    routes:["IV","IM","PO"],
    forms:[
      {label:"Injection 5 mg/mL (1 mL)",conc:5,unit:"mg/mL",route:"IV/IM"},
      {label:"Injection 5 mg/mL (10 mL)",conc:5,unit:"mg/mL",route:"IV/IM"},
      {label:"Decanoate IM 50 mg/mL (1 mL)",conc:50,unit:"mg/mL",route:"IM depot"},
      {label:"Decanoate IM 100 mg/mL (1 mL)",conc:100,unit:"mg/mL",route:"IM depot"},
      {label:"Tablet 0.5 mg",conc:0.5,unit:"mg",route:"PO"},
      {label:"Tablet 1 mg",conc:1,unit:"mg",route:"PO"},
      {label:"Tablet 2 mg",conc:2,unit:"mg",route:"PO"},
      {label:"Tablet 5 mg",conc:5,unit:"mg",route:"PO"},
      {label:"Tablet 10 mg",conc:10,unit:"mg",route:"PO"},
      {label:"Tablet 20 mg",conc:20,unit:"mg",route:"PO"},
      {label:"Oral solution 2 mg/mL",conc:2,unit:"mg/mL",route:"PO"},
    ],
    typDose:"Agitation: 2–10 mg IV/IM q4–8h PRN; Delirium (ICU): 0.5–10 mg IV q4–8h; Maintenance PO: 2–20 mg/day", maxDose:"100 mg/day (acute psychosis)", renalCaution:false },

  { id:"quetiapine", generic:"Quetiapine", brands:["Seroquel","Seroquel XR"],
    category:"Antipsychotic / Atypical", color:"#C678DD", rxcui:"115590",
    routes:["PO"],
    forms:[
      {label:"Tablet 25 mg",conc:25,unit:"mg",route:"PO"},
      {label:"Tablet 50 mg",conc:50,unit:"mg",route:"PO"},
      {label:"Tablet 100 mg",conc:100,unit:"mg",route:"PO"},
      {label:"Tablet 200 mg",conc:200,unit:"mg",route:"PO"},
      {label:"Tablet 300 mg",conc:300,unit:"mg",route:"PO"},
      {label:"Tablet 400 mg",conc:400,unit:"mg",route:"PO"},
      {label:"XR Tablet 50 mg",conc:50,unit:"mg",route:"PO XR"},
      {label:"XR Tablet 150 mg",conc:150,unit:"mg",route:"PO XR"},
      {label:"XR Tablet 200 mg",conc:200,unit:"mg",route:"PO XR"},
      {label:"XR Tablet 300 mg",conc:300,unit:"mg",route:"PO XR"},
      {label:"XR Tablet 400 mg",conc:400,unit:"mg",route:"PO XR"},
    ],
    typDose:"Schizophrenia: 150–750 mg/day ÷ BID; Bipolar mania: 400–800 mg/day; Depression augment: 50–300 mg/day HS; ICU delirium: 12.5–50 mg QHS", maxDose:"800 mg/day", renalCaution:false },

  // ══════════════════════════════════════════════
  // ELECTROLYTES & IV FLUIDS
  // ══════════════════════════════════════════════
  { id:"potassium_chloride", generic:"Potassium Chloride", brands:["K-Dur","Klor-Con","Micro-K","K-Tab"],
    category:"Electrolyte / Potassium", color:"#98C379", rxcui:"8591",
    routes:["IV","PO"],
    forms:[
      {label:"IV concentrate 2 mEq/mL (10 mL)",conc:2,unit:"mEq/mL",route:"IV (MUST dilute)"},
      {label:"IV concentrate 2 mEq/mL (20 mL)",conc:2,unit:"mEq/mL",route:"IV (MUST dilute)"},
      {label:"Premix 20 mEq/50 mL NS",conc:0.4,unit:"mEq/mL",route:"IV"},
      {label:"Premix 20 mEq/100 mL NS",conc:0.2,unit:"mEq/mL",route:"IV"},
      {label:"Premix 40 mEq/100 mL NS",conc:0.4,unit:"mEq/mL",route:"IV"},
      {label:"ER Tablet 8 mEq",conc:8,unit:"mEq",route:"PO"},
      {label:"ER Tablet 10 mEq",conc:10,unit:"mEq",route:"PO"},
      {label:"ER Tablet 20 mEq",conc:20,unit:"mEq",route:"PO"},
      {label:"Oral solution 20 mEq/15 mL",conc:1.33,unit:"mEq/mL",route:"PO"},
      {label:"Oral solution 40 mEq/15 mL",conc:2.67,unit:"mEq/mL",route:"PO"},
      {label:"Powder packet 20 mEq",conc:20,unit:"mEq",route:"PO"},
    ],
    typDose:"Hypokalemia: mild (K 3–3.5): 40 mEq PO/day; moderate (K 2.5–3): 40 mEq IV over 4h; severe: up to 40 mEq/hr IV (ICU monitored)", maxDose:"40 mEq/hr IV (central line, monitored); 200 mEq/day IV", renalCaution:true },

  { id:"magnesium_sulfate", generic:"Magnesium Sulfate", brands:["Epsom Salt IV","Mag-Sulfate"],
    category:"Electrolyte / Magnesium", color:"#98C379", rxcui:"6256",
    routes:["IV","IM","PO"],
    forms:[
      {label:"IV 500 mg/mL (2 mL) = 4 mEq/mL",conc:500,unit:"mg/mL",route:"IV/IM"},
      {label:"IV 500 mg/mL (10 mL)",conc:500,unit:"mg/mL",route:"IV/IM"},
      {label:"IV 500 mg/mL (20 mL)",conc:500,unit:"mg/mL",route:"IV/IM"},
      {label:"Premix 1 g/50 mL D5W (20 mg/mL)",conc:20,unit:"mg/mL",route:"IV"},
      {label:"Premix 2 g/50 mL D5W (40 mg/mL)",conc:40,unit:"mg/mL",route:"IV"},
      {label:"Premix 4 g/100 mL D5W (40 mg/mL)",conc:40,unit:"mg/mL",route:"IV"},
    ],
    typDose:"Eclampsia/Pre-eclampsia: 4–6 g IV load over 20min, then 1–2 g/hr; Torsades: 2 g IV over 2–15min; Hypomagnesemia: 1–2 g IV over 1h; Asthma: 2 g IV over 20min", maxDose:"30–40 g/day (obstetric); 8–12 g/day (other)", renalCaution:true },

  { id:"calcium_gluconate", generic:"Calcium Gluconate", brands:["Cal-G","Calcium Gluconate"],
    category:"Electrolyte / Calcium", color:"#98C379", rxcui:"1611",
    routes:["IV","PO"],
    forms:[
      {label:"IV 100 mg/mL (10 mL) = 0.46 mEq Ca/mL",conc:100,unit:"mg/mL",route:"IV"},
      {label:"IV 100 mg/mL (50 mL)",conc:100,unit:"mg/mL",route:"IV"},
      {label:"Tablet 500 mg (45 mg elemental Ca)",conc:500,unit:"mg",route:"PO"},
      {label:"Tablet 650 mg (58.5 mg elemental Ca)",conc:650,unit:"mg",route:"PO"},
    ],
    typDose:"Hypocalcemia (symptomatic): 1–2 g (10–20 mL 10% solution) IV over 10–20min; Cardiac (hyperkalemia/CCB OD): 1–3 g IV over 5–10min", maxDose:"3 g/dose IV", renalCaution:false },

  { id:"sodium_bicarbonate", generic:"Sodium Bicarbonate", brands:["NaHCO3","Neut"],
    category:"Electrolyte / Alkalinizer", color:"#98C379", rxcui:"9863",
    routes:["IV","PO"],
    forms:[
      {label:"IV 8.4% (1 mEq/mL) 50 mL = 50 mEq",conc:1,unit:"mEq/mL",route:"IV"},
      {label:"IV 8.4% (1 mEq/mL) 250 mL",conc:1,unit:"mEq/mL",route:"IV"},
      {label:"IV 4.2% (0.5 mEq/mL) 5 mL",conc:0.5,unit:"mEq/mL",route:"IV (neonatal)"},
      {label:"IV 4.2% (0.5 mEq/mL) 10 mL",conc:0.5,unit:"mEq/mL",route:"IV (neonatal)"},
      {label:"Tablet 325 mg (3.9 mEq)",conc:325,unit:"mg",route:"PO"},
      {label:"Tablet 650 mg (7.7 mEq)",conc:650,unit:"mg",route:"PO"},
    ],
    typDose:"Cardiac arrest: 1 mEq/kg IV bolus; Acidosis: calculated from BE deficit: HCO3 = 0.3 × BE × wt(kg); Aspirin/TCA OD: 1–2 mEq/kg IV", maxDose:"calculated by deficit", renalCaution:false },

  // ══════════════════════════════════════════════
  // CHEMOTHERAPY
  // ══════════════════════════════════════════════
  { id:"cisplatin", generic:"Cisplatin", brands:["Platinol","Cisplatin-AQ"],
    category:"Chemotherapy / Platinum", color:"#FF6B6B", rxcui:"2555",
    routes:["IV"],
    forms:[
      {label:"Vial 1 mg/mL (50 mL)",conc:1,unit:"mg/mL",route:"IV"},
      {label:"Vial 1 mg/mL (100 mL)",conc:1,unit:"mg/mL",route:"IV"},
      {label:"Vial 1 mg/mL (200 mL)",conc:1,unit:"mg/mL",route:"IV"},
    ],
    typDose:"50–100 mg/m² IV q3–4wk; 20 mg/m²/day ×5d q3–4wk; Aggressive hydration required", maxDose:"100 mg/m²/cycle", renalCaution:true },

  { id:"carboplatin", generic:"Carboplatin", brands:["Paraplatin"],
    category:"Chemotherapy / Platinum", color:"#FF6B6B", rxcui:"40048",
    routes:["IV"],
    forms:[
      {label:"Vial 10 mg/mL (5 mL)",conc:10,unit:"mg/mL",route:"IV"},
      {label:"Vial 10 mg/mL (15 mL)",conc:10,unit:"mg/mL",route:"IV"},
      {label:"Vial 10 mg/mL (45 mL)",conc:10,unit:"mg/mL",route:"IV"},
      {label:"Vial 10 mg/mL (60 mL)",conc:10,unit:"mg/mL",route:"IV"},
    ],
    typDose:"Calvert formula: Dose (mg) = AUC × (GFR + 25); typical AUC 5–7; q3–4wk", maxDose:"Calvert formula-based", renalCaution:true },

  { id:"paclitaxel", generic:"Paclitaxel", brands:["Taxol","Abraxane (nab-paclitaxel)"],
    category:"Chemotherapy / Taxane", color:"#FF6B6B", rxcui:"56946",
    routes:["IV"],
    forms:[
      {label:"Taxol 6 mg/mL (5 mL)",conc:6,unit:"mg/mL",route:"IV"},
      {label:"Taxol 6 mg/mL (16.7 mL)",conc:6,unit:"mg/mL",route:"IV"},
      {label:"Taxol 6 mg/mL (25 mL)",conc:6,unit:"mg/mL",route:"IV"},
      {label:"Taxol 6 mg/mL (50 mL)",conc:6,unit:"mg/mL",route:"IV"},
      {label:"Abraxane 100 mg/vial (reconstituted 5 mg/mL)",conc:5,unit:"mg/mL",route:"IV"},
    ],
    typDose:"Taxol: 135–175 mg/m² over 3h q3wk; 80 mg/m² weekly; Abraxane: 100–260 mg/m² q3wk or weekly protocols", maxDose:"175 mg/m²/cycle (Taxol)", renalCaution:false },

  { id:"doxorubicin", generic:"Doxorubicin", brands:["Adriamycin","Doxil (liposomal)"],
    category:"Chemotherapy / Anthracycline", color:"#FF6B6B", rxcui:"3639",
    routes:["IV"],
    forms:[
      {label:"Adriamycin 2 mg/mL (5 mL)",conc:2,unit:"mg/mL",route:"IV"},
      {label:"Adriamycin 2 mg/mL (10 mL)",conc:2,unit:"mg/mL",route:"IV"},
      {label:"Adriamycin 2 mg/mL (25 mL)",conc:2,unit:"mg/mL",route:"IV"},
      {label:"Adriamycin 2 mg/mL (100 mL)",conc:2,unit:"mg/mL",route:"IV"},
      {label:"Doxil (liposomal) 2 mg/mL (10 mL)",conc:2,unit:"mg/mL",route:"IV"},
      {label:"Doxil (liposomal) 2 mg/mL (25 mL)",conc:2,unit:"mg/mL",route:"IV"},
    ],
    typDose:"Single agent: 60–75 mg/m² q3wk; combination: 40–60 mg/m²; lifetime cumulative max 450–550 mg/m² (cardiotoxicity)", maxDose:"75 mg/m²/cycle; 550 mg/m² lifetime", renalCaution:false },

  { id:"cyclophosphamide", generic:"Cyclophosphamide", brands:["Cytoxan","Neosar"],
    category:"Chemotherapy / Alkylating", color:"#FF6B6B", rxcui:"3002",
    routes:["IV","PO"],
    forms:[
      {label:"Vial 200 mg",conc:200,unit:"mg",route:"IV"},
      {label:"Vial 500 mg",conc:500,unit:"mg",route:"IV"},
      {label:"Vial 1000 mg",conc:1000,unit:"mg",route:"IV"},
      {label:"Vial 2000 mg",conc:2000,unit:"mg",route:"IV"},
      {label:"Tablet 25 mg",conc:25,unit:"mg",route:"PO"},
      {label:"Tablet 50 mg",conc:50,unit:"mg",route:"PO"},
    ],
    typDose:"Lymphoma: 600–750 mg/m² IV q3–4wk; SLE/Vasculitis: 0.5–1 g/m² IV q1–3mo; Daily oral: 1–5 mg/kg/day", maxDose:"1500 mg/m²/cycle", renalCaution:true },

];


// Drug lookup helpers
const DRUG_CATS = [...new Set(DRUG_DB.map(d=>d.category.split(" / ")[0]))];

// ═══════════════════════════════════════════════════════════════════════════════
// DRUG PICKER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function DrugPicker({ T, accent, onSelect, onClose }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const cats = ["All", ...DRUG_CATS];
  const filtered = DRUG_DB.filter(d=>{
    const matchQ = !q || d.generic.toLowerCase().includes(q.toLowerCase()) ||
      d.brands.some(b=>b.toLowerCase().includes(q.toLowerCase()));
    const matchC = cat==="All" || d.category.startsWith(cat);
    return matchQ && matchC;
  });

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,width:"100%",maxWidth:620,maxHeight:"82vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,0.6)"}}>
        {/* Header */}
        <div style={{padding:"16px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div>
            <div style={{fontWeight:800,fontSize:16,letterSpacing:"-0.4px"}}>💊 Drug Reference</div>
            <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>{DRUG_DB.length} drugs · generic &amp; brand names · available doses</div>
            <div style={{display:"flex",gap:5,marginTop:5,flexWrap:"wrap"}}>
              {[{l:"🏛️ openFDA",c:"#00C9A7"},{l:"⚗️ RxNorm (NLM)",c:"#4F8EF7"},{l:"🔬 MedlinePlus",c:"#C678DD"},{l:"📊 HealthData.gov",c:"#E5C07B"}].map(s=>(
                <span key={s.l} style={{background:`${s.c}15`,color:s.c,border:`1px solid ${s.c}35`,borderRadius:10,padding:"1px 8px",fontSize:9,fontWeight:700}}>{s.l}</span>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 12px",color:T.text,cursor:"pointer",fontSize:12,fontFamily:"'Sora',sans-serif"}}>✕ Close</button>
        </div>

        {/* Search */}
        <div style={{padding:"12px 18px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
          <input
            value={q} onChange={e=>setQ(e.target.value)} autoFocus
            placeholder="Search generic or brand name..." 
            style={{background:T.inputBg,border:`1.5px solid ${T.border}`,borderRadius:10,color:T.text,padding:"9px 13px",fontSize:13,width:"100%",outline:"none",fontFamily:"'Sora',sans-serif"}}
          />
          {/* Category filter */}
          <div style={{display:"flex",gap:6,marginTop:9,flexWrap:"wrap"}}>
            {cats.map(c=>(
              <button key={c} onClick={()=>setCat(c)} style={{
                background:cat===c?`${accent}18`:T.card,
                border:`1px solid ${cat===c?accent+"60":T.border}`,
                borderRadius:20,padding:"3px 11px",fontSize:10,fontWeight:700,
                color:cat===c?accent:T.textMuted,cursor:"pointer",fontFamily:"'Sora',sans-serif",
              }}>{c}</button>
            ))}
          </div>
        </div>

        {/* Drug List */}
        <div style={{overflowY:"auto",flex:1,padding:"10px 14px",display:"flex",flexDirection:"column",gap:8}}>
          {filtered.length===0&&<div style={{color:T.textMuted,fontSize:13,textAlign:"center",paddingTop:24}}>No drugs found</div>}
          {filtered.map(drug=>(
            <div key={drug.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:13,padding:"12px 14px"}}>
              {/* Drug header */}
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:drug.color,flexShrink:0}}/>
                    <span style={{fontWeight:800,fontSize:14,color:T.text}}>{drug.generic}</span>
                    {drug.rxcui&&<span style={{background:"#4F8EF715",color:"#4F8EF7",border:"1px solid #4F8EF730",borderRadius:8,padding:"1px 6px",fontSize:9,fontWeight:700}}>RxCUI: {drug.rxcui}</span>}
                  </div>
                  <div style={{fontSize:11,color:T.textMuted,marginTop:3,marginLeft:15}}>
                    {drug.brands.map(b=>(
                      <span key={b} style={{background:`${drug.color}15`,color:drug.color,border:`1px solid ${drug.color}30`,borderRadius:12,padding:"1px 8px",fontSize:10,fontWeight:600,marginRight:4,display:"inline-block",marginBottom:2}}>{b}</span>
                    ))}
                  </div>
                </div>
                <span style={{fontSize:9,fontWeight:700,color:T.textMuted,background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,padding:"2px 8px",textAlign:"right",flexShrink:0}}>{drug.category.split(" / ").slice(-1)[0]}</span>
              </div>

              {/* Typical dose info */}
              <div style={{fontSize:11,color:T.textMuted,marginBottom:8,marginLeft:15,lineHeight:1.5}}>
                <span style={{fontWeight:600,color:T.text}}>Typical: </span>{drug.typDose}
                {drug.renalCaution&&<span style={{marginLeft:6,color:"#FF8080",fontWeight:600,fontSize:10}}>⚠️ Renal adjust</span>}
              </div>

              {/* Available forms */}
              <div style={{marginLeft:15}}>
                <div style={{fontSize:9,fontWeight:700,color:T.textFaint,textTransform:"uppercase",letterSpacing:"1px",marginBottom:5}}>Available Doses / Concentrations</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {drug.forms.map((f,i)=>(
                    <button key={i} onClick={()=>onSelect(drug, f)} style={{
                      background:`${accent}12`,border:`1px solid ${accent}35`,
                      borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:600,
                      color:accent,cursor:"pointer",fontFamily:"'Sora',sans-serif",
                      transition:"all .14s",
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.background=`${accent}25`}}
                    onMouseLeave={e=>{e.currentTarget.style.background=`${accent}12`}}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIT SELECTOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function UnitSel({ famId, value, onChange, T, accent }) {
  const fam = UF[famId];
  if (!fam || fam.units.length <= 1) return null;
  return (
    <select value={value} onChange={e=>onChange(e.target.value)} style={{
      background:T.card, border:`1.5px solid ${accent}55`, borderLeft:"none",
      borderRadius:"0 10px 10px 0", color:T.text, padding:"0 10px",
      fontSize:12, outline:"none", fontFamily:"'Sora',sans-serif",
      cursor:"pointer", minWidth:90, fontWeight:600, flexShrink:0, height:42,
    }}>
      {fam.units.map(u=><option key={u.id} value={u.id}>{u.label}</option>)}
    </select>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESULT EQUIVALENTS — shows every unit in the result family
// ═══════════════════════════════════════════════════════════════════════════════
function ResultEqs({ val, famId, T, accent }) {
  const fam = UF[famId];
  if (!fam || fam.units.length <= 1) return null;
  const eqs = fam.units
    .map(u => ({ label:u.label, val:u.fromBase(val) }))
    .filter(r => isFinite(r.val) && !isNaN(r.val) && r.val >= 0 && r.val < 1e15);
  if (eqs.length <= 1) return null;
  return (
    <div style={{marginTop:14}}>
      <div style={{fontSize:9,fontWeight:800,color:T.textMuted,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:8}}>
        All Equivalent Values
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {eqs.map(eq=>(
          <div key={eq.label} style={{
            background:T.card, border:`1px solid ${T.border}`,
            borderRadius:10, padding:"7px 12px",
            display:"flex", flexDirection:"column", alignItems:"center", gap:2,
            minWidth:74,
          }}>
            <span style={{fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:T.text}}>
              {eq.val===0?"0":eq.val<0.00001?eq.val.toExponential(3):+eq.val.toPrecision(5)}
            </span>
            <span style={{fontSize:10,color:T.textMuted,fontWeight:500}}>{eq.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function Dose360() {
  const [theme,setTheme]   = useState(()=>{
    try{ const s=localStorage.getItem("d360_theme"); return s||"dark"; }catch(e){return "dark";}
  });
  const [user,setUser]     = useState(null);
  const [screen,setScreen] = useState("role");

  const [activeCalc,setActiveCalc] = useState(null);
  const [showDrugPicker,setShowDrugPicker] = useState(false);
  const [selectedDrug,setSelectedDrug]     = useState(null);
  const [fVals,setFVals]           = useState({});   // field values (in base units)
  const [fUnits,setFUnits]         = useState({});   // selected display unit per field
  const [fRaw,setFRaw]             = useState({});   // raw typed value per field
  const [result,setResult]         = useState(null);
  const [history,setHistory]       = useState([]);
  const [tab,setTab]               = useState("calc");
  const [search,setSearch]         = useState("");
  const [settingsTab,setSettingsTab] = useState("profile");

  const [convFam,setConvFam]   = useState("mass");
  const [convFrom,setConvFrom] = useState("mg");
  const [convVal,setConvVal]   = useState("");
  const [convRes,setConvRes]   = useState(null);

  // ── Patient Quick-Profile ──
  const [profile,setProfile]   = useState({weight:"",age:"",sex:"male",crcl:""});
  const [showProfile,setShowProfile] = useState(false);

  // ── Favorites ──
  const [favorites,setFavorites] = useState([]);

  // ── Allergy flags ──
  const [allergies,setAllergies] = useState([]);

  // ── Quick converter modal ──
  const [showQuickConv,setShowQuickConv] = useState(false);
  const [qcFam,setQcFam]   = useState("mass");
  const [qcFrom,setQcFrom] = useState("mg");
  const [qcVal,setQcVal]   = useState("");
  const [qcRes,setQcRes]   = useState(null);

  // ── Drip titration ──
  const [showDrip,setShowDrip]   = useState(false);
  const [dripConc,setDripConc]   = useState("");
  const [dripWt,setDripWt]       = useState("");
  const [dripMin,setDripMin]     = useState("0.01");
  const [dripMax,setDripMax]     = useState("0.5");
  const [dripStep,setDripStep]   = useState("0.01");

  // ── Peds weight lookup ──
  const [showPedsWt,setShowPedsWt] = useState(false);
  const [pedsAge,setPedsAge]       = useState("");
  const [pedsAgeUnit,setPedsAgeUnit] = useState("months");

  // ── Copy feedback ──
  const [copied,setCopied] = useState(false);

  // ── Responsive layout ──
  const [sidebarOpen,setSidebarOpen] = useState(false);
  const [isMobile,setIsMobile]       = useState(false);
  const [isTablet,setIsTablet]       = useState(false);

  // ── Theme persistence via localStorage (best-effort) ──
  // Theme was already initialized; sync on change
  const saveTheme = (t) => {
    setTheme(t);
    try { localStorage.setItem("d360_theme", t); } catch(e){}
  };

  const T = THEMES[theme];
  const accent = user ? ROLES[user.role].color : "#4F8EF7";

  // ── field helpers ──
  const getUnit = (f) => fUnits[f.id] || f.def;

  const setFieldVal = (f, rawStr) => {
    const raw = parseFloat(rawStr);
    const unit = getUnit(f);
    const base = isNaN(raw) ? "" : toBase(raw, f.fam, unit);
    setFRaw(p=>({...p,[f.id]:rawStr}));
    setFVals(p=>({...p,[f.id]:isNaN(raw)?"":base}));
  };

  const setFieldUnit = (f, newUnit) => {
    setFUnits(p=>({...p,[f.id]:newUnit}));
    // re-convert existing raw value
    const raw = parseFloat(fRaw[f.id]);
    if(!isNaN(raw)){
      const base = toBase(raw, f.fam, newUnit);
      setFVals(p=>({...p,[f.id]:base}));
    }
  };

  const selectCalc = (c) => {
    setActiveCalc(c);
    // Reset fields first, then auto-apply profile
    const newRaw={}, newVals={};
    if(profile.weight||profile.age){
      c.fields.forEach(f=>{
        if((f.id==="weight"||f.id==="weightKg")&&profile.weight){
          newRaw[f.id]=profile.weight; newVals[f.id]=parseFloat(profile.weight);
        }
        if(f.id==="age"&&profile.age){ newRaw[f.id]=profile.age; newVals[f.id]=parseFloat(profile.age); }
        if(f.id==="sex"&&profile.sex){ newVals[f.id]=profile.sex; }
        if(f.id==="creatinine"&&profile.crcl){ /* crcl not creatinine */ }
      });
    }
    setFVals(newVals); setFUnits({}); setFRaw(newRaw);
    setResult(null); setSelectedDrug(null);
  };

  // ── drug picker handler ──
  const handleDrugSelect = (drug, form) => {
    setSelectedDrug({ drug, form });
    setShowDrugPicker(false);
    // Auto-fill concentration fields if the calc has a conc field
    if(activeCalc){
      const concField = activeCalc.fields.find(f=>f.id==="conc"||f.id==="have"||f.id==="strength");
      if(concField && form.conc){
        setFRaw(p=>({...p,[concField.id]:String(form.conc)}));
        setFVals(p=>({...p,[concField.id]:form.conc}));
      }
    }
  };

  // ── auth ──
  // ── role select ──
  const selectRole = (roleKey) => {
    setUser({ role: roleKey, name: ROLES[roleKey].label });
    setScreen("app");
    setActiveCalc(null); setResult(null); setFVals({}); setFUnits({}); setFRaw({});
  };

  const switchRole = () => {
    setUser(null); setScreen("role");
    setActiveCalc(null); setResult(null); setFVals({}); setFUnits({}); setFRaw({});
  };

  // ── calculate ──
  const handleCalculate = () => {
    if(!activeCalc) return;
    const res = activeCalc.run(fVals);
    if(res&&res.val!==null&&!isNaN(res.val)&&isFinite(res.val)){
      const r = {...res, val:+res.val.toPrecision(7)};
      setResult(r);
      setHistory(h=>[{id:Date.now(),calcName:activeCalc.name,calcIcon:activeCalc.icon,role:user.role,
        result:r,formula:activeCalc.formula,ref:activeCalc.ref,
        time:new Date().toLocaleTimeString(),date:new Date().toLocaleDateString()
      },...h.slice(0,29)]);
    } else {
      setResult({error:true});
    }
  };

  // ── converter ──
  const handleConvert = () => {
    const fam = UF[convFam]; if(!fam) return;
    const raw = parseFloat(convVal); if(isNaN(raw)) return;
    const fromU = fam.units.find(u=>u.id===convFrom); if(!fromU) return;
    const baseVal = fromU.toBase(raw);
    const results = fam.units.map(u=>({label:u.label,id:u.id,val:u.fromBase(baseVal)}));
    setConvRes(results);
  };

  // ── Responsive breakpoints ──
  useEffect(()=>{
    // Ensure viewport meta exists for mobile
    if(!document.querySelector('meta[name="viewport"]')){
      const m=document.createElement('meta');
      m.name='viewport'; m.content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
      document.head.appendChild(m);
    }
    const check = () => {
      const w = window.innerWidth;
      setIsMobile(w < 640);
      setIsTablet(w >= 640 && w < 1024);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  },[]);

  // ── toggle favorite ──
  const toggleFav = (id) => setFavorites(f=>f.includes(id)?f.filter(x=>x!==id):[...f,id]);

  // ── auto-fill from patient profile ──
  const applyProfile = (c) => {
    if(!c) return;
    const newRaw={}, newVals={};
    c.fields.forEach(f=>{
      if((f.id==="weight"||f.id==="weightKg")&&profile.weight){
        newRaw[f.id]=profile.weight; newVals[f.id]=parseFloat(profile.weight);
      }
      if(f.id==="age"&&profile.age){ newRaw[f.id]=profile.age; newVals[f.id]=parseFloat(profile.age); }
      if(f.id==="sex"&&profile.sex){ newVals[f.id]=profile.sex; }
    });
    setFRaw(p=>({...p,...newRaw})); setFVals(p=>({...p,...newVals}));
  };

  // ── copy result to clipboard ──
  const copyResult = () => {
    if(!result||result.error) return;
    const txt = `${activeCalc?.name}: ${result.val} ${result.unit}`;
    navigator.clipboard.writeText(txt).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  };

  // ── quick converter ──
  const handleQcConvert = () => {
    const fam=UF[qcFam]; if(!fam) return;
    const raw=parseFloat(qcVal); if(isNaN(raw)) return;
    const fromU=fam.units.find(u=>u.id===qcFrom); if(!fromU) return;
    const base=fromU.toBase(raw);
    setQcRes(fam.units.map(u=>({label:u.label,id:u.id,val:u.fromBase(base)})));
  };

  // ── drip titration table ──
  const buildDripTable = () => {
    const conc=parseFloat(dripConc), wt=parseFloat(dripWt)||70;
    const mn=parseFloat(dripMin)||0.01, mx=parseFloat(dripMax)||0.5, st=parseFloat(dripStep)||0.01;
    if(!conc||conc<=0) return [];
    const rows=[];
    for(let d=mn; d<=mx+0.0001; d=Math.round((d+st)*10000)/10000){
      const rate=(d*wt*60)/(conc*1000);
      rows.push({dose:+d.toPrecision(4),rate:+rate.toPrecision(4)});
    }
    return rows;
  };

  // ── peds weight lookup ──
  const getPedsWeight = () => {
    const age=parseFloat(pedsAge); if(isNaN(age)||age<0) return null;
    const ageMo = pedsAgeUnit==="years" ? age*12 : age;
    const keys=Object.keys(CDC_WEIGHT).map(Number).sort((a,b)=>a-b);
    let lo=keys[0],hi=keys[keys.length-1];
    for(let k of keys){ if(k<=ageMo) lo=k; if(k>=ageMo&&hi===keys[keys.length-1]) hi=k; }
    if(lo===hi) return CDC_WEIGHT[lo];
    const t=(ageMo-lo)/(hi-lo);
    return +(CDC_WEIGHT[lo]+(CDC_WEIGHT[hi]-CDC_WEIGHT[lo])*t).toPrecision(3);
  };

  // ── allergy alert for selected drug ──
  const drugAllergyWarn = (drug) => {
    if(!drug||allergies.length===0) return null;
    for(const [cls, ids] of Object.entries(ALLERGY_CLASSES)){
      if(allergies.includes(cls) && ids.includes(drug.id))
        return `⚠️ ALLERGY ALERT: ${drug.generic} belongs to the ${cls} class — patient has a documented ${cls} allergy!`;
    }
    return null;
  };

  // ── filter / group calcs ──
  const grouped = useMemo(()=>{
    if(!user) return {};
    const filtered = CALCS[user.role]
      .filter(c=>!search||c.name.toLowerCase().includes(search.toLowerCase())||c.cat.toLowerCase().includes(search.toLowerCase()));
    const result = {};
    // Pinned favorites at the top
    const favCalcs = filtered.filter(c=>favorites.includes(c.id));
    if(favCalcs.length>0) result["⭐ Favorites"]=favCalcs;
    // Regular grouped
    filtered.reduce((a,c)=>{ if(!a[c.cat])a[c.cat]=[]; a[c.cat].push(c); return a; }, result);
    return result;
  },[user,search,favorites]);

  // ═══════════════════ CSS ═══════════════════
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    html,body,#root{width:100%;min-height:100vh;overflow-x:hidden;}
    html{-webkit-text-size-adjust:100%;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px;}

    /* ── Animations ── */
    .fd{animation:fd .25s ease forwards;}
    @keyframes fd{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .rs{animation:rs .4s cubic-bezier(.4,0,.2,1) forwards;}
    @keyframes rs{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
    @keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
    @keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    .slide-in{animation:slideIn .22s ease forwards;}

    /* ── Interactive ── */
    .cc{transition:all .16s ease;cursor:pointer;}
    .cc:hover{transform:translateY(-1px);}
    .rip{transition:all .15s ease;cursor:pointer;}
    .rip:hover{filter:brightness(1.09);transform:translateY(-1px);}

    /* ── Inputs ── */
    .inp-r{
      background:${T.inputBg};border:1.5px solid ${T.border};border-radius:10px;
      color:${T.text};padding:0 14px;font-size:16px;width:100%;outline:none;
      font-family:'Sora',sans-serif;transition:border-color .16s;height:46px;
      -webkit-appearance:none;appearance:none;
    }
    .inp-r:focus{border-color:${accent};}
    .inp-r::placeholder{color:${T.textFaint};}
    .inp-unit{
      background:${T.inputBg};border:1.5px solid ${T.border};border-radius:10px 0 0 10px;
      color:${T.text};padding:0 14px;font-size:16px;flex:1;outline:none;
      font-family:'Sora',sans-serif;transition:border-color .16s;height:46px;
      -webkit-appearance:none;
    }
    .inp-unit:focus{border-color:${accent};}
    .inp-unit::placeholder{color:${T.textFaint};}
    .sel{
      background:${T.inputBg};border:1.5px solid ${T.border};border-radius:10px;
      color:${T.text};padding:0 14px;font-size:16px;width:100%;outline:none;
      font-family:'Sora',sans-serif;cursor:pointer;height:46px;
      -webkit-appearance:none;appearance:none;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
      background-repeat:no-repeat;background-position:right 14px center;padding-right:36px;
    }
    .btn{
      border:none;border-radius:12px;padding:14px 0;font-size:15px;font-weight:700;
      cursor:pointer;width:100%;font-family:'Sora',sans-serif;letter-spacing:.3px;
      transition:all .16s ease;-webkit-tap-highlight-color:transparent;
      min-height:48px;
    }
    .tb{
      background:none;border:none;color:${T.textMuted};font-size:11px;font-weight:600;
      padding:6px 10px;border-radius:8px;cursor:pointer;font-family:'Sora',sans-serif;
      transition:all .14s;white-space:nowrap;-webkit-tap-highlight-color:transparent;
      min-height:36px;
    }
    .tb.on{background:${T.card};color:${T.text};}
    .ib{
      background:${T.card};border:1px solid ${T.border};border-radius:9px;
      padding:7px 13px;color:${T.text};cursor:pointer;font-size:13px;
      font-family:'Sora',sans-serif;transition:all .15s;
      -webkit-tap-highlight-color:transparent;min-height:36px;
      display:inline-flex;align-items:center;gap:4px;white-space:nowrap;
    }
    .ib:hover{border-color:${accent}44;}
    .tag{display:inline-flex;align-items:center;padding:2px 10px;border-radius:20px;font-size:10px;font-weight:700;}

    /* ── Sidebar overlay (mobile/tablet) ── */
    .sidebar-overlay{
      position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:200;
      animation:fd .2s ease;
    }
    .sidebar-drawer{
      position:fixed;top:0;left:0;bottom:0;width:280px;max-width:85vw;
      background:${T.headerBg};border-right:1px solid ${T.border};
      z-index:201;display:flex;flex-direction:column;
      animation:slideIn .22s ease;overflow:hidden;
    }

    /* ── Bottom nav (mobile only) ── */
    .bottom-nav{
      position:fixed;bottom:0;left:0;right:0;
      background:${T.headerBg};border-top:1px solid ${T.border};
      display:flex;z-index:150;
      padding-bottom:env(safe-area-inset-bottom,0px);
    }
    .bnav-btn{
      flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
      gap:3px;padding:8px 4px;border:none;background:transparent;
      color:${T.textMuted};font-size:9px;font-weight:600;font-family:'Sora',sans-serif;
      cursor:pointer;transition:color .14s;-webkit-tap-highlight-color:transparent;
      min-height:56px;
    }
    .bnav-btn.active{color:${accent};}
    .bnav-btn span.icon{font-size:20px;line-height:1;}

    /* ── Responsive ── */
    @media(max-width:639px){
      .inp-r,.inp-unit,.sel{font-size:16px;}  /* prevent iOS zoom */
      .result-num{font-size:36px !important;}
      .calc-header-title{font-size:15px !important;}
      .hide-mobile{display:none !important;}
      .role-grid{grid-template-columns:1fr !important;}
    }
    @media(min-width:640px) and (max-width:1023px){
      .result-num{font-size:42px !important;}
    }
    @media(min-width:1024px){
      .hide-desktop{display:none !important;}
    }
    @media(hover:none){
      .cc:hover{transform:none;}
      .rip:hover{filter:none;transform:none;}
    }
  `;

  // ═══════════════════ ROLE SELECTION SCREEN ═══════════════════
  if(screen==="role"){
    return(
      <div style={{minHeight:"100vh",width:"100%",background:T.bg,color:T.text,fontFamily:"'Sora',sans-serif",display:"flex",flexDirection:"column"}}>
        <style>{css}</style>
        <style>{`html,body,#root{width:100%!important;max-width:100%!important;margin:0!important;padding:0!important;overflow-x:hidden!important;}`}</style>

        {/* Top bar */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:`1px solid ${T.border}`,background:T.headerBg}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,background:"linear-gradient(135deg,#4F8EF7,#00C9A7)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>⚕️</div>
            <div>
              <div style={{fontWeight:800,fontSize:16,letterSpacing:"-0.5px"}}>Dose 360</div>
              <div style={{fontSize:9,color:T.textMuted,marginTop:1}}>Clinical Dose Intelligence</div>
            </div>
          </div>
          <button className="ib" onClick={()=>saveTheme(theme==="dark"?"light":"dark")}>
            {theme==="dark"?"☀️":"🌙"}
          </button>
        </div>

        {/* Role cards */}
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px",gap:28}}>
          <div className="rs" style={{textAlign:"center"}}>
            <div style={{fontSize:10,fontWeight:700,color:T.textMuted,letterSpacing:"2.5px",textTransform:"uppercase",marginBottom:12}}>Who are you today?</div>
            <h1 style={{fontSize:34,fontWeight:800,letterSpacing:"-1px",lineHeight:1.1}}>Select Your <span style={{background:"linear-gradient(90deg,#4F8EF7,#00C9A7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Clinical Role</span></h1>
            <p style={{color:T.textMuted,fontSize:14,marginTop:10}}>You'll be taken directly to your specialised calculator suite</p>
          </div>

          <div className="rs" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18,width:"100%",maxWidth:900}}>
            {Object.entries(ROLES).map(([k,r],i)=>(
              <button key={k} onClick={()=>selectRole(k)} style={{
                background:T.surface, border:`1.5px solid ${T.border}`,
                borderRadius:22, padding:"36px 22px", cursor:"pointer",
                display:"flex", flexDirection:"column", alignItems:"center", gap:16,
                transition:"all .22s cubic-bezier(.4,0,.2,1)",
                boxShadow:T.shadow, position:"relative", overflow:"hidden",
              }}
              onMouseEnter={e=>{
                e.currentTarget.style.transform="translateY(-6px)";
                e.currentTarget.style.borderColor=r.color+"80";
                e.currentTarget.style.boxShadow=`0 16px 48px ${r.color}22`;
              }}
              onMouseLeave={e=>{
                e.currentTarget.style.transform="none";
                e.currentTarget.style.borderColor=T.border;
                e.currentTarget.style.boxShadow=T.shadow;
              }}>
                {/* accent bar top */}
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:r.grad,borderRadius:"22px 22px 0 0"}}/>

                {/* icon circle */}
                <div style={{width:72,height:72,background:`${r.color}15`,border:`2px solid ${r.color}40`,borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34}}>
                  {r.icon}
                </div>

                <div style={{textAlign:"center"}}>
                  <div style={{fontWeight:800,fontSize:18,color:T.text,letterSpacing:"-0.3px"}}>{r.label}</div>
                  <div style={{fontSize:11,color:r.color,fontWeight:700,marginTop:3,letterSpacing:"0.5px"}}>{r.badge}</div>
                  <div style={{fontSize:12,color:T.textMuted,marginTop:8,lineHeight:1.5}}>
                    {k==="nurse"&&"Bedside, IV, ICU & Endocrine"}
                    {k==="pharmacist"&&"PK, Oncology, TPN & Dialysis"}
                    {k==="physician"&&"Prescribing, Pediatrics & NICU"}
                  </div>
                </div>

                {/* calc count */}
                <div style={{background:`${r.color}12`,border:`1px solid ${r.color}30`,borderRadius:20,padding:"4px 14px",fontSize:11,color:r.color,fontWeight:700}}>
                  {CALCS[k].length} calculators →
                </div>
              </button>
            ))}
          </div>

          {/* bottom note */}
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 20px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,maxWidth:520}}>
            <span style={{fontSize:18}}>📖</span>
            <span style={{fontSize:12,color:T.textMuted,lineHeight:1.5}}>
              All formulas from <strong style={{color:T.text}}>Henke's Med-Math 8e</strong> · Verified via <strong style={{color:T.text}}>openFDA</strong> · <strong style={{color:T.text}}>RxNorm</strong> · <strong style={{color:T.text}}>MedlinePlus</strong>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════ ALLERGIES SCREEN ═══════════════════
  if(screen==="allergies"){
    const allergyList = ["Penicillin","Cephalosporin","Carbapenem","Sulfonamide","NSAID","Opioid","Fluoroquinolone","Latex","Contrast","Aspirin","Vancomycin"];
    return(
      <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Sora',sans-serif"}}>
        <style>{css}</style>
        <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 18px",borderBottom:`1px solid ${T.border}`,background:T.headerBg,position:"sticky",top:0,zIndex:100}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button className="ib" onClick={()=>setScreen("app")}>← Back</button>
            <span style={{fontWeight:700,fontSize:15}}>🚨 Allergy Flags</span>
          </div>
          {allergies.length>0&&<button onClick={()=>setAllergies([])} style={{background:"#FF4D4D14",border:"1px solid #FF4D4D44",borderRadius:9,padding:"4px 14px",color:"#FF6B6B",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit"}}>Clear All</button>}
        </header>
        <div style={{maxWidth:600,margin:"0 auto",padding:isMobile?"12px 14px":"20px 16px",display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:15,padding:"14px 16px"}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>Patient Allergy / Contraindication Flags</div>
            <div style={{fontSize:12,color:T.textMuted,lineHeight:1.6}}>Check all drug classes the patient is allergic or has a contraindication to. A red alert banner will appear whenever you select a drug from that class in any calculator.</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8}}>
            {allergyList.map(a=>{
              const active=allergies.includes(a);
              return(
                <button key={a} onClick={()=>setAllergies(p=>active?p.filter(x=>x!==a):[...p,a])}
                  style={{background:active?"#FF000018":T.card,border:`1.5px solid ${active?"#FF000060":T.border}`,borderRadius:12,padding:"13px 14px",cursor:"pointer",fontFamily:"'Sora',sans-serif",textAlign:"left",transition:"all .15s",display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${active?"#FF6B6B":T.border}`,background:active?"#FF6B6B":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {active&&<span style={{color:"#fff",fontSize:12,fontWeight:800}}>✓</span>}
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:active?"#FF6B6B":T.text}}>{a}</div>
                    <div style={{fontSize:10,color:T.textMuted,marginTop:1}}>
                      {a==="Penicillin"?"amoxicillin, pip-tazo...":a==="Cephalosporin"?"ceftriaxone, cefazolin...":a==="Carbapenem"?"meropenem, imipenem...":a==="Sulfonamide"?"TMP-SMX...":a==="NSAID"?"ibuprofen, ketorolac...":a==="Opioid"?"morphine, fentanyl...":a==="Fluoroquinolone"?"cipro, levofloxacin...":a==="Contrast"?"iodinated contrast...":a==="Aspirin"?"cross-reacts with NSAIDs":a==="Vancomycin"?"Red Man Syndrome risk":""}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {allergies.length>0&&(
            <div style={{background:"#FF000012",border:"1.5px solid #FF000040",borderRadius:12,padding:"12px 16px"}}>
              <div style={{fontWeight:700,fontSize:12,color:"#FF6B6B",marginBottom:6}}>🚨 Active Allergy Flags ({allergies.length})</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {allergies.map(a=>(
                  <span key={a} style={{background:"#FF000020",border:"1px solid #FF000050",color:"#FF8080",borderRadius:20,padding:"3px 11px",fontSize:11,fontWeight:700}}>{a}</span>
                ))}
              </div>
            </div>
          )}
          <button onClick={()=>setScreen("app")} style={{background:ROLES[user.role].grad,color:"#fff",border:"none",borderRadius:12,padding:"13px 0",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            ✓ Save &amp; Return to App
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════ SETTINGS ═══════════════════
  if(screen==="settings"){
    return(
      <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Sora',sans-serif"}}>
        <style>{css}</style>
        <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 18px",borderBottom:`1px solid ${T.border}`,background:T.headerBg,position:"sticky",top:0,zIndex:100}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><button className="ib" onClick={()=>setScreen("app")}>← Back</button><span style={{fontWeight:700,fontSize:15}}>Settings</span></div>
          <button className="ib" onClick={()=>saveTheme(theme==="dark"?"light":"dark")}>{theme==="dark"?"☀️":"🌙"}</button>
        </header>
        <div style={{maxWidth:680,margin:"0 auto",padding:isMobile?"12px 14px":"20px 14px",display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",gap:3,background:T.surface,border:`1px solid ${T.border}`,borderRadius:11,padding:3}}>
            {["profile","references","about"].map(t=><button key={t} className={`tb ${settingsTab===t?"on":""}`} style={{flex:1,textAlign:"center",textTransform:"capitalize",fontSize:11}} onClick={()=>setSettingsTab(t)}>{t}</button>)}
          </div>
          {settingsTab==="profile"&&(
            <div className="fd" style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:18,padding:"18px"}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                  <div style={{width:50,height:50,background:ROLES[user.role].grad,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{ROLES[user.role].icon}</div>
                  <div><div style={{fontWeight:700,fontSize:16}}>{user.name}</div><div style={{fontSize:12,color:ROLES[user.role].color,marginTop:2}}>{ROLES[user.role].badge} · {ROLES[user.role].label}</div></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[["Role",ROLES[user.role].label],["Credential",ROLES[user.role].badge],["Calculators",`${CALCS[user.role].length} available`]].map(([k,v])=>(
                    <div key={k} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px"}}>
                      <div style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:3}}>{k}</div>
                      <div style={{fontSize:12,fontWeight:600,color:T.text}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={switchRole} style={{background:"#FF4D4D14",border:"1px solid #FF4D4D44",borderRadius:11,padding:"11px 0",color:"#FF6B6B",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit"}}>Switch Role</button>
            </div>
          )}
          {settingsTab==="references"&&(
            <div className="fd" style={{display:"flex",flexDirection:"column",gap:11}}>
              <p style={{fontSize:13,color:T.textMuted,lineHeight:1.6}}>All calculations are sourced from these verified clinical references. Always confirm with current institutional protocols before administering any medication.</p>
              {REFS.map(ref=>(
                <div key={ref.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:15,padding:"15px 17px"}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:11}}>
                    <div style={{width:40,height:40,background:`${ref.color}18`,border:`1.5px solid ${ref.color}44`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{ref.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:5}}>
                        <span style={{fontWeight:700,fontSize:14}}>{ref.name}</span>
                        <span style={{background:`${ref.color}18`,color:ref.color,border:`1px solid ${ref.color}44`,borderRadius:20,padding:"2px 9px",fontSize:10,fontWeight:700}}>{ref.short}</span>
                      </div>
                      <div style={{fontSize:12,color:T.textMuted,marginTop:4,lineHeight:1.5}}>{ref.desc}</div>
                      {ref.url&&<a href={ref.url} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:6,fontSize:12,color:ref.color,fontWeight:600,textDecoration:"none"}}>Visit {ref.name} ↗</a>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {settingsTab==="about"&&(
            <div className="fd" style={{display:"flex",flexDirection:"column",gap:11}}>
              <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:15,padding:"20px",textAlign:"center"}}>
                <div style={{width:56,height:56,background:"linear-gradient(135deg,#4F8EF7,#00C9A7)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 11px"}}>⚕️</div>
                <div style={{fontWeight:800,fontSize:21}}>Dose 360</div>
                <div style={{fontSize:12,color:T.textMuted,marginTop:3}}>Clinical Dose Intelligence · v3.0</div>
                <p style={{marginTop:11,fontSize:13,color:T.textMuted,lineHeight:1.7}}>Built on Henke's Med-Math formulas. Full unit conversion on every field and result. EHR-integration ready.</p>
              </div>
              <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 16px"}}>
                <div style={{fontWeight:600,fontSize:13,marginBottom:10}}>EHR Integration</div>
                {[["HL7 FHIR R4","API Ready","#00C9A7"],["Epic Systems","Connector Available","#4F8EF7"],["Cerner PowerChart","Connector Available","#4F8EF7"],["Meditech Expanse","In Development","#F59E0B"]].map(([k,v,c])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
                    <span style={{fontSize:12}}>{k}</span>
                    <span style={{fontSize:10,fontWeight:600,color:c,background:`${c}18`,padding:"2px 9px",borderRadius:20}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════ MAIN APP ═══════════════════
  return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Sora',sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{css}</style>


      {/* ── QUICK UNIT CONVERTER MODAL ── */}
      {showQuickConv&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1000,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?0:16}}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:isMobile?"20px 20px 0 0":"20px",width:"100%",maxWidth:480,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,0.6)"}}>
            <div style={{padding:"15px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
              <div><div style={{fontWeight:800,fontSize:16}}>🔄 Quick Unit Converter</div><div style={{fontSize:11,color:T.textMuted,marginTop:2}}>Convert any clinical unit instantly</div></div>
              <button onClick={()=>{setShowQuickConv(false);setQcRes(null);}} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 12px",color:T.text,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>✕</button>
            </div>
            <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:12,overflowY:"auto"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <label style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:5}}>Unit Family</label>
                  <select className="sel" value={qcFam} onChange={e=>{setQcFam(e.target.value);setQcFrom(UF[e.target.value]?.units[0]?.id||"");setQcRes(null);}}>
                    {CONV_GROUPS.map(g=><option key={g.fam} value={g.fam}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:5}}>Convert From</label>
                  <select className="sel" value={qcFrom} onChange={e=>{setQcFrom(e.target.value);setQcRes(null);}}>
                    {(UF[qcFam]?.units||[]).map(u=><option key={u.id} value={u.id}>{u.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:5}}>Value to Convert</label>
                <div style={{display:"flex",gap:8}}>
                  <input className="inp-r" type="number" placeholder={`Enter value in ${qcFrom}...`} value={qcVal}
                    onChange={e=>{setQcVal(e.target.value);}} onKeyDown={e=>e.key==="Enter"&&handleQcConvert()}
                    style={{flex:1}} autoFocus/>
                  <button className="btn" onClick={handleQcConvert} style={{background:ROLES[user.role].grad,color:"#fff",padding:"0 18px",flexShrink:0}}>Convert</button>
                </div>
              </div>
              {qcRes&&(
                <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:280,overflowY:"auto"}}>
                  {qcRes.map(r=>(
                    <div key={r.id} onClick={()=>{navigator.clipboard?.writeText(`${+r.val.toPrecision(6)} ${r.label}`).catch(()=>{});}}
                      style={{background:r.id===qcFrom?`${accent}15`:T.card,border:`1px solid ${r.id===qcFrom?accent+"60":T.border}`,borderRadius:9,padding:"9px 13px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",transition:"opacity .1s"}}
                      title="Click to copy">
                      <span style={{fontSize:11,color:r.id===qcFrom?accent:T.textMuted,fontWeight:r.id===qcFrom?700:500}}>{r.label}</span>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:13,fontFamily:"'JetBrains Mono',monospace",color:r.id===qcFrom?accent:T.text,fontWeight:700}}>
                          {r.val<0.0001&&r.val>0?r.val.toExponential(3):+r.val.toPrecision(6)}
                        </span>
                        <span style={{fontSize:9,color:T.textFaint}}>📋</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PATIENT QUICK-PROFILE MODAL ── */}
      {showProfile&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1000,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?0:16}}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:isMobile?"20px 20px 0 0":"20px",width:"100%",maxWidth:460,boxShadow:"0 24px 80px rgba(0,0,0,0.6)",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{padding:"15px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontWeight:800,fontSize:16}}>👤 Patient Quick-Profile</div><div style={{fontSize:11,color:T.textMuted,marginTop:2}}>Set once — auto-fills weight, age &amp; sex on every calculator</div></div>
              <button onClick={()=>setShowProfile(false)} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 12px",color:T.text,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>✕</button>
            </div>
            <div style={{padding:"18px",display:"flex",flexDirection:"column",gap:13}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <label style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:5}}>Weight (kg)</label>
                  <input className="inp-r" type="number" placeholder="e.g. 70" value={profile.weight}
                    onChange={e=>setProfile(p=>({...p,weight:e.target.value}))}/>
                </div>
                <div>
                  <label style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:5}}>Age (years)</label>
                  <input className="inp-r" type="number" placeholder="e.g. 55" value={profile.age}
                    onChange={e=>setProfile(p=>({...p,age:e.target.value}))}/>
                </div>
                <div>
                  <label style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:5}}>Biological Sex</label>
                  <select className="sel" value={profile.sex} onChange={e=>setProfile(p=>({...p,sex:e.target.value}))}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:5}}>CrCl (mL/min)</label>
                  <input className="inp-r" type="number" placeholder="e.g. 85" value={profile.crcl}
                    onChange={e=>setProfile(p=>({...p,crcl:e.target.value}))}/>
                </div>
              </div>
              {profile.weight&&profile.crcl&&(
                <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 13px",fontSize:11,color:T.textMuted}}>
                  💡 <strong style={{color:T.text}}>Renal status: </strong>
                  {parseFloat(profile.crcl)>=60?"Normal function":parseFloat(profile.crcl)>=30?<span style={{color:"#E5C07B"}}>Moderate impairment — review renally-cleared drugs</span>:<span style={{color:"#FF8080"}}>Severe impairment — dose adjustments required</span>}
                </div>
              )}
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setProfile({weight:"",age:"",sex:"male",crcl:""});}} style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:11,padding:"11px 0",color:T.textMuted,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit"}}>Clear</button>
                <button onClick={()=>{setShowProfile(false);if(activeCalc)applyProfile(activeCalc);}} style={{flex:2,background:ROLES[user.role].grad,color:"#fff",border:"none",borderRadius:11,padding:"11px 0",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  ✓ Save &amp; Apply to Current Calc
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DRIP TITRATION TABLE MODAL ── */}
      {showDrip&&(()=>{
        const rows=buildDripTable();
        return(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:1000,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?0:16}}>
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:isMobile?"20px 20px 0 0":"20px",width:"100%",maxWidth:580,maxHeight:"92vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,0.6)"}}>
              <div style={{padding:"15px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
                <div><div style={{fontWeight:800,fontSize:16}}>📊 Drip Titration Table</div><div style={{fontSize:11,color:T.textMuted,marginTop:2}}>Vasopressor / insulin infusion rate reference</div></div>
                <button onClick={()=>setShowDrip(false)} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 12px",color:T.text,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>✕</button>
              </div>
              <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1fr 1fr 1fr 1fr 1fr",gap:8}}>
                  {[
                    ["Drug Conc (mg/mL)","concentration",dripConc,setDripConc,"e.g. 0.016"],
                    ["Pt Weight (kg)","weight",dripWt,setDripWt,"e.g. 70"],
                    ["Min dose","dose-min",dripMin,setDripMin,"e.g. 0.01"],
                    ["Max dose","dose-max",dripMax,setDripMax,"e.g. 0.5"],
                    ["Step size","step",dripStep,setDripStep,"e.g. 0.01"],
                  ].map(([lbl,,val,setter,ph])=>(
                    <div key={lbl}>
                      <label style={{fontSize:8,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.7px",display:"block",marginBottom:4}}>{lbl}</label>
                      <input className="inp-r" type="number" placeholder={ph} value={val} onChange={e=>setter(e.target.value)} style={{fontSize:11,padding:"6px 9px"}}/>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:10,color:T.textMuted,marginTop:7}}>
                  💡 Dose units = <strong>mcg/kg/min</strong> (standard vasopressor). Rate = mL/hr. For norepinephrine standard bag enter conc: 0.016 (4mg/250mL)
                </div>
              </div>
              <div style={{overflowY:"auto",flex:1}}>
                {rows.length===0?(
                  <div style={{padding:30,textAlign:"center",color:T.textMuted,fontSize:13}}>Enter drug concentration and patient weight to generate table</div>
                ):(
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead>
                      <tr style={{background:T.card,position:"sticky",top:0}}>
                        <th style={{padding:"10px 16px",textAlign:"left",fontWeight:700,fontSize:10,color:T.textMuted,letterSpacing:"1px",textTransform:"uppercase",borderBottom:`1px solid ${T.border}`}}>Dose (mcg/kg/min)</th>
                        <th style={{padding:"10px 16px",textAlign:"right",fontWeight:700,fontSize:10,color:T.textMuted,letterSpacing:"1px",textTransform:"uppercase",borderBottom:`1px solid ${T.border}`}}>Rate (mL/hr)</th>
                        <th style={{padding:"10px 16px",textAlign:"right",fontWeight:700,fontSize:10,color:T.textMuted,letterSpacing:"1px",textTransform:"uppercase",borderBottom:`1px solid ${T.border}`}}>mcg/min</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r,i)=>{
                        const wt=parseFloat(dripWt)||70;
                        const mcgMin=+(r.dose*wt).toPrecision(4);
                        const highlight=i%5===0;
                        return(
                          <tr key={i} style={{background:highlight?`${accent}08`:T.bg,borderBottom:`1px solid ${T.border}33`}}>
                            <td style={{padding:"8px 16px",fontFamily:"'JetBrains Mono',monospace",fontWeight:highlight?700:400,color:highlight?accent:T.text}}>{r.dose}</td>
                            <td style={{padding:"8px 16px",fontFamily:"'JetBrains Mono',monospace",textAlign:"right",fontWeight:highlight?700:400,color:highlight?accent:T.text}}>{r.rate}</td>
                            <td style={{padding:"8px 16px",fontFamily:"'JetBrains Mono',monospace",textAlign:"right",color:T.textMuted,fontSize:11}}>{mcgMin}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              {rows.length>0&&(
                <div style={{padding:"10px 18px",borderTop:`1px solid ${T.border}`,flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:11,color:T.textMuted}}>{rows.length} rows · highlighted every 5 steps</span>
                  <button onClick={()=>{
                    const header="Dose (mcg/kg/min)\tRate (mL/hr)\n";
                    const wt=parseFloat(dripWt)||70;
                    const body=rows.map(r=>`${r.dose}\t${r.rate}`).join("\n");
                    navigator.clipboard?.writeText(header+body).catch(()=>{});
                  }} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 14px",color:T.text,cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600}}>📋 Copy Table</button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── PEDIATRIC WEIGHT LOOKUP MODAL ── */}
      {showPedsWt&&(()=>{
        const wt=getPedsWeight();
        const ageMo=pedsAgeUnit==="years"?parseFloat(pedsAge)*12:parseFloat(pedsAge);
        return(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1000,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?0:16}}>
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:isMobile?"20px 20px 0 0":"20px",width:"100%",maxWidth:440,boxShadow:"0 24px 80px rgba(0,0,0,0.6)",maxHeight:"90vh",overflowY:"auto"}}>
              <div style={{padding:"15px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontWeight:800,fontSize:16}}>🧒 Pediatric Weight Lookup</div><div style={{fontSize:11,color:T.textMuted,marginTop:2}}>CDC 50th percentile weight-for-age · 0–18 yrs</div></div>
                <button onClick={()=>{setShowPedsWt(false);setPedsAge("");}} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 12px",color:T.text,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>✕</button>
              </div>
              <div style={{padding:"18px",display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <label style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:5}}>Child's Age</label>
                  <div style={{display:"flex",gap:8}}>
                    <input className="inp-r" type="number" placeholder="Enter age..." value={pedsAge}
                      onChange={e=>setPedsAge(e.target.value)} style={{flex:1}} autoFocus/>
                    <select className="sel" value={pedsAgeUnit} onChange={e=>setPedsAgeUnit(e.target.value)} style={{flexShrink:0,width:100}}>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                </div>
                {wt&&!isNaN(wt)&&(
                  <>
                    <div style={{background:`${accent}10`,border:`1.5px solid ${accent}40`,borderRadius:14,padding:"18px",textAlign:"center"}}>
                      <div style={{fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>Estimated Weight (50th percentile)</div>
                      <div style={{fontSize:48,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:accent,letterSpacing:"-1.5px",lineHeight:1}}>
                        {wt}<span style={{fontSize:16,fontWeight:500,color:`${accent}99`,marginLeft:8,fontFamily:"'Sora',sans-serif"}}>kg</span>
                      </div>
                      <div style={{fontSize:12,color:T.textMuted,marginTop:6}}>{(wt*2.205).toFixed(1)} lbs · {ageMo>=12?`${(ageMo/12).toFixed(1)} years`:`${ageMo.toFixed(0)} months`}</div>
                    </div>
                    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 13px",display:"flex",flexDirection:"column",gap:6}}>
                      <div style={{fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px"}}>Quick Dose References</div>
                      {[
                        ["Paracetamol / Acetaminophen","15 mg/kg",+(wt*15).toPrecision(3)],
                        ["Ibuprofen","10 mg/kg",+(wt*10).toPrecision(3)],
                        ["Amoxicillin","25 mg/kg",+(wt*25).toPrecision(3)],
                        ["Fluid bolus (NS/LR)","20 mL/kg",+(wt*20).toPrecision(3)],
                      ].map(([drug,rate,dose])=>(
                        <div key={drug} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${T.border}33`}}>
                          <div>
                            <div style={{fontSize:11,fontWeight:600,color:T.text}}>{drug}</div>
                            <div style={{fontSize:9,color:T.textMuted}}>{rate}</div>
                          </div>
                          <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:accent,fontSize:13}}>{dose} mg{drug.includes("Fluid")?" mL":""}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={()=>{
                      setProfile(p=>({...p,weight:String(wt)}));
                      setShowPedsWt(false); setPedsAge("");
                    }} style={{background:ROLES[user.role].grad,color:"#fff",border:"none",borderRadius:11,padding:"12px 0",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                      ↗ Use {wt} kg in Patient Profile
                    </button>
                  </>
                )}
                {pedsAge&&!wt&&(
                  <div style={{color:"#FF8080",fontSize:12,textAlign:"center",padding:"10px 0"}}>Age out of range (0–18 years only)</div>
                )}
                <div style={{fontSize:10,color:T.textFaint,textAlign:"center",lineHeight:1.5}}>
                  ⚠️ CDC 50th percentile reference. Always use actual measured weight for drug dosing.
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── DRUG PICKER MODAL ── */}
      {showDrugPicker&&(
        <DrugPicker
          T={T} accent={accent}
          onSelect={handleDrugSelect}
          onClose={()=>setShowDrugPicker(false)}
        />
      )}

      {/* ── APP HEADER ── */}
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderBottom:`1px solid ${T.border}`,background:T.headerBg,position:"sticky",top:0,zIndex:100,boxShadow:T.shadow,minHeight:54}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {/* Hamburger — shown on mobile & tablet */}
          {(isMobile||isTablet)&&(
            <button className="ib" onClick={()=>setSidebarOpen(true)} style={{padding:"6px 10px",fontSize:18,lineHeight:1}}>☰</button>
          )}
          <div style={{width:29,height:29,background:"linear-gradient(135deg,#4F8EF7,#00C9A7)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⚕️</div>
          <div style={{fontWeight:800,fontSize:14,letterSpacing:"-0.4px"}}>Dose 360</div>
          {!isMobile&&(
            <span style={{background:`${accent}18`,color:accent,border:`1px solid ${accent}40`,padding:"2px 9px",borderRadius:20,fontSize:10,fontWeight:700,marginLeft:2}}>
              {ROLES[user.role].icon} {user.name.split(" ")[0]} · {ROLES[user.role].badge}
            </span>
          )}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          {/* On mobile: only show the most critical icons */}
          {isMobile?(
            <>
              <button className="ib" title="Patient Profile" onClick={()=>setShowProfile(true)} style={{padding:"6px 10px",borderColor:Object.values(profile).some(v=>v)?`${accent}80`:""}}>
                {Object.values(profile).some(v=>v)?"👤✓":"👤"}
              </button>
              {allergies.length>0&&(
                <button className="ib" onClick={()=>setScreen("allergies")} style={{padding:"6px 10px",borderColor:"#FF8080",color:"#FF6B6B"}}>🚨{allergies.length}</button>
              )}
              <button className="ib" onClick={()=>saveTheme(theme==="dark"?"light":"dark")} style={{padding:"6px 10px"}}>{theme==="dark"?"☀️":"🌙"}</button>
              <button className="ib" onClick={()=>setScreen("settings")} style={{padding:"6px 10px"}}>⚙️</button>
            </>
          ):(
            <>
              <button className="ib" title="Quick Unit Converter" onClick={()=>setShowQuickConv(true)}>🔄</button>
              <button className="ib" title="Patient Profile" onClick={()=>setShowProfile(true)} style={{borderColor:Object.values(profile).some(v=>v)?`${accent}80`:""}}>
                {Object.values(profile).some(v=>v)?"👤✓":"👤"}
              </button>
              <button className="ib" title="Allergy Flags" onClick={()=>setScreen("allergies")} style={{borderColor:allergies.length>0?"#FF8080":""}}>
                {allergies.length>0?`🚨${allergies.length}`:"🚨"}
              </button>
              <button className="ib" title="Pediatric Weight" onClick={()=>setShowPedsWt(true)}>🧒</button>
              <button className="ib" onClick={()=>saveTheme(theme==="dark"?"light":"dark")}>{theme==="dark"?"☀️":"🌙"}</button>
              <button className="ib" onClick={()=>setScreen("settings")}>⚙️</button>
            </>
          )}
        </div>
      </header>

      {/* ── SIDEBAR DRAWER (mobile/tablet overlay) ── */}
      {(isMobile||isTablet)&&sidebarOpen&&(
        <>
          <div className="sidebar-overlay" onClick={()=>setSidebarOpen(false)}/>
          <div className="sidebar-drawer">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
              <div>
                <div style={{fontWeight:800,fontSize:14}}>Calculators</div>
                <div style={{fontSize:10,color:T.textMuted,marginTop:1}}>{ROLES[user.role].icon} {user.name} · {ROLES[user.role].badge}</div>
              </div>
              <button className="ib" onClick={()=>setSidebarOpen(false)} style={{padding:"5px 11px"}}>✕</button>
            </div>
            {/* Tab switcher in drawer */}
            <div style={{display:"flex",gap:2,padding:"8px 10px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
              {[["calc","🧮 Calcs"],["convert","🔄 Units"],["history","🕐 Log"]].map(([t,lbl])=>(
                <button key={t} className={`tb ${tab===t?"on":""}`} style={{flex:1,textAlign:"center",fontSize:10}} onClick={()=>setTab(t)}>{lbl}</button>
              ))}
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"10px 10px",display:"flex",flexDirection:"column",gap:8}}>
              {tab==="calc"&&<input className="inp-r" style={{fontSize:14,height:40}} placeholder="🔍 Search..." value={search} onChange={e=>setSearch(e.target.value)}/>}
              {tab==="calc"&&Object.entries(grouped).map(([cat,calcs])=>(
                <div key={cat}>
                  <div style={{fontSize:9,fontWeight:800,color:T.textFaint,letterSpacing:"1.8px",textTransform:"uppercase",marginBottom:4,paddingLeft:2}}>{cat}</div>
                  {calcs.map(c=>(
                    <div key={c.id} style={{background:activeCalc?.id===c.id?`${accent}10`:T.card,border:`1px solid ${activeCalc?.id===c.id?accent+"50":T.border}`,borderRadius:10,padding:"11px 12px",marginBottom:3,display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}
                      onClick={()=>{selectCalc(c);setSidebarOpen(false);}}>
                      <span style={{fontSize:20}}>{c.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:600,fontSize:13,color:activeCalc?.id===c.id?accent:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div>
                      </div>
                      <button onClick={e=>{e.stopPropagation();toggleFav(c.id);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,opacity:favorites.includes(c.id)?1:0.3,flexShrink:0,padding:"0 4px",minHeight:36}}>
                        {favorites.includes(c.id)?"⭐":"☆"}
                      </button>
                    </div>
                  ))}
                </div>
              ))}
              {tab==="convert"&&(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <div>
                    <label style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:5}}>Unit Family</label>
                    <select className="sel" value={convFam} onChange={e=>{setConvFam(e.target.value);setConvFrom(UF[e.target.value]?.units[0]?.id||"");setConvRes(null);}}>
                      {CONV_GROUPS.map(g=><option key={g.fam} value={g.fam}>{g.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:5}}>From Unit</label>
                    <select className="sel" value={convFrom} onChange={e=>setConvFrom(e.target.value)}>
                      {(UF[convFam]?.units||[]).map(u=><option key={u.id} value={u.id}>{u.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:5}}>Value</label>
                    <input className="inp-r" type="number" placeholder={`Enter in ${convFrom}`} value={convVal} onChange={e=>setConvVal(e.target.value)}/>
                  </div>
                  <button className="btn rip" onClick={handleConvert} style={{background:ROLES[user.role].grad,color:"#fff",fontSize:13,padding:"10px 0"}}>Convert All →</button>
                  {convRes&&(
                    <div style={{display:"flex",flexDirection:"column",gap:5}}>
                      {convRes.map(r=>(
                        <div key={r.id} style={{background:r.id===convFrom?`${accent}12`:T.card,border:`1px solid ${r.id===convFrom?accent+"50":T.border}`,borderRadius:9,padding:"9px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <span style={{fontSize:11,color:r.id===convFrom?accent:T.textMuted,fontWeight:r.id===convFrom?700:400}}>{r.label}</span>
                          <span style={{fontSize:13,fontFamily:"'JetBrains Mono',monospace",color:r.id===convFrom?accent:T.text,fontWeight:700}}>
                            {r.val<0.0001&&r.val>0?r.val.toExponential(3):+r.val.toPrecision(6)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {tab==="history"&&(
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {history.length===0&&<div style={{color:T.textMuted,fontSize:12,textAlign:"center",paddingTop:20}}>No calculations yet</div>}
                  {history.map(h=>(
                    <div key={h.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 12px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                        <span style={{fontSize:11,fontWeight:700,color:ROLES[h.role].color}}>{h.calcIcon} {h.calcName}</span>
                        <span style={{fontSize:9,color:T.textFaint}}>{h.time}</span>
                      </div>
                      <div style={{fontSize:14,fontFamily:"'JetBrains Mono',monospace",color:T.text,fontWeight:700}}>
                        {h.result.val} <span style={{fontSize:10,color:T.textMuted,fontFamily:"'Sora',sans-serif",fontWeight:400}}>{h.result.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div style={{flex:1,display:"flex",maxWidth:1200,margin:"0 auto",width:"100%",padding:isMobile?"0":"0 11px",gap:14,paddingBottom:isMobile?"72px":"0"}}>

        {/* ── SIDEBAR (desktop only) ── */}
        {!isMobile&&!isTablet&&(
        <div style={{width:250,flexShrink:0,display:"flex",flexDirection:"column",gap:8,padding:"12px 0"}}>
          <div style={{display:"flex",gap:2,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:3}}>
            {[["calc","💊"],["convert","🔄"],["history",`🕐`]].map(([t,ic])=>(
              <button key={t} className={`tb ${tab===t?"on":""}`} style={{flex:1,textAlign:"center"}} onClick={()=>setTab(t)}>
                {ic} {t==="calc"?"Calc":t==="convert"?"Units":`Log(${history.length})`}
              </button>
            ))}
          </div>

          {tab==="calc"&&(
            <>
              <input className="inp-r" style={{fontSize:12,padding:"8px 11px",height:36}} placeholder="🔍 Search calculators..." value={search} onChange={e=>setSearch(e.target.value)}/>
              <div style={{overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:13}}>
                {Object.entries(grouped).map(([cat,calcs])=>(
                  <div key={cat}>
                    <div style={{fontSize:9,fontWeight:800,color:T.textFaint,letterSpacing:"1.8px",textTransform:"uppercase",marginBottom:5,paddingLeft:2}}>{cat}</div>
                    {calcs.map(c=>(
                      <div key={c.id} style={{background:activeCalc?.id===c.id?`${accent}10`:T.card,border:`1px solid ${activeCalc?.id===c.id?accent+"50":T.border}`,borderRadius:10,padding:"9px 11px",marginBottom:4,display:"flex",alignItems:"center",gap:8}}>
                        <span className="cc" style={{fontSize:18,flex:"0 0 auto",cursor:"pointer"}} onClick={()=>selectCalc(c)}>{c.icon}</span>
                        <div className="cc" style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>selectCalc(c)}>
                          <div style={{fontWeight:600,fontSize:12,color:activeCalc?.id===c.id?accent:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div>
                        </div>
                        <button onClick={e=>{e.stopPropagation();toggleFav(c.id);}} title="Pin to Favorites"
                          style={{background:"none",border:"none",cursor:"pointer",fontSize:13,opacity:favorites.includes(c.id)?1:0.3,flexShrink:0,padding:"0 2px"}}>
                          {favorites.includes(c.id)?"⭐":"☆"}
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}

          {tab==="convert"&&(
            <div className="fd" style={{display:"flex",flexDirection:"column",gap:10,overflowY:"auto"}}>
              <div style={{fontSize:12,fontWeight:700,color:T.textMuted}}>Unit Converter</div>
              <div>
                <label style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:5}}>Unit Family</label>
                <select className="sel" value={convFam} onChange={e=>{setConvFam(e.target.value);setConvFrom(UF[e.target.value]?.units[0]?.id||"");setConvRes(null);}}>
                  {CONV_GROUPS.map(g=><option key={g.fam} value={g.fam}>{g.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:5}}>From Unit</label>
                <select className="sel" value={convFrom} onChange={e=>setConvFrom(e.target.value)}>
                  {(UF[convFam]?.units||[]).map(u=><option key={u.id} value={u.id}>{u.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px",display:"block",marginBottom:5}}>Value</label>
                <input className="inp-r" type="number" placeholder={`Enter in ${convFrom}`} value={convVal} onChange={e=>setConvVal(e.target.value)}/>
              </div>
              <button className="btn rip" onClick={handleConvert} style={{background:ROLES[user.role].grad,color:"#fff",fontSize:12,padding:"9px 0"}}>Convert All →</button>
              {convRes&&(
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {convRes.map(r=>(
                    <div key={r.id} style={{background:r.id===convFrom?`${accent}12`:T.card,border:`1px solid ${r.id===convFrom?accent+"50":T.border}`,borderRadius:9,padding:"7px 11px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:10,color:r.id===convFrom?accent:T.textMuted,fontWeight:r.id===convFrom?700:400}}>{r.label}</span>
                      <span style={{fontSize:12,fontFamily:"'JetBrains Mono',monospace",color:r.id===convFrom?accent:T.text,fontWeight:700}}>
                        {r.val<0.0001&&r.val>0?r.val.toExponential(3):+r.val.toPrecision(6)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab==="history"&&(
            <div style={{overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
              {history.length===0&&<div style={{color:T.textMuted,fontSize:12,textAlign:"center",paddingTop:20}}>No calculations yet</div>}
              {history.map(h=>(
                <div key={h.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:9,padding:"9px 11px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                    <span style={{fontSize:10,fontWeight:700,color:ROLES[h.role].color}}>{h.calcIcon} {h.calcName}</span>
                    <span style={{fontSize:9,color:T.textFaint}}>{h.time}</span>
                  </div>
                  <div style={{fontSize:13,fontFamily:"'JetBrains Mono',monospace",color:T.text,fontWeight:700}}>
                    {h.result.val} <span style={{fontSize:9,color:T.textMuted,fontFamily:"'Sora',sans-serif",fontWeight:400}}>{h.result.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* ── MAIN CONTENT ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:12,padding:isMobile?"10px 12px":"12px 0",minWidth:0,overflowX:"hidden"}}>

          {!activeCalc&&(
            <div className="fd" style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:T.textMuted,gap:14,textAlign:"center",padding:"20px"}}>
              <div style={{fontSize:isMobile?40:52}}>{ROLES[user.role].icon}</div>
              <div>
                <div style={{fontSize:isMobile?16:18,fontWeight:700,color:T.text}}>Welcome, {user.name.split(" ")[0]}</div>
                <div style={{fontSize:12,marginTop:5}}>{isMobile?"Tap ☰ menu to pick a calculator":"Select a calculator from the sidebar"}</div>
                <div style={{marginTop:9,background:`${accent}12`,border:`1px solid ${accent}30`,borderRadius:20,padding:"4px 16px",display:"inline-block",fontSize:11,color:accent,fontWeight:700}}>
                  {CALCS[user.role].length} calculators · unit selectors on every field · full equivalent display
                </div>
              </div>
              {/* Quick action buttons */}
              <div style={{display:"flex",gap:7,flexWrap:"wrap",justifyContent:"center"}}>
                {[
                  {icon:"👤",label:profile.weight?"Profile ✓":"Patient Profile",action:()=>setShowProfile(true),active:!!profile.weight},
                  {icon:"🔄",label:"Quick Convert",action:()=>setShowQuickConv(true)},
                  {icon:"📊",label:"Drip Table",action:()=>setShowDrip(true)},
                  {icon:"🧒",label:"Peds Weight",action:()=>setShowPedsWt(true)},
                  {icon:"🚨",label:allergies.length>0?`Allergies (${allergies.length})`:"Allergy Flags",action:()=>setScreen("allergies"),active:allergies.length>0},
                ].map(btn=>(
                  <button key={btn.label} onClick={btn.action} style={{background:btn.active?`${accent}18`:T.card,border:`1px solid ${btn.active?accent+"50":T.border}`,borderRadius:20,padding:"6px 14px",fontSize:11,fontWeight:600,color:btn.active?accent:T.textMuted,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                    {btn.icon} {btn.label}
                  </button>
                ))}
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",maxWidth:440}}>
                {[...new Set(CALCS[user.role].map(c=>c.cat))].map(cat=>(
                  <span key={cat} onClick={()=>setTab("calc")} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:"4px 13px",fontSize:11,color:T.textMuted,cursor:"pointer"}}>{cat}</span>
                ))}
              </div>
            </div>
          )}

          {activeCalc&&(
            <div className="fd" style={{display:"flex",flexDirection:"column",gap:12}}>

              {/* CALCULATOR HEADER */}
              <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:17,padding:"17px 19px",boxShadow:T.shadow}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:11}}>
                    <div style={{width:isMobile?38:48,height:isMobile?38:48,background:`${accent}15`,border:`1.5px solid ${accent}40`,borderRadius:isMobile?10:13,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isMobile?20:24,flexShrink:0}}>{activeCalc.icon}</div>
                    <div style={{minWidth:0}}>
                      <div className="calc-header-title" style={{fontWeight:800,fontSize:isMobile?14:17,letterSpacing:"-0.4px",lineHeight:1.3}}>{activeCalc.name}</div>
                      <div style={{fontSize:10,color:T.textMuted,marginTop:2}}>📂 {activeCalc.cat}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",justifyContent:isMobile?"flex-start":"flex-end"}}>
                    {/* Drip titration (infusion / drip / rate calcs) */}
                    {(["icu_drip_n","iv_flow","iv_drip","infusion_time","vol_infused","heparin_n","heparin_ph"].includes(activeCalc.id)||activeCalc.cat==="ICU"||activeCalc.cat==="IV Therapy"||activeCalc.cat==="Anticoagulation")&&(
                      <button className="ib" onClick={()=>setShowDrip(true)} title="Drip Titration Table" style={{fontSize:11,color:"#56B6C2",borderColor:"#56B6C240"}}>📊 Drip Table</button>
                    )}
                    {/* Apply profile */}
                    {Object.values(profile).some(v=>v)&&(
                      <button className="ib" onClick={()=>applyProfile(activeCalc)} title="Fill from Patient Profile" style={{color:accent,borderColor:`${accent}50`,fontSize:11}}>👤 Fill Profile</button>
                    )}
                    {/* Reset */}
                    <button className="ib" onClick={()=>{setFVals({});setFUnits({});setFRaw({});setResult(null);}} title="Clear all fields" style={{fontSize:11}}>🗑 Reset</button>
                    {(()=>{const ref=REFS.find(r=>r.id===activeCalc.ref);return ref&&(
                      <span style={{background:`${ref.color}18`,color:ref.color,border:`1px solid ${ref.color}40`,borderRadius:20,padding:"3px 11px",fontSize:10,fontWeight:700}}>{ref.icon} {ref.short}</span>
                    );})()}
                  </div>
                </div>
                <div style={{marginTop:8,padding:"7px 11px",background:T.bg,borderRadius:9,display:"flex",alignItems:"center",gap:6,overflowX:"auto"}}>
                  <span style={{fontSize:12,flexShrink:0}}>📐</span>
                  <code style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:accent,whiteSpace:"nowrap"}}>{activeCalc.formula}</code>
                </div>
              </div>

              {/* ALLERGY WARNING */}
              {selectedDrug&&drugAllergyWarn(selectedDrug.drug)&&(
                <div style={{background:"#FF000014",border:"1.5px solid #FF000060",borderRadius:12,padding:"11px 14px",color:"#FF6B6B",fontSize:13,fontWeight:700,display:"flex",gap:9,alignItems:"flex-start"}}>
                  <span style={{fontSize:18}}>🚨</span>
                  <span>{drugAllergyWarn(selectedDrug.drug)}</span>
                </div>
              )}

              {/* DID YOU KNOW */}
              {(()=>{const tips=CLINICAL_TIPS[activeCalc.id];if(!tips||!tips.length)return null;
                const tip=tips[Math.floor(Date.now()/30000)%tips.length];
                return(
                  <div style={{background:T.card,border:`1.5px solid ${accent}25`,borderRadius:11,padding:"10px 14px",display:"flex",gap:9,alignItems:"flex-start"}}>
                    <span style={{fontSize:18,flexShrink:0}}>💡</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:9,fontWeight:800,color:accent,textTransform:"uppercase",letterSpacing:"1px",marginBottom:3}}>Clinical Pearl</div>
                      <div style={{fontSize:12,color:T.text,lineHeight:1.6}}>{tip}</div>
                      {tips.length>1&&<div style={{fontSize:9,color:T.textFaint,marginTop:4}}>{tips.indexOf(tip)+1}/{tips.length} tips for this calculator</div>}
                    </div>
                  </div>
                );
              })()}

              {/* DRUG PICKER BUTTON + SELECTED DRUG CARD */}
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <button onClick={()=>setShowDrugPicker(true)} style={{
                  background:selectedDrug?`${selectedDrug.drug.color}12`:`${accent}10`,
                  border:`1.5px dashed ${selectedDrug?selectedDrug.drug.color+"50":accent+"40"}`,
                  borderRadius:14, padding:"11px 16px", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:10,
                  fontFamily:"'Sora',sans-serif", transition:"all .18s",
                  width:"100%", textAlign:"left",
                }}>
                  <span style={{fontSize:20}}>💊</span>
                  {selectedDrug?(
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                        <span style={{fontWeight:800,fontSize:13,color:selectedDrug.drug.color}}>{selectedDrug.drug.generic}</span>
                        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                          {selectedDrug.drug.brands.slice(0,3).map(b=>(
                            <span key={b} style={{background:`${selectedDrug.drug.color}18`,color:selectedDrug.drug.color,border:`1px solid ${selectedDrug.drug.color}35`,borderRadius:10,padding:"1px 7px",fontSize:10,fontWeight:600}}>{b}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{fontSize:11,color:T.textMuted,marginTop:3}}>
                        <span style={{fontWeight:600,color:T.text}}>Form: </span>{selectedDrug.form.label}
                        <span style={{margin:"0 7px",color:T.textFaint}}>·</span>
                        <span style={{fontWeight:600,color:T.text}}>Conc: </span>{selectedDrug.form.conc} {selectedDrug.form.unit}
                        <span style={{margin:"0 7px",color:T.textFaint}}>·</span>
                        <span style={{color:T.textFaint}}>{selectedDrug.form.route}</span>
                      </div>
                      {selectedDrug.drug.renalCaution&&<div style={{fontSize:10,color:"#FF8080",fontWeight:600,marginTop:2}}>⚠️ Renal dose adjustment required</div>}
                    </div>
                  ):(
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:13,color:accent}}>Select Drug (Optional)</div>
                      <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>Browse {DRUG_DB.length} drugs — generic names, brand names &amp; available doses</div>
                    </div>
                  )}
                  <span style={{fontSize:11,color:T.textMuted,flexShrink:0}}>{selectedDrug?"Change ✎":"Browse →"}</span>
                </button>

                {/* Typical dose info strip */}
                {selectedDrug&&(
                  <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 13px",fontSize:11,color:T.textMuted,display:"flex",alignItems:"flex-start",gap:7}}>
                    <span>💡</span>
                    <div>
                      <span style={{fontWeight:700,color:T.text}}>Typical dose: </span>{selectedDrug.drug.typDose}
                      <span style={{margin:"0 6px",color:T.textFaint}}>·</span>
                      <span style={{fontWeight:700,color:T.text}}>Max: </span>{selectedDrug.drug.maxDose}
                    </div>
                  </div>
                )}
              </div>

              {/* INPUT FIELDS */}
              <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:17,padding:"17px 19px",display:"flex",flexDirection:"column",gap:13,boxShadow:T.shadow}}>
                <div style={{fontWeight:700,fontSize:10,color:T.textMuted,letterSpacing:"1.2px",textTransform:"uppercase"}}>
                  Input Parameters
                  <span style={{marginLeft:8,fontWeight:500,fontSize:9,color:T.textFaint,letterSpacing:0,textTransform:"none"}}>— select your preferred unit for each field</span>
                </div>

                {activeCalc.fields.map(f=>{
                  const fam = UF[f.fam];
                  const hasUnits = fam && fam.units.length > 1 && !f.type;
                  const curUnit = getUnit(f);
                  return(
                    <div key={f.id}>
                      <label style={{fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.8px",display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                        <span>{f.label}</span>
                        {hasUnits&&(
                          <span style={{background:`${accent}15`,color:accent,padding:"1px 7px",borderRadius:8,fontSize:8,fontWeight:700,textTransform:"none",letterSpacing:0}}>
                            {fam.label}
                          </span>
                        )}
                      </label>
                      {f.type==="select"?(
                        <select className="sel" value={fVals[f.id]||""} onChange={e=>setFVals(v=>({...v,[f.id]:e.target.value}))}>
                          <option value="">Select...</option>
                          {f.options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                      ):(
                        <div style={{display:"flex"}}>
                          <input
                            className="inp-unit"
                            type="number"
                            placeholder={f.placeholder||`Enter ${f.label.toLowerCase()}...`}
                            value={fRaw[f.id]||""}
                            onChange={e=>setFieldVal(f, e.target.value)}
                            style={{borderRadius: hasUnits?"10px 0 0 10px":"10px"}}
                          />
                          {hasUnits&&(
                            <UnitSel famId={f.fam} value={curUnit} onChange={u=>setFieldUnit(f,u)} T={T} accent={accent}/>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <button className="btn rip" onClick={handleCalculate}
                  style={{background:ROLES[user.role].grad, color:"#fff", marginTop:4}}>
                  Calculate →
                </button>
              </div>

              {/* RESULT */}
              {result&&(
                <div className="fd" style={{
                  background:result.error?(theme==="dark"?"#1A0810":T.resultBg):`${accent}08`,
                  border:`1.5px solid ${result.error?"#FF4D4D44":accent+"44"}`,
                  borderRadius:17, padding:"19px 20px", boxShadow:T.shadow,
                }}>
                  {result.error?(
                    <div style={{color:"#FF6B6B",fontSize:14}}>⚠️ Please fill all required fields correctly.</div>
                  ):(
                    <>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                        <div style={{fontSize:9,fontWeight:700,color:T.textMuted,letterSpacing:"1.5px",textTransform:"uppercase"}}>{result.label}</div>
                        <button onClick={copyResult} style={{background:copied?`${accent}20`:"transparent",border:`1px solid ${accent}40`,borderRadius:8,padding:"3px 11px",color:accent,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all .2s"}}>
                          {copied?"✓ Copied!":"📋 Copy"}
                        </button>
                      </div>

                      {/* PRIMARY RESULT */}
                      <div className="result-num" style={{fontSize:48,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:accent,letterSpacing:"-1.5px",lineHeight:1,wordBreak:"break-all"}}>
                        {result.val}
                        <span style={{fontSize:15,fontWeight:500,color:`${accent}99`,marginLeft:8,fontFamily:"'Sora',sans-serif"}}>{result.unit}</span>
                      </div>

                      {/* IBW EXTRA */}
                      {result.extra&&(
                        <div style={{marginTop:8,padding:"7px 11px",background:T.card,border:`1px solid ${T.border}`,borderRadius:9,fontSize:12,color:T.textMuted,fontFamily:"'JetBrains Mono',monospace"}}>
                          {result.extra}
                        </div>
                      )}

                      {/* ALL EQUIVALENTS */}
                      <ResultEqs val={result.val} famId={result.resFam} T={T} accent={accent}/>

                      {/* CLINICAL WARNING */}
                      {result.warn&&(
                        <div style={{marginTop:12,padding:"9px 12px",background:"#FF4D4D14",border:"1px solid #FF4D4D44",borderRadius:9,fontSize:12,color:"#FF8080",fontWeight:600}}>{result.warn}</div>
                      )}

                      {/* DISCLAIMER + REFERENCE LINKS */}
                      <div style={{marginTop:12,padding:"9px 12px",background:T.bg,borderRadius:9,fontSize:11,color:T.textFaint,display:"flex",alignItems:"center",gap:6}}>
                        <span>⚠️</span><span>Clinical reference only. Verify with current formulary &amp; protocols before administration.</span>
                      </div>
                      <div style={{marginTop:9,display:"flex",gap:7,flexWrap:"wrap"}}>
                        {REFS.filter(r=>r.url).map(ref=>(
                          <a key={ref.id} href={ref.url} target="_blank" rel="noopener noreferrer"
                            style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 11px",background:`${ref.color}12`,border:`1px solid ${ref.color}40`,borderRadius:20,fontSize:10,color:ref.color,fontWeight:600,textDecoration:"none"}}>
                            {ref.icon} Verify on {ref.short} ↗
                          </a>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER (desktop/tablet only) ── */}
      {!isMobile&&(
        <footer style={{borderTop:`1px solid ${T.border}`,padding:"8px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",background:T.headerBg,fontSize:10,color:T.textFaint,flexShrink:0}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <span>🔌 HL7 FHIR R4</span><span>·</span><span>Epic Ready</span><span>·</span><span>Cerner Ready</span>
          </div>
          <div>Dose 360 v4.0 · Henke's Med-Math</div>
        </footer>
      )}

      {/* ── BOTTOM NAV (mobile only) ── */}
      {isMobile&&(
        <nav className="bottom-nav">
          {[
            {id:"calc",icon:"🧮",label:"Calc",action:()=>{setSidebarOpen(true);}},
            {id:"convert",icon:"🔄",label:"Convert",action:()=>{setTab("convert");setSidebarOpen(true);}},
            {id:"drugs",icon:"💊",label:"Drugs",action:()=>setShowDrugPicker(true)},
            {id:"tools",icon:"🛠️",label:"Tools",action:()=>setShowQuickConv(true)},
            {id:"history2",icon:"🕐",label:`Log${history.length>0?"("+history.length+")":""}`,action:()=>{setTab("history");setSidebarOpen(true);}},
          ].map(b=>(
            <button key={b.id} className={`bnav-btn${tab===b.id?" active":""}`} onClick={b.action}>
              <span className="icon">{b.icon}</span>
              {b.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}