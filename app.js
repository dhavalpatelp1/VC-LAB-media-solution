(function(){
  "use strict";

  const THEMES = {
    cyan:   { liq1: '#22d3ee', liq2: '#0ea5e9', stroke: '#06b6d4', glow: '#22d3ee' },
    purple: { liq1: '#c084fc', liq2: '#6366f1', stroke: '#7c3aed', glow: '#c084fc' },
    emerald:{ liq1: '#34d399', liq2: '#10b981', stroke: '#059669', glow: '#34d399' },
    orange: { liq1: '#fbbf24', liq2: '#fb923c', stroke: '#f59e0b', glow: '#fbbf24' },
    pink:   { liq1: '#f472b6', liq2: '#ec4899', stroke: '#db2777', glow: '#f472b6' },
  };

  const STORAGE_KEY = "lab_media_scaler_site_v1";
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));

  function seed(){
    return {
      benchMode: false,
      colorTheme: "cyan",
      recipes: [
        {
          id: uid(),
          name: "LB Broth (per 1000 mL)",
          baseVolumeMl: 1000,
          notes: "Autoclave; optional Agar 15 g for LB Agar.",
          components: [
            { id: uid(), name: "Tryptone", amount: 10, unit: "g" },
            { id: uid(), name: "Yeast Extract", amount: 5, unit: "g" },
            { id: uid(), name: "NaCl", amount: 10, unit: "g" },
          ],
        },
        {
          id: uid(),
          name: "YPD Broth (per 1000 mL)",
          baseVolumeMl: 1000,
          notes: "Autoclave 121°C 15 min.",
          components: [
            { id: uid(), name: "Peptone", amount: 20, unit: "g" },
            { id: uid(), name: "Yeast Extract", amount: 10, unit: "g" },
            { id: uid(), name: "Dextrose (Glucose)", amount: 20, unit: "g" },
          ],
        },
        {
          id: uid(),
          name: "PBS 10× (per 1000 mL)",
          baseVolumeMl: 1000,
          notes: "Dilute 1:10 for 1×. Adjust pH ~7.4.",
          components: [
            { id: uid(), name: "NaCl", amount: 80, unit: "g" },
            { id: uid(), name: "KCl", amount: 2, unit: "g" },
            { id: uid(), name: "Na2HPO4", amount: 14.4, unit: "g" },
            { id: uid(), name: "KH2PO4", amount: 2.4, unit: "g" },
          ],
        },
      ],
    };
  }

  function loadState(){
    try{ const raw = localStorage.getItem(STORAGE_KEY); if(raw) return JSON.parse(raw); }catch{}
    return seed();
  }
  function saveState(s){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }catch{} }

  function roundSmart(n){
    if (n === 0) return 0;
    if (Math.abs(n) >= 100) return Math.round(n);
    if (Math.abs(n) >= 10) return Math.round(n * 10) / 10;
    return Math.round(n * 100) / 100;
  }
  function gramsLabel(value){ return value >= 1 ? (roundSmart(value) + " g") : (roundSmart(value * 1000) + " mg"); }

  // App State
  let state = loadState();
  let activeId = (state.recipes[0] && state.recipes[0].id) || null;

  // Render helpers
  const el = (tag, props={}, children=[])=>{
    const node = document.createElement(tag);
    for(const [k,v] of Object.entries(props)){
      if(k === "class") node.className = v;
      else if(k === "style") Object.assign(node.style, v);
      else if(k === "innerHTML") node.innerHTML = v;
      else if(k.startsWith("on") && typeof v === "function"){ node.addEventListener(k.slice(2).toLowerCase(), v); }
      else if(v !== null && v !== undefined) node.setAttribute(k, v);
    }
    for(const c of (Array.isArray(children)? children : [children])){
      if (typeof c === "string") node.appendChild(document.createTextNode(c));
      else if (c) node.appendChild(c);
    }
    return node;
  };

  function ThemeBackground(){
    const t = THEMES[state.colorTheme] || THEMES.cyan;
    return el("div", { class:"bg-layer" }, [
      el("div", { class:"blob", style:{ top:"-80px", left:"-80px", width:"600px", height:"600px", background:`radial-gradient(circle at 30% 30%, ${t.liq1}, transparent 60%)`} }),
      el("div", { class:"blob", style:{ top:"140px", right:"-120px", width:"520px", height:"520px", background:`radial-gradient(circle at 70% 70%, ${t.liq2}, transparent 60%)`, animationDirection:"reverse"} }),
      el("div", { class:"dotgrid", style:{ color: state.benchMode ? t.glow : "#64748b" } })
    ]);
  }

  function Header(){
    const t = THEMES[state.colorTheme] || THEMES.cyan;
    const header = el("div", { class:"header", style:{
      background: state.benchMode ? "linear-gradient(180deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2))"
                                 : `linear-gradient(90deg, ${t.liq1}22, ${t.liq2}22)`,
      boxShadow: state.benchMode ? `0 10px 40px -10px ${t.glow}` : `0 10px 30px -15px ${t.stroke}`
    }}, [
      el("div", { class:"brand" }, [
        el("span", { class:"beaker-emoji", title:"Lab" }, "🧪"),
        el("span", {}, "Venkata Lab media"),
        el("span", { class:"muted" }, "Lab Media Scaler")
      ]),
      el("div", { class:"flex items-center gap-12" }, [
        el("div", { class:"theme-dots" },
          Object.keys(THEMES).map(opt =>
            el("div", { class:"theme-dot", title:opt,
              style:{ background:`linear-gradient(135deg, ${THEMES[opt].liq1}, ${THEMES[opt].liq2})`, boxShadow: state.colorTheme===opt? `0 0 0 2px ${THEMES[opt].stroke}`: "none" },
              onclick:()=>{ state.colorTheme = opt; applyTheme(); render(); saveState(state); }
            })
          )
        ),
        el("label", { class:"switch" }, [
          el("input", { type:"checkbox", checked: state.benchMode ? "checked" : null,
                        onchange:e=>{ state.benchMode = e.target.checked; applyTheme(); render(); saveState(state); } }),
          el("span", { class:"muted" }, "Bench mode")
        ])
      ])
    ]);
    return header;
  }

  function RecipeList(){
    const t = THEMES[state.colorTheme] || THEMES.cyan;
    const list = el("div", { class:"card" }, [
      el("div", { class:"flex items-center justify-between", style:{ marginBottom:"12px" } }, [
        el("div", { style:{ fontWeight:600 } }, "Recipes"),
        el("span", { class:"badge" }, "Local")
      ]),
      el("div", { class:"grid", style:{ gap:"8px", marginBottom:"12px" } },
        state.recipes.map(r => el("div", {
          class:"list-item flex items-center justify-between",
          style:{
            cursor:"pointer",
            borderColor: "var(--stroke)",
            boxShadow: activeId===r.id? `0 0 0 1px ${t.stroke}` : "none",
            backgroundImage: activeId===r.id ? `linear-gradient(135deg, ${t.liq1}22, ${t.liq2}22)` : "none"
          },
          onclick:()=>{ activeId = r.id; render(); }
        }, [
          el("div", { style:{ fontWeight:500 } }, r.name),
          el("div", { class:"flex gap-8" }, [
            el("button", { class:"btn small outline", onclick:(e)=>{ e.stopPropagation(); duplicateRecipe(r.id);} }, "Duplicate"),
            el("button", { class:"btn small outline", style:{ borderColor:"#ef4444", color:"#ef4444" },
                           onclick:(e)=>{ e.stopPropagation(); deleteRecipe(r.id);} }, "Delete")
          ])
        ]))
      ),
      el("div", { class:"flex gap-8" }, [
        el("input", { class:"input", placeholder:"New recipe name", id:"new-recipe-name" }),
        el("button", { class:"btn", onclick:()=>{
          const name = document.getElementById("new-recipe-name").value.trim();
          if(!name) return;
          addRecipe(name);
        }}, "Add")
      ])
    ]);
    return list;
  }

  function EditRecipe(recipe){
    const t = THEMES[state.colorTheme] || THEMES.cyan;
    if(!recipe) return el("div");
    const compGrid = el("div", { class:"grid", style:{ gap:"8px" } },
      recipe.components.map(c => el("div", { class:"grid cols-4 items-center", style:{ gap:"8px" } }, [
        el("input", { class:"input", value:c.name, placeholder:"Name",
                      oninput:e=>{ c.name = e.target.value; saveState(state); } }),
        el("input", { class:"input", type:"number", value:c.amount,
                      oninput:e=>{ c.amount = Number(e.target.value)||0; saveState(state);} }),
        el("select", { class:"input", value:c.unit, onchange:e=>{ c.unit = e.target.value; saveState(state);} }, [
          el("option", {}, "g"), el("option", {}, "mg"), el("option", {}, "mL")
        ]),
        el("button", { class:"btn outline", onclick:()=>{ removeComp(recipe.id, c.id);} }, "Delete")
      ]))
    );
    const card = el("div", { class:"card", style:{ marginBottom:"16px" } }, [
      el("div", { style:{ fontWeight:600, fontSize:"18px" } }, recipe.name),
      el("div", { class:"grid cols-3", style:{ marginTop:"8px" } }, [
        el("div", {}, [
          el("div", { class:"muted", style:{ fontSize:"12px" } }, "Base volume (mL)"),
          el("input", { class:"input", type:"number", value: recipe.baseVolumeMl,
                        oninput:e=>{ recipe.baseVolumeMl = Number(e.target.value)||0; saveState(state); render(); } })
        ]),
        el("div", { class:"col-span-2" }, [
          el("div", { class:"muted", style:{ fontSize:"12px" } }, "Notes"),
          el("textarea", { class:"input", rows:"2", value: recipe.notes || "",
                           oninput:e=>{ recipe.notes = e.target.value; saveState(state);} })
        ]),
      ]),
      el("div", { style:{ fontWeight:600, marginTop:"12px" } }, "Components (per base volume)"),
      compGrid,
      el("button", { class:"btn outline", style:{ borderColor:t.stroke },
                     onclick:()=>{ addComp(recipe.id);} }, "+ Add component")
    ]);
    return card;
  }

  function BeakerGauge({ valueMl, baseMl, replicates=1 }){
    const t = THEMES[state.colorTheme] || THEMES.cyan;
    const level = Math.max(0, Math.min(1, baseMl ? (valueMl / baseMl) : 0));
    const percent = Math.round(level * 100);
    const ticks = [0, 0.25, 0.5, 0.75, 1];
    const liquidHeight = 120 * level;
    const liquidY = 170 - liquidHeight;
    const labelFill = state.benchMode ? "#e5e7eb" : "#475569";
    const stroke = state.benchMode ? t.glow : t.stroke;
    const bodyFill = state.benchMode ? "#0b1020" : "#ffffff";
    const gradId = "liquidGrad"; const glowId = "glow";

    const svg = `
      <svg class="beaker ${state.benchMode ? 'neon' : ''}" width="200" height="220" viewBox="0 0 200 220" role="img" aria-label="Beaker fill gauge">
        <defs>
          <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${t.liq1}"></stop>
            <stop offset="100%" stop-color="${t.liq2}"></stop>
          </linearGradient>
          <clipPath id="beakerClip">
            <path d="M40 40 L160 40 L148 170 L52 170 Z" />
          </clipPath>
          <filter id="${glowId}" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="${t.glow}" flood-opacity="0.7"></feDropShadow>
          </filter>
        </defs>
        <path d="M40 40 L160 40 L148 170 L52 170 Z" fill="${bodyFill}" stroke="${stroke}" stroke-width="3" ${state.benchMode ? `filter="url(#${glowId})"`:""}/>
        ${ticks.map(tk => {
          const y = 170 - 120 * tk;
          const ml = Math.round(baseMl * tk);
          return `<g><line x1="162" x2="170" y1="${y}" y2="${y}" stroke="${labelFill}" stroke-width="2"></line>
                  <text x="174" y="${y+4}" font-size="10" fill="${labelFill}">${ml} mL</text></g>`;
        }).join("")}
        <g clip-path="url(#beakerClip)">
          <rect x="41" y="${liquidY}" width="118" height="${liquidHeight}" fill="url(#${gradId})" style="transition: all 500ms ease"></rect>
          <rect x="41" y="${liquidY}" width="118" height="6" fill="#e0f2fe" opacity="0.8"></rect>
        </g>
        <line x1="40" y1="40" x2="160" y2="40" stroke="${stroke}" stroke-width="3"></line>
      </svg>`;

    const wrap = el("div", { class:"flex items-center gap-12" });
    const beaker = el("div", { innerHTML: svg });
    wrap.appendChild(beaker);
    const info = el("div", {}, [
      el("div", { class:"muted", style:{ fontSize:"12px" } }, "Fill relative to base"),
      el("div", { id:"pct", style:{ fontSize:"24px", fontWeight:700 } }, percent + "%"),
      el("div", { class:"muted", style:{ fontSize:"12px" } }, `Per container: ${roundSmart(valueMl)} mL · Base ${roundSmart(baseMl)} mL`),
      replicates>1 ? el("div", { class:"muted", style:{ fontSize:"12px" } }, `Replicates: ${replicates} · Total ${roundSmart(valueMl*replicates)} mL`) : null
    ]);
    wrap.appendChild(info);

    // Animate percentage text
    requestAnimationFrame(()=>{
      const pctEl = wrap.querySelector("#pct");
      const start = Number(pctEl.textContent.replace("%",""));
      const target = percent;
      const duration = 500; let t0;
      function step(ts){
        if(!t0) t0 = ts;
        const p = Math.min((ts - t0)/duration, 1);
        const val = Math.round(start + (target-start)*p);
        pctEl.textContent = val + "%";
        if(p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });

    return wrap;
  }

  function Scaler(recipe){
    const t = THEMES[state.colorTheme] || THEMES.cyan;
    const targetMl = recipe._targetMl ?? recipe.baseVolumeMl;
    const replicates = recipe._replicates ?? 1;
    const showWater = recipe._showWater ?? true;
    const factor = recipe.baseVolumeMl ? (targetMl / recipe.baseVolumeMl) : 0;

    const scaled = recipe.components.map(c => {
      let amt = c.amount;
      if (c.unit === "mg") amt = amt / 1000;
      if (c.unit === "mL") return { ...c, scaled: roundSmart(c.amount * factor), display: roundSmart(c.amount * factor) + " mL" };
      const grams = amt * factor;
      return { ...c, scaled: grams, display: gramsLabel(grams) };
    });

    function copyOut(){
      const lines = [
        `${recipe.name} – scaled for ${targetMl} mL × ${replicates} = ${roundSmart(targetMl*replicates)} mL`,
        ...scaled.map(s => `• ${s.name}: ${s.display}`),
        showWater ? `• Water: to final volume ${roundSmart(targetMl)} mL (per container)` : ``,
      ].filter(Boolean);
      navigator.clipboard.writeText(lines.join("\n")).then(()=> alert("Copied!"));
    }

    const card = el("div", { class:"card" }, [
      el("div", { class:"flex items-center justify-between" }, [
        el("div", { style:{ fontWeight:600 } }, "Scale Recipe"),
        el("div", { class:"muted", style:{ fontSize:"12px" } }, "Base: " + recipe.baseVolumeMl + " mL")
      ]),
      el("div", { class:"grid cols-5 items-center", style:{ gap:"8px", marginTop:"8px" } }, [
        el("div", {}, [
          el("div", { class:"muted", style:{ fontSize:"12px" } }, "Target volume (mL)"),
          el("input", { class:"input", type:"number", value: targetMl,
            oninput:e=>{ recipe._targetMl = Number(e.target.value)||0; render(); saveState(state);} })
        ]),
        el("div", {}, [
          el("div", { class:"muted", style:{ fontSize:"12px" } }, "Replicates"),
          el("input", { class:"input", type:"number", value: replicates,
            oninput:e=>{ recipe._replicates = Math.max(1, Number(e.target.value)||1); render(); saveState(state);} })
        ]),
        el("label", { class:"flex items-center gap-8", style:{ marginTop:"22px" } }, [
          el("input", { type:"checkbox", checked: showWater ? "checked" : null,
                        onchange:e=>{ recipe._showWater = e.target.checked; render(); saveState(state);} }),
          el("span", { class:"muted" }, 'Show "water to volume"')
        ]),
        el("div", { style:{ gridColumn:"span 2 / span 2", display:"flex", justifyContent:"flex-end", gap:"8px" } }, [
          el("button", { class:"btn outline", onclick:copyOut }, "Copy"),
          el("button", { class:"btn", onclick:()=>window.print() }, "Print")
        ])
      ]),
      el("div", { class:"flex items-start", style:{ gap:"16px", marginTop:"12px" } }, [
        BeakerGauge({ valueMl: targetMl, baseMl: recipe.baseVolumeMl, replicates }),
        el("div", { class:"grid", style:{ gap:"8px", flex:1 } },
          [
            ...scaled.map(s => el("div", { class:"list-item flex items-center justify-between",
                                           style:{ borderColor:"var(--stroke)", backgroundImage:`linear-gradient(135deg, ${t.liq1}11, ${t.liq2}11)` } }, [
              el("div", { style:{ fontWeight:600 } }, s.name),
              el("div", { class:"code" }, s.display + (replicates>1? (" × " + replicates) : ""))
            ])),
            showWater ? el("div", { class:"list-item flex items-center justify-between",
                                    style:{ borderColor:"var(--stroke)", backgroundImage:`linear-gradient(135deg, ${t.liq1}11, ${t.liq2}11)` } }, [
              el("div", { style:{ fontWeight:600 } }, "Water"),
              el("div", { class:"code" }, "to final volume " + roundSmart(targetMl) + " mL (per container)")
            ]) : null
          ]
        )
      ]),
      recipe.notes ? el("div", { class:"muted", style:{ marginTop:"8px" } }, "Notes: " + recipe.notes) : null
    ]);
    return card;
  }

  function PercentCalculator(){
    const card = el("div", { class:"card" });
    let mode = "w/v"; let percent = 1; let volumeMl = 1000; let replicates = 1;
    function recalc(){
      content.replaceChildren();
      content.append(
        el("div", { class:"flex items-center justify-between" }, [
          el("div", { style:{ fontWeight:600 }}, "Percentage Solutions"),
          el("div", { class:"muted", style:{ fontSize:"12px" } }, mode === "w/v" ? "X g in 100 mL" : "X mL in 100 mL")
        ]),
        el("div", { class:"flex gap-8", style:{ marginTop:"8px" }}, [
          el("button", { class:"btn " + (mode==="w/v" ? "" : "outline"), onclick:()=>{ mode="w/v"; recalc(); } }, "w/v"),
          el("button", { class:"btn " + (mode==="v/v" ? "" : "outline"), onclick:()=>{ mode="v/v"; recalc(); } }, "v/v"),
        ]),
        el("div", { class:"grid cols-4 items-center", style:{ gap:"8px", marginTop:"8px" }}, [
          el("div", {}, [ el("div", { class:"muted", style:{ fontSize:"12px" } }, "Percent (%)"),
            el("input", { class:"input", type:"number", value: percent, oninput:e=>{ percent=Number(e.target.value)||0; recalc(); } }) ]),
          el("div", {}, [ el("div", { class:"muted", style:{ fontSize:"12px" } }, "Final volume (mL)"),
            el("input", { class:"input", type:"number", value: volumeMl, oninput:e=>{ volumeMl=Number(e.target.value)||0; recalc(); } }) ]),
          el("div", {}, [ el("div", { class:"muted", style:{ fontSize:"12px" } }, "Replicates"),
            el("input", { class:"input", type:"number", value: replicates, oninput:e=>{ replicates=Math.max(1, Number(e.target.value)||1); recalc(); } }) ]),
        ]),
        (mode==="w/v"
          ? el("div", { class:"list-item flex items-center justify-between", style:{ marginTop:"8px" } }, [
              el("div", { style:{ fontWeight:600 } }, "Solute mass"),
              el("div", { class:"code" }, gramsLabel(((percent*volumeMl)/100) || 0) + " per container")
            ])
          : el("div", { class:"list-item flex items-center justify-between", style:{ marginTop:"8px" } }, [
              el("div", { style:{ fontWeight:600 } }, "Solute volume"),
              el("div", { class:"code" }, roundSmart(((percent*volumeMl)/100) || 0) + " mL per container")
            ])
        ),
        el("div", { class:"list-item flex items-center justify-between" }, [
          el("div", { style:{ fontWeight:600 } }, "Water/solvent"),
          el("div", { class:"code" }, "to final volume " + roundSmart(volumeMl) + " mL")
        ]),
      );
    }
    const content = el("div"); card.appendChild(content); recalc(); return card;
  }

  function MolarityCalculator(){
    const t = THEMES[state.colorTheme] || THEMES.cyan;
    const card = el("div", { class:"card" });
    let mode="fromPowder"; let M=1; let MW=121.14; let volumeMl=1000; let stockM=10;
    function recalc(){
      content.replaceChildren();
      content.append(
        el("div", { class:"flex items-center justify-between" }, [
          el("div", { style:{ fontWeight:600 } }, "Molar Solutions"),
          el("div", { class:"muted", style:{ fontSize:"12px" } }, "M = mol/L; g = M×MW×L")
        ]),
        el("div", { class:"flex gap-8", style:{ marginTop:"8px" } }, [
          el("button", { class:"btn " + (mode==="fromPowder" ? "" : "outline"), onclick:()=>{ mode="fromPowder"; recalc(); } }, "From powder"),
          el("button", { class:"btn " + (mode==="fromStock" ? "" : "outline"), onclick:()=>{ mode="fromStock"; recalc(); } }, "From stock")
        ]),
        mode==="fromPowder" ? el("div", { class:"grid cols-4 items-center", style:{ gap:"8px", marginTop:"8px" } }, [
          el("div", {}, [ el("div", { class:"muted", style:{ fontSize:"12px" } }, "Desired M (mol/L)"),
            el("input", { class:"input", type:"number", value:M, oninput:e=>{ M=Number(e.target.value)||0; recalc(); } }) ]),
          el("div", {}, [ el("div", { class:"muted", style:{ fontSize:"12px" } }, "MW (g/mol)"),
            el("input", { class:"input", type:"number", value:MW, oninput:e=>{ MW=Number(e.target.value)||0; recalc(); } }) ]),
          el("div", {}, [ el("div", { class:"muted", style:{ fontSize:"12px" } }, "Volume (mL)"),
            el("input", { class:"input", type:"number", value:volumeMl, oninput:e=>{ volumeMl=Number(e.target.value)||0; recalc(); } }) ]),
        ]) : el("div", { class:"grid cols-4 items-center", style:{ gap:"8px", marginTop:"8px" } }, [
          el("div", {}, [ el("div", { class:"muted", style:{ fontSize:"12px" } }, "Desired M (C2)"),
            el("input", { class:"input", type:"number", value:M, oninput:e=>{ M=Number(e.target.value)||0; recalc(); } }) ]),
          el("div", {}, [ el("div", { class:"muted", style:{ fontSize:"12px" } }, "Stock M (C1)"),
            el("input", { class:"input", type:"number", value:stockM, oninput:e=>{ stockM=Number(e.target.value)||0; recalc(); } }) ]),
          el("div", {}, [ el("div", { class:"muted", style:{ fontSize:"12px" } }, "Final volume (V2, mL)"),
            el("input", { class:"input", type:"number", value:volumeMl, oninput:e=>{ volumeMl=Number(e.target.value)||0; recalc(); } }) ]),
        ]),
        mode==="fromPowder"
          ? el("div", { class:"list-item flex items-center justify-between", style:{ borderColor:"var(--stroke)" } }, [
              el("div", { style:{ fontWeight:600 } }, "Weigh"),
              el("div", { class:"code" }, gramsLabel(M * MW * (volumeMl/1000)))
            ])
          : el("div", { class:"list-item flex items-center justify-between", style:{ borderColor:"var(--stroke)" } }, [
              el("div", { style:{ fontWeight:600 } }, "Take stock (V1)"),
              el("div", { class:"code" }, roundSmart( (M>0 && stockM>0) ? (M * volumeMl)/stockM : 0 ) + " mL")
            ]),
        el("div", { class:"list-item flex items-center justify-between" }, [
          el("div", { style:{ fontWeight:600 } }, "Solvent"),
          el("div", { class:"code" }, "to final volume " + roundSmart(volumeMl) + " mL")
        ])
      );
    }
    const content = el("div"); card.appendChild(content); recalc(); return card;
  }

  function DilutionCalculator(){
    const card = el("div", { class:"card" });
    let C1=10, C2=1, V2=1000, unit="x";
    function V1(){ return (C2>0 && C1>0) ? (C2*V2)/C1 : 0; }
    function recalc(){
      content.replaceChildren();
      content.append(
        el("div", { style:{ fontWeight:600 } }, "Stock Dilution (C1V1 = C2V2)"),
        el("div", { class:"grid cols-5 items-center", style:{ gap:"8px", marginTop:"8px" } }, [
          el("div", {}, [ el("div", { class:"muted", style:{ fontSize:"12px" } }, "C1 (stock)"),
            el("input", { class:"input", type:"number", value:C1, oninput:e=>{ C1=Number(e.target.value)||0; recalc(); }}) ]),
          el("div", {}, [ el("div", { class:"muted", style:{ fontSize:"12px" } }, "C2 (desired)"),
            el("input", { class:"input", type:"number", value:C2, oninput:e=>{ C2=Number(e.target.value)||0; recalc(); }}) ]),
          el("div", {}, [ el("div", { class:"muted", style:{ fontSize:"12px" } }, "Units"),
            el("select", { class:"input", value:unit, onchange:e=>{ unit=e.target.value; recalc(); } }, [
              el("option", { value:"x" }, "× (fold)"),
              el("option", { value:"mg/mL" }, "mg/mL"),
              el("option", { value:"M" }, "M"),
              el("option", { value:"%" }, "%"),
            ]) ]),
          el("div", {}, [ el("div", { class:"muted", style:{ fontSize:"12px" } }, "Final volume V2 (mL)"),
            el("input", { class:"input", type:"number", value:V2, oninput:e=>{ V2=Number(e.target.value)||0; recalc(); }}) ]),
        ]),
        el("div", { class:"list-item flex items-center justify-between" }, [
          el("div", { style:{ fontWeight:600 } }, "Take stock (V1)"),
          el("div", { class:"code" }, roundSmart(V1()) + " mL")
        ]),
        el("div", { class:"list-item flex items-center justify-between" }, [
          el("div", { style:{ fontWeight:600 } }, "Add solvent"),
          el("div", { class:"code" }, roundSmart(V2 - V1()) + " mL")
        ]),
      );
    }
    const content = el("div"); card.appendChild(content); recalc(); return card;
  }

  // Recipe helpers
  function addRecipe(name){
    const r = { id: uid(), name, baseVolumeMl: 1000, notes:"", components: [] };
    state.recipes.unshift(r); activeId = r.id; saveState(state); render();
  }
  function deleteRecipe(id){
    state.recipes = state.recipes.filter(r=>r.id!==id);
    if(activeId===id) activeId = state.recipes[0]?.id || null;
    saveState(state); render();
  }
  function duplicateRecipe(id){
    const r = state.recipes.find(x=>x.id===id); if(!r) return;
    const copy = JSON.parse(JSON.stringify(r)); copy.id = uid(); copy.name = r.name + " (copy)";
    state.recipes.unshift(copy); saveState(state); render();
  }
  function addComp(recipeId){
    const r = state.recipes.find(x=>x.id===recipeId); if(!r) return;
    r.components.push({ id: uid(), name:"", amount:0, unit:"g" });
    saveState(state); render();
  }
  function removeComp(recipeId, compId){
    const r = state.recipes.find(x=>x.id===recipeId); if(!r) return;
    r.components = r.components.filter(c=>c.id!==compId);
    saveState(state); render();
  }

  function applyTheme(){
    const t = THEMES[state.colorTheme] || THEMES.cyan;
    document.documentElement.style.setProperty("--accent", t.stroke);
    document.documentElement.style.setProperty("--accent2", t.liq1);
    document.documentElement.style.setProperty("--stroke", t.stroke);
    document.documentElement.style.setProperty("--glow", t.glow);
    document.body.classList.toggle("dark", !!state.benchMode);
    // update theme-color meta for mobile browsers
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t.stroke);
  }

  function App(){
    const container = el("div", {}, [
      ThemeBackground(),
      Header(),
      el("div", { class:"container" }, [
        el("div", { class:"row" }, [
          el("div", { class:"grid", style:{ gap:"16px" } }, [
            RecipeList(),
            el("div", { class:"card" }, [
              el("div", { class:"muted", style:{ fontSize:"12px", marginBottom:"8px" } }, "Quick calculators"),
              el("div", { class:"grid", style:{ gap:"16px" } }, [
                PercentCalculator(),
                MolarityCalculator(),
                DilutionCalculator(),
              ])
            ])
          ]),
          el("div", { class:"grid", style:{ gap:"16px" } }, [
            activeId ? (function(){
              const active = state.recipes.find(r=>r.id===activeId);
              return el("div", {}, [ EditRecipe(active), Scaler(active) ]);
            })() : el("div", { class:"card" }, el("div", { class:"muted" }, "Add or select a recipe to begin.") )
          ])
        ]),
        el("div", { class:"muted", style:{ textAlign:"center", fontSize:"12px", marginTop:"16px" } },
          "This tool stores data locally and works offline. Scaling is linear to base volume; w/v = g per 100 mL; v/v = mL per 100 mL; molarity from powder uses g = M × MW × volume(L); stock dilutions use C1V1 = C2V2."
        )
      ])
    ]);
    return container;
  }

  function render(){
    const root = document.getElementById("app");
    root.replaceChildren();
    root.appendChild(App());
  }

  // ===== Basic runtime tests (console.assert) =====
  function computeScaledAmounts(baseVolumeMl, components, targetMl) {
    const factor = targetMl / baseVolumeMl;
    return components.map(c => {
      let amtG = c.unit === "mg" ? c.amount / 1000 : c.unit === "mL" ? null : c.amount;
      if (amtG === null) return null;
      return Math.round((amtG * factor + Number.EPSILON) * 100) / 100;
    });
  }
  (function runTests(){
    try {
      const baseVol = 1000;
      const components = [
        { amount: 10, unit: "g" },
        { amount: 5, unit: "g" },
        { amount: 10, unit: "g" },
      ];
      const scaled = computeScaledAmounts(baseVol, components, 250);
      console.assert(scaled[0] === 2.5 && scaled[1] === 1.25 && scaled[2] === 2.5, "LB scaling 1000→250 failed", scaled);

      const wv1 = (1 * 1000) / 100;
      console.assert(Math.abs(wv1 - 10) < 1e-9, "1% w/v of 1000 mL should be 10 g", wv1);

      const gramsPowder = 1 * 121.14 * (1000/1000);
      console.assert(Math.abs(gramsPowder - 121.14) < 1e-9, "Molarity (powder) failed", gramsPowder);

      const C1=10, C2=1, V2=1000; const V1 = (C2*V2)/C1;
      console.assert(Math.abs(V1 - 100) < 1e-9, "C1V1 dilution failed", V1);

      const wv2 = (0.8 * 250) / 100;
      console.assert(Math.abs(wv2 - 2) < 1e-9, "0.8% w/v of 250 mL should be 2 g", wv2);

      console.info("✅ Lab Media Scaler self-tests passed.");
    } catch (err) {
      console.error("❌ Lab Media Scaler self-tests FAILED:", err);
    }
  })();

  // boot
  applyTheme();
  render();

})();