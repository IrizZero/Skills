import json, os, re, glob, collections, sys
from datetime import datetime, timedelta
from typing import Any

# Counts where PM-style sessions spent their tokens, from the transcripts on disk.
# Read-only. See README.md in this folder.
# Run: python -X utf8 measure.py <config.json>

USAGE = """usage: python -X utf8 measure.py <config.json>

Counts the token cost of the sessions named in the config file.
See README.md and config.example.json in this folder."""

REQUIRED = ('pm_transcript_dir', 'pm_sessions')

# Cost units: plain price ratios, the same for every model.
W = dict(inp=1.0, c5=1.25, c1=2.0, cr=0.1, out=5.0)

CFG: dict = {}


def die(msg=None, usage=None):
    if msg:
        print(msg, file=sys.stderr)
    print(usage or USAGE, file=sys.stderr)
    sys.exit(2)


def load_config(argv, usage=None):
    """Read the JSON config named on the command line, or print usage and exit 2."""
    if len(argv) < 2:
        die(usage=usage)
    path = argv[1]
    try:
        with open(path, encoding='utf8') as fh:
            cfg = json.load(fh)
    except OSError as e:
        die(f'cannot read config file {path}: {e.strerror}', usage)
    except ValueError as e:
        die(f'config file {path} is not valid JSON: {e}', usage)
    if not isinstance(cfg, dict):
        die(f'config file {path} must hold a JSON object', usage)
    for k in REQUIRED:
        if k not in cfg:
            die(f'config file {path} is missing the key "{k}"', usage)
    cfg.setdefault('build_transcript_dir', '')
    cfg.setdefault('build_titles', {})
    cfg.setdefault('module_name', '')
    cfg.setdefault('utc_offset_hours', 0)
    for k in ('paperwork_match', 'paperwork_group', 'hands_on_paths', 'hands_on_excluded'):
        cfg.setdefault(k, [])
    for k in ('paperwork_write_pattern', 'report_read_pattern', 'paperwork_read_pattern'):
        cfg.setdefault(k, '')
    for k in ('pm_transcript_dir', 'build_transcript_dir'):
        cfg[k] = os.path.expanduser(cfg[k]) if cfg[k] else ''
    CFG.clear()
    CFG.update(cfg)
    return CFG


def ts(s):
    return datetime.fromisoformat(s.replace('Z', '+00:00'))


def loc(t):
    return (t + timedelta(hours=CFG.get('utc_offset_hours', 0))).strftime('%m-%d %H:%M')


def cost(u):
    cc = u.get('cache_creation') or {}
    c5 = cc.get('ephemeral_5m_input_tokens'); c1 = cc.get('ephemeral_1h_input_tokens')
    tot = u.get('cache_creation_input_tokens', 0) or 0
    if c5 is None and c1 is None:
        c5, c1 = 0, tot
    c5 = c5 or 0; c1 = c1 or 0
    return dict(inp=u.get('input_tokens', 0) or 0, cw=tot, c5=c5, c1=c1,
                cr=u.get('cache_read_input_tokens', 0) or 0, out=u.get('output_tokens', 0) or 0)


def units(c):
    return c['inp'] * W['inp'] + c['c5'] * W['c5'] + c['c1'] * W['c1'] + c['cr'] * W['cr'] + c['out'] * W['out']


def blen(c):
    """chars of a tool_result content, images count separately"""
    chars = 0; imgs = []
    if isinstance(c, str):
        return len(c), imgs
    if isinstance(c, list):
        for b in c:
            if isinstance(b, dict):
                if b.get('type') == 'text':
                    chars += len(b.get('text', ''))
                elif b.get('type') == 'image':
                    imgs.append(len((b.get('source') or {}).get('data', '') or ''))
                elif b.get('type') == 'tool_reference':
                    pass
            elif isinstance(b, str):
                chars += len(b)
    return chars, imgs


