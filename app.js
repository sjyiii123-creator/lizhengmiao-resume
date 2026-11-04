
/* ============================================================
   0. 工具与常量
   ============================================================ */
const $  = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
const STORE_KEY = 'lzm-resume-state-v1';
const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%230E2A47'/%3E%3Ccircle cx='80' cy='38' r='13' fill='none' stroke='%2338BDF8' stroke-width='2'/%3E%3Cpath d='M40 72l22-20 16 14 18-16 24 22' fill='none' stroke='%2338BDF8' stroke-width='2'/%3E%3C/svg%3E";

const ICONS = {
  del: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>',
  img: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="M21 15l-5-4-7 6"/></svg>',
  add: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'
};

let toastTimer = null;
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2200);
}
let saveTimer = null;
function scheduleSave(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=>{
    try{
      localStorage.setItem(STORE_KEY, JSON.stringify(serializeState()));
    }catch(e){ toast('保存失败：浏览器存储不可用'); }
  }, 400);
}

/* ============================================================
   1. 编辑模式开关
   ============================================================ */
let editMode = false;
function setEditable(scope, on){
  $$('[data-editable]', scope).forEach(el=>el.setAttribute('contenteditable', on?'true':'false'));
}
function toggleEdit(on){
  editMode = on;
  document.body.classList.toggle('edit-mode', on);
  setEditable(document, on);
  $('#editToggle').classList.toggle('on', on);
  if(on){ toast('已进入编辑模式，点击文字即可修改'); }
  else{
    scheduleSave();
    toast('已退出编辑模式，内容已保存');
  }
}
$('#editToggle').addEventListener('click', ()=>toggleEdit(!editMode));
$('#doneBtn').addEventListener('click', ()=>toggleEdit(false));

/* 粘贴强制纯文本，避免带入外部样式 */
document.addEventListener('paste', e=>{
  if(!e.target.closest('[data-editable]')) return;
  e.preventDefault();
  const text = (e.clipboardData||window.clipboardData).getData('text/plain');
  document.execCommand('insertText', false, text);
});

/* ============================================================
   2. 文本编辑（事件委托）
   ============================================================ */
document.addEventListener('input', e=>{
  if(e.target.matches('[data-editable]')){ scheduleSave(); }
  if(e.target.matches('[data-level-range]')){
    const item = e.target.closest('.skill-item');
    const v = parseInt(e.target.value,10);
    item.querySelector('.skill-fill').style.width = v+'%';
    item.querySelector('.skill-fill').dataset.level = v;
    item.querySelector('.skill-pct').textContent = v+'%';
    scheduleSave();
  }
});

/* ============================================================
   3. 删除块（事件委托）
   ============================================================ */
document.addEventListener('click', e=>{
  const delBtn = e.target.closest('[data-del]');
  if(delBtn){
    const block = delBtn.closest('.block');
    const type = delBtn.dataset.del;
    const label = {exp:'这段工作经历',project:'这个项目',skill:'这项技能',edu:'这条教育经历'}[type]||'该条目';
    if(confirm('确定删除'+label+'吗？')){
      block.remove();
      scheduleSave();
      toast('已删除');
    }
    return;
  }
});

/* ============================================================
   4. 模板：新增条目
   ============================================================ */
