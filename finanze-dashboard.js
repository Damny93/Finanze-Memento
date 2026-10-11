// ============================================================
// FINANZE
// DASHBOARD V2
// CENTRO GESTIONE
// FILE ESTERNO
// VERSIONE 0.12-B
//
// BASE:
// v0.12-A VALIDATA
//
// MODIFICA ATOMICA:
// utility comuni delegate a FinanzeCore.
//
// DIPENDENZE:
// - moment.min.js
// - finanze-motore.js
// - finanze-core.js
//
// ============================================================

function renderCentroGestioneFinanze() {

    if (
        typeof FinanzeCore ==
        "undefined"
    ) {
        return ui()
            .text(
                "⛔ ERRORE\n\n" +
                "finanze-core.js non è disponibile."
            );
    }

    var arrotonda2 =
        FinanzeCore.arrotonda2;

    var numero =
        FinanzeCore.numero;

    var dueCifre =
        FinanzeCore.dueCifre;