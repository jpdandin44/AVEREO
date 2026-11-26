// Plan 2D éditable (R32, R33, R34) : tracer une pièce, déplacer les sommets, ajouter ou retirer un sommet,
// poser et glisser les ouvertures, cotes affichées, aimantation. Toutes les coordonnées du modèle sont en mm ;
// le canvas travaille en pixels (px = mm × échelle).
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Rect, Layer, Line, Stage, Text } from "react-konva";
import Encadre from "../../components/Encadre.jsx";
import Icone from "../../components/Icone.jsx";
import { aireMm2, estAutoSecant, projeterSurSegment } from "../../domain/geometrie.js";
import { definirLongueurMur, deplacerSommet } from "../../domain/modele.js";
import { positionCommentaire } from "../../domain/terrain.js";
import { analyserLongueur, formaterLongueurMm, formaterSurface, texteDepuisMm } from "../../domain/unites.js";
import Dialogue from "../terrain/Dialogue.jsx";
import { aimanter } from "./aimantation.js";
import { centreOuverture, deplacerOuverture } from "./glisserOuverture.js";
import { lireJetons } from "./jetons.js";

const RAYON_SOMMET = 9;
const SEUIL_FERMETURE_PX = 16;
const ECHELLE_MIN = 0.02; // px par mm
const ECHELLE_MAX = 1.2;

function pas_grille(echelle) {
  return [100, 500, 1000, 5000].find((p) => p * echelle >= 22) ?? 5000;
}

