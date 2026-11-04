/** Local scene animation only: ambient actors never emit RPC, chat or viewer counts. */
class TemplePilgrims {
  constructor(layer, { now = () => performance.now(), autoStart = true } = {}) {
    this.layer = layer;
    this.now = now;
    this.actors = [];
    this.queue = [];
    this.ambientEnabled = true;
    this.lastRealActivity = now();
    this.lastAmbient = now() - 5000;
    this.lastFrame = 0;
    this.serial = 0;
    this.namePool = [];
    this.surnames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Phan'];
    this.givenNames = ['Minh An', 'Ngọc Anh', 'Thanh Hà', 'Quang Huy', 'Thu Hương', 'Gia Bảo', 'Khánh Linh', 'Hoài Nam', 'Diệu Tâm', 'Minh Hải', 'Phương Thảo', 'Anh Tuấn', 'Bảo Ngọc', 'Thanh Sơn', 'Mai Anh', 'Hữu Phúc', 'Tuệ Minh', 'Thảo Vy', 'Đức Anh', 'Hồng Nhung', 'Thiện Tâm', 'An Nhiên', 'Minh Châu', 'Nhật Linh'];
    this.frames = { walk1: 'devotee_walk', walk2: 'devotee_walk_2', kneel: 'devotee', bow: 'devotee_bow_mid', deep: 'devotee_prostrate_deep' };
    if (autoStart) {
      const loop = time => { this.tick(time); this.raf = requestAnimationFrame(loop); };
      this.raf = requestAnimationFrame(loop);
    }
  }
  nextAmbientName() {
    if (!this.namePool.length) this.namePool = this.surnames.flatMap(last => this.givenNames.map(first => `${last} ${first}`));
    const index = Math.floor(Math.random() * this.namePool.length);
    return this.namePool.splice(index, 1)[0];
  }
  setAmbient(enabled) {
    this.ambientEnabled = enabled;
    if (!enabled) this.actors.filter(a => a.ambient).forEach(a => this.remove(a));
    this.layer.dataset.ambient = String(enabled);
  }
  visit(event, { ambient = false } = {}) {
    const key = ambient ? `scenery-${++this.serial}` : String(event.uniqueId || event.user || 'guest');
    if (!ambient) this.lastRealActivity = this.now();
    const present = this.actors.find(a => a.key === key);
    if (present) { present.node.classList.add('acknowledged'); return; }
    if (this.queue.some(item => item.key === key)) return;
    const data = { key, user: ambient ? this.nextAmbientName() : event.user, ambient, kind: event.type || 'burnIncense' };
    if (this.actors.length >= 8) {
      if (ambient) return;
      const backdrop = this.actors.find(a => a.ambient);
      if (backdrop) this.remove(backdrop);
      else {
        if (this.queue.length >= 24) this.queue.shift();
        this.queue.push(data); return;
      }
    }
    this.spawn(data);
  }
  spawn(data) {
    const slot = [2,3,1,4,0,5,6,7].find(i => !this.actors.some(a => a.slot === i));
    const node = document.createElement('div');
    node.className = `pilgrim-actor ${data.ambient ? 'ambient-pilgrim' : 'viewer-pilgrim'}`;
    node.dataset.kind = data.kind;
    const stack = document.createElement('div'); stack.className = 'pilgrim-frames';
    for (const [pose, filename] of Object.entries(this.frames)) {
      const img = document.createElement('img'); img.src = `/assets/${filename}.png`; img.alt = ''; img.dataset.pose = pose; stack.appendChild(img);
    }
    const incense = document.createElement('div'); incense.className = 'pilgrim-incense';
    incense.appendChild(document.createElement('i')); incense.appendChild(document.createElement('i')); incense.appendChild(document.createElement('i'));
    const tag = document.createElement('div'); tag.className = 'pilgrim-name'; tag.textContent = data.user || 'Bạn hữu duyên';
    const action = document.createElement('span'); action.className = 'pilgrim-action'; action.textContent = data.ambient ? 'Khách mô phỏng' : 'Đang lên dâng hương';
    node.append(stack, incense, tag, action); this.layer.appendChild(node);
    this.actors.push({ ...data, node, slot, side: slot % 2 ? 1 : -1, started: this.now(), pose: '', action });
  }
  remove(actor) {
    actor.node.remove(); this.actors = this.actors.filter(a => a !== actor);
  }
  tick(time = this.now()) {
    if (document.hidden || time - this.lastFrame < 1000 / 30) return;
    this.lastFrame = time;
    for (const actor of [...this.actors]) {
      const age = time - actor.started;
      if (age >= 21000) { this.remove(actor); continue; }
      const side = actor.side;
      const altarX = 300 + (actor.slot % 4) * 160;
      const altarY = 1125 + Math.floor(actor.slot / 4) * 110;
      let x, y, pose;
      if (age < 6000) {
        const t = age / 6000;
        const approach = Math.max(0, (t - .6) / .4);
        x = (540 + side * 480) * (1 - approach) + altarX * approach;
        y = 1660 * (1 - t) + altarY * t;
        pose = Math.floor(age / 200) % 2 ? 'walk1' : 'walk2';
      } else if (age < 14000) {
        x = altarX; y = altarY;
        const bow = (age - 6000) % 2400;
        pose = bow < 500 ? 'kneel' : bow < 850 ? 'bow' : bow < 1550 ? 'deep' : bow < 1850 ? 'bow' : 'kneel';
        actor.action.textContent = actor.ambient ? 'Khách mô phỏng' : 'Dâng hương gửi lời lành';
      } else {
        const t = (age - 14000) / 7000;
        const depart = Math.min(1, t / .35);
        x = altarX * (1 - depart) + (540 + side * 480) * depart;
        y = altarY * (1 - t) + 1610 * t;
        pose = Math.floor(age / 200) % 2 ? 'walk1' : 'walk2';
        actor.action.textContent = actor.ambient ? 'Khách mô phỏng' : 'Cảm ơn bạn đã ghé chùa';
      }
      const scale = .72 + Math.max(0, (y - 1010) / 650) * .7;
      actor.node.style.transform = `translate(${x}px,${y}px) translate(-50%,-100%) scale(${scale})`;
      actor.node.style.zIndex = Math.round(y);
      actor.node.style.opacity = String(Math.min(1, age / 500, (21000 - age) / 700));
      actor.node.classList.toggle('offering', age >= 6000 && age < 14000);
      if (pose !== actor.pose) {
        actor.pose = pose;
        actor.node.querySelectorAll('img').forEach(img => img.classList.toggle('active', img.dataset.pose === pose));
      }
    }
    while (this.queue.length && this.actors.length < 8) this.spawn(this.queue.shift());
    if (this.ambientEnabled && time - this.lastRealActivity >= 12000 && time - this.lastAmbient >= 7000 && this.actors.filter(a => a.ambient).length < 3 && this.actors.length < 5 && !this.queue.length) {
      this.visit({}, { ambient: true }); this.lastAmbient = time;
    }
    this.layer.dataset.activeActors = this.actors.length;
    this.layer.dataset.queuedActors = this.queue.length;
  }
}
window.TemplePilgrims = TemplePilgrims;