function expTemplate(){
  const d = document.createElement('div');
  d.className = 'tl-item block reveal in';
  d.innerHTML =
    '<div class="block-ops"><button type="button" class="del-btn" data-del="exp">'+ICONS.del+'删除</button></div>'+
    '<span class="tl-dot" aria-hidden="true"></span>'+
    '<div class="tl-card"><div class="tl-top">'+
      '<span class="tl-role" data-editable="true" data-field="role">职位名称（请填写）</span>'+
      '<span class="tl-company" data-editable="true" data-field="company">公司名称（请填写）</span>'+
      '<span class="tl-date" data-editable="true" data-field="date">起止时间</span>'+
    '</div><ul>'+
      '<li data-editable="true" data-field="li1"><span class="li-dot" aria-hidden="true"></span>工作成果与职责描述，请替换为真实内容。</li>'+
      '<li data-editable="true" data-field="li2"><span class="li-dot" aria-hidden="true"></span>尽量用具体动作与量化结果表达。</li>'+
    '</ul></div>';
  return d;
}
function projectTemplate(){
  const d = document.createElement('article');
  d.className = 'project-card block reveal in';
  d.innerHTML =
    '<div class="block-ops">'+
      '<button type="button" class="img-btn" data-img-change>'+ICONS.img+'换图</button>'+
      '<button type="button" class="del-btn" data-del="project">'+ICONS.del+'删除</button>'+
    '</div>'+
    '<div class="project-img"><img src="'+PLACEHOLDER_IMG+'" alt="项目图片"></div>'+
    '<div class="project-body">'+
      '<h3 class="project-name" data-editable="true" data-field="projectName">项目名称（请填写）</h3>'+
      '<div class="project-tags"><span>技术标签</span></div>'+
      '<p class="project-desc" data-editable="true" data-field="projectDesc">项目简介：背景、你的职责与最终成果，请替换为真实内容。</p>'+
      '<button type="button" class="project-more" data-detail>查看项目详情'+
        '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>'+
    '</div>';
  return d;
}
function skillTemplate(name='新技能', level=60){
  const d = document.createElement('div');
  d.className = 'skill-item block';
  d.innerHTML =
    '<div class="block-ops"><button type="button" class="del-btn" data-del="skill">'+ICONS.del+'删除</button></div>'+
    '<div class="skill-meta"><span class="skill-name" data-editable="true" data-field="skillName">'+name+'</span><span class="skill-pct">'+level+'%</span></div>'+
    '<div class="skill-bar"><div class="skill-fill" data-level="'+level+'"></div></div>'+
    '<div class="skill-range"><input type="range" min="0" max="100" value="'+level+'" data-level-range></div>';
  return d;
}
function eduTemplate(){
  const d = document.createElement('div');
  d.className = 'edu-item block reveal in';
  d.innerHTML =
    '<div class="block-ops"><button type="button" class="del-btn" data-del="edu">'+ICONS.del+'删除</button></div>'+
    '<div class="edu-badge"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 9L12 4 2 9l10 5 10-5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg></div>'+
    '<div class="edu-card"><div class="edu-top">'+
      '<span class="edu-school" data-editable="true" data-field="school">学校名称（请填写）</span>'+
      '<span class="edu-date" data-editable="true" data-field="date">起止时间</span>'+
    '</div><div class="edu-degree" data-editable="true" data-field="degree">学院 · 专业 · 学位</div>'+
    '<p class="edu-desc" data-editable="true" data-field="eduDesc">主修课程、研究方向与在校成果，请替换为真实内容。</p></div>';
  return d;
}

/* ============================================================
   5. 添加按钮
   ============================================================ */
$('#addExp').addEventListener('click', ()=>{
  const node = expTemplate();
  $('#expList').appendChild(node);
  afterInsert(node);
});
$('#addProject').addEventListener('click', ()=>{
  const node = projectTemplate();
  $('#projectGrid').appendChild(node);
  afterInsert(node);
});
$('#addEdu').addEventListener('click', ()=>{
  const node = eduTemplate();
  $('#eduList').appendChild(node);
  afterInsert(node);
});
$$('[data-add-skill]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const group = btn.closest('.skill-group').querySelector('[data-skill-group]');
    const node = skillTemplate();
    group.appendChild(node);
    afterInsert(node);
    const fill = node.querySelector('.skill-fill');
    fill.style.width = fill.dataset.level+'%';
  });
});
function afterInsert(node){
  setEditable(node, editMode);
  revealObserver.observe(node);
  scheduleSave();
}

/* ============================================================
   6. 通用弹窗
   ============================================================ */
const modalMask = $('#modalMask');
const modalBox  = $('#modalBox');
function openModal(html){
  modalBox.innerHTML =
    '<button type="button" class="modal-close" data-close>'+
      '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>'+html;
  modalMask.classList.add('open');
}
function closeModal(){ modalMask.classList.remove('open'); modalBox.innerHTML=''; }
modalMask.addEventListener('click', e=>{
  if(e.target===modalMask || e.target.closest('[data-close]')) closeModal();
});
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && modalMask.classList.contains('open')) closeModal(); });