def load(files) -> dict[str, Any]:
    seen = set(); msgs = collections.OrderedDict()  # id -> dict
    users = []  # (ts, origin, text, content)
    tool_uses = {}  # id -> (name,input,ts)
    results = []  # (tool_use_id, chars, imgs, ts)
    extra_imgs = []
    allts = []
    for f in files:
        for l in open(f, encoding='utf8'):
            try:
                d = json.loads(l)
            except Exception:
                continue
            u = d.get('uuid')
            t = d.get('type')
            if t not in ('assistant', 'user'):
                continue
            if u in seen:
                continue
            seen.add(u)
            tsv = ts(d['timestamp']); allts.append(tsv)
            m = d['message']
            if t == 'assistant':
                mid = m.get('id')
                if mid not in msgs:
                    msgs[mid] = dict(ts=tsv, usage=m.get('usage') or {}, model=m.get('model'))
                for b in m.get('content', []):
                    if isinstance(b, dict) and b.get('type') == 'tool_use':
                        tool_uses[b['id']] = (b['name'], b.get('input', {}), tsv)
            else:
                c = m.get('content')
                if isinstance(c, list) and any(isinstance(b, dict) and b.get('type') == 'tool_result' for b in c):
                    for b in c:
                        if b.get('type') == 'tool_result':
                            ch, im = blen(b.get('content'))
                            results.append((b.get('tool_use_id'), ch, im, tsv))
                        elif b.get('type') == 'image':
                            extra_imgs.append(len((b.get('source') or {}).get('data', '')))
                else:
                    txt = c if isinstance(c, str) else ' '.join(b.get('text', '') for b in c if isinstance(b, dict) and b.get('type') == 'text')
                    if isinstance(c, list):
                        for b in c:
                            if isinstance(b, dict) and b.get('type') == 'image':
                                extra_imgs.append(len((b.get('source') or {}).get('data', '')))
                    org = d.get('origin') or {}
                    users.append((tsv, org.get('kind'), txt, bool(d.get('isMeta'))))
    return dict(msgs=msgs, users=users, tool_uses=tool_uses, results=results, extra_imgs=extra_imgs, allts=allts)


def totals(msgs):
    T = collections.Counter(); U = 0
    for m in msgs:
        c = cost(m['usage'])
        for k in ('inp', 'cw', 'c5', 'c1', 'cr', 'out'):
            T[k] += c[k]
        U += units(c)
    return T, U


def fmt(n):
    return f'{n:,.0f}'


def M(n):
    return f'{n/1e6:.2f}M'


def short(s, n):
    return re.sub(r'\s+', ' ', s)[:n]


def target(name, inp):
    if name in ('Read', 'Edit', 'Write', 'NotebookEdit'):
        return inp.get('file_path', '')
    if name in ('Bash', 'PowerShell'):
        return inp.get('command', '')
    return json.dumps(inp)[:120]


def hands_on_regex():
    mod = CFG.get('module_name') or ''
    first = (r'-m\s+' + re.escape(mod) + '|') if mod else ''
    return re.compile(r'python(\.exe)?\s+(-X\s+\w+\s+)?(' + first + r'\S+\.py)|\bpytest\b|-m\s+pytest|\bpy\s+-')


