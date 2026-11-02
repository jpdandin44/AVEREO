import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Mic } from 'lucide-react';
import { appendDictation } from './dictationText.js';

export const DICTATION_CONSENT_REASON = "Enregistrer d'abord l'accord du client dans l'etape Dossier.";

function useSpeechRecognition(lang = 'fr-FR', onFinalText, enabled = true) {
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef(null);
  const onFinalTextRef = useRef(onFinalText);
  const isSupported =
    typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    onFinalTextRef.current = onFinalText;
  }, [onFinalText]);

  useEffect(() => {
    if (!isSupported || !enabled) { setIsListening(false); return undefined; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onstart = () => {
      setSpeechError('');
      setIsListening(true);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      setIsListening(false);
      const messages = {
        'audio-capture': "Aucun microphone utilisable n'a ete detecte.",
        network: 'Le service de dictee est indisponible dans ce navigateur. Essayez Chrome, Edge ou Windows + H.',
        'no-speech': "Aucune parole n'a ete detectee. Rapprochez-vous du microphone et recommencez.",
        'not-allowed': "Autorisez l'acces au microphone dans les reglages du navigateur, puis rechargez la page.",
        'service-not-allowed': 'La dictee vocale est bloquee par ce navigateur. Essayez Chrome, Edge ou Windows + H.',
      };
      if (event.error !== 'aborted') {
        setSpeechError(messages[event.error] || `Dictee interrompue (${event.error || 'erreur inconnue'}).`);
      }
    };
    recognition.onresult = (event) => {
      let transcript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) transcript += event.results[index][0].transcript;
      }
      if (transcript) onFinalTextRef.current(`${transcript} `);
    };
    recognitionRef.current = recognition;
    return () => {
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [isSupported, lang, enabled]);

  const toggle = useCallback(async () => {
    const target = recognitionRef.current;
    if (!target) return;
    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    setSpeechError('');
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        const denied = error?.name === 'NotAllowedError' || error?.name === 'SecurityError';
        setSpeechError(
          denied
            ? "Autorisez l'acces au microphone dans les reglages du navigateur, puis rechargez la page."
            : "Le microphone n'est pas disponible sur cet appareil.",
        );
        return;
      }
    }

    try {
      // The consent or component may have changed while microphone access was pending.
      if (recognitionRef.current !== target) return;
      target.start();
    } catch (error) {
      if (error?.name !== 'InvalidStateError') {
        setSpeechError('Impossible de demarrer la dictee vocale. Essayez Chrome, Edge ou Windows + H.');
      }
    }
  }, [isListening]);

  return { isListening, isSupported, speechError, toggle };
}

export function MicButton({ disabled = false, disabledReason = '', onFinalText, title = 'Dicter', showAvailabilityHint = true }) {
  const { isListening, isSupported, speechError, toggle } = useSpeechRecognition('fr-FR', onFinalText, !disabled);
  const unavailableMessage = 'Dictee non disponible dans ce navigateur. Utilisez Chrome, Edge ou Windows + H.';
  const buttonTitle = disabled ? disabledReason : isSupported ? title : unavailableMessage;
  return (
    <>
      <button
        className={`icon-button ${isListening ? 'danger active' : ''}`}
        type="button"
        title={buttonTitle}
        aria-label={isListening ? 'Arreter la dictee' : title}
        aria-pressed={isListening}
        onClick={toggle}
        disabled={disabled || !isSupported}
      >
        <Mic size={18} />
      </button>
      {(speechError || (!isSupported && showAvailabilityHint) || isListening) && (
        <span className={`mic-status ${speechError || !isSupported ? 'error' : 'listening'}`} role="status">
          {speechError || (!isSupported ? unavailableMessage : 'Ecoute en cours...')}
        </span>
      )}
    </>
  );
}

// Shared by the decision fields, delivery notes and signatory name.
export default function VoiceField({ label, value, onChange, onAppend, rows = 2, maxLength,
  multiline = true, micDisabled = true, micDisabledReason = DICTATION_CONSENT_REASON }) {
  const id = useId();
  const props = { id, value: value || '', maxLength, onChange: event => onChange(event.target.value) };
  return <div className="field voice-field">
    <label htmlFor={id}>{label}</label>
    <div className="input-with-action">
      {multiline ? <textarea {...props} rows={rows} /> : <input {...props} />}
      <MicButton disabled={micDisabled} disabledReason={micDisabledReason} title={`Dicter ${label}`}
        showAvailabilityHint={false}
        onFinalText={onAppend || (text => onChange(current => appendDictation(current, text, maxLength)))} />
    </div>
  </div>;
}
