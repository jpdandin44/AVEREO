import React from 'react';
import { createRoot } from 'react-dom/client';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import App from './App.jsx';
import './styles.css';

// Même surface globale que le prototype, fournie ici par les modules npm.
window.Papa = Papa;
window.jspdf = { jsPDF };
window.html2canvas = html2canvas;
createRoot(document.getElementById('root')).render(<App />);