def summarize(label, files, full=True):
    S = load(files)
    msgs = list(S['msgs'].values())
    msgs.sort(key=lambda m: m['ts'])
    T, U = totals(msgs)
    out = []
    P = out.append
    models = collections.Counter(m['model'] for m in msgs)
    humans = [u for u in S['users'] if u[1] == 'human']
    allt = S['allts']
    off = CFG.get('utc_offset_hours', 0)
    P(f'\n## {label}\n')
    P(f'Span {loc(min(allt))} to {loc(max(allt))} (UTC{off:+g}); owner prompts {len(humans)}; API messages {len(msgs)}; models {dict(models)}')
    c5, c1 = T['c5'], T['c1']
    P(f'Cache-write case: 5m {fmt(c5)} / 1h {fmt(c1)} tokens ' + ('(split present)' if c5 or T['cw']==0 else '(no split, treated as 1h)'))
    wi, wc, wr, wo = T['inp'] * 1.0, c5 * 1.25 + c1 * 2.0, T['cr'] * 0.1, T['out'] * 5.0
    P('\n| type | tokens | cost units | share |\n|---|---|---|---|')
    for n, tk, w in (('input', T['inp'], wi), ('cache write', T['cw'], wc), ('cache read', T['cr'], wr), ('output', T['out'], wo)):
        P(f'| {n} | {fmt(tk)} | {M(w)} | {100*w/U:.1f}% |')
    P(f'| total | | {M(U)} | |')
    if not full:
        return U, '\n'.join(out), S, msgs
    # context
    ctx = [(m['ts'], sum(cost(m['usage'])[k] for k in ('inp', 'cw', 'cr'))) for m in msgs]
    P(f'\nContext: first request {fmt(ctx[0][1])}; max {fmt(max(c for _, c in ctx))} at {loc(max(ctx, key=lambda x: x[1])[0])}')
    # context at owner prompts: ctx of first api msg after prompt
    lst = []
    import bisect
    mts = [m['ts'] for m in msgs]
    for h in humans:
        i = bisect.bisect_left(mts, h[0])
        if i < len(ctx):
            lst.append(f'{loc(h[0])[6:]}:{ctx[i][1]//1000}k')
    P('Context (k tokens) at the first API call after each owner prompt (HH:MM): ' + ', '.join(lst))
    # turns
    hts = [h[0] for h in humans]
    turns = collections.defaultdict(lambda: [0, 0.0])
    for m in msgs:
        i = bisect.bisect_right(hts, m['ts']) - 1
        turns[i][0] += 1; turns[i][1] += units(cost(m['usage']))
    top = sorted(turns.items(), key=lambda kv: -kv[1][1])[:12]
    P('\n12 costliest owner turns:\n\n| time | prompt | msgs | cost units | share |\n|---|---|---|---|---|')
    for i, (n, cu) in top:
        if i < 0:
            P(f'| (before first prompt) | | {n} | {M(cu)} | {100*cu/U:.1f}% |')
        else:
            P(f'| {loc(hts[i])} | {short(humans[i][2],150).replace("|","/")} | {n} | {M(cu)} | {100*cu/U:.1f}% |')
    # tools
    byname = collections.defaultdict(lambda: [0, 0])
    big = []; imgs = list(S['extra_imgs'])
    for tid, ch, im, t in S['results']:
        nm, inp, _ = S['tool_uses'].get(tid, ('?', {}, None))
        byname[nm][1] += ch
        big.append((ch, nm, target(nm, inp)))
        imgs += im
    for nm, inp, _ in S['tool_uses'].values():
        byname[nm][0] += 1
    P('\nTool calls and result characters:\n\n| tool | calls | result chars |\n|---|---|---|')
    for nm, (n, ch) in sorted(byname.items(), key=lambda kv: -kv[1][1])[:30]:
        P(f'| {nm} | {n} | {fmt(ch)} |')
    P(f'\nImages entering the conversation: {len(imgs)}, base64 total {fmt(sum(imgs))} chars')
    big.sort(key=lambda x: -x[0])
    P('\n25 largest tool results:\n\n| tool | target | chars |\n|---|---|---|')
    for ch, nm, tg in big[:25]:
        P(f'| {nm} | {short(tg,120).replace("|","/")} | {fmt(ch)} |')
    # paperwork
    pm_list = CFG.get('paperwork_match') or []
    gp_list = CFG.get('paperwork_group') or []
    pat = re.compile('|'.join(pm_list)) if pm_list else re.compile(r'(?!)')
    gpat = re.compile('.*?(' + '|'.join(gp_list) + ')') if gp_list else None
    rd = collections.defaultdict(lambda: [0, 0]); rows = []
    resmap = {tid: ch for tid, ch, im, t in S['results']}
    for tid, (nm, inp, t) in S['tool_uses'].items():
        s = None
        if nm == 'Read':
            s = inp.get('file_path', '')
            if pat.search(s):
                rows.append((loc(t), nm, s, inp.get('offset'), inp.get('limit'), resmap.get(tid, 0)))
        elif nm in ('Bash', 'PowerShell'):
            s = inp.get('command', '')
            if pat.search(s) and re.search(r'\b(cat|type|Get-Content|head|tail|sed|rg|grep|Select-String|gc)\b', s):
                rows.append((loc(t), nm, short(s, 140), None, None, resmap.get(tid, 0)))
        elif nm.startswith('mcp__serena'):
            s = json.dumps(inp)
            if pat.search(s.replace('\\\\', '\\')):
                rows.append((loc(t), nm, short(s, 140), None, None, resmap.get(tid, 0)))
    for r in rows:
        if r[1] == 'Read':
            k = (gpat.sub(r'\1', r[2]) if gpat else r[2])[:100]
        else:
            k = r[2][:100]
        rd[k][0] += 1; rd[k][1] += r[5]
    P(f'\nPaperwork reads: {len(rows)} reads, {fmt(sum(r[5] for r in rows))} chars\n\nTotals per file:\n\n| file | reads | chars |\n|---|---|---|')
    for k, (n, ch) in sorted(rd.items(), key=lambda kv: -kv[1][1]):
        P(f'| {k.replace("|","/")} | {n} | {fmt(ch)} |')
    P('\nEvery read (time, file, offset/limit, chars):')
    for r in rows:
        P(f'- {r[0]} {r[1]} {short(r[2],110)[-80:]} off={r[3]} lim={r[4]} chars={fmt(r[5])}')
    # writes
    wr_ = collections.defaultdict(lambda: [0, 0]); commits = 0
    for tid, (nm, inp, t) in S['tool_uses'].items():
        if nm in ('Edit', 'Write'):
            k = inp.get('file_path', ''); ch = len(inp.get('content', '') or '') + len(inp.get('new_string', '') or '')
            wr_[k][0] += 1; wr_[k][1] += ch
        if nm in ('Bash', 'PowerShell') and re.search(r'git\s+(-C\s+\S+\s+)?commit', inp.get('command', '')):
            commits += 1
    P(f'\nEdit/Write by file (calls, chars written); git commit commands: {commits}\n\n| file | calls | chars |\n|---|---|---|')
    for k, (n, ch) in sorted(wr_.items(), key=lambda kv: -kv[1][1])[:25]:
        P(f'| {k[-90:]} | {n} | {fmt(ch)} |')
    P(f'(total files {len(wr_)}, calls {sum(v[0] for v in wr_.values())}, chars {fmt(sum(v[1] for v in wr_.values()))})')
    # hands-on
    shapes = collections.Counter(); hands = 0; codex = 0
    hre = hands_on_regex()
    for tid, (nm, inp, t) in S['tool_uses'].items():
        if nm in ('Bash', 'PowerShell'):
            cmd = inp.get('command', '')
            if re.search(r'\bcodex\b', cmd) and re.search(r'codex(\.cmd|\.exe)?\s+exec|codex\s', cmd):
                codex += 1
            if hre.search(cmd):
                hands += 1
                mm = re.search(r'(python(?:\.exe)?\s+(?:-\S+\s+(?:utf8\s+)?)*(?:-m\s+[\w\.]+|[^\s]*[\\/]?([\w\-]+\.py))|pytest|-m\s+pytest)', cmd)
                shapes[mm.group(1)[-70:] if mm else cmd[:60]] += 1
    P(f'\nHands-on runs (python -m <module> / pytest / python scripts): {hands}; codex runs: {codex}')
    P('Command shapes: ' + '; '.join(f'{k} x{v}' for k, v in shapes.most_common(15)))
    snd = [0, 0]
    for tid, (nm, inp, t) in S['tool_uses'].items():
        if re.search(r'start_session|send_message|SendMessage', nm):
            snd[0] += 1
            snd[1] += sum(len(v) for v in inp.values() if isinstance(v, str))
    P(f'Messages/briefs to other sessions: {snd[0]} calls, {fmt(snd[1])} chars')
    # gaps
    g60 = g5 = 0; cw60 = cw5 = 0
    for i in range(1, len(msgs)):
        gap = (msgs[i]['ts'] - msgs[i - 1]['ts']).total_seconds()
        cw = cost(msgs[i]['usage'])['cw']
        if gap > 3600: g60 += 1; cw60 += cw
        if gap > 300: g5 += 1; cw5 += cw
    P(f'\nCache gaps: >60 min: {g60} msgs, cache-write {fmt(cw60)} tokens; >5 min: {g5} msgs, cache-write {fmt(cw5)} tokens; session cache-write total {fmt(T["cw"])} ({100*cw5/max(1,T["cw"]):.0f}% after >5 min gaps, {100*cw60/max(1,T["cw"]):.0f}% after >60 min)')
    return U, '\n'.join(out), S, msgs


