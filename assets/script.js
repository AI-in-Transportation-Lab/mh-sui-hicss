/* ===========================================================
   Companion site interactivity — Bluesky MH/SI benchmarks
=========================================================== */
(function(){
  "use strict";

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const themeBtn = document.getElementById('theme-toggle');
  function applyTheme(t){
    root.setAttribute('data-theme', t);
    try{ localStorage.setItem('mh-bsky-theme', t); }catch(e){}
  }
  (function initTheme(){
    let saved = null;
    try{ saved = localStorage.getItem('mh-bsky-theme'); }catch(e){}
    if(saved){ applyTheme(saved); }
    else{
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }
  })();
  themeBtn && themeBtn.addEventListener('click', function(){
    const cur = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(cur);
    refreshCharts();
  });

  /* ---------- scroll progress ---------- */
  const progressBar = document.getElementById('scroll-progress');
  function updateProgress(){
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const height = h.scrollHeight - h.clientHeight;
    const pct = height > 0 ? (scrolled/height)*100 : 0;
    if(progressBar) progressBar.style.width = pct + '%';
  }
  document.addEventListener('scroll', updateProgress, {passive:true});
  updateProgress();

  /* ---------- back to top ---------- */
  const backBtn = document.getElementById('back-to-top');
  function toggleBack(){
    if(!backBtn) return;
    if(window.scrollY > 600) backBtn.classList.add('show');
    else backBtn.classList.remove('show');
  }
  document.addEventListener('scroll', toggleBack, {passive:true});
  backBtn && backBtn.addEventListener('click', ()=>window.scrollTo({top:0, behavior:'smooth'}));

  /* ---------- nav active link (scroll-spy) ---------- */
  const navLinks = Array.from(document.querySelectorAll('#nav-links a'));
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  function spy(){
    let idx = -1;
    const y = window.scrollY + 120;
    sections.forEach((sec,i)=>{ if(sec && sec.offsetTop <= y) idx = i; });
    navLinks.forEach(a=>a.classList.remove('active'));
    if(idx >= 0) navLinks[idx].classList.add('active');
  }
  document.addEventListener('scroll', spy, {passive:true});
  spy();

  /* ---------- animated stat counters ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, {threshold:.4});
  counters.forEach(c=>counterObserver.observe(c));
  function animateCounter(el){
    const target = parseFloat(el.getAttribute('data-count'));
    const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    const dur = 1100;
    const start = performance.now();
    function tick(now){
      const p = Math.min(1, (now-start)/dur);
      const eased = 1 - Math.pow(1-p, 3);
      const val = target * eased;
      el.textContent = decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString();
      if(p < 1) requestAnimationFrame(tick);
      else el.textContent = decimals ? target.toFixed(decimals) : Math.round(target).toLocaleString();
    }
    requestAnimationFrame(tick);
  }

  /* ---------- dataset bar fills ---------- */
  const bars = document.querySelectorAll('.bar-fill');
  const barObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const w = entry.target.getAttribute('data-w');
        entry.target.style.width = w + '%';
        barObserver.unobserve(entry.target);
      }
    });
  }, {threshold:.3});
  bars.forEach(b=>barObserver.observe(b));

  /* ---------- pipeline diagram ---------- */
  const pipeDetails = [
    "<b>1 · AT Protocol Firehose —</b> Public posts are collected via a reproducible firehose pipeline (adapted from the CognitiveSky framework), avoiding privileged API access or centralized rate limits. Public availability does not imply clinical validity or consent for individual-level intervention.",
    "<b>2 · Lexicon Retrieval —</b> Task-specific keyword filtering enriches the stream for relevant content. SI uses explicit self-harm/death-wish terms plus indirect indicators (hopelessness, perceived burdensomeness); MH uses a broader symptom/distress vocabulary. This raises case density but introduces selection bias.",
    "<b>3 · Llama-3-8B Weak Labels —</b> A local Ollama-based pipeline prompts Llama-3-8B to return a deterministic binary label (1/0) per post, independent of user history, reply context, or profile metadata.",
    "<b>4 · Human Validation —</b> Two annotators independently double-code stratified subsets (276 SI / 250 MH posts), then adjudicate disagreements. LLM labels are scored against the adjudicated reference using agreement, Cohen's κ, precision, recall, and F1.",
    "<b>5 · Model Benchmarking —</b> A broad architecture set (SI) and a compact-encoder set (MH) are fine-tuned and evaluated under holdout and cross-validation protocols, reporting F1, accuracy, AUC, and training time.",
    "<b>6 · Governance Interpretation —</b> Results are read together with label provenance, decentralized deployment constraints, and accountability questions — who hosts, audits, and acts on the model's predictions."
  ];
  const pipeNodes = document.querySelectorAll('.pipe-node');
  const pipeDetailEl = document.getElementById('pipe-detail-text');
  pipeNodes.forEach(node=>{
    node.addEventListener('click', ()=>{
      pipeNodes.forEach(n=>n.classList.remove('active'));
      node.classList.add('active');
      const i = parseInt(node.getAttribute('data-i'), 10);
      pipeDetailEl.style.opacity = 0;
      setTimeout(()=>{
        pipeDetailEl.innerHTML = pipeDetails[i];
        pipeDetailEl.style.opacity = 1;
      }, 120);
    });
  });
  pipeDetailEl.style.transition = 'opacity .18s ease';

  /* ---------- task toggle (SI / MH) ---------- */
  const taskBtns = document.querySelectorAll('.task-toggle button');
  taskBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      taskBtns.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const task = btn.getAttribute('data-task');
      document.querySelectorAll('.task-pane').forEach(p=>p.classList.remove('active'));
      document.getElementById('pane-' + task).classList.add('active');
      setTimeout(()=>renderCharts(), 60);
    });
  });

  /* ---------- accordion ---------- */
  document.querySelectorAll('.acc-item').forEach(item=>{
    const head = item.querySelector('.acc-head');
    const body = item.querySelector('.acc-body');
    function setState(open){
      if(open){ item.classList.add('open'); body.style.maxHeight = body.scrollHeight + 'px'; }
      else{ item.classList.remove('open'); body.style.maxHeight = '0px'; }
    }
    setState(item.classList.contains('open'));
    head.addEventListener('click', ()=> setState(!item.classList.contains('open')));
    window.addEventListener('resize', ()=>{ if(item.classList.contains('open')) body.style.maxHeight = body.scrollHeight + 'px'; });
  });

  /* ---------- sortable tables ---------- */
  document.querySelectorAll('table.sortable').forEach(table=>{
    const ths = table.querySelectorAll('thead th');
    ths.forEach((th, colIdx)=>{
      th.addEventListener('click', ()=>{
        const type = th.getAttribute('data-type') || 'text';
        const curDir = th.getAttribute('data-sort') === 'asc' ? 'asc' : (th.getAttribute('data-sort')==='desc' ? 'desc' : null);
        const nextDir = curDir === 'desc' ? 'asc' : 'desc';
        ths.forEach(t=>t.removeAttribute('data-sort'));
        th.setAttribute('data-sort', nextDir);
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        rows.sort((a,b)=>{
          let av = a.children[colIdx].textContent.trim();
          let bv = b.children[colIdx].textContent.trim();
          if(type === 'num'){
            av = parseFloat(av.replace(/[^0-9.\-]/g,'')) || 0;
            bv = parseFloat(bv.replace(/[^0-9.\-]/g,'')) || 0;
          }else{
            av = av.toLowerCase(); bv = bv.toLowerCase();
          }
          if(av < bv) return nextDir === 'asc' ? -1 : 1;
          if(av > bv) return nextDir === 'asc' ? 1 : -1;
          return 0;
        });
        rows.forEach(r=>tbody.appendChild(r));
        // recompute "best" highlight = first row after desc-sort on primary metric col only if it's the default sorted col
      });
    });
  });

  /* ---------- BibTeX copy ---------- */
  const copyBtn = document.getElementById('copy-bibtex');
  if(copyBtn){
    copyBtn.addEventListener('click', ()=>{
      const text = document.getElementById('bibtex-text').textContent;
      navigator.clipboard.writeText(text).then(()=>{
        copyBtn.textContent = 'Copied ✓';
        copyBtn.classList.add('copied');
        setTimeout(()=>{ copyBtn.textContent = 'Copy'; copyBtn.classList.remove('copied'); }, 1800);
      }).catch(()=>{
        copyBtn.textContent = 'Press ⌘/Ctrl+C';
      });
    });
  }

  /* ---------- Chart.js charts ---------- */
  let chartInstances = {};
  function themeColors(){
    const dark = root.getAttribute('data-theme') === 'dark';
    return {
      text: dark ? '#b3b9b1' : '#4b5359',
      grid: dark ? '#33393d' : '#cdd1c6',
      si: dark ? '#e2857d' : '#a3372f',
      mh: dark ? '#8fb4dc' : '#2f5f8f',
      accent: dark ? '#d1a24a' : '#9c6f22',
      accent2: dark ? '#d1a24a' : '#9c6f22'
    };
  }

  const siModels = ["RoBERTa","ELECTRA","ALBERT","BERT","DistilBERT","XLNet","BERT+LSTM","LSTM+Attn.","MobileBERT"];
  const siHoldout = [0.792,0.784,0.778,0.774,0.773,0.770,0.769,0.733,0.716];
  const siCV = [0.9017,0.8863,0.8833,0.8986,0.8712,0.8904,0.9162,0.8791,0.7844];
  const siTrainTime = [841,834,908,835,423,1359,4524,4512,563];
  const siRecall = [0.784,0.757,0.768,0.763,0.766,0.745,0.687,0.870,0.665];

  const mhModels = ["DistilRoBERTa","DistilBERT","MiniLM","ELECTRA","TinyBERT"];
  const mhF1 = [0.905,0.903,0.901,0.898,0.887];
  const mhTime = [731.78,521.05,263.84,272.00,171.51];
  const mhAUC = [0.931,0.930,0.928,0.913,0.908];

  function renderCharts(){
    const c = themeColors();
    Chart.defaults.color = c.text;
    Chart.defaults.font.family = "'IBM Plex Mono', monospace";
    Chart.defaults.font.size = 10.5;

    // SI: holdout vs CV grouped bar
    mkChart('chart-si-cv', 'bar', {
      labels: siModels,
      datasets: [
        {label:'Holdout F1', data: siHoldout, backgroundColor: c.si + 'cc', borderRadius:1, maxBarThickness:16},
        {label:'Stratified CV F1', data: siCV, backgroundColor: c.accent + 'cc', borderRadius:1, maxBarThickness:16}
      ]
    }, {
      indexAxis:'y',
      scales:{ x:{ min:0.6, max:1.0, grid:{color:c.grid}, ticks:{color:c.text} }, y:{ grid:{display:false}, ticks:{color:c.text} } },
      plugins:{ legend:{ position:'top', labels:{boxWidth:10, usePointStyle:true} } }
    });

    // SI efficiency: scatter (train time vs holdout F1), bubble-ish via pointRadius array
    mkChart('chart-si-eff', 'scatter', {
      datasets:[{
        label:'SI models',
        data: siModels.map((m,i)=>({x:siTrainTime[i], y:siHoldout[i], r: 6 + siRecall[i]*14, label:m})),
        backgroundColor: c.si + '99',
        borderColor: c.si,
        borderWidth:1.5
      }]
    }, {
      parsing:false,
      scales:{
        x:{ type:'logarithmic', title:{display:true,text:'Training time (s, log scale)', color:c.text}, grid:{color:c.grid}, ticks:{color:c.text} },
        y:{ title:{display:true,text:'Holdout F1', color:c.text}, min:0.65, max:0.85, grid:{color:c.grid}, ticks:{color:c.text} }
      },
      plugins:{
        legend:{display:false},
        tooltip:{ callbacks:{ label: (ctx)=> `${ctx.raw.label}: F1 ${ctx.raw.y.toFixed(3)}, ${ctx.raw.x}s, recall ${siRecall[ctx.dataIndex].toFixed(3)}` } }
      },
      elements:{ point:{ hoverRadius: 10 } }
    }, true);

    // MH efficiency scatter
    mkChart('chart-mh-eff', 'scatter', {
      datasets:[{
        label:'MH models',
        data: mhModels.map((m,i)=>({x:mhTime[i], y:mhF1[i], r: 6 + (mhAUC[i]-0.9)*160, label:m, auc:mhAUC[i]})),
        backgroundColor: c.mh + '99',
        borderColor: c.mh,
        borderWidth:1.5
      }]
    }, {
      parsing:false,
      scales:{
        x:{ title:{display:true,text:'Training time (s)', color:c.text}, grid:{color:c.grid}, ticks:{color:c.text} },
        y:{ title:{display:true,text:'5-fold F1', color:c.text}, min:0.88, max:0.91, grid:{color:c.grid}, ticks:{color:c.text} }
      },
      plugins:{
        legend:{display:false},
        tooltip:{ callbacks:{ label:(ctx)=> `${ctx.raw.label}: F1 ${ctx.raw.y.toFixed(3)}, ${ctx.raw.x}s, AUC ${ctx.raw.auc.toFixed(3)}` } }
      },
      elements:{ point:{ hoverRadius: 10 } }
    }, true);
  }

  function mkChart(id, type, data, extraOptions, isScatter){
    const canvas = document.getElementById(id);
    if(!canvas) return;
    if(chartInstances[id]){ chartInstances[id].destroy(); }
    const baseOptions = {
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode: isScatter ? 'nearest' : 'index', intersect:isScatter },
      plugins:{ legend:{ labels:{ color: themeColors().text } } }
    };
    chartInstances[id] = new Chart(canvas.getContext('2d'), {
      type, data,
      options: Object.assign({}, baseOptions, extraOptions)
    });
  }

  function refreshCharts(){ renderCharts(); }

  // initial render (wait for Chart.js + layout)
  if(window.Chart){ renderCharts(); }
  else{ window.addEventListener('load', renderCharts); }

})();
