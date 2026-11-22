import React from 'react';
import { ArrowRight } from 'lucide-react';
import { HABITOLOGIE_PROTOCOL_STAGES, TERRAIN_PROTOCOL_STAGE, visitProtocolStages, protocolStageNumber,
  isHabitologieStageEnabled, setHabitologieStageEnabled } from './habitologieProtocol.js';

export default function VisitGuide({ report, setReport }) {
  const terrain = visitProtocolStages(report).some(stage => stage.key === 'terrain');
  const toggle = stage => <button type="button" className={`phase-toggle${stage.key === 'terrain' ? ' terrain-toggle' : ''}`}
    aria-label={`${stage.key === 'terrain' ? 'Bloc' : 'Phase'} ${protocolStageNumber(stage)} ${stage.label}`}
    aria-pressed={isHabitologieStageEnabled(report, stage.key)}
    onClick={() => setReport(previous => setHabitologieStageEnabled(previous, stage.key, !isHabitologieStageEnabled(previous, stage.key)))}>
    <span aria-hidden="true">{protocolStageNumber(stage)}</span><strong>{stage.label}<small>{isHabitologieStageEnabled(report, stage.key) ? 'Retenue' : 'Non retenue'}</small></strong>
  </button>;
  return <div className="analysis-sequence" aria-label="Ordre de l'analyse globale">
    <div><strong>Fil conducteur de l'analyse</strong><small>Cliquer sur le numéro ou le nom pour retenir les points de la visite. Faites défiler horizontalement si nécessaire.</small></div>
    <div className="visit-guide-scroll" tabIndex={0} aria-label="Fil conducteur horizontal Terrain et Bâti">
      <div className={`visit-guide-track${terrain ? ' visit-guide-terrain' : ''}`}>
        {terrain && <>{toggle(TERRAIN_PROTOCOL_STAGE)}<ArrowRight size={18} aria-hidden="true" /></>}
        <div className="visit-guide-bati"><strong>Le bâti sur ce terrain</strong><ol>
          {HABITOLOGIE_PROTOCOL_STAGES.map((stage, index) => <li key={stage.key}>{toggle(stage)}
            {index < 3 && <ArrowRight size={16} aria-hidden="true" />}</li>)}
        </ol></div>
      </div>
    </div>
  </div>;
}
