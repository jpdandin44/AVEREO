"""Validate documentation in this module and its edited monorepo indexes."""
import json
import re
import sys
from pathlib import Path
import yaml

root = Path(__file__).resolve().parents[1]
repository = root.parents[1]
required = ('project', 'document_type', 'title', 'status', 'version', 'created', 'updated', 'owner', 'tags')
documents = [p for p in root.rglob('*.md') if not any(part in ('.local', '.git') for part in p.relative_to(root).parts)]
documents += [repository/name for name in ('README.md','architecture.md','requirements.md','roadmap.md','decisions.md','changelog.md','AGENTS.md','workflows/README.md') if (repository/name).exists()]
errors = []
links = 0
for path in documents:
    text = path.read_text(encoding='utf-8')
    if not text.startswith('---\n'):
        errors.append(str(path)+': métadonnées absentes')
        continue
    try:
        meta = yaml.safe_load(text.split('---',2)[1])
        if path.name == 'SKILL.md':
            if meta.get('name') != path.parent.name: errors.append(str(path)+': nom du skill incohérent')
            meta = meta.get('metadata',{})
        for key in required:
            if key not in meta: errors.append(str(path)+': '+key+' absent')
        if meta.get('owner') != 'jpdandin' or meta.get('version') != 'git': errors.append(str(path)+': owner/version incohérent')
    except (yaml.YAMLError, AttributeError) as error:
        errors.append(str(path)+': '+str(error))
    for url in re.findall(r'\]\(([^)]+)\)',text):
        if re.match(r'^[a-z]+:',url,re.I) or url.startswith('#'): continue
        links += 1
        if not (path.parent/url.split('#')[0]).resolve().exists(): errors.append(str(path)+': lien absent '+url)
for folder in (root,repository):
    for name in ('README.md','architecture.md','requirements.md','roadmap.md','decisions.md','changelog.md','prompts','workflows','api','data','tests','docs'):
        if not (folder/name).exists(): errors.append(str(folder)+': socle absent '+name)
print(json.dumps({'markdownFiles':len(documents),'localLinks':links,'errors':errors},ensure_ascii=False))
sys.exit(bool(errors))