def subs(sessdirs, label):
    rows = []
    for d in sessdirs:
        for f in sorted(glob.glob(os.path.join(d, 'subagents', 'agent-*.jsonl'))):
            S = load([f]); ms = sorted(S['msgs'].values(), key=lambda m: m['ts'])
            if not ms: continue
            T, U = totals(ms)
            meta = {}
            try: meta = json.load(open(f.replace('.jsonl', '.meta.json')))
            except Exception: pass
            first = next((u[2] for u in sorted(S['users'], key=lambda x: x[0]) if not u[3]), '')
            md = collections.Counter(m['model'] for m in ms).most_common(1)[0][0]
            rows.append((os.path.basename(f)[6:14], md, len(ms), T, U, short(first, 100)))
    print(f'\n### Subagents of {label}\n\n| id | model | msgs | input | cache write | cache read | output | cost units | prompt |\n|---|---|---|---|---|---|---|---|---|')
    for r in rows:
        print(f'| {r[0]} | {r[1]} | {r[2]} | {fmt(r[3]["inp"])} | {fmt(r[3]["cw"])} | {fmt(r[3]["cr"])} | {fmt(r[3]["out"])} | {M(r[4])} | {r[5].replace("|","/")} |')
    return sum(r[4] for r in rows), len(rows)


