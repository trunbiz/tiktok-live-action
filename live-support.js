function createLiveSupport() {
  let coins = 0, gifts = 0, channel = '';
  const supporters = new Map();
  return {
    start(username) {
      if (channel === username) return;
      channel = username; coins = gifts = 0; supporters.clear();
    },
    record({ uniqueId, user, avatar, coins: value, count = 1 }) {
      const amount = Number(value);
      if (!Number.isFinite(amount) || amount <= 0) return;
      coins += amount; gifts += Math.max(1, Number(count) || 1);
      const key = uniqueId || user;
      const prior = supporters.get(key);
      supporters.set(key, { name: user, avatar: avatar || '', coins: (prior?.coins || 0) + amount });
    },
    snapshot() {
      return { coins, gifts, channel, supporters: [...supporters.values()].sort((a,b)=>b.coins-a.coins).slice(0,3) };
    }
  };
}
module.exports = { createLiveSupport };