function boite(pieces) {
  const points = pieces.flatMap((p) => p.sommets);
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 6000, maxY: 4000 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

function ajusterVue(pieces, largeur, hauteur) {
  const b = boite(pieces);
  const marge = 70;
  const largeurMm = Math.max(b.maxX - b.minX, 1000);
  const hauteurMm = Math.max(b.maxY - b.minY, 1000);
  const echelle = Math.min(
    ECHELLE_MAX,
    Math.max(ECHELLE_MIN, Math.min((largeur - 2 * marge) / largeurMm, (hauteur - 2 * marge) / hauteurMm)),
  );
  return {
    echelle,
    x: (largeur - largeurMm * echelle) / 2 - b.minX * echelle,
    y: (hauteur - hauteurMm * echelle) / 2 - b.minY * echelle,
  };
}

/**
 * @param {{
 *   niveau: {id: string, pieces: any[]}, pieceId: string | null, hauteurDefautMm: number,
 *   peutAnnuler: boolean, peutRetablir: boolean,
 *   onAnnuler: () => void, onRetablir: () => void,
 *   onChoisir: (id: string) => void, onApercu: (piece: any) => void, onValider: (piece: any) => void,
 *   onCreerDepuisSommets: (sommets: {x: number, y: number}[]) => void
 * }} props
 */
export default function Plan2D({
  niveau,
  pieceId,
  peutAnnuler,
  peutRetablir,
  onAnnuler,
  onRetablir,
  onChoisir,
  onApercu,
  onValider,
  onCreerDepuisSommets,
  onSupprimerSommet,
  onInsererSommet,
  onSelectionTerrain,
  onDeplacerRepere,
  onSupprimerPiece,
}) {
  const conteneur = useRef(null);
  const scene = useRef(null);
  const dernierApercu = useRef(null);
  const [taille, setTaille] = useState({ largeur: 800, hauteur: 520 });
  const [vue, setVue] = useState({ echelle: 0.1, x: 0, y: 0 });
  const [mode, setMode] = useState("selection"); // "selection" | "tracer"
  const [trace, setTrace] = useState([]);
  const [curseur, setCurseur] = useState(null);
  const [message, setMessage] = useState(null);
  const [jetons, setJetons] = useState(null);
  // Cote d'un mur modifiée directement sur le plan (toucher la cote) : {murIndex, texte, erreur}.
  const [editionCote, setEditionCote] = useState(null);

  const piecesRef = useRef(niveau.pieces);
  piecesRef.current = niveau.pieces;
  const piece = niveau.pieces.find((p) => p.id === pieceId) ?? null;
  const { echelle } = vue;

  useEffect(() => {
    setJetons(lireJetons());
  }, []);

  useEffect(() => {
    const element = conteneur.current;
    if (!element) return undefined;
    const observateur = new ResizeObserver(([entree]) => {
      const { width, height } = entree.contentRect;
      if (width > 0 && height > 0) setTaille({ largeur: Math.floor(width), hauteur: Math.floor(height) });
    });
    observateur.observe(element);
    return () => observateur.disconnect();
  }, []);

  const recentrer = useCallback(() => {
    setVue(ajusterVue(piecesRef.current, taille.largeur, taille.hauteur));
  }, [taille.largeur, taille.hauteur]);

  // Recadrage au changement de niveau, de pièce ou de taille de la zone (pas à chaque glissement).
  useEffect(() => {
    recentrer();
  }, [niveau.id, pieceId, recentrer]);

  // Touche Échap : abandonne le tracé en cours.
  useEffect(() => {
    if (mode !== "tracer") return undefined;
    const surTouche = (e) => {
      if (e.key === "Escape") annulerTrace();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [mode]);

  function annulerTrace() {
    setTrace([]);
    setCurseur(null);
    setMode("selection");
  }

  function pointeurMm() {
    const stage = scene.current;
    const p = stage?.getRelativePointerPosition();
    return p ? { x: p.x / echelle, y: p.y / echelle } : null;
  }

  const toleranceMm = 10 / echelle;

  function cliquerPlan(e) {
    if (mode !== "tracer") return;
    const brut = pointeurMm();
    if (!brut) return;
    const premier = trace[0];
    if (premier && trace.length >= 3) {
      const ecartPx = Math.hypot((brut.x - premier.x) * echelle, (brut.y - premier.y) * echelle);
      if (ecartPx <= SEUIL_FERMETURE_PX) {
        fermerTrace(trace);
        return;
      }
    }
    const { x, y } = aimanter(brut, { sommets: trace, toleranceMm });
    setTrace([...trace, { x, y }]);
    setMessage(null);
  }

  function fermerTrace(points) {
    if (points.length < 3) {
      setMessage("Il faut au moins trois points pour fermer une pièce.");
      return;
    }
    if (estAutoSecant(points) || aireMm2(points) === 0) {
      setMessage("Le contour se croise ou n'a pas de surface : refaites le tracé.");
      return;
    }
    onCreerDepuisSommets(points);
    setTrace([]);
    setCurseur(null);
    setMode("selection");
    setMessage(null);
  }

  function bougerCurseur() {
    if (mode !== "tracer") return;
    const brut = pointeurMm();
    if (!brut) return;
    const { x, y } = aimanter(brut, { sommets: trace, toleranceMm });
    setCurseur({ x, y });
  }

  function zoomer(e) {
    e.evt.preventDefault();
    const stage = scene.current;
    const pointeur = stage.getPointerPosition();
    const facteur = e.evt.deltaY > 0 ? 1 / 1.1 : 1.1;
    const nouvelle = Math.min(ECHELLE_MAX, Math.max(ECHELLE_MIN, echelle * facteur));
    const mondeX = (pointeur.x - vue.x) / echelle;
    const mondeY = (pointeur.y - vue.y) / echelle;
    setVue({ echelle: nouvelle, x: pointeur.x - mondeX * nouvelle, y: pointeur.y - mondeY * nouvelle });
  }

  // ----- glissement d'un sommet -----
  function glisserSommet(index, e) {
    const brut = { x: e.target.x() / echelle, y: e.target.y() / echelle };
    const { x, y } = aimanter(brut, { sommets: piece.sommets, ignorerIndex: index, toleranceMm });
    e.target.position({ x: x * echelle, y: y * echelle });
    const suivante = deplacerSommet(piece, index, { x, y });
    dernierApercu.current = suivante;
    onApercu(suivante);
  }

  function finGlissement() {
    if (dernierApercu.current) onValider(dernierApercu.current);
    dernierApercu.current = null;
  }

  function retirerSommet(index) {
    onSupprimerSommet(index);
  }

  function ajouterSommet(murIndex) {
    const brut = pointeurMm();
    const a = piece.sommets[murIndex];
    const b = piece.sommets[(murIndex + 1) % piece.sommets.length];
    const t = brut ? projeterSurSegment(brut, a, b).t : 0.5;
    onInsererSommet(murIndex, Math.min(0.95, Math.max(0.05, t)));
  }

  // ----- glissement d'une ouverture le long de son mur -----
  // Mêmes refus que la saisie au clavier : hors du mur ou sur une autre ouverture, le rond garde sa dernière position valide.
  function glisserOuverture(ouverture, e) {
    const brut = { x: e.target.x() / echelle, y: e.target.y() / echelle };
    const resultat = deplacerOuverture(piece, ouverture, brut);
    if (resultat.piece) {
      dernierApercu.current = resultat.piece;
      onApercu(resultat.piece);
      setMessage(null);
    } else {
      setMessage(resultat.message);
    }
    const derniere = resultat.piece ?? dernierApercu.current ?? piece;
    const retenue = derniere.ouvertures.find((o) => o.id === ouverture.id) ?? ouverture;
    const centre = centreOuverture(derniere, retenue);
    e.target.position({ x: centre.x * echelle, y: centre.y * echelle });
  }

  function ouvrirCote(murIndex) {
    if (!piece || mode !== "selection") return;
    const a = piece.sommets[murIndex];
    const b = piece.sommets[(murIndex + 1) % piece.sommets.length];
    setEditionCote({ murIndex, texte: texteDepuisMm(Math.round(Math.hypot(b.x - a.x, b.y - a.y))), erreur: null });
  }

  function validerCote(e) {
    e.preventDefault();
    if (!piece || !editionCote) return;
    const lecture = analyserLongueur(editionCote.texte, "m");
    if (!lecture.ok) {
      setEditionCote({ ...editionCote, erreur: lecture.message });
      return;
    }
    const resultat = definirLongueurMur(piece, editionCote.murIndex, lecture.mm);
    if (!resultat.ok) {
      setEditionCote({ ...editionCote, erreur: resultat.message });
      return;
    }
    onValider(resultat.piece);
    setEditionCote(null);
  }

  const px = (p) => [p.x * echelle, p.y * echelle];
  const flat = (sommets) => sommets.flatMap(px);

  const grille = useMemo(() => {
    const pas = pas_grille(echelle);
    const xMin = Math.floor(-vue.x / echelle / pas) * pas;
    const xMax = (taille.largeur - vue.x) / echelle;
    const yMin = Math.floor(-vue.y / echelle / pas) * pas;
    const yMax = (taille.hauteur - vue.y) / echelle;
    const lignes = [];
    for (let x = xMin; x <= xMax; x += pas) lignes.push([x * echelle, yMin * echelle, x * echelle, yMax * echelle]);
    for (let y = yMin; y <= yMax; y += pas) lignes.push([xMin * echelle, y * echelle, xMax * echelle, y * echelle]);
    return lignes;
  }, [echelle, vue.x, vue.y, taille.largeur, taille.hauteur]);

  return (
    <section className="plan" aria-label="Plan 2D de la pièce">
      <div className="plan__barre">
        <button type="button" className="bouton bouton--secondaire" onClick={onAnnuler} disabled={!peutAnnuler}>
          <Icone nom="annuler" /> Annuler
        </button>
        <button type="button" className="bouton bouton--secondaire" onClick={onRetablir} disabled={!peutRetablir}>
          <Icone nom="retablir" /> Rétablir
        </button>
        {mode === "selection" ? (
          <button type="button" className="bouton" aria-pressed="false" onClick={() => { setMode("tracer"); setMessage(null); }}>
            <Icone nom="tracer" /> Tracer une pièce
          </button>
        ) : (
          <>
            <button type="button" className="bouton bouton--accent" aria-pressed="true" onClick={() => fermerTrace(trace)} disabled={trace.length < 3}>
              Fermer le contour
            </button>
            <button type="button" className="bouton bouton--secondaire" onClick={annulerTrace}>
              Abandonner le tracé
            </button>
          </>
        )}
        <button type="button" className="bouton bouton--secondaire" onClick={recentrer}>
          <Icone nom="recentrer" /> Recentrer
        </button>
        {piece && mode === "selection" && onSupprimerPiece ? (
          <button type="button" className="bouton bouton--secondaire" onClick={onSupprimerPiece}>
            <Icone nom="supprimer" /> Supprimer la pièce
          </button>
        ) : null}
      </div>

      <div className="plan__zone" ref={conteneur}>
        <Stage
          ref={scene}
          width={taille.largeur}
          height={taille.hauteur}
          x={vue.x}
          y={vue.y}
          draggable={mode === "selection"}
          onDragEnd={(e) => {
            if (e.target === e.target.getStage()) setVue((v) => ({ ...v, x: e.target.x(), y: e.target.y() }));
          }}
          onWheel={zoomer}
          onClick={cliquerPlan}
          onTap={cliquerPlan}
          onMouseMove={bougerCurseur}
          style={{ cursor: mode === "tracer" ? "crosshair" : "default" }}
        >
          <Layer>
            {jetons &&
              grille.map((l, i) => <Line key={`g${i}`} points={l} stroke={jetons.gris} strokeWidth={1} opacity={0.6} listening={false} />)}

            {jetons &&
              niveau.pieces.map((p) => {
                const active = p.id === pieceId;
                const centre = {
                  x: p.sommets.reduce((s, v) => s + v.x, 0) / p.sommets.length,
                  y: p.sommets.reduce((s, v) => s + v.y, 0) / p.sommets.length,
                };
                const signe = Math.sign(
                  p.sommets.reduce((s, a, i) => {
                    const b = p.sommets[(i + 1) % p.sommets.length];
                    return s + (a.x * b.y - b.x * a.y);
                  }, 0),
                ) || 1;
                return (
                  <Fragment key={p.id}>
                    <Line
                      points={flat(p.sommets)}
                      closed
                      fill={jetons.muted}
                      stroke={active ? jetons.accent : jetons.primary}
                      strokeWidth={active ? 4 : 2}
                      onClick={() => mode === "selection" && onChoisir(p.id)}
                      onTap={() => mode === "selection" && onChoisir(p.id)}
                    />
                    <Text
                      text={`${p.nom}\n${formaterSurface(aireMm2(p.sommets) / 1_000_000)}`}
                      x={centre.x * echelle - 70}
                      y={centre.y * echelle - 16}
                      width={140}
                      align="center"
                      fontSize={13}
                      fontFamily={jetons.fontUi}
                      fontStyle="bold"
                      fill={jetons.primary}
                      listening={false}
                    />
                    {p.sommets.map((a, i) => {
                      const b = p.sommets[(i + 1) % p.sommets.length];
                      const dx = b.x - a.x;
                      const dy = b.y - a.y;
                      const longueur = Math.hypot(dx, dy);
                      if (longueur === 0) return null;
                      // normale vers l'extérieur du contour
                      const nx = (dy / longueur) * signe;
                      const ny = (-dx / longueur) * signe;
                      const mx = ((a.x + b.x) / 2) * echelle + nx * 18;
                      const my = ((a.y + b.y) / 2) * echelle + ny * 18;
                      const modifiable = active && mode === "selection";
                      return (
                        <Group key={`c${p.id}-${i}`}>
                          {modifiable ? (
                            // Zone de toucher de 80 × 48 px autour de la cote : la toucher ouvre la saisie de la longueur.
                            <Rect
                              x={mx - 40}
                              y={my - 24}
                              width={80}
                              height={48}
                              fill="transparent"
                              onClick={() => ouvrirCote(i)}
                              onTap={() => ouvrirCote(i)}
                              onMouseEnter={(e) => { e.target.getStage().container().style.cursor = "pointer"; }}
                              onMouseLeave={(e) => { e.target.getStage().container().style.cursor = "default"; }}
                            />
                          ) : null}
                          <Text
                            text={formaterLongueurMm(longueur)}
                            x={mx - 40}
                            y={my - 7}
                            width={80}
                            align="center"
                            fontSize={modifiable ? 13 : 12}
                            fontFamily={jetons.fontMono}
                            fontStyle={modifiable ? "bold" : "normal"}
                            textDecoration={modifiable ? "underline" : ""}
                            fill={active ? jetons.text : jetons.textMuted}
                            listening={false}
                          />
                        </Group>
                      );
                    })}
                    {p.ouvertures.map((o) => {
                      const a = p.sommets[o.murIndex];
                      const b = p.sommets[(o.murIndex + 1) % p.sommets.length];
                      if (!a || !b) return null;
                      const longueur = Math.hypot(b.x - a.x, b.y - a.y);
                      if (longueur === 0) return null;
                      const ux = (b.x - a.x) / longueur;
                      const uy = (b.y - a.y) / longueur;
                      const debut = { x: a.x + ux * o.positionMm, y: a.y + uy * o.positionMm };
                      const fin = { x: a.x + ux * (o.positionMm + o.largeurMm), y: a.y + uy * (o.positionMm + o.largeurMm) };
                      return (
                        <Fragment key={`ouv-${o.id}`}>
                          <Line
                            points={[...px(debut), ...px(fin)]}
                            stroke={o.type === "porte" ? jetons.corporate : jetons.surface}
                            strokeWidth={9}
                            lineCap="butt"
                            listening={false}
                          />
                          <Line
                            points={[...px(debut), ...px(fin)]}
                            stroke={o.type === "porte" ? jetons.surface : jetons.primary}
                            strokeWidth={o.type === "porte" ? 3 : 1}
                            dash={o.type === "porte" ? [6, 4] : undefined}
                            lineCap="butt"
                            listening={false}
                          />
                        </Fragment>
                      );
                    })}
                  </Fragment>
                );
              })}

            {jetons && piece && mode === "selection" && (
              <>
                {piece.sommets.map((a, i) => {
                  const b = piece.sommets[(i + 1) % piece.sommets.length];
                  return (
                    <Line
                      key={`mur${i}`}
                      points={[...px(a), ...px(b)]}
                      stroke="transparent"
                      strokeWidth={18}
                      onDblClick={() => ajouterSommet(i)}
                      onDblTap={() => ajouterSommet(i)}
                    />
                  );
                })}
                {piece.ouvertures.map((o) => {
                  const a = piece.sommets[o.murIndex];
                  const b = piece.sommets[(o.murIndex + 1) % piece.sommets.length];
                  if (!a || !b) return null;
                  const longueur = Math.hypot(b.x - a.x, b.y - a.y);
                  if (longueur === 0) return null;
                  const milieu = centreOuverture(piece, o);
                  return (
                    <Fragment key={o.id}>
                      <Circle
                        x={milieu.x * echelle}
                        y={milieu.y * echelle}
                        radius={11}
                        fill={jetons.surface}
                        stroke={jetons.primary}
                        strokeWidth={2}
                        draggable
                        onDragStart={(e) => (e.cancelBubble = true)}
                        onDragMove={(e) => glisserOuverture(o, e)}
                        onDragEnd={(e) => {
                          e.cancelBubble = true;
                          finGlissement();
                        }}
                      />
                      <Text
                        text={o.type === "porte" ? "P" : "F"}
                        x={milieu.x * echelle - 11}
                        y={milieu.y * echelle - 6}
                        width={22}
                        align="center"
                        fontSize={12}
                        fontStyle="bold"
                        fontFamily={jetons.fontUi}
                        fill={jetons.primary}
                        listening={false}
                      />
                    </Fragment>
                  );
                })}
                {piece.sommets.map((s, i) => (
                  <Circle
                    key={`s${i}-${piece.sommets.length}`}
                    x={s.x * echelle}
                    y={s.y * echelle}
                    radius={RAYON_SOMMET}
                    fill={jetons.surface}
                    stroke={jetons.primary}
                    strokeWidth={2.5}
                    draggable
                    onDragStart={(e) => (e.cancelBubble = true)}
                    onDragMove={(e) => glisserSommet(i, e)}
                    onDragEnd={(e) => {
                      e.cancelBubble = true;
                      finGlissement();
                    }}
                    onDblClick={() => retirerSommet(i)}
                    onDblTap={() => retirerSommet(i)}
                  />
                ))}
              </>
            )}

            {jetons && mode === "selection" && [
              ...(niveau.photos ?? []).map(p => ({ type: "photo", id: p.id, position: p, mobile: true })),
              ...(niveau.commentaires ?? []).map(c => ({ type: "commentaire", id: c.id, position: positionCommentaire(niveau, c), mobile: c.cible.type === "point" })),
            ].filter(r => r.position).map(r => <Group key={`${r.type}-${r.id}`} x={r.position.xMm * echelle} y={r.position.yMm * echelle}
              draggable={r.mobile}
              onClick={e => { e.cancelBubble = true; onSelectionTerrain({ type: r.type, id: r.id }); }}
              onTap={e => { e.cancelBubble = true; onSelectionTerrain({ type: r.type, id: r.id }); }}
              onDragStart={e => { e.cancelBubble = true; }}
              onDragEnd={e => { e.cancelBubble = true; onDeplacerRepere(r.type, r.id, { xMm: e.target.x() / echelle, yMm: e.target.y() / echelle }); }}>
              <Rect x={-24} y={-24} width={48} height={48} cornerRadius={8} fill={jetons.surface} stroke={jetons.primary} strokeWidth={2} />
              {r.type === "photo" ? <>
                <Rect x={-15} y={-10} width={30} height={22} cornerRadius={3} stroke={jetons.primary} strokeWidth={2} listening={false} />
                <Circle radius={6} stroke={jetons.primary} strokeWidth={2} listening={false} />
                <Line points={[-8, -10, -5, -15, 5, -15, 8, -10]} stroke={jetons.primary} strokeWidth={2} listening={false} />
              </> : <Line points={[-14, -12, 14, -12, 14, 8, 0, 8, -9, 16, -9, 8, -14, 8]} closed stroke={jetons.primary} strokeWidth={2} listening={false} />}
            </Group>)}

            {jetons && mode === "tracer" && (
              <>
                <Line
                  points={[...flat(trace), ...(curseur ? px(curseur) : [])]}
                  stroke={jetons.accent}
                  strokeWidth={3}
                  dash={[8, 5]}
                  listening={false}
                />
                {trace.map((p, i) => (
                  <Circle
                    key={`t${i}`}
                    x={p.x * echelle}
                    y={p.y * echelle}
                    radius={i === 0 && trace.length >= 3 ? 11 : 6}
                    fill={i === 0 ? jetons.accent : jetons.primary}
                    stroke={jetons.primary}
                    strokeWidth={2}
                    listening={false}
                  />
                ))}
              </>
            )}
          </Layer>
        </Stage>
      </div>

      <div className="liste-encadres" style={{ padding: 12 }}>
        {message ? (
          <Encadre type="alerte" titre="Action impossible">
            {message}
          </Encadre>
        ) : mode === "tracer" ? (
          <Encadre titre="Tracé en cours">
            Touchez ou cliquez chaque angle de la pièce. Touchez le premier point (orange) ou « Fermer le contour » pour terminer ; Échap abandonne.
          </Encadre>
        ) : (
          <Encadre titre="Modifier le plan">
            Touchez une cote soulignée pour saisir la longueur du mur ; glissez un sommet pour déplacer un mur ; double-cliquez (ou double-touchez) un mur pour ajouter un sommet, un sommet pour le retirer ; glissez le rond P ou F pour déplacer une ouverture.
          </Encadre>
        )}
      </div>

      {editionCote && piece ? (
        <Dialogue titre={`Longueur du mur ${editionCote.murIndex + 1}`} sansFermer onFermer={() => setEditionCote(null)}>
          <form onSubmit={validerCote} className="terrain">
            <label className="champ">
              Longueur mesurée (m)
              <input
                className="champ__saisie mono"
                inputMode="decimal"
                autoFocus
                value={editionCote.texte}
                onChange={(e) => setEditionCote({ ...editionCote, texte: e.target.value, erreur: null })}
                aria-invalid={editionCote.erreur ? "true" : undefined}
              />
            </label>
            {editionCote.erreur ? (
              <Encadre type="alerte" titre="Longueur refusée">{editionCote.erreur}</Encadre>
            ) : null}
            <button type="submit" className="bouton">Valider</button>
            <button type="button" className="bouton bouton--secondaire" onClick={() => setEditionCote(null)}>Annuler</button>
          </form>
        </Dialogue>
      ) : null}
    </section>
  );
}