/* ---------- 图片更换面板（项目图 / 头像） ---------- */
function imageChangeModal(onConfirm){
  openModal(
    '<h3>更换图片</h3>'+
    '<label>方式一：粘贴图片链接（https 开头）</label>'+
    '<input type="url" id="imgUrl" placeholder="https://example.com/image.jpg">'+
    '<label>方式二：从本设备选择图片（自动转为本地数据）</label>'+
    '<input type="file" id="imgFile" accept="image/*">'+
    '<div class="modal-actions">'+
      '<button type="button" class="btn-primary" id="imgConfirm">确认更换</button>'+
      '<button type="button" class="btn-ghost" data-close>取消</button>'+
    '</div>'
  );
  let picked = '';
  $('#imgFile').addEventListener('change', ev=>{
    const file = ev.target.files[0];
    if(!file) return;
    if(file.size > 4*1024*1024){ toast('图片建议小于 4MB，以免本地存储超限'); }
    const reader = new FileReader();
    reader.onload = ()=>{ picked = reader.result; toast('已读取本地图片，点击确认更换'); };
    reader.readAsDataURL(file);
  });
  $('#imgConfirm').addEventListener('click', ()=>{
    const url = $('#imgUrl').value.trim();
    const src = url || picked;
    if(!src){ toast('请先粘贴链接或选择本地图片'); return; }
    onConfirm(src);
    closeModal();
    scheduleSave();
    toast('图片已更换');
  });
}

document.addEventListener('click', e=>{
  const imgBtn = e.target.closest('[data-img-change]');
  if(imgBtn){
    const img = imgBtn.closest('.project-card').querySelector('img');
    imageChangeModal(src=>{ img.src = src; });
    return;
  }
  if(e.target.closest('#avatarEdit')){
    imageChangeModal(src=>{
      const box = $('#avatarBox');
      const old = box.querySelector('svg,img');
      const im = document.createElement('img');
      im.src = src; im.alt='头像';
      im.style.cssText='width:100%;height:100%;object-fit:cover';
      box.replaceChild(im, old);
    });
  }
});

/* ---------- 项目详情 ---------- */
document.addEventListener('click', e=>{
  const btn = e.target.closest('[data-detail]');
  if(btn && !editMode){
    const card = btn.closest('.project-card');
    const img  = card.querySelector('img').src;
    const name = card.querySelector('.project-name').textContent;
    const desc = card.querySelector('.project-desc').textContent;
    const tags = $$('.project-tags span', card).map(s=>s.textContent);
    openModal(
      '<img class="detail-img" src="'+img+'" alt="'+name+'">'+
      '<h3>'+name+'</h3>'+
      '<div class="detail-tags">'+tags.map(t=>'<span>'+t+'</span>').join('')+'</div>'+
      '<p class="detail-text">'+desc+'</p>'+
      '<dl class="detail-meta">'+
        '<div><dt>项目角色</dt><dd>算法设计与工程实现</dd></div>'+
        '<div><dt>交付内容</dt><dd>模型、训练代码、评测与部署文档</dd></div>'+
        '<div><dt>补充说明</dt><dd>源码、论文与演示细节可通过联系方式与我沟通</dd></div>'+
      '</dl>'
    );
  }
});

/* ============================================================
   7. 一键复制
   ============================================================ */
document.addEventListener('click', e=>{
  const btn = e.target.closest('[data-copy]');
  if(!btn) return;
  const text = btn.closest('.contact-card').querySelector('.contact-value').textContent.trim();
  function ok(){ toast('已复制：'+text); }
  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(text).then(ok).catch(fallback);
  }else{ fallback(); }
  function fallback(){
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); ok(); }catch(err){ toast('复制失败，请手动选择文字'); }
    document.body.removeChild(ta);
  }
});

/* ---------- 留言表单（静态演示） ---------- */
$('#contactForm').addEventListener('submit', e=>{
  e.preventDefault();
  e.target.reset();
  toast('留言功能为前端演示，未连接后端，可直接通过邮箱或电话联系我');
});

