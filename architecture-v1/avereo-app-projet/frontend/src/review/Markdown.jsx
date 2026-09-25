import { Fragment } from 'react';

// React escapes source text. Raw HTML, executable URLs and embedded media are
// never interpreted by this deliberately small document presentation layer.
function inline(text) {
  return String(text).split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^\s)]+\))/g).map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/);
    if (link) return /^https?:\/\//.test(link[2]) ? <a key={i} href={link[2]} target="_blank" rel="noreferrer">{link[1]} ↗</a> : <span key={i} title={link[2]}>{link[1]} <code>{link[2]}</code></span>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export default function Markdown({ source }) {
  const lines = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').split(/\r?\n/);
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (line.startsWith('```')) {
      const content = [];
      while (++i < lines.length && !lines[i].startsWith('```')) content.push(lines[i]);
      blocks.push(<pre key={i}><code>{content.join('\n')}</code></pre>);
    } else if (/^#{1,6} /.test(line)) {
      const Tag = `h${Math.min(6, line.match(/^#+/)[0].length + 1)}`;
      blocks.push(<Tag key={i}>{inline(line.replace(/^#+ /, ''))}</Tag>);
    } else if (/^\|/.test(line) && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
      const cells = value => value.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(s => s.trim().replace(/\\\|/g, '|'));
      const header = cells(line); const rows = []; i++;
      while (i + 1 < lines.length && /^\|/.test(lines[i + 1])) rows.push(cells(lines[++i]));
      blocks.push(<div className="document-table" key={i}><table><thead><tr>{header.map((h, j) => <th key={j}>{inline(h)}</th>)}</tr></thead><tbody>{rows.map((row, j) => <tr key={j}>{row.map((cell, k) => <td key={k}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>);
    } else if (/^\s*[-*] /.test(line) || /^\d+\. /.test(line)) {
      const ordered = /^\d+\. /.test(line); const items = [line];
      while (i + 1 < lines.length && (ordered ? /^\d+\. /.test(lines[i + 1]) : /^\s*[-*] /.test(lines[i + 1]))) items.push(lines[++i]);
      const List = ordered ? 'ol' : 'ul';
      blocks.push(<List key={i}>{items.map((item, j) => <li key={j}>{inline(item.replace(/^\s*(?:[-*]|\d+\.) /, ''))}</li>)}</List>);
    } else if (line.startsWith('> ')) blocks.push(<blockquote key={i}>{inline(line.slice(2))}</blockquote>);
    else if (/^---+$/.test(line)) blocks.push(<hr key={i} />);
    else blocks.push(<p key={i}>{inline(line)}</p>);
  }
  return <div className="markdown-document">{blocks}</div>;
}
