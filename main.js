/* ============================================================
   工具
   ============================================================ */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let toastTimer = null;
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ============================================================
   开场加载过场
   ============================================================ */
function hidePreloader(){
  const p = $('#preloader');
  if(!p) return;
  if(reduceMotion){ p.remove(); return; }
  setTimeout(() => p.classList.add('done'), 650);
  setTimeout(() => p.remove(), 1400);
}
window.addEventListener('load', hidePreloader);
/* 兜底：即便 load 事件异常也最迟关闭 */
setTimeout(hidePreloader, 2800);

/* ============================================================
   滚动揭示（reveal）+ 循序渐进（stagger）
   ============================================================ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if(en.isIntersecting){
      en.target.classList.add('in');
      revealObserver.unobserve(en.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
$$('.reveal, .stagger').forEach(el => revealObserver.observe(el));

/* ============================================================
   技能条增长
   ============================================================ */
const skillObserver = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if(en.isIntersecting){
      const lv = en.target.dataset.level;
      if(reduceMotion){ en.target.style.transition = 'none'; }
      requestAnimationFrame(() => { en.target.style.width = lv + '%'; });
      skillObserver.unobserve(en.target);
    }
  });
}, { threshold: 0.4 });
$$('.skill-fill').forEach(el => skillObserver.observe(el));

/* ============================================================
   数字计数动画
   ============================================================ */
function animateCount(el){
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || '';
  if(reduceMotion){ el.textContent = target + suffix; return; }
  const duration = 1100;
  const start = performance.now();
  function tick(now){
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if(p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const countObserver = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if(en.isIntersecting){
      animateCount(en.target);
      countObserver.unobserve(en.target);
    }
  });
}, { threshold: 0.5 });
$$('[data-count]').forEach(el => countObserver.observe(el));

/* ============================================================
   通用弹窗
   ============================================================ */
const modalMask = $('#modalMask');
const modalBox  = $('#modalBox');
function openModal(html){
  modalBox.innerHTML =
    '<button type="button" class="modal-close" data-close>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' + html;
  modalMask.classList.add('open');
}
function closeModal(){ modalMask.classList.remove('open'); modalBox.innerHTML = ''; }
modalMask.addEventListener('click', e => {
  if(e.target === modalMask || e.target.closest('[data-close]')) closeModal();
});
document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && modalMask.classList.contains('open')) closeModal();
});

/* ============================================================
   项目详情
   ============================================================ */
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-detail]');
  if(!btn) return;
  const card = btn.closest('.project-card');
  const img  = card.querySelector('img').src;
  const name = card.querySelector('.project-name').textContent;
  const desc = card.querySelector('.project-desc').textContent;
  const tags = $$('.project-tags span', card).map(s => s.textContent);
  openModal(
    '<img class="detail-img" src="' + img + '" alt="' + name + '">' +
    '<h3>' + name + '</h3>' +
    '<div class="detail-tags">' + tags.map(t => '<span>' + t + '</span>').join('') + '</div>' +
    '<p class="detail-text">' + desc + '</p>' +
    '<dl class="detail-meta">' +
      '<div><dt>项目角色</dt><dd>算法设计与工程实现</dd></div>' +
      '<div><dt>交付内容</dt><dd>模型、训练代码、评测与部署文档</dd></div>' +
      '<div><dt>补充说明</dt><dd>源码、论文与演示细节可通过联系方式与我沟通</dd></div>' +
    '</dl>'
  );
});

/* ============================================================
   一键复制
   ============================================================ */
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-copy]');
  if(!btn) return;
  const text = btn.closest('.contact-card').querySelector('.contact-value').textContent.trim();
  function ok(){ toast('已复制：' + text); }
  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(text).then(ok).catch(fallback);
  }else{ fallback(); }
  function fallback(){
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); ok(); }catch(err){ toast('复制失败，请手动选择文字'); }
    document.body.removeChild(ta);
  }
});

/* ============================================================
   留言表单（静态版：通过邮件客户端发送）
   ============================================================ */
const EMAIL = 'lizhengmiao@example.com';
$('#contactForm').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target;
  const name = form.name.value.trim();
  const from = form.email.value.trim();
  const msg  = form.message.value.trim();
  const subject = encodeURIComponent('来自个人主页的留言 · ' + name);
  const body = encodeURIComponent('称呼：' + name + '\n回复邮箱：' + from + '\n\n留言内容：\n' + msg);
  window.location.href = 'mailto:' + EMAIL + '?subject=' + subject + '&body=' + body;
  form.reset();
  toast('已为你打开邮件客户端，若未打开请直接发邮件至 ' + EMAIL);
});

/* ============================================================
   导航高亮
   ============================================================ */
const navItems = $$('.nav-item');
const sections = $$('.section');
const navObserver = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if(en.isIntersecting){
      const id = en.target.id;
      navItems.forEach(n => n.classList.toggle('active', n.getAttribute('href') === '#' + id));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => navObserver.observe(s));

/* ============================================================
   回到顶部
   ============================================================ */
const backTop = $('#backTop');
window.addEventListener('scroll', () => {
  backTop.classList.toggle('show', window.scrollY > 500);
}, { passive: true });
backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