/* ============================================================
   8. 滚动揭示 / 技能条动画 / 导航高亮
   ============================================================ */
const revealObserver = new IntersectionObserver(entries=>{
  entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); revealObserver.unobserve(en.target); } });
},{threshold:.12});
$$('.reveal').forEach(el=>revealObserver.observe(el));

const skillObserver = new IntersectionObserver(entries=>{
  entries.forEach(en=>{
    if(en.isIntersecting){
      const lv = en.target.dataset.level;
      requestAnimationFrame(()=>{ en.target.style.width = lv+'%'; });
      skillObserver.unobserve(en.target);
    }
  });
},{threshold:.4});
$$('.skill-fill').forEach(el=>skillObserver.observe(el));

const navItems = $$('.nav-item');
const sections = $$('.section');
const navObserver = new IntersectionObserver(entries=>{
  entries.forEach(en=>{
    if(en.isIntersecting){
      const id = en.target.id;
      navItems.forEach(n=>n.classList.toggle('active', n.getAttribute('href')==='#'+id));
    }
  });
},{rootMargin:'-45% 0px -50% 0px'});
sections.forEach(s=>navObserver.observe(s));

/* ---------- 回到顶部 ---------- */
const backTop = $('#backTop');
window.addEventListener('scroll', ()=>{
  backTop.classList.toggle('show', window.scrollY > 500);
},{passive:true});
backTop.addEventListener('click', ()=>window.scrollTo({top:0,behavior:'smooth'}));

/* ============================================================
   9. 序列化 / 应用（DOM 为真相源，localStorage 持久化）
   ============================================================ */
function serializeState(){
  const sideName = $('.side-name');
  const avatarImg = $('#avatarBox img');
  return {
    v:1,
    side:{
      name: sideName.textContent,
      title: $('.side-title').textContent,
      tagline: $('.side-tagline').textContent,
      location: $('.side-meta [data-field="location"]').textContent,
      availability: $('.side-meta [data-field="availability"]').textContent,
      avatar: avatarImg ? avatarImg.src : null
    },
    about:{
      kicker: $('.hero-kicker').textContent,
      name: $('#about [data-field="heroName"]').textContent,
      text: $('#about [data-field="heroText"]').textContent,
      research: $('#about [data-field="researchText"]').textContent
    },
    exp: $$('#expList .tl-item').map(it=>({
      role: it.querySelector('[data-field="role"]').textContent,
      company: it.querySelector('[data-field="company"]').textContent,
      date: it.querySelector('[data-field="date"]').textContent,
      lis: $$('.tl-card li', it).map(li=>li.textContent)
    })),
    skillGroups: $$('#skillWrap .skill-group').map(g=>
      $$('[data-skill-group] .skill-item', g).map(it=>({
        name: it.querySelector('.skill-name').textContent,
        level: parseInt(it.querySelector('.skill-fill').dataset.level,10)
      }))
    ),
    projects: $$('#projectGrid .project-card').map(c=>({
      img: c.querySelector('img').src,
      name: c.querySelector('.project-name').textContent,
      tags: $$('.project-tags span', c).map(s=>s.textContent),
      desc: c.querySelector('.project-desc').textContent
    })),
    edu: $$('#eduList .edu-item').map(it=>({
      school: it.querySelector('[data-field="school"]').textContent,
      date: it.querySelector('[data-field="date"]').textContent,
      degree: it.querySelector('[data-field="degree"]').textContent,
      desc: it.querySelector('[data-field="eduDesc"]').textContent
    })),
    contacts: $$('#contactGrid .contact-value').map(el=>el.textContent)
  };
}

