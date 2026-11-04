class TempleBattleView {
  constructor(root,{onHit}={}) { this.root=root;this.lastAction=null;this.onHit=onHit;this.effectTimer=null; }
  update(state) {
    if(!state)return;
    const get=id=>this.root.querySelector(`#${id}`);
    get('duelRound').textContent=`HIỆP ${state.round}`;
    get('heroScore').textContent=state.wins;get('demonScore').textContent=state.losses;
    for(const side of ['hero','demon']) {
      get(`${side}Health`).style.width=`${state[`${side}Hp`]}%`;
      get(`${side}Hp`).textContent=state[`${side}Hp`];
    }
    get('battleEnergy').style.width=`${state.energy}%`;
    get('battleSupport').textContent=state.supporter ? `${state.supporter.user} vừa tiếp sức ✦` : 'Tim +8 · Bình luận +12 · Quà +18 năng lượng';
    const finished=state.phase==='finished';
    this.root.classList.toggle('round-finished',finished);
    get('duelResult').textContent=finished ? (state.winner==='hero'?'HỘ PHÁP CHIẾN THẮNG':'YÊU QUÁI THẮNG HIỆP NÀY') : '';
    get('heroFighter').classList.toggle('defeated',finished&&state.winner!=='hero');
    get('demonFighter').classList.toggle('defeated',finished&&state.winner!=='demon');
    const action=state.action;
    if(!action||action.id===this.lastAction)return;
    const first=this.lastAction===null;this.lastAction=action.id;
    if(first||action.kind==='ready')return;
    clearTimeout(this.effectTimer);
    const hero=get('heroFighter'), demon=get('demonFighter');
    for(const el of [hero,demon])el.classList.remove('attacking','hit','dodging');
    const attacker=action.side==='hero'?hero:demon,target=action.side==='hero'?demon:hero;
    void attacker.offsetWidth;attacker.classList.add('attacking');
    target.classList.add(action.kind==='dodge'?'dodging':'hit');
    const projectile=get('duelProjectile');projectile.className=`duel-projectile flying from-${action.side} ${action.kind==='ultimate'?'charged':''}`;
    void projectile.offsetWidth;
    // Recreate animation even when the same kind of attack repeats.
    projectile.style.animation='none';void projectile.offsetWidth;projectile.style.animation='';
    const impact=get('duelImpact');impact.className=`duel-impact impact-${action.side}`;
    impact.textContent=action.kind==='dodge'?'NÉ ĐÒN':`${action.kind==='ultimate'?'PHÁP ẤN ':action.kind==='critical'?'BẠO KÍCH ':''}−${action.damage}`;
    void impact.offsetWidth;impact.classList.add('pop');
    if(this.onHit&&action.damage)this.onHit(action.kind);
    this.effectTimer=setTimeout(()=>{for(const el of [hero,demon])el.classList.remove('attacking','hit','dodging');projectile.classList.remove('flying');impact.classList.remove('pop');},750);
  }
}
window.TempleBattleView=TempleBattleView;
