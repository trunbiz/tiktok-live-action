function connectionErrorText(error) {
  const nested = error?.errors?.map(e => e.code || e.message).filter(Boolean) || [];
  return [error?.message, error?.code, ...nested, error?.cause?.code, error?.exception?.message, error?.info].filter(v=>typeof v==='string'&&v).join(' · ') || 'Không rõ lỗi kết nối TikTok';
}
function createLiveConnection({ attempt, onRetry = () => {}, sleep = ms => new Promise(resolve => setTimeout(resolve,ms)), maxAttempts = 2 }) {
  let active = null;
  function cancelled() { return new Error('Đã hủy kết nối LIVE'); }
  return {
    connect(target) {
      if (active) return active.target === target ? active.promise : Promise.reject(new Error(`Đang kết nối @${active.target}. Hãy ngắt kết nối trước khi đổi kênh.`));
      const token = { cancelled:false };
      const job = { target, token, promise:null };
      active = job;
      job.promise = (async()=>{
        for(let number=1;number<=maxAttempts;number++) {
          if(token.cancelled)throw cancelled();
          try {
            const result=await attempt(target,token,number);
            if(token.cancelled)throw cancelled();
            return result;
          } catch(error) {
            if(token.cancelled)throw cancelled();
            const retryable=/timed?\s*out|timeout|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up/i.test(connectionErrorText(error));
            if(!retryable || number===maxAttempts)throw error;
            onRetry(target,number+1,error);
            await sleep(2000*number);
          }
        }
      })().finally(()=>{if(active===job)active=null;});
      return job.promise;
    },
    cancel() { if(active) { active.token.cancelled=true;active=null; } }
  };
}
module.exports={createLiveConnection,connectionErrorText};
