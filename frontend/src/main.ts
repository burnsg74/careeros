import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

// #region agent log
fetch('http://127.0.0.1:7737/ingest/651a458a-b25b-4cf3-805b-b11e3ebce40f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d01da5'},body:JSON.stringify({sessionId:'d01da5',runId:'pre-fix',hypothesisId:'A',location:'main.ts:after-imports',message:'module graph evaluated, about to mount',data:{nowMs:performance.now(),path:location.pathname,resourceCount:performance.getEntriesByType('resource').length},timestamp:Date.now()})}).catch(()=>{});
// #endregion

const mountStart = performance.now()
const app = mount(App, {
  target: document.getElementById('app')!,
})
const mountEnd = performance.now()

// #region agent log
requestAnimationFrame(() => {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  const scripts = resources.filter((r) => r.initiatorType === 'script' || r.name.includes('.js') || r.name.includes('/src/'))
  const css = resources.filter((r) => r.initiatorType === 'css' || r.initiatorType === 'link' || r.name.includes('.css'))
  const fonts = resources.filter((r) => r.initiatorType === 'css' || r.name.includes('font'))
  fetch('http://127.0.0.1:7737/ingest/651a458a-b25b-4cf3-805b-b11e3ebce40f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d01da5'},body:JSON.stringify({sessionId:'d01da5',runId:'pre-fix',hypothesisId:'C',location:'main.ts:after-mount-frame',message:'first frame after mount',data:{mountMs:mountEnd-mountStart,nowMs:performance.now(),path:location.pathname,nav:{type:nav?.type,domContentLoaded:nav?.domContentLoadedEventEnd,loadEventEnd:nav?.loadEventEnd,transferSize:nav?.transferSize,decodedBodySize:nav?.decodedBodySize},resourceCount:resources.length,scriptCount:scripts.length,scriptTransfer:scripts.reduce((s,r)=>s+(r.transferSize||0),0),cssCount:css.length,cssTransfer:css.reduce((s,r)=>s+(r.transferSize||0),0),fontishCount:fonts.length,topResources:resources.slice().sort((a,b)=>(b.duration||0)-(a.duration||0)).slice(0,12).map((r)=>({name:r.name.replace(location.origin,''),dur:Math.round(r.duration),transfer:r.transferSize,decoded:r.decodedBodySize,type:r.initiatorType}))},timestamp:Date.now()})}).catch(()=>{});
})
// #endregion

export default app
