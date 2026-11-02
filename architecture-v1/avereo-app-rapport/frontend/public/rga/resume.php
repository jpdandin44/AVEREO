<?php require __DIR__ . '/guard.php'; ?>
<!doctype html><html lang="fr"><meta charset="utf-8"><title>Ouvrir RGA</title>
<body><p>Ouverture de RGA…</p><script>
let hash = '';
try { hash = sessionStorage.getItem('avereo.rga.pending') || ''; sessionStorage.removeItem('avereo.rga.pending'); } catch {}
location.replace(hash.startsWith('#') && hash.length <= 2000 ? '/rga/carte.php' + hash : '/rga/');
</script><noscript><a href="/rga/">Ouvrir RGA</a></noscript></body></html>
