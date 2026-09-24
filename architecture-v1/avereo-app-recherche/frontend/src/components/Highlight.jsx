import { highlightSegments } from '../utils/text.js';

export default function Highlight({ text, terms }) {
  return highlightSegments(text, terms).map((s, i) => (s.m ? <mark key={i}>{s.t}</mark> : <span key={i}>{s.t}</span>));
}
