// Calculs extraits du prototype historique, sans changement de logique.
export function calculateDevis(bien, tarifs, priceTier) {
if (!bien) return { lignes: [], total: 0, tierLabel: '' };

let totalGlobal = 0;
const tierLabel = priceTier === 'eco' ? 'Éco' : priceTier === 'premium' ? 'Premium' : 'Standard';

const lignesParPiece = bien.dossier.pieces.map(piece => {
    let totalPiece = 0;
    const interventionsDetail = (piece.interventions || []).map(intervention => {
        const tarif = tarifs[intervention.tarifId];
        if (!tarif) return null;

        let prix;
        switch(priceTier) {
            case 'eco': prix = tarif.prix_eco; break;
            case 'premium': prix = tarif.prix_premium; break;
            default: prix = tarif.prix_std;
        }

        let cout = 0;
        switch (tarif.unite) {
            case 'm²': cout = prix * piece.surface; break;
            case 'unité': cout = prix * intervention.quantite; break;
            case 'forfait': cout = prix; break;
            default: cout = 0;
        }
        totalPiece += cout;
        return { id: `${piece.id}-${tarif.id}`, nom: tarif.nom, quantite: intervention.quantite, unite: tarif.unite, surface: piece.surface, cout: cout.toFixed(2) };
    }).filter(Boolean);

    totalGlobal += totalPiece;
    return { pieceId: piece.id, nomPiece: piece.nom, interventions: interventionsDetail, totalPiece: totalPiece.toFixed(2) };
});

return { lignes: lignesParPiece, total: totalGlobal.toFixed(2), tierLabel };
}

export function calculateDevisForPdf(bien, tarifs) {
if (!bien) return null;

let totalEco = 0;
let totalStd = 0;
let totalPremium = 0;

const lignes = bien.dossier.pieces.flatMap(piece => {
    return (piece.interventions || []).map(intervention => {
        const tarif = tarifs[intervention.tarifId];
        if (!tarif) return null;

        const calculateCost = (prix) => {
            switch (tarif.unite) {
                case 'm²': return prix * piece.surface;
                case 'unité': return prix * intervention.quantite;
                case 'forfait': return prix;
                default: return 0;
            }
        };

        totalEco += calculateCost(tarif.prix_eco);
        totalStd += calculateCost(tarif.prix_std);
        totalPremium += calculateCost(tarif.prix_premium);

        return {
            id: `${piece.id}-${tarif.id}`,
            nom: tarif.nom,
            pieceNom: piece.nom,
            quantite: intervention.quantite,
            unite: tarif.unite,
            cout: calculateCost(tarif.prix_std).toFixed(2)
        };
    }).filter(Boolean);
});

const lignesParPiece = bien.dossier.pieces.map(p => ({
    pieceId: p.id,
    nomPiece: p.nom,
    interventions: lignes.filter(l => l.pieceNom === p.nom)
})).filter(p => p.interventions.length > 0);


return {
    lignes: lignesParPiece,
    total_eco: totalEco.toFixed(2),
    total_std: totalStd.toFixed(2),
    total_premium: totalPremium.toFixed(2)
};
}
