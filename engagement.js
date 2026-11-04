const PROMPTS = [
  'Chào cả nhà đến với không gian bình an. Hãy để lại một lời chúc tốt lành cho người bạn thương nhé.',
  'Bạn đang xem từ đâu? Hãy chào cả nhà trong phần bình luận để chúng ta cùng kết nối nhé.',
  'Một nhịp thở chậm, một tâm niệm lành. Mời cả nhà cùng dành một phút thư giãn.',
  'Muốn thắp hương, bạn có thể bình luận dâng hương. Muốn gieo quẻ giải trí, hãy viết xin xăm nhé.',
  'Cảm ơn cả nhà đã ở lại và lan tỏa những lời tử tế. Chúc mọi người một buổi tối an yên.',
  'Nếu muốn ủng hộ phiên live, bạn có thể mở mục Quà tặng. Tên bạn sẽ được cảm ơn cùng một hiệu ứng riêng trên màn hình.',
  'Cả nhà có thể thả tim để gửi một lời chúc bình an đến những người đang cùng xem nhé.'
];

// Keep named acknowledgements until spoken; visual reactions remain immediate.
function createEngagement({ emit, getSettings, isLive, now = Date.now }) {
  const joins = new Map(), pending = new Map(), greeted = new Map(), thanked = new Map();
  let lastVoice = -Infinity, lastActivity = now(), lastPrompt = now(), promptIndex = 0;
  function announce(type, text, extra = {}) {
    lastVoice = now();
    emit({ type, user: 'Chủ lễ', message: text, ttsText: text, ...extra });
  }
  function add(user, kind, count = 0) {
    const settings = getSettings();
    if (settings[kind === 'like' ? 'likeThanksEnabled' : 'commentThanksEnabled'] === false) return;
    const key = user.uniqueId || user.user;
    const time = now(); lastActivity = time;
    if (time - (thanked.get(`${key}:${kind}`) ?? -Infinity) < 20000) return;
    let entry = pending.get(key);
    if (!entry) {
      if (pending.size >= 100) return;
      entry = { ...user, at: time, likes: 0, comment: false };
      pending.set(key, entry);
    }
    if (kind === 'like') entry.likes += Number(count) || 1;
    else entry.comment = true;
  }
  return {
    activity() { lastActivity = now(); },
    join(user) {
      if (getSettings().welcomeEnabled === false) return;
      const key = user.uniqueId || user.user, time = now();
      if (time - (greeted.get(key) ?? -Infinity) < 10 * 60 * 1000) return;
      greeted.set(key,time);
      if (greeted.size > 2000) greeted.delete(greeted.keys().next().value);
      if (joins.size < 50) joins.set(key,{...user,at:time});
      lastActivity = time;
    },
    like(user, count) { add(user,'like',count); },
    comment(user) { add(user,'comment'); },
    tick() {
      const settings = getSettings(), time = now();
      for (const [key,p] of pending) {
        if (settings.likeThanksEnabled === false) p.likes = 0;
        if (settings.commentThanksEnabled === false) p.comment = false;
        if ((!p.likes && !p.comment) || time - p.at > 120000) pending.delete(key);
      }
      for (const [key,p] of joins) if (settings.welcomeEnabled === false || time - p.at > 90000) joins.delete(key);
      if (time - lastVoice < 12000) return;
      if (pending.size) {
        const selected = [...pending.entries()].slice(0,2);
        const people = selected.map(([,p])=>p);
        const parts = [];
        for (const [key,p] of selected) {
          const action = p.comment && p.likes ? 'bình luận và thả tim' : p.comment ? 'bình luận' : 'thả tim';
          parts.push(`${p.user} đã ${action}`);
          if (p.comment) thanked.set(`${key}:comment`,time);
          if (p.likes) thanked.set(`${key}:like`,time);
          pending.delete(key);
        }
        while (thanked.size > 2000) thanked.delete(thanked.keys().next().value);
        announce('viewerThanks', `Cảm ơn ${parts.join(', ')}. Chúc bạn bình an!`, { user: people[0].user, people: people.map(p=>p.user), count:people.reduce((sum,p)=>sum+p.likes,0) });
        return;
      }
      if (joins.size) {
        const selected = [...joins.entries()].slice(0,2);
        selected.forEach(([key])=>joins.delete(key));
        const names = selected.map(([,p])=>p.user).join(', ');
        announce('welcome',`Chào mừng ${names} đến với phòng live. Chúc bạn bình an!`, {user:selected[0][1].user,count:selected.length});
        return;
      }
      if (settings.autoHostEnabled !== false && isLive() && time - lastPrompt >= 65000 && time - lastActivity >= 20000) {
        announce('hostPrompt',PROMPTS[promptIndex++ % PROMPTS.length]); lastPrompt=time;
      }
    },
    reset() { joins.clear();pending.clear();greeted.clear();thanked.clear();lastVoice=-Infinity;lastPrompt=lastActivity=now(); }
  };
}
module.exports = { createEngagement };
