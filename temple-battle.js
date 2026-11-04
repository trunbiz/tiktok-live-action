// Shared, server-owned fantasy duel. Gifts do not guarantee a win.
function createTempleBattle({ random = Math.random, now = Date.now } = {}) {
  let round = 0, wins = 0, losses = 0, state, cooldown = 0, supportAt = -Infinity;
  const supportCooldown = new Map();
  function begin() {
    round++;
    state = { round, wins, losses, heroHp:100, demonHp:100, energy:0, turn:0, phase:'fighting', winner:null, action:{id:`${round}-0`,kind:'ready',side:'hero',damage:0}, supporter:null };
  }
  begin();
  return {
    snapshot() { return { ...state, action:{...state.action}, supporter: state.supporter ? {...state.supporter} : null }; },
    support(user, kind, key = user) {
      if (state.phase !== 'fighting') return false;
      const time = now();
      if (time - (supportCooldown.get(key) ?? -Infinity) < 2500) return false;
      supportCooldown.set(key,time);
      if(supportCooldown.size>1000) supportCooldown.delete(supportCooldown.keys().next().value);
      state.energy = Math.min(100,state.energy + (kind === 'gift' ? 18 : kind === 'comment' ? 12 : 8));
      state.supporter = { user, kind }; supportAt = time;
      return true;
    },
    tick() {
      if (state.supporter && now() - supportAt > 6000) state.supporter = null;
      if (state.phase === 'finished') {
        if (++cooldown >= 6) { cooldown=0; begin(); }
        return this.snapshot();
      }
      state.turn++;
      const side = state.turn % 2 ? 'hero' : 'demon';
      const charged = side === 'hero' && state.energy >= 50;
      if(charged) state.energy -= 50;
      const dodge = !charged && random() < .18;
      const critical = !dodge && random() < .2;
      const damage = dodge ? 0 : (charged ? 22 : 6 + Math.floor(random()*9)) + (critical ? 6 : 0);
      const target = side === 'hero' ? 'demonHp' : 'heroHp';
      state[target] = Math.max(0,state[target]-damage);
      state.action = {id:`${round}-${state.turn}`,side,kind:dodge?'dodge':charged?'ultimate':critical?'critical':'strike',damage};
      if(!state.heroHp || !state.demonHp || state.turn >= 40) {
        // A tied timeout goes to the defender, who attacks second.
        state.winner = state.heroHp > state.demonHp ? 'hero' : 'demon';
        if(state.winner==='hero') wins++; else losses++;
        state.wins=wins;state.losses=losses;state.phase='finished';
      }
      return this.snapshot();
    }
  };
}
module.exports={createTempleBattle};