function applyState(st){
  /* 侧边栏 */
  $('.side-name').textContent = st.side.name;
  $('.side-title').textContent = st.side.title;
  $('.side-tagline').textContent = st.side.tagline;
  $('.side-meta [data-field="location"]').textContent = st.side.location;
  $('.side-meta [data-field="availability"]').textContent = st.side.availability;
  if(st.side.avatar){
    const box = $('#avatarBox');
    const old = box.querySelector('svg,img');
    if(old){
      const im = document.createElement('img');
      im.src = st.side.avatar; im.alt='头像';
      im.style.cssText='width:100%;height:100%;object-fit:cover';
      box.replaceChild(im, old);
    }
  }
  /* 关于我 */
  $('.hero-kicker').textContent = st.about.kicker;
  $('#about [data-field="heroName"]').textContent = st.about.name;
  $('#about [data-field="heroText"]').textContent = st.about.text;
  $('#about [data-field="researchText"]').textContent = st.about.research;

  /* 工作经历 */
  $('#expList').innerHTML = st.exp.map(x=>{
    const node = expTemplate();
    node.querySelector('[data-field="role"]').textContent = x.role;
    node.querySelector('[data-field="company"]').textContent = x.company;
    node.querySelector('[data-field="date"]').textContent = x.date;
    const ul = node.querySelector('ul');
    ul.innerHTML = x.lis.map(t=>'<li data-editable="true" data-field="li"><span class="li-dot" aria-hidden="true"></span>'+t+'</li>').join('');
    return node.outerHTML;
  }).join('');

  /* 技能：按现有 group 顺序回填 */
  $$('#skillWrap .skill-group').forEach((g, i)=>{
    const list = g.querySelector('[data-skill-group]');
    const rows = (st.skillGroups[i]||[]).map(x=>{
      const node = skillTemplate(x.name, x.level);
      return node.outerHTML;
    }).join('');
    list.innerHTML = rows;
  });

  /* 项目 */
  $('#projectGrid').innerHTML = st.projects.map(x=>{
    const node = projectTemplate();
    node.querySelector('img').src = x.img;
    node.querySelector('.project-name').textContent = x.name;
    node.querySelector('.project-tags').innerHTML = x.tags.map(t=>'<span>'+t+'</span>').join('');
    node.querySelector('.project-desc').textContent = x.desc;
    return node.outerHTML;
  }).join('');

  /* 教育 */
  $('#eduList').innerHTML = st.edu.map(x=>{
    const node = eduTemplate();
    node.querySelector('[data-field="school"]').textContent = x.school;
    node.querySelector('[data-field="date"]').textContent = x.date;
    node.querySelector('[data-field="degree"]').textContent = x.degree;
    node.querySelector('[data-field="eduDesc"]').textContent = x.desc;
    return node.outerHTML;
  }).join('');

  /* 联系方式 */
  $$('#contactGrid .contact-value').forEach((el,i)=>{
    if(st.contacts[i]!==undefined) el.textContent = st.contacts[i];
  });

  /* 重建后同步编辑态与观察器 */
  setEditable(document, editMode);
  $$('.reveal').forEach(el=>{ el.classList.add('in'); });
  $$('.skill-fill').forEach(f=>{ f.style.width = f.dataset.level+'%'; });
}

/* ============================================================
   10. 导出 / 导入 / 恢复默认
   ============================================================ */
$('#exportBtn').addEventListener('click', ()=>{
  const data = JSON.stringify(serializeState(), null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'lizhengmiao-resume.json';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(a.href);
  toast('已导出简历数据 JSON');
});
$('#importBtn').addEventListener('click', ()=>$('#importFile').click());
$('#importFile').addEventListener('change', e=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const st = JSON.parse(reader.result);
      if(st.v!==1 || !st.side || !st.projects) throw new Error('bad');
      applyState(st);
      localStorage.setItem(STORE_KEY, JSON.stringify(st));
      closeModal();
      toast('已导入简历数据');
    }catch(err){ toast('导入失败：文件格式不符合简历数据规范'); }
  };
  reader.readAsText(file);
  e.target.value='';
});
$('#resetBtn').addEventListener('click', ()=>{
  if(confirm('恢复默认将清除你在本浏览器中的全部修改，确定继续吗？')){
    localStorage.removeItem(STORE_KEY);
    location.reload();
  }
});

/* ============================================================
   11. 启动：读取本地数据
   ============================================================ */
(function init(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw){
      const st = JSON.parse(raw);
      if(st && st.v===1){ applyState(st); }
    }
  }catch(e){ /* 存储不可用时静默使用默认内容 */ }
})();