if __name__ == '__main__':
    load_config(sys.argv)
    A = CFG['pm_transcript_dir']
    B = CFG['build_transcript_dir']
    p = lambda n: os.path.join(A, n)
    res = {}
    for lab, fs in CFG['pm_sessions'].items():
        U, txt, S, ms = summarize(lab, [p(x + '.jsonl') for x in fs])
        print(txt)
        su, n = subs([p(x) for x in fs], lab)
        res[lab] = (U, su, n)
    # build sessions
    want = CFG['build_titles']
    builds = {}
    if B:
        for cj in glob.glob(os.path.join(B, '*', 'custom-title.json')):
            try: t = json.load(open(cj, encoding='utf8'))
            except Exception: continue
            title = t.get('customTitle') or t.get('title') or str(t)
            for w, k in want.items():
                if w in title:
                    builds[k] = os.path.basename(os.path.dirname(cj))
    print('\n## Build sessions\n\n| stage | model | span | msgs | input | cache write | cache read | output | cost units |\n|---|---|---|---|---|---|---|---|---|')
    bu = 0
    for k, sid in sorted(builds.items()):
        fl = [os.path.join(B, sid + '.jsonl')]
        S = load([f for f in fl if os.path.exists(f)])
        ms = sorted(S['msgs'].values(), key=lambda m: m['ts']); T, U = totals(ms); bu += U
        md = collections.Counter(m['model'] for m in ms)
        print(f'| {k} {sid[:8]} | {dict(md)} | {loc(min(S["allts"]))} to {loc(max(S["allts"]))} | {len(ms)} | {fmt(T["inp"])} | {fmt(T["cw"])} | {fmt(T["cr"])} | {fmt(T["out"])} | {M(U)} |')
        # subagents of builds
        d = os.path.join(B, sid)
        if glob.glob(os.path.join(d, 'subagents', '*.jsonl')):
            su, n = subs([d], 'build ' + k); bu += su
    print('\nSummary: ' + '; '.join(f'{lab} {M(u)}, its subagents {M(su)} ({n})' for lab, (u, su, n) in res.items())
          + f'; build sessions with their subagents {M(bu)}')
