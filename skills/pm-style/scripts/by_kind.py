# Cost of each PM session by kind of work, and above or below 300k tokens of context.
# Read-only. The sessions come from the config file. See README.md in this folder.
# Run: python -X utf8 by_kind.py <config.json>
import json,os,re,collections,sys
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import measure
from measure import cost,units,blen,ts,M,CFG
USAGE = """usage: python -X utf8 by_kind.py <config.json>

Splits the cost of each PM session in the config file by kind of work.
See README.md and config.example.json in this folder."""
def alt(pattern,fallback=r'(?!)'):
    return re.compile(pattern) if pattern else re.compile(fallback)
def classify(calls,imgread):
    names=[n for n,i in calls]
    if not calls: return 'talk'
    def s(i): return json.dumps(i)
    mod=CFG.get('module_name') or ''
    hands_cmd=r'python|pytest|\.venv'+(('|'+re.escape(mod)) if mod else '')
    hp=CFG.get('hands_on_paths') or []
    hx=alt('|'.join(CFG.get('hands_on_excluded') or []))
    wr=alt(CFG.get('paperwork_write_pattern'))
    rr=alt(CFG.get('report_read_pattern'))
    pr=alt(CFG.get('paperwork_read_pattern'))
    cls=set()
    for n,i in calls:
        c=i.get('command','') if isinstance(i,dict) else ''
        fp=i.get('file_path','') or i.get('path','') if isinstance(i,dict) else ''
        sj=s(i).replace(chr(92)*2,'/'); fpn=fp.replace(chr(92),'/')
        if n in('Bash','PowerShell') and re.search(hands_cmd,c): cls.add('hands-on')
        if re.search(r'Browser|chrome',n): cls.add('hands-on')
        if n=='Read' and imgread: cls.add('hands-on')
        if n in('Read','Grep','Glob') and any(p in sj for p in hp) and not hx.search(sj): cls.add('hands-on')
        if re.search(r'start_session|SendMessage|send_message|^Agent$|list_sessions|get_session|get_usage',n): cls.add('children')
        if n in('Bash','PowerShell') and re.search(r'\bcodex\b',c): cls.add('codex')
        if re.search(r'sol_round|sol_room|PROPOSAL|sol_',sj): cls.add('codex')
        if n in('Edit','Write') and wr.search(fpn): cls.add('paperwork writes')
        if n in('Bash','PowerShell') and re.search(r'git\s+(-C\s+\S+\s+)?(add|commit|status|log|diff|push)',c): cls.add('paperwork writes')
        if n=='Read' and rr.search(fpn): cls.add('report reads')
        if n in('Read','Grep') and pr.search(sj): cls.add('paperwork reads')
    order=['hands-on','children','codex','paperwork writes','report reads','paperwork reads']
    for o in order:
        if o in cls: return o
    if all(re.search(r'update_plan|wrap_up',n) for n in names): return 'talk'
    return 'other tools'
def run(label,files):
    A=CFG['pm_transcript_dir']
    seen=set();msgs={};order=[];res={};
    for f in files:
        for l in open(os.path.join(A,f+'.jsonl'),encoding='utf8'):
            d=json.loads(l);t=d.get('type')
            if t not in('assistant','user') or d['uuid'] in seen: continue
            seen.add(d['uuid']);m=d['message']
            if t=='assistant':
                m2=msgs.setdefault(m['id'],dict(ts=ts(d['timestamp']),u=m.get('usage') or {},calls=[]))
                for b in m['content']:
                    if isinstance(b,dict) and b.get('type')=='tool_use': m2['calls'].append((b['name'],b.get('input',{}),b['id']))
            elif isinstance(m.get('content'),list):
                for b in m['content']:
                    if b.get('type')=='tool_result':
                        ch,im=blen(b.get('content'));res[b['tool_use_id']]=len(im)
    ml=sorted(msgs.values(),key=lambda x:x['ts'])
    tot=sum(units(cost(m['u'])) for m in ml)
    agg=collections.defaultdict(lambda:[0,0.0,0]);hi=[0,0.0];lo=[0,0.0]
    for m in ml:
        c=cost(m['u']);u=units(c);ctx=c['inp']+c['cw']+c['cr']
        # a read that returned an image: judged on this message's own Read calls
        imgread=any(n=='Read' and res.get(i,0)>0 for n,_,i in m['calls'])
        k=classify([(n,i) for n,i,_ in m['calls']],imgread)
        a=agg[k];a[0]+=1;a[1]+=u;a[2]+=ctx
        (hi if ctx>300000 else lo)[0]+=1;(hi if ctx>300000 else lo)[1]+=u
    print(f'\n{label}: total {M(tot)}\n\n| class | msgs | units | share | avg context |\n|---|---|---|---|---|')
    for k,(n,u,cx) in sorted(agg.items(),key=lambda kv:-kv[1][1]):
        print(f'| {k} | {n} | {M(u)} | {100*u/tot:.1f}% | {cx//n//1000}k |')
    print(f'\n{label} context >300k: {hi[0]} msgs, {M(hi[1])} ({100*hi[1]/tot:.0f}%); <=300k: {lo[0]} msgs, {M(lo[1])} ({100*lo[1]/tot:.0f}%)')
if __name__=='__main__':
    if len(sys.argv)<2:
        print(USAGE,file=sys.stderr);sys.exit(2)
    measure.load_config(sys.argv,USAGE)
    for label,files in CFG['pm_sessions'].items():
        run(label,files)
